const express = require("express");
const { getDb } = require("../db/mongoClient"); // Import MongoDB utility

const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  const db = getDb();
  const usersCollection = db.collection("users");

  try {
    // Check if email already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists." });
    }

    // Insert the new user into the database
    await usersCollection.insertOne({ username, email, password });
    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const db = getDb();
  const usersCollection = db.collection("users");

  try {
    // Check user credentials
    const user = await usersCollection.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    res.json({ message: "Login successful.", user });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
