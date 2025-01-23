const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const { connectToDb } = require("./db/mongoClient");
const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/rooms");
const collaborateRoutes = require("./routes/collaborate");
const feedbackRoutes = require("./routes/feedback");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000', // Allow frontend origin
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true, // Optional, depending on whether you're using cookies or sessions
  }
});
const PORT = 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());

// Routes
app.use("/api", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/collaborate", collaborateRoutes);
app.use("/feedback", feedbackRoutes); // Include feedback routes

// Real-time collaboration logic using socket.io
io.on("connection", (socket) => {
  console.log("A user connected");

  // Join a specific story room
  socket.on("joinStory", (storyId) => {
    console.log(`User joined story room: ${storyId}`);
    socket.join(storyId); // This joins the room specific to the story ID
  });

  // Handle real-time document updates
  socket.on("edit-document", (storyId, content) => {
    // Broadcast document edit to other users in the same story room
    socket.to(storyId).emit("document-edited", { storyId, content });
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start the server
const startServer = async () => {
  try {
    await connectToDb();
    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
};

startServer();


