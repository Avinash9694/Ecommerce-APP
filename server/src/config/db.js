import mongoose from 'mongoose';

export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri);
  return conn.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
