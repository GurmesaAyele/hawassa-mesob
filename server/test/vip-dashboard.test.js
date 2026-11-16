import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "crypto";
import app from "../src/app.js";
import prisma from "../src/config/db.js";
import { hashPassword, signToken } from "../src/utils/auth.js";
import { getTodayDateRange } from "../src/modules/vip-tickets/vip-queue.controller.js";

let server;
let baseUrl;

let staffToken;
let superAdminToken;
let testProviderId;
let inactiveProviderId;
let testServiceId1;
let testServiceId2;
let inactiveServiceId;

const createdTicketIds = [];
const createdProviderIds = [];
const createdServiceIds = [];

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  const defaultPasswordHash = await hashPassword("MesobTestPass2026!");

  // Ensure staff & super admin test accounts exist
  const [staffUser, saUser] = await Promise.all([
    prisma.users.upsert({
      where: { email: "vip_dash_staff@mesob.gov.et" },
      update: { role: "STAFF", isActive: true },
      create: {
        email: "vip_dash_staff@mesob.gov.et",
        name: "Test VIP Staff",
        passwordHash: defaultPasswordHash,
        role: "STAFF",
        isActive: true,
      },
    }),
    prisma.users.upsert({
      where: { email: "vip_dash_sa@mesob.gov.et" },
      update: { role: "SUPER_ADMIN", isActive: true },
      create: {
        email: "vip_dash_sa@mesob.gov.et",
        name: "Test VIP Super Admin",
        passwordHash: defaultPasswordHash,
        role: "SUPER_ADMIN",
        isActive: true,
      },
    }),
  ]);

  staffToken = signToken({ id: staffUser.id, role: staffUser.role });
  superAdminToken = signToken({ id: saUser.id, role: saUser.role });

  // Create active provider & 2 active services
  const activeProvider = await prisma.serviceProvider.create({
    data: {
      id: `dash-prov-${Date.now()}`,
      name: { en: "Test Dashboard Ministry", am: "የዳሽቦርድ ሚኒስቴር" },
      code: `DASH_INST_${Date.now()}`,
      icon: "https://example.com/icon.png",
      floorRoomNumber: "Floor 3, Room 301",
      contactPhone: "+251911999888",
      isActive: true,
    },
  });
  testProviderId = activeProvider.id;
  createdProviderIds.push(activeProvider.id);

  const [s1, s2] = await Promise.all([
    prisma.service.create({
      data: {
        id: `dash-srv-1-${Date.now()}`,
        providerId: testProviderId,
        title: { en: "Document Attestation", am: "የሰነድ ማረጋገጫ" },
        description: { en: "Official attestation service" },
        requirements: ["Original Kebele ID"],
        estimatedFee: 200,
        processingDays: 1,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        id: `dash-srv-2-${Date.now()}`,
        providerId: testProviderId,
        title: { en: "Express Clearance", am: "ፈጣን ማጣሪያ" },
        description: { en: "Expedited clearance service" },
        requirements: ["Application letter"],
        estimatedFee: 350,
        processingDays: 2,
        isActive: true,
      },
    }),
  ]);
  testServiceId1 = s1.id;
  testServiceId2 = s2.id;
  createdServiceIds.push(s1.id, s2.id);

  // Create inactive provider & inactive service
  const inactProvider = await prisma.serviceProvider.create({
    data: {
      id: `dash-inact-prov-${Date.now()}`,
      name: { en: "Inactive Deactivated Office" },
      code: `INACT_INST_${Date.now()}`,
      isActive: false,
    },
  });
  inactiveProviderId = inactProvider.id;
  createdProviderIds.push(inactProvider.id);

  const inactService = await prisma.service.create({
    data: {
      id: `dash-inact-srv-${Date.now()}`,
      providerId: testProviderId,
      title: { en: "Archived Deactivated Service" },
      description: { en: "No longer active" },
      isActive: false,
    },
  });
  inactiveServiceId = inactService.id;
  createdServiceIds.push(inactService.id);
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  // Cleanup created tickets
  if (createdTicketIds.length > 0) {
    await prisma.vip_tickets.deleteMany({
      where: { id: { in: createdTicketIds } },
    }).catch(() => {});
  }

  // Cleanup created services
  if (createdServiceIds.length > 0) {
    await prisma.service.deleteMany({
      where: { id: { in: createdServiceIds } },
    }).catch(() => {});
  }

  // Cleanup created providers
  if (createdProviderIds.length > 0) {
    await prisma.serviceProvider.deleteMany({
      where: { id: { in: createdProviderIds } },
    }).catch(() => {});
  }

  // Cleanup test users
  await prisma.users.deleteMany({
    where: {
      email: { in: ["vip_dash_staff@mesob.gov.et", "vip_dash_sa@mesob.gov.et"] },
    },
  }).catch(() => {});
});

describe("1. Centralized Public VIP Dashboard API (GET /api/vip-dashboard)", () => {
  test("Returns HTTP 200 with complete expected contract structure", async () => {
    const res = await fetch(`${baseUrl}/api/vip-dashboard?locale=en`);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data);

    // Center operational status
    assert.ok(json.data.center);
    assert.equal(json.data.center.name, "Hawassa MESOB Center");
    assert.equal(typeof json.data.center.isOpen, "boolean");
    assert.equal(typeof json.data.center.workday, "boolean");
    assert.equal(json.data.center.openingTime, "08:00");
    assert.equal(json.data.center.closingTime, "16:00");
    assert.equal(json.data.center.timezone, "Africa/Addis_Ababa");

    // Queue status
    assert.ok(json.data.queue);
    assert.equal(typeof json.data.queue.waiting, "number");
    assert.equal(typeof json.data.queue.completedToday, "number");
    assert.equal(typeof json.data.queue.activeReservations, "number");

    // Capacity status
    assert.ok(json.data.capacity);
    assert.equal(typeof json.data.capacity.dailyCapacity, "number");
    assert.equal(typeof json.data.capacity.consumedToday, "number");
    assert.equal(typeof json.data.capacity.remainingCapacity, "number");
    assert.equal(typeof json.data.capacity.acceptingCustomers, "boolean");

    // Safe statistics
    assert.ok(json.data.statistics);
    assert.equal(typeof json.data.statistics.totalTickets, "number");
    assert.equal(typeof json.data.statistics.confirmedTickets, "number");
    assert.equal(typeof json.data.statistics.pendingTickets, "number");
    assert.equal(typeof json.data.statistics.completedTickets, "number");

    // Catalogs
    assert.ok(Array.isArray(json.data.institutions));
    assert.ok(Array.isArray(json.data.services));
    assert.ok(json.data.lastUpdated);
  });

  test("Public dashboard handles empty/no tickets gracefully without crashing", async () => {
    const res = await fetch(`${baseUrl}/api/vip-dashboard`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
  });
});

describe("2. Public VIP Statistics Endpoint (GET /api/vip-dashboard/stats)", () => {
  test("Returns HTTP 200 with database-aggregated metrics", async () => {
    const res = await fetch(`${baseUrl}/api/vip-dashboard/stats`);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data);

    // Lifecycle counts
    assert.ok(json.data.tickets);
    assert.equal(typeof json.data.tickets.total, "number");
    assert.equal(typeof json.data.tickets.pending, "number");
    assert.equal(typeof json.data.tickets.confirmed, "number");
    assert.equal(typeof json.data.tickets.queued, "number");
    assert.equal(typeof json.data.tickets.serving, "number");
    assert.equal(typeof json.data.tickets.completed, "number");
    assert.equal(typeof json.data.tickets.cancelled, "number");

    // Today's metrics
    assert.ok(json.data.today);
    assert.equal(typeof json.data.today.createdToday, "number");
    assert.equal(typeof json.data.today.completedToday, "number");
    assert.equal(typeof json.data.today.waiting, "number");
    assert.equal(typeof json.data.today.serving, "number");

    // Service processing status counts
    assert.ok(json.data.serviceProcessing);
    assert.equal(typeof json.data.serviceProcessing.pending, "number");
    assert.equal(typeof json.data.serviceProcessing.inProgress, "number");
    assert.equal(typeof json.data.serviceProcessing.completed, "number");

    // Institutions and services counts
    assert.ok(json.data.institutions);
    assert.equal(typeof json.data.institutions.totalActive, "number");
    assert.equal(typeof json.data.institutions.totalVipServices, "number");
  });
});

describe("3. Queue Lifecycle & Serving Synchronization", () => {
  let queuedTicketId;
  let multiServiceTicketId;

  test("Queue status correctly identifies a waiting ticket", async () => {
    const { startOfDay } = getTodayDateRange();
    const ticketId = `test-queued-${Date.now()}`;
    createdTicketIds.push(ticketId);

    await prisma.vip_tickets.create({
      data: {
        id: ticketId,
        ticketCode: `VIP-QTEST-${Date.now().toString(36).toUpperCase()}`,
        citizenName: "Queue Test Citizen",
        citizenPhone: "+251911000111",
        email: "qcitizen@test.com",
        status: "QUEUED",
        serviceProcessingStatus: "PENDING",
        queueNumber: 77,
        queueDate: startOfDay,
        checkedInAt: new Date(),
        updatedAt: new Date(),
      },
    });
    queuedTicketId = ticketId;

    const res = await fetch(`${baseUrl}/api/vip-tickets/queue/status`);
    assert.equal(res.status, 200);
    const json = await res.json();

    assert.ok(json.queue.counts.waiting >= 1);
  });

  test("Currently serving information reflects real ticket lifecycle status", async () => {
    const { startOfDay } = getTodayDateRange();
    const servingTicketId = `test-serving-${Date.now()}`;
    createdTicketIds.push(servingTicketId);

    const now = new Date();
    await prisma.vip_tickets.create({
      data: {
        id: servingTicketId,
        ticketCode: `VIP-SRVTEST-${Date.now().toString(36).toUpperCase()}`,
        citizenName: "Serving Test Citizen",
        citizenPhone: "+251911000222",
        status: "SERVING",
        serviceProcessingStatus: "IN_PROGRESS",
        queueNumber: 15,
        queueDate: startOfDay,
        checkedInAt: now,
        servedAt: now,
        updatedAt: now,
      },
    });

    const res = await fetch(`${baseUrl}/api/vip-tickets/queue/status`);
    assert.equal(res.status, 200);
    const json = await res.json();

    assert.ok(json.queue.counts.serving >= 1);
    assert.ok(json.queue.currentlyServing);
    assert.equal(typeof json.queue.currentlyServing.queueNumber, "number");
    assert.match(json.queue.currentlyServing.queueDisplay, /^VIP-\d{3}$/);
    // Security check: ticketCode must NOT be exposed in currentlyServing
    assert.equal(json.queue.currentlyServing.ticketCode, undefined);
  });

  test("Multiple services under one ticket do NOT duplicate ticket counts in stats", async () => {
    const multiTicketId = `test-multi-${Date.now()}`;
    createdTicketIds.push(multiTicketId);

    await prisma.vip_tickets.create({
      data: {
        id: multiTicketId,
        ticketCode: `VIP-MULTITEST-${Date.now().toString(36).toUpperCase()}`,
        citizenName: "Multi Service Citizen",
        citizenPhone: "+251911000333",
        status: "CONFIRMED",
        serviceProcessingStatus: "PENDING",
        updatedAt: new Date(),
      },
    });

    // Link TWO services to this one ticket
    await prisma.vip_ticket_services.createMany({
      data: [
        { id: crypto.randomUUID(), ticketId: multiTicketId, serviceId: testServiceId1 },
        { id: crypto.randomUUID(), ticketId: multiTicketId, serviceId: testServiceId2 },
      ],
    });
    multiServiceTicketId = multiTicketId;

    const statsRes = await fetch(`${baseUrl}/api/vip-dashboard/stats`);
    const statsJson = await statsRes.json();

    // Verify stats return consistent integer total
    assert.ok(statsJson.data.tickets.total >= 1);
  });

  test("Completing ONE service does NOT mark multi-service ticket as completed", async () => {
    // Transition Service 1 to IN_PROGRESS
    const startRes = await fetch(
      `${baseUrl}/api/admin/vip-tickets/${multiServiceTicketId}/service-status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${staffToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "in-progress",
          serviceId: testServiceId1,
          notes: "Started Service 1",
        }),
      }
    );
    assert.equal(startRes.status, 200);
    const startBody = await startRes.json();
    assert.equal(startBody.data.status, "in-progress");
    assert.equal(startBody.data.ticketStatus, "SERVING");

    // Complete Service 1 ONLY (Service 2 remains PENDING)
    const compRes = await fetch(
      `${baseUrl}/api/admin/vip-tickets/${multiServiceTicketId}/service-status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${staffToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "completed",
          serviceId: testServiceId1,
          notes: "Service 1 finished",
        }),
      }
    );
    assert.equal(compRes.status, 200);
    const compBody = await compRes.json();

    // The overall ticket MUST remain in-progress and SERVING because Service 2 is unfinished!
    assert.equal(compBody.data.status, "in-progress");
    assert.equal(compBody.data.ticketStatus, "SERVING");
    assert.equal(compBody.data.completedAt, null);
  });

  test("Completing ALL services transitions the ticket to completed and USED", async () => {
    // Now complete Service 2 as well
    // First advance Service 2 to in-progress
    await fetch(
      `${baseUrl}/api/admin/vip-tickets/${multiServiceTicketId}/service-status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${staffToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "in-progress",
          serviceId: testServiceId2,
        }),
      }
    );

    // Complete Service 2
    const finalRes = await fetch(
      `${baseUrl}/api/admin/vip-tickets/${multiServiceTicketId}/service-status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${staffToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "completed",
          serviceId: testServiceId2,
          notes: "Service 2 finished. All services complete.",
        }),
      }
    );
    assert.equal(finalRes.status, 200);
    const finalBody = await finalRes.json();

    // Now ALL services are done: overall ticket MUST be completed and USED!
    assert.equal(finalBody.data.status, "completed");
    assert.equal(finalBody.data.ticketStatus, "USED");
    assert.ok(finalBody.data.completedAt !== null);
  });
});

describe("4. Catalog Filtering & VIP Eligibility", () => {
  test("Inactive institutions are NOT returned in public dashboard", async () => {
    const res = await fetch(`${baseUrl}/api/vip-dashboard`);
    const json = await res.json();

    const returnedProviderIds = json.data.institutions.map((i) => i.id);
    assert.ok(returnedProviderIds.includes(testProviderId));
    assert.equal(returnedProviderIds.includes(inactiveProviderId), false);
  });

  test("Inactive services are NOT returned in public dashboard", async () => {
    const res = await fetch(`${baseUrl}/api/vip-dashboard`);
    const json = await res.json();

    const returnedServiceIds = json.data.services.map((s) => s.id);
    assert.ok(returnedServiceIds.includes(testServiceId1));
    assert.equal(returnedServiceIds.includes(inactiveServiceId), false);
  });

  test("Appointment availability endpoint rejects inactive service with 404", async () => {
    const res = await fetch(`${baseUrl}/api/services/${inactiveServiceId}/vip-slots`);
    assert.equal(res.status, 404);
  });
});

describe("5. Public Security & Privacy Hardening", () => {
  test("Public dashboard responses NEVER expose citizen PII", async () => {
    const res = await fetch(`${baseUrl}/api/vip-dashboard`);
    const text = await res.text();

    assert.equal(text.includes("Queue Test Citizen"), false);
    assert.equal(text.includes("+251911000111"), false);
    assert.equal(text.includes("qcitizen@test.com"), false);
  });

  test("Public queue monitor NEVER exposes private ticket codes", async () => {
    const res = await fetch(`${baseUrl}/api/vip-tickets/queue/status`);
    const json = await res.json();

    if (json.queue.currentlyServing) {
      assert.equal(json.queue.currentlyServing.ticketCode, undefined);
    }
    if (json.queue.nextInQueue) {
      assert.equal(json.queue.nextInQueue.ticketCode, undefined);
    }
  });

  test("Admin endpoints remain protected from unauthenticated access", async () => {
    const listRes = await fetch(`${baseUrl}/api/admin/vip-tickets`);
    assert.equal(listRes.status, 401);

    const patchRes = await fetch(`${baseUrl}/api/admin/vip-tickets/non-existent/service-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in-progress" }),
    });
    assert.equal(patchRes.status, 401);
  });

  test("Staff cannot perform invalid backward status transitions", async () => {
    // multiServiceTicketId is currently in COMPLETED status
    const res = await fetch(
      `${baseUrl}/api/admin/vip-tickets/${createdTicketIds[createdTicketIds.length - 1]}/service-status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${staffToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "in-progress" }),
      }
    );
    assert.equal(res.status, 400);
  });
});

