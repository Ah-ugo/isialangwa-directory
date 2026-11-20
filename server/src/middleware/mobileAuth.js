import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/helpers.js';

/**
 * Bearer-token auth middleware for mobile API routes.
 * Reads `Authorization: Bearer <token>`, verifies the JWT with SESSION_SECRET,
 * and loads the user from DB — identical session semantics to the cookie auth.
 */
export const mobileAuthenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Please sign in to continue');
  }
  const token = authHeader.slice(7).trim();
  if (!token) throw new ApiError(401, 'Please sign in to continue');

  let payload;
  try {
    payload = jwt.verify(token, env.SESSION_SECRET);
  } catch {
    throw new ApiError(401, 'Your session has expired. Please sign in again');
  }

  const user = await User.findById(payload.sub);
  if (!user || user.status !== 'active' || user.tokenVersion !== payload.tv) {
    throw new ApiError(401, 'Your session is no longer valid. Please sign in again');
  }

  req.user = user;
  next();
});
