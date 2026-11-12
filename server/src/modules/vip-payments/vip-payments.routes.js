import express from "express";
import rateLimit from "express-rate-limit";
import {
  initializePaymentHandler,
  verifyPaymentHandler,
  getPaymentStatusHandler,
  webhookHandler,
} from "./vip-payments.controller.js";

/**
 * Dedicated rate limiter for payment initialization and queries.
 * Prevents rapid automated session creation and enumeration.
 */
const paymentRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    error: "Too many payment requests. Please wait a moment before trying again.",
  },
});

/**
 * Route-specific cache prevention middleware for VIP payment status polling.
 * - Strips incoming conditional request headers (if-none-match, if-modified-since)
 *   so Express req.fresh evaluates strictly to false and never returns HTTP 304 with an empty body.
 * - Sets explicit response cache headers instructing browsers, proxies, and edge caches
 *   never to cache polling responses.
 */
export function preventStatusCache(req, res, next) {
  if (req.headers) {
    delete req.headers["if-none-match"];
    delete req.headers["if-modified-since"];
  }

  if (typeof res.set === "function") {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Surrogate-Control": "no-store",
    });
  } else if (typeof res.setHeader === "function") {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
  }

  next();
}

const router = express.Router();

// ─── Public Payment Endpoints ───────────────────────────────────────────────

// POST /api/vip-payments/initialize - Start Chapa hosted checkout for a VIP application
router.post("/initialize", paymentRateLimiter, initializePaymentHandler);

// GET /api/vip-payments/verify/:reference - Authoritative server-side verification with Chapa
router.get("/verify/:reference", paymentRateLimiter, verifyPaymentHandler);

// GET /api/vip-payments/status/:reference - Safe polling endpoint for frontend status monitor
router.get("/status/:reference", paymentRateLimiter, preventStatusCache, getPaymentStatusHandler);

// POST /api/vip-payments/webhook - Chapa payment event webhook notification (HMAC-SHA256 authenticated)
router.post("/webhook", webhookHandler);

export default router;
