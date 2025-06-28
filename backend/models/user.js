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
    default: "/uploads/default-profile.png", // You must place this image in /uploads
  },

  // Connection system
  connectionRequests: [{ type: String }], // incoming email requests
  connections: [{ type: String }], // accepted email connections
});

module.exports = mongoose.model("User", userSchema);
