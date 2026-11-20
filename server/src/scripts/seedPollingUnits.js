import 'dotenv/config';
import mongoose from 'mongoose';
import Ward from '../models/Ward.js';
import PollingUnit from '../models/PollingUnit.js';

const WARD_POLLING_UNITS = [
  {
    wardCode: '004',
    wardName: 'Mbutu Ngwa',
    units: [
      { code: '001', name: 'Amankwo – Village Hall' },
      { code: '002', name: 'Amankwo/Ahiaofor Village' },
      { code: '003', name: 'Mbutu Ngwa – Primary School' },
      { code: '004', name: 'Mbutu Ngwa – Secondary School' },
      { code: '005', name: 'Obiekwesu – Village Hall' },
      { code: '006', name: 'Umuduru – Village Hall' },
      { code: '007', name: 'Okpungwu – Village Hall' },
      { code: '008', name: 'Umuezeoche Village Hall' },
      { code: '009', name: 'Umuichi – Village Hall' },
      { code: '010', name: 'Uhum – Village Hall' },
      { code: '011', name: 'Mbutu Ngwa – Secondary School II' },
      { code: '012', name: 'Umuduru – Village Hall II' },
      { code: '013', name: 'Mbutu Ngwa – Primary School II' },
      { code: '014', name: 'Umuichi – Village Hall II' },
      { code: '015', name: 'Umuosoala – Village Hall' },
      { code: '016', name: 'Mbutu Amankwo – Market Square' },
      { code: '017', name: 'Amankwo Market Square' },
      { code: '018', name: 'Umugwu – UmuabAraku Village Hall' },
    ],
  },
  {
    wardCode: '005',
    wardName: 'Ehina Guru Osokwa',
    units: [
      { code: '001', name: 'Umuezu – Umuezu Hall' },
      { code: '002', name: 'Umuada – Village Hall' },
      { code: '003', name: 'Umuabali Village Hall' },
      { code: '004', name: 'Umuhu – Umuhu Hall 01' },
      { code: '005', name: 'Umuetegha Central School' },
      { code: '006', name: 'Umuehim Village Square' },
      { code: '007', name: 'Umuguru – Village Hall' },
      { code: '008', name: 'Amaiyi – Central School I' },
      { code: '009', name: 'Amaiyi – Central School II' },
      { code: '010', name: 'Ebeiyi – Central School' },
      { code: '011', name: 'Ndiolumbe – C.P.S.' },
      { code: '012', name: 'Ndiolumbe – Village Square' },
      { code: '013', name: 'Umuohia Village Hall' },
      { code: '014', name: 'Umuokechi Village Hall' },
      { code: '015', name: 'UmunKpo – Village Hall' },
      { code: '016', name: 'Akpurunta – Village Hall' },
      { code: '017', name: 'Ahiafor/Umuru – Village Hall' },
      { code: '018', name: 'Ikem Civil Centre' },
      { code: '019', name: 'Ikem Civil Centre – Nkwo Market Square' },
      { code: '020', name: 'Umuagwu Meeting Centre, Umuagwu' },
      { code: '021', name: 'Umualaubi – Village Hall' },
      { code: '022', name: 'Iheorji – Village Hall' },
      { code: '023', name: 'Nneise – Community School' },
      { code: '024', name: 'Ntigha Nvosi United – Village' },
      { code: '025', name: 'Okpokiri – Customary Court 01' },
      { code: '026', name: 'Umumgboho Village Hall' },
      { code: '027', name: 'Umuazuma – Village Hall' },
      { code: '028', name: 'Umuwaocha – Village Hall' },
    ],
  },
  {
    wardCode: '006',
    wardName: 'Akunekpu Eziama na Obuba',
    units: [
      { code: '001', name: 'Umuokorogu – Village Hall' },
      { code: '002', name: 'Umuokegbe – Village Hall' },
      { code: '003', name: 'Obuba – Central School' },
      { code: '004', name: 'Umubefu – Village Hall' },
      { code: '005', name: 'Kputuke – Village Hall' },
      { code: '006', name: 'Umungalagu – Village Hall' },
      { code: '007', name: 'UmunKpayi – Central School I' },
      { code: '008', name: 'UmunKpayi – Central School II' },
      { code: '009', name: 'Umuokiri – Central School' },
      { code: '010', name: 'Umunevo – Central School' },
      { code: '011', name: 'Umunko – Village Hall' },
      { code: '012', name: 'Amaku – Central School' },
      { code: '013', name: 'Umuejia – Village Hall' },
      { code: '014', name: 'Ohuhu Ekwuru – Central School' },
      { code: '015', name: 'Umulelu – Village Hall' },
      { code: '016', name: 'Mgbokanta – Village Hall' },
      { code: '017', name: 'Umuamacha – Village Hall' },
      { code: '018', name: 'Nvosi – High School' },
      { code: '019', name: 'Umuaro Village Centre, Umuaro' },
      { code: '020', name: 'Umuikpe Village Hall' },
      { code: '021', name: 'Eluama – Ancient Kingdom Hall' },
      { code: '022', name: 'Umuere ke – Village Square' },
      { code: '023', name: 'Umuikeama – Village Hall' },
      { code: '024', name: 'Umuodo – Village Hall' },
    ],
  },
  {
    wardCode: '007',
    wardName: 'Omoba',
    units: [
      { code: '001', name: 'Umuire – Village Hall' },
      { code: '002', name: 'Umuezechi – Village Hall' },
      { code: '003', name: 'Omoba – Omoba Motor' },
      { code: '004', name: 'Umuokoroukwu – Village' },
      { code: '005', name: 'Umuokea – Village Hall' },
      { code: '006', name: 'Omoba – Central School' },
      { code: '007', name: 'Umuagu – Village Hall' },
      { code: '008', name: 'Umugba – Village Hall' },
      { code: '009', name: 'Umuokegwu (I) – Village Hall' },
      { code: '010', name: 'Amapu – Village Hall' },
      { code: '011', name: 'Umuekegwu – Village Hall (II)' },
      { code: '012', name: 'Umuamosi – Village Hall' },
      { code: '013', name: 'Egbelu – Egbelu Umuokegwu Village Hall' },
      { code: '014', name: 'Umuobiri – Village Hall' },
      { code: '015', name: 'NDDC Borehole Premises Omoba' },
      { code: '016', name: 'Ovu Amapu – Village Hall' },
      { code: '017', name: 'Umuolihie – Village Hall' },
      { code: '018', name: 'Omoba Railway Crossing Junction' },
      { code: '019', name: 'Umuogwuma Village' },
      { code: '020', name: 'Ahia Orie – Okpu Square' },
    ],
  },
  {
    wardCode: '008',
    wardName: 'Ovungwu',
    units: [
      { code: '001', name: 'Umuakpor – Village Hall' },
      { code: '002', name: 'Umuapu – Central School' },
      { code: '003', name: 'Amato/Umuapu – Community School' },
      { code: '004', name: 'Ovungwa – Community Council Hall' },
      { code: '005', name: 'Agbaragwu – Central School' },
      { code: '006', name: 'UmunKwo – Village Hall UmunKwo' },
      { code: '007', name: 'Okpuala – Village Hall' },
      { code: '008', name: 'Amabua – Central School' },
      { code: '009', name: 'Okpungwu – Village Hall' },
      { code: '010', name: 'Umotiri – Village Hall' },
      { code: '011', name: 'Umuaja – Central School' },
      { code: '012', name: 'Ngwama – Community Hall' },
      { code: '013', name: 'Umuojiji – Village Hall' },
      { code: '014', name: 'Umuokoro – Central' },
      { code: '015', name: 'Ekenekpu – Village Hall' },
      { code: '016', name: 'Umuachiri Umuapu – Community Civic Centre' },
      { code: '017', name: 'Agbaragwu – Village Hall' },
      { code: '018', name: 'Umuotiri/Amato Community School Amaede' },
      { code: '019', name: 'Health Post – Ovungwu' },
      { code: '020', name: 'Umuokoro – Civic Centre' },
      { code: '021', name: 'Umueke – Village Hall' },
    ],
  },
  {
    wardCode: '010',
    wardName: 'Okporo Ahaba',
    units: [
      { code: '001', name: 'Umuhie – Central School' },
      { code: '002', name: 'Umuoko – Central School' },
      { code: '003', name: 'Mbutu Umuoko – Village Hall' },
      { code: '004', name: 'Ntighauzor – Community School' },
      { code: '005', name: 'Mba – Community School' },
      { code: '006', name: 'Umuaj uju – Village Hall' },
      { code: '007', name: 'Umuaj uju – Health Centre' },
      { code: '008', name: 'Umuosi – Village Hall' },
      { code: '009', name: 'Okpuhie – Central School' },
      { code: '010', name: 'Umuakuma – Central School' },
      { code: '011', name: 'Umuenere – Village Hall' },
      { code: '012', name: 'Umuhie – Civic Hall' },
      { code: '013', name: 'Umuolihie – Village Hall' },
      { code: '014', name: 'Amuke – Village Hall' },
      { code: '015', name: 'Okpu-Chukwu Village Hall' },
      { code: '016', name: 'Okpuhie – Civic Hall' },
    ],
  },
];

async function connectWithRetry(retries = 5, delay = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`Connecting to MongoDB (attempt ${i}/${retries})...`);
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 15000,
      });
      console.log('Connected to MongoDB successfully.');
      return;
    } catch (err) {
      console.warn(`Connection attempt ${i} failed: ${err.message}`);
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not found in environment');
    process.exit(1);
  }

  await connectWithRetry();

  const ci = { locale: 'en', strength: 2 };

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const group of WARD_POLLING_UNITS) {
    // Find ward by code or name
    let ward = await Ward.findOne({
      $or: [
        { code: group.wardCode },
        { name: new RegExp(`^${group.wardName.replace('/', '\\/')}`, 'i') },
      ],
    }).collation(ci);

    // If ward was 'Okporo', update name to 'Okporo Ahaba'
    if (group.wardCode === '010' && ward && ward.name.toLowerCase() === 'okporo') {
      ward.name = 'Okporo Ahaba';
      await ward.save();
      console.log(`Updated Ward 010 name to: ${ward.name}`);
    }

    if (!ward) {
      console.error(`Ward not found for code: ${group.wardCode}, name: ${group.wardName}`);
      continue;
    }

    console.log(`\nProcessing Ward ${ward.code} - ${ward.name} (${group.units.length} units to seed)`);

    for (const unit of group.units) {
      // Check if unit exists by code or name within this ward
      const existing = await PollingUnit.findOne({
        wardId: ward._id,
        $or: [{ code: unit.code }, { name: unit.name }],
      }).collation(ci);

      if (existing) {
        console.log(`  [Skipped] ${unit.code} - ${unit.name} (already exists)`);
        totalSkipped++;
        continue;
      }

      await PollingUnit.create({
        wardId: ward._id,
        code: unit.code,
        name: unit.name,
      });
      console.log(`  [Created] ${unit.code} - ${unit.name}`);
      totalCreated++;
    }
  }

  console.log(`\n================================`);
  console.log(`Seeding complete!`);
  console.log(`Created: ${totalCreated}`);
  console.log(`Skipped: ${totalSkipped}`);
  console.log(`Total processed: ${totalCreated + totalSkipped}`);
  console.log(`================================`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
