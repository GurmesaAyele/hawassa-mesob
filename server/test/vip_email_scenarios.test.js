import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  submitVipApplication,
  maskEmail,
} from "../src/modules/vip-tickets/vip-tickets.controller.js";
import {
  initializeHostedCheckout,
} from "../src/modules/vip-payments/chapa.client.js";
import {
  initializeVipPayment,
} from "../src/modules/vip-payments/vip-payments.service.js";
import prisma from "../src/config/db.js";

// Helper to create mock Express response object
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

describe("Comprehensive VIP Ticket & Chapa Payment Mandatory Email Test Suite", () => {
  // ─── Scenario 1: Ticket creation with valid email ───────────────────────────
  test("Scenario 1: submitVipApplication persists normalized email and returns maskedEmail", async () => {
    const originalTransaction = prisma.$transaction;
    const originalServiceFindMany = prisma.service.findMany;
    const originalTicketFindMany = prisma.vip_tickets.findMany;
    const originalTicketFindUnique = prisma.vip_tickets.findUnique;

    let createdTicketData = null;

    // Mock active services lookup
    prisma.service.findMany = async () => [
      {
        id: "srv-test-01",
        title: { en: "Business Registration" },
        isActive: true,
        provider: { id: "p-01", code: "MOTI", isActive: true, name: { en: "Ministry of Trade" } },
      },
    ];

    // Mock duplicate check & code uniqueness check
    prisma.vip_tickets.findMany = async () => [];
    prisma.vip_tickets.findUnique = async () => null;

    // Mock Prisma transaction create
    prisma.$transaction = async (callback) => {
      const mockTx = {
        vip_tickets: {
          create: async ({ data }) => {
            createdTicketData = data;
            return {
              ...data,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          },
        },
        vip_ticket_services: {
          create: async () => ({ id: "join-id" }),
        },
      };
      return callback(mockTx);
    };

    try {
      const rawEmail = "   Abebe.Kebede@Example.com   ";
      const req = {
        body: {
          citizenName: "Abebe Kebede",
          citizenPhone: "0911223344",
          email: rawEmail,
          purpose: "Urgent passport authentication and priority verification",
          serviceIds: ["srv-test-01"],
        },
      };
      const res = createMockRes();

      await submitVipApplication(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.reference);

      // Verify email was normalized using trim().toLowerCase() before saving
      assert.ok(createdTicketData, "Ticket create must have been called");
      assert.equal(
        createdTicketData.email,
        "abebe.kebede@example.com",
        "Email must be saved normalized in PostgreSQL"
      );

      // Verify response returns masked email per existing PII masking design
      assert.equal(
        res.body.data.maskedEmail,
        "ab****de@example.com",
        "Response data must return properly masked email"
      );
    } finally {
      prisma.$transaction = originalTransaction;
      prisma.service.findMany = originalServiceFindMany;
      prisma.vip_tickets.findMany = originalTicketFindMany;
      prisma.vip_tickets.findUnique = originalTicketFindUnique;
    }
  });

  // ─── Scenario 2: Ticket creation without email ──────────────────────────────
  test("Scenario 2: submitVipApplication returns 400 when email is omitted", async () => {
    const req = {
      body: {
        citizenName: "Almaz Ayana",
        citizenPhone: "0911223344",
        // email omitted
        purpose: "Document verification",
        serviceIds: ["srv-test-01"],
      },
    };
    const res = createMockRes();
    await submitVipApplication(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
      error: "Validation failed: 'email' is required.",
    });

    // Also test empty whitespace email
    const reqEmpty = {
      body: {
        citizenName: "Almaz Ayana",
        citizenPhone: "0911223344",
        email: "   ",
        purpose: "Document verification",
        serviceIds: ["srv-test-01"],
      },
    };
    const resEmpty = createMockRes();
    await submitVipApplication(reqEmpty, resEmpty);

    assert.equal(resEmpty.statusCode, 400);
    assert.deepEqual(resEmpty.body, {
      error: "Validation failed: 'email' is required.",
    });
  });

  // ─── Scenario 3: Ticket creation with invalid email ────────────────────────
  test("Scenario 3: submitVipApplication returns 400 when email format is invalid", async () => {
    const invalidEmails = [
      "not-an-email",
      "missing-at-sign.com",
      "@no-username.com",
      "spaces in @email.com",
      "user@domain",
    ];

    for (const invalidEmail of invalidEmails) {
      const req = {
        body: {
          citizenName: "Derartu Tulu",
          citizenPhone: "0911223344",
          email: invalidEmail,
          purpose: "Document verification",
          serviceIds: ["srv-test-01"],
        },
      };
      const res = createMockRes();
      await submitVipApplication(req, res);

      assert.equal(res.statusCode, 400);
      assert.deepEqual(res.body, {
        error: "Validation failed: 'email' must be a valid email address.",
      });
    }
  });

  // ─── maskEmail helper ──────────────────────────────────────────────────────
  test("maskEmail helper correctly protects PII", () => {
    assert.equal(maskEmail("Abebe.Kebede@example.com"), "Ab****de@example.com");
    assert.equal(maskEmail("ab@example.com"), "a*@example.com");
    assert.equal(maskEmail("abc@example.com"), "a**c@example.com");
    assert.equal(maskEmail("abcd@example.com"), "a**d@example.com");
    assert.equal(maskEmail(""), "");
    assert.equal(maskEmail(null), "");
  });

  // ─── Chapa Client: email required in payload ───────────────────────────────
  test("Chapa client: initializeHostedCheckout rejects missing customer email", async () => {
    const result = await initializeHostedCheckout({
      amount: 1000,
      currency: "ETB",
      reference: "VPTEST12345",
      customer: {
        firstName: "Abebe",
        lastName: "Kebede",
        phone: "0911223344",
        email: null, // Missing email
      },
    });

    assert.equal(result.success, false);
    assert.ok(result.error.includes("Customer email is required"));
  });

  // ─── Chapa payload construction verification ───────────────────────────────
  test("Chapa client: outgoing payload always includes mandatory fields (amount, currency, email, tx_ref)", async () => {
    const originalFetch = globalThis.fetch;
    let interceptedUrl = null;
    let interceptedBody = null;

    globalThis.fetch = async (url, options) => {
      interceptedUrl = url;
      interceptedBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: "success",
          message: "Hosted Link",
          data: {
            checkout_url: "https://checkout.chapa.co/checkout/payment/mock-checkout-url",
          },
        }),
      };
    };

    try {
      const result = await initializeHostedCheckout({
        amount: 1000,
        currency: "ETB",
        reference: "VPMOCKREF123456",
        customer: {
          firstName: "Derartu",
          lastName: "Tulu",
          phone: "0911223344",
          email: "  Derartu.Tulu@Example.com  ",
        },
      });

      assert.equal(result.success, true);
      assert.ok(result.checkoutUrl);
      assert.ok(interceptedUrl.includes("/transaction/initialize"));

      // Verify all mandatory Chapa fields exist in outgoing payload
      assert.equal(interceptedBody.amount, "1000");
      assert.equal(interceptedBody.currency, "ETB");
      assert.equal(interceptedBody.email, "derartu.tulu@example.com");
      assert.equal(interceptedBody.tx_ref, "VPMOCKREF123456");
      assert.equal(interceptedBody.first_name, "Derartu");
      assert.equal(interceptedBody.last_name, "Tulu");
      assert.equal(interceptedBody.phone_number, "0911223344");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // ─── Scenario 4 Service: Ticket with saved email ───────────────────────────
  test("Scenario 4: initializeVipPayment uses saved ticket email without citizen re-entry", async () => {
    const originalFindFirst = prisma.vip_tickets.findFirst;
    const originalFetch = globalThis.fetch;
    const originalPaymentFindFirst = prisma.vip_payments?.findFirst;
    const originalPaymentCreate = prisma.vip_payments?.create;

    let chapaPayload = null;

    // Mock ticket with saved email
    prisma.vip_tickets.findFirst = async () => ({
      id: "ticket-uuid-001",
      ticketCode: "VIP-999001-A1B2",
      citizenName: "Abebe Kebede",
      citizenPhone: "0911223344",
      email: "abebe.kebede@example.com",
      status: "PENDING",
      vipFee: 1000,
      currency: "ETB",
    });

    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async () => null;
      prisma.vip_payments.create = async ({ data }) => ({ ...data, isPersisted: true });
    }

    globalThis.fetch = async (url, options) => {
      chapaPayload = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: "success",
          message: "Hosted Link",
          data: { checkout_url: "https://checkout.chapa.co/checkout/payment/mock-session-001" },
        }),
      };
    };

    try {
      // 1. Initialize without providing email in body (citizen does not re-enter)
      const res = await initializeVipPayment({
        reference: "VIP-999001-A1B2",
      });

      assert.equal(res.status, 201);
      assert.equal(res.success, true);
      assert.equal(chapaPayload.email, "abebe.kebede@example.com");

      // 2. Initialize with arbitrary email in body -> stored email takes precedence
      chapaPayload = null;
      const resWithOther = await initializeVipPayment({
        reference: "VIP-999001-A1B2",
        email: "hacker@evil.com",
      });

      assert.equal(resWithOther.status, 201);
      assert.equal(chapaPayload.email, "abebe.kebede@example.com", "Arbitrary request email must NOT override stored ticket email");
    } finally {
      prisma.vip_tickets.findFirst = originalFindFirst;
      globalThis.fetch = originalFetch;
      if (prisma.vip_payments) {
        prisma.vip_payments.findFirst = originalPaymentFindFirst;
        prisma.vip_payments.create = originalPaymentCreate;
      }
    }
  });

  // ─── Scenario 5 Service: Old ticket without email ──────────────────────────
  test("Scenario 5: initializeVipPayment returns 400 clear validation error for ticket without email", async () => {
    const originalFindFirst = prisma.vip_tickets.findFirst;
    const originalPaymentFindFirst = prisma.vip_payments?.findFirst;
    let chapaCalled = false;

    // Mock old ticket with email = null
    prisma.vip_tickets.findFirst = async () => ({
      id: "ticket-uuid-old",
      ticketCode: "VIP-OLD-999",
      citizenName: "Legacy Citizen",
      citizenPhone: "0919998877",
      email: null, // No email stored
      status: "PENDING",
      vipFee: 1000,
      currency: "ETB",
    });

    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async () => null;
    }

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      chapaCalled = true;
      return { ok: false };
    };

    try {
      // Initialize payment without email
      const res = await initializeVipPayment({
        reference: "VIP-OLD-999",
      });

      assert.equal(res.status, 400);
      assert.equal(chapaCalled, false, "No Chapa request should be sent when email is missing");
      assert.ok(
        res.error.includes("email"),
        `Error must clearly indicate email requirement: ${res.error}`
      );
    } finally {
      prisma.vip_tickets.findFirst = originalFindFirst;
      globalThis.fetch = originalFetch;
      if (prisma.vip_payments) {
        prisma.vip_payments.findFirst = originalPaymentFindFirst;
      }
    }
  });

  // ─── Scenario 6: Backward Compatibility for Legacy Ticket with Email ───────
  test("Scenario 6: Legacy ticket can supply valid email during payment and existing flow succeeds", async () => {
    const originalFindFirst = prisma.vip_tickets.findFirst;
    const originalUpdate = prisma.vip_tickets.update;
    const originalPaymentFindFirst = prisma.vip_payments?.findFirst;
    const originalPaymentCreate = prisma.vip_payments?.create;
    const originalFetch = globalThis.fetch;

    let updatedTicketEmail = null;
    let chapaPayload = null;

    prisma.vip_tickets.findFirst = async () => ({
      id: "ticket-uuid-legacy",
      ticketCode: "VIP-LEGACY-001",
      citizenName: "Legacy Citizen",
      citizenPhone: "0919998877",
      email: null, // Legacy without email
      status: "PENDING",
      vipFee: 1000,
      currency: "ETB",
    });

    prisma.vip_tickets.update = async ({ data }) => {
      updatedTicketEmail = data.email;
      return { id: "ticket-uuid-legacy", email: data.email };
    };

    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async () => null;
      prisma.vip_payments.create = async ({ data }) => ({ ...data, isPersisted: true });
    }

    globalThis.fetch = async (url, options) => {
      chapaPayload = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: "success",
          message: "Hosted Link",
          data: { checkout_url: "https://checkout.chapa.co/checkout/payment/legacy-session" },
        }),
      };
    };

    try {
      const res = await initializeVipPayment({
        reference: "VIP-LEGACY-001",
        email: "  Legacy.Citizen@Example.com  ",
      });

      assert.equal(res.status, 201);
      assert.equal(res.success, true);
      assert.equal(updatedTicketEmail, "legacy.citizen@example.com", "Must persist normalized email to legacy ticket");
      assert.equal(chapaPayload.email, "legacy.citizen@example.com", "Chapa receives normalized email");
    } finally {
      prisma.vip_tickets.findFirst = originalFindFirst;
      prisma.vip_tickets.update = originalUpdate;
      globalThis.fetch = originalFetch;
      if (prisma.vip_payments) {
        prisma.vip_payments.findFirst = originalPaymentFindFirst;
        prisma.vip_payments.create = originalPaymentCreate;
      }
    }
  });
});
