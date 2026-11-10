// DEVELOPMENT ONLY: fictitious wards, polling units and contacts for testing. Refuses to run in production.
import 'dotenv/config';
import mongoose from 'mongoose';
import Ward from '../models/Ward.js';
import PollingUnit from '../models/PollingUnit.js';
import Person from '../models/Person.js';

if (process.env.NODE_ENV === 'production') { console.error('Refusing to seed production data.'); process.exit(1); }
await mongoose.connect(process.env.MONGODB_URI);
const sizes = [['Demo Ward A', 'DA', 6], ['Demo Ward B', 'DB', 10], ['Demo Ward C', 'DC', 4]];
const names = ['Chidi Okeke', 'Ngozi Eze', 'Emeka Nwosu', 'Ada Obi', 'Ifeanyi Uche', 'Chioma Kalu', 'Obinna Ibe', 'Amaka Nnadi'];
let n = 0;
for (const [name, code, count] of sizes) {
  const ward = (await Ward.findOne({ name })) || (await Ward.create({ name, code }));
  for (let i = 1; i <= count; i++) {
    const pu = (await PollingUnit.findOne({ wardId: ward._id, name: `Polling Unit ${String(i).padStart(3, '0')}` })) || (await PollingUnit.create({ wardId: ward._id, name: `Polling Unit ${String(i).padStart(3, '0')}`, code: `${code}-${i}` }));
    if (i <= 2) {
      const phone = `+2348010000${String(1000 + n).slice(-4)}`;
      if (!(await Person.exists({ normalizedPhone: phone }))) {
        await Person.create({ fullName: names[n % names.length] + ' (demo)', phone, normalizedPhone: phone, wardId: ward._id, pollingUnitId: pu._id, preferredContact: n % 2 ? 'whatsapp' : 'call', consent: { granted: true, lawfulBasis: 'consent', purpose: 'Demo data', recordedAt: new Date() } });
      }
      n++;
    }
  }
}
console.log('Dev seed complete.');
await mongoose.disconnect();
