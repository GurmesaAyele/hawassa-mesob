import { describe, test, beforeEach, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../src/config/db.js";
import {
  verifyVipPayment,
  getPaymentStatus,
  _resetVerificationCache,
  VIP_FEE,
  VIP_CURRENCY,
} from "../src/modules/vip-payments/vip-payments.service.js";
import {
  verifyPaymentHandler,
  getPaymentStatusHandler,
} from "../src/modules/vip-payments/vip-payments.controller.js";
import {
  getVipTicketByReference,
  getVipTicketById,
} from "../src/modules/vip-tickets/vip-tickets.controller.js";
import { generateVipTicketQrCode } from "../src/utils/qr.js";
import { preventStatusCache } from "../src/modules/vip-payments/vip-payments.routes.js";

// Helper to create mock Express response object with header tracking
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    set(nameOrObj, val) {
      if (typeof nameOrObj === "object") {
        for (const [k, v] of Object.entries(nameOrObj)) {
          this.headers[k.toLowerCase()] = v;
        }
      } else {
        this.headers[nameOrObj.toLowerCase()] = val;
      }
      return this;
    },
    setHeader(name, val) {
      this.headers[name.toLowerCase()] = val;
      return this;
    },
    get(name) {
      return this.headers[name.toLowerCase()];
    },
    getHeader(name) {
      return this.headers[name.toLowerCase()];
    },
  };
  return res;
}

describe("VIP Payment Verification, Confirmation & QR Code Test Suite", () => {
  const originalFetch = globalThis.fetch;
  const originalEnvSecret = process.env.CHAPA_SECRET_KEY;

  before(() => {
    process.env.CHAPA_SECRET_KEY = "CHASECK_TEST-123456789";
  });

  after(() => {
    process.env.CHAPA_SECRET_KEY = originalEnvSecret;
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    _resetVerificationCache();
  });

  // ─── Scenario 1: Successful Chapa payment confirms ticket and generates QR code ──────
  test("Scenario 1: Successful Chapa payment updates payment SUCCESS, ticket CONFIRMED, and generates QR code", async () => {
    const originalTransaction = prisma.$transaction;
    const originalTicketFindUnique = prisma.vip_tickets.findUnique;
    const originalPaymentFindFirst = prisma.vip_payments?.findFirst;

    const mockTicketId = "ticket-uuid-001";
    const mockTicketCode = "VIP-845123-A4B2";
    const mockMerchantRef = "VPMW9ABC1234567890";
    const mockProviderRef = "chapa-trans-998877";

    let mockTicket = {
      id: mockTicketId,
      ticketCode: mockTicketCode,
      citizenName: "Abebe Kebede",
      citizenPhone: "0911223344",
      email: "abebe@example.com",
      status: "PENDING",
      paymentRef: null,
      qrCodeUrl: null,
      vipFee: 1000,
      currency: "ETB",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let mockPayment = {
      id: "pay-uuid-001",
      ticketId: mockTicketId,
      provider: "CHAPA",
      merchantReference: mockMerchantRef,
      providerReference: null,
      amount: 1000,
      currency: "ETB",
      status: "PENDING",
      checkoutUrl: "https://checkout.chapa.co/test",
      paymentMethod: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock global fetch for Chapa verification
    globalThis.fetch = async (url) => {
      assert.ok(String(url).includes(`/transaction/verify/${mockMerchantRef}`));
      return new Response(
        JSON.stringify({
          status: "success",
          data: {
            status: "success",
            tx_ref: mockMerchantRef,
            reference: mockProviderRef,
            amount: "1,000.00", // Formatted string from Chapa
            currency: "ETB",
            payment_method: "telebirr",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    // Mock prisma queries
    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async ({ where }) => {
        if (where?.merchantReference === mockMerchantRef || where?.ticketId === mockTicketId || where?.OR?.some(o => o.merchantReference === mockMerchantRef)) {
          return mockPayment;
        }
        return null;
      };
      prisma.vip_payments.update = async ({ where, data }) => {
        mockPayment = { ...mockPayment, ...data };
        return mockPayment;
      };
    }

    prisma.vip_tickets.findUnique = async ({ where }) => {
      if (where.id === mockTicketId || where.ticketCode === mockTicketCode) {
        return mockTicket;
      }
      return null;
    };
    prisma.vip_tickets.findFirst = async () => mockTicket;

    prisma.$transaction = async (callback) => {
      const mockTx = {
        vip_payments: {
          findUnique: async () => mockPayment,
          update: async ({ data }) => {
            mockPayment = { ...mockPayment, ...data };
            return mockPayment;
          },
        },
        vip_tickets: {
          findUnique: async () => mockTicket,
          update: async ({ data }) => {
            mockTicket = { ...mockTicket, ...data };
            return mockTicket;
          },
        },
      };
      return callback(mockTx);
    };

    try {
      const res = await verifyVipPayment(mockMerchantRef);

      assert.equal(res.status, 200);
      assert.equal(res.success, true);
      assert.equal(res.data.paymentStatus, "SUCCESS");
      assert.equal(res.data.ticketStatus, "CONFIRMED");
      assert.equal(res.data.isVerified, true);
      assert.equal(res.data.isConfirmed, true);
      assert.equal(res.data.isPending, false);
      assert.equal(res.data.canRetry, false);
      assert.equal(res.data.ticketCode, mockTicketCode);
      assert.equal(res.data.merchantReference, mockMerchantRef);
      assert.equal(res.data.providerReference, mockProviderRef);
      assert.ok(res.data.qrCodeUrl, "QR code URL must be present in response");
      assert.ok(
        res.data.qrCodeUrl.startsWith("data:image/svg+xml"),
        "QR code URL must be a valid SVG Data URI"
      );

      // Verify persistent ticket record
      assert.equal(mockTicket.status, "CONFIRMED");
      assert.equal(mockTicket.paymentRef, mockMerchantRef);
      assert.ok(mockTicket.qrCodeUrl.startsWith("data:image/svg+xml"));
    } finally {
      prisma.$transaction = originalTransaction;
      prisma.vip_tickets.findUnique = originalTicketFindUnique;
      if (prisma.vip_payments && originalPaymentFindFirst) {
        prisma.vip_payments.findFirst = originalPaymentFindFirst;
      }
    }
  });

  // ─── Scenario 2: Failed payment does not confirm ticket ───────────────────────
  test("Scenario 2: Failed payment updates payment to FAILED and does NOT confirm ticket", async () => {
    const mockMerchantRef = "VPMW9FAIL123456";

    let mockTicket = {
      id: "ticket-fail-001",
      ticketCode: "VIP-FAIL-001",
      status: "PENDING",
      qrCodeUrl: null,
    };

    let mockPayment = {
      id: "pay-fail-001",
      ticketId: "ticket-fail-001",
      merchantReference: mockMerchantRef,
      status: "PENDING",
      amount: 1000,
      currency: "ETB",
    };

    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          status: "success",
          data: {
            status: "failed",
            tx_ref: mockMerchantRef,
            message: "Insufficient funds in customer wallet",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async () => mockPayment;
      prisma.vip_payments.update = async ({ data }) => {
        mockPayment = { ...mockPayment, ...data };
        return mockPayment;
      };
    }
    prisma.vip_tickets.findUnique = async () => mockTicket;

    const res = await verifyVipPayment(mockMerchantRef);

    assert.equal(res.status, 200);
    assert.equal(res.success, false);
    assert.equal(res.data.paymentStatus, "FAILED");
    assert.equal(res.data.ticketStatus, "PENDING");
    assert.equal(res.data.isVerified, false);
    assert.equal(res.data.isConfirmed, false);
    assert.equal(res.data.canRetry, true);

    // Verify ticket was NOT updated
    assert.equal(mockTicket.status, "PENDING");
    assert.equal(mockTicket.qrCodeUrl, null);
  });

  // ─── Scenario 3: Pending payment does not confirm ticket prematurely ─────────
  test("Scenario 3: Pending payment leaves ticket PENDING and not confirmed", async () => {
    const mockMerchantRef = "VPMW9PEND123456";

    let mockTicket = {
      id: "ticket-pend-001",
      ticketCode: "VIP-PEND-001",
      status: "PENDING",
      qrCodeUrl: null,
    };

    let mockPayment = {
      id: "pay-pend-001",
      ticketId: "ticket-pend-001",
      merchantReference: mockMerchantRef,
      status: "PENDING",
      amount: 1000,
      currency: "ETB",
    };

    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          status: "success",
          data: {
            status: "pending",
            tx_ref: mockMerchantRef,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async () => mockPayment;
    }
    prisma.vip_tickets.findUnique = async () => mockTicket;

    const res = await verifyVipPayment(mockMerchantRef);

    assert.equal(res.status, 200);
    assert.equal(res.success, false);
    assert.equal(res.data.paymentStatus, "PENDING");
    assert.equal(res.data.ticketStatus, "PENDING");
    assert.equal(res.data.isVerified, false);
    assert.equal(res.data.isConfirmed, false);
    assert.equal(res.data.isPending, true);
    assert.equal(res.data.canRetry, false);

    assert.equal(mockTicket.status, "PENDING");
  });

  // ─── Scenario 4: Repeated / Idempotent verification creates no duplicate records ──
  test("Scenario 4: Repeated verification is idempotent, creates no duplicate records or tickets", async () => {
    let fetchCalled = false;
    globalThis.fetch = async () => {
      fetchCalled = true;
      return new Response(JSON.stringify({ status: "success" }), { status: 200 });
    };

    const mockMerchantRef = "VPMW9ALREADYPAID";
    const existingQr = generateVipTicketQrCode("VIP-ALREADY-001");

    const mockTicket = {
      id: "ticket-already-001",
      ticketCode: "VIP-ALREADY-001",
      status: "CONFIRMED",
      paymentRef: mockMerchantRef,
      qrCodeUrl: existingQr,
      vipFee: 1000,
      currency: "ETB",
    };

    const mockPayment = {
      id: "pay-already-001",
      ticketId: "ticket-already-001",
      merchantReference: mockMerchantRef,
      providerReference: "chapa-existing-99",
      amount: 1000,
      currency: "ETB",
      status: "SUCCESS",
      verifiedAt: new Date("2026-10-25T14:00:00Z"),
    };

    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async () => mockPayment;
    }
    prisma.vip_tickets.findUnique = async () => mockTicket;

    const res = await verifyVipPayment(mockMerchantRef);

    assert.equal(res.status, 200);
    assert.equal(res.success, true);
    assert.equal(res.data.paymentStatus, "SUCCESS");
    assert.equal(res.data.ticketStatus, "CONFIRMED");
    assert.equal(res.data.isVerified, true);
    assert.equal(res.data.isConfirmed, true);
    assert.equal(res.data.qrCodeUrl, existingQr);

    // Provider must NEVER be re-queried when payment is already SUCCESS
    assert.equal(fetchCalled, false, "Chapa API must not be called when already SUCCESS");
  });

  // ─── Scenario 5: Complete confirmed ticket retrieval with QR code data URI ─────
  test("Scenario 5: Ticket retrieval returns complete confirmed ticket with QR code data URI", async () => {
    const ticketCode = "VIP-QR-CHECK-001";
    const qrCode = generateVipTicketQrCode(ticketCode);

    const mockTicket = {
      id: "ticket-uuid-777",
      ticketCode,
      citizenName: "Selamawit Desta",
      citizenPhone: "0912345678",
      email: "selamawit@example.com",
      status: "CONFIRMED",
      paymentRef: "VPMW9SelamRef",
      qrCodeUrl: qrCode,
      vipFee: 1000,
      currency: "ETB",
      purpose: "Business visa fast-track",
      createdAt: new Date(),
      updatedAt: new Date(),
      ticket_services: [
        {
          service: {
            id: "service-01",
            title: { en: "Fast Track Visa" },
            estimatedFee: 500,
            processingDays: 1,
            isActive: true,
            provider: {
              id: "prov-01",
              code: "IMMIG",
              name: { en: "Immigration" },
            },
          },
        },
      ],
    };

    prisma.vip_tickets.findUnique = async ({ where }) => {
      if (where.ticketCode === ticketCode || where.id === mockTicket.id) {
        return mockTicket;
      }
      return null;
    };

    const req = { params: { code: ticketCode } };
    const res = createMockRes();

    await getVipTicketByReference(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    const data = res.body.data;

    // Verify all required ticket fields
    assert.equal(data.id, mockTicket.id);
    assert.equal(data.reference, ticketCode);
    assert.equal(data.ticketCode, ticketCode);
    assert.equal(data.paymentRef, "VPMW9SelamRef");
    assert.equal(data.status, "CONFIRMED");
    assert.equal(data.vipFee, 1000);
    assert.equal(data.currency, "ETB");
    assert.equal(data.maskedCitizenName, "Selamawit D.");
    assert.equal(data.maskedPhone, "09****5678");
    assert.equal(data.maskedEmail, "se****it@example.com");

    // Verify QR code is fully present and valid SVG Data URI
    assert.ok(data.qrCodeUrl, "qrCodeUrl must be populated for confirmed ticket");
    assert.ok(data.qrCodeUrl.startsWith("data:image/svg+xml;utf8,%3Csvg"));
  });

  // ─── Scenario 6: Multiple payment attempts select the latest attempt ─────────
  test("Scenario 6: Multiple payment attempts select latest attempt (orderBy: createdAt desc)", async () => {
    const mockTicketId = "ticket-multi-attempts";
    const mockTicketCode = "VIP-MULTI-999";

    const oldAttempt = {
      id: "pay-attempt-1-old",
      ticketId: mockTicketId,
      merchantReference: "VPM-OLD-ATTEMPT-1",
      status: "FAILED",
      createdAt: new Date("2026-11-01T10:00:00Z"),
    };

    const latestAttempt = {
      id: "pay-attempt-2-latest",
      ticketId: mockTicketId,
      merchantReference: "VPM-LATEST-ATTEMPT-2",
      status: "SUCCESS",
      qrCodeUrl: "data:image/svg+xml;utf8,test",
      createdAt: new Date("2026-11-01T10:30:00Z"),
    };

    let findFirstOrderByParam = null;

    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async (args) => {
        findFirstOrderByParam = args.orderBy;
        if (args.where?.ticketId === mockTicketId) {
          return latestAttempt;
        }
        if (args.where?.OR?.some(o => o.merchantReference === "VPM-LATEST-ATTEMPT-2")) {
          return latestAttempt;
        }
        return null;
      };
    }

    prisma.vip_tickets.findFirst = async () => ({
      id: mockTicketId,
      ticketCode: mockTicketCode,
      status: "CONFIRMED",
    });

    prisma.vip_tickets.findUnique = async () => ({
      id: mockTicketId,
      ticketCode: mockTicketCode,
      status: "CONFIRMED",
    });

    const statusRes = await getPaymentStatus(mockTicketCode);

    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.data.merchantReference, "VPM-LATEST-ATTEMPT-2");
    assert.deepEqual(findFirstOrderByParam, { createdAt: "desc" });
  });

  // ─── Scenario 7: QR code correctly encodes ticket reference and is independently decodable ─
  test("Scenario 7: QR code correctly encodes ticket reference, contains no PII, and is decodable", () => {
    const testCode = "VIP-649796-8123";
    const qrDataUri = generateVipTicketQrCode(testCode);

    assert.ok(qrDataUri.startsWith("data:image/svg+xml;utf8,"));
    const decodedSvg = decodeURIComponent(qrDataUri.replace("data:image/svg+xml;utf8,", ""));

    // Check SVG structure and crisp edges
    assert.ok(decodedSvg.includes("<svg xmlns=\"http://www.w3.org/2000/svg\""));
    assert.ok(decodedSvg.includes("shape-rendering=\"crispEdges\""));
    assert.ok(decodedSvg.includes("fill=\"#000000\""));
    assert.ok(decodedSvg.includes("fill=\"#ffffff\""));

    // Verify format info and independently decode bit matrix
    const vb = decodedSvg.match(/viewBox="0 0 (\d+) (\d+)"/);
    assert.ok(vb, "viewBox must be present");
    const totalDim = parseInt(vb[1], 10);
    const size = totalDim - 8;

    const matrix = Array.from({ length: size }, () => new Uint8Array(size));
    const matches = decodedSvg.matchAll(/M(\d+),(\d+)h1v1h-1z/g);
    for (const match of matches) {
      const c = parseInt(match[1], 10) - 4;
      const r = parseInt(match[2], 10) - 4;
      if (r >= 0 && r < size && c >= 0 && c < size) {
        matrix[r][c] = 1;
      }
    }

    // Verify Format Information: Level M (00), Mask 0 (000) => 0x5412
    const tlCoords = [
      [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
      [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
    ];
    let fmtVal = 0;
    for (let i = 0; i < 15; i++) {
      const [r, c] = tlCoords[i];
      fmtVal = (fmtVal << 1) | matrix[r][c];
    }
    assert.equal(fmtVal, 0x5412, "QR format information must equal standard 0x5412 (Level M, Mask 0)");

    // Unmask and extract payload bits
    const isFunc = Array.from({ length: size }, () => new Uint8Array(size));
    function mark(r, c) { if (r >= 0 && r < size && c >= 0 && c < size) isFunc[r][c] = 1; }
    for (const [fr, fc] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
      for (let r = -1; r <= 7; r++) { for (let c = -1; c <= 7; c++) mark(fr + r, fc + c); }
    }
    for (let i = 0; i < size; i++) { mark(6, i); mark(i, 6); }
    if (size === 25) { for (let r = -2; r <= 2; r++) { for (let c = -2; c <= 2; c++) mark(18 + r, 18 + c); } }
    mark(size - 8, 8);
    for (let i = 0; i <= 8; i++) { mark(8, i); mark(i, 8); }
    for (let i = size - 8; i < size; i++) { mark(8, i); mark(i, 8); }

    const dataBits = [];
    let upward = true;
    for (let right = size - 1; right > 0; right -= 2) {
      if (right === 6) right--;
      const rows = upward
        ? Array.from({ length: size }, (_, i) => size - 1 - i)
        : Array.from({ length: size }, (_, i) => i);
      for (const r of rows) {
        for (const c of [right, right - 1]) {
          if (!isFunc[r][c]) {
            let bit = matrix[r][c];
            if ((r + c) % 2 === 0) bit ^= 1;
            dataBits.push(bit);
          }
        }
      }
      upward = !upward;
    }

    let bitPos = 0;
    function readBits(len) {
      let v = 0;
      for (let i = 0; i < len; i++) v = (v << 1) | dataBits[bitPos++];
      return v;
    }
    const mode = readBits(4);
    assert.equal(mode, 0b0100, "Must be byte mode (0100)");
    const charLen = readBits(8);
    assert.equal(charLen, testCode.length, "Character length must match testCode length");

    let extracted = "";
    for (let i = 0; i < charLen; i++) extracted += String.fromCharCode(readBits(8));

    assert.equal(extracted, testCode, "Decoded text from QR matrix must match ticket code exactly");

    // Ensure NO PII or payment secrets are in the SVG
    assert.ok(!decodedSvg.includes("citizen"), "QR code must not contain citizen PII");
    assert.ok(!decodedSvg.includes("chapa"), "QR code must not contain payment provider secrets");
  });

  // ─── Scenario 8: Invalid or mismatched transaction reference rejects confirmation ─
  test("Scenario 8: Mismatched or missing transaction reference does not confirm ticket", async () => {
    const mockMerchantRef = "VPMW9EXPECTED123";

    let mockTicket = {
      id: "ticket-mismatch-001",
      ticketCode: "VIP-MISMATCH-001",
      status: "PENDING",
      qrCodeUrl: null,
    };

    let mockPayment = {
      id: "pay-mismatch-001",
      ticketId: "ticket-mismatch-001",
      merchantReference: mockMerchantRef,
      status: "PENDING",
      amount: 1000,
      currency: "ETB",
    };

    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async () => mockPayment;
    }
    prisma.vip_tickets.findUnique = async () => mockTicket;

    // 8A: Mismatched tx_ref (genuine mismatch -> 400 client error)
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          status: "success",
          data: {
            status: "success",
            tx_ref: "VPMW9_COMPLETELY_DIFFERENT", // Mismatch!
            amount: 1000,
            currency: "ETB",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const mismatchRes = await verifyVipPayment(mockMerchantRef);
    assert.equal(mismatchRes.status, 400);
    assert.equal(mismatchRes.success, false);
    assert.equal(mismatchRes.error, "Payment verification failed: Transaction reference mismatch.");
    assert.equal(mismatchRes.data.isConfirmed, false);
    assert.equal(mockTicket.status, "PENDING", "Ticket must not be confirmed on reference mismatch");

    // 8B: Missing tx_ref (inconclusive response -> 200 with isPending: true, NOT 400 error)
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          status: "success",
          data: {
            status: "success",
            reference: "chapa-internal-ref-only",
            amount: 1000,
            currency: "ETB",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const inconclusiveRes = await verifyVipPayment(mockMerchantRef);
    assert.equal(inconclusiveRes.status, 200, "Inconclusive response must return 200 OK with isPending: true");
    assert.equal(inconclusiveRes.success, false);
    assert.ok(inconclusiveRes.message.includes("inconclusive"));
    assert.equal(inconclusiveRes.data.isConfirmed, false);
    assert.equal(inconclusiveRes.data.isPending, true);
    assert.equal(mockTicket.status, "PENDING", "Ticket must not be confirmed on missing tx_ref");
    assert.notEqual(mockPayment.status, "FAILED", "Payment must not be marked FAILED on inconclusive response");
  });

  // ─── Bonus Verification: getPaymentStatus polls Chapa with cooldown protection ─
  test("Bonus: getPaymentStatus triggers active Chapa verification for PENDING payments with 3s cooldown", async () => {
    let chapaVerifyCalls = 0;

    const mockMerchantRef = "VPMW9POLL123456";
    let mockTicket = {
      id: "ticket-poll-001",
      ticketCode: "VIP-POLL-001",
      status: "PENDING",
      qrCodeUrl: null,
    };

    let mockPayment = {
      id: "pay-poll-001",
      ticketId: "ticket-poll-001",
      merchantReference: mockMerchantRef,
      status: "PENDING",
      amount: 1000,
      currency: "ETB",
    };

    globalThis.fetch = async () => {
      chapaVerifyCalls++;
      return new Response(
        JSON.stringify({
          status: "success",
          data: {
            status: "success",
            tx_ref: mockMerchantRef,
            reference: "chapa-polled-ref",
            amount: 1000,
            currency: "ETB",
            payment_method: "cbe",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async () => mockPayment;
      prisma.vip_payments.update = async ({ data }) => {
        mockPayment = { ...mockPayment, ...data };
        return mockPayment;
      };
    }
    prisma.vip_tickets.findFirst = async () => mockTicket;
    prisma.vip_tickets.findUnique = async () => mockTicket;
    prisma.$transaction = async (cb) => {
      mockPayment.status = "SUCCESS";
      mockTicket.status = "CONFIRMED";
      mockTicket.qrCodeUrl = generateVipTicketQrCode(mockTicket.ticketCode);
      return {
        updatedPayment: mockPayment,
        updatedTicket: mockTicket,
      };
    };

    // First poll triggers verification
    const poll1 = await getPaymentStatus(mockTicket.ticketCode);
    assert.equal(chapaVerifyCalls, 1, "First status poll must trigger Chapa verification");
    assert.equal(poll1.data.paymentStatus, "SUCCESS");
    assert.equal(poll1.data.ticketStatus, "CONFIRMED");
    assert.equal(poll1.data.isConfirmed, true);
    assert.ok(poll1.data.qrCodeUrl);

    // Immediate second poll: payment is already SUCCESS, no new verification needed
    const poll2 = await getPaymentStatus(mockTicket.ticketCode);
    assert.equal(chapaVerifyCalls, 1, "Subsequent status poll must not re-query Chapa");
    assert.equal(poll2.data.isConfirmed, true);
  });

  // ─── Scenario 9: Scanned QR code payload retrieves and validates the existing ticket ──
  test("Scenario 9: Scanned QR code payload retrieves and validates existing ticket via backend", async () => {
    const existingTicketCode = "VIP-SCAN-VALIDATE-01";
    const qrDataUri = generateVipTicketQrCode(existingTicketCode);

    // In a physical MESOB check-in, receptionist scanner extracts the ticketCode from the QR code
    const scannedCode = existingTicketCode;

    const mockTicket = {
      id: "ticket-scan-uuid-001",
      ticketCode: existingTicketCode,
      citizenName: "Kassahun Melaku",
      citizenPhone: "0911998877",
      email: "kassahun@example.com",
      status: "CONFIRMED",
      paymentRef: "VPMW9KassaPayment",
      qrCodeUrl: qrDataUri,
      vipFee: 1000,
      currency: "ETB",
      purpose: "Urgent Investment License",
      ticket_services: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prisma.vip_tickets.findUnique = async ({ where }) => {
      if (where.ticketCode === scannedCode || where.id === scannedCode) {
        return mockTicket;
      }
      return null;
    };

    // Staff scanner queries reference endpoint using decoded QR text
    const req = { params: { code: scannedCode } };
    const res = createMockRes();
    await getVipTicketByReference(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.ticketCode, existingTicketCode);
    assert.equal(res.body.data.status, "CONFIRMED");
    assert.equal(res.body.data.paymentRef, "VPMW9KassaPayment");
    assert.equal(res.body.data.qrCodeUrl, qrDataUri);
  });

  // ─── Regression Test 1: Pending payment returns HTTP 200, isPending: true, isConfirmed: false
  test("Regression Test 1: PENDING payment returns HTTP 200, isPending: true, isConfirmed: false", async () => {
    const pendingTicket = {
      id: "ticket-reg-pending-01",
      ticketCode: "VIP-PENDING-0001",
      status: "PENDING",
      paymentRef: null,
      qrCodeUrl: null,
    };
    const pendingPayment = {
      id: "pay-reg-pending-01",
      ticketId: "ticket-reg-pending-01",
      merchantReference: "VPMW9PENDING0001",
      status: "PENDING",
      amount: 1000,
      currency: "ETB",
    };

    prisma.vip_tickets.findFirst = async () => pendingTicket;
    prisma.vip_tickets.findUnique = async () => pendingTicket;
    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async () => pendingPayment;
      prisma.vip_payments.findByReference = async () => pendingPayment;
    }

    const req = { params: { reference: pendingTicket.ticketCode }, query: {} };
    const res = createMockRes();
    await getPaymentStatusHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.isPending, true);
    assert.equal(res.body.data.isConfirmed, false);
    assert.equal(res.body.data.paymentStatus, "PENDING");
    assert.equal(res.body.data.ticketStatus, "PENDING");
  });

  // ─── Regression Test 2: Confirmed ticket returns HTTP 200, isConfirmed: true, isPending: false, canRetry: false, and QR code
  test("Regression Test 2: CONFIRMED ticket returns HTTP 200, isConfirmed: true, isPending: false, canRetry: false, and QR code", async () => {
    const confirmedTicket = {
      id: "ticket-reg-conf-02",
      ticketCode: "VIP-CONF-0002",
      status: "CONFIRMED",
      paymentRef: "VPMW9CONF0002",
      qrCodeUrl: generateVipTicketQrCode("VIP-CONF-0002"),
    };
    const successPayment = {
      id: "pay-reg-conf-02",
      ticketId: "ticket-reg-conf-02",
      merchantReference: "VPMW9CONF0002",
      status: "SUCCESS",
      amount: 1000,
      currency: "ETB",
      paymentMethod: "telebirr",
    };

    prisma.vip_tickets.findFirst = async () => confirmedTicket;
    prisma.vip_tickets.findUnique = async () => confirmedTicket;
    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async () => successPayment;
      prisma.vip_payments.findByReference = async () => successPayment;
    }

    const req = { params: { reference: confirmedTicket.ticketCode }, query: {} };
    const res = createMockRes();
    await getPaymentStatusHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.isConfirmed, true);
    assert.equal(res.body.data.isPending, false);
    assert.equal(res.body.data.canRetry, false);
    assert.equal(res.body.data.isVerified, true);
    assert.ok(res.body.data.qrCodeUrl.startsWith("data:image/svg+xml;utf8,"));
  });

  // ─── Regression Test 3: Status endpoint strips If-None-Match and prevents HTTP 304 on polling
  test("Regression Test 3: Status endpoint strips If-None-Match and ensures HTTP 200 with non-empty body (prevents 304)", async () => {
    const testTicket = {
      id: "ticket-reg-cache-03",
      ticketCode: "VIP-NOCACHE-0003",
      status: "CONFIRMED",
      paymentRef: "VPMW9NOCACHE03",
      qrCodeUrl: generateVipTicketQrCode("VIP-NOCACHE-0003"),
    };
    const testPayment = {
      id: "pay-reg-cache-03",
      ticketId: "ticket-reg-cache-03",
      merchantReference: "VPMW9NOCACHE03",
      status: "SUCCESS",
      amount: 1000,
      currency: "ETB",
    };

    prisma.vip_tickets.findFirst = async () => testTicket;
    prisma.vip_tickets.findUnique = async () => testTicket;
    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async () => testPayment;
      prisma.vip_payments.findByReference = async () => testPayment;
    }

    // First request: simulate client polling without cache headers
    const req1 = {
      method: "GET",
      url: `/api/vip-payments/status/${testTicket.ticketCode}`,
      headers: { host: "localhost:5000" },
      params: { reference: testTicket.ticketCode },
    };
    const res1 = createMockRes();
    preventStatusCache(req1, res1, () => {});
    await getPaymentStatusHandler(req1, res1);

    assert.equal(res1.statusCode, 200);
    assert.ok(res1.body && res1.body.success);
    assert.equal(res1.headers["cache-control"], "no-store, no-cache, must-revalidate, proxy-revalidate");
    assert.equal(res1.headers["pragma"], "no-cache");
    assert.equal(res1.headers["expires"], "0");

    // Second request: client repeats request with If-None-Match and If-Modified-Since
    const req2 = {
      method: "GET",
      url: `/api/vip-payments/status/${testTicket.ticketCode}`,
      headers: {
        host: "localhost:5000",
        "if-none-match": 'W/"12345-mocketag"',
        "if-modified-since": new Date().toUTCString(),
      },
      params: { reference: testTicket.ticketCode },
    };
    const res2 = createMockRes();

    // Execute middleware
    let nextCalled = false;
    preventStatusCache(req2, res2, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    // Verify conditional headers were removed so Express req.fresh evaluates strictly to false
    assert.equal(req2.headers["if-none-match"], undefined);
    assert.equal(req2.headers["if-modified-since"], undefined);

    // Execute handler
    await getPaymentStatusHandler(req2, res2);

    // Status must remain 200 OK with full JSON body
    assert.equal(res2.statusCode, 200);
    assert.notEqual(res2.statusCode, 304, "Status polling must never return HTTP 304");
    assert.ok(res2.body && res2.body.data && res2.body.data.isConfirmed === true);
  });

  // ─── Regression Test 4: Confirmed ticket skips external Chapa verification completely
  test("Regression Test 4: Confirmed ticket skips external Chapa verification completely", async () => {
    let chapaFetchCalls = 0;
    globalThis.fetch = async () => {
      chapaFetchCalls++;
      throw new Error("Chapa fetch should NOT be called for already confirmed tickets");
    };

    const confirmedTicket = {
      id: "ticket-reg-skip-04",
      ticketCode: "VIP-SKIP-0004",
      status: "CONFIRMED",
      paymentRef: "VPMW9SKIP0004",
      qrCodeUrl: generateVipTicketQrCode("VIP-SKIP-0004"),
    };
    const pendingPaymentRecord = {
      id: "pay-reg-skip-04",
      ticketId: "ticket-reg-skip-04",
      merchantReference: "VPMW9SKIP0004",
      status: "PENDING", // Even if payment record is marked PENDING in DB
      amount: 1000,
      currency: "ETB",
    };

    prisma.vip_tickets.findFirst = async () => confirmedTicket;
    prisma.vip_tickets.findUnique = async () => confirmedTicket;
    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async () => pendingPaymentRecord;
      prisma.vip_payments.findByReference = async () => pendingPaymentRecord;
    }

    const result = await getPaymentStatus(confirmedTicket.ticketCode);

    assert.equal(chapaFetchCalls, 0, "No external Chapa verification call must be made");
    assert.equal(result.status, 200);
    assert.equal(result.data.isConfirmed, true);
    assert.equal(result.data.isPending, false);
  });

  // ─── Regression Test 5: VIP ticket reference resolves the payment stored in ticket.paymentRef
  test("Regression Test 5: VIP ticket reference resolves the payment stored in ticket.paymentRef", async () => {
    const linkedMerchantRef = "VPMW9LINKEDPAYREF5";
    const mockTicket = {
      id: "ticket-reg-payref-05",
      ticketCode: "VIP-PAYREF-0005",
      status: "CONFIRMED",
      paymentRef: linkedMerchantRef,
      qrCodeUrl: generateVipTicketQrCode("VIP-PAYREF-0005"),
    };

    const linkedPayment = {
      id: "pay-reg-linked-05",
      ticketId: "ticket-reg-payref-05",
      merchantReference: linkedMerchantRef,
      status: "SUCCESS",
      amount: 1000,
      currency: "ETB",
      paymentMethod: "telebirr",
    };

    prisma.vip_tickets.findFirst = async () => mockTicket;
    prisma.vip_tickets.findUnique = async () => mockTicket;
    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async ({ where }) => {
        if (where.OR && where.OR.some(cond => cond.merchantReference === linkedMerchantRef)) {
          return linkedPayment;
        }
        return null;
      };
      prisma.vip_payments.findByReference = async (ref) => {
        if (ref === linkedMerchantRef) return linkedPayment;
        return null;
      };
    }

    const result = await getPaymentStatus(mockTicket.ticketCode);

    assert.equal(result.status, 200);
    assert.equal(result.data.merchantReference, linkedMerchantRef);
    assert.equal(result.data.paymentStatus, "SUCCESS");
    assert.equal(result.data.isConfirmed, true);
    assert.equal(result.data.isVerified, true);
  });

  // ─── Regression Test 6: VPM... merchant reference resolves correctly
  test("Regression Test 6: VPM... merchant reference resolves correctly", async () => {
    const merchantRef = "VPMW9MERCHANTREF6";
    const mockTicket = {
      id: "ticket-reg-merch-06",
      ticketCode: "VIP-MERCH-0006",
      status: "CONFIRMED",
      paymentRef: merchantRef,
      qrCodeUrl: generateVipTicketQrCode("VIP-MERCH-0006"),
    };

    const mockPayment = {
      id: "pay-reg-merch-06",
      ticketId: "ticket-reg-merch-06",
      merchantReference: merchantRef,
      status: "SUCCESS",
      amount: 1000,
      currency: "ETB",
      paymentMethod: "cbe",
    };

    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async ({ where }) => {
        if (where.OR && where.OR.some(cond => cond.merchantReference === merchantRef)) {
          return mockPayment;
        }
        return null;
      };
      prisma.vip_payments.findByReference = async (ref) => {
        if (ref === merchantRef) return mockPayment;
        return null;
      };
    }
    prisma.vip_tickets.findUnique = async () => mockTicket;

    const result = await getPaymentStatus(merchantRef);

    assert.equal(result.status, 200);
    assert.equal(result.data.merchantReference, merchantRef);
    assert.equal(result.data.applicationReference, "VIP-MERCH-0006");
    assert.equal(result.data.isConfirmed, true);
    assert.equal(result.data.isVerified, true);
  });

  // ─── Regression Test 7: Multiple payment attempts prioritize SUCCESS payment linked to ticket
  test("Regression Test 7: Multiple payment attempts prioritize the SUCCESS payment linked to ticket", async () => {
    const successMerchantRef = "VPMW9SUCCESSOLD";
    const pendingMerchantRef = "VPMW9PENDINGNEW";

    const mockTicket = {
      id: "ticket-reg-multi-07",
      ticketCode: "VIP-MULTI-0007",
      status: "CONFIRMED",
      paymentRef: successMerchantRef,
      qrCodeUrl: generateVipTicketQrCode("VIP-MULTI-0007"),
    };

    const oldSuccessPayment = {
      id: "pay-reg-old-success",
      ticketId: "ticket-reg-multi-07",
      merchantReference: successMerchantRef,
      status: "SUCCESS",
      amount: 1000,
      currency: "ETB",
      createdAt: new Date("2026-11-01T10:00:00Z"),
    };

    const newPendingPayment = {
      id: "pay-reg-new-pending",
      ticketId: "ticket-reg-multi-07",
      merchantReference: pendingMerchantRef,
      status: "PENDING",
      amount: 1000,
      currency: "ETB",
      createdAt: new Date("2026-11-01T11:00:00Z"),
    };

    prisma.vip_tickets.findFirst = async () => mockTicket;
    prisma.vip_tickets.findUnique = async () => mockTicket;
    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async ({ where }) => {
        if (where?.OR) {
          const matchSuccess = where.OR.some(c => c.merchantReference === successMerchantRef || c.id === successMerchantRef);
          if (matchSuccess) return oldSuccessPayment;
          const matchPending = where.OR.some(c => c.merchantReference === pendingMerchantRef || c.id === pendingMerchantRef);
          if (matchPending) return newPendingPayment;
          return null; // Return null when queried with VIP-MULTI-0007 so fallback to ticket lookup occurs
        }
        if (where?.status === "SUCCESS") {
          return oldSuccessPayment;
        }
        return newPendingPayment;
      };
      prisma.vip_payments.findByReference = async (ref) => {
        if (ref === successMerchantRef) return oldSuccessPayment;
        if (ref === pendingMerchantRef) return newPendingPayment;
        return null;
      };
    }

    const result = await getPaymentStatus(mockTicket.ticketCode);

    assert.equal(result.status, 200);
    assert.equal(result.data.paymentStatus, "SUCCESS", "Must resolve to the SUCCESS payment, not the newer PENDING payment");
    assert.equal(result.data.merchantReference, successMerchantRef);
    assert.equal(result.data.isConfirmed, true);
    assert.equal(result.data.isPending, false);
    assert.equal(result.data.isVerified, true);
  });

  // ─── Regression Test 8: Invalid reference handling
  test("Regression Test 8: Empty reference returns 400, nonexistent reference returns 404", async () => {
    // Empty reference
    const emptyRes = await getPaymentStatus("   ");
    assert.equal(emptyRes.status, 400);
    assert.ok(emptyRes.error.includes("reference"));

    // Nonexistent reference
    prisma.vip_tickets.findFirst = async () => null;
    prisma.vip_tickets.findUnique = async () => null;
    if (prisma.vip_payments) {
      prisma.vip_payments.findFirst = async () => null;
      prisma.vip_payments.findByReference = async () => null;
    }

    const notFoundRes = await getPaymentStatus("VIP-DOES-NOT-EXIST-9999");
    assert.equal(notFoundRes.status, 404);
    assert.ok(notFoundRes.error.includes("No payment or application record found"));
  });

  // ─── Regression Test 9: Confirmed tickets in all states never return isPending or canRetry
  test("Regression Test 9: Confirmed tickets in all confirmed states (CONFIRMED, QUEUED, SERVING, USED) never return isPending: true or canRetry: true", async () => {
    const states = ["CONFIRMED", "QUEUED", "SERVING", "USED"];

    for (const st of states) {
      const mockTicket = {
        id: `ticket-state-${st}`,
        ticketCode: `VIP-STATE-${st}`,
        status: st,
        paymentRef: `VPMW9${st}`,
        qrCodeUrl: generateVipTicketQrCode(`VIP-STATE-${st}`),
      };
      const mockPayment = {
        id: `pay-state-${st}`,
        ticketId: `ticket-state-${st}`,
        merchantReference: `VPMW9${st}`,
        status: "SUCCESS",
        amount: 1000,
        currency: "ETB",
      };

      prisma.vip_tickets.findFirst = async () => mockTicket;
      prisma.vip_tickets.findUnique = async () => mockTicket;
      if (prisma.vip_payments) {
        prisma.vip_payments.findFirst = async () => mockPayment;
        prisma.vip_payments.findByReference = async () => mockPayment;
      }

      const res = await getPaymentStatus(mockTicket.ticketCode);

      assert.equal(res.status, 200);
      assert.equal(res.data.isConfirmed, true, `State ${st} must have isConfirmed: true`);
      assert.equal(res.data.isPending, false, `State ${st} must never have isPending: true`);
      assert.equal(res.data.canRetry, false, `State ${st} must never have canRetry: true`);
      assert.equal(res.data.isVerified, true, `State ${st} with SUCCESS payment must have isVerified: true`);
    }
  });
});
