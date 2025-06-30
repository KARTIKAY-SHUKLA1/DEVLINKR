const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const User = require("../models/user");
const Otp = require("../models/otp");
const sendOtp = require("../utils/sendOtp");
const Message = require("../models/Message");
const Session = require("../models/Session"); // 👈 for saving pair programming sessions

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// ------------------ Ensure Upload Directories Exist ------------------
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
const chatUploadPath = path.join("uploads", "chat");
if (!fs.existsSync(chatUploadPath)) fs.mkdirSync(chatUploadPath, { recursive: true });

// ------------------ MULTER SETUP ------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isChatUpload = req.originalUrl.includes("upload-file");
    const dest = isChatUpload ? "uploads/chat/" : "uploads/";
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.originalname.split(".")[0].replace(/\s+/g, "_");
    cb(null, `${name}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// ------------------ OTP Routes ------------------
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: "Email is required" });

  const otpCode = crypto.randomInt(100000, 999999).toString();

  try {
    await Otp.findOneAndUpdate(
      { email },
      { code: otpCode, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
      { upsert: true, new: true }
    );
    await sendOtp(email, otpCode);
    res.json({ msg: "✅ OTP sent to your email" });
  } catch (err) {
    console.error("❌ Error sending OTP:", err);
    res.status(500).json({ msg: "❌ Failed to send OTP" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    let { email, code } = req.body;
    email = email?.trim().toLowerCase();
    code = code?.trim();

    if (!email || !code) return res.status(400).json({ msg: "❌ Email and OTP are required" });

    const otpEntry = await Otp.findOne({ email, code });
    if (!otpEntry) return res.status(400).json({ msg: "❌ Invalid OTP" });

    if (otpEntry.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpEntry._id });
      return res.status(400).json({ msg: "⏰ OTP expired" });
    }

    await Otp.deleteOne({ _id: otpEntry._id });
    return res.json({ msg: "✅ OTP verified" });
  } catch (err) {
    console.error("❌ OTP verification error:", err);
    return res.status(500).json({ msg: "Server error during OTP verification" });
  }
});

// ------------------ Signup/Login/Profile ------------------
router.post("/signup", upload.single("profilePhoto"), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      college,
      company,
      github,
      experience,
      remark,
    } = req.body;

    const skills = Array.isArray(req.body.skills)
      ? req.body.skills.map((s) => s.trim())
      : typeof req.body.skills === "string"
      ? req.body.skills.split(",").map((s) => s.trim())
      : [];

    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      college: role === "student" ? college : "",
      company: role === "professional" ? company : "",
      github,
      experience,
      remark,
      skills,
      profilePic: req.file ? `/uploads/${req.file.filename}` : undefined,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      user: {
        name: newUser.name,
        email: newUser.email,
        profilePic: newUser.profilePic,
      },
      redirectTo: "/home",
    });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    return res.status(500).json({ msg: "Server error during signup", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        company: user.company,
        github: user.github,
        experience: user.experience,
        skills: user.skills,
        interests: user.interests,
        availability: user.availability,
        bio: user.bio,
        profilePic: user.profilePic || null,
      },
      redirectTo: "/home",
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.put("/profile", upload.single("profilePic"), async (req, res) => {
  const {
    email,
    skills,
    interests,
    availability,
    experience,
    github,
    bio,
  } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (skills) user.skills = skills.split(",").map((s) => s.trim());
    if (interests) user.interests = interests.split(",").map((i) => i.trim());
    if (availability) user.availability = availability;
    if (experience) user.experience = experience;
    if (github) user.github = github;
    if (bio) user.bio = bio;
    if (req.file) user.profilePic = `/uploads/${req.file.filename}`;

    await user.save();
    res.json({ msg: "✅ Profile updated", profilePic: user.profilePic });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/profile", async (req, res) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ email }).select("-password -otp -__v");
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ------------------ Connection System ------------------
router.post("/connect-request", async (req, res) => {
  const { from, to } = req.body;

  try {
    const receiver = await User.findOne({ email: to });
    if (!receiver) return res.status(404).json({ msg: "User not found" });

    if (!receiver.connectionRequests.includes(from) && !receiver.connections.includes(from)) {
      receiver.connectionRequests.push(from);
      await receiver.save();
    }

    res.json({ msg: "✅ Request sent" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/accept-request", async (req, res) => {
  const { from, to } = req.body;

  try {
    const receiver = await User.findOne({ email: to });
    const sender = await User.findOne({ email: from });

    if (!receiver || !sender) return res.status(404).json({ msg: "User not found" });

    receiver.connections.push(from);
    sender.connections.push(to);
    receiver.connectionRequests = receiver.connectionRequests.filter((e) => e !== from);

    await receiver.save();
    await sender.save();

    res.json({ msg: "✅ Connected" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/notifications", async (req, res) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const requestUsers = await User.find({ email: { $in: user.connectionRequests } });
    const requests = requestUsers.map(u => ({ email: u.email, name: u.name }));

    const connectionUsers = await User.find({ email: { $in: user.connections } });
    const connections = connectionUsers.map(u => ({
      email: u.email,
      name: u.name,
      profilePic: u.profilePic || "/uploads/default-profile.png"
    }));

    res.json({ requests, connections });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ------------------ Dev Matching ------------------
router.get("/match", async (req, res) => {
  const { email } = req.query;
  try {
    const currentUser = await User.findOne({ email });
    if (!currentUser) return res.status(404).json({ msg: "User not found" });

    const exclude = new Set([
      currentUser.email,
      ...currentUser.connections,
      ...currentUser.connectionRequests,
    ]);

    const incomingRequests = await User.find({ connectionRequests: email });
    incomingRequests.forEach(u => exclude.add(u.email));

    const others = await User.find({ email: { $nin: [...exclude] } });
    const matches = others
      .map(user => {
        const skillMatch = user.skills?.filter(s => currentUser.skills.includes(s)).length || 0;
        const interestMatch = user.interests?.filter(i => currentUser.interests.includes(i)).length || 0;
        return { user, score: skillMatch + interestMatch };
      })
      .filter(e => e.score > 0);

    if (matches.length === 0) return res.status(404).json({ msg: "No suitable match found" });

    const bestMatch = matches[Math.floor(Math.random() * matches.length)].user;

    res.json({
      name: bestMatch.name,
      email: bestMatch.email,
      role: bestMatch.role,
      college: bestMatch.college,
      company: bestMatch.company,
      skills: bestMatch.skills,
      interests: bestMatch.interests,
      availability: bestMatch.availability,
      github: bestMatch.github,
      profilePic: bestMatch.profilePic || null,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ------------------ Dev Chat ------------------
router.post("/send-message", async (req, res) => {
  const { sender, receiver, message } = req.body;

  try {
    if (!sender || !receiver || !message) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const newMsg = await Message.create({
      sender,
      receiver,
      message,
      status: "sent",
    });

    res.status(201).json(newMsg);
  } catch (err) {
    res.status(500).json({ msg: "Server error while sending message" });
  }
});

router.get("/chat-history", async (req, res) => {
  const { user1, user2 } = req.query;

  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
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

// ------------------ File Upload for Chat ------------------
router.post("/upload-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    const fileUrl = `/uploads/chat/${req.file.filename}`;
    const fileType = req.file.mimetype;

    res.status(200).json({ url: fileUrl, type: fileType });
  } catch (err) {
    console.error("❌ File upload error:", err);
    res.status(500).json({ msg: "Server error during file upload" });
  }
});
// ------------------ Save Pair Programming Session ------------------
router.post("/save-session", async (req, res) => {
  const { room, code, language } = req.body;

  if (!room || !code) {
    return res.status(400).json({ msg: "Missing room or code" });
  }

  try {
    const session = await Session.findOneAndUpdate(
      { room },
      { code, language },
      { upsert: true, new: true }
    );

    res.json({ msg: "✅ Session saved", session });
  } catch (err) {
    console.error("❌ Error saving session:", err);
    res.status(500).json({ msg: "Server error" });
  }
});
// ✅ Load saved session content by room
router.get("/load-session", async (req, res) => {
  const { room } = req.query;

  try {
    if (!room) return res.status(400).json({ msg: "Room ID missing" });

    const Session = require("../models/Session");
    const saved = await Session.findOne({ room });

    if (!saved) return res.status(404).json({ msg: "No saved session found" });

    res.json({
      code: saved.code,
      language: saved.language,
    });
  } catch (err) {
    console.error("❌ Error loading session:", err);
    res.status(500).json({ msg: "Server error while loading session" });
  }
});


module.exports = router;
