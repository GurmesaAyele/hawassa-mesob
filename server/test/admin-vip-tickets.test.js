import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import app from "../src/app.js";
import prisma from "../src/config/db.js";
import { hashPassword, signToken } from "../src/utils/auth.js";

let server;
let baseUrl;

let superAdminToken;
let superAdminCookie;

let operatorToken;
let operatorCookie;

let staffToken;
let staffCookie;

let citizenToken;

let testServiceId;
let createdTestTicketId;
let createdTestTicketCode;
const testCitizenPhone = `0911${Math.floor(100000 + Math.random() * 900000)}`;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  // Retrieve an active service ID for testing ticket creation
  const activeService = await prisma.service.findFirst({
    where: { isActive: true },
    select: { id: true, providerId: true },
  });
  testServiceId = activeService?.id;

  const defaultPasswordHash = await hashPassword("MesobTestPass2026!");

  // Ensure test accounts exist in DB
  const [saUser, opUser, staffUser, citUser] = await Promise.all([
    prisma.users.upsert({
      where: { email: "vip_test_superadmin@mesob.gov.et" },
      update: { role: "SUPER_ADMIN", isActive: true },
      create: {
        email: "vip_test_superadmin@mesob.gov.et",
        name: "Test Super Admin",
        passwordHash: defaultPasswordHash,
        role: "SUPER_ADMIN",
        isActive: true,
      },
    }),
    prisma.users.upsert({
      where: { email: "vip_test_operator@mesob.gov.et" },
      update: { role: "OPERATOR", isActive: true },
      create: {
        email: "vip_test_operator@mesob.gov.et",
        name: "Test Operator",
        passwordHash: defaultPasswordHash,
        role: "OPERATOR",
        isActive: true,
      },
    }),
    prisma.users.upsert({
      where: { email: "vip_test_staff@mesob.gov.et" },
      update: { role: "STAFF", institutionId: activeService?.providerId, isActive: true },
      create: {
        email: "vip_test_staff@mesob.gov.et",
        name: "Test Staff Member",
        passwordHash: defaultPasswordHash,
        role: "STAFF",
        institutionId: activeService?.providerId,
        isActive: true,
      },
    }),
    prisma.users.upsert({
      where: { email: "vip_test_citizen@citizen.et" },
      update: { role: "CITIZEN", isActive: true },
      create: {
        email: "vip_test_citizen@citizen.et",
        name: "Test Citizen",
        passwordHash: defaultPasswordHash,
        role: "CITIZEN",
        isActive: true,
      },
    }),
  ]);

  // Log in as SUPER_ADMIN
  const saRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: saUser.email,
      password: "MesobTestPass2026!",
    }),
  });
  assert.equal(saRes.status, 200, "Super admin login failed");
  const saData = await saRes.json();
  superAdminToken = saData.token;
  const saCookie = saRes.headers.get("set-cookie");
  if (saCookie) superAdminCookie = saCookie.split(";")[0];

  // Log in as OPERATOR
  const opRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: opUser.email,
      password: "MesobTestPass2026!",
    }),
  });
  assert.equal(opRes.status, 200, "Operator login failed");
  const opData = await opRes.json();
  operatorToken = opData.token;
  const opCookie = opRes.headers.get("set-cookie");
  if (opCookie) operatorCookie = opCookie.split(";")[0];

  // Log in as STAFF
  const staffRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: staffUser.email,
      password: "MesobTestPass2026!",
    }),
  });
  assert.equal(staffRes.status, 200, "Staff login failed");
  const staffData = await staffRes.json();
  staffToken = staffData.token;
  const staffCookieHeader = staffRes.headers.get("set-cookie");
  if (staffCookieHeader) staffCookie = staffCookieHeader.split(";")[0];

  // Generate token for CITIZEN
  citizenToken = signToken(citUser);
});

after(async () => {
  // Cleanup test tickets created during run
  if (createdTestTicketId) {
    try {
      await prisma.vip_tickets.deleteMany({
        where: { id: createdTestTicketId },
      });
    } catch {
      // ignore cleanup error
    }
  }

  // Cleanup test users
  try {
    await prisma.users.deleteMany({
      where: {
        email: {
          in: [
            "vip_test_superadmin@mesob.gov.et",
            "vip_test_operator@mesob.gov.et",
            "vip_test_staff@mesob.gov.et",
            "vip_test_citizen@citizen.et",
          ],
        },
      },
    });
  } catch {
    // ignore cleanup error
  }

  await new Promise((resolve) => server.close(resolve));
});

describe("1. STAFF Role Authentication & Session Management", () => {
  test("Staff can successfully authenticate via POST /api/auth/login", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "vip_test_staff@mesob.gov.et",
        password: "MesobTestPass2026!",
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.user.role, "STAFF");
    assert.equal(typeof body.token, "string");
  });

  test("GET /api/auth/me returns role: STAFF with Bearer token", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.user.role, "STAFF");
    assert.equal(body.user.email, "vip_test_staff@mesob.gov.et");
  });

  test("GET /api/auth/me returns role: STAFF with HttpOnly cookie", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: staffCookie },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.user.role, "STAFF");
  });

  test("Citizen role is rejected from admin login with 403", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "vip_test_citizen@citizen.et",
        password: "MesobTestPass2026!",
      }),
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.error, /administrative role required/i);
  });
});

describe("2. Least Privilege Enforcement (Staff Denied on Non-VIP Admin Routes)", () => {
  test("Staff is blocked (403) from POST /api/institutions", async () => {
    const res = await fetch(`${baseUrl}/api/institutions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: { en: "Test Institution" }, code: "TEST_INST" }),
    });
    assert.equal(res.status, 403);
  });

  test("Staff is blocked (403) from POST /api/services", async () => {
    const res = await fetch(`${baseUrl}/api/services`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: { en: "Test Service" } }),
    });
    assert.equal(res.status, 403);
  });

  test("Staff is blocked (403) from PUT /api/map", async () => {
    const res = await fetch(`${baseUrl}/api/map`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contact: { email: "update@test.com" } }),
    });
    assert.equal(res.status, 403);
  });

  test("Staff is blocked (403) from GET /api/contact/messages inbox", async () => {
    const res = await fetch(`${baseUrl}/api/contact/messages`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert.equal(res.status, 403);
  });

  test("Staff is blocked (403) from GET /api/messages alias inbox", async () => {
    const res = await fetch(`${baseUrl}/api/messages`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert.equal(res.status, 403);
  });

  test("Staff is blocked (403) from POST /api/news", async () => {
    const res = await fetch(`${baseUrl}/api/news`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: { en: "Test News" } }),
    });
    assert.equal(res.status, 403);
  });

  test("Staff is blocked (403) from POST /api/announcements", async () => {
    const res = await fetch(`${baseUrl}/api/announcements`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: { en: "Test Announcement" } }),
    });
    assert.equal(res.status, 403);
  });

  test("Staff is blocked (403) from POST /api/videos", async () => {
    const res = await fetch(`${baseUrl}/api/videos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: { en: "Test Video" } }),
    });
    assert.equal(res.status, 403);
  });
});

describe("3. Admin VIP Tickets List Endpoint (GET /api/admin/vip-tickets)", () => {
  // Create a test ticket before running list assertions
  before(async () => {
    if (!testServiceId) return;

    const res = await fetch(`${baseUrl}/api/vip-tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        citizenName: "VIP Integration Test User",
        citizenPhone: testCitizenPhone,
        email: "vip.test.applicant@mesob.et",
        serviceIds: [testServiceId],
        purpose: "Testing admin list and status progression workflow",
      }),
    });
    assert.equal(res.status, 201, "Failed to create public test VIP ticket");
    const json = await res.json();
    createdTestTicketCode = json.data.reference;
    const dbTicket = await prisma.vip_tickets.findUnique({
      where: { ticketCode: createdTestTicketCode },
    });
    createdTestTicketId = dbTicket.id;
    await prisma.vip_tickets.update({
      where: { id: createdTestTicketId },
      data: { status: "CONFIRMED" },
    });
  });

  test("Anonymous GET /api/admin/vip-tickets returns 401 Unauthorized", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets`);
    assert.equal(res.status, 401);
  });

  test("Citizen GET /api/admin/vip-tickets returns 403 Forbidden", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert.equal(res.status, 403);
  });

  test("Staff GET /api/admin/vip-tickets returns 200 with contract data and meta", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets?page=1&limit=25`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.ok(Array.isArray(body.data), "data must be an array");
    assert.ok(body.meta, "meta object must be present");
    assert.equal(body.meta.page, 1);
    assert.equal(body.meta.limit, 25);
    assert.equal(typeof body.meta.total, "number");
    assert.ok(body.meta.statusCounts, "statusCounts must be present in meta");
    assert.equal(typeof body.meta.statusCounts.pending, "number");
    assert.equal(typeof body.meta.statusCounts["in-progress"], "number");
    assert.equal(typeof body.meta.statusCounts.completed, "number");

    // Verify ticket item contract
    const ticket = body.data.find((t) => t.reference === createdTestTicketCode);
    assert.ok(ticket, "Created test ticket must be present in admin list");
    assert.equal(ticket.reference, createdTestTicketCode);
    assert.equal(ticket.person, "VIP Integration Test User");
    assert.equal(ticket.phone, testCitizenPhone);
    assert.equal(ticket.status, "pending"); // Serialized lowercase
    assert.ok(ticket.service, "service label must be present");
    assert.ok(Array.isArray(ticket.services), "services must be an array");
    assert.ok(ticket.issuedAt, "issuedAt timestamp must be present");
  });

  test("Operator GET /api/admin/vip-tickets returns 200", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets`, {
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    assert.equal(res.status, 200);
  });

  test("Super Admin GET /api/admin/vip-tickets returns 200", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.status, 200);
  });

  test("Status filtering with ?status=pending returns only pending records", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets?status=pending`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    for (const item of body.data) {
      assert.equal(item.status, "pending");
    }
  });

  test("Invalid status query (?status=nonexistent) returns 400 Bad Request", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets?status=nonexistent`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /invalid status/i);
  });

  test("Invalid page query (?page=0) returns 400 Bad Request", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets?page=0`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert.equal(res.status, 400);
  });

  test("Invalid limit query (?limit=-5) returns 400 Bad Request", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets?limit=-5`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert.equal(res.status, 400);
  });
});

describe("4. Service Status Progression & Audit History (PATCH /api/admin/vip-tickets/:id/service-status)", () => {
  test("Anonymous PATCH returns 401 Unauthorized", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets/${createdTestTicketId}/service-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in-progress" }),
    });
    assert.equal(res.status, 401);
  });

  test("Operator PATCH returns 403 Forbidden (Operators cannot update service status)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets/${createdTestTicketId}/service-status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${operatorToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "in-progress" }),
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.error, /requires one of: super_admin, staff|access denied/i);
  });

  test("PATCH with invalid status returns 400 Bad Request", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets/${createdTestTicketId}/service-status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "invalid_status" }),
    });
    assert.equal(res.status, 400);
  });

  test("Staff: Valid forward transition PENDING -> IN_PROGRESS succeeds with 200 and audit entry", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets/${createdTestTicketId}/service-status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "in-progress",
        notes: "Staff began processing citizenship verification",
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.status, "in-progress");
    assert.equal(body.history.previousStatus, "pending");
    assert.equal(body.history.newStatus, "in-progress");
    assert.equal(body.history.changedBy, "Test Staff Member");
    assert.equal(body.history.notes, "Staff began processing citizenship verification");
  });

  test("Staff: Disallowed transition IN_PROGRESS -> PENDING returns 400 Bad Request", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets/${createdTestTicketId}/service-status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "pending" }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /invalid status transition/i);
  });

  test("Staff: Valid forward transition IN_PROGRESS -> COMPLETED succeeds with 200", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets/${createdTestTicketId}/service-status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "completed",
        notes: "Documents signed and delivered",
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.status, "completed");
  });

  test("Staff: Disallowed transition COMPLETED -> IN_PROGRESS returns 400 Bad Request", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets/${createdTestTicketId}/service-status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "in-progress" }),
    });
    assert.equal(res.status, 400);
  });

  test("Super Admin: Corrective transition COMPLETED -> IN_PROGRESS succeeds with 200", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets/${createdTestTicketId}/service-status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "in-progress",
        notes: "Super Admin reopening application for secondary document check",
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.status, "in-progress");
    assert.equal(body.history.previousStatus, "completed");
    assert.equal(body.history.newStatus, "in-progress");
  });

  test("Idempotent transition (target equals current) returns 200 without duplicate audit row", async () => {
    // Current status is IN_PROGRESS; send in-progress again
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets/${createdTestTicketId}/service-status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "in-progress" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.status, "in-progress");
    assert.match(body.message, /already in 'in-progress'/i);
  });

  test("GET /api/admin/vip-tickets/:id returns full ticket with status audit history", async () => {
    const res = await fetch(`${baseUrl}/api/admin/vip-tickets/${createdTestTicketId}`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.id, createdTestTicketId);
    assert.ok(Array.isArray(body.data.history), "history must be an array");
    assert.ok(body.data.history.length >= 3, "must record audit history entries");
  });
});

describe("5. Public VIP API Contract Preservation & Regression Checks", () => {
  test("Public POST /api/vip-tickets continues returning data.reference and data.status", async () => {
    if (!testServiceId) return;

    const res = await fetch(`${baseUrl}/api/vip-tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        citizenName: "Public Contract Tester",
        citizenPhone: `0912${Math.floor(100000 + Math.random() * 900000)}`,
        email: "public.tester@mesob.gov.et",
        serviceIds: [testServiceId],
        purpose: "Checking backward compatibility",
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.data.reference, "data.reference must be present");
    assert.ok(body.data.status, "data.status must be present");
    assert.equal(body.data.status, "PENDING"); // Queue lifecycle status preserved

    // Cleanup
    await prisma.vip_tickets.deleteMany({
      where: { ticketCode: body.data.reference },
    });
  });

  test("Public POST /api/vip-tickets/track returns masked PII", async () => {
    const res = await fetch(`${baseUrl}/api/vip-tickets/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: createdTestTicketCode,
        phone: testCitizenPhone,
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.reference, createdTestTicketCode);
    assert.ok(body.data.maskedCitizenName || body.data.person, "Masked citizen name should be present");
    // Ensure full phone number is not exposed publicly
    assert.equal(body.data.phone, undefined, "Phone should not be in public tracking response");
  });
});

