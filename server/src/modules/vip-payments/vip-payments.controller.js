import {
  initializeVipPayment,
  verifyVipPayment,
  getPaymentStatus,
} from "./vip-payments.service.js";
import { verifyChapaWebhookSignature } from "./chapa.client.js";

/**
 * POST /api/vip-payments/initialize
 *
 * Initializes a Chapa v2 hosted checkout session for an existing VIP application.
 *
 * Body:
 * {
 *   "reference": "VIP-845123-A4B2", // or ticket ID
 *   "returnUrl": "http://localhost:5173/vip/payment/callback", // optional override
 *   "callbackUrl": "https://..." // optional override
 * }
 */
export async function initializePaymentHandler(req, res) {
  try {
    const rawRef =
      req.body?.reference ||
      req.body?.ticketCode ||
      req.body?.applicationReference ||
      req.body?.ticketId;

    if (!rawRef || typeof rawRef !== "string" || !rawRef.trim()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed: 'reference' is required to initialize payment.",
      });
    }

    const { returnUrl, callbackUrl, email } = req.body || {};

    const result = await initializeVipPayment({
      reference: rawRef.trim(),
      returnUrl,
      callbackUrl,
      email,
    });


    return res.status(result.status || 200).json({
      success: result.success || false,
      message: result.message,
      data: result.data,
      ...(result.error ? { error: result.error } : {}),
    });
  } catch (err) {
    console.error("[vip-payments] initializePaymentHandler error:", err.message || err);
    return res.status(500).json({
      success: false,
      error: "Internal server error while initializing VIP payment.",
    });
  }
}

/**
 * GET /api/vip-payments/verify/:reference
 *
 * Direct server-to-server verification against Chapa API.
 * Transitions VIP application PENDING -> CONFIRMED upon verified successful payment.
 */
export async function verifyPaymentHandler(req, res) {
  try {
    const rawRef = req.params?.reference || req.query?.reference;

    if (!rawRef || typeof rawRef !== "string" || !rawRef.trim()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed: Payment or merchant reference is required.",
      });
    }

    const result = await verifyVipPayment(rawRef.trim());

    return res.status(result.status || 200).json({
      success: result.success || false,
      message: result.message,
      data: result.data,
      ...(result.error ? { error: result.error } : {}),
    });
  } catch (err) {
    console.error("[vip-payments] verifyPaymentHandler error:", err.message || err);
    return res.status(500).json({
      success: false,
      error: "Internal server error while verifying VIP payment.",
    });
  }
}

/**
 * GET /api/vip-payments/status/:reference
 *
 * Safe polling endpoint for frontend to retrieve status without triggering full re-verification.
 */
export async function getPaymentStatusHandler(req, res) {
  try {
    const rawRef = req.params?.reference || req.query?.reference;

    if (!rawRef || typeof rawRef !== "string" || !rawRef.trim()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed: Reference is required to check status.",
      });
    }

    const result = await getPaymentStatus(rawRef.trim());

    return res.status(result.status || 200).json({
      success: result.success || false,
      data: result.data,
      ...(result.error ? { error: result.error } : {}),
    });
  } catch (err) {
    console.error("[vip-payments] getPaymentStatusHandler error:", err.message || err);
    return res.status(500).json({
      success: false,
      error: "Internal server error while retrieving payment status.",
    });
  }
}

/**
 * POST /api/vip-payments/webhook
 *
 * Chapa v2 webhook notification endpoint.
 *
 * Security:
 * - Constant-time HMAC-SHA256 signature verification over exact raw request body.
 * - Rejects unauthorized requests with HTTP 401.
 * - Triggers authoritative server-side payment verification before updating ticket state.
 * - Completely idempotent.
 */
export async function webhookHandler(req, res) {
  try {
    const signature =
      req.headers["x-chapa-signature"] ||
      req.headers["chapa-signature"] ||
      "";

    // 1. Signature authentication against exact raw body bytes
    const isValidSignature = verifyChapaWebhookSignature(req.rawBody, signature);

    if (!isValidSignature) {
      console.warn("[vip-payments] Webhook rejected: Invalid HMAC signature.");
      return res.status(401).json({
        error: "Unauthorized: Invalid webhook signature.",
      });
    }

    // 2. Extract transaction identifiers from webhook body
    const body = req.body || {};
    const reference =
      body.tx_ref ||
      body.trx_ref ||
      body.reference ||
      body.payment_reference ||
      body.data?.tx_ref ||
      body.data?.trx_ref ||
      body.data?.reference;

    if (!reference) {
      // Acknowledge receipt to stop retries if body is malformed
      return res.status(200).json({
        received: true,
        message: "No transaction reference in webhook body; ignored.",
      });
    }

    // 3. Trigger server-side verification directly against Chapa API
    // Never trust webhook body alone as proof of payment
    const verifyResult = await verifyVipPayment(String(reference).trim());

    return res.status(200).json({
      received: true,
      verified: verifyResult.success,
      status: verifyResult.data?.paymentStatus || "PROCESSED",
    });
  } catch (err) {
    console.error("[vip-payments] webhookHandler error:", err.message || err);
    // Return 500 so provider retries transient failures
    return res.status(500).json({
      error: "Error processing webhook notification.",
    });
  }
}
