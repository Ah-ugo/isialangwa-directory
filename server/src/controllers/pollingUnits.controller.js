import { z } from 'zod';
import Ward from '../models/Ward.js';
import PollingUnit from '../models/PollingUnit.js';
import Person from '../models/Person.js';
import {
  ApiError,
  asyncHandler,
  escapeRegex,
  ok,
  paging,
  pageMeta,
} from '../utils/helpers.js';
import { unitSchema, unitBulkSchema, objectId } from '../validators/index.js';
import { unitPeopleCounts } from '../services/counts.js';
import { logActivity } from '../services/activity.js';

const ci = { locale: 'en', strength: 2, numericOrdering: true };
const shape = (u, pc, ward) => ({
  id: u._id,
  name: u.name,
  code: u.code,
  description: u.description,
  wardId: u.wardId?._id || u.wardId,
  ward:
    ward ||
    (u.wardId?.name ? { id: u.wardId._id, name: u.wardId.name } : undefined),
  createdAt: u.createdAt,
  peopleCount: pc.get(String(u._id)) || 0,
});
const clean = (b) => ({
  name: b.name,
  wardId: b.wardId,
  code: b.code || undefined,
  description: b.description || undefined,
});

export const list = asyncHandler(async (req, res) => {
  const { q, wardId, sort = 'code', all } = req.query;
  const f = {};
  if (wardId) f.wardId = objectId.parse(wardId);
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    f.$or = [{ name: rx }, { code: rx }];
  }
  const order =
    sort === 'createdAt'
      ? { createdAt: -1 }
      : sort === 'name'
        ? { name: 1 }
        : { code: 1, name: 1 };
  const base = PollingUnit.find(f)
    .collation(ci)
    .sort(order)
    .populate('wardId', 'name');
  if (all === 'true') {
    const units = await base.limit(1000).lean();
    return ok(res, { data: units.map((u) => shape(u, new Map())) });
  }
  const { page, limit, skip } = paging(req.query, 20);
  const [units, total] = await Promise.all([
    base.skip(skip).limit(limit).lean(),
    PollingUnit.countDocuments(f),
  ]);
  const pc = await unitPeopleCounts(units.map((u) => u._id));
  ok(res, {
    data: units.map((u) => shape(u, pc)),
    meta: pageMeta(page, limit, total),
  });
});

export const create = asyncHandler(async (req, res) => {
  const body = clean(unitSchema.parse(req.body));
  if (!(await Ward.exists({ _id: body.wardId })))
    throw new ApiError(400, 'The selected ward does not exist');
  const u = await PollingUnit.create(body);
  await logActivity(req, {
    action: 'polling_unit.created',
    resourceType: 'polling_unit',
    resourceId: u._id,
    description: `Created polling unit ${u.name}`,
  });
  ok(res, { data: shape(u, new Map()) }, 201);
});

export const getOne = asyncHandler(async (req, res) => {
  const u = await PollingUnit.findById(req.params.id)
    .populate('wardId', 'name')
    .lean();
  if (!u) throw new ApiError(404, 'Polling unit not found');
  ok(res, { data: shape(u, await unitPeopleCounts([u._id])) });
});

export const update = asyncHandler(async (req, res) => {
  const body = clean(unitSchema.parse(req.body));
  const u = await PollingUnit.findById(req.params.id);
  if (!u) throw new ApiError(404, 'Polling unit not found');
  if (!(await Ward.exists({ _id: body.wardId })))
    throw new ApiError(400, 'The selected ward does not exist');
  const moved = String(u.wardId) !== String(body.wardId);
  Object.assign(u, body);
  if (!body.code) u.code = undefined;
  if (!body.description) u.description = undefined;
  await u.save();
  if (moved)
    await Person.updateMany({ pollingUnitId: u._id }, { wardId: u.wardId }); // keep person → ward in sync
  await logActivity(req, {
    action: 'polling_unit.updated',
    resourceType: 'polling_unit',
    resourceId: u._id,
    description: `Updated polling unit ${u.name}`,
    metadata: { movedWard: moved },
  });
  ok(res, { data: shape(u, await unitPeopleCounts([u._id])) });
});

export const remove = asyncHandler(async (req, res) => {
  const u = await PollingUnit.findById(req.params.id);
  if (!u) throw new ApiError(404, 'Polling unit not found');
  const n = await Person.countDocuments({ pollingUnitId: u._id });
  if (n)
    throw new ApiError(
      409,
      `This polling unit still has ${n} contact(s). Reassign them to another unit before deleting.`,
      { code: 'HAS_PEOPLE', peopleCount: n },
    );
  await u.deleteOne();
  await logActivity(req, {
    action: 'polling_unit.deleted',
    resourceType: 'polling_unit',
    resourceId: u._id,
    description: `Deleted polling unit ${u.name}`,
  });
  ok(res, { message: 'Polling unit deleted' });
});

export const reassignPeople = asyncHandler(async (req, res) => {
  const { targetPollingUnitId } = z
    .object({ targetPollingUnitId: objectId })
    .parse(req.body);
  const [from, to] = await Promise.all([
    PollingUnit.findById(req.params.id),
    PollingUnit.findById(targetPollingUnitId),
  ]);
  if (!from || !to) throw new ApiError(404, 'Polling unit not found');
  if (String(from._id) === String(to._id))
    throw new ApiError(400, 'Choose a different polling unit');
  const r = await Person.updateMany(
    { pollingUnitId: from._id },
    { pollingUnitId: to._id, wardId: to.wardId },
  );
  await logActivity(req, {
    action: 'polling_unit.people_reassigned',
    resourceType: 'polling_unit',
    resourceId: from._id,
    description: `Moved ${r.modifiedCount} contact(s) from ${from.name} to ${to.name}`,
    metadata: { count: r.modifiedCount, to: to._id },
  });
  ok(res, {
    message: `Moved ${r.modifiedCount} contact(s)`,
    moved: r.modifiedCount,
  });
});

export const bulk = asyncHandler(async (req, res) => {
  const { wardId, items, dryRun } = unitBulkSchema.parse(req.body);
  const ward = await Ward.findById(wardId).lean();
  if (!ward) throw new ApiError(400, 'The selected ward does not exist');
  const existing = await PollingUnit.find({ wardId }).lean();
  const names = new Set(existing.map((u) => u.name.toLowerCase()));
  const codes = new Set(
    existing.filter((u) => u.code).map((u) => u.code.toLowerCase()),
  );
  const rows = items
    .filter((i) => i.name)
    .map((i, idx) => {
      const name = i.name.trim(),
        code = (i.code || '').trim() || undefined;
      const messages = [];
      if (names.has(name.toLowerCase()))
        messages.push(
          'Name already exists in this ward or earlier in the list',
        );
      if (code && codes.has(code.toLowerCase()))
        messages.push(
          'Code already exists in this ward or earlier in the list',
        );
      if (!messages.length) {
        names.add(name.toLowerCase());
        if (code) codes.add(code.toLowerCase());
      }
      return {
        line: idx + 1,
        name,
        code,
        status: messages.length ? 'duplicate' : 'valid',
        messages,
      };
    });
  const valid = rows.filter((r) => r.status === 'valid');
  if (dryRun)
    return ok(res, {
      data: {
        rows,
        validCount: valid.length,
        duplicateCount: rows.length - valid.length,
      },
    });
  if (!valid.length) throw new ApiError(400, 'No new polling units to create');
  const created = await PollingUnit.insertMany(
    valid.map((r) => ({ name: r.name, code: r.code, wardId })),
  );
  await logActivity(req, {
    action: 'polling_unit.bulk_created',
    resourceType: 'ward',
    resourceId: ward._id,
    description: `Created ${created.length} polling units in ${ward.name}`,
    metadata: { count: created.length, skipped: rows.length - created.length },
  });
  ok(
    res,
    {
      data: { created: created.length, skipped: rows.length - created.length },
    },
    201,
  );
});
