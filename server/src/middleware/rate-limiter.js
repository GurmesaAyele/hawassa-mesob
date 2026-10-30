import rateLimit from "express-rate-limit";

/**
 * Chatbot Rate Limiter
 * Protects expensive Gemini AI inference and database retrieval from DoS and token exhaustion.
 *
 * Defaults:
 *   - Window: 60,000 ms (1 minute)
 *   - Max: 30 requests per minute per IP address
 *
 * Configurable via environment variables:
 *   - CHAT_RATE_LIMIT_WINDOW_MS
 *   - CHAT_RATE_LIMIT_MAX
 */
export const chatRateLimiter = rateLimit({
  windowMs: parseInt(process.env.CHAT_RATE_LIMIT_WINDOW_MS || "60000", 10),
  max: parseInt(process.env.CHAT_RATE_LIMIT_MAX || "30", 10),
  standardHeaders: true, // Returns RateLimit-* headers
  legacyHeaders: false,
  statusCode: 429,
  message: {
    reply: "You have sent too many requests. Please wait a moment before trying again.",
    error: "Too many requests. Rate limit exceeded.",
    tier: "rate-limit",
  },
  handler: (req, res, _next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * General API Rate Limiter
 * Applied globally to standard endpoints to prevent network flooding.
 */
export const generalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || "60000", 10),
  max: parseInt(process.env.API_RATE_LIMIT_MAX || "120", 10),
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    error: "Too many requests to Hawassa MESOB API. Please slow down.",
  },
  handler: (req, res, _next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

export const authRateLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === "test" ? 1000 : 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "test" ? 1000 : 20, // 20 attempts
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    error: "Too many sign-in attempts. Please try again after 15 minutes.",
  },
  handler: (req, res, _next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

export default {
  chatRateLimiter,
  generalRateLimiter,
  authRateLimiter,
};
