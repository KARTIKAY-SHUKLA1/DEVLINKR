/**
 * Rate Limiter Middleware Factory
 * --------------------------------
 * Uses express-rate-limit backed by a Redis store (rate-limit-redis)
 * so limits are shared across all server instances and survive restarts.
 *
 * Limiters exported:
 *   authLimiter  — 10 requests per 15 min per IP  (login, signup, send-otp)
 *   otpLimiter   — 5  requests per 15 min per IP  (verify-otp)
 *   roomLimiter  — 30 requests per 1  min per IP  (room presence endpoint)
 */

const rateLimit   = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redis = require("../utils/redis");

// ─── Helper: build a limiter with a given config ─────────────────────────────
function makeLimiter({ windowMs, max, keyPrefix, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,  // Return RateLimit-* headers
    legacyHeaders: false,

    // Redis-backed store — keyed by keyPrefix + IP
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: `rl:${keyPrefix}:`,
    }),

    handler: (req, res) => {
      res.status(429).json({
        msg: message || "⚠️ Too many requests. Please wait before trying again.",
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
}

// ─── Auth limiter: login / signup / send-otp ─────────────────────────────────
// 10 attempts per 15 minutes stops brute-force without blocking normal users.
const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyPrefix: "auth",
  message: "⚠️ Too many auth requests. Please wait 15 minutes before trying again.",
});

// ─── OTP limiter: verify-otp ─────────────────────────────────────────────────
// Stricter — 5 attempts per 15 minutes to prevent OTP brute-force.
const otpLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "otp",
  message: "⚠️ Too many OTP attempts. Please wait 15 minutes.",
});

// ─── Room limiter: presence / join endpoints ─────────────────────────────────
// 30 requests per minute — generous for legitimate polling but blocks abuse.
const roomLimiter = makeLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  keyPrefix: "room",
  message: "⚠️ Too many room requests. Please slow down.",
});

module.exports = { authLimiter, otpLimiter, roomLimiter };
