const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },

  // Role & Professional Info
  role: { type: String, enum: ["student", "professional"], required: true },
  college: { type: String, default: "" },
  company: { type: String, default: "" },

  // Profile & Tech Info
  github: { type: String, default: "" },
  experience: { type: String, default: "" },
  bio: { type: String, default: "" },
  skills: { type: [String], default: [] },
  interests: { type: [String], default: [] },
  availability: { type: String, default: "" },

  // Profile Picture
  profilePic: {
    type: String,
    default: "/uploads/default-profile.png" // make sure this path exists in your project
  },

  // Connection System
  connectionRequests: { type: [String], default: [] }, // incoming emails
  connections: { type: [String], default: [] },        // accepted emails

  // Notifications
  notifications: {
    type: [
      {
        type: { type: String, required: true }, // e.g. "accepted"
        from: { type: String, required: true }, // email of the sender
        timestamp: { type: Date, default: Date.now }
      }
    ],
    default: []
  }
});

module.exports = mongoose.model("User", userSchema);