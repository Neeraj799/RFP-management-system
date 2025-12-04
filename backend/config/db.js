import mongoose from "mongoose";
import envConfig from "../config/envConfig.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(envConfig.db.URL, {});
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};
