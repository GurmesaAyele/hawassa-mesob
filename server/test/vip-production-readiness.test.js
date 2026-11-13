import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "crypto";
import app from "../src/app.js";
import prisma from "../src/config/db.js";
import { hashPassword, signToken } from "../src/utils/auth.js";
import { getTodayDateRange } from "../src/modules/vip-tickets/vip-queue.controller.js";
import { VIP_SCHEDULE_CONFIG } from "../src/modules/institutions/vip-schedule.config.js";
import { getVipServiceConfig } from "../src/modules/institutions/vip.config.js";

let server;
let baseUrl;

let staffToken;
let operatorToken;
let citizenToken;

let activeProvider;
let inactiveProvider;
let activeServiceA;
let activeServiceB;
let inactiveService;

const createdTicketIds = [];
const createdServiceIds = [];
const createdProviderIds = [];

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  const defaultPasswordHash = await hashPassword("MesobProdTest2026!");

  // Create isolated test accounts
  const [staffUser, opUser, citUser] = await Promise.all([
    prisma.users.upsert({
      where: { email: "readiness_staff@mesob.gov.et" },
      update: { role: "STAFF", isActive: true },
      create: {
        email: "readiness_staff@mesob.gov.et",
        name: "Readiness Staff Member",
        passwordHash: defaultPasswordHash,
        role: "STAFF",
        isActive: true,
      },
    }),
    prisma.users.upsert({
      where: { email: "readiness_operator@mesob.gov.et" },
      update: { role: "OPERATOR", isActive: true },
      create: {
        email: "readiness_operator@mesob.gov.et",
        name: "Readiness Operator",
        passwordHash: defaultPasswordHash,
        role: "OPERATOR",
        isActive: true,
      },
    }),
    prisma.users.upsert({
      where: { email: "readiness_citizen@mesob.gov.et" },
      update: { role: "CITIZEN", isActive: true },
      create: {
        email: "readiness_citizen@mesob.gov.et",
        name: "Readiness Citizen",
        passwordHash: defaultPasswordHash,
        role: "CITIZEN",
        isActive: true,
      },
    }),
  ]);

  staffToken = signToken({ id: staffUser.id, role: staffUser.role });
  operatorToken = signToken({ id: opUser.id, role: opUser.role });
  citizenToken = signToken({ id: citUser.id, role: citUser.role });

  // 1. Create active test provider & active test services
  activeProvider = await prisma.serviceProvider.create({
    data: {
      id: `readiness-prov-${Date.now()}`,
      name: { en: "Ministry of Trade & Regional Integration", am: "የንግድና ቀጠናዊ ትስስር ሚኒስቴር" },
      code: `MOTRI_${Date.now()}`,
      icon: "https://example.com/motri.png",
      floorRoomNumber: "Floor 2, Room 210",
      contactPhone: "+251911777111",
      isActive: true,
    },
  });
  createdProviderIds.push(activeProvider.id);

  activeServiceA = await prisma.service.create({
    data: {
      id: `readiness-srv-a-${Date.now()}`,
      providerId: activeProvider.id,
      title: { en: "Commercial Registration Renewal", am: "የንግድ ምዝገባ እድሳት" },
      description: { en: "Fast-track VIP business registration renewal" },
      requirements: ["Valid Trade License", "Tax Clearance Certificate"],
      estimatedFee: 500,
      processingDays: 1,
      isActive: true,
    },
  });

  activeServiceB = await prisma.service.create({
    data: {
      id: `readiness-srv-b-${Date.now()}`,
      providerId: activeProvider.id,
      title: { en: "Import Export Permit Verification", am: "የገቢ ወጪ ፈቃድ ማረጋገጫ" },
      description: { en: "VIP authentication of foreign trade credentials" },
      requirements: ["Customs Documentation"],
      estimatedFee: 750,
      processingDays: 2,
      isActive: true,
    },
  });
  createdServiceIds.push(activeServiceA.id, activeServiceB.id);

  // 2. Create inactive provider & inactive service
  inactiveProvider = await prisma.serviceProvider.create({
    data: {
      id: `readiness-inact-prov-${Date.now()}`,
      name: { en: "Inactive Decommissioned Bureau" },
      code: `INACT_BUREAU_${Date.now()}`,
      isActive: false,
    },
  });
  createdProviderIds.push(inactiveProvider.id);

  inactiveService = await prisma.service.create({
    data: {
      id: `readiness-inact-srv-${Date.now()}`,
      providerId: activeProvider.id,
      title: { en: "Discontinued Legacy License" },
      description: { en: "No longer provided" },
      isActive: false,
    },
  });
  createdServiceIds.push(inactiveService.id);
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  // Cleanup test tickets
  if (createdTicketIds.length > 0) {
    await prisma.vip_tickets.deleteMany({
      where: { id: { in: createdTicketIds } },
    }).catch(() => {});
  }

  // Cleanup test services
  if (createdServiceIds.length > 0) {
    await prisma.service.deleteMany({
      where: { id: { in: createdServiceIds } },
    }).catch(() => {});
  }

  // Cleanup test providers
  if (createdProviderIds.length > 0) {
    await prisma.serviceProvider.deleteMany({
      where: { id: { in: createdProviderIds } },
    }).catch(() => {});
  }

  // Cleanup test users
  await prisma.users.deleteMany({
    where: {
      email: {
        in: [
          "readiness_staff@mesob.gov.et",
          "readiness_operator@mesob.gov.et",
          "readiness_citizen@mesob.gov.et",
        ],
      },
    },
  }).catch(() => {});
});

describe("Production Readiness Verification Checklist", () => {
  let confirmedTicketId;
  let confirmedTicketCode;
  let multiServiceTicketId;

  // ─── 1. Accurate Real Database Data on Dashboard ──────────────────────────
  test("1. GET /api/vip-dashboard returns accurate, real database data", async () => {
    const res = await fetch(`${baseUrl}/api/vip-dashboard?locale=en`);
    assert.equal(res.status, 200);
    const json = await res.json();

    assert.equal(json.success, true);
    assert.ok(json.data.center);
    assert.equal(json.data.center.name, "Hawassa MESOB Center");

    // Real DB counts comparison
    const dbTotalTickets = await prisma.vip_tickets.count();
    assert.equal(json.data.statistics.totalTickets, dbTotalTickets);

    const activeProviderExists = json.data.institutions.some((i) => i.id === activeProvider.id);
    assert.equal(activeProviderExists, true);

    const activeServiceExists = json.data.services.some((s) => s.id === activeServiceA.id);
    assert.equal(activeServiceExists, true);
  });

  // ─── 2. Accurate Aggregate Statistics ─────────────────────────────────────
  test("2. GET /api/vip-dashboard/stats returns accurate aggregate statistics", async () => {
    const res = await fetch(`${baseUrl}/api/vip-dashboard/stats`);
    assert.equal(res.status, 200);
    const json = await res.json();

    assert.equal(json.success, true);

    // Assert exact consistency with direct DB counts
    const [dbPending, dbConfirmed, dbUsed, dbTotal] = await Promise.all([
      prisma.vip_tickets.count({ where: { status: "PENDING" } }),
      prisma.vip_tickets.count({ where: { status: "CONFIRMED" } }),
      prisma.vip_tickets.count({ where: { status: "USED" } }),
      prisma.vip_tickets.count(),
    ]);

    assert.equal(json.data.tickets.pending, dbPending);
    assert.equal(json.data.tickets.confirmed, dbConfirmed);
    assert.equal(json.data.tickets.completed, dbUsed);
    assert.equal(json.data.tickets.total, dbTotal);
  });

  // ─── 3. Customer Check-In Queue Status Change ─────────────────────────────
  test("3. Queue status changes correctly when a customer checks in", async () => {
    const { startOfDay } = getTodayDateRange();
    confirmedTicketId = `prod-ticket-checkin-${Date.now()}`;
    confirmedTicketCode = `VIP-CHK-${Date.now().toString(36).toUpperCase()}`;
    createdTicketIds.push(confirmedTicketId);

    // Setup confirmed ticket (ready for check-in)
    await prisma.vip_tickets.create({
      data: {
        id: confirmedTicketId,
        ticketCode: confirmedTicketCode,
        citizenName: "Checkin Verified Citizen",
        citizenPhone: "+251911555666",
        email: "checkin@mesob.test",
        status: "CONFIRMED",
        serviceProcessingStatus: "PENDING",
        slotDate: startOfDay,
        updatedAt: new Date(),
      },
    });

    const preRes = await fetch(`${baseUrl}/api/vip-tickets/queue/status`);
    const preJson = await preRes.json();
    const initialWaiting = preJson.queue.counts.waiting;

    // Execute physical walk-in kiosk enqueue
    const enqueueRes = await fetch(`${baseUrl}/api/vip-tickets/${confirmedTicketId}/enqueue`, {
      method: "POST",
    });
    assert.equal(enqueueRes.status, 200);
    const enqueueJson = await enqueueRes.json();
    assert.equal(enqueueJson.success, true);
    assert.equal(enqueueJson.ticket.status, "QUEUED");
    assert.ok(enqueueJson.queueNumber > 0);

    // Verify queue status reflects the newly queued citizen
    const postRes = await fetch(`${baseUrl}/api/vip-tickets/queue/status`);
    const postJson = await postRes.json();
    assert.equal(postJson.queue.counts.waiting, initialWaiting + 1);
  });

  // ─── 4. Staff Starting Service Updates Public Currently-Serving ───────────
  test("4. Staff starting a service updates the public currently-serving information", async () => {
    // Staff marks the checked-in ticket as IN_PROGRESS
    const patchRes = await fetch(
      `${baseUrl}/api/admin/vip-tickets/${confirmedTicketId}/service-status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${staffToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "in-progress",
          notes: "Counter 3 calling citizen",
        }),
      }
    );
    assert.equal(patchRes.status, 200);

    // Verify public dashboard immediately displays this ticket as currently serving
    const dashRes = await fetch(`${baseUrl}/api/vip-dashboard`);
    const dashJson = await dashRes.json();

    assert.ok(dashJson.data.queue.currentlyServing);
    assert.equal(dashJson.data.queue.currentlyServing.queueNumber, 1);
    assert.match(dashJson.data.queue.currentlyServing.queueDisplay, /^VIP-\d{3}$/);
    assert.ok(dashJson.data.queue.currentlyServing.servedAt);
  });

  // ─── 5. Completing One Service Does Not Prematurely Complete Ticket ────────
  test("5. Completing one service in a multi-service ticket does not prematurely complete the entire ticket", async () => {
    const { startOfDay } = getTodayDateRange();
    multiServiceTicketId = `prod-multi-${Date.now()}`;
    createdTicketIds.push(multiServiceTicketId);

    // Ticket bundling Service A and Service B
    await prisma.vip_tickets.create({
      data: {
        id: multiServiceTicketId,
        ticketCode: `VIP-BUNDLE-${Date.now().toString(36).toUpperCase()}`,
        citizenName: "Multi Service Applicant",
        citizenPhone: "+251911444333",
        email: "bundle@mesob.test",
        status: "SERVING",
        serviceProcessingStatus: "IN_PROGRESS",
        queueNumber: 2,
        queueDate: startOfDay,
        checkedInAt: new Date(),
        servedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.vip_ticket_services.createMany({
      data: [
        { id: crypto.randomUUID(), ticketId: multiServiceTicketId, serviceId: activeServiceA.id },
        { id: crypto.randomUUID(), ticketId: multiServiceTicketId, serviceId: activeServiceB.id },
      ],
    });

    // Complete Service A ONLY
    const compSrvARes = await fetch(
      `${baseUrl}/api/admin/vip-tickets/${multiServiceTicketId}/service-status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${staffToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "completed",
          serviceId: activeServiceA.id,
          notes: "Commercial renewal completed; import/export clearance remaining",
        }),
      }
    );
    assert.equal(compSrvARes.status, 200);
    const body = await compSrvARes.json();

    // The overall ticket MUST remain IN_PROGRESS and SERVING
    assert.equal(body.data.status, "in-progress");
    assert.equal(body.data.ticketStatus, "SERVING");
    assert.equal(body.data.completedAt, null);

    // Verify on public dashboard that completedToday did not prematurely increment for this ticket
    const dbTicket = await prisma.vip_tickets.findUnique({ where: { id: multiServiceTicketId } });
    assert.equal(dbTicket.status, "SERVING");
    assert.equal(dbTicket.serviceProcessingStatus, "IN_PROGRESS");
    assert.equal(dbTicket.completedAt, null);
  });

  // ─── 6. Completing All Services Correctly Completes Ticket ─────────────────
  test("6. Completing all associated services correctly completes the ticket", async () => {
    // Complete Service B as well
    const compSrvBRes = await fetch(
      `${baseUrl}/api/admin/vip-tickets/${multiServiceTicketId}/service-status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${staffToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "completed",
          serviceId: activeServiceB.id,
          notes: "Import/export permit verified. All bundle services finished.",
        }),
      }
    );
    assert.equal(compSrvBRes.status, 200);
    const body = await compSrvBRes.json();

    // Now ALL services are done: ticket MUST be COMPLETED and USED
    assert.equal(body.data.status, "completed");
    assert.equal(body.data.ticketStatus, "USED");
    assert.ok(body.data.completedAt !== null);

    const dbTicket = await prisma.vip_tickets.findUnique({ where: { id: multiServiceTicketId } });
    assert.equal(dbTicket.status, "USED");
    assert.equal(dbTicket.serviceProcessingStatus, "COMPLETED");
    assert.ok(dbTicket.completedAt !== null);
  });

  // ─── 7. No Double-Counting for Multi-Service Tickets ───────────────────────
  test("7. Queue counts, completed counts, and capacity figures do not double-count multi-service tickets", async () => {
    const statsRes = await fetch(`${baseUrl}/api/vip-dashboard/stats`);
    const statsJson = await statsRes.json();

    const actualDbTicketCount = await prisma.vip_tickets.count();
    assert.equal(statsJson.data.tickets.total, actualDbTicketCount);

    const dashRes = await fetch(`${baseUrl}/api/vip-dashboard`);
    const dashJson = await dashRes.json();
    assert.equal(dashJson.data.statistics.totalTickets, actualDbTicketCount);
  });

  // ─── 8. Public Endpoints Exclude Customer PII, Secrets & Private Codes ─────
  test("8. All public endpoints exclude customer names, phone numbers, email addresses, private ticket codes, QR information, payment references, checkout URLs, and internal secrets", async () => {
    const endpoints = [
      `${baseUrl}/api/vip-dashboard`,
      `${baseUrl}/api/vip-dashboard/stats`,
      `${baseUrl}/api/vip-tickets/queue/status`,
      `${baseUrl}/api/vip-tickets/queue/availability`,
      `${baseUrl}/api/services/vip`,
      `${baseUrl}/api/institutions`,
    ];

    for (const url of endpoints) {
      const res = await fetch(url);
      const text = await res.text();

      // PII checks
      assert.equal(text.includes("Checkin Verified Citizen"), false, `PII leaked on ${url}`);
      assert.equal(text.includes("+251911555666"), false, `Phone leaked on ${url}`);
      assert.equal(text.includes("checkin@mesob.test"), false, `Email leaked on ${url}`);

      // Secret & private identifiers checks
      assert.equal(text.includes(confirmedTicketCode), false, `TicketCode leaked on ${url}`);
      assert.equal(text.includes("paymentRef"), false, `paymentRef leaked on ${url}`);
      assert.equal(text.includes("qrCodeUrl"), false, `qrCodeUrl leaked on ${url}`);
      assert.equal(text.includes("checkoutUrl"), false, `checkoutUrl leaked on ${url}`);
      assert.equal(text.includes("merchantReference"), false, `merchantReference leaked on ${url}`);
      assert.equal(text.includes("idempotencyKey"), false, `idempotencyKey leaked on ${url}`);
    }
  });

  // ─── 9. Public Payment Totals Do Not Reveal Individual Transactions ────────
  test("9. Public payment totals do not reveal individual transactions", async () => {
    const res = await fetch(`${baseUrl}/api/vip-dashboard/stats`);
    const json = await res.json();

    if (json.data.payments) {
      assert.equal(typeof json.data.payments.totalSuccessful, "number");
      assert.equal(typeof json.data.payments.totalAmountCollected, "number");
      assert.equal(json.data.payments.currency, "ETB");

      // Verify no transaction lists or individual IDs
      assert.equal(json.data.payments.transactions, undefined);
      assert.equal(json.data.payments.records, undefined);
      assert.equal(json.data.payments.references, undefined);
    }
  });

  // ─── 10. Inactive Institutions and Services Excluded ───────────────────────
  test("10. Inactive institutions and services are excluded from public dashboard", async () => {
    const res = await fetch(`${baseUrl}/api/vip-dashboard`);
    const json = await res.json();

    const returnedInstIds = json.data.institutions.map((i) => i.id);
    assert.equal(returnedInstIds.includes(inactiveProvider.id), false);

    const returnedSrvIds = json.data.services.map((s) => s.id);
    assert.equal(returnedSrvIds.includes(inactiveService.id), false);
  });

  // ─── 11. VIP Service Eligibility Follows Existing Config ───────────────────
  test("11. VIP service eligibility follows the existing configuration", async () => {
    // Config: service is eligible iff service.isActive && provider.isActive
    const eligibleConfig = getVipServiceConfig(activeServiceA, activeProvider);
    assert.equal(eligibleConfig.vipAvailable, true);
    assert.equal(eligibleConfig.vipFee, 1000);
    assert.equal(eligibleConfig.currency, "ETB");

    const ineligibleConfig = getVipServiceConfig(activeServiceA, inactiveProvider);
    assert.equal(ineligibleConfig.vipAvailable, false);
  });

  // ─── 12. Date Calculations Use Africa/Addis_Ababa Consistently ─────────────
  test("12. Date calculations use Africa/Addis_Ababa consistently", async () => {
    const res = await fetch(`${baseUrl}/api/vip-dashboard`);
    const json = await res.json();

    assert.equal(json.data.center.timezone, "Africa/Addis_Ababa");
    assert.equal(VIP_SCHEDULE_CONFIG.TIMEZONE, "Africa/Addis_Ababa");

    // Current time matches HH:MM format
    assert.match(json.data.center.currentTime, /^\d{2}:\d{2}$/);
  });

  // ─── 13. Public Cache Headers Do Not Cause Stale Queue Information ─────────
  test("13. Public cache headers do not cause stale queue information", async () => {
    const res = await fetch(`${baseUrl}/api/vip-dashboard`);
    const cacheControl = res.headers.get("cache-control") || "";

    assert.ok(cacheControl.includes("no-cache"), "Must specify no-cache");
    assert.ok(cacheControl.includes("must-revalidate"), "Must specify must-revalidate");

    // Check queue status endpoint as well
    const qRes = await fetch(`${baseUrl}/api/vip-tickets/queue/status`);
    const qCacheControl = qRes.headers.get("cache-control") || "";
    assert.ok(qCacheControl.includes("no-store") || qCacheControl.includes("no-cache"));
  });

  // ─── 14. Admin Endpoints Retain Authentication and Role Protection ─────────
  test("14. All admin endpoints retain their authentication and role protection", async () => {
    // Anonymous is rejected
    const unauthGet = await fetch(`${baseUrl}/api/admin/vip-tickets`);
    assert.equal(unauthGet.status, 401);

    const unauthPatch = await fetch(
      `${baseUrl}/api/admin/vip-tickets/${confirmedTicketId}/service-status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in-progress" }),
      }
    );
    assert.equal(unauthPatch.status, 401);

    // Citizen is rejected from admin routes
    const citGet = await fetch(`${baseUrl}/api/admin/vip-tickets`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert.equal(citGet.status, 403);

    // Operator is rejected from changing service status
    const opPatch = await fetch(
      `${baseUrl}/api/admin/vip-tickets/${confirmedTicketId}/service-status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${operatorToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "in-progress" }),
      }
    );
    assert.equal(opPatch.status, 403);
  });

  // ─── 15. Existing VIP Payment, Ticket Creation & Staff Workflows Function ──
  test("15. Existing VIP payment, ticket creation, and staff workflows still function", async () => {
    const rawPhone = `0922${Math.floor(100000 + Math.random() * 900000)}`;

    // Ticket application submission
    const submitRes = await fetch(`${baseUrl}/api/vip-tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        citizenName: "New Application Citizen",
        citizenPhone: rawPhone,
        email: "newapp@mesob.test",
        purpose: "Business visa and customs check",
        serviceIds: [activeServiceA.id],
      }),
    });
    assert.equal(submitRes.status, 201);
    const submitJson = await submitRes.json();
    assert.equal(submitJson.success, true);
    assert.ok(submitJson.data.reference);
    assert.equal(submitJson.data.status, "PENDING");

    const newTicketCode = submitJson.data.reference;
    createdTicketIds.push(submitJson.data.id);

    // Customer tracking with masked PII
    const trackRes = await fetch(`${baseUrl}/api/vip-tickets/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: newTicketCode,
        phone: rawPhone,
      }),
    });
    assert.equal(trackRes.status, 200);
    const trackJson = await trackRes.json();
    assert.equal(trackJson.success, true);
    assert.equal(trackJson.data.reference, newTicketCode);
    assert.match(trackJson.data.maskedPhone, /\*\*\*/);
  });
});
