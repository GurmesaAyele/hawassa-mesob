import crypto from "node:crypto";
import prisma from "../../config/db.js";
import { VIP_CONFIG } from "../institutions/vip.config.js";
import {
  initializeHostedCheckout,
  verifyPaymentWithChapa,
} from "./chapa.client.js";

// Authoritative fee in ETB (1,000 ETB)
export const VIP_FEE = 1000;
export const VIP_CURRENCY = "ETB";

/**
 * Generates a unique, collision-resistant merchant reference.
 * Used as tx_ref in Chapa v1.
 *
 * Pattern: "VP" (2) + base36 timestamp (~8) + 8 hex chars = 18 chars total.
 */
export function generateMerchantReference() {
  const prefix = "VP";
  const timePart = Date.now().toString(36).toUpperCase();
  const randPart = crypto.randomBytes(4).toString("hex").toUpperCase();
  const ref = `${prefix}${timePart}${randPart}`.slice(0, 20);
  return ref;
}


/**
 * Resolves a VIP ticket by reference code (VIP-XXXXXX-XXXX) or database primary ID.
 */
export async function findTicketByReferenceOrId(referenceOrId) {
  if (!referenceOrId || typeof referenceOrId !== "string") return null;
  const clean = referenceOrId.trim();

  return prisma.vip_tickets.findFirst({
    where: {
      OR: [{ ticketCode: clean }, { id: clean }],
    },
    include: {
      services: {
        include: { provider: true },
      },
      ...(prisma.vip_ticket_services
        ? {
            ticket_services: {
              include: {
                service: { include: { provider: true } },
              },
            },
          }
        : {}),
    },
  });
}

/**
 * Database abstraction helper for vip_payments.
 * Ensures the service works smoothly whether Prisma Client model is regenerated
 * or accessed via raw queries prior to model generation.
 */
const paymentsDb = {
  async findFirst(where) {
    if (prisma.vip_payments) {
      return prisma.vip_payments.findFirst({ where });
    }
    // Fallback SQL query if prisma client is not yet regenerated
    const conditions = [];
    const values = [];
    let idx = 1;

    if (where.merchantReference) {
      conditions.push(`"merchantReference" = $${idx++}`);
      values.push(where.merchantReference);
    }
    if (where.idempotencyKey) {
      conditions.push(`"idempotencyKey" = $${idx++}`);
      values.push(where.idempotencyKey);
    }
    if (where.ticketId) {
      conditions.push(`"ticketId" = $${idx++}`);
      values.push(where.ticketId);
    }
    if (where.status) {
      conditions.push(`"status" = $${idx++}::"PaymentStatus"`);
      values.push(where.status);
    }

    if (conditions.length === 0) return null;
    const sql = `SELECT * FROM "vip_payments" WHERE ${conditions.join(" AND ")} ORDER BY "createdAt" DESC LIMIT 1`;
    const rows = await prisma.$queryRawUnsafe(sql, ...values).catch(() => []);
    return rows[0] || null;
  },

  async findByReference(ref) {
    if (prisma.vip_payments) {
      return prisma.vip_payments.findFirst({
        where: {
          OR: [{ merchantReference: ref }, { providerReference: ref }, { id: ref }],
        },
      });
    }
    const sql = `SELECT * FROM "vip_payments" WHERE "merchantReference" = $1 OR "providerReference" = $1 OR "id" = $1 LIMIT 1`;
    const rows = await prisma.$queryRawUnsafe(sql, ref).catch(() => []);
    return rows[0] || null;
  },

  async create(data) {
    if (prisma.vip_payments) {
      try {
        const row = await prisma.vip_payments.create({ data });
        return { ...row, isPersisted: true };
      } catch (err) {
        console.warn("[vip-payments] prisma.vip_payments.create pending migration:", err.message);
      }
    }
    const id = data.id || crypto.randomUUID();
    const now = new Date();
    const sql = `
      INSERT INTO "vip_payments" (
        "id", "ticketId", "provider", "merchantReference", "providerReference",
        "idempotencyKey", "amount", "currency", "status", "checkoutUrl",
        "metadata", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::"PaymentStatus", $10, $11::jsonb, $12, $12)
      RETURNING *;
    `;
    try {
      const rows = await prisma.$queryRawUnsafe(
        sql,
        id,
        data.ticketId,
        data.provider || "CHAPA",
        data.merchantReference,
        data.providerReference || null,
        data.idempotencyKey,
        data.amount,
        data.currency || "ETB",
        data.status || "PENDING",
        data.checkoutUrl || null,
        JSON.stringify(data.metadata || {}),
        now
      );
      if (rows && rows[0]) {
        return { ...rows[0], isPersisted: true };
      }
      return { ...data, id, createdAt: now, updatedAt: now, isPersisted: false };
    } catch (err) {
      console.error("[vip-payments] DB persist error:", err.message);
      return { ...data, id, createdAt: now, updatedAt: now, isPersisted: false, persistError: err.message };
    }
  },

  async update(whereId, data, tx = prisma) {
    if (tx.vip_payments) {
      try {
        return await tx.vip_payments.update({
          where: { id: whereId },
          data: {
            ...data,
            updatedAt: new Date(),
          },
        });
      } catch (err) {
        console.warn("[vip-payments] prisma.vip_payments.update pending migration:", err.message);
      }
    }
    const sets = [];
    const values = [];
    let idx = 1;

    for (const [k, v] of Object.entries(data)) {
      if (k === "status") {
        sets.push(`"${k}" = $${idx++}::"PaymentStatus"`);
      } else if (k === "metadata") {
        sets.push(`"${k}" = $${idx++}::jsonb`);
        values.push(JSON.stringify(v));
        continue;
      } else {
        sets.push(`"${k}" = $${idx++}`);
      }
      values.push(v);
    }
    sets.push(`"updatedAt" = $${idx++}`);
    values.push(new Date());

    values.push(whereId);
    const sql = `UPDATE "vip_payments" SET ${sets.join(", ")} WHERE "id" = $${idx} RETURNING *;`;
    try {
      const rows = await tx.$queryRawUnsafe(sql, ...values);
      return rows[0] || { id: whereId, ...data };
    } catch (err) {
      console.warn("[vip-payments] DB update skipped (table pending migration):", err.message);
      return { id: whereId, ...data };
    }
  },
};

/**
 * Initializes a Chapa VIP payment attempt with full idempotency.
 *
 * @param {Object} params
 * @param {string} params.reference - VIP ticket code (e.g. VIP-123456-ABCD) or ID
 * @param {string} [params.returnUrl] - Optional frontend redirect return URL
 * @param {string} [params.callbackUrl] - Optional webhook callback URL
 */
export async function initializeVipPayment({ reference, returnUrl, callbackUrl, email }) {
  if (!reference || typeof reference !== "string" || !reference.trim()) {
    return {
      status: 400,
      error: "Validation failed: 'reference' is required.",
    };
  }

  // 1. Locate and validate ticket
  const ticket = await findTicketByReferenceOrId(reference);
  if (!ticket) {
    return {
      status: 404,
      error: `VIP application '${reference}' not found.`,
    };
  }

  // 2. Validate ticket payment eligibility
  if (ticket.status === "CONFIRMED") {
    return {
      status: 409,
      error: "VIP application has already been confirmed and paid.",
      data: {
        applicationReference: ticket.ticketCode,
        status: ticket.status,
      },
    };
  }

  if (["QUEUED", "SERVING", "USED"].includes(ticket.status)) {
    return {
      status: 409,
      error: `VIP ticket is already active in the queue workflow (status: ${ticket.status}).`,
    };
  }

  if (ticket.status === "CANCELLED") {
    return {
      status: 400,
      error: "VIP application has been cancelled and cannot accept payment.",
    };
  }

  // 3. Idempotency Check: Look for an existing PENDING payment attempt created within last 20 minutes
  const recentThreshold = new Date(Date.now() - 20 * 60 * 1000);
  const existingAttempt = await paymentsDb.findFirst({
    ticketId: ticket.id,
    status: "PENDING",
  });

  if (existingAttempt && existingAttempt.checkoutUrl && new Date(existingAttempt.createdAt) >= recentThreshold) {
    return {
      status: 200,
      success: true,
      message: "Reused active checkout session for this VIP application.",
      data: {
        applicationReference: ticket.ticketCode,
        merchantReference: existingAttempt.merchantReference,
        checkoutUrl: existingAttempt.checkoutUrl,
        amount: existingAttempt.amount,
        currency: existingAttempt.currency,
        status: existingAttempt.status,
        persisted: true,
      },
    };
  }

  // 4. Generate unique merchant reference (<= 20 chars) and idempotency key
  const merchantReference = generateMerchantReference();
  const idempotencyKey = crypto.randomUUID();

  // Split citizen name safely for Chapa customer payload
  const nameParts = (ticket.citizenName || "Citizen Applicant").trim().split(/\s+/);
  const firstName = nameParts[0] || "Citizen";
  const lastName = nameParts.slice(1).join(" ") || firstName;

  // Format phone number to Chapa v1 documented local Ethiopian format (e.g. 0912345678)
  let cleanPhone = (ticket.citizenPhone || "").trim().replace(/[\s\-()]/g, "");
  if (cleanPhone.startsWith("+251")) cleanPhone = "0" + cleanPhone.slice(4);
  else if (cleanPhone.startsWith("251")) cleanPhone = "0" + cleanPhone.slice(3);
  else if (cleanPhone.length === 9 && (cleanPhone.startsWith("9") || cleanPhone.startsWith("7"))) {
    cleanPhone = "0" + cleanPhone;
  }
  const validPhone = /^0[79]\d{8}$/.test(cleanPhone) ? cleanPhone : null;

  // Require valid citizen email explicitly (Chapa v1 requires customer email; do not fabricate)
  const candidateEmail = email || ticket.email || ticket.citizenEmail;
  if (!candidateEmail || typeof candidateEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail.trim())) {
    return {
      status: 400,
      error: "Validation failed: A valid citizen 'email' is required to initialize payment.",
    };
  }
  const customerEmail = candidateEmail.trim();

  // 5. Call Chapa hosted checkout API (v1 transaction initialize)
  const initResult = await initializeHostedCheckout({
    amount: VIP_FEE,
    currency: VIP_CURRENCY,
    reference: merchantReference, // Sent as tx_ref
    callbackUrl,
    returnUrl,
    customer: {
      firstName,
      lastName,
      phone: validPhone,
      email: customerEmail,
    },
  });

  if (!initResult.success) {
    return {
      status: 502,
      error: `Payment initialization failed: ${initResult.error}`,
    };
  }

  // 6. Persist payment attempt record
  const paymentRecord = await paymentsDb.create({
    id: crypto.randomUUID(),
    ticketId: ticket.id,
    provider: "CHAPA",
    merchantReference,
    providerReference: initResult.providerReference || null,
    idempotencyKey,
    amount: VIP_FEE,
    currency: VIP_CURRENCY,
    status: "PENDING",
    checkoutUrl: initResult.checkoutUrl,
    metadata: initResult.metadata || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  if (!paymentRecord.isPersisted) {
    return {
      status: 500,
      success: false,
      error: `Chapa checkout URL was generated, but saving the payment record to the database failed: ${paymentRecord.persistError || "Database persistence error"}`,
      data: {
        applicationReference: ticket.ticketCode,
        merchantReference: paymentRecord.merchantReference,
        checkoutUrl: paymentRecord.checkoutUrl,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency,
        status: paymentRecord.status,
        persisted: false,
      },
    };
  }

  return {
    status: 201,
    success: true,
    message: "Chapa hosted checkout session initialized successfully.",
    data: {
      applicationReference: ticket.ticketCode,
      merchantReference: paymentRecord.merchantReference,
      checkoutUrl: paymentRecord.checkoutUrl,
      amount: paymentRecord.amount,
      currency: paymentRecord.currency,
      status: paymentRecord.status,
      persisted: true,
    },
  };
}

/**
 * Server-side payment verification and atomic ticket confirmation.
 *
 * Chapa v1 Verification rules:
 * - Query GET /v1/transaction/verify/{tx_ref} using merchantReference.
 * - Require data.status === "success".
 * - Compare amount: matches 1,000 ETB.
 * - Compare currency: matches "ETB".
 * - Compare tx_ref with stored merchantReference.
 * - Idempotently transition ticket PENDING -> CONFIRMED.
 * - Queue assignment is strictly separated and NOT triggered here.
 *
 * @param {string} reference - Merchant reference (tx_ref) or ticket code
 */
export async function verifyVipPayment(reference) {
  if (!reference || typeof reference !== "string" || !reference.trim()) {
    return {
      status: 400,
      error: "Validation failed: 'reference' is required.",
    };
  }

  const cleanRef = reference.trim();

  // 1. Locate payment record
  const payment = await paymentsDb.findByReference(cleanRef);
  if (!payment) {
    return {
      status: 404,
      error: `Payment attempt '${cleanRef}' not found in database.`,
    };
  }

  // 2. Fetch associated ticket
  const ticket = await prisma.vip_tickets.findUnique({
    where: { id: payment.ticketId },
  });

  if (!ticket) {
    return {
      status: 404,
      error: "Associated VIP ticket application not found.",
    };
  }

  // 3. If payment is already recorded as SUCCESS and ticket is CONFIRMED, return idempotent success
  if (payment.status === "SUCCESS" && ticket.status === "CONFIRMED") {
    return {
      status: 200,
      success: true,
      message: "Payment already verified and confirmed.",
      data: {
        applicationReference: ticket.ticketCode,
        merchantReference: payment.merchantReference,
        providerReference: payment.providerReference,
        paymentStatus: payment.status,
        ticketStatus: ticket.status,
        amount: payment.amount,
        currency: payment.currency,
        verifiedAt: payment.verifiedAt,
      },
    };
  }

  // 4. Query Chapa v1 directly for authoritative status via /v1/transaction/verify/{tx_ref}
  const lookupRef = payment.merchantReference;
  const verifyRes = await verifyPaymentWithChapa(lookupRef);

  if (!verifyRes.success) {
    return {
      status: 502,
      error: `Chapa verification query failed: ${verifyRes.error}`,
      data: {
        paymentStatus: payment.status,
        ticketStatus: ticket.status,
      },
    };
  }

  const chapaData = verifyRes.data || {};
  const chapaStatus = String(chapaData.status || "").toLowerCase();

  // 5. Handle non-success states (v1 returns status: "success")
  if (chapaStatus !== "success") {
    let updatedStatus = "PENDING";
    if (chapaStatus === "failed") updatedStatus = "FAILED";
    else if (chapaStatus === "cancelled") updatedStatus = "CANCELLED";
    else if (chapaStatus === "expired") updatedStatus = "EXPIRED";

    if (updatedStatus !== payment.status) {
      await paymentsDb.update(payment.id, {
        status: updatedStatus,
        errorMessage: chapaData.message || `Payment ${chapaStatus}`,
      });
    }

    return {
      status: 200,
      success: false,
      message: `Payment is currently ${chapaStatus || "PENDING"}.`,
      data: {
        applicationReference: ticket.ticketCode,
        merchantReference: payment.merchantReference,
        paymentStatus: updatedStatus,
        ticketStatus: ticket.status,
      },
    };
  }

  // 6. Security verification checks
  // A. Transaction reference validation: ensure response belongs to this exact payment attempt
  const returnedTxRef = chapaData.tx_ref || chapaData.reference;
  if (returnedTxRef && returnedTxRef !== payment.merchantReference) {
    console.error(`[vip-payments] Transaction reference mismatch: Expected ${payment.merchantReference}, received ${returnedTxRef}`);
    await paymentsDb.update(payment.id, {
      status: "FAILED",
      errorMessage: `Transaction reference mismatch: expected ${payment.merchantReference}, got ${returnedTxRef}`,
    });
    return {
      status: 400,
      error: "Payment verification failed: Transaction reference mismatch.",
    };
  }

  // B. Amount check: exactly 1,000 ETB
  const chapaAmount = Number(chapaData.amount);
  const isValidAmount = chapaAmount === VIP_FEE || chapaAmount === VIP_CONFIG.DEFAULT_FEE;
  if (!isValidAmount) {
    console.error(`[vip-payments] Amount mismatch: Expected ${VIP_FEE} ETB, received ${chapaAmount}`);
    await paymentsDb.update(payment.id, {
      status: "FAILED",
      errorMessage: `Amount mismatch: expected ${VIP_FEE}, got ${chapaAmount}`,
    });
    return {
      status: 400,
      error: "Payment verification failed: Amount does not match the VIP application fee.",
    };
  }

  // C. Currency check
  const chapaCurrency = String(chapaData.currency || "").toUpperCase();
  if (chapaCurrency && chapaCurrency !== VIP_CURRENCY) {
    console.error(`[vip-payments] Currency mismatch: Expected ${VIP_CURRENCY}, received ${chapaCurrency}`);
    await paymentsDb.update(payment.id, {
      status: "FAILED",
      errorMessage: `Currency mismatch: expected ${VIP_CURRENCY}, got ${chapaCurrency}`,
    });
    return {
      status: 400,
      error: "Payment verification failed: Currency mismatch.",
    };
  }


  // 7. Atomic transaction: Update payment to SUCCESS and ticket to CONFIRMED
  const verifiedAt = new Date();
  const providerRef = chapaData.reference || chapaData.payment_reference || payment.providerReference;
  const paymentMethod = chapaData.payment_method || chapaData.method || null;

  const result = await prisma.$transaction(async (tx) => {
    // Update payment record
    const updatedPayment = await paymentsDb.update(
      payment.id,
      {
        status: "SUCCESS",
        providerReference: providerRef,
        paymentMethod,
        verifiedAt,
        errorMessage: null,
      },
      tx
    );

    // Fetch fresh ticket status inside transaction to prevent race conditions
    const freshTicket = await tx.vip_tickets.findUnique({
      where: { id: ticket.id },
      select: { id: true, status: true, ticketCode: true },
    });

    // Do NOT overwrite or demote tickets that have already advanced to QUEUED, SERVING, or USED
    const targetTicketStatus =
      freshTicket?.status === "PENDING" ? "CONFIRMED" : freshTicket?.status || "CONFIRMED";

    const updatedTicket = await tx.vip_tickets.update({
      where: { id: ticket.id },
      data: {
        status: targetTicketStatus,
        paymentRef: payment.merchantReference,
        updatedAt: verifiedAt,
      },
    });

    return { updatedPayment, updatedTicket };
  });


  return {
    status: 200,
    success: true,
    message: "Payment successfully verified. VIP application is now CONFIRMED.",
    data: {
      applicationReference: result.updatedTicket.ticketCode,
      merchantReference: result.updatedPayment.merchantReference,
      providerReference: result.updatedPayment.providerReference,
      paymentStatus: result.updatedPayment.status,
      ticketStatus: result.updatedTicket.status,
      amount: result.updatedPayment.amount,
      currency: result.updatedPayment.currency,
      paymentMethod: result.updatedPayment.paymentMethod,
      verifiedAt: result.updatedPayment.verifiedAt,
    },
  };
}

/**
 * Retrieves safe payment status for frontend status polling without exposing secrets.
 *
 * @param {string} reference - Merchant reference or ticket code
 */
export async function getPaymentStatus(reference) {
  if (!reference || typeof reference !== "string" || !reference.trim()) {
    return {
      status: 400,
      error: "Validation failed: 'reference' is required.",
    };
  }

  const clean = reference.trim();

  // Try finding by payment reference
  let payment = await paymentsDb.findByReference(clean);
  let ticket = null;

  if (payment) {
    ticket = await prisma.vip_tickets.findUnique({
      where: { id: payment.ticketId },
    });
  } else {
    // Fallback: Check if reference is a VIP ticket code
    ticket = await findTicketByReferenceOrId(clean);
    if (ticket) {
      payment = await paymentsDb.findFirst({
        ticketId: ticket.id,
      });
    }
  }

  if (!ticket && !payment) {
    return {
      status: 404,
      error: `No payment or application record found matching reference '${clean}'.`,
    };
  }

  return {
    status: 200,
    success: true,
    data: {
      applicationReference: ticket ? ticket.ticketCode : null,
      merchantReference: payment ? payment.merchantReference : null,
      providerReference: payment ? payment.providerReference : null,
      paymentStatus: payment ? payment.status : "NOT_INITIALIZED",
      ticketStatus: ticket ? ticket.status : null,
      amount: payment ? payment.amount : VIP_FEE,
      currency: payment ? payment.currency : VIP_CURRENCY,
      paymentMethod: payment ? payment.paymentMethod : null,
      checkoutUrl: payment ? payment.checkoutUrl : null,
      isVerified: payment ? payment.status === "SUCCESS" : false,
      updatedAt: payment ? payment.updatedAt : ticket?.updatedAt,
    },
  };
}
