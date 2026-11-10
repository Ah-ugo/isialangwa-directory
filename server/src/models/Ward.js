import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);
const ci = { locale: 'en', strength: 2 };
schema.index({ name: 1 }, { unique: true, collation: ci });
schema.index({ code: 1 }, { unique: true, collation: ci, partialFilterExpression: { code: { $type: 'string' } } });

export default mongoose.model('Ward', schema);
