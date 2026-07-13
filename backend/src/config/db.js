import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // Attempting to connect to the local Docker MongoDB container
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mujcode_ats';
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Connection Error: ${error.message}`);
    // Not exiting process to avoid breaking the existing JSON-based app flow
  }
};
