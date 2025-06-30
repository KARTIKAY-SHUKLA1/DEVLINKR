const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, unique: true },
    language: { type: String, default: "javascript" },
    code: { type: String, default: "// Start coding..." },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("Session", sessionSchema);
