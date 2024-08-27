import mongoose from "mongoose";
const connection = {};

async function dbConnect() {
  if (connection.isConnected) {
    console.log("db already connected");
    return;
  }
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI || "", {});
    connection.isConnected = db.connection[0].readyState;
    console.log("db connected successfully");
  } catch (error) {
    console.log("db connection failed");
    process.exit(1);
  }
}

export default dbConnect;
