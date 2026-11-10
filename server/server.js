import { env, assertEnv } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import app from './src/app.js';

assertEnv();
await connectDB();
app.listen(env.PORT, () => console.log(`API listening on :${env.PORT} (${env.NODE_ENV})`));
