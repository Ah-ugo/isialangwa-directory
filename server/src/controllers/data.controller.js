import Person from '../models/Person.js';
import Ward from '../models/Ward.js';
import PollingUnit from '../models/PollingUnit.js';
import { ApiError, asyncHandler, csvCell, escapeRegex, ok } from '../utils/helpers.js';
import { normalizePhone } from '../utils/phone.js';
import { can } from '../config/permissions.js';
import { importSchema, objectId } from '../validators/index.js';
import { logActivity } from '../services/activity.js';

const key = (k) => String(k).toLowerCase().replace(/[^a-z]/g, '');
function pick(row, ...names) {
  const m = {};
  for (const [k, v] of Object.entries(row)) m[key(k)] = v;
  for (const n of names) {
    const v = m[key(n)];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

/** Validates every row from scratch – the server never trusts a client-side preview. */
async function analyse(rows) {
  const [wards, units] = await Promise.all([Ward.find().lean(), PollingUnit.find().lean()]);
  const wardBy = new Map();
  wards.forEach((w) => { wardBy.set(w.name.toLowerCase(), w); if (w.code) wardBy.set(w.code.toLowerCase(), w); });
  const unitBy = new Map();
  units.forEach((u) => { const k = String(u.wardId) + '|'; unitBy.set(k + u.name.toLowerCase(), u); if (u.code) unitBy.set(k + u.code.toLowerCase(), u); });

  const parsed = rows.map((r, i) => {
    const messages = [];
    const fullName = pick(r, 'Full Name', 'Name');
    const phone = pick(r, 'Phone Number', 'Phone');
    const wardName = pick(r, 'Ward');
    const unitName = pick(r, 'Polling Unit', 'PU');
    const pref = pick(r, 'Preferred Contact').toLowerCase();
    const consentRaw = pick(r, 'Consent Status', 'Consent').toLowerCase();
    if (fullName.length < 2) messages.push('Full name is required');
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) messages.push('Invalid Nigerian phone number');
    const ward = wardBy.get(wardName.toLowerCase());
    if (!wardName) messages.push('Ward is required'); else if (!ward) messages.push(`Ward "${wardName}" not found`);
    const unit = ward ? unitBy.get(String(ward._id) + '|' + unitName.toLowerCase()) : null;
    if (!unitName) messages.push('Polling unit is required'); else if (ward && !unit) messages.push(`Polling unit "${unitName}" not found in ${ward.name}`);
    if (pref && !['call', 'whatsapp'].includes(pref)) messages.push('Preferred contact must be Call or WhatsApp');
    if (!['granted', 'yes', 'true', 'y', '1'].includes(consentRaw)) messages.push('Consent must be recorded as Granted');
    return {
      row: i + 2, status: messages.length ? 'error' : 'valid', messages,
      data: { fullName, phone: normalizedPhone || phone, normalizedPhone, wardId: ward?._id, wardName: ward?.name || wardName, pollingUnitId: unit?._id, pollingUnitName: unit?.name || unitName, address: pick(r, 'Address'), preferredContact: pref || undefined },
    };
  });

  const phones = [...new Set(parsed.map((p) => p.data.normalizedPhone).filter(Boolean))];
  const existing = new Set((await Person.find({ normalizedPhone: { $in: phones } }).select('normalizedPhone').lean()).map((p) => p.normalizedPhone));
  const seen = new Set();
  for (const p of parsed) {
    if (p.status === 'error') continue;
    const n = p.data.normalizedPhone;
    if (existing.has(n)) { p.status = 'duplicate'; p.messages.push('Phone number already in the directory'); }
    else if (seen.has(n)) { p.status = 'duplicate'; p.messages.push('Phone number repeated in this file'); }
    seen.add(n);
  }
  return parsed;
}

const summarise = (rows) => ({ total: rows.length, valid: rows.filter((r) => r.status === 'valid').length, duplicates: rows.filter((r) => r.status === 'duplicate').length, errors: rows.filter((r) => r.status === 'error').length });

export const importPreview = asyncHandler(async (req, res) => {
  const { rows } = importSchema.parse(req.body);
  const analysed = await analyse(rows);
  // return problem rows first, capped, to keep the payload small
  const order = { error: 0, duplicate: 1, valid: 2 };
  const shown = [...analysed].sort((a, b) => order[a.status] - order[b.status] || a.row - b.row).slice(0, 300);
  ok(res, { data: { summary: summarise(analysed), rows: shown, truncated: analysed.length > shown.length } });
});

export const importCommit = asyncHandler(async (req, res) => {
  const { rows, includeDuplicates } = importSchema.parse(req.body);
  const analysed = await analyse(rows);
  const importable = analysed.filter((r) => r.status === 'valid' || (includeDuplicates && r.status === 'duplicate'));
  if (!importable.length) throw new ApiError(400, 'There are no valid rows to import');
  const now = new Date();
  const docs = importable.map(({ data: d }) => ({
    fullName: d.fullName, phone: d.normalizedPhone, normalizedPhone: d.normalizedPhone, wardId: d.wardId, pollingUnitId: d.pollingUnitId,
    address: d.address || undefined, preferredContact: d.preferredContact,
    consent: { granted: true, lawfulBasis: 'consent', purpose: 'Imported from CSV – consent confirmed by the uploading administrator', recordedAt: now },
    createdBy: req.user._id, updatedBy: req.user._id,
  }));
  const inserted = await Person.insertMany(docs, { ordered: false });
  const summary = { ...summarise(analysed), imported: inserted.length, skipped: analysed.length - inserted.length };
  await logActivity(req, { action: 'csv.imported', resourceType: 'person', description: `Imported ${inserted.length} contact(s) from CSV`, metadata: summary });
  ok(res, { data: summary }, 201);
});

export const exportPeople = asyncHandler(async (req, res) => {
  const { wardId, pollingUnitId, q } = req.query;
  const f = {};
  if (wardId) f.wardId = objectId.parse(wardId);
  if (pollingUnitId) f.pollingUnitId = objectId.parse(pollingUnitId);
  if (q) f.fullName = new RegExp(escapeRegex(String(q).trim()), 'i');
  const rows = await Person.find(f).sort({ fullName: 1 }).populate('wardId', 'name').populate('pollingUnitId', 'name').lean();

  // Columns follow the exporter's field-level permissions.
  const cols = [['Full Name', (p) => csvCell(p.fullName)]];
  if (can(req.user, 'people.viewPhone')) cols.push(['Phone Number', (p) => csvCell(p.normalizedPhone, { raw: true })]);
  cols.push(['Ward', (p) => csvCell(p.wardId?.name)], ['Polling Unit', (p) => csvCell(p.pollingUnitId?.name)]);
  if (can(req.user, 'people.viewAddress')) cols.push(['Address', (p) => csvCell(p.address)]);
  cols.push(['Preferred Contact', (p) => csvCell(p.preferredContact)]);
  if (can(req.user, 'people.viewConsent')) cols.push(['Consent Status', (p) => (p.consent?.granted && !p.consent?.withdrawnAt ? 'Granted' : 'Withdrawn')]);

  const csv = [cols.map((c) => c[0]).join(','), ...rows.map((p) => cols.map((c) => c[1](p)).join(','))].join('\r\n');
  await logActivity(req, { action: 'csv.exported', resourceType: 'person', description: `Exported ${rows.length} contact(s) to CSV`, metadata: { count: rows.length, wardId: wardId || null, pollingUnitId: pollingUnitId || null, search: !!q } });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="contacts-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send('\uFEFF' + csv);
});
