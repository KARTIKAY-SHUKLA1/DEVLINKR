// models/Message.js

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String, // email
      required: true,
    },
    receiver: {
      type: String, // email
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"], // 👁️ Read receipts
      default: "sent",
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

// ─── Explicit Indexes ────────────────────────────────────────────────────────
// Chat history: queries always filter by (sender, receiver) pair and sort by
// createdAt. The compound index covers both in a single IXSCAN.
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });

// Unseen count: the /notifications endpoint counts unseen messages per receiver.
// This index avoids a full collection scan for every connection in the list.
messageSchema.index({ receiver: 1, status: 1 });

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
