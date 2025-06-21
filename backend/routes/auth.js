const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// ------------------ SIGNUP ------------------
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { name, email } });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ------------------ LOGIN ------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { name: user.name, email } });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ------------------ GET RANDOM MATCH ------------------
router.get("/match", async (req, res) => {
  const userEmail = req.query.email;

  try {
    const others = await User.find({ email: { $ne: userEmail } });
    if (others.length === 0) {
      return res.status(404).json({ msg: "No other users available" });
    }

    const randomIndex = Math.floor(Math.random() * others.length);
    const matched = others[randomIndex];

    res.json({ name: matched.name, email: matched.email });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ------------------ GET ALL USERS ------------------
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude password field
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Export the router after all routes are defined
module.exports = router;
