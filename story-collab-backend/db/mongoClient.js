const { MongoClient } = require("mongodb");

const uri = "mongodb://mongodb:27017"; // MongoDB connection URI
const client = new MongoClient(uri);

let db;

const connectToDb = async () => {
  try {
    await client.connect();
    db = client.db("storyCollabDB"); // Name of your database
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
};

const getDb = () => {
  if (!db) {
    throw new Error("Database not initialized. Call connectToDb first.");
  }
  return db;
};

module.exports = { connectToDb, getDb };
