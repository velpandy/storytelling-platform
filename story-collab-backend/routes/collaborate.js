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
// Create a new story (genre is an array)
router.post("/stories", async (req, res) => {
  try {
    const db = getDb();
    const { name, description, isPublic, creatorId, genre } = req.body;

    // Validate required fields and ensure genre is a non-empty array
    if (
      !name ||
      !description ||
      creatorId === undefined ||
      !genre ||
      !Array.isArray(genre) ||
      genre.length === 0
    ) {
      return res.status(400).json({ error: "Missing required fields or invalid genre" });
    }

    const newStory = {
      name,
      description,
      isPublic,
      creatorId,
      genre, // Genre is stored as an array
      collaborators: [],
    };

    const result = await db.collection("stories").insertOne(newStory);
    // Manually construct the response using insertedId
    const createdStory = { _id: result.insertedId, ...newStory };
    res.status(201).json(createdStory);
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
    const { storyId, content, username, commitMessage } = req.body; // Include commitMessage

    // Validate the incoming data
    if (!storyId || !content || !username || !commitMessage) { // Validate all fields, including commitMessage
      return res.status(400).json({ error: 'Invalid version data' });
    }

    const newVersion = {
      storyId,
      content,         // Store content in the DB
      username,        // Store username (not userId)
      commitMessage,   // Store commit message
      timestamp: new Date(),  // Store the timestamp of the version
    };

    // Insert the new version into the database
    const result = await db.collection('versions').insertOne(newVersion);

    // Access the inserted document and return it in the response
    const insertedVersion = {
      _id: result.insertedId,
      ...newVersion,
    };

    res.status(201).json(insertedVersion); // Send the inserted version as response
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

// Cast a vote on a version (updated to include storyId)
router.post("/votes", async (req, res) => {
  try {
    const db = getDb();
    const { versionId, storyId, userId, vote } = req.body;

    // Validate input: storyId is now required along with versionId, userId, and a valid vote
    if (!versionId || !storyId || !userId || !["up", "down"].includes(vote)) {
      return res.status(400).json({ error: "Invalid vote data" });
    }

    // Update or insert the vote, including storyId in the vote document
    const result = await db.collection("votes").updateOne(
      { versionId: new ObjectId(versionId), userId }, // Filter by versionId and userId
      { $set: { vote, storyId } }, // Set the vote and include storyId
      { upsert: true } // Insert if it doesn't exist
    );

    // Fetch updated votes summary for the version
    const votes = await db
      .collection("votes")
      .find({ versionId: new ObjectId(versionId) })
      .toArray();

    // Calculate vote counts
    const voteSummary = votes.reduce(
      (summary, { vote }) => {
        if (vote === "up") summary.up += 1;
        else if (vote === "down") summary.down += 1;
        return summary;
      },
      { up: 0, down: 0 }
    );

    // Emit real-time update via socket.io (if implemented)

    res
      .status(200)
      .json({ message: "Vote recorded successfully", votes: voteSummary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cast vote" });
  }
});


// Route to get upvotes and downvotes for a specific version
router.get("/votes/version/:versionId", validateObjectId, async (req, res) => {
  try {
    const db = getDb();
    const { versionId } = req.params;

    // Fetch votes for the given versionId
    const votes = await db
      .collection("votes")
      .find({ versionId: new ObjectId(versionId) })
      .toArray();

    // Calculate vote counts
    const voteSummary = votes.reduce(
      (summary, { vote }) => {
        if (vote === "up") summary.up += 1;  // Increment upvote count
        else if (vote === "down") summary.down += 1;  // Increment downvote count
        return summary;
      },
      { up: 0, down: 0 }  // Initialize counts for upvotes and downvotes
    );

    // Return the aggregated vote counts
    res.status(200).json(voteSummary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch votes" });
  }
});

// Get the most upvoted version for a story
router.get("/versions/most-voted/:storyId", async (req, res) => {
  try {
    const db = getDb();
    const { storyId } = req.params;

    // Aggregate versions with a lookup to join votes and count upvotes
    const mostVotedVersion = await db.collection("versions").aggregate([
      { $match: { storyId: storyId } }, // Filter versions by the given storyId
      {
        $lookup: {
          from: "votes",
          localField: "_id",
          foreignField: "versionId",
          as: "votes"
        }
      },
      {
        $addFields: {
          upvotes: {
            $size: {
              $filter: {
                input: "$votes",
                as: "vote",
                cond: { $eq: ["$$vote.vote", "up"] } // Count only "up" votes
              }
            }
          }
        }
      },
      { $sort: { upvotes: -1 } }, // Sort by the number of upvotes in descending order
      { $limit: 1 } // Limit to the top version
    ]).toArray();

    if (mostVotedVersion.length === 0) {
      return res.status(404).json({ error: "No versions found for this story" });
    }

    res.status(200).json(mostVotedVersion[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch most upvoted version" });
  }
});



module.exports = router;
