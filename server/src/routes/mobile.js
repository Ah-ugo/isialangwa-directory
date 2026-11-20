/**
 * Mobile API routes — /api/mobile/*
 *
 * These routes use Bearer-token auth (not cookies) so they work from native
 * mobile apps that cannot reliably handle httpOnly cookies or CSRF.
 *
 * Mounted BEFORE the originCheck middleware in app.js.
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { mobileAuthenticate } from '../middleware/mobileAuth.js';
import { loginLimiter } from '../middleware/security.js';
import User from '../models/User.js';
import Person from '../models/Person.js';
import Ward from '../models/Ward.js';
import PollingUnit from '../models/PollingUnit.js';
import { serializePerson } from '../controllers/people.controller.js';
import { serializeUser } from '../utils/session.js';
import {
  ApiError,
  asyncHandler,
  ok,
  paging,
  pageMeta,
} from '../utils/helpers.js';
import { normalizePhone } from '../utils/phone.js';
import { personCreateSchema } from '../validators/index.js';
import { logActivity } from '../services/activity.js';
import { getSettings } from '../services/settings.js';

const r = Router();

const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-password', 12);
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

const POP = [
  { path: 'wardId', select: 'name code' },
  { path: 'pollingUnitId', select: 'name code' },
];

// ---------------------------------------------------------------------------
// POST /api/mobile/auth/login
// Returns a JWT Bearer token (not a cookie) for use in mobile apps.
// ---------------------------------------------------------------------------
r.post(
  '/auth/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body ?? {};
    if (!identifier || !password) throw new ApiError(400, 'identifier and password are required');

    const id = String(identifier).toLowerCase().trim();
    const user = await User.findOne({ $or: [{ username: id }, { email: id }] }).select('+passwordHash');

    const bad = new ApiError(401, 'Incorrect username or password');
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      throw bad;
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new ApiError(429, 'Too many failed attempts. Try again in a few minutes.');
    }

    if (!(await bcrypt.compare(password, user.passwordHash))) {
      user.failedLogins += 1;
      if (user.failedLogins >= MAX_FAILS) {
        user.failedLogins = 0;
        user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60000);
      }
      await user.save();
      throw bad;
    }

    if (user.status !== 'active') {
      throw new ApiError(403, 'This account has been deactivated. Contact the Super Admin.');
    }

    user.failedLogins = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    const settings = await getSettings();
    const expiresIn = `${settings.sessionExpiryHours ?? 8}h`;
    const token = jwt.sign(
      { sub: String(user._id), tv: user.tokenVersion },
      env.SESSION_SECRET,
      { expiresIn },
    );

    await logActivity(req, {
      adminId: user._id,
      action: 'auth.login',
      resourceType: 'user',
      resourceId: user._id,
      description: `${user.fullName} signed in via mobile`,
    });

    ok(res, { data: { token, expiresIn, user: serializeUser(user) } });
  }),
);

// ---------------------------------------------------------------------------
// GET /api/mobile/sync
// Delta sync: return wards, polling units, and people.
// Query params:
//   since   — ISO date string; if omitted returns everything
//   wardId  — optional ward filter
//   all     — boolean; if true returns all people (up to 2000)
//   page    — pagination (default 1)
//   limit   — pagination (default 200, max 2000)
// ---------------------------------------------------------------------------
r.get(
  '/sync',
  mobileAuthenticate,
  asyncHandler(async (req, res) => {
    const { since, wardId, all } = req.query;

    const sinceDate = since && !isNaN(new Date(since)) ? new Date(since) : null;

    const timeFilter = sinceDate ? { updatedAt: { $gte: sinceDate } } : {};
    const wardFilter = wardId ? { wardId } : {};

    const [wards, pollingUnits] = await Promise.all([
      Ward.find({ ...timeFilter }).sort({ code: 1, name: 1 }).lean(),
      PollingUnit.find({ ...timeFilter, ...wardFilter }).sort({ code: 1, name: 1 }).lean(),
    ]);

    const personFilter = { ...timeFilter, ...wardFilter };
    let people = [];
    let meta = {};

    if (all === 'true' || !sinceDate) {
      people = await Person.find(personFilter)
        .sort({ updatedAt: -1 })
        .limit(2000)
        .populate(POP)
        .lean();
      const total = people.length;
      meta = { page: 1, limit: total, total, pages: 1 };
    } else {
      const { page, limit, skip } = paging(req.query, 200, 2000);
      const [pList, total] = await Promise.all([
        Person.find(personFilter)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate(POP)
          .lean(),
        Person.countDocuments(personFilter),
      ]);
      people = pList;
      meta = pageMeta(page, limit, total);
    }

    ok(res, {
      data: {
        wards: wards.map((w) => ({
          id: w._id,
          name: w.name,
          code: w.code,
          description: w.description,
          updatedAt: w.updatedAt,
        })),
        pollingUnits: pollingUnits.map((u) => ({
          id: u._id,
          name: u.name,
          code: u.code,
          wardId: u.wardId,
          description: u.description,
          updatedAt: u.updatedAt,
        })),
        people: people.map((p) => serializePerson(p, req.user)),
        meta,
        syncedAt: new Date().toISOString(),
      },
    });
  }),
);

// ---------------------------------------------------------------------------
// POST /api/mobile/wards
// Create a ward via mobile
// ---------------------------------------------------------------------------
r.post(
  '/wards',
  mobileAuthenticate,
  asyncHandler(async (req, res) => {
    const { name, code, description } = req.body || {};
    if (!name || !name.trim()) throw new ApiError(400, 'Ward name is required');
    const ward = await Ward.create({
      name: name.trim(),
      code: code ? code.trim() : undefined,
      description: description ? description.trim() : undefined,
    });
    await logActivity(req, {
      adminId: req.user._id,
      action: 'ward.created',
      resourceType: 'ward',
      resourceId: ward._id,
      description: `Created ward ${ward.name} via mobile`,
    });
    ok(res, {
      data: {
        id: ward._id,
        name: ward.name,
        code: ward.code,
        description: ward.description,
        updatedAt: ward.updatedAt,
      },
    }, 201);
  }),
);

// ---------------------------------------------------------------------------
// POST /api/mobile/polling-units
// Create a polling unit via mobile
// ---------------------------------------------------------------------------
r.post(
  '/polling-units',
  mobileAuthenticate,
  asyncHandler(async (req, res) => {
    const { name, code, wardId, description } = req.body || {};
    if (!name || !name.trim()) throw new ApiError(400, 'Polling unit name is required');
    if (!wardId) throw new ApiError(400, 'Parent ward is required');
    if (!(await Ward.exists({ _id: wardId }))) throw new ApiError(400, 'Selected ward does not exist');

    const pu = await PollingUnit.create({
      name: name.trim(),
      code: code ? code.trim() : undefined,
      wardId,
      description: description ? description.trim() : undefined,
    });
    await logActivity(req, {
      adminId: req.user._id,
      action: 'pollingUnit.created',
      resourceType: 'pollingUnit',
      resourceId: pu._id,
      description: `Created polling unit ${pu.name} via mobile`,
    });
    ok(res, {
      data: {
        id: pu._id,
        name: pu.name,
        code: pu.code,
        wardId: pu.wardId,
        description: pu.description,
        updatedAt: pu.updatedAt,
      },
    }, 201);
  }),
);

// ---------------------------------------------------------------------------
// POST /api/mobile/people
// Create a person — same logic as /api/people but accepts Bearer token.
// ---------------------------------------------------------------------------
r.post(
  '/people',
  mobileAuthenticate,
  asyncHandler(async (req, res) => {
    const b = personCreateSchema.parse(req.body);
    const normalizedPhone = normalizePhone(b.phone);
    if (!normalizedPhone) {
      throw new ApiError(400, 'Enter a valid Nigerian phone number, e.g. 0803 123 4567');
    }

    // Validate consent
    if (b.consent.lawfulBasis === 'consent' && !b.consent.granted) {
      throw new ApiError(400, 'Consent must be confirmed before saving this contact');
    }
    if (b.consent.lawfulBasis === 'other' && !(b.consent.purpose || '').trim()) {
      throw new ApiError(400, 'State the purpose and lawful basis for processing');
    }

    // Validate ward ↔ polling unit relationship
    const unit = await PollingUnit.findById(b.pollingUnitId).lean();
    if (!unit || String(unit.wardId) !== String(b.wardId)) {
      throw new ApiError(400, 'The polling unit does not belong to the selected ward');
    }
    if (!(await Ward.exists({ _id: b.wardId }))) {
      throw new ApiError(400, 'The selected ward does not exist');
    }

    // Duplicate check
    if (!b.force) {
      const dup = await Person.find({ normalizedPhone })
        .limit(5)
        .populate('wardId', 'name')
        .populate('pollingUnitId', 'name')
        .lean();
      if (dup.length) {
        throw new ApiError(409, 'This phone number is already in the directory', {
          code: 'DUPLICATE_PHONE',
          duplicates: dup.map((d) => ({
            id: d._id,
            fullName: d.fullName,
            ward: d.wardId?.name,
            pollingUnit: d.pollingUnitId?.name,
          })),
        });
      }
    }

    const p = await Person.create({
      fullName: b.fullName,
      phone: normalizedPhone,
      normalizedPhone,
      wardId: b.wardId,
      pollingUnitId: b.pollingUnitId,
      address: b.address || undefined,
      preferredContact: b.preferredContact || undefined,
      notes: b.notes || undefined,
      image: b.image || undefined,
      imagePublicId: b.imagePublicId || undefined,
      voterCardNumber: b.voterCardNumber || undefined,
      voterCardImage: b.voterCardImage || undefined,
      voterCardPublicId: b.voterCardPublicId || undefined,
      consent: {
        granted: b.consent.granted,
        purpose: b.consent.purpose || undefined,
        lawfulBasis: b.consent.lawfulBasis,
        recordedAt: new Date(),
      },
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await logActivity(req, {
      action: 'person.created',
      resourceType: 'person',
      resourceId: p._id,
      description: `Registered ${p.fullName} via mobile`,
    });

    ok(
      res,
      { data: serializePerson(await Person.findById(p._id).populate(POP).lean(), req.user) },
      201,
    );
  }),
);

export default r;
