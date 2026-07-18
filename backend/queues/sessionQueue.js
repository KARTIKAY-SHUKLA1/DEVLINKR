/**
 * BullMQ Session Analysis Queue + Worker
 * ----------------------------------------
 * Queue : "session-analysis"
 * Job   : "analyzeSession"
 *
 * When a coding session is saved (POST /api/auth/save-session), the route
 * enqueues an "analyzeSession" job instead of running analysis synchronously.
 *
 * The worker picks up the job and:
 *   1. Computes basic code statistics (linesOfCode, charCount).
 *   2. Upserts a SessionSummary document in MongoDB.
 *
 * This file both EXPORTS the Queue (so routes can enqueue jobs) and starts
 * the Worker (so it processes jobs when the server boots).
 */

const { Queue, Worker, QueueEvents } = require("bullmq");
const redis = require("../utils/redis");
const SessionSummary = require("../models/SessionSummary");

// ─── Shared connection config for BullMQ (uses the existing ioredis client) ──
const connection = redis;

// ─── Queue ────────────────────────────────────────────────────────────────────
const sessionQueue = new Queue("session-analysis", {
  connection,
  defaultJobOptions: {
    attempts: 3,                  // Retry up to 3 times on failure
    backoff: { type: "exponential", delay: 2000 }, // 2s, 4s, 8s
    removeOnComplete: 100,        // Keep last 100 completed job records
    removeOnFail: 50,             // Keep last 50 failed job records
  },
});

// ─── Worker ───────────────────────────────────────────────────────────────────
const sessionWorker = new Worker(
  "session-analysis",
  async (job) => {
    const { room, code, language } = job.data;

    console.log(`🔧 BullMQ: processing analyzeSession job for room: ${room}`);

    // --- Basic code analysis ---
    const lines = (code || "").split("\n");
    const nonBlankLines = lines.filter((l) => l.trim().length > 0);
    const linesOfCode   = nonBlankLines.length;
    const charCount     = (code || "").length;

    // --- Store summary in MongoDB ---
    await SessionSummary.findOneAndUpdate(
      { room },
      { language: language || "unknown", linesOfCode, charCount, analyzedAt: new Date() },
      { upsert: true, new: true }
    );

    console.log(
      `✅ BullMQ job analyzeSession processed for room: ${room} | ` +
      `${linesOfCode} lines, ${charCount} chars, lang: ${language}`
    );

    return { room, linesOfCode, charCount };
  },
  { connection }
);

// ─── Worker event hooks ───────────────────────────────────────────────────────
sessionWorker.on("failed", (job, err) => {
  console.error(`❌ BullMQ job ${job.id} failed (attempt ${job.attemptsMade}):`, err.message);
});

sessionWorker.on("error", (err) => {
  console.error("❌ BullMQ worker error:", err.message);
});

// ─── Exports ─────────────────────────────────────────────────────────────────
module.exports = { sessionQueue, sessionWorker };
