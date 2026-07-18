/**
 * SessionSummary model — stores the post-session code analysis produced by the BullMQ worker.
 *
 * Fields:
 *   room        — the coding room ID (matches Session.room)
 *   language    — detected/declared language of the session code
 *   linesOfCode — total non-blank lines in the final submitted code
 *   charCount   — total character count of the code
 *   analyzedAt  — timestamp of when the analysis job ran
 */

const mongoose = require("mongoose");

const sessionSummarySchema = new mongoose.Schema({
  // Index on room for fast lookup when the UI wants to display a past summary
  room: { type: String, required: true, index: true },

  language: { type: String, default: "unknown" },

  // Basic code stats computed by the BullMQ analyzeSession worker
  linesOfCode: { type: Number, default: 0 },
  charCount:   { type: Number, default: 0 },

  analyzedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SessionSummary", sessionSummarySchema);
