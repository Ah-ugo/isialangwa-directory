import Person from '../models/Person.js';
import Ward from '../models/Ward.js';
import PollingUnit from '../models/PollingUnit.js';
import { asyncHandler, escapeRegex, ok } from '../utils/helpers.js';
import { can } from '../config/permissions.js';

export const globalSearch = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return ok(res, { data: { people: [], wards: [], pollingUnits: [] } });
  const rx = new RegExp(escapeRegex(q), 'i');
  const digits = q.replace(/\D/g, '');
  const out = { people: [], wards: [], pollingUnits: [] };
  const jobs = [];
  if (can(req.user, 'people.view')) {
    const or = [{ fullName: rx }];
    if (digits.length >= 3 && can(req.user, 'people.viewPhone')) or.push({ normalizedPhone: new RegExp(escapeRegex(digits.replace(/^(234|0)/, ''))) });
    jobs.push(Person.find({ $or: or }).limit(6).populate('wardId', 'name').populate('pollingUnitId', 'name').select('fullName wardId pollingUnitId normalizedPhone').lean()
      .then((r) => { out.people = r.map((p) => ({ id: p._id, fullName: p.fullName, ward: p.wardId?.name, pollingUnit: p.pollingUnitId?.name, ...(can(req.user, 'people.viewPhone') ? { phone: p.normalizedPhone } : {}) })); }));
  }
  if (can(req.user, 'wards.view')) jobs.push(Ward.find({ $or: [{ name: rx }, { code: rx }] }).limit(5).lean().then((r) => { out.wards = r.map((w) => ({ id: w._id, name: w.name, code: w.code })); }));
  if (can(req.user, 'pollingUnits.view')) jobs.push(PollingUnit.find({ $or: [{ name: rx }, { code: rx }] }).limit(5).populate('wardId', 'name').lean().then((r) => { out.pollingUnits = r.map((u) => ({ id: u._id, name: u.name, code: u.code, wardId: u.wardId?._id, ward: u.wardId?.name })); }));
  await Promise.all(jobs);
  ok(res, { data: out });
});
