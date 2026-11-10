import 'dotenv/config';
const e = process.env;
export const env = {
  NODE_ENV: e.NODE_ENV || 'development',
  isProd: e.NODE_ENV === 'production',
  PORT: Number(e.PORT) || 5000,
  MONGODB_URI: e.MONGODB_URI || '',
  SESSION_SECRET: e.SESSION_SECRET || '',
  CLIENT_URLS: (e.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim().replace(/\/$/, '')),
  CLOUDINARY_CLOUD_NAME: e.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: e.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: e.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_FOLDER: e.CLOUDINARY_FOLDER || 'isialangwa/people',
};
export function assertEnv() {
  const bad = [];
  if (!env.MONGODB_URI) bad.push('MONGODB_URI');
  if (env.SESSION_SECRET.length < 32) bad.push('SESSION_SECRET (min 32 chars)');
  if (bad.length) {
    console.error('Missing or invalid environment variables: ' + bad.join(', '));
    process.exit(1);
  }
}
