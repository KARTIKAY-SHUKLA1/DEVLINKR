const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  techStack: [String],
  interests: [String],
  availability: String,
});

module.exports = mongoose.model("User", UserSchema);
