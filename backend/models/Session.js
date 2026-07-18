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

// ─── Explicit Indexes ────────────────────────────────────────────────────────
// Note: room already has an index via unique:true on the schema field above.
// updatedAt: used to sort sessions by most-recently-active (future list view).
// Descending (-1) index matches the typical "ORDER BY updatedAt DESC" pattern.
sessionSchema.index({ updatedAt: -1 });

module.exports = mongoose.model("Session", sessionSchema);
