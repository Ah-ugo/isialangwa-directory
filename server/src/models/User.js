import mongoose from 'mongoose';
import { PERMISSION_TREE } from '../config/permissions.js';

const permShape = Object.fromEntries(
  Object.entries(PERMISSION_TREE).map(([m, acts]) => [m, Object.fromEntries(acts.map((a) => [a, { type: Boolean, default: false }]))])
);

const schema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, lowercase: true, unique: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    accountName: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['super_admin', 'admin'], default: 'admin' },
    permissions: permShape,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    mustChangePassword: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    failedLogins: { type: Number, default: 0 },
    lockUntil: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastLogin: Date,
  },
  { timestamps: true }
);

export default mongoose.model('User', schema);
