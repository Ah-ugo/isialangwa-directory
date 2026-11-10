export class ApiError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const ok = (res, body = {}, status = 200) => res.status(status).json({ success: true, ...body });

export function paging(query, def = 20, max = 100) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(max, Math.max(1, parseInt(query.limit, 10) || def));
  return { page, limit, skip: (page - 1) * limit };
}
export const pageMeta = (page, limit, total) => ({ page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });

/** CSV cell with formula-injection protection (raw=true for values that are safe by construction). */
export function csvCell(v, { raw = false } = {}) {
  let s = v == null ? '' : String(v);
  if (!raw && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
