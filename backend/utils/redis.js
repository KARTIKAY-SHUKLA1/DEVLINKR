/**
 * Shared Redis client (ioredis).
 *
 * Single connection instance re-used across:
 *   - BullMQ queue / worker
 *   - Rate-limit-redis store
 *   - Room presence tracking (SADD / SREM / SMEMBERS)
 *
 * REDIS_URL defaults to redis://127.0.0.1:6379 for local Docker development.
 */

const Redis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redis = new Redis(REDIS_URL, {
  // Gracefully handle connection failures so the server keeps running
  // even when Redis is temporarily unavailable.
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: false,
});

redis.on("connect", () => console.log("✅ Redis connected:", REDIS_URL));
redis.on("error", (err) => console.error("❌ Redis error:", err.message));

module.exports = redis;
