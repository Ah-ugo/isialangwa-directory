import Person from '../models/Person.js';
import Ward from '../models/Ward.js';
import PollingUnit from '../models/PollingUnit.js';
import { asyncHandler, ok } from '../utils/helpers.js';
import { can } from '../config/permissions.js';
import { wardCounts } from '../services/counts.js';
import { serializePerson } from './people.controller.js';

export const stats = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 7 * 864e5);
  const d = {};
  const jobs = [];
  if (can(req.user, 'people.view')) jobs.push(Promise.all([Person.countDocuments(), Person.countDocuments({ createdAt: { $gte: since } })]).then(([a, b]) => { d.totalPeople = a; d.recentRegistrations = b; }));
  if (can(req.user, 'wards.view')) jobs.push(Ward.countDocuments().then((n) => { d.totalWards = n; }));
  if (can(req.user, 'pollingUnits.view')) jobs.push(PollingUnit.countDocuments().then((n) => { d.totalPollingUnits = n; }));
  await Promise.all(jobs);
  ok(res, { data: d });
});

export const recentPeople = asyncHandler(async (req, res) => {
  const rows = await Person.find().sort({ createdAt: -1 }).limit(8).populate('wardId', 'name code').populate('pollingUnitId', 'name code').lean();
  ok(res, { data: rows.map((p) => serializePerson(p, req.user)) });
});

export const wardSummary = asyncHandler(async (req, res) => {
  const wards = await Ward.find().collation({ locale: 'en', strength: 2 }).sort({ name: 1 }).lean();
  const c = await wardCounts(wards.map((w) => w._id));
  ok(res, { data: wards.map((w) => ({ id: w._id, name: w.name, code: w.code, pollingUnitCount: c.units.get(String(w._id)) || 0, peopleCount: c.people.get(String(w._id)) || 0 })) });
});
