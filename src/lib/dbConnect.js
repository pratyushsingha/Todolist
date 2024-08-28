import mongoose from "mongoose";

const connection = {};

async function dbConnect() {
  if (connection.isConnected) {
    console.log("already connected");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    connection.isConnected = db.connection.readyState;
    console.log(db.connection.readyState)
    console.log("db connected successfully");
  } catch (error) {
    console.error("db connection failed", error);
    process.exit(1);
  }
}

export default dbConnect;
