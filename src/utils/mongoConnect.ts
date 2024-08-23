import mongoose, { Connection } from "mongoose";

let conn: Connection | null = null;

const mongodbConnect = async (): Promise<Connection | null> => {
  if (conn) {
    return conn;
  }

  try {
    const mongoUrl = process.env.MONGO_DB_URL as string;

    if (!mongoUrl) {
      throw new Error("MONGO_DB_URL does not exist in environment variable");
    }

    conn = await mongoose.createConnection(mongoUrl).asPromise();
    console.log("MongoDB connected successfully");
    return conn;
  } catch (error) {
    console.error("Oops! Something out of normal flow happened:", error);
    return null;
  }
};

export default mongodbConnect;
