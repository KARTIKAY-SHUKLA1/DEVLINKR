/**
 * Measures:
 * 1. Paginated vs unpaginated chat-history payload sizes
 * 2. Session/room counts from DB
 * 3. Actual response times before vs after pagination
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const path = require("path");
const root  = (p) => path.join(__dirname, "..", p);

const Message        = require(root("models/Message"));
const Session        = require(root("models/Session"));
const SessionSummary = require(root("models/SessionSummary"));
const User           = require(root("models/user"));

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  // ── 1. Payload size: unpaginated (old) vs paginated (new) ─────────────────
  // Pick the conversation with the most messages for worst-case comparison
  const pipeline = await Message.aggregate([
    { $group: { _id: { s: "$sender", r: "$receiver" }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  const totalMessages = await Message.countDocuments();

  let oldPayloadBytes = 0, newPayloadBytes = 0, conversationCount = 0;
  let oldMs = 0, newMs = 0;

  if (pipeline.length > 0) {
    const { s: sender, r: receiver } = pipeline[0]._id;
    conversationCount = pipeline[0].count;

    // OLD behaviour: fetch ALL messages (no limit)
    let t0 = Date.now();
    const allMsgs = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender }
      ]
    }).sort({ createdAt: -1 }).lean();
    oldMs = Date.now() - t0;
    oldPayloadBytes = Buffer.byteLength(JSON.stringify(allMsgs));

    // NEW behaviour: paginated, limit 20 + nextCursor wrapper
    t0 = Date.now();
    const pageMsgs = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender }
      ]
    }).sort({ createdAt: -1 }).limit(21).lean();
    newMs = Date.now() - t0;
    const hasMore = pageMsgs.length > 20;
    if (hasMore) pageMsgs.pop();
    const pagedResponse = { messages: pageMsgs, nextCursor: hasMore ? pageMsgs[0]._id : null };
    newPayloadBytes = Buffer.byteLength(JSON.stringify(pagedResponse));

    const reduction = (((oldPayloadBytes - newPayloadBytes) / oldPayloadBytes) * 100).toFixed(1);

    console.log("=== Payload size: unpaginated vs paginated ===");
    console.log(`  Busiest conversation:  ${sender} ↔ ${receiver}`);
    console.log(`  Messages in that convo: ${conversationCount}`);
    console.log(`  Total messages in DB:   ${totalMessages}`);
    console.log();
    console.log(`  OLD (no limit):   ${allMsgs.length} msgs, ${oldPayloadBytes} bytes, ${oldMs}ms`);
    console.log(`  NEW (limit 20):   ${pageMsgs.length} msgs, ${newPayloadBytes} bytes, ${newMs}ms`);
    console.log(`  Payload reduction: ${reduction}%`);
    console.log(`  Response time: ${oldMs}ms → ${newMs}ms`);
  } else {
    console.log("=== No messages in DB — inserting synthetic data for measurement ===");
    // Insert 200 synthetic messages to make the comparison meaningful
    const msgs = [];
    for (let i = 0; i < 200; i++) {
      msgs.push({ sender: "bench@a.com", receiver: "bench@b.com",
                  message: `Message number ${i}: ${"x".repeat(80)}`,
                  status: "seen", createdAt: new Date(Date.now() - i * 1000) });
    }
    await Message.insertMany(msgs);

    let t0 = Date.now();
    const allMsgs = await Message.find({
      $or: [{ sender: "bench@a.com", receiver: "bench@b.com" },
            { sender: "bench@b.com", receiver: "bench@a.com" }]
    }).sort({ createdAt: -1 }).lean();
    oldMs = Date.now() - t0;
    oldPayloadBytes = Buffer.byteLength(JSON.stringify(allMsgs));

    t0 = Date.now();
    const pageMsgs = await Message.find({
      $or: [{ sender: "bench@a.com", receiver: "bench@b.com" },
            { sender: "bench@b.com", receiver: "bench@a.com" }]
    }).sort({ createdAt: -1 }).limit(21).lean();
    newMs = Date.now() - t0;
    const hasMore = pageMsgs.length > 20;
    if (hasMore) pageMsgs.pop();
    const pagedResponse = { messages: pageMsgs, nextCursor: hasMore ? pageMsgs[0]._id : null };
    newPayloadBytes = Buffer.byteLength(JSON.stringify(pagedResponse));

    const reduction = (((oldPayloadBytes - newPayloadBytes) / oldPayloadBytes) * 100).toFixed(1);
    console.log("=== Payload size: unpaginated vs paginated (200-message benchmark) ===");
    console.log(`  OLD (no limit):   ${allMsgs.length} msgs, ${(oldPayloadBytes/1024).toFixed(1)} KB, ${oldMs}ms`);
    console.log(`  NEW (limit 20):   ${pageMsgs.length} msgs, ${(newPayloadBytes/1024).toFixed(1)} KB, ${newMs}ms`);
    console.log(`  Payload reduction: ${reduction}%`);
    console.log(`  Response time: ${oldMs}ms → ${newMs}ms`);

    // Clean up benchmark data
    await Message.deleteMany({ sender: "bench@a.com" });
    console.log("  (benchmark data cleaned up)");
  }

  // ── 2. Room / session counts ───────────────────────────────────────────────
  console.log("\n=== Collaborative rooms / sessions ===");
  const sessionCount  = await Session.countDocuments();
  const summaryCount  = await SessionSummary.countDocuments();
  const sessions      = await Session.find().lean();
  console.log(`  Sessions (rooms) ever saved: ${sessionCount}`);
  console.log(`  Sessions with BullMQ summary: ${summaryCount}`);
  if (sessions.length > 0) {
    console.log("  Rooms:");
    sessions.forEach(s => console.log(`    ${s.room}  lang:${s.language || "?"}`));
  }

  // ── 3. WebSocket — infer from unique user+room combos ─────────────────────
  console.log("\n=== Unique users in DB (WebSocket ceiling) ===");
  const userCount = await User.countDocuments();
  console.log(`  Registered users: ${userCount}`);
  console.log(`  Max possible concurrent WS connections tested: ${userCount} (all users at once — never actually happened)`);
  console.log(`  Realistic observed peak: 2–3 (you + test accounts in same room)`);

  await mongoose.disconnect();
}

run().catch(console.error);
