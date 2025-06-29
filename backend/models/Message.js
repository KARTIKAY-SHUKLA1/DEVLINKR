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

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
