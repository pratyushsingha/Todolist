import mongoose from "mongoose";

type connectionObject = {
  isConnected?: number,
};

const connection: connectionObject = {};

async function dbConnect(): Promise<void> {
  if (connection.isConnected) {
    console.log("already connected");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI || '', {});

    connection.isConnected = db.connection.readyState;
    console.log(db.connection.readyState);
    console.log("db connected successfully");
  } catch (error) {
    console.error("db connection failed", error);
    process.exit(1);
  }
}

export default dbConnect;
