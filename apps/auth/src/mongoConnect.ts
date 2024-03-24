import mongoose from "mongoose";
import { env } from "./env";

export const mongoConnect = async () => {
  try {
    await mongoose.connect(env.AUTH_DB_URL, {});
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};
