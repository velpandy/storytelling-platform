const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const { connectToDb } = require("./db/mongoClient"); // MongoDB connection utility
const authRoutes = require("./routes/auth"); // Authentication routes
const roomRoutes = require("./routes/rooms");
const collaborateRoutes = require("./routes/collaborate");
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
}); // Initialize socket.io with the server
const PORT = 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());
// app.use(express.json());

// Routes
app.use("/api", authRoutes); // Updated the base route to match the React front-end
app.use("/api/rooms", roomRoutes);
app.use("/collaborate", collaborateRoutes);

// Real-time collaboration logic using socket.io
io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle real-time document updates
  socket.on("edit-document", (storyId, content) => {
    // Broadcast document edit to other users
    socket.broadcast.emit("document-edited", { storyId, content });
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start the server
const startServer = async () => {
  try {
    await connectToDb(); // Connect to MongoDB
    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
};

startServer();
