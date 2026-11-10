import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const str = (max, min = 0) => z.string().trim().min(min).max(max);
const optStr = (max) => z.string().trim().max(max).optional().or(z.literal(''));

export const loginSchema = z.object({ identifier: str(120, 1), password: z.string().min(1).max(200) });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(1).max(200) });
export const profileSchema = z.object({ fullName: str(100, 2), username: str(40, 3).regex(/^[a-zA-Z0-9._-]+$/, 'Username may use letters, numbers, dot, dash and underscore'), email: z.string().trim().email().max(120) });
export const userProfileSchema = profileSchema.extend({
  bankName: optStr(100).optional(),
  accountNumber: optStr(30).optional(),
  accountName: optStr(100).optional(),
});

export const adminCreateSchema = profileSchema.extend({
  bankName: optStr(100).optional(),
  accountNumber: optStr(30).optional(),
  accountName: optStr(100).optional(),
  permissions: z.record(z.any()).optional(),
});
export const adminUpdateSchema = profileSchema.extend({
  bankName: optStr(100).optional(),
  accountNumber: optStr(30).optional(),
  accountName: optStr(100).optional(),
});
export const statusSchema = z.object({ status: z.enum(['active', 'inactive']) });
export const permissionsSchema = z.object({ permissions: z.record(z.any()) });

export const wardSchema = z.object({ name: str(100, 2), code: optStr(30), description: optStr(500) });
export const unitSchema = z.object({ name: str(120, 1), wardId: objectId, code: optStr(30), description: optStr(500) });
export const unitBulkSchema = z.object({
  wardId: objectId,
  dryRun: z.boolean().optional(),
  items: z.array(z.object({ name: str(120), code: optStr(30) })).min(1, 'Add at least one polling unit').max(500, 'Maximum 500 polling units per batch'),
});

export const personCreateSchema = z.object({
  fullName: str(120, 2),
  phone: str(25, 7),
  wardId: objectId,
  pollingUnitId: objectId,
  address: optStr(300),
  preferredContact: z.enum(['call', 'whatsapp', '']).optional(),
  notes: optStr(1000),
  image: optStr(500).optional(),
  voterCardImage: optStr(500).optional(),
  imagePublicId: optStr(100).optional(),
  voterCardPublicId: optStr(100).optional(),
  consent: z.object({ granted: z.boolean(), purpose: optStr(300), lawfulBasis: z.enum(['consent', 'other']).default('consent') }),
  force: z.boolean().optional(),
});
export const personUpdateSchema = personCreateSchema.partial();
export const consentSchema = z.object({ granted: z.boolean(), purpose: optStr(300) });

export const settingsSchema = z.object({
  appName: str(80, 2).optional(),
  organisationLabel: str(120).optional(),
  defaultPageSize: z.number().int().min(10).max(100).optional(),
  defaultCountryCode: z.literal('+234').optional(),
  dateFormat: z.enum(['short', 'numeric']).optional(),
  sessionExpiryHours: z.number().int().min(1).max(72).optional(),
  passwordMinLength: z.number().int().min(8).max(64).optional(),
  retentionMonths: z.number().int().min(1).max(120).optional(),
  consentPurpose: str(300).optional(),
  privacyNotice: str(4000).optional(),
});

export const importSchema = z.object({
  rows: z.array(z.record(z.any())).min(1, 'The file has no rows').max(5000, 'Maximum 5,000 rows per import'),
  includeDuplicates: z.boolean().optional(),
});
