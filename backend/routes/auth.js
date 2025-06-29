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

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// ------------------ MULTER SETUP ------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.originalname.split(".")[0];
    cb(null, `${name}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// ------------------ POST /send-otp ------------------
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

// ------------------ POST /verify-otp ------------------
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

// ------------------ POST /signup ------------------
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
// ------------------ POST /login ------------------
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
        profilePic: user.profilePic || null,  // ✅ This is crucial
      },
      redirectTo: "/home",
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
// ------------------ PUT /profile ------------------
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

    if (req.file) {
      user.profilePic = `/uploads/${req.file.filename}`;
    }

    await user.save();
    res.json({ msg: "✅ Profile updated", profilePic: user.profilePic });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ------------------ GET /profile ------------------
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

  if (!from || !to) return res.status(400).json({ msg: "Missing fields" });

  try {
    const receiver = await User.findOne({ email: to });
    if (!receiver) return res.status(404).json({ msg: "User not found" });

    if (!receiver.connectionRequests.includes(from) && !receiver.connections.includes(from)) {
      receiver.connectionRequests.push(from);
      await receiver.save();
    }

    res.json({ msg: "✅ Request sent" });
  } catch (err) {
    console.error(err);
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
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/notifications", async (req, res) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Fetch details of users who sent connection requests
    const requestUsers = await User.find({ email: { $in: user.connectionRequests } });
    const requests = requestUsers.map(u => ({ email: u.email, name: u.name }));

    // Fetch details of connected users
    const connectionUsers = await User.find({ email: { $in: user.connections } });
    const connections = connectionUsers.map(u => ({
  email: u.email,
  name: u.name,
  profilePic: u.profilePic || "/uploads/default-profile.png"
}));


    res.json({ requests, connections });
  } catch (err) {
    console.error("Notification fetch error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ------------------ Dev Matching ------------------
router.get("/match", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ msg: "Missing email" });

  try {
    const currentUser = await User.findOne({ email });
    if (!currentUser) return res.status(404).json({ msg: "User not found" });

    const currentSkills = currentUser.skills || [];
    const currentInterests = currentUser.interests || [];

    // Collect emails to exclude: self, connections, sent requests, received requests
    const excludeEmails = new Set([
      currentUser.email,
      ...currentUser.connections.map(String),
      ...currentUser.connectionRequests.map(String),
    ]);

    // Also find users who sent requests TO current user
    const incomingRequests = await User.find({ connectionRequests: email });
    incomingRequests.forEach((u) => excludeEmails.add(u.email));

    // Get all users excluding those in excludeEmails
    const allUsers = await User.find({ email: { $nin: Array.from(excludeEmails) } });

    const scored = allUsers.map((other) => {
      const otherSkills = other.skills || [];
      const otherInterests = other.interests || [];

      const commonSkills = otherSkills.filter((s) => currentSkills.includes(s));
      const commonInterests = otherInterests.filter((i) => currentInterests.includes(i));

      const score = commonSkills.length + commonInterests.length;

      return { user: other, score };
    });

    const validMatches = scored.filter((entry) => entry.score > 0);
    if (validMatches.length === 0) return res.status(404).json({ msg: "No suitable match found" });

    const randomIndex = Math.floor(Math.random() * validMatches.length);
    const bestMatch = validMatches[randomIndex].user;

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
    console.error("Match error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});
// 🔸 Send a new message
router.post("/send-message", async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;

    if (!sender || !receiver || !message) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const newMsg = await Message.create({
      sender,
      receiver,
      message,
      status: "sent", // Default when created
    });

    res.status(201).json(newMsg);
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ msg: "Server error while sending message" });
  }
});


// 🔹 Get chat history between two users
router.get("/chat-history", async (req, res) => {
  const { user1, user2 } = req.query;

  if (!user1 || !user2) {
    return res.status(400).json({ msg: "Missing user emails" });
  }

  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ createdAt: 1 }); // ascending order

    res.json(messages);
  } catch (err) {
    console.error("Fetch chat history error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});
// ✅ Mark messages as seen
router.post("/mark-seen", async (req, res) => {
  const { sender, receiver } = req.body;

  if (!sender || !receiver) {
    return res.status(400).json({ msg: "Missing sender or receiver" });
  }

  try {
    // Update all unread messages from sender to receiver
    await Message.updateMany(
      { sender, receiver, status: { $ne: "seen" } },
      { $set: { status: "seen" } }
    );

    res.json({ msg: "Messages marked as seen" });
  } catch (err) {
    console.error("Error marking messages as seen:", err);
    res.status(500).json({ msg: "Server error" });
  }
});



module.exports = router;
