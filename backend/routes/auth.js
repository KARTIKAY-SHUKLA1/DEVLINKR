const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const upload = require("../utils/cloudinaryUpload");

const User = require("../models/user");
const Otp = require("../models/otp");
const sendOtp = require("../utils/sendOtp");
const Message = require("../models/Message");
const Session = require("../models/Session");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// ------------------ OTP Routes ------------------
router.post("/send-otp", async (req, res) => {
  let { email } = req.body;
  if (!email) return res.status(400).json({ msg: "Email is required" });

  email = email.trim().toLowerCase();

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "❗ You already have an account. Please login instead." });
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();

    await Otp.findOneAndUpdate(
      { email },
      { code: otpCode, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
      { upsert: true, new: true }
    );

    await sendOtp(email, otpCode);

    return res.json({ msg: "✅ OTP sent to your email" });
  } catch (err) {
    console.error("❌ Error sending OTP:", err);
    return res.status(500).json({ msg: "❌ Failed to send OTP", error: err.message });
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

// ------------------ Signup ------------------
router.post("/signup", upload.single("profilePhoto"), async (req, res) => {
  try {
    let {
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

    email = email?.trim().toLowerCase();

    // ✅ Robust skill parsing
    let skills = [];
    if (req.body.skills) {
      if (Array.isArray(req.body.skills)) {
        skills = req.body.skills.flatMap((item) => {
          try {
            const parsed = JSON.parse(item);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            return [item.trim()];
          }
        });
      } else if (typeof req.body.skills === "string") {
        try {
          const parsed = JSON.parse(req.body.skills);
          skills = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          skills = req.body.skills.split(",").map((s) => s.trim());
        }
      }
    }

    // ✅ Optional interest parsing
    let interests = [];
    if (req.body.interests) {
      if (Array.isArray(req.body.interests)) {
        interests = req.body.interests.flatMap((item) => {
          try {
            const parsed = JSON.parse(item);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            return [item.trim()];
          }
        });
      } else if (typeof req.body.interests === "string") {
        try {
          const parsed = JSON.parse(req.body.interests);
          interests = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          interests = req.body.interests.split(",").map((s) => s.trim());
        }
      }
    }

    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "❗ Account already exists. Please login." });
    }

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
      interests,
      profilePic: req.file ? req.file.path : undefined,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      user: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        college: newUser.college,
        company: newUser.company,
        github: newUser.github,
        experience: newUser.experience,
        skills: newUser.skills,
        interests: newUser.interests,
        profilePic: newUser.profilePic,
      },
      redirectTo: "/home",
    });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    return res.status(500).json({
      msg: "Server error during signup",
      error: err.message,
    });
  }
});


// ------------------ Login ------------------
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
// ------------------ Profile Update ------------------
router.put("/profile", upload.single("profilePic"), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Parse JSON string fields
    if (req.body.skills) {
      try {
        user.skills = JSON.parse(req.body.skills);
      } catch {
        user.skills = [];
      }
    }

    if (req.body.interests) {
      try {
        user.interests = JSON.parse(req.body.interests);
      } catch {
        user.interests = [];
      }
    }

    // Simple string fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.role) user.role = req.body.role;
    if (req.body.college) user.college = req.body.college;
    if (req.body.company) user.company = req.body.company;
    if (req.body.availability) user.availability = req.body.availability;
    if (req.body.experience) user.experience = req.body.experience;
    if (req.body.github) user.github = req.body.github;
    if (req.body.bio) user.bio = req.body.bio;

    // Handle new profilePic
    if (req.file) {
      user.profilePic = req.file.path;
    }

    await user.save();

    res.json({ msg: "✅ Profile updated", profilePic: user.profilePic });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ------------------ Get Profile ------------------
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

// ------------------ File Upload for Chat ------------------
router.post("/upload-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    res.status(200).json({ url: req.file.path, type: req.file.mimetype });
  } catch (err) {
    console.error("❌ File upload error:", err);
    res.status(500).json({ msg: "Server error during file upload" });
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

  if (!email) {
    return res.status(400).json({ msg: "Email is required" });
  }

  try {
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ msg: "User not found" });

    // 1️⃣ Build requests
    const requestUsers = await User.find({
      email: { $in: user.connectionRequests || [] },
    }).lean();

    const requests = requestUsers.map(u => ({
      email: u.email,
      name: u.name,
    }));

    // 2️⃣ Build connections
    const connectionUsers = await User.find({
      email: { $in: user.connections || [] },
    }).lean();

    // 3️⃣ Count unseen messages per connection
    const connections = await Promise.all(
      connectionUsers.map(async (u) => {
        const unseenCount = await Message.countDocuments({
          sender: u.email,
          receiver: email,
          status: { $ne: "seen" },
        });

        return {
          email: u.email,
          name: u.name,
          profilePic: u.profilePic || null,
          unseenMessages: unseenCount,
        };
      })
    );

    // ✅ Send result
    res.status(200).json({ requests, connections });

  } catch (err) {
    console.error("Notification fetch failed:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ------------------ Matching ------------------
router.get("/match", async (req, res) => {
  const { email } = req.query;
  try {
    const currentUser = await User.findOne({ email });
    if (!currentUser) return res.status(404).json({ msg: "User not found" });

    // Lowercased skills of current user
    const userSkills = Array.isArray(currentUser.skills)
      ? currentUser.skills.map(s => s.toLowerCase())
      : [];

    // Exclude users already connected/requested
    const exclude = new Set([
      currentUser.email,
      ...currentUser.connections,
      ...currentUser.connectionRequests,
    ]);

    const incomingRequests = await User.find({ connectionRequests: email });
    incomingRequests.forEach(u => exclude.add(u.email));

    // Get all other users not excluded
    const others = await User.find({ email: { $nin: Array.from(exclude) } });

    // Score them by number of matching skills
    const scoredMatches = others
      .map(user => {
        const skillMatchCount = Array.isArray(user.skills)
          ? user.skills.filter(s => userSkills.includes(s.toLowerCase())).length
          : 0;
        return { user, skillMatchCount };
      })
      .filter(match => match.skillMatchCount > 0); // Must have at least 1 skill in common

    if (scoredMatches.length === 0) {
      return res.status(404).json({ msg: "No suitable match found" });
    }

    // Partition into best (>=3) and good (1-2)
    const bestMatches = scoredMatches.filter(m => m.skillMatchCount >= 3);
    const goodMatches = scoredMatches.filter(m => m.skillMatchCount < 3);

    let selected;
    if (bestMatches.length > 0) {
      // Prefer best matches
      selected = bestMatches[Math.floor(Math.random() * bestMatches.length)].user;
    } else {
      // Fall back to any acceptable match
      selected = goodMatches[Math.floor(Math.random() * goodMatches.length)].user;
    }

    res.json({
      name: selected.name,
      email: selected.email,
      role: selected.role,
      college: selected.college,
      company: selected.company,
      skills: selected.skills || [],
      interests: selected.interests || [],
      availability: selected.availability,
      github: selected.github,
      profilePic: selected.profilePic || null,
    });

  } catch (err) {
    console.error("❌ Error in /match route:", err);
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

// ------------------ Pair Programming Session ------------------
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

router.get("/load-session", async (req, res) => {
  const { room } = req.query;

  try {
    if (!room) return res.status(400).json({ msg: "Room ID missing" });

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
