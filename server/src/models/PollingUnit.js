import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    wardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true, index: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);
const ci = { locale: 'en', strength: 2 };
schema.index({ wardId: 1, name: 1 }, { unique: true, collation: ci });
schema.index({ wardId: 1, code: 1 }, { unique: true, collation: ci, partialFilterExpression: { code: { $type: 'string' } } });
schema.index({ name: 1 });
schema.index({ code: 1 });

export default mongoose.model('PollingUnit', schema);
