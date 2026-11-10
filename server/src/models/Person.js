import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    normalizedPhone: { type: String, required: true },
    wardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
    pollingUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'PollingUnit', required: true },
    address: { type: String, trim: true },
    preferredContact: { type: String, enum: ['call', 'whatsapp'] },
    consent: {
      granted: { type: Boolean, required: true },
      purpose: String,
      lawfulBasis: { type: String, enum: ['consent', 'other'], default: 'consent' },
      recordedAt: Date,
      withdrawnAt: Date,
    },
    notes: { type: String, trim: true },
    image: { type: String, trim: true },
    imagePublicId: { type: String, trim: true },
    voterCardImage: { type: String, trim: true },
    voterCardPublicId: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);
// Phone numbers are intentionally NOT unique (shared household numbers); duplicates are detected and reviewed.
schema.index({ normalizedPhone: 1 });
schema.index({ fullName: 1 });
schema.index({ wardId: 1 });
schema.index({ pollingUnitId: 1 });
schema.index({ wardId: 1, pollingUnitId: 1 });
schema.index({ createdAt: -1 });

export default mongoose.model('Person', schema);
