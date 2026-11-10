import User from '../models/User.js';
import { ApiError, asyncHandler, escapeRegex, ok } from '../utils/helpers.js';
import { hashPassword, tempPassword, serializeUser } from '../utils/session.js';
import { adminCreateSchema, adminUpdateSchema, permissionsSchema, statusSchema } from '../validators/index.js';
import { sanitizePermissions } from '../config/permissions.js';
import { logActivity } from '../services/activity.js';

async function target(req) {
  const u = await User.findById(req.params.id);
  if (!u) throw new ApiError(404, 'Administrator not found');
  return u;
}
function guardProtected(u, req, what = 'changed') {
  if (u.role === 'super_admin') throw new ApiError(403, `The Super Admin account cannot be ${what} here`);
  if (String(u._id) === String(req.user._id)) throw new ApiError(403, 'You cannot modify your own account here');
}

export const list = asyncHandler(async (req, res) => {
  const { q, status } = req.query;
  const f = {};
  if (status === 'active' || status === 'inactive') f.status = status;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    f.$or = [{ fullName: rx }, { username: rx }, { email: rx }];
  }
  const users = await User.find(f).sort({ role: -1, createdAt: 1 });
  ok(res, { data: users.map((u) => serializeUser(u)) });
});

export const getOne = asyncHandler(async (req, res) => ok(res, { data: serializeUser(await target(req), { full: true }) }));

export const create = asyncHandler(async (req, res) => {
  const body = adminCreateSchema.parse(req.body);
  const password = tempPassword();
  const user = await User.create({
    fullName: body.fullName,
    username: body.username.toLowerCase(),
    email: body.email.toLowerCase(),
    bankName: body.bankName || undefined,
    accountNumber: body.accountNumber || undefined,
    accountName: body.accountName || undefined,
    passwordHash: await hashPassword(password),
    role: 'admin',
    permissions: sanitizePermissions(body.permissions),
    mustChangePassword: true,
    createdBy: req.user._id,
  });
  await logActivity(req, { action: 'admin.created', resourceType: 'user', resourceId: user._id, description: `Created administrator ${user.fullName}` });
  ok(res, { data: serializeUser(user), temporaryPassword: password }, 201); // shown once, never stored in plain text
});

export const update = asyncHandler(async (req, res) => {
  const body = adminUpdateSchema.parse(req.body);
  const u = await target(req);
  guardProtected(u, req, 'edited');
  Object.assign(u, { fullName: body.fullName, username: body.username.toLowerCase(), email: body.email.toLowerCase(), bankName: body.bankName || undefined, accountNumber: body.accountNumber || undefined, accountName: body.accountName || undefined });
  await u.save();
  await logActivity(req, { action: 'admin.updated', resourceType: 'user', resourceId: u._id, description: `Updated administrator ${u.fullName}` });
  ok(res, { data: serializeUser(u) });
});

export const updatePermissions = asyncHandler(async (req, res) => {
  const { permissions } = permissionsSchema.parse(req.body);
  const u = await target(req);
  guardProtected(u, req, 'given new permissions');
  u.permissions = sanitizePermissions(permissions);
  u.tokenVersion += 1; // existing sessions must re-authenticate with fresh permissions
  await u.save();
  await logActivity(req, { action: 'admin.permissions_updated', resourceType: 'user', resourceId: u._id, description: `Updated permissions for ${u.fullName}` });
  ok(res, { data: serializeUser(u) });
});

export const setStatus = asyncHandler(async (req, res) => {
  const { status } = statusSchema.parse(req.body);
  const u = await target(req);
  guardProtected(u, req, 'deactivated');
  u.status = status;
  u.tokenVersion += 1;
  await u.save();
  await logActivity(req, { action: status === 'inactive' ? 'admin.deactivated' : 'admin.reactivated', resourceType: 'user', resourceId: u._id, description: `${status === 'inactive' ? 'Deactivated' : 'Reactivated'} administrator ${u.fullName}` });
  ok(res, { data: serializeUser(u) });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const u = await target(req);
  guardProtected(u, req, 'reset');
  const password = tempPassword();
  u.passwordHash = await hashPassword(password);
  u.mustChangePassword = true;
  u.tokenVersion += 1;
  u.failedLogins = 0;
  u.lockUntil = undefined;
  await u.save();
  await logActivity(req, { action: 'admin.password_reset', resourceType: 'user', resourceId: u._id, description: `Reset password for ${u.fullName}` });
  ok(res, { data: serializeUser(u), temporaryPassword: password });
});
