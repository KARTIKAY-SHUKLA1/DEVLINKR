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

// ✅ ALLOWED ORIGINS
const allowedOrigins = [
  "https://devlinkr-git-main-kartikay-shuklas-projects.vercel.app",
  "https://devlinkr-tau.vercel.app",
  "http://localhost:5173"
];

// ✅ SHARED CORS OPTIONS
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS Not Allowed"));
    }
  },
  credentials: true
};

// ✅ APPLY CORS TO EXPRESS
app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ SOCKET.IO WITH SAME CORS
const io = new Server(server, {
  cors: corsOptions
});

// ✅ GLOBAL STORES
const connectedUsers = new Map();
const roomUsers = {};

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // Register user for chat
  socket.on("register", (email) => {
    connectedUsers.set(email, socket.id);
    console.log("✅ Registered user:", email);
    io.emit("onlineUsers", Array.from(connectedUsers.keys()));
  });

  socket.on("typing", (receiverEmail) => {
    const receiverSocket = connectedUsers.get(receiverEmail);
    if (receiverSocket) {
      const senderEmail = [...connectedUsers.entries()].find(([_, id]) => id === socket.id)?.[0];
      io.to(receiverSocket).emit("typing", { from: senderEmail });
    }
  });

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

  // Pair programming
  socket.on("joinRoom", ({ room, name }) => {
    socket.join(room);
    console.log(`🛠️ ${name} (${socket.id}) joined room: ${room}`);

    if (!roomUsers[room]) roomUsers[room] = [];
    if (!roomUsers[room].includes(name)) roomUsers[room].push(name);

    io.to(room).emit("joinedUsers", roomUsers[room]);
  });

  socket.on("codeUpdate", ({ room, code }) => {
    socket.to(room).emit("codeUpdate", { room, code });
  });

  socket.on("cursorMove", ({ room, position }) => {
    socket.to(room).emit("cursorMove", { position });
  });

  socket.on("typing", ({ room, name }) => {
    socket.to(room).emit("userTyping", name);
  });

  socket.on("newMessage", (msg) => {
    const { room } = msg;
    if (room) {
      socket.to(room).emit("newMessage", msg);
    }
  });

  socket.on("disconnect", () => {
    for (let [email, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(email);
        console.log("🔴 Disconnected:", email);
        break;
      }
    }

    for (let room in roomUsers) {
      io.to(room).emit("joinedUsers", roomUsers[room]);
    }

    io.emit("onlineUsers", Array.from(connectedUsers.keys()));
  });
});

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

// Root
app.get("/", (req, res) => {
  res.send("🚀 DevLinkr backend is running!");
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
