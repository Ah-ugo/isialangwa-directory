import 'dotenv/config';
import mongoose from 'mongoose';
import Ward from '../models/Ward.js';

const wardNames = [
  'akunekpu eziama na obuba',
  'amaise / amaise anaba',
  'ehina guru osokwa',
  'mbutu ngwa',
  'mbutu ukwu',
  'ngwaobi',
  'okporo ahaba',
  'omoba',
  'ovungwu',
  'ovuokwu',
];

if (!process.env.MONGODB_URI) {
  console.error('Set MONGODB_URI before seeding wards.');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
try {
  let created = 0;
  for (const name of wardNames) {
    const existing = await Ward.findOne({ name }).collation({ locale: 'en', strength: 2 });
    if (existing) continue;
    await Ward.create({ name });
    created += 1;
  }
  console.log(`Ward seed complete. Added ${created}; ${wardNames.length - created} already existed.`);
} finally {
  await mongoose.disconnect();
}
