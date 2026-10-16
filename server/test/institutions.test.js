import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import app from "../src/app.js";

let server;
let baseUrl;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("Institutions & Services API Endpoints", () => {
  let sampleInstitutionId;
  let sampleServiceId;
  let createdInstitutionId;
  let createdServiceId;

  // ─── Public Read Endpoints ──────────────────────────────────────────────────
  test("GET /api/institutions returns list with locale localization and service count", async () => {
    const res = await fetch(`${baseUrl}/api/institutions?locale=en`);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.ok(Array.isArray(json.data), "data must be an array");
    assert.ok(json.meta, "meta pagination object must exist");
    assert.ok(json.data.length > 0, "should return at least one institution");

    const inst = json.data[0];
    sampleInstitutionId = inst.id;
    assert.ok(inst.id);
    assert.ok(inst.code);
    assert.ok(typeof inst.name === "string");
    assert.ok(typeof inst.serviceCount === "number");
  });

  test("GET /api/institutions with unsupported locale returns 400 Bad Request", async () => {
    const res = await fetch(`${baseUrl}/api/institutions?locale=fr`);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.ok(json.error.includes("Invalid locale"));
  });

  test("GET /api/institutions/:id returns institution details and services", async () => {
    assert.ok(sampleInstitutionId, "Need institution ID from previous test");
    const res = await fetch(`${baseUrl}/api/institutions/${sampleInstitutionId}?locale=am`);
    assert.equal(res.status, 200);

    const inst = await res.json();
    assert.equal(inst.id, sampleInstitutionId);
    assert.ok(Array.isArray(inst.services));
    if (inst.services.length > 0) {
      sampleServiceId = inst.services[0].id;
      assert.ok(typeof inst.services[0].title === "string");
      assert.ok(Array.isArray(inst.services[0].requirements));
    }
  });

  test("GET /api/institutions/:id/services returns paginated services", async () => {
    assert.ok(sampleInstitutionId);
    const res = await fetch(`${baseUrl}/api/institutions/${sampleInstitutionId}/services?locale=sid`);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.ok(json.institution);
    assert.ok(Array.isArray(json.data));
    assert.ok(json.meta);
  });

  test("GET /api/institutions/:id with non-existent ID returns 404", async () => {
    const res = await fetch(`${baseUrl}/api/institutions/non-existent-id`);
    assert.equal(res.status, 404);
  });

  test("GET /api/services returns global services with parent institution data", async () => {
    const res = await fetch(`${baseUrl}/api/services?locale=en&limit=5`);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.length > 0);
    const service = json.data[0];
    assert.ok(service.id);
    assert.ok(service.title);
    assert.ok(service.institution);
    assert.ok(service.institution.name);
  });

  test("GET /api/services/:id returns single service with institution info", async () => {
    if (!sampleServiceId) return;
    const res = await fetch(`${baseUrl}/api/services/${sampleServiceId}?locale=en`);
    assert.equal(res.status, 200);

    const service = await res.json();
    assert.equal(service.id, sampleServiceId);
    assert.ok(service.institution.code);
  });

  // ─── Admin Management Endpoints (CRUD) ──────────────────────────────────────
  test("POST /api/institutions creates a new institution with initial services", async () => {
    const newInstPayload = {
      name: {
        en: "Hawassa Innovation & Tech Agency",
        am: "የሀዋሳ ኢኖቬሽን እና ቴክኖሎጂ ኤጀንሲ",
        sid: "Hawaasa Kalaqonna Teeknoloojete Ejenise",
      },
      code: "TEST_TECH_AGENCY",
      icon: "/tech.png",
      floorRoomNumber: "Building C, Room 301",
      contactPhone: "+251 46 220 5555",
      services: [
        {
          title: "Startup Incubation Grant Support",
          description: "Government fund for innovative local startups.",
          requirements: ["Project Proposal", "Kebele ID", "TIN Number"],
          estimatedFee: 0.0,
          processingDays: 7,
        },
      ],
    };

    const res = await fetch(`${baseUrl}/api/institutions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newInstPayload),
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.ok(json.data);
    assert.equal(json.data.code, "TEST_TECH_AGENCY");
    assert.equal(json.data.services.length, 1);
    createdInstitutionId = json.data.id;
  });

  test("POST /api/institutions with duplicate code returns 409 Conflict", async () => {
    const res = await fetch(`${baseUrl}/api/institutions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate Agency",
        code: "TEST_TECH_AGENCY",
      }),
    });

    assert.equal(res.status, 409);
    const json = await res.json();
    assert.ok(json.error.includes("already exists"));
  });

  test("PUT /api/institutions/:id updates institution details", async () => {
    assert.ok(createdInstitutionId);
    const updatePayload = {
      contactPhone: "+251 46 220 9999",
      floorRoomNumber: "Main Hall, Counter 12",
    };

    const res = await fetch(`${baseUrl}/api/institutions/${createdInstitutionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatePayload),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.contactPhone, "+251 46 220 9999");
    assert.equal(json.data.floorRoomNumber, "Main Hall, Counter 12");
  });

  test("POST /api/institutions/:id/services adds a new service to the institution", async () => {
    assert.ok(createdInstitutionId);
    const newServicePayload = {
      title: {
        en: "Software Intellectual Property Certification",
        am: "የሶፍትዌር የፈጠራ ባለቤትነት ማረጋገጫ",
      },
      description: "Registration and IP rights certification for local software products.",
      requirements: ["Source code demo", "Architecture document", "Author ID"],
      estimatedFee: 250.0,
      processingDays: 5,
    };

    const res = await fetch(`${baseUrl}/api/institutions/${createdInstitutionId}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newServicePayload),
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.ok(json.data.id);
    createdServiceId = json.data.id;
  });

  test("PATCH /api/services/:id updates service fees and description", async () => {
    assert.ok(createdServiceId);
    const patchPayload = {
      estimatedFee: 300.0,
      processingDays: 3,
    };

    const res = await fetch(`${baseUrl}/api/services/${createdServiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchPayload),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.estimatedFee, 300.0);
    assert.equal(json.data.processingDays, 3);
  });

  test("DELETE /api/institutions/:id deactivates institution (soft delete)", async () => {
    assert.ok(createdInstitutionId);
    const res = await fetch(`${baseUrl}/api/institutions/${createdInstitutionId}`, {
      method: "DELETE",
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.isActive, false);

    // Verify it is not visible in public default query
    const checkRes = await fetch(`${baseUrl}/api/institutions/${createdInstitutionId}`);
    assert.equal(checkRes.status, 404);

    // Verify it IS visible in admin query with includeInactive=true
    const adminRes = await fetch(`${baseUrl}/api/institutions/${createdInstitutionId}?includeInactive=true`);
    assert.equal(adminRes.status, 200);
  });

  test("DELETE /api/institutions/:id?permanent=true permanently deletes test institution", async () => {
    assert.ok(createdInstitutionId);
    const res = await fetch(`${baseUrl}/api/institutions/${createdInstitutionId}?permanent=true`, {
      method: "DELETE",
    });

    assert.equal(res.status, 200);
    const checkRes = await fetch(`${baseUrl}/api/institutions/${createdInstitutionId}?includeInactive=true`);
    assert.equal(checkRes.status, 404);
  });
});
