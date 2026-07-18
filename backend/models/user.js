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

// ─── Explicit Indexes ────────────────────────────────────────────────────────
// skills: used for matching — queries filter/score by skill overlap.
// An index on the array field lets MongoDB use IXSCAN instead of COLLSCAN.
userSchema.index({ skills: 1 });
// Note: email already has an index via unique:true on the schema field above.
// skills is the key new index enabling efficient matching queries.

module.exports = mongoose.model("User", userSchema);