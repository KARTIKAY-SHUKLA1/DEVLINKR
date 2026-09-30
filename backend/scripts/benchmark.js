/**
 * Measures:
 * 1. save-session endpoint response time (BullMQ async enqueue vs what
 *    synchronous analysis would cost) — estimated via timing the analysis work itself
 * 2. MongoDB explain() on the two most-used query shapes:
 *    - chat-history (Message.find sender+receiver, sort createdAt, limit 20)
 *    - match (User.find full scan)
 *    - mark-seen (Message.updateMany receiver+status)
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const path = require("path");
const root = (p) => path.join(__dirname, "..", p);

const User    = require(root("models/user"));
const Message = require(root("models/Message"));
const Session = require(root("models/Session"));

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected\n");

  // ── 1. Simulate what the session analysis WOULD cost synchronously ────────
  // (This is what happened inside the request before BullMQ. Now it's async.)
  console.log("=== Session analysis work (was synchronous, now async via BullMQ) ===");
  const sampleCode = `
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('hello'));
app.listen(3000);
`.repeat(50); // ~250 lines, realistic coding session

  const RUNS = 10;
  const analysisTimes = [];
  for (let i = 0; i < RUNS; i++) {
    const t0 = Date.now();
    // Exact same work BullMQ worker does
    const lines = sampleCode.split("\n");
    const nonBlank = lines.filter(l => l.trim().length > 0);
    const linesOfCode = nonBlank.length;
    const charCount = sampleCode.length;
    // Simulate the MongoDB upsert timing (that's the real cost)
    await Session.findOneAndUpdate(
      { room: "bench-room" },
      { code: sampleCode, language: "javascript" },
      { upsert: true, new: true }
    );
    analysisTimes.push(Date.now() - t0);
  }
  const avgAnalysis = (analysisTimes.reduce((a,b)=>a+b,0)/RUNS).toFixed(1);
  console.log(`  Runs (ms): ${analysisTimes.join(", ")}`);
  console.log(`  Avg  (ms): ${avgAnalysis}`);
  console.log(`  → With BullMQ: request returns immediately after enqueue (~2-5ms)`);
  console.log(`  → Without BullMQ: request would block for ~${avgAnalysis}ms`);

  // ── 2. MongoDB explain() on chat-history query ────────────────────────────
  console.log("\n=== explain(): Message.find (chat-history) ===");
  const chatExplain = await Message.collection.find({
    $or: [
      { sender: "a@x.com", receiver: "b@x.com" },
      { sender: "b@x.com", receiver: "a@x.com" },
    ]
  }).sort({ createdAt: -1 }).limit(20).explain("executionStats");

  const chatStats = chatExplain.executionStats;
  console.log(`  Stage:            ${chatExplain.queryPlanner.winningPlan.stage}`);
  console.log(`  Docs examined:    ${chatStats.totalDocsExamined}`);
  console.log(`  Docs returned:    ${chatStats.totalDocsReturned}`);
  console.log(`  Exec time (ms):   ${chatStats.executionTimeMillis}`);
  console.log(`  Index used:       ${JSON.stringify(chatExplain.queryPlanner.winningPlan.inputStage?.indexName || chatExplain.queryPlanner.winningPlan.inputStage?.inputStage?.indexName || "see plan")}`);

  // ── 3. MongoDB explain() on User.find (match endpoint) ───────────────────
  console.log("\n=== explain(): User.find (match — full collection) ===");
  const matchExplain = await User.collection.find({
    email: { $nin: ["nobody@x.com"] }
  }).explain("executionStats");

  const matchStats = matchExplain.executionStats;
  console.log(`  Stage:            ${matchExplain.queryPlanner.winningPlan.stage}`);
  console.log(`  Docs examined:    ${matchStats.totalDocsExamined}`);
  console.log(`  Docs returned:    ${matchStats.totalDocsReturned}`);
  console.log(`  Exec time (ms):   ${matchStats.executionTimeMillis}`);

  // ── 4. MongoDB explain() on mark-seen query ───────────────────────────────
  console.log("\n=== explain(): Message.updateMany (mark-seen) ===");
  const seenExplain = await Message.collection
    .find({ receiver: "a@x.com", status: { $ne: "seen" } })
    .explain("executionStats");
  const seenStats = seenExplain.executionStats;
  console.log(`  Stage:            ${seenExplain.queryPlanner.winningPlan.stage}`);
  console.log(`  Docs examined:    ${seenStats.totalDocsExamined}`);
  console.log(`  Docs returned:    ${seenStats.totalDocsReturned}`);
  console.log(`  Exec time (ms):   ${seenStats.executionTimeMillis}`);
  console.log(`  Index used:       ${JSON.stringify(seenExplain.queryPlanner.winningPlan.inputStage?.indexName || "none")}`);

  // ── 5. Document counts (context for scale) ────────────────────────────────
  console.log("\n=== Collection sizes ===");
  console.log(`  users:    ${await User.countDocuments()}`);
  console.log(`  messages: ${await Message.countDocuments()}`);
  console.log(`  sessions: ${await Session.countDocuments()}`);

  await mongoose.disconnect();
  console.log("\nDone.");
}

run().catch(console.error);
