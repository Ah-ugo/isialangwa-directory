import Person from '../models/Person.js';
import Ward from '../models/Ward.js';
import PollingUnit from '../models/PollingUnit.js';
import { ApiError, asyncHandler, escapeRegex, ok, paging, pageMeta } from '../utils/helpers.js';
import { normalizePhone } from '../utils/phone.js';
import { can } from '../config/permissions.js';
import { personCreateSchema, personUpdateSchema, consentSchema, objectId } from '../validators/index.js';
import { logActivity } from '../services/activity.js';
import { uploadImage, destroyImage } from '../services/upload.js';

const POP = [{ path: 'wardId', select: 'name code' }, { path: 'pollingUnitId', select: 'name code' }];
const isContactable = (p) => !!p.consent?.granted && !p.consent?.withdrawnAt;

/** Field-level permission filtering lives here, so every endpoint returns only what the admin may see. */
export function serializePerson(p, user) {
  const w = p.wardId?._id ? p.wardId : null;
  const u = p.pollingUnitId?._id ? p.pollingUnitId : null;
  const out = {
    id: p._id,
    fullName: p.fullName,
    wardId: w ? w._id : p.wardId,
    pollingUnitId: u ? u._id : p.pollingUnitId,
    ward: w ? { id: w._id, name: w.name, code: w.code } : undefined,
    pollingUnit: u ? { id: u._id, name: u.name, code: u.code } : undefined,
    preferredContact: p.preferredContact,
    notes: p.notes,
    contactable: isContactable(p),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
  if (can(user, 'people.viewPhone')) out.phone = p.normalizedPhone;
  if (can(user, 'people.viewAddress')) out.address = p.address;
  if (can(user, 'people.viewBankDetails')) {
    out.bankName = p.bankName;
    out.accountNumber = p.accountNumber;
    out.accountName = p.accountName;
  }
  if (can(user, 'people.viewConsent')) out.consent = p.consent;
  if (can(user, 'people.viewImage')) out.image = p.image;
  if (can(user, 'people.viewVoterCard')) out.voterCardImage = p.voterCardImage;
  return out;
}

async function relations(wardId, pollingUnitId) {
  const unit = await PollingUnit.findById(pollingUnitId).lean();
  if (!unit || String(unit.wardId) !== String(wardId)) throw new ApiError(400, 'The polling unit does not belong to the selected ward');
  if (!(await Ward.exists({ _id: wardId }))) throw new ApiError(400, 'The selected ward does not exist');
}

async function duplicates(normalizedPhone, excludeId) {
  const f = { normalizedPhone };
  if (excludeId) f._id = { $ne: excludeId };
  const found = await Person.find(f).limit(5).populate('wardId', 'name').populate('pollingUnitId', 'name').lean();
  return found.map((d) => ({ id: d._id, fullName: d.fullName, ward: d.wardId?.name, pollingUnit: d.pollingUnitId?.name }));
}

function assertConsent(c) {
  if (c.lawfulBasis === 'consent' && !c.granted) throw new ApiError(400, 'Consent must be confirmed before saving this contact');
  if (c.lawfulBasis === 'other' && !(c.purpose || '').trim()) throw new ApiError(400, 'State the purpose and lawful basis for processing');
}

export const uploadPersonImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image provided');
  const { url, publicId } = await uploadImage(req.file.buffer);
  await logActivity(req, { action: 'person.image.uploaded', resourceType: 'person', description: 'Uploaded a person image' });
  ok(res, { data: { url, publicId } });
});

const applyImage = (p, b, field, publicIdField) => {
  if (b[field] !== undefined) {
    if (b[field] && p[publicIdField] && b[publicIdField] !== p[publicIdField]) {
      void destroyImage(p[publicIdField]);
    }
    p[field] = b[field] || undefined;
    p[publicIdField] = b[publicIdField] || undefined;
  }
};

export const list = asyncHandler(async (req, res) => {
  const { q, wardId, pollingUnitId, preferredContact, from, to, sort = '-createdAt' } = req.query;
  const f = {};
  if (wardId) f.wardId = objectId.parse(wardId);
  if (pollingUnitId) f.pollingUnitId = objectId.parse(pollingUnitId);
  if (['call', 'whatsapp'].includes(preferredContact)) f.preferredContact = preferredContact;
  if (from || to) {
    f.createdAt = {};
    if (from && !isNaN(new Date(from))) f.createdAt.$gte = new Date(from);
    if (to && !isNaN(new Date(to))) f.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }
  if (q) {
    const or = [{ fullName: new RegExp(escapeRegex(q.trim()), 'i') }];
    const digits = q.replace(/\D/g, '');
    // phone search only for admins who may see phone numbers (prevents using search to probe hidden fields)
    if (digits.length >= 3 && can(req.user, 'people.viewPhone')) or.push({ normalizedPhone: new RegExp(escapeRegex(digits.replace(/^(234|0)/, ''))) });
    f.$or = or;
  }
  const sortMap = { fullName: { fullName: 1 }, '-fullName': { fullName: -1 }, createdAt: { createdAt: 1 }, '-createdAt': { createdAt: -1 } };
  const { page, limit, skip } = paging(req.query, 20);
  const [rows, total] = await Promise.all([
    Person.find(f).sort(sortMap[sort] || sortMap['-createdAt']).skip(skip).limit(limit).populate(POP).lean(),
    Person.countDocuments(f),
  ]);
  ok(res, { data: rows.map((p) => serializePerson(p, req.user)), meta: pageMeta(page, limit, total) });
});

export const search = asyncHandler(async (req, res) => {
  req.query.limit = Math.min(Number(req.query.limit) || 8, 20);
  return list(req, res, () => {});
});

export const checkDuplicate = asyncHandler(async (req, res) => {
  const n = normalizePhone(req.query.phone);
  ok(res, { data: n ? await duplicates(n, req.query.excludeId) : [] });
});

export const create = asyncHandler(async (req, res) => {
  const b = personCreateSchema.parse(req.body);
  const normalizedPhone = normalizePhone(b.phone);
  if (!normalizedPhone) throw new ApiError(400, 'Enter a valid Nigerian phone number, e.g. 0803 123 4567');
  assertConsent(b.consent);
  await relations(b.wardId, b.pollingUnitId);
  if (!b.force) {
    const d = await duplicates(normalizedPhone);
    if (d.length) throw new ApiError(409, 'This phone number is already in the directory', { code: 'DUPLICATE_PHONE', duplicates: d });
  }
  const p = await Person.create({
    fullName: b.fullName, phone: normalizedPhone, normalizedPhone,
    wardId: b.wardId, pollingUnitId: b.pollingUnitId,
    address: b.address || undefined, preferredContact: b.preferredContact || undefined, notes: b.notes || undefined,
    ...(can(req.user, 'people.viewBankDetails') ? {
      bankName: b.bankName || undefined,
      accountNumber: b.accountNumber || undefined,
      accountName: b.accountName || undefined,
    } : {}),
    image: b.image || undefined, imagePublicId: b.imagePublicId || undefined,
    voterCardImage: b.voterCardImage || undefined, voterCardPublicId: b.voterCardPublicId || undefined,
    consent: { granted: b.consent.granted, purpose: b.consent.purpose || undefined, lawfulBasis: b.consent.lawfulBasis, recordedAt: new Date() },
    createdBy: req.user._id, updatedBy: req.user._id,
  });
  await logActivity(req, { action: 'person.created', resourceType: 'person', resourceId: p._id, description: `Registered ${p.fullName}` });
  ok(res, { data: serializePerson(await Person.findById(p._id).populate(POP).lean(), req.user) }, 201);
});

export const getOne = asyncHandler(async (req, res) => {
  const p = await Person.findById(req.params.id).populate(POP).lean();
  if (!p) throw new ApiError(404, 'Person not found');
  ok(res, { data: serializePerson(p, req.user) });
});

export const update = asyncHandler(async (req, res) => {
  const b = personUpdateSchema.parse(req.body);
  const p = await Person.findById(req.params.id);
  if (!p) throw new ApiError(404, 'Person not found');
  if (b.fullName) p.fullName = b.fullName;
  if (b.phone && can(req.user, 'people.viewPhone')) {
    const n = normalizePhone(b.phone);
    if (!n) throw new ApiError(400, 'Enter a valid Nigerian phone number');
    if (n !== p.normalizedPhone && !b.force) {
      const d = await duplicates(n, p._id);
      if (d.length) throw new ApiError(409, 'This phone number is already in the directory', { code: 'DUPLICATE_PHONE', duplicates: d });
    }
    p.phone = p.normalizedPhone = n;
  }
  if (b.wardId || b.pollingUnitId) {
    const wardId = b.wardId || p.wardId, unitId = b.pollingUnitId || p.pollingUnitId;
    await relations(wardId, unitId);
    p.wardId = wardId;
    p.pollingUnitId = unitId;
  }
  if (b.address !== undefined && can(req.user, 'people.viewAddress')) p.address = b.address || undefined;
  if (b.bankName !== undefined && can(req.user, 'people.viewBankDetails')) p.bankName = b.bankName || undefined;
  if (b.accountNumber !== undefined && can(req.user, 'people.viewBankDetails')) p.accountNumber = b.accountNumber || undefined;
  if (b.accountName !== undefined && can(req.user, 'people.viewBankDetails')) p.accountName = b.accountName || undefined;
  if (b.preferredContact !== undefined) p.preferredContact = b.preferredContact || undefined;
  if (b.notes !== undefined) p.notes = b.notes || undefined;
  applyImage(p, b, 'image', 'imagePublicId');
  applyImage(p, b, 'voterCardImage', 'voterCardPublicId');
  if (b.consent && can(req.user, 'people.manageConsent')) {
    assertConsent(b.consent);
    if (b.consent.purpose !== undefined) p.consent.purpose = b.consent.purpose;
    p.consent.lawfulBasis = b.consent.lawfulBasis;
  }
  p.updatedBy = req.user._id;
  await p.save();
  await logActivity(req, { action: 'person.updated', resourceType: 'person', resourceId: p._id, description: `Updated ${p.fullName}` });
  ok(res, { data: serializePerson(await Person.findById(p._id).populate(POP).lean(), req.user) });
});

export const setConsent = asyncHandler(async (req, res) => {
  const b = consentSchema.parse(req.body);
  const p = await Person.findById(req.params.id);
  if (!p) throw new ApiError(404, 'Person not found');
  if (b.granted) {
    p.consent.granted = true;
    p.consent.withdrawnAt = undefined;
    p.consent.recordedAt = new Date();
    if (b.purpose) p.consent.purpose = b.purpose;
  } else {
    p.consent.granted = false;
    p.consent.withdrawnAt = new Date();
  }
  p.updatedBy = req.user._id;
  await p.save();
  await logActivity(req, { action: b.granted ? 'consent.recorded' : 'consent.withdrawn', resourceType: 'person', resourceId: p._id, description: `${b.granted ? 'Recorded consent for' : 'Consent withdrawn by'} ${p.fullName}` });
  ok(res, { data: serializePerson(await Person.findById(p._id).populate(POP).lean(), req.user) });
});

export const remove = asyncHandler(async (req, res) => {
  const p = await Person.findById(req.params.id);
  if (!p) throw new ApiError(404, 'Person not found');
  await p.deleteOne();
  await logActivity(req, { action: 'person.deleted', resourceType: 'person', resourceId: p._id, description: `Deleted ${p.fullName}` });
  ok(res, { message: 'Contact deleted' });
});
