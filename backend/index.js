const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "https://devlinkr-git-main-kartikay-shuklas-projects.vercel.app",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST"]
  }
});

// Global in-memory stores
const connectedUsers = new Map(); // email -> socket.id
const roomUsers = {}; // room -> [user names]

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // Register user by email (chat)
  socket.on("register", (email) => {
    connectedUsers.set(email, socket.id);
    console.log("✅ Registered user:", email);

    io.emit("onlineUsers", Array.from(connectedUsers.keys()));
  });

  // Typing indicator (chat)
  socket.on("typing", (receiverEmail) => {
    const receiverSocket = connectedUsers.get(receiverEmail);
    if (receiverSocket) {
      const senderEmail = [...connectedUsers.entries()].find(([_, id]) => id === socket.id)?.[0];
      io.to(receiverSocket).emit("typing", { from: senderEmail });
    }
  });

  // Chat message send
  socket.on("sendMessage", async ({ to, messageData }) => {
    const receiverSocket = connectedUsers.get(to);

    if (receiverSocket) {
      try {
        await Message.findOneAndUpdate(
          {
            sender: messageData.sender,
            receiver: messageData.receiver,
            message: messageData.message,
          },
          { status: "delivered" }
        );

        io.to(receiverSocket).emit("newMessage", {
          ...messageData,
          status: "delivered",
        });

        console.log(`📨 Message delivered to ${to}`);
      } catch (err) {
        console.error("Error updating delivery status:", err);
      }
    } else {
      console.log(`⚠️ User ${to} is not connected`);
    }
  });

  // Seen status
  socket.on("markSeen", async ({ sender, receiver }) => {
    try {
      await Message.updateMany(
        { sender, receiver, status: { $ne: "seen" } },
        { $set: { status: "seen" } }
      );

      const senderSocketId = connectedUsers.get(sender);
      if (senderSocketId) {
        io.to(senderSocketId).emit("statusUpdated", { sender, receiver });
      }
    } catch (err) {
      console.log("Error marking seen:", err);
    }
  });

  // ✅ Join a pair programming room
  socket.on("joinRoom", ({ room, name }) => {
    socket.join(room);
    console.log(`🛠️ ${name} (${socket.id}) joined room: ${room}`);

    // Track users in room
    if (!roomUsers[room]) roomUsers[room] = [];
    if (!roomUsers[room].includes(name)) roomUsers[room].push(name);

    // Send updated user list to everyone in room
    io.to(room).emit("joinedUsers", roomUsers[room]);
  });

  // ✅ Handle code update (broadcast to others in room)
  socket.on("codeUpdate", ({ room, code }) => {
    socket.to(room).emit("codeUpdate", { room, code });
  });

  // ✅ Cursor movement in editor
  socket.on("cursorMove", ({ room, position }) => {
    socket.to(room).emit("cursorMove", { position });
  });

  // ✅ Typing indicator in PairProgramming chat
  socket.on("typing", ({ room, name }) => {
    socket.to(room).emit("userTyping", name);
  });

  // ✅ Message in PairProgramming chat
  socket.on("newMessage", (msg) => {
    const { room } = msg;
    if (room) {
      socket.to(room).emit("newMessage", msg);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    // Remove from connectedUsers
    for (let [email, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(email);
        console.log("🔴 Disconnected:", email);
        break;
      }
    }

    // Remove user from all rooms
    for (let room in roomUsers) {
      // Note: without user-name mapping to socket id, we can't reliably remove disconnected user names
      // This is a best-effort approach - you can improve by mapping socket.id -> username on join
      io.to(room).emit("joinedUsers", roomUsers[room]);
    }

    io.emit("onlineUsers", Array.from(connectedUsers.keys()));
  });
});

// Middleware
app.use(cors({
  origin: [
    "https://devlinkr-git-main-kartikay-shuklas-projects.vercel.app",
    "http://localhost:5173"
  ]
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err);
    process.exit(1);
  });

// Root test route
app.get("/", (req, res) => {
  res.send("🚀 DevLinkr backend is running!");
});

// Server start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
