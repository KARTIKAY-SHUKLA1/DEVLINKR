/**
 * auth.js — DevLinkr API Routes
 *
 * All user data backed by MongoDB (Mongoose).
 * JWT payload: { id: user._id }
 */

const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const crypto   = require("crypto");

const upload   = require("../utils/cloudinaryUpload");
const sendOtp  = require("../utils/sendOtp");

// MongoDB models
const User           = require("../models/user");
const Otp            = require("../models/otp");
const Message        = require("../models/Message");
const Session        = require("../models/Session");
const { sessionQueue } = require("../queues/sessionQueue");

const {
  authLimiter,
  otpLimiter,
} = require("../middleware/rateLimiter");

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// ══════════════════════════════════════════════════════════════════════════════
// OTP ROUTES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * POST /send-otp
 * Generates and emails a 6-digit OTP. Stored in MongoDB otp collection.
 * Rate limited: 10 requests / 15 min per IP.
 */
router.post("/send-otp", authLimiter, async (req, res) => {
  let { email } = req.body;
  if (!email) return res.status(400).json({ msg: "Email is required" });
  email = email.trim().toLowerCase();

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        msg: "❗ You already have an account. Please login instead.",
      });
    }

    const otpCode   = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await Otp.findOneAndUpdate(
      { email },
      { code: otpCode, expiresAt },
      { upsert: true, new: true }
    );

    await sendOtp(email, otpCode);
    return res.json({ msg: "✅ OTP sent to your email" });
  } catch (err) {
    console.error("❌ Error sending OTP:", err);
    return res.status(500).json({ msg: "❌ Failed to send OTP", error: err.message });
  }
});

/**
 * POST /verify-otp
 * Validates OTP from MongoDB, deletes on success (single-use).
 * Rate limited: 5 requests / 15 min per IP.
 */
router.post("/verify-otp", otpLimiter, async (req, res) => {
  try {
    let { email, code } = req.body;
    email = email?.trim().toLowerCase();
    code  = code?.trim();

    if (!email || !code) {
      return res.status(400).json({ msg: "❌ Email and OTP are required" });
    }

    const otpEntry = await Otp.findOne({ email, code });
    if (!otpEntry) return res.status(400).json({ msg: "❌ Invalid OTP" });

    if (otpEntry.expiresAt < new Date()) {
      await Otp.deleteOne({ email });
      return res.status(400).json({ msg: "⏰ OTP expired" });
    }

    await Otp.deleteOne({ email });
    return res.json({ msg: "✅ OTP verified" });
  } catch (err) {
    console.error("❌ OTP verification error:", err);
    return res.status(500).json({ msg: "Server error during OTP verification" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// SIGNUP
// ══════════════════════════════════════════════════════════════════════════════

router.post("/signup", authLimiter, upload.single("profilePhoto"), async (req, res) => {
  try {
    let { name, email, password, role, college, company, github, experience, remark } = req.body;
    email = email?.trim().toLowerCase();

    // ── Parse skills ─────────────────────────────────────────────────────────
    let skills = [];
    if (req.body.skills) {
      if (Array.isArray(req.body.skills)) {
        skills = req.body.skills.flatMap((item) => {
          try   { const p = JSON.parse(item); return Array.isArray(p) ? p : [p]; }
          catch { return [item.trim()]; }
        });
      } else if (typeof req.body.skills === "string") {
        try   { const p = JSON.parse(req.body.skills); skills = Array.isArray(p) ? p : [p]; }
        catch { skills = req.body.skills.split(",").map((s) => s.trim()); }
      }
    }

    // ── Parse interests ───────────────────────────────────────────────────────
    let interests = [];
    if (req.body.interests) {
      if (Array.isArray(req.body.interests)) {
        interests = req.body.interests.flatMap((item) => {
          try   { const p = JSON.parse(item); return Array.isArray(p) ? p : [p]; }
          catch { return [item.trim()]; }
        });
      } else if (typeof req.body.interests === "string") {
        try   { const p = JSON.parse(req.body.interests); interests = Array.isArray(p) ? p : [p]; }
        catch { interests = req.body.interests.split(",").map((s) => s.trim()); }
      }
    }

    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "❗ Account already exists. Please login." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profilePic     = req.file ? req.file.path : null;

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      college:    role === "student"      ? (college    || "") : "",
      company:    role === "professional" ? (company    || "") : "",
      github:     github     || "",
      experience: experience || "",
      remark:     remark     || "",
      skills,
      interests,
      profilePic,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      user: {
        id:           newUser._id,
        name:         newUser.name,
        email:        newUser.email,
        role:         newUser.role,
        college:      newUser.college,
        company:      newUser.company,
        github:       newUser.github,
        experience:   newUser.experience,
        bio:          newUser.bio,
        skills:       newUser.skills,
        interests:    newUser.interests,
        availability: newUser.availability,
        profilePic:   newUser.profilePic || null,
      },
      redirectTo: "/home",
    });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    return res.status(500).json({ msg: "Server error during signup", error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════════════════

router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email?.trim().toLowerCase() });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      user: {
        id:           user._id,
        name:         user.name,
        email:        user.email,
        role:         user.role,
        college:      user.college,
        company:      user.company,
        github:       user.github,
        experience:   user.experience,
        bio:          user.bio,
        skills:       user.skills,
        interests:    user.interests,
        availability: user.availability,
        profilePic:   user.profilePic || null,
      },
      redirectTo: "/home",
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════════════════════════════════════

router.put("/profile", upload.single("profilePic"), async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ msg: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    let skills = user.skills;
    let interests = user.interests;
    if (req.body.skills) {
      try   { skills = JSON.parse(req.body.skills); }
      catch { skills = []; }
    }
    if (req.body.interests) {
      try   { interests = JSON.parse(req.body.interests); }
      catch { interests = []; }
    }

    user.name         = req.body.name         || user.name;
    user.role         = req.body.role         || user.role;
    user.college      = req.body.college      ?? user.college;
    user.company      = req.body.company      ?? user.company;
    user.availability = req.body.availability ?? user.availability;
    user.experience   = req.body.experience   ?? user.experience;
    user.github       = req.body.github       ?? user.github;
    user.bio          = req.body.bio          ?? user.bio;
    user.skills       = skills;
    user.interests    = interests;
    if (req.file) user.profilePic = req.file.path;

    await user.save();
    res.json({ msg: "✅ Profile updated", profilePic: user.profilePic });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/profile", async (req, res) => {
  const email = req.query.email?.trim().toLowerCase();
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({
      id:           user._id,
      name:         user.name,
      email:        user.email,
      role:         user.role,
      college:      user.college,
      company:      user.company,
      github:       user.github,
      experience:   user.experience,
      bio:          user.bio,
      skills:       user.skills,
      interests:    user.interests,
      availability: user.availability,
      profilePic:   user.profilePic || null,
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// FILE UPLOAD
// ══════════════════════════════════════════════════════════════════════════════

router.post("/upload-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });
    res.status(200).json({ url: req.file.path, type: req.file.mimetype });
  } catch (err) {
    console.error("❌ File upload error:", err);
    res.status(500).json({ msg: "Server error during file upload" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// CONNECTION SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

router.post("/connect-request", async (req, res) => {
  const { from, to } = req.body;
  try {
    const receiver = await User.findOne({ email: to });
    if (!receiver) return res.status(404).json({ msg: "User not found" });

    if (
      !receiver.connectionRequests.includes(from) &&
      !receiver.connections.includes(from)
    ) {
      receiver.connectionRequests.push(from);
      await receiver.save();
    }

    res.json({ msg: "✅ Request sent" });
  } catch (err) {
    console.error("Connect request error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/accept-request", async (req, res) => {
  const { from, to } = req.body;
  try {
    const receiver = await User.findOne({ email: to });
    const sender   = await User.findOne({ email: from });

    if (!receiver || !sender) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!receiver.connections.includes(from)) receiver.connections.push(from);
    if (!sender.connections.includes(to))     sender.connections.push(to);

    receiver.connectionRequests = receiver.connectionRequests.filter((e) => e !== from);

    sender.notifications = sender.notifications || [];
    sender.notifications.push({ type: "accepted", from: to, timestamp: new Date() });

    await receiver.save();
    await sender.save();

    res.json({ msg: "✅ Connected" });
  } catch (err) {
    console.error("Accept request error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/notifications", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ msg: "Email is required" });

  try {
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ msg: "User not found" });

    // 1️⃣ Incoming connection requests
    const requestUsers = await User.find({
      email: { $in: user.connectionRequests || [] },
    }).lean();

    const requests = requestUsers.map((u) => ({
      type: "request",
      from: u.email,
      name: u.name,
      profilePic:  u.profilePic || null,
      timestamp:   new Date(),
    }));

    // 2️⃣ Connected users (with unseen message count)
    const connectionUsers = await User.find({
      email: { $in: user.connections || [] },
    }).lean();

    const connections = await Promise.all(
      connectionUsers.map(async (u) => {
        const unseenCount = await Message.countDocuments({
          sender: u.email, receiver: email, status: { $ne: "seen" },
        });
        return { email: u.email, name: u.name, profilePic: u.profilePic || null, unseenMessages: unseenCount };
      })
    );

    // 3️⃣ Accepted notifications
    const acceptedNotifs = (user.notifications || [])
      .filter((n) => n.type === "accepted")
      .map((n) => ({ type: "accepted", from: n.from, timestamp: n.timestamp }));

    const acceptedUsers = await User.find({
      email: { $in: acceptedNotifs.map((n) => n.from) },
    }).lean();

    const accepted = acceptedNotifs.map((n) => {
      const u = acceptedUsers.find((u) => u.email === n.from);
      return { type: "accepted", from: u?.email || n.from, name: u?.name || n.from, profilePic: u?.profilePic || null, timestamp: n.timestamp };
    });

    const notifications = [...requests, ...accepted].sort(
      (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
    );

    res.status(200).json({ notifications, connections });
  } catch (err) {
    console.error("Notification fetch failed:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// MATCHING
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /match — returns one random best-matching user by skill overlap.
 */
router.get("/match", async (req, res) => {
  const { email } = req.query;
  try {
    const currentUser = await User.findOne({ email });
    if (!currentUser) return res.status(404).json({ msg: "User not found" });

    const userSkills = Array.isArray(currentUser.skills)
      ? currentUser.skills.map((s) => s.toLowerCase())
      : [];

    const exclude = new Set([
      currentUser.email,
      ...currentUser.connections,
      ...currentUser.connectionRequests,
    ]);

    const incomingRequests = await User.find({ connectionRequests: email });
    incomingRequests.forEach((u) => exclude.add(u.email));

    const others = await User.find({ email: { $nin: Array.from(exclude) } });

    const scoredMatches = others
      .map((user) => ({
        user,
        skillMatchCount: Array.isArray(user.skills)
          ? user.skills.filter((s) => userSkills.includes(s.toLowerCase())).length
          : 0,
      }))
      .filter((m) => m.skillMatchCount > 0);

    if (scoredMatches.length === 0) {
      return res.status(404).json({ msg: "No suitable match found" });
    }

    const bestMatches = scoredMatches.filter((m) => m.skillMatchCount >= 3);
    const goodMatches = scoredMatches.filter((m) => m.skillMatchCount < 3);
    const pool = bestMatches.length > 0 ? bestMatches : goodMatches;
    const selected = pool[Math.floor(Math.random() * pool.length)].user;

    res.json({
      name:         selected.name,
      email:        selected.email,
      role:         selected.role,
      college:      selected.college,
      company:      selected.company,
      skills:       selected.skills || [],
      interests:    selected.interests || [],
      availability: selected.availability,
      github:       selected.github,
      profilePic:   selected.profilePic || null,
    });
  } catch (err) {
    console.error("❌ Error in /match route:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /matches — paginated list of all scored matches.
 *
 * Query params: email, limit (default 10, max 50), offset (default 0)
 * Response: { matches[], total, limit, offset, hasMore }
 */
router.get("/matches", async (req, res) => {
  const { email } = req.query;
  const limit  = Math.min(parseInt(req.query.limit,  10) || 10, 50);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0,  0);

  try {
    const currentUser = await User.findOne({ email });
    if (!currentUser) return res.status(404).json({ msg: "User not found" });

    const userSkills = Array.isArray(currentUser.skills)
      ? currentUser.skills.map((s) => s.toLowerCase())
      : [];

    const exclude = new Set([
      currentUser.email,
      ...currentUser.connections,
      ...currentUser.connectionRequests,
    ]);
    const incomingRequests = await User.find({ connectionRequests: email });
    incomingRequests.forEach((u) => exclude.add(u.email));

    const others = await User.find({ email: { $nin: Array.from(exclude) } }).lean();

    const scored = others
      .map((u) => ({
        user: u,
        skillMatchCount: Array.isArray(u.skills)
          ? u.skills.filter((s) => userSkills.includes(s.toLowerCase())).length
          : 0,
      }))
      .filter((m) => m.skillMatchCount > 0)
      .sort((a, b) => b.skillMatchCount - a.skillMatchCount);

    const total = scored.length;
    const page  = scored.slice(offset, offset + limit);

    const matches = page.map(({ user: u, skillMatchCount }) => ({
      name:           u.name,
      email:          u.email,
      role:           u.role,
      college:        u.college,
      company:        u.company,
      skills:         u.skills || [],
      interests:      u.interests || [],
      availability:   u.availability,
      github:         u.github,
      profilePic:     u.profilePic || null,
      skillMatchCount,
    }));

    res.json({ matches, total, limit, offset, hasMore: offset + limit < total });
  } catch (err) {
    console.error("❌ Error in /matches route:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// DEV CHAT
// ══════════════════════════════════════════════════════════════════════════════

router.post("/send-message", async (req, res) => {
  const { sender, receiver, message } = req.body;
  try {
    if (!sender || !receiver || !message) {
      return res.status(400).json({ msg: "Missing required fields" });
    }
    const newMsg = await Message.create({ sender, receiver, message, status: "sent" });
    res.status(201).json(newMsg);
  } catch (err) {
    res.status(500).json({ msg: "Server error while sending message" });
  }
});

/**
 * GET /chat-history — cursor-based pagination.
 * Query params: user1, user2, limit (default 20, max 100), cursor (<lastId>)
 * Response: { messages[], nextCursor }
 */
router.get("/chat-history", async (req, res) => {
  const { user1, user2, cursor } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  try {
    const baseFilter = {
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    };
    if (cursor) baseFilter._id = { $lt: cursor };

    const messages = await Message.find(baseFilter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();
    messages.reverse();

    const nextCursor = hasMore ? messages[0]._id.toString() : null;
    res.json({ messages, nextCursor });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/mark-seen", async (req, res) => {
  const { sender, receiver } = req.body;
  try {
    await Message.updateMany(
      { sender, receiver, status: { $ne: "seen" } },
      { $set: { status: "seen" } }
    );
    res.json({ msg: "Messages marked as seen" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PAIR PROGRAMMING SESSIONS
// ══════════════════════════════════════════════════════════════════════════════

router.post("/save-session", async (req, res) => {
  const { room, code, language } = req.body;
  if (!room || !code) return res.status(400).json({ msg: "Missing room or code" });

  try {
    const session = await Session.findOneAndUpdate(
      { room },
      { code, language },
      { upsert: true, new: true }
    );

    // BullMQ: async post-session analysis
    await sessionQueue.add("analyzeSession", { room, code, language });
    console.log(`📋 BullMQ: analyzeSession job queued for room: ${room}`);

    res.json({ msg: "✅ Session saved", session });
  } catch (err) {
    console.error("❌ Error saving session:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/load-session", async (req, res) => {
  const { room } = req.query;
  try {
    if (!room) return res.status(400).json({ msg: "Room ID missing" });
    const saved = await Session.findOne({ room });
    if (!saved) return res.status(404).json({ msg: "No saved session found" });
    res.json({ code: saved.code, language: saved.language });
  } catch (err) {
    console.error("❌ Error loading session:", err);
    res.status(500).json({ msg: "Server error while loading session" });
  }
});

module.exports = router;
