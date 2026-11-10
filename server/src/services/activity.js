import ActivityLog from '../models/ActivityLog.js';

/** Never pass passwords, tokens or phone numbers in `metadata`. */
export async function logActivity(req, { action, resourceType, resourceId, description, metadata = {}, adminId }) {
  try {
    await ActivityLog.create({ adminId: adminId || req.user?._id, action, resourceType, resourceId, description, metadata });
  } catch (e) {
    console.error('Activity log failed:', e.message);
  }
}
