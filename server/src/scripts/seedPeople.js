// Seed the 3 people from Atlas test database into isialangwa database
import 'dotenv/config';
import mongoose from 'mongoose';
import Person from '../models/Person.js';
import Ward from '../models/Ward.js';
import PollingUnit from '../models/PollingUnit.js';
import User from '../models/User.js';

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed production data.');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Map from old database: all 3 people are in Ward 9 (Ovuokwu) with specific PUs
  const wardId = new mongoose.Types.ObjectId('6afc1b7d5997207a2f18579b'); // WARD 9 – Ovuokwu
  const ovorojiPU = new mongoose.Types.ObjectId('6afc1b7e5997207a2f18579f');     // 004 Ovorji – Central School
  const umuegoroPU = new mongoose.Types.ObjectId('6afc1b815997207a2f1857ab');    // 016 Umuegoro – Village Hall
  const umurasiPU = new mongoose.Types.ObjectId('6afc1b805997207a2f1857a7');     // 012 Umurasi – Community Civic Hall

  const superAdmin = await User.findOne({ role: 'super_admin' }).lean();
  const createdBy = superAdmin?._id;

  const people = [
    {
      fullName: 'Prince Ahuekwe',
      phone: '+2349028022359',
      normalizedPhone: '+2349028022359',
      wardId,
      pollingUnitId: ovorojiPU,
      address: 'Imo State Government House, Owerri',
      bankName: 'Opay',
      accountNumber: '9028022359',
      accountName: 'Ahuekwe Prince',
      preferredContact: 'call',
      pvcNumber: 'Apc',
      image: 'https://res.cloudinary.com/dcdk06pze/image/upload/v1794383371/isialangwa/people/ni5ldn2u433bp8mq5whn.png',
      imagePublicId: 'isialangwa/people/ni5ldn2u433bp8mq5whn',
      voterCardImage: 'https://res.cloudinary.com/dcdk06pze/image/upload/v1794383374/isialangwa/people/xzxdiotaodbiuyhtr9jf.jpg',
      voterCardPublicId: 'isialangwa/people/xzxdiotaodbiuyhtr9jf',
      consent: { granted: true, lawfulBasis: 'consent', purpose: 'Voluntary contact directory', recordedAt: new Date() },
      createdBy,
      updatedBy: createdBy,
    },
    {
      fullName: 'Uloaku Ezekiel',
      phone: '+2348161673883',
      normalizedPhone: '+2348161673883',
      wardId,
      pollingUnitId: umuegoroPU,
      address: 'Umuegoro 016',
      bankName: 'Union Bank',
      accountNumber: '3118893610',
      accountName: 'Uloaku Ezekiel',
      preferredContact: 'call',
      pvcNumber: 'APC YES',
      voterCardNumber: '30B9587B2D533131463',
      consent: { granted: true, lawfulBasis: 'consent', purpose: 'Voluntary contact directory', recordedAt: new Date() },
      createdBy,
      updatedBy: createdBy,
    },
    {
      fullName: 'Queen Odillanma Nwaogwugwu',
      phone: '+2349025813138',
      normalizedPhone: '+2349025813138',
      wardId,
      pollingUnitId: umurasiPU,
      address: 'Umurasi 012',
      bankName: 'Opay',
      accountNumber: '9023669092',
      accountName: 'Queen odilanma',
      preferredContact: 'call',
      pvcNumber: 'Yes Apc',
      voterCardNumber: 'INC2100000006294100',
      consent: { granted: true, lawfulBasis: 'consent', purpose: 'Voluntary contact directory', recordedAt: new Date() },
      createdBy,
      updatedBy: createdBy,
    },
  ];

  for (const p of people) {
    await Person.deleteOne({ normalizedPhone: p.normalizedPhone });
    await Person.create(p);
    console.log(`Created: ${p.fullName}`);
  }

  console.log('\nDone.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});