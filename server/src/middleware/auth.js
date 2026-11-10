import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { can } from '../config/permissions.js';
import { ApiError, asyncHandler } from '../utils/helpers.js';
import { COOKIE } from '../utils/session.js';

/** Loads the user on every request, so deactivation / permission changes apply immediately. */
export const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE];
  if (!token) throw new ApiError(401, 'Please sign in to continue');
  let payload;
  try {
    payload = jwt.verify(token, env.SESSION_SECRET);
  } catch {
    throw new ApiError(401, 'Your session has expired. Please sign in again');
  }
  const user = await User.findById(payload.sub);
  if (!user || user.status !== 'active' || user.tokenVersion !== payload.tv) throw new ApiError(401, 'Your session is no longer valid. Please sign in again');
  req.user = user;
  next();
});

const deny = () => new ApiError(403, 'You do not have permission to do that');
export const requirePermission = (...keys) => (req, res, next) => (keys.every((k) => can(req.user, k)) ? next() : next(deny()));
export const requireAny = (...keys) => (req, res, next) => (keys.some((k) => can(req.user, k)) ? next() : next(deny()));
export const requireSuperAdmin = (req, res, next) => (req.user?.role === 'super_admin' ? next() : next(deny()));
