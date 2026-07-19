require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const path = require("path");
const root = (p) => path.join(__dirname, "..", p);

const User           = require(root("models/user"));
const Message        = require(root("models/Message"));
const Session        = require(root("models/Session"));
const Otp            = require(root("models/otp"));
const SessionSummary = require(root("models/SessionSummary"));

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected\n");

  const collections = [
    { name: "users",            model: User },
    { name: "messages",         model: Message },
    { name: "sessions",         model: Session },
    { name: "otps",             model: Otp },
    { name: "sessionsummaries", model: SessionSummary },
  ];

  for (const { name, model } of collections) {
    const count   = await model.countDocuments();
    const indexes = await model.collection.indexes();
    console.log(`=== ${name} ===`);
    console.log(`  Documents: ${count}`);
    console.log("  Indexes:");
    indexes.forEach((ix) => {
      const keys  = JSON.stringify(ix.key);
      const flags = [ix.unique && "unique", ix.sparse && "sparse"].filter(Boolean).join(", ");
      console.log(`    ${ix.name || "?"}  ${keys}${flags ? "  [" + flags + "]" : ""}`);
    });
    console.log();
  }

  // ── Timed: chat-history query (the paginated endpoint) ─────────────────────
  console.log("=== Timed: Message.find (chat-history shape, limit 20) ===");
  const RUNS = 5;
  const t1 = [];
  for (let i = 0; i < RUNS; i++) {
    const t0 = Date.now();
    await Message.find({
      $or: [
        { sender: "a@example.com", receiver: "b@example.com" },
        { sender: "b@example.com", receiver: "a@example.com" },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    t1.push(Date.now() - t0);
  }
  console.log(`  Runs (ms): ${t1.join(", ")}`);
  console.log(`  Avg  (ms): ${(t1.reduce((a, b) => a + b, 0) / RUNS).toFixed(1)}`);

  // ── Timed: match query (User.find full scan + exclusion) ───────────────────
  console.log("\n=== Timed: User.find (match — full collection scan) ===");
  const t2 = [];
  for (let i = 0; i < RUNS; i++) {
    const t0 = Date.now();
    await User.find({ email: { $nin: ["nobody@x.com"] } }).lean();
    t2.push(Date.now() - t0);
  }
  console.log(`  Runs (ms): ${t2.join(", ")}`);
  console.log(`  Avg  (ms): ${(t2.reduce((a, b) => a + b, 0) / RUNS).toFixed(1)}`);

  await mongoose.disconnect();
  console.log("\nDone.");
}

run().catch(console.error);
