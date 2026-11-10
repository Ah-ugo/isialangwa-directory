import ActivityLog from '../models/ActivityLog.js';
import { asyncHandler, ok, paging, pageMeta } from '../utils/helpers.js';
import { objectId } from '../validators/index.js';

export const list = asyncHandler(async (req, res) => {
  const { action, resourceType, resourceId, adminId, from, to } = req.query;
  const f = {};
  if (action) f.action = String(action);
  if (resourceType) f.resourceType = String(resourceType);
  if (resourceId) f.resourceId = objectId.parse(resourceId);
  if (adminId) f.adminId = objectId.parse(adminId);
  if (from || to) {
    f.timestamp = {};
    if (from && !isNaN(new Date(from))) f.timestamp.$gte = new Date(from);
    if (to && !isNaN(new Date(to))) f.timestamp.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }
  const { page, limit, skip } = paging(req.query, 25, 100);
  const [rows, total] = await Promise.all([
    ActivityLog.find(f).sort({ timestamp: -1 }).skip(skip).limit(limit).populate('adminId', 'fullName username').lean(),
    ActivityLog.countDocuments(f),
  ]);
  ok(res, {
    data: rows.map((r) => ({ id: r._id, action: r.action, resourceType: r.resourceType, resourceId: r.resourceId, description: r.description, timestamp: r.timestamp, metadata: r.metadata, admin: r.adminId ? { id: r.adminId._id, fullName: r.adminId.fullName } : null })),
    meta: pageMeta(page, limit, total),
  });
});
