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
 * ── Connection strategy ──────────────────────────────────────────────────────
 * BullMQ internally requires multiple Redis connections (one per Queue,
 * one per Worker, one for blocking commands). Sharing the app's main
 * Redis client causes command-multiplexing conflicts.
 *
 * We use redis.createClient() — a factory from utils/redis.js that creates
 * fresh ioredis instances from the same REDIS_URL — so BullMQ gets its own
 * dedicated connections while still picking up the correct URL in production.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { Queue, Worker } = require("bullmq");
const redis             = require("../utils/redis");
const SessionSummary    = require("../models/SessionSummary");

// BullMQ-dedicated connections — never share the app's main redis client.
const queueConnection  = redis.createClient();
const workerConnection = redis.createClient();

// ─── Queue ────────────────────────────────────────────────────────────────────
const sessionQueue = new Queue("session-analysis", {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,                                    // Retry up to 3× on failure
    backoff: { type: "exponential", delay: 2000 },  // 2s → 4s → 8s
    removeOnComplete: 100,  // Keep last 100 completed job records
    removeOnFail:      50,  // Keep last  50 failed    job records
  },
});

// ─── Worker ───────────────────────────────────────────────────────────────────
const sessionWorker = new Worker(
  "session-analysis",
  async (job) => {
    const { room, code, language } = job.data;

    console.log(`🔧 BullMQ: processing analyzeSession job for room: ${room}`);

    // ── Basic code analysis ──────────────────────────────────────────────────
    const lines         = (code || "").split("\n");
    const nonBlankLines = lines.filter((l) => l.trim().length > 0);
    const linesOfCode   = nonBlankLines.length;
    const charCount     = (code || "").length;

    // ── Store summary in MongoDB ─────────────────────────────────────────────
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
  { connection: workerConnection }
);

// ─── Worker event hooks ───────────────────────────────────────────────────────
sessionWorker.on("failed", (job, err) => {
  console.error(`❌ BullMQ job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message);
});

sessionWorker.on("error", (err) => {
  console.error("❌ BullMQ worker error:", err.message);
});

// ─── Exports ─────────────────────────────────────────────────────────────────
module.exports = { sessionQueue, sessionWorker };
