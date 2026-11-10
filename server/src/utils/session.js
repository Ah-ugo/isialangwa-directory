import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { effectivePermissions } from '../config/permissions.js';
import { randomInt } from 'crypto';
import { ApiError } from './helpers.js';

export const COOKIE = 'sid';

export function issueSession(res, user, hours = 8) {
  const token = jwt.sign({ sub: String(user._id), tv: user.tokenVersion }, env.SESSION_SECRET, { expiresIn: `${hours}h` });
  res.cookie(COOKIE, token, cookieOpts(hours * 3600 * 1000));
}
export const clearSession = (res) => res.clearCookie(COOKIE, cookieOpts());
const cookieOpts = (maxAge) => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'none' : 'lax',
  path: '/',
  ...(maxAge ? { maxAge } : {}),
});

export const hashPassword = (pw) => bcrypt.hash(pw, 12);

export function assertPasswordStrength(pw, min = 10) {
  if (typeof pw !== 'string' || pw.length < min) throw new ApiError(400, `Password must be at least ${min} characters`);
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) throw new ApiError(400, 'Password must include letters and numbers');
}

export function tempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  return Array.from({ length: 14 }, () => chars[randomInt(0, chars.length)]).join('') + 'a7';
}

export function serializeUser(u, { full = false } = {}) {
  return {
    id: u._id,
    fullName: u.fullName,
    username: u.username,
    email: u.email,
    bankName: u.bankName,
    accountNumber: u.accountNumber,
    accountName: u.accountName,
    role: u.role,
    status: u.status,
    permissions: effectivePermissions(u),
    mustChangePassword: !!u.mustChangePassword,
    lastLogin: u.lastLogin,
    createdAt: u.createdAt,
    ...(full ? { createdBy: u.createdBy } : {}),
  };
}
