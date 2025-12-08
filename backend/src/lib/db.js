import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is undefined. Check your .env file and configDotenv placement.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};
