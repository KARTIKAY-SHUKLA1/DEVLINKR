const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },

  // Role and professional/academic info
  role: { type: String, enum: ["student", "professional"], required: true },
  college: String,
  company: String,

  // Profile & tech info
  github: String,
  experience: String,
  bio: String,
  skills: [String],
  interests: [String],
  availability: String,

  // Profile image
  profilePic: {
    type: String,
    default: "/uploads/default-profile.png", // Make sure you have this image in /uploads
  },

  // Connection system
  connectionRequests: [{ type: String }], // incoming email requests
  connections: [{ type: String }],         // accepted email connections

  // NEW: Notifications (e.g. "your request was accepted")
  notifications: [
    {
      type: { type: String },   // e.g. "accepted"
      from: String,             // email of the user who accepted your request
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model("User", userSchema);
