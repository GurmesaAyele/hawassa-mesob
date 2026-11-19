import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import app from "../src/app.js";
import prisma from "../src/config/db.js";
import { hashPassword, signToken } from "../src/utils/auth.js";

describe("Password Change & Controlled Reset Request Workflow", () => {
  let server;
  let baseUrl;

  const testStaffEmail = "test.staff.officer@hawassamesobcenter.et";
  const testOperatorEmail = "test.operator@hawassamesobcenter.et";
  const testSuperAdminEmail = "test.superadmin@hawassamesobcenter.et";

  let staffUser;
  let operatorUser;
  let superAdminUser;

  let staffToken;
  let operatorToken;
  let superAdminToken;

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // Cleanup any existing test users
    await prisma.password_reset_requests.deleteMany({
      where: {
        email: { in: [testStaffEmail, testOperatorEmail, testSuperAdminEmail] },
      },
    });

    await prisma.users.deleteMany({
      where: {
        email: { in: [testStaffEmail, testOperatorEmail, testSuperAdminEmail] },
      },
    });

    const initPasswordHash = await hashPassword("InitialPass#123");

    // Create staff
    staffUser = await prisma.users.create({
      data: {
        email: testStaffEmail,
        name: "Test Staff Officer",
        role: "STAFF",
        phone: "+251911000111",
        passwordHash: initPasswordHash,
        isActive: true,
      },
    });

    // Create operator
    operatorUser = await prisma.users.create({
      data: {
        email: testOperatorEmail,
        name: "Test Operator",
        role: "OPERATOR",
        phone: "+251911000222",
        passwordHash: initPasswordHash,
        isActive: true,
      },
    });

    // Create super admin
    superAdminUser = await prisma.users.create({
      data: {
        email: testSuperAdminEmail,
        name: "Test Super Admin",
        role: "SUPER_ADMIN",
        phone: "+251911000333",
        passwordHash: initPasswordHash,
        isActive: true,
      },
    });

    staffToken = signToken(staffUser);
    operatorToken = signToken(operatorUser);
    superAdminToken = signToken(superAdminUser);
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    await prisma.password_reset_requests.deleteMany({
      where: {
        email: { in: [testStaffEmail, testOperatorEmail, testSuperAdminEmail] },
      },
    });

    await prisma.users.deleteMany({
      where: {
        email: { in: [testStaffEmail, testOperatorEmail, testSuperAdminEmail] },
      },
    });
  });

  describe("1. Self-Service Change Password for All Roles", () => {
    test("Staff officer can change password with valid current password", async () => {
      const res = await fetch(`${baseUrl}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          currentPassword: "InitialPass#123",
          newPassword: "NewStaffPass#2026",
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);

      // Verify login with new password
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testStaffEmail,
          password: "NewStaffPass#2026",
        }),
      });

      const loginData = await loginRes.json();
      assert.equal(loginRes.status, 200);
      assert.equal(loginData.user.email, testStaffEmail);
    });

    test("Operator can change password", async () => {
      const res = await fetch(`${baseUrl}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${operatorToken}`,
        },
        body: JSON.stringify({
          currentPassword: "InitialPass#123",
          newPassword: "NewOperatorPass#2026",
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
    });

    test("Super Admin can change password", async () => {
      const res = await fetch(`${baseUrl}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          currentPassword: "InitialPass#123",
          newPassword: "NewSuperAdminPass#2026",
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
    });

    test("Rejects change password with wrong current password", async () => {
      const res = await fetch(`${baseUrl}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          currentPassword: "WrongCurrentPassword",
          newPassword: "ValidNewPass#2026",
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 400);
      assert.match(data.error, /current password/i);
    });

    test("Rejects change password if new password does not meet complexity rules", async () => {
      const res = await fetch(`${baseUrl}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          currentPassword: "NewStaffPass#2026",
          newPassword: "short",
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 400);
      assert.match(data.error, /at least 8 characters/i);
    });
  });

  describe("2. Controlled Password Reset Request Workflow", () => {
    let createdRequestId;

    test("User can submit a password reset request via public endpoint", async () => {
      const res = await fetch(`${baseUrl}/api/auth/reset-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testStaffEmail,
          name: "Test Staff Officer",
          role: "STAFF",
          phone: "+251911000111",
          reason: "Forgotten password on office computer",
        }),
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);

      // Verify request in DB
      const reqInDb = await prisma.password_reset_requests.findFirst({
        where: { email: testStaffEmail, status: "PENDING" },
      });

      assert.ok(reqInDb);
      assert.equal(reqInDb.role, "STAFF");
      createdRequestId = reqInDb.id;
    });

    test("Super Admin can list reset requests", async () => {
      const res = await fetch(`${baseUrl}/api/admin/reset-requests`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(data.data));
      assert.ok(data.meta.pendingCount >= 1);
    });

    test("Operator cannot access Super Admin reset requests queue (RBAC enforcement)", async () => {
      const res = await fetch(`${baseUrl}/api/admin/reset-requests`, {
        headers: { Authorization: `Bearer ${operatorToken}` },
      });

      assert.equal(res.status, 403);
    });

    test("Super Admin can approve reset request, generating a secure temporary password", async () => {
      const res = await fetch(`${baseUrl}/api/admin/reset-requests/${createdRequestId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${superAdminToken}`,
        },
      });

      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.ok(data.tempPassword);
      assert.ok(data.tempPassword.startsWith("Mesob#"));

      // Verify user has mustChangePassword: true in DB
      const userInDb = await prisma.users.findUnique({
        where: { email: testStaffEmail },
      });
      assert.equal(userInDb.mustChangePassword, true);

      // Verify user can log in with temporary password
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testStaffEmail,
          password: data.tempPassword,
        }),
      });

      const loginData = await loginRes.json();
      assert.equal(loginRes.status, 200);
      assert.equal(loginData.user.mustChangePassword, true);
    });
  });
});
