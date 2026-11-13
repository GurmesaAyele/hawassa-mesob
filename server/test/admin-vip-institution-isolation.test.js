import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import app from "../src/app.js";
import prisma from "../src/config/db.js";
import { hashPassword } from "../src/utils/auth.js";

let server;
let baseUrl;

let cbeProvider;
let icsProvider;
let cbeService;
let icsService;

let cbeStaffToken;
let icsStaffToken;
let superAdminToken;

let multiInstTicketId;
let multiInstTicketCode;
let draftTicketId;

const testPhone = `0922${Math.floor(100000 + Math.random() * 900000)}`;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  const defaultPasswordHash = await hashPassword("MesobTestPass2026!");

  // Find 2 distinct institutions
  const providers = await prisma.serviceProvider.findMany({
    where: {
      services: { some: { isActive: true } },
    },
    include: {
      services: { where: { isActive: true }, take: 1 },
    },
    take: 2,
  });

  assert.ok(providers.length >= 2, "Need at least 2 service providers with active services for isolation tests");
  [cbeProvider, icsProvider] = providers;
  cbeService = cbeProvider.services[0];
  icsService = icsProvider.services[0];

  // Provision Staff A for Institution 1 (e.g. CBE)
  const staffCbeUser = await prisma.users.upsert({
    where: { email: "isolation_staff_cbe@mesob.gov.et" },
    update: { role: "STAFF", institutionId: cbeProvider.id, isActive: true },
    create: {
      email: "isolation_staff_cbe@mesob.gov.et",
      name: "CBE Desk Officer",
      passwordHash: defaultPasswordHash,
      role: "STAFF",
      institutionId: cbeProvider.id,
      isActive: true,
    },
  });

  // Provision Staff B for Institution 2 (e.g. ICS)
  const staffIcsUser = await prisma.users.upsert({
    where: { email: "isolation_staff_ics@mesob.gov.et" },
    update: { role: "STAFF", institutionId: icsProvider.id, isActive: true },
    create: {
      email: "isolation_staff_ics@mesob.gov.et",
      name: "ICS Desk Officer",
      passwordHash: defaultPasswordHash,
      role: "STAFF",
      institutionId: icsProvider.id,
      isActive: true,
    },
  });

  // Provision Super Admin
  const saUser = await prisma.users.upsert({
    where: { email: "isolation_superadmin@mesob.gov.et" },
    update: { role: "SUPER_ADMIN", isActive: true },
    create: {
      email: "isolation_superadmin@mesob.gov.et",
      name: "Isolation Super Admin",
      passwordHash: defaultPasswordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  // Log in CBE Staff
  const cbeRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: staffCbeUser.email, password: "MesobTestPass2026!" }),
  });
  assert.equal(cbeRes.status, 200);
  const cbeData = await cbeRes.json();
  cbeStaffToken = cbeData.token;

  // Log in ICS Staff
  const icsRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: staffIcsUser.email, password: "MesobTestPass2026!" }),
  });
  assert.equal(icsRes.status, 200);
  const icsData = await icsRes.json();
  icsStaffToken = icsData.token;

  // Log in Super Admin
  const saRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: saUser.email, password: "MesobTestPass2026!" }),
  });
  assert.equal(saRes.status, 200);
  const saData = await saRes.json();
  superAdminToken = saData.token;
});

after(async () => {
  if (multiInstTicketId) {
    await prisma.vip_tickets.deleteMany({ where: { id: multiInstTicketId } }).catch(() => {});
  }
  if (draftTicketId) {
    await prisma.vip_tickets.deleteMany({ where: { id: draftTicketId } }).catch(() => {});
  }
  await prisma.users.deleteMany({
    where: {
      email: {
        in: [
          "isolation_staff_cbe@mesob.gov.et",
          "isolation_staff_ics@mesob.gov.et",
          "isolation_superadmin@mesob.gov.et",
        ],
      },
    },
  }).catch(() => {});

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe("1. Institution Profile in Authentication", () => {
  test("CBE Staff /api/auth/me returns their bound institution", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${cbeStaffToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.user.role, "STAFF");
    assert.equal(body.user.institutionId, cbeProvider.id);
    assert.equal(body.user.institution?.code, cbeProvider.code);
  });

  test("ICS Staff /api/auth/me returns their bound institution", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${icsStaffToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.user.role, "STAFF");
    assert.equal(body.user.institutionId, icsProvider.id);
    assert.equal(body.user.institution?.code, icsProvider.code);
  });
});

describe("2. Multi-Institution VIP Ticket Creation & Separation", () => {
  test("Citizen applies for services across BOTH institutions in one VIP ticket", async () => {
    const res = await fetch(`${baseUrl}/api/vip-tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        citizenName: "Multi Institution Citizen",
        citizenPhone: testPhone,
        email: "multi.inst.citizen@example.com",
        serviceIds: [cbeService.id, icsService.id],
        purpose: "Need both banking and citizenship services urgently",
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    multiInstTicketCode = body.data.reference;

    const dbTicket = await prisma.vip_tickets.findUnique({
      where: { ticketCode: multiInstTicketCode },
    });
    assert.ok(dbTicket);
    multiInstTicketId = dbTicket.id;

    // Simulate verified payment confirmation
    await prisma.vip_tickets.update({
      where: { id: multiInstTicketId },
      data: { status: "CONFIRMED" },
    });
  });

  test("CBE Staff sees ONLY the CBE service (ICS service is hidden)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets`, {
      headers: { Authorization: `Bearer ${cbeStaffToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();

    const ticket = body.data.find((t) => t.reference === multiInstTicketCode);
    assert.ok(ticket, "Ticket must appear on CBE Staff dashboard");

    // Only 1 service (CBE) should be visible to CBE staff!
    assert.equal(ticket.services.length, 1, "Only CBE service should be exposed to CBE staff");
    assert.equal(ticket.services[0].id, cbeService.id);
    assert.equal(ticket.status, "pending");
  });

  test("ICS Staff sees ONLY the ICS service (CBE service is hidden)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets`, {
      headers: { Authorization: `Bearer ${icsStaffToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();

    const ticket = body.data.find((t) => t.reference === multiInstTicketCode);
    assert.ok(ticket, "Ticket must appear on ICS Staff dashboard");

    // Only 1 service (ICS) should be visible to ICS staff!
    assert.equal(ticket.services.length, 1, "Only ICS service should be exposed to ICS staff");
    assert.equal(ticket.services[0].id, icsService.id);
    assert.equal(ticket.status, "pending");
  });
});

describe("3. Cross-Institution Access Control Enforcement", () => {
  test("CBE Staff is blocked (403) from updating ICS service status", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets/${multiInstTicketId}/services/${icsService.id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${cbeStaffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "in-progress" }),
    });
    assert.equal(res.status, 403, "CBE staff must not be permitted to update ICS service");
    const json = await res.json();
    assert.match(json.error, /assigned institution/i);
  });

  test("ICS Staff is blocked (403) from updating CBE service status", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets/${multiInstTicketId}/services/${cbeService.id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${icsStaffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "in-progress" }),
    });
    assert.equal(res.status, 403, "ICS staff must not be permitted to update CBE service");
    const json = await res.json();
    assert.match(json.error, /assigned institution/i);
  });
});

describe("4. Independent Service Processing Lifecycles", () => {
  test("CBE Staff advances CBE service to 'in-progress': ICS service remains 'pending'", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets/${multiInstTicketId}/service-status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${cbeStaffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "in-progress", notes: "CBE verification begun" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.status, "in-progress");

    // Check ICS Staff view: ICS service is STILL pending!
    const icsRes = await fetch(`${baseUrl}/api/admin/vip-tickets/${multiInstTicketId}`, {
      headers: { Authorization: `Bearer ${icsStaffToken}` },
    });
    assert.equal(icsRes.status, 200);
    const icsJson = await icsRes.json();
    assert.equal(icsJson.data.status, "pending", "ICS service status must still be pending");
    assert.equal(icsJson.data.overallStatus, "in-progress", "Overall ticket status is in-progress");
  });

  test("CBE Staff advances CBE service to 'completed': Overall ticket remains 'in-progress' because ICS is still pending", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets/${multiInstTicketId}/service-status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${cbeStaffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "completed", notes: "CBE bank account issued" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.status, "completed");

    // Check ICS Staff view: Still pending
    const icsRes = await fetch(`${baseUrl}/api/admin/vip-tickets/${multiInstTicketId}`, {
      headers: { Authorization: `Bearer ${icsStaffToken}` },
    });
    assert.equal(icsRes.status, 200);
    const icsJson = await icsRes.json();
    assert.equal(icsJson.data.status, "pending");
    assert.equal(icsJson.data.overallStatus, "in-progress", "Ticket is not fully completed until all institutions finish");
  });

  test("ICS Staff advances ICS service to 'in-progress' then 'completed': Overall ticket becomes 'completed'", async () => {
    // 1. Advance to in-progress
    const step1 = await fetch(`${baseUrl}/api/admin/vip-tickets/${multiInstTicketId}/service-status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${icsStaffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "in-progress" }),
    });
    assert.equal(step1.status, 200);

    // 2. Advance to completed
    const step2 = await fetch(`${baseUrl}/api/admin/vip-tickets/${multiInstTicketId}/service-status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${icsStaffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "completed", notes: "Citizenship document stamped" }),
    });
    assert.equal(step2.status, 200);
    const body = await step2.json();
    assert.equal(body.data.status, "completed");
    assert.equal(body.data.overallStatus, "completed", "Overall ticket is now completely finished");
  });
});

describe("5. Super Admin Global Oversight & Filtering", () => {
  test("Super Admin sees all services and can filter by institution", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets/${multiInstTicketId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();

    // Super Admin sees both services
    assert.equal(body.data.services.length, 2, "Super Admin sees all services across all institutions");
    assert.ok(body.data.services.some((s) => s.id === cbeService.id));
    assert.ok(body.data.services.some((s) => s.id === icsService.id));
  });

  test("Super Admin can query institution-scoped tickets via ?institutionId", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets?institutionId=${cbeProvider.id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data.some((t) => t.reference === multiInstTicketCode));
  });
});

describe("6. Verified Orders Requirement", () => {
  test("Unverified (unpaid) ticket is hidden from Staff dashboard by default", async () => {
    const res = await fetch(`${baseUrl}/api/vip-tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        citizenName: "Unpaid Draft Applicant",
        citizenPhone: `0933${Math.floor(100000 + Math.random() * 900000)}`,
        email: "unpaid.draft@example.com",
        serviceIds: [cbeService.id],
        purpose: "Testing unverified draft filtering",
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    const draftCode = body.data.reference;
    const dbTicket = await prisma.vip_tickets.findUnique({ where: { ticketCode: draftCode } });
    draftTicketId = dbTicket.id;
    // Remains in PENDING payment status

    // CBE Staff list without includeUnconfirmed
    const staffRes = await fetch(`${baseUrl}/api/admin/vip-tickets`, {
      headers: { Authorization: `Bearer ${cbeStaffToken}` },
    });
    assert.equal(staffRes.status, 200);
    const staffJson = await staffRes.json();
    const found = staffJson.data.find((t) => t.reference === draftCode);
    assert.equal(found, undefined, "Unverified order must NOT appear in staff queue");

    // With ?includeUnconfirmed=true
    const unconfirmedRes = await fetch(`${baseUrl}/api/admin/vip-tickets?includeUnconfirmed=true`, {
      headers: { Authorization: `Bearer ${cbeStaffToken}` },
    });
    assert.equal(unconfirmedRes.status, 200);
    const unconfirmedJson = await unconfirmedRes.json();
    const foundUnconfirmed = unconfirmedJson.data.find((t) => t.reference === draftCode);
    assert.ok(foundUnconfirmed, "Unverified order appears when explicitly requested");
  });
});
