import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { ApiError, asyncHandler, ok } from '../utils/helpers.js';
import { issueSession, clearSession, hashPassword, assertPasswordStrength, serializeUser } from '../utils/session.js';
import { changePasswordSchema, loginSchema, userProfileSchema } from '../validators/index.js';
import { getSettings } from '../services/settings.js';
import { logActivity } from '../services/activity.js';

const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-password', 12);
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = loginSchema.parse(req.body);
  const id = identifier.toLowerCase();
  const user = await User.findOne({ $or: [{ username: id }, { email: id }] }).select('+passwordHash');
  const bad = new ApiError(401, 'Incorrect username or password');
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw bad;
  }
  if (user.lockUntil && user.lockUntil > new Date()) throw new ApiError(429, 'Too many failed attempts. Try again in a few minutes.');
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    user.failedLogins += 1;
    if (user.failedLogins >= MAX_FAILS) {
      user.failedLogins = 0;
      user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60000);
    }
    await user.save();
    throw bad;
  }
  if (user.status !== 'active') throw new ApiError(403, 'This account has been deactivated. Contact the Super Admin.');
  user.failedLogins = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();
  await user.save();
  const settings = await getSettings();
  issueSession(res, user, settings.sessionExpiryHours);
  await logActivity(req, { adminId: user._id, action: 'auth.login', resourceType: 'user', resourceId: user._id, description: `${user.fullName} signed in` });
  ok(res, { data: serializeUser(user) });
});

export const logout = (req, res) => {
  clearSession(res);
  ok(res, { message: 'Signed out' });
};

export const me = (req, res) => ok(res, { data: serializeUser(req.user) });

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) throw new ApiError(400, 'Current password is incorrect');
  if (currentPassword === newPassword) throw new ApiError(400, 'Choose a different password');
  const settings = await getSettings();
  assertPasswordStrength(newPassword, settings.passwordMinLength);
  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  user.tokenVersion += 1; // signs out every other session
  await user.save();
  issueSession(res, user, settings.sessionExpiryHours);
  await logActivity(req, { action: 'auth.password_changed', resourceType: 'user', resourceId: user._id, description: `${user.fullName} changed their password` });
  ok(res, { message: 'Password updated', data: serializeUser(user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const body = userProfileSchema.parse(req.body);
  const user = req.user;
  Object.assign(user, {
    fullName: body.fullName,
    username: body.username.toLowerCase(),
    email: body.email.toLowerCase(),
    bankName: body.bankName || undefined,
    accountNumber: body.accountNumber || undefined,
    accountName: body.accountName || undefined,
  });
  await user.save();
  ok(res, { message: 'Profile updated', data: serializeUser(user) });
});

export const logoutAll = asyncHandler(async (req, res) => {
  req.user.tokenVersion += 1;
  await req.user.save();
  issueSession(res, req.user, (await getSettings()).sessionExpiryHours);
  await logActivity(req, { action: 'auth.sessions_revoked', resourceType: 'user', resourceId: req.user._id, description: `${req.user.fullName} signed out of other devices` });
  ok(res, { message: 'Other sessions have been signed out' });
});
