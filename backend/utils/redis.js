/**
 * Shared Redis client (ioredis) + connection factory.
 *
 * ┌─ Environment variable ────────────────────────────────────────────────────┐
 * │  REDIS_URL   Full Redis URL (required in production, optional locally).   │
 * │              redis://[user:pass@]host:port      — plain TCP               │
 * │              rediss://[user:pass@]host:port     — TLS (Render, Upstash…)  │
 * │  Falls back to redis://127.0.0.1:6379 for local development only.         │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * Exports:
 *   module.exports          — the shared ioredis client (rate-limiter, presence)
 *   module.exports.createClient() — factory for BullMQ-dedicated connections
 */

require("dotenv").config();
const Redis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Render / Upstash / Redis Cloud use the rediss:// scheme for TLS.
// ioredis needs the tls option set explicitly when TLS is required.
const isTLS = REDIS_URL.startsWith("rediss://");

/**
 * Returns a new ioredis connection derived from REDIS_URL.
 * Callers can pass extra options to override defaults (e.g. for BullMQ).
 *
 * @param {import("ioredis").RedisOptions} [overrides]
 */
function createClient(overrides = {}) {
  return new Redis(REDIS_URL, {
    // Required by BullMQ workers; harmless for other uses.
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
    // Enable TLS automatically when the URL uses the rediss:// scheme.
    ...(isTLS ? { tls: {} } : {}),
    ...overrides,
  });
}

// ─── Main shared client ───────────────────────────────────────────────────────
// Used by: rate-limit-redis store, room presence (SADD/SREM/SMEMBERS),
//          and any ad-hoc redis calls in index.js.
const redis = createClient();

// Mask credentials in logs (e.g. rediss://user:password@host → rediss://<hidden>@host)
const safeUrl = REDIS_URL.replace(/:\/\/([^@]+)@/, "://<credentials>@");

redis.on("connect", () => console.log("✅ Redis connected:", safeUrl));
redis.on("error",   (err) => console.error("❌ Redis error:", err.message));

// Expose the factory so BullMQ can create its own dedicated connections.
redis.createClient = createClient;

module.exports = redis;
