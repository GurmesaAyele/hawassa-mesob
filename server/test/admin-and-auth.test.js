import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import app from "../src/app.js";
import { isValidImageBuffer } from "../src/middleware/upload.js";

let server;
let baseUrl;
let superAdminToken;
let superAdminCookie;
let operatorToken;
let operatorCookie;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  // Log in as SUPER_ADMIN
  const saRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "superadmin@mesob.hawassa.gov.et",
      password: "AdminSuperSecret2026!",
    }),
  });
  assert.equal(saRes.status, 200, "Super admin login failed");
  const saData = await saRes.json();
  superAdminToken = saData.token;
  const saSetCookie = saRes.headers.get("set-cookie");
  if (saSetCookie) {
    superAdminCookie = saSetCookie.split(";")[0];
  }

  // Log in as OPERATOR
  const opRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "operator@mesob.hawassa.gov.et",
      password: "OperatorPass2026!",
    }),
  });
  assert.equal(opRes.status, 200, "Operator login failed");
  const opData = await opRes.json();
  operatorToken = opData.token;
  const opSetCookie = opRes.headers.get("set-cookie");
  if (opSetCookie) {
    operatorCookie = opSetCookie.split(";")[0];
  }
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("1. Authentication Endpoints (/api/auth)", () => {
  test("POST /api/auth/login rejects invalid password with uniform 401", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "superadmin@mesob.hawassa.gov.et",
        password: "WrongPassword123!",
      }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.error, "Invalid email or password.");
  });

  test("POST /api/auth/login rejects unknown email with uniform 401", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent@hawassa.gov.et",
        password: "SomePassword123!",
      }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.error, "Invalid email or password.");
  });

  test("GET /api/auth/me returns current user profile with Authorization Bearer header", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.email, "superadmin@mesob.hawassa.gov.et");
    assert.equal(data.user.role, "SUPER_ADMIN");
  });

  test("GET /api/auth/me returns current user profile with HttpOnly cookie", async () => {
    if (!superAdminCookie) return;
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: superAdminCookie },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.email, "superadmin@mesob.hawassa.gov.et");
  });

  test("GET /api/auth/me without session returns 401 Unauthorized", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
  });

  test("POST /api/auth/logout successfully clears session", async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
  });
});

describe("2. Unauthenticated Access Protection (401 on All Protected Endpoints)", () => {
  test("Anonymous POST /api/institutions returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/institutions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Unauth", code: "UNAUTH" }),
    });
    assert.equal(res.status, 401);
  });

  test("Anonymous PUT /api/map returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/map`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: "Unauth Address" }),
    });
    assert.equal(res.status, 401);
  });

  test("Anonymous GET /api/contact/messages returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/contact/messages`);
    assert.equal(res.status, 401);
  });

  test("Anonymous GET /api/messages alias returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/messages`);
    assert.equal(res.status, 401);
  });

  test("Anonymous POST /api/news returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/news`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Unauth", content: "Unauth" }),
    });
    assert.equal(res.status, 401);
  });

  test("Anonymous POST /api/announcements returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/announcements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Unauth", content: "Unauth" }),
    });
    assert.equal(res.status, 401);
  });

  test("Anonymous POST /api/videos returns 401", async () => {
    const res = await fetch(`${baseUrl}/api/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Unauth", youtubeUrl: "https://youtu.be/abc" }),
    });
    assert.equal(res.status, 401);
  });
});

describe("3. Role-Based Access Control (RBAC): SUPER_ADMIN vs OPERATOR", () => {
  let createdArticleId;
  let createdVideoId;
  let testMessageId;

  // OPERATOR CANNOT read or manage contact messages (Strict user requirement)
  test("OPERATOR is denied access (403 Forbidden) to GET /api/contact/messages", async () => {
    const res = await fetch(`${baseUrl}/api/contact/messages`, {
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    assert.equal(res.status, 403, "Operator must receive 403 on contact messages");
    const data = await res.json();
    assert.ok(data.error.includes("restricted exclusively to SUPER_ADMIN"));
  });

  test("OPERATOR is denied access (403 Forbidden) to GET /api/messages alias", async () => {
    const res = await fetch(`${baseUrl}/api/messages`, {
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    assert.equal(res.status, 403);
  });

  test("OPERATOR is denied access (403 Forbidden) to PATCH /api/contact/messages/:id", async () => {
    const res = await fetch(`${baseUrl}/api/contact/messages/dummy-id`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${operatorToken}`,
      },
      body: JSON.stringify({ isReviewed: true }),
    });
    assert.equal(res.status, 403);
  });

  // SUPER_ADMIN CAN read and manage contact messages
  test("SUPER_ADMIN can list contact messages with unreadCount metadata", async () => {
    const res = await fetch(`${baseUrl}/api/contact/messages`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.data), "data must be an array of messages");
    assert.ok(typeof data.meta.unreadCount === "number", "unreadCount must be a number");
    if (data.data.length > 0) {
      testMessageId = data.data[0].id;
    }
  });

  test("SUPER_ADMIN can update message review status via PATCH", async () => {
    if (!testMessageId) return;
    const res = await fetch(`${baseUrl}/api/contact/messages/${testMessageId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ isReviewed: true }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.isReviewed, true);
  });

  // OPERATOR CAN perform all other dashboard operations
  test("OPERATOR can create, update, and delete news items", async () => {
    // 1. Create
    const createRes = await fetch(`${baseUrl}/api/news`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${operatorToken}`,
      },
      body: JSON.stringify({
        title: "Operator Test News",
        content: "Operational update from IT team.",
        category: "Operations",
      }),
    });
    assert.equal(createRes.status, 201);
    const createData = await createRes.json();
    createdArticleId = createData.article.id;

    // 2. Update
    const updateRes = await fetch(`${baseUrl}/api/news/${createdArticleId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${operatorToken}`,
      },
      body: JSON.stringify({
        title: "Operator Test News (Updated)",
        content: "Updated operational content.",
      }),
    });
    assert.equal(updateRes.status, 200);

    // 3. Delete
    const deleteRes = await fetch(`${baseUrl}/api/news/${createdArticleId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    assert.equal(deleteRes.status, 200);
  });

  test("OPERATOR can manage videos (create and delete)", async () => {
    const createRes = await fetch(`${baseUrl}/api/videos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${operatorToken}`,
      },
      body: JSON.stringify({
        title: "MESOB IT Operator Tutorial",
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        description: "Official training walkthrough.",
        author: "IT Team",
        category: "Tutorial",
      }),
    });
    assert.equal(createRes.status, 201);
    const createData = await createRes.json();
    createdVideoId = createData.video.id;

    const deleteRes = await fetch(`${baseUrl}/api/videos/${createdVideoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    assert.equal(deleteRes.status, 200);
  });

  test("OPERATOR can update site settings (map and contact info)", async () => {
    const res = await fetch(`${baseUrl}/api/map`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${operatorToken}`,
      },
      body: JSON.stringify({
        operatingHours: "Monday - Friday: 8:00 AM - 6:00 PM (Continuous)",
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.contact || data.location?.contact);
  });
});

describe("4. Frontend Admin API Contract Compatibility", () => {
  test("GET /api/institutions?raw=true&includeInactive=true&limit=50 returns { data: [...] }", async () => {
    const res = await fetch(`${baseUrl}/api/institutions?raw=true&includeInactive=true&limit=50`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data), "Expected { data: [...] } structure");
  });

  test("GET /api/services?raw=true&includeInactive=true&limit=50 returns { data: [...] }", async () => {
    const res = await fetch(`${baseUrl}/api/services?raw=true&includeInactive=true&limit=50`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data), "Expected { data: [...] } structure");
  });

  test("GET /api/news?raw=true&includeInactive=true&limit=50 returns { data: [...] }", async () => {
    const res = await fetch(`${baseUrl}/api/news?raw=true&includeInactive=true&limit=50`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data), "Expected { data: [...] } structure");
  });

  test("GET /api/announcements?raw=true&includeInactive=true&limit=50 returns { data: [...] }", async () => {
    const res = await fetch(`${baseUrl}/api/announcements?raw=true&includeInactive=true&limit=50`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data), "Expected { data: [...] } structure");
  });

  test("GET /api/videos?raw=true&includeInactive=true&limit=50 returns { data: [...] }", async () => {
    const res = await fetch(`${baseUrl}/api/videos?raw=true&includeInactive=true&limit=50`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data), "Expected { data: [...] } structure");
  });
});

describe("5. Logo Upload Validation", () => {
  test("isValidImageBuffer rejects text or non-image buffer", () => {
    const fakeBuffer = Buffer.from("This is a plain text file pretending to be an image.");
    assert.equal(isValidImageBuffer(fakeBuffer), false);
  });

  test("isValidImageBuffer recognizes valid PNG buffer", () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    assert.equal(isValidImageBuffer(pngHeader), true);
  });

  test("isValidImageBuffer recognizes valid JPEG buffer", () => {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    assert.equal(isValidImageBuffer(jpegHeader), true);
  });
});

describe("6. Public Endpoints Regression Verification", () => {
  test("Public visitor can submit contact message without authentication", async () => {
    const res = await fetch(`${baseUrl}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Citizen Visitor",
        email: "citizen@example.com",
        message: "Question regarding passport counter services.",
      }),
    });
    assert.equal(res.status, 201);
  });

  test("Public visitor can browse services without authentication", async () => {
    const res = await fetch(`${baseUrl}/api/services?locale=en&limit=3`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.data));
  });

  test("Health check remains open and responsive", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, "ok");
  });
});
