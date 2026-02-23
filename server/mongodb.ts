import mongoose from "mongoose";

// MongoDB Connection - Optional, only used if explicitly connected
const mongodbUri = process.env.MONGODB_URI || "";

let isConnected = false;

export async function connectMongoDB() {
  if (!mongodbUri) {
    console.log("⚠ MONGODB_URI not set - MongoDB connection skipped");
    return;
  }

  if (isConnected) {
    console.log("MongoDB already connected");
    return;
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(mongodbUri, {
      maxPoolSize: 10,
      minPoolSize: 5,
    });
    isConnected = true;
    console.log("✓ MongoDB connected successfully");
  } catch (error) {
    console.error("✗ MongoDB connection error:", error);
    throw error;
  }
}

// Handle connection events
mongoose.connection.on("connected", () => {
  console.log("✓ MongoDB connected");
});

mongoose.connection.on("error", (err) => {
  console.error("✗ MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("✗ MongoDB disconnected");
  isConnected = false;
});

export { mongoose };
