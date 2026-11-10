import { asyncHandler, ok } from '../utils/helpers.js';
import { settingsSchema } from '../validators/index.js';
import { getSettings } from '../services/settings.js';
import { logActivity } from '../services/activity.js';

const pub = (s) => ({ appName: s.appName, organisationLabel: s.organisationLabel, defaultPageSize: s.defaultPageSize, defaultCountryCode: s.defaultCountryCode, dateFormat: s.dateFormat, consentPurpose: s.consentPurpose, passwordMinLength: s.passwordMinLength, privacyNotice: s.privacyNotice });

export const getPublic = asyncHandler(async (req, res) => ok(res, { data: pub(await getSettings()) }));
export const getAll = asyncHandler(async (req, res) => ok(res, { data: (await getSettings()).toObject() }));
export const update = asyncHandler(async (req, res) => {
  const body = settingsSchema.parse(req.body);
  const s = await getSettings();
  Object.assign(s, body);
  await s.save();
  await logActivity(req, { action: 'settings.updated', resourceType: 'settings', description: 'Updated application settings', metadata: { fields: Object.keys(body) } });
  ok(res, { data: s.toObject() });
});
