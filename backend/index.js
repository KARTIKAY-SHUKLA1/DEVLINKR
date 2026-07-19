const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");

// ─── Redis + BullMQ ───────────────────────────────────────────────────────────
// Import the shared Redis client first so it connects before anything else uses it.
const redis = require("./utils/redis");

// Importing sessionQueue also boots the BullMQ Worker — the worker starts
// listening for jobs as soon as this module is required.
const { sessionQueue, sessionWorker } = require("./queues/sessionQueue");


// ─── Rate Limiter ─────────────────────────────────────────────────────────────
const { roomLimiter } = require("./middleware/rateLimiter");

dotenv.config();

const app = express();
const server = http.createServer(app);

// ─── CORS ─────────────────────────────────────────────────────────────────────
// The stable Vercel production URL is always allowed regardless of env.
// FRONTEND_URL can override/extend this for staging or custom domains.
const STABLE_PROD_URL = "https://devlinkr-tau.vercel.app";
const FRONTEND_URL    = process.env.FRONTEND_URL || STABLE_PROD_URL;

/**
 * Returns true for any origin that should be allowed.
 *
 * Permitted:
 *  • No origin at all      — curl, Postman, server-to-server
 *  • STABLE_PROD_URL       — always-on Vercel production domain
 *  • FRONTEND_URL          — additional origin from env (staging, custom domain)
 *  • Preview deploy URLs   — pattern: *-kartikay-shuklas-projects.vercel.app
 *  • http://localhost:5173 — Vite dev server
 *  • http://localhost:5000 — local backend (Postman via browser)
 */
function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (origin === STABLE_PROD_URL) return true;
  if (origin === FRONTEND_URL) return true;
  if (origin === "http://localhost:5173") return true;
  if (origin === "http://localhost:5000") return true;
  // Matches every Vercel preview URL for this project, e.g.:
  //   https://devlinkr-19wehye5a-kartikay-shuklas-projects.vercel.app
  if (/^https:\/\/.+-kartikay-shuklas-projects\.vercel\.app$/.test(origin)) return true;
  return false;
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.warn(`⛔ CORS blocked origin: ${origin}`);
      callback(new Error(`CORS policy: origin not allowed — ${origin}`));
    }
  },
  credentials: true,
};

// ✅ APPLY CORS TO EXPRESS
app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ SOCKET.IO WITH SAME CORS
const io = new Server(server, {
  cors: corsOptions
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    message: "DevLinkr backend healthy"
  });
});

// ─── Redis Presence Helpers ───────────────────────────────────────────────────
// Room presence is stored in Redis as a Set per room.
// Key pattern:  room:{roomId}:users
// This survives server restarts and scales across multiple server instances,
// unlike the old in-memory roomUsers object.

const ROOM_KEY = (roomId) => `room:${roomId}:users`;

async function addUserToRoom(roomId, name) {
  await redis.sadd(ROOM_KEY(roomId), name);
}

async function removeUserFromRoom(roomId, name) {
  await redis.srem(ROOM_KEY(roomId), name);
}

async function getUsersInRoom(roomId) {
  return redis.smembers(ROOM_KEY(roomId));
}

// ─── In-memory map: socketId → { email, rooms[] } ────────────────────────────
// Still in-memory for the direct-message chat (unchanged behaviour).
const connectedUsers = new Map();

// Map socketId → list of rooms joined (needed for cleanup on disconnect)
const socketRooms = new Map();

// ─── REST endpoint: online users in a room ────────────────────────────────────
/**
 * GET /rooms/:roomId/online-users
 * Returns the list of users currently present in the given collaborative room.
 * Backed by Redis — accurate across restarts / horizontal scaling.
 */
app.get("/rooms/:roomId/online-users", roomLimiter, async (req, res) => {
  try {
    const { roomId } = req.params;
    const users = await getUsersInRoom(roomId);
    res.json({ roomId, onlineUsers: users, count: users.length });
  } catch (err) {
    console.error("❌ Error fetching room users:", err.message);
    res.status(500).json({ msg: "Failed to fetch online users" });
  }
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────
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

  // ─── Pair programming — Redis-backed presence ──────────────────────────────
  socket.on("joinRoom", async ({ room, name }) => {
    socket.join(room);
    console.log(`🛠️ ${name} (${socket.id}) joined room: ${room}`);

    // Track which rooms this socket is in (for cleanup on disconnect)
    if (!socketRooms.has(socket.id)) socketRooms.set(socket.id, []);
    const rooms = socketRooms.get(socket.id);
    if (!rooms.includes(room)) rooms.push(room);

    // Store the user's name on the socket so disconnect can clean it up
    socket.data.name = name;

    // Persist to Redis
    await addUserToRoom(room, name);

    // Broadcast updated user list
    const users = await getUsersInRoom(room);
    io.to(room).emit("joinedUsers", users);
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

  // ─── Disconnect: clean up Redis presence ──────────────────────────────────
  socket.on("disconnect", async () => {
    // Clean up chat user map
    for (let [email, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(email);
        console.log("🔴 Disconnected:", email);
        break;
      }
    }

    // Remove from Redis room sets and notify each room
    const rooms = socketRooms.get(socket.id) || [];
    const name  = socket.data.name;
    if (name) {
      await Promise.all(
        rooms.map(async (room) => {
          await removeUserFromRoom(room, name);
          const users = await getUsersInRoom(room);
          io.to(room).emit("joinedUsers", users);
        })
      );
    }
    socketRooms.delete(socket.id);

    io.emit("onlineUsers", Array.from(connectedUsers.keys()));
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// ─── MongoDB connection ───────────────────────────────────────────────────────
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

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
