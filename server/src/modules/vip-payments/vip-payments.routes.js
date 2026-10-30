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

const router = express.Router();

// ─── Public Payment Endpoints ───────────────────────────────────────────────

// POST /api/vip-payments/initialize - Start Chapa hosted checkout for a VIP application
router.post("/initialize", paymentRateLimiter, initializePaymentHandler);

// GET /api/vip-payments/verify/:reference - Authoritative server-side verification with Chapa
router.get("/verify/:reference", paymentRateLimiter, verifyPaymentHandler);

// GET /api/vip-payments/status/:reference - Safe polling endpoint for frontend status monitor
router.get("/status/:reference", paymentRateLimiter, getPaymentStatusHandler);

// POST /api/vip-payments/webhook - Chapa payment event webhook notification (HMAC-SHA256 authenticated)
router.post("/webhook", webhookHandler);

export default router;
