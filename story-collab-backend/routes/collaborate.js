const express = require("express");
const { ObjectId } = require("mongodb");
const { getDb } = require("../db/mongoClient");
const router = express.Router();

// Middleware to validate ObjectId
const validateObjectId = (req, res, next) => {
  const { storyId } = req.params;
  if (storyId && !ObjectId.isValid(storyId)) {
    return res.status(400).json({ error: "Invalid story ID format" });
  }
  next();
};

// Get all stories
router.get("/stories", async (req, res) => {
  try {
    
    const db = getDb();
    const stories = await db.collection("stories").find().toArray();
    res.status(200).json(stories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});

// Create a new story
router.post("/stories", async (req, res) => {
  try {
    const db = getDb();
    const { name, description, isPublic, creatorId } = req.body;

    if (!name || !description || creatorId === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newStory = {
      name,
      description,
      isPublic,
      creatorId,
      collaborators: [],
    };

    const result = await db.collection("stories").insertOne(newStory);
    res.status(201).json(result.ops[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create story" });
  }
});

// Request to collaborate (for private stories)
router.post("/collaborate/request", async (req, res) => {
  try {
    const db = getDb();
    const { storyId, userId } = req.body;

    if (!storyId || !userId) {
      return res.status(400).json({ error: "Invalid collaboration request data" });
    }

    const story = await db.collection("stories").findOne({ _id: new ObjectId(storyId) });

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }
    if (story.isPublic) {
      return res.status(400).json({ error: "Collaboration not required for public stories" });
    }

    const request = {
      storyId: new ObjectId(storyId),
      userId,
      status: "pending",
    };

    const result = await db.collection("collaborators").insertOne(request);
    res.status(201).json(result.ops[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to request collaboration" });
  }
});

// Approve or deny collaboration requests
router.post("/collaborate/respond", async (req, res) => {
  try {
    const db = getDb();
    const { requestId, status } = req.body;

    if (!requestId || !["approved", "denied"].includes(status)) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    const request = await db.collection("collaborators").findOneAndUpdate(
      { _id: new ObjectId(requestId) },
      { $set: { status } },
      { returnOriginal: false }
    );

    if (status === "approved") {
      await db.collection("stories").updateOne(
        { _id: request.value.storyId },
        { $addToSet: { collaborators: request.value.userId } }
      );
    }

    res.status(200).json(request.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to respond to collaboration request" });
  }
});

// Save a new version of a story
router.post('/versions', async (req, res) => {
  try {
    const db = getDb();
    const { storyId, content, userId } = req.body;

    if (!storyId || !content || !userId) {
      return res.status(400).json({ error: 'Invalid version data' });
    }
    
    const newVersion = {
      storyId,
      content,
      userId,
      timestamp: new Date(),
    };

    const result = await db.collection('versions').insertOne(newVersion);
    
    // Access inserted document from result.ops or directly use result.insertedId
    const insertedVersion = {
      _id: result.insertedId,
      ...newVersion,
    };

    res.status(201).json(insertedVersion);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save version' });
  }
});


// Get version history for a story
router.get("/versions/:storyId", validateObjectId, async (req, res) => {
  try {
    const db = getDb();
    const { storyId } = req.params;

    const versions = await db
      .collection("versions")
      .find({ storyId: storyId })
      .sort({ timestamp: 1 })
      .toArray();

    res.status(200).json(versions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch versions" });
  }
});

// Cast a vote on a story
router.post("/votes", async (req, res) => {
  try {
    const db = getDb();
    const { storyId, userId, vote } = req.body;

    if (!storyId || !userId || !["up", "down"].includes(vote)) {
      return res.status(400).json({ error: "Invalid vote data" });
    }

    const result = await db.collection("votes").updateOne(
      { storyId: new ObjectId(storyId), userId },
      { $set: { vote } },
      { upsert: true }
    );

    res.status(200).json({ message: "Vote recorded successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cast vote" });
  }
});

// Get votes for a story
router.get("/votes/:storyId", validateObjectId, async (req, res) => {
  try {
    const db = getDb();
    const { storyId } = req.params;

    const votes = await db.collection("votes").find({ storyId: new ObjectId(storyId) }).toArray();
    const voteSummary = votes.reduce(
      (summary, { vote }) => {
        if (vote === "up") summary.up += 1;
        else if (vote === "down") summary.down += 1;
        return summary;
      },
      { up: 0, down: 0 }
    );

    res.status(200).json(voteSummary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch votes" });
  }
});

module.exports = router;
