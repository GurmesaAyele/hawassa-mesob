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

let superAdminToken;
let operatorToken;
let staffToken;

let superAdminUserId;
const createdStaffIds = [];

const DEFAULT_PASS = "StaffTestSecret2026!";

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  const defaultPasswordHash = await hashPassword(DEFAULT_PASS);

  // 1. Fetch 2 distinct institutions
  const providers = await prisma.serviceProvider.findMany({
    take: 2,
    orderBy: { id: "asc" },
  });
  assert.ok(providers.length >= 2, "Need at least 2 service providers for staff management tests");
  [cbeProvider, icsProvider] = providers;

  // 2. Provision Super Admin
  const saUser = await prisma.users.upsert({
    where: { email: "staff_mgmt_superadmin@mesob.gov.et" },
    update: { role: "SUPER_ADMIN", isActive: true },
    create: {
      email: "staff_mgmt_superadmin@mesob.gov.et",
      name: "Staff Mgmt Super Admin",
      passwordHash: defaultPasswordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });
  superAdminUserId = saUser.id;

  // 3. Provision Operator
  const opUser = await prisma.users.upsert({
    where: { email: "staff_mgmt_operator@mesob.gov.et" },
    update: { role: "OPERATOR", isActive: true },
    create: {
      email: "staff_mgmt_operator@mesob.gov.et",
      name: "Staff Mgmt Operator",
      passwordHash: defaultPasswordHash,
      role: "OPERATOR",
      isActive: true,
    },
  });

  // 4. Provision Regular Staff
  const staffUser = await prisma.users.upsert({
    where: { email: "staff_mgmt_existing_staff@mesob.gov.et" },
    update: { role: "STAFF", institutionId: cbeProvider.id, isActive: true },
    create: {
      email: "staff_mgmt_existing_staff@mesob.gov.et",
      name: "Existing Staff Desk",
      passwordHash: defaultPasswordHash,
      role: "STAFF",
      institutionId: cbeProvider.id,
      isActive: true,
    },
  });

  // Log in Super Admin
  const saRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: saUser.email, password: DEFAULT_PASS }),
  });
  assert.equal(saRes.status, 200);
  superAdminToken = (await saRes.json()).token;

  // Log in Operator
  const opRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: opUser.email, password: DEFAULT_PASS }),
  });
  assert.equal(opRes.status, 200);
  operatorToken = (await opRes.json()).token;

  // Log in Staff
  const stRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: staffUser.email, password: DEFAULT_PASS }),
  });
  assert.equal(stRes.status, 200);
  staffToken = (await stRes.json()).token;
});

after(async () => {
  // Clean up any staff created during tests
  if (createdStaffIds.length > 0) {
    await prisma.users.deleteMany({
      where: { id: { in: createdStaffIds } },
    }).catch(() => {});
  }

  // Clean up provisioned seed users
  await prisma.users.deleteMany({
    where: {
      email: {
        in: [
          "staff_mgmt_superadmin@mesob.gov.et",
          "staff_mgmt_operator@mesob.gov.et",
          "staff_mgmt_existing_staff@mesob.gov.et",
        ],
      },
    },
  }).catch(() => {});

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe("Super Admin Staff Management API", () => {
  describe("1. Access Control & Authorization", () => {
    test("Unauthenticated request is rejected (401)", async () => {
      const res = await fetch(`${baseUrl}/api/admin/staff`);
      assert.equal(res.status, 401);
    });

    test("Operator account is rejected with 403 Forbidden", async () => {
      const res = await fetch(`${baseUrl}/api/admin/staff`, {
        headers: { Authorization: `Bearer ${operatorToken}` },
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.match(data.error, /Access denied/i);
    });

    test("Staff account is rejected with 403 Forbidden", async () => {
      const res = await fetch(`${baseUrl}/api/admin/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${staffToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Unauthorized Staff",
          email: "unauth@mesob.gov.et",
          password: "SecretPass123!",
          institutionId: cbeProvider.id,
        }),
      });
      assert.equal(res.status, 403);
    });
  });

  describe("2. Create Staff Member (POST /api/admin/staff)", () => {
    let createdStaffId;
    const testEmail = `new_cbe_staff_${Date.now()}@mesob.gov.et`;

    test("Validation: rejects missing name or short name (<2 chars)", async () => {
      const res = await fetch(`${baseUrl}/api/admin/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "A",
          email: "valid@mesob.gov.et",
          password: "ValidPass123!",
          institutionId: cbeProvider.id,
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /name must be at least 2 characters/i);
    });

    test("Validation: rejects invalid email address", async () => {
      const res = await fetch(`${baseUrl}/api/admin/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Valid Name",
          email: "not-an-email",
          password: "ValidPass123!",
          institutionId: cbeProvider.id,
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /valid email address is required/i);
    });

    test("Validation: rejects short password (<6 chars)", async () => {
      const res = await fetch(`${baseUrl}/api/admin/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Valid Name",
          email: "valid@mesob.gov.et",
          password: "123",
          institutionId: cbeProvider.id,
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /password must be at least 6 characters/i);
    });

    test("Validation: rejects non-existent institution", async () => {
      const res = await fetch(`${baseUrl}/api/admin/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Valid Name",
          email: "valid@mesob.gov.et",
          password: "ValidPass123!",
          institutionId: "non_existent_institution_id_12345",
        }),
      });
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.match(data.error, /institution.*not found/i);
    });

    test("Super Admin creates staff member bound by institutionId", async () => {
      const res = await fetch(`${baseUrl}/api/admin/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Abebe Kebede",
          email: testEmail,
          password: "StaffSecretPassword2026!",
          institutionId: cbeProvider.id,
          phone: "0911002233",
        }),
      });

      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.name, "Abebe Kebede");
      assert.equal(body.data.email, testEmail);
      assert.equal(body.data.phone, "0911002233");
      assert.equal(body.data.role, "STAFF");
      assert.equal(body.data.institutionId, cbeProvider.id);
      assert.equal(body.data.institution.code, cbeProvider.code);
      assert.equal(body.data.isActive, true);
      // Ensure password hash is NEVER leaked in response
      assert.equal(body.data.passwordHash, undefined);

      createdStaffId = body.data.id;
      createdStaffIds.push(createdStaffId);
    });

    test("Super Admin creates staff member bound by institutionCode", async () => {
      const codeEmail = `ics_staff_${Date.now()}@mesob.gov.et`;
      const res = await fetch(`${baseUrl}/api/admin/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "ICS Desk Representative",
          email: codeEmail,
          password: "StaffSecretPassword2026!",
          institutionCode: icsProvider.code,
        }),
      });

      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.data.institutionId, icsProvider.id);
      assert.equal(body.data.institution.code, icsProvider.code);
      createdStaffIds.push(body.data.id);
    });

    test("Validation: rejects duplicate email address with 409 Conflict", async () => {
      const res = await fetch(`${baseUrl}/api/admin/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Another Person",
          email: testEmail,
          password: "AnotherPassword123!",
          institutionId: cbeProvider.id,
        }),
      });
      assert.equal(res.status, 409);
      const data = await res.json();
      assert.match(data.error, /already exists/i);
    });

    test("Newly created staff can immediately authenticate via POST /api/auth/login", async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: "StaffSecretPassword2026!",
        }),
      });

      assert.equal(loginRes.status, 200);
      const loginData = await loginRes.json();
      assert.ok(loginData.token);
      assert.equal(loginData.user.role, "STAFF");
      assert.equal(loginData.user.institutionId, cbeProvider.id);
      assert.equal(loginData.user.institution.code, cbeProvider.code);
    });
  });

  describe("3. List Staff Members (GET /api/admin/staff)", () => {
    test("Lists staff members with pagination and bound institution details", async () => {
      const res = await fetch(`${baseUrl}/api/admin/staff?limit=10&page=1`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.data.length >= 1);
      assert.ok(body.meta.total >= 1);
      // Ensure all listed accounts have role STAFF
      for (const staff of body.data) {
        assert.equal(staff.role, "STAFF");
        assert.ok(staff.institution);
        assert.equal(staff.passwordHash, undefined);
      }
    });

    test("Filters staff list by institutionId", async () => {
      const res = await fetch(`${baseUrl}/api/admin/staff?institutionId=${cbeProvider.id}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.data.length >= 1);
      for (const staff of body.data) {
        assert.equal(staff.institutionId, cbeProvider.id);
      }
    });

    test("Searches staff by name or email keyword", async () => {
      const res = await fetch(`${baseUrl}/api/admin/staff?search=Abebe`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.data.length >= 1);
      assert.ok(body.data.some((s) => s.name.includes("Abebe")));
    });
  });

  describe("4. Get Single Staff Member (GET /api/admin/staff/:id)", () => {
    test("Returns details of a specific staff member", async () => {
      const targetId = createdStaffIds[0];
      const res = await fetch(`${baseUrl}/api/admin/staff/${targetId}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.id, targetId);
      assert.equal(body.data.role, "STAFF");
      assert.ok(body.data.institution);
    });

    test("Returns 404 for non-existent staff ID", async () => {
      const res = await fetch(`${baseUrl}/api/admin/staff/non-existent-id-999`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.equal(res.status, 404);
    });

    test("Returns 404 when querying a non-STAFF user ID", async () => {
      const res = await fetch(`${baseUrl}/api/admin/staff/${superAdminUserId}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.equal(res.status, 404);
    });
  });

  describe("5. Update Staff Member Details (PATCH /api/admin/staff/:id)", () => {
    test("Updates name, phone, and reassigns institution", async () => {
      const targetId = createdStaffIds[0];
      const res = await fetch(`${baseUrl}/api/admin/staff/${targetId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Abebe K. Updated",
          phone: "0999887766",
          institutionId: icsProvider.id,
        }),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.name, "Abebe K. Updated");
      assert.equal(body.data.phone, "0999887766");
      assert.equal(body.data.institutionId, icsProvider.id);
      assert.equal(body.data.institution.code, icsProvider.code);
    });

    test("Deactivating staff (isActive: false) blocks subsequent login", async () => {
      const targetId = createdStaffIds[0];
      const staffUser = await prisma.users.findUnique({ where: { id: targetId } });

      // Deactivate
      const patchRes = await fetch(`${baseUrl}/api/admin/staff/${targetId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: false }),
      });
      assert.equal(patchRes.status, 200);
      const patchData = await patchRes.json();
      assert.equal(patchData.data.isActive, false);

      // Attempt login
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: staffUser.email,
          password: "StaffSecretPassword2026!",
        }),
      });
      assert.equal(loginRes.status, 403);
      const loginErr = await loginRes.json();
      assert.match(loginErr.error, /deactivated/i);

      // Reactivate for subsequent tests
      await fetch(`${baseUrl}/api/admin/staff/${targetId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: true }),
      });
    });

    test("Super Admin can reset staff password and staff logs in with new password", async () => {
      const targetId = createdStaffIds[0];
      const staffUser = await prisma.users.findUnique({ where: { id: targetId } });
      const newPassword = "BrandNewSecurePassword2026!";

      // Reset password
      const resetRes = await fetch(`${baseUrl}/api/admin/staff/${targetId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      });
      assert.equal(resetRes.status, 200);

      // Old password fails
      const oldLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: staffUser.email,
          password: "StaffSecretPassword2026!",
        }),
      });
      assert.equal(oldLogin.status, 401);

      // New password succeeds
      const newLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: staffUser.email,
          password: newPassword,
        }),
      });
      assert.equal(newLogin.status, 200);
    });

    test("Updating email to an address already taken by another user returns 409 Conflict", async () => {
      const targetId = createdStaffIds[0];
      const otherStaff = await prisma.users.findUnique({
        where: { id: createdStaffIds[1] },
      });

      const res = await fetch(`${baseUrl}/api/admin/staff/${targetId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: otherStaff.email }),
      });
      assert.equal(res.status, 409);
      const data = await res.json();
      assert.match(data.error, /already exists/i);
    });
  });

  describe("6. Delete Staff Member Account (DELETE /api/admin/staff/:id)", () => {
    test("Super Admin deletes a staff member account", async () => {
      const targetId = createdStaffIds[0];
      const staffRecord = await prisma.users.findUnique({ where: { id: targetId } });

      const delRes = await fetch(`${baseUrl}/api/admin/staff/${targetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(delRes.status, 200);
      const delData = await delRes.json();
      assert.equal(delData.success, true);
      assert.equal(delData.data.id, targetId);

      // Verifying staff member is gone from DB
      const getRes = await fetch(`${baseUrl}/api/admin/staff/${targetId}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.equal(getRes.status, 404);

      // Login fails
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: staffRecord.email,
          password: "BrandNewSecurePassword2026!",
        }),
      });
      assert.equal(loginRes.status, 401);

      // Remove from cleanup tracker since already deleted
      createdStaffIds.shift();
    });

    test("Deleting non-existent staff member returns 404", async () => {
      const res = await fetch(`${baseUrl}/api/admin/staff/non-existent-id`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.equal(res.status, 404);
    });

    test("Super Admin cannot delete their own account via this endpoint", async () => {
      const res = await fetch(`${baseUrl}/api/admin/staff/${superAdminUserId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      // Will return 404 (because role !== STAFF) or 400
      assert.ok(res.status === 404 || res.status === 400);
    });
  });
});

