const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message"); // ✅ Import Message model

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // 🔗 Your frontend origin
    methods: ["GET", "POST"],
  },
});

// 🧠 In-memory store for connected users
const connectedUsers = new Map();

// 🔌 Socket.IO logic
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // ✅ Register user with their email
  socket.on("register", (email) => {
    connectedUsers.set(email, socket.id);
    console.log("✅ Registered user:", email);

    // 🔁 Notify all clients of online users
    io.emit("onlineUsers", Array.from(connectedUsers.keys()));
  });

  // ✅ Typing Indicator (Optional: frontend can emit 'typing')
  socket.on("typing", (receiverEmail) => {
    const receiverSocket = connectedUsers.get(receiverEmail);
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", {
        from: [...connectedUsers.entries()].find(([_, id]) => id === socket.id)?.[0],
      });
    }
  });

  // ✅ Real-time message delivery with "delivered" status
  socket.on("sendMessage", async ({ to, messageData }) => {
    const receiverSocket = connectedUsers.get(to);

    if (receiverSocket) {
      try {
        // Mark message as delivered in DB
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

  // ✅ Seen status
  socket.on("markSeen", async ({ sender, receiver }) => {
  try {
    await Message.updateMany(
      { sender, receiver, status: { $ne: "seen" } },
      { $set: { status: "seen" } }
    );

    // 🔁 Notify sender to update status on their frontend (optional)
    const senderSocketId = onlineUsers[sender]; // Assuming you track online users like: { email: socket.id }
    if (senderSocketId) {
      io.to(senderSocketId).emit("statusUpdated", { sender, receiver });
    }

  } catch (err) {
    console.log("Error marking seen:", err);
  }
});


  // ✅ Cleanup on disconnect
  socket.on("disconnect", () => {
    for (let [email, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(email);
        console.log("🔴 Disconnected:", email);
        break;
      }
    }

    // 🔁 Update online users for all clients
    io.emit("onlineUsers", Array.from(connectedUsers.keys()));
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// DB Connection
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

// Test route
app.get("/", (req, res) => {
  res.send("🚀 DevMeet backend is running!");
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
