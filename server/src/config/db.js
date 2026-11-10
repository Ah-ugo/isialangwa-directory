import mongoose from 'mongoose';
import { env } from './env.js';

let connectionPromise;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (connectionPromise) return connectionPromise;

  mongoose.set('strictQuery', true);
  connectionPromise = mongoose.connect(env.MONGODB_URI, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000,
  }).then(() => {
    console.log('MongoDB connected');
  }).finally(() => {
    connectionPromise = undefined;
  });
  return connectionPromise;
}
