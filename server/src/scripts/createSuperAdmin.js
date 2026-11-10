// Secure, deployment-time provisioning of the first Super Admin (there is no public registration).
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { fullPermissions } from '../config/permissions.js';
import { hashPassword, assertPasswordStrength } from '../utils/session.js';

const { MONGODB_URI, SUPERADMIN_FULLNAME, SUPERADMIN_USERNAME, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } = process.env;
if (!MONGODB_URI || !SUPERADMIN_FULLNAME || !SUPERADMIN_USERNAME || !SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
  console.error('Set MONGODB_URI and SUPERADMIN_FULLNAME / USERNAME / EMAIL / PASSWORD, then run again.');
  process.exit(1);
}
await mongoose.connect(MONGODB_URI);
if (await User.exists({ role: 'super_admin' })) {
  console.error('A Super Admin already exists. Nothing was changed.');
  await mongoose.disconnect();
  process.exit(1);
}
assertPasswordStrength(SUPERADMIN_PASSWORD, 12);
await User.create({
  fullName: SUPERADMIN_FULLNAME, username: SUPERADMIN_USERNAME, email: SUPERADMIN_EMAIL,
  passwordHash: await hashPassword(SUPERADMIN_PASSWORD), role: 'super_admin', permissions: fullPermissions(),
});
console.log('Super Admin created. Remove SUPERADMIN_PASSWORD from your environment now.');
await mongoose.disconnect();
