import Ward from '../models/Ward.js';
import PollingUnit from '../models/PollingUnit.js';
import Person from '../models/Person.js';
import { ApiError, asyncHandler, escapeRegex, ok } from '../utils/helpers.js';
import { wardSchema } from '../validators/index.js';
import { wardCounts, unitPeopleCounts } from '../services/counts.js';
import { logActivity } from '../services/activity.js';

const ci = { locale: 'en', strength: 2 };
const clean = (b) => ({ name: b.name, code: b.code || undefined, description: b.description || undefined });
const shape = (w, c) => ({ id: w._id, name: w.name, code: w.code, description: w.description, createdAt: w.createdAt, pollingUnitCount: c.units.get(String(w._id)) || 0, peopleCount: c.people.get(String(w._id)) || 0 });

export const list = asyncHandler(async (req, res) => {
  const { q, sort = 'name' } = req.query;
  const f = {};
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    f.$or = [{ name: rx }, { code: rx }];
  }
  const wards = await Ward.find(f).collation(ci).sort(sort === 'createdAt' ? { createdAt: -1 } : { name: 1 }).lean();
  const c = await wardCounts(wards.map((w) => w._id));
  let data = wards.map((w) => shape(w, c));
  if (sort === 'people') data.sort((a, b) => b.peopleCount - a.peopleCount);
  if (sort === 'units') data.sort((a, b) => b.pollingUnitCount - a.pollingUnitCount);
  ok(res, { data });
});

export const create = asyncHandler(async (req, res) => {
  const w = await Ward.create(clean(wardSchema.parse(req.body)));
  await logActivity(req, { action: 'ward.created', resourceType: 'ward', resourceId: w._id, description: `Created ward ${w.name}` });
  ok(res, { data: shape(w, { units: new Map(), people: new Map() }) }, 201);
});

export const getOne = asyncHandler(async (req, res) => {
  const w = await Ward.findById(req.params.id).lean();
  if (!w) throw new ApiError(404, 'Ward not found');
  const [units, c] = await Promise.all([PollingUnit.find({ wardId: w._id }).collation(ci).sort({ name: 1 }).lean(), wardCounts([w._id])]);
  const pc = await unitPeopleCounts(units.map((u) => u._id));
  ok(res, { data: { ...shape(w, c), pollingUnits: units.map((u) => ({ id: u._id, name: u.name, code: u.code, wardId: u.wardId, createdAt: u.createdAt, peopleCount: pc.get(String(u._id)) || 0 })) } });
});

export const update = asyncHandler(async (req, res) => {
  const body = clean(wardSchema.parse(req.body));
  const w = await Ward.findById(req.params.id);
  if (!w) throw new ApiError(404, 'Ward not found');
  w.name = body.name;
  w.code = body.code;
  w.description = body.description;
  await w.save(); // people & units reference by id, so renaming never breaks them
  await logActivity(req, { action: 'ward.updated', resourceType: 'ward', resourceId: w._id, description: `Updated ward ${w.name}` });
  const c = await wardCounts([w._id]);
  ok(res, { data: shape(w, c) });
});

export const remove = asyncHandler(async (req, res) => {
  const w = await Ward.findById(req.params.id);
  if (!w) throw new ApiError(404, 'Ward not found');
  const [units, people] = await Promise.all([PollingUnit.countDocuments({ wardId: w._id }), Person.countDocuments({ wardId: w._id })]);
  if (units || people) throw new ApiError(409, `This ward still has ${units} polling unit(s) and ${people} contact(s). Move or remove them first.`);
  await w.deleteOne();
  await logActivity(req, { action: 'ward.deleted', resourceType: 'ward', resourceId: w._id, description: `Deleted ward ${w.name}` });
  ok(res, { message: 'Ward deleted' });
});
