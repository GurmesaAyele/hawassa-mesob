import crypto from "node:crypto";

/**
 * Chapa API v1 Client for Hawassa MESOB VIP Tickets
 *
 * Implements:
 * - Transaction Initialization (v1): POST /v1/transaction/initialize
 * - Transaction Verification (v1): GET /v1/transaction/verify/{tx_ref}
 * - HMAC-SHA256 Webhook Signature Verification
 * - Server-side secret protection: Redacts API keys from errors and logs
 */

const DEFAULT_BASE_URL = "https://api.chapa.co/v1";
const REQUEST_TIMEOUT_MS = 15000;

function cleanEnv(val) {
  if (!val || typeof val !== "string") return "";
  let s = val.trim().replace(/\r/g, "");
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/**
 * Reads Chapa configuration securely from environment variables.
 */
export function getChapaConfig() {
  const secretKey = cleanEnv(process.env.CHAPA_SECRET_KEY);
  const publicKey = cleanEnv(process.env.CHAPA_PUBLIC_KEY);
  const webhookSecret = cleanEnv(process.env.CHAPA_WEBHOOK_SECRET) || secretKey;
  const baseUrl = (cleanEnv(process.env.CHAPA_BASE_URL) || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const callbackUrl = cleanEnv(process.env.CHAPA_CALLBACK_URL);
  const returnUrl = cleanEnv(process.env.CHAPA_RETURN_URL);

  return {
    secretKey,
    publicKey,
    webhookSecret,
    baseUrl,
    callbackUrl,
    returnUrl,
    isConfigured: Boolean(secretKey && !secretKey.includes("your-chapa-secret-key-here")),
  };
}

/**
 * Redacts any potential secrets from error objects and strings.
 */
function sanitizeError(err) {
  if (!err) return "Unknown provider error";
  const str = typeof err === "string" ? err : err.message || JSON.stringify(err);
  return str.replace(/Bearer\s+[A-Za-z0-9_-]+/gi, "Bearer [REDACTED]")
    .replace(/CHASECK_[A-Za-z0-9_-]+/gi, "CHASECK_[REDACTED]")
    .replace(/CHAPUBK_[A-Za-z0-9_-]+/gi, "CHAPUBK_[REDACTED]");
}

/**
 * Initializes a Chapa v1 transaction session.
 *
 * Endpoint: POST https://api.chapa.co/v1/transaction/initialize
 *
 * @param {Object} params
 * @param {number|string} params.amount - The actual amount in ETB (e.g. 1000)
 * @param {string} params.currency - e.g. "ETB"
 * @param {string} params.reference - Unique merchant transaction reference (tx_ref)
 * @param {string} [params.callbackUrl] - Public webhook callback URL
 * @param {string} [params.returnUrl] - Frontend return redirect URL
 * @param {Object} params.customer - { firstName, lastName, phone, email }
 * @returns {Promise<{ success: boolean, checkoutUrl?: string, providerReference?: string, error?: string }>}
 */
export async function initializeHostedCheckout({
  amount,
  currency = "ETB",
  reference,
  callbackUrl,
  returnUrl,
  customer,
}) {
  const config = getChapaConfig();
  if (!config.isConfigured) {
    return {
      success: false,
      error: "Payment provider configuration is missing or invalid. Check CHAPA_SECRET_KEY.",
    };
  }

  const endpoint = `${config.baseUrl}/transaction/initialize`;
  const resolvedCallbackUrl = callbackUrl || config.callbackUrl;
  const resolvedReturnUrl = returnUrl || config.returnUrl;

  const payload = {
    amount: String(amount),
    currency,
    email: customer?.email,
    first_name: customer?.firstName || "Citizen",
    last_name: customer?.lastName || "Applicant",
    tx_ref: reference,
    ...(customer?.phone ? { phone_number: customer.phone } : {}),
    ...(resolvedCallbackUrl ? { callback_url: resolvedCallbackUrl } : {}),
    ...(resolvedReturnUrl ? { return_url: resolvedReturnUrl } : {}),
    "customization[title]": "Hawassa MESOB VIP Ticket",
    "customization[description]": "VIP priority walk-in application fee",
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    console.log(`[Chapa] Initializing v1 transaction at: ${endpoint} (tx_ref: ${reference}, amount: ${amount} ${currency}, KeyLoaded: ${Boolean(config.secretKey)})`);

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.secretKey}`,
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log(`[Chapa] Provider responded with HTTP status: ${res.status}`);

    const json = await res.json().catch(() => null);

    if (!res.ok || !json || json.status === "failed") {
      console.warn("[Chapa] Transaction initialization rejected by provider:", res.status);
      let errMsg = "Provider returned error";
      if (typeof json?.message === "string") {
        errMsg = json.message;
      } else if (json?.message && typeof json.message === "object") {
        errMsg = Object.entries(json.message)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("; ");
      } else {
        errMsg = `Provider returned HTTP ${res.status}`;
      }
      return {
        success: false,
        error: sanitizeError(errMsg),
      };
    }

    const checkoutUrl = json.data?.checkout_url;

    if (!checkoutUrl) {
      return {
        success: false,
        error: "Chapa did not return a valid checkout URL.",
      };
    }

    return {
      success: true,
      checkoutUrl,
      providerReference: null,
      metadata: {
        mode: "test",
        initiatedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    clearTimeout(timeoutId);

    const isTimeout = err.name === "AbortError";
    const causeCode = err.cause?.code || err.code;
    const causeMessage = err.cause?.message || err.message;

    console.error("[Chapa] Network request failed:", {
      name: err.name,
      causeCode,
      causeMessage,
    });

    return {
      success: false,
      error: isTimeout
        ? "Payment provider request timed out. Please retry."
        : `Chapa network request failed (${causeCode || err.name}: ${causeMessage || err.message}).`,
    };
  }
}

/**
 * Verifies a payment transaction directly against Chapa v1 API.
 *
 * Endpoint: GET https://api.chapa.co/v1/transaction/verify/{tx_ref}
 *
 * @param {string} txRef - Unique transaction reference (tx_ref)
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function verifyPaymentWithChapa(txRef) {
  const config = getChapaConfig();
  if (!config.isConfigured) {
    return {
      success: false,
      error: "Payment provider configuration is missing. Check CHAPA_SECRET_KEY.",
    };
  }

  if (!txRef || typeof txRef !== "string") {
    return {
      success: false,
      error: "Transaction reference is required for verification.",
    };
  }

  const cleanRef = encodeURIComponent(txRef.trim());
  const endpoint = `${config.baseUrl}/transaction/verify/${cleanRef}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.secretKey}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const json = await res.json().catch(() => null);

    if (!res.ok || !json) {
      const errMsg = json?.message || `Provider returned HTTP ${res.status}`;
      return {
        success: false,
        error: sanitizeError(errMsg),
      };
    }

    return {
      success: true,
      data: json.data || json,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: err.name === "AbortError"
        ? "Provider verification timed out."
        : sanitizeError(err),
    };
  }
}

/**
 * Verifies Chapa v2 webhook signature using HMAC-SHA256 and constant-time comparison.
 *
 * @param {Buffer|string} rawBody - Raw unparsed request body buffer or string
 * @param {string} signatureHeader - Value from 'x-chapa-signature' or 'chapa-signature' header
 * @returns {boolean}
 */
export function verifyChapaWebhookSignature(rawBody, signatureHeader) {
  if (!rawBody || !signatureHeader || typeof signatureHeader !== "string") {
    return false;
  }

  const { webhookSecret } = getChapaConfig();
  if (!webhookSecret) {
    return false;
  }

  try {
    const computedHmac = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const headerClean = signatureHeader.trim();
    const sigBuffer = Buffer.from(headerClean, "hex");
    const compBuffer = Buffer.from(computedHmac, "hex");

    if (sigBuffer.length !== compBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, compBuffer);
  } catch (err) {
    return false;
  }
}
