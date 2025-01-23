const express = require("express");
const { ObjectId } = require("mongodb");
const { getDb } = require("../db/mongoClient");
const router = express.Router();

// Submit feedback for a story
router.post("/submit", async (req, res) => {
  try {
    const db = getDb();
    const { storyId, content, rating, userId, userName } = req.body; // Expecting userId and userName

    // Check if required fields are provided
    if (!storyId || !content || rating === undefined || !userId || !userName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate rating range (e.g., 1 to 5)
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Create the feedback document
    const newFeedback = {
      storyId: new ObjectId(storyId),
      content,
      rating,
      userId: new ObjectId(userId),
      userName,
      timestamp: new Date(),
    };

    // Insert feedback into database
    const result = await db.collection("feedbacks").insertOne(newFeedback);
    const insertedFeedback = { _id: result.insertedId, ...newFeedback };

    res.status(201).json(insertedFeedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

// Get feedbacks for a specific story
router.get("/:storyId", async (req, res) => {
  try {
    const db = getDb();
    const { storyId } = req.params;

    // Fetch feedbacks for the story
    const feedbacks = await db
      .collection("feedbacks")
      .find({ storyId: new ObjectId(storyId) })
      .sort({ timestamp: -1 })
      .toArray();

    res.status(200).json(feedbacks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch feedbacks" });
  }
});

module.exports = router;
