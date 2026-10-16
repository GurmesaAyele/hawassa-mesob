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
});
