import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ApiError } from '../utils/helpers.js';

/** Strip keys that could be interpreted as Mongo operators or mutate object prototypes. */
function clean(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const keys = Object.keys(obj);
  for (const k of keys) {
    const v = obj[k];
    if (k === '__proto__' || k === 'prototype' || k === 'constructor' || k.startsWith('$') || k.includes('.')) {
      delete obj[k];
      continue;
    }

    if (v && typeof v === 'object') clean(v);
  }

  return obj;
}
export function sanitize(req, res, next) {
  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
}

/** CSRF defence for cookie auth: state-changing requests must come from an allowed origin. */
export function originCheck(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && !env.CLIENT_URLS.includes(origin.replace(/\/$/, ''))) return next(new ApiError(403, 'Request origin not allowed'));
  next();
}

export const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many sign-in attempts. Try again in a few minutes.' } });
export const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 1500, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many requests. Please slow down.' } });

export function validIdParam(...names) {
  return (req, res, next) => {
    for (const n of names) if (!mongoose.isValidObjectId(req.params[n])) return next(new ApiError(400, 'Invalid identifier'));
    next();
  };
}
