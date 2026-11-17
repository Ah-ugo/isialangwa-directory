// Seed wards and polling units for Isialangwa South LGA
import 'dotenv/config';
import mongoose from 'mongoose';
import Ward from '../models/Ward.js';
import PollingUnit from '../models/PollingUnit.js';

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed production data.');
  process.exit(1);
}

const wardsData = [
  {
    name: 'WARD 1 – Amaise / Amaise Anaba',
    code: 'W01',
    pollingUnits: [
      { code: '001', name: 'Umuagharata Village Hall' },
      { code: '002', name: 'Mgbedeala – Village Hall' },
      { code: '003', name: 'Umuacha Village Hall' },
      { code: '004', name: 'Umuika – Community School' },
      { code: '005', name: 'Court Hall Premises' },
      { code: '006', name: 'Mkpuka – Community School' },
      { code: '007', name: 'Owerrinta/Umuogbu Junction I' },
      { code: '008', name: 'Amaokpu – Community School' },
      { code: '009', name: 'Aga Village Hall' },
      { code: '010', name: 'Nnoyi – Community I' },
      { code: '011', name: 'Nnoyi – Community II' },
      { code: '012', name: 'Umuekene Village Hall' },
      { code: '013', name: 'Ugba Junction' },
      { code: '014', name: 'Owerrinta/Umuogbu Junction II' },
      { code: '015', name: 'Mgbedeala – Community School' },
      { code: '016', name: 'Umuogolor Council Hall' },
      { code: '017', name: 'Amazu – Village Hall' },
      { code: '018', name: 'Umuohiagu – Village Hall' },
      { code: '019', name: 'Mkpuka – Town Hall' },
      { code: '020', name: 'Amaudo – Primary School Owerrinta' },
      { code: '021', name: 'Umuekene – Central School' },
    ],
  },
  {
    name: 'WARD 2 – Ngwaobi',
    code: 'W02',
    pollingUnits: [
      { code: '001', name: 'Ngwaobi – Central School' },
      { code: '002', name: 'Amaudara – Village Hall' },
      { code: '003', name: 'Umunta – Village Hall' },
      { code: '004', name: 'Umudogu – Village Hall' },
      { code: '005', name: 'Umuala – Village Hall' },
      { code: '006', name: 'Umueme – Village Hall' },
      { code: '007', name: 'Umuwaoma – Village Hall' },
      { code: '008', name: 'Ngwaobi – Community School' },
      { code: '009', name: 'Umuebi – Council Hall' },
      { code: '010', name: 'Umungwakwe – Village' },
      { code: '011', name: 'Amano Central School' },
      { code: '012', name: 'Ngwaobi – Primary Health Care' },
      { code: '013', name: 'Obi-Ngwaobi Health Centre' },
    ],
  },
  {
    name: 'WARD 3 – Mbutu Ukwu',
    code: 'W03',
    pollingUnits: [
      { code: '001', name: 'Nkwoala – Village Hall' },
      { code: '002', name: 'Umuojima Ukwu – Village Hall' },
      { code: '003', name: 'Umuokere Village Hall' },
      { code: '004', name: 'Egbelu – Central School' },
      { code: '005', name: 'Umugwor – Village Hall' },
      { code: '006', name: 'Umuoleke – Village Hall' },
      { code: '007', name: 'Umuoleke – Village Square' },
      { code: '008', name: 'Umuocheala – Secondary Community School' },
      { code: '009', name: 'Water Side – Council Hall' },
      { code: '010', name: "Owerrinta – St. Peter's School" },
      { code: '011', name: "Owerrinta – St. Epharaims/Owerrinta Girls School" },
      { code: '012', name: 'Umuojima Efere – Village Hall' },
      { code: '013', name: 'Umuojima Ukwu – Community School' },
      { code: '014', name: 'Egbelu Mbutu Village Hall' },
      { code: '015', name: 'Umueke Village Hall' },
      { code: '016', name: 'Umuokorie Village Hall' },
      { code: '017', name: 'Amaudo Village Hall Owerrinta' },
    ],
  },
  {
    name: 'WARD 4 – Mbutu Ngwa',
    code: 'W04',
    pollingUnits: [
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
    name: 'WARD 5 – Ehina Guru Osokwa',
    code: 'W05',
    pollingUnits: [
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
    name: 'WARD 6 – Akunekpu Eziama na Obuba',
    code: 'W06',
    pollingUnits: [
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
    name: 'WARD 7 – Omoba',
    code: 'W07',
    pollingUnits: [
      { code: '001', name: 'Umuire – Village Hall' },
      { code: '002', name: 'Umuezechi – Village Hall' },
      { code: '003', name: 'Omoba – Omoba Motor' },
      { code: '004', name: 'Umuokoroukwu – Village' },
      { code: '005', name: 'Umuokea – Village Hall' },
      { code: '006', name: 'Omoba – Central Schoo' },
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
    name: 'WARD 8 – Ovungwu',
    code: 'W08',
    pollingUnits: [
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
    name: 'WARD 9 – Ovuokwu',
    code: 'W09',
    pollingUnits: [
      { code: '001', name: 'Obiekwesu – Village Hall' },
      { code: '002', name: 'Amucha – Amucha Hall' },
      { code: '003', name: 'Umuawa – Central School' },
      { code: '004', name: 'Ovorji – Central School' },
      { code: '005', name: 'Amairi – Community School' },
      { code: '006', name: 'Umuene – Umuene Hall' },
      { code: '007', name: 'Okpuala – Primary School' },
      { code: '008', name: 'Umueleghele – Village Hall' },
      { code: '009', name: 'Isiekenta – Central School' },
      { code: '010', name: 'Obichukwu – Village Hall' },
      { code: '011', name: 'Umuikeogele – Village Hall' },
      { code: '012', name: 'Umurasi – Community Civic Hall' },
      { code: '013', name: 'Umuene/Umuopia Primary School' },
      { code: '014', name: 'Umuopia Village Hall' },
      { code: '015', name: 'Egbelu – Umueleghele Village Hall' },
      { code: '016', name: 'Umuegoro – Village Hall' },
    ],
  },
  {
    name: 'WARD 10 – Okporo Ahaba',
    code: 'W10',
    pollingUnits: [
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

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  let totalWards = 0;
  let totalPus = 0;

  for (const wardData of wardsData) {
    const ward = await Ward.findOneAndUpdate(
      { name: wardData.name },
      { name: wardData.name, code: wardData.code },
      { upsert: true, new: true }
    );
    totalWards++;
    console.log(`Ward: ${ward.name} (${ward.code})`);

    for (const pu of wardData.pollingUnits) {
      await PollingUnit.findOneAndUpdate(
        { wardId: ward._id, code: pu.code },
        { wardId: ward._id, name: pu.name, code: pu.code },
        { upsert: true, new: true }
      );
      totalPus++;
    }
    console.log(`  Added ${wardData.pollingUnits.length} polling units`);
  }

  console.log(`\nDone. ${totalWards} wards, ${totalPus} polling units seeded.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});