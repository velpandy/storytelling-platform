const express = require("express");
const { getDb } = require("../db/mongoClient"); // MongoDB utility
const { ObjectId } = require("mongodb");

const router = express.Router();

// Create a new room
router.post("/", async (req, res) => {
    const { name, description, creator, invitedUsers } = req.body; // Ensure 'creator' is passed dynamically
    const db = getDb();
    const roomsCollection = db.collection("rooms");
  
    try {
      const result = await roomsCollection.insertOne({
        name,
        description,
        creator,
        invitedUsers, // Store invited users
        createdAt: new Date(),
      });
      res.status(201).json({ message: "Room created successfully", roomId: result.insertedId });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  });
  
// Get all rooms
router.get("/", async (req, res) => {
  const db = getDb();
  const roomsCollection = db.collection("rooms");

  try {
    const rooms = await roomsCollection.find().toArray();
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Get available users (for invitation)
router.get("/available-users", async (req, res) => {
  const db = getDb();
  const usersCollection = db.collection("users");  // Assuming there is a users collection
  try {
    const users = await usersCollection.find().toArray();
    res.json(users); // Return the list of users
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Get room details (name, description, etc.)
router.get("/:roomId", async (req, res) => {
  const { roomId } = req.params;
  const db = getDb();
  const roomsCollection = db.collection("rooms"); // Use rooms collection here

  try {
    const room = await roomsCollection.findOne({ _id: new ObjectId(roomId) }); // Fetch room details by roomId
    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }
    res.status(200).json({ data: room });
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Post a message in a room
router.post("/:roomId/messages", async (req, res) => {
  const { roomId } = req.params;
  const { userId, username, content } = req.body;
  const db = getDb();
  const messagesCollection = db.collection("messages");

  try {
    await messagesCollection.insertOne({
      roomId: new ObjectId(roomId),
      userId,
      username,
      content,
      replies: [],
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date(),
    });
    res.status(201).json({ message: "Message posted successfully." });
  } catch (error) {
    console.error("Error posting message:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Check if user is invited to the room before allowing them to send a message or join
router.post("/:roomId/join", async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;
  const db = getDb();
  const roomsCollection = db.collection("rooms");

  try {
    if (!ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID format." });
    }

    const room = await roomsCollection.findOne({ _id: new ObjectId(roomId) });
    const stringifiedUserId = userId.toString();

    // Check if room and invited users are valid
    if (Array.isArray(room.invitedUsers) && room.invitedUsers.includes(stringifiedUserId)) {
      res.status(200).json({ message: "User invited. You can join the room." });
    } else {
      res.status(403).json({ message: "You are not invited to this room." });
    }
  } catch (error) {
    console.error("Error checking room invitation:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Get all messages in a room
router.get("/:roomId/messages", async (req, res) => {
  const { roomId } = req.params;
  const db = getDb();
  const messagesCollection = db.collection("messages");

  try {
    if (!ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid room ID format." });
    }

    const messages = await messagesCollection.find({ roomId: new ObjectId(roomId) }).toArray();
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Upvote or downvote a message
router.post("/:roomId/messages/:messageId/vote", async (req, res) => {
  const { messageId } = req.params;
  const { vote } = req.body; // `vote` should be either "upvote" or "downvote"
  const db = getDb();
  const messagesCollection = db.collection("messages");

  try {
    if (!ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID format." });
    }

    const update =
      vote === "upvote"
        ? { $inc: { upvotes: 1 } }
        : { $inc: { downvotes: 1 } };

    await messagesCollection.updateOne({ _id: new ObjectId(messageId) }, update);
    res.json({ message: `${vote} successful.` });
  } catch (error) {
    console.error("Error updating vote:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Add a reply to a message
router.post("/:roomId/messages/:messageId/reply", async (req, res) => {
  const { messageId } = req.params;
  const { userId, username, content } = req.body;
  const db = getDb();
  const messagesCollection = db.collection("messages");

  try {
    if (!ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID format." });
    }

    const reply = {
      userId,
      username,
      content,
      createdAt: new Date(),
    };

    await messagesCollection.updateOne(
      { _id: new ObjectId(messageId) },
      { $push: { replies: reply } }
    );
    res.json({ message: "Reply added successfully." });
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Delete a message (admin privilege)
router.delete("/:roomId/messages/:messageId", async (req, res) => {
  const { roomId, messageId } = req.params;
  const { userId } = req.body; // ID of the user requesting the deletion
  const db = getDb();
  const roomsCollection = db.collection("rooms");
  const messagesCollection = db.collection("messages");

  try {
    if (!ObjectId.isValid(roomId) || !ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    // Check if the user is the room creator
    const room = await roomsCollection.findOne({ _id: new ObjectId(roomId) });
    if (room.creator !== userId) {
      return res.status(403).json({ message: "Only the room creator can delete messages." });
    }

    // Delete the message
    await messagesCollection.deleteOne({ _id: new ObjectId(messageId) });
    res.json({ message: "Message deleted successfully." });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
