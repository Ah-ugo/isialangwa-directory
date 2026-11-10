import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resourceType: { type: String, required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: Object, default: {} },
});
schema.index({ timestamp: -1 });
schema.index({ action: 1, timestamp: -1 });
schema.index({ resourceId: 1 });

// Audit records are append-only.
const blocked = ['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace', 'replaceOne', 'deleteOne', 'deleteMany', 'findOneAndDelete'];
schema.pre(blocked, function () {
  throw new Error('Audit records are immutable');
});

export default mongoose.model('ActivityLog', schema);
