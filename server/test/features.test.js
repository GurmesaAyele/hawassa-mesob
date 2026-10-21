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

describe("Client Features API: Videos, Map/Location, News, Announcements & Contact", () => {
  // ─── 1. YouTube Videos Endpoints ─────────────────────────────────────────────
  describe("1. YouTube Videos API (/api/videos)", () => {
    test("GET /api/videos returns list of all 8 Hawassa MESOB YouTube videos", async () => {
      const res = await fetch(`${baseUrl}/api/videos`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data));
      assert.ok(data.length >= 8);

      // Check first video fields
      const first = data[0];
      assert.ok(first.id);
      assert.ok(first.title);
      assert.ok(first.youtubeUrl.startsWith("https://www.youtube.com/watch?v="));
      assert.ok(first.embedUrl.startsWith("https://www.youtube.com/embed/"));
      assert.ok(first.thumbnail.startsWith("https://img.youtube.com/vi/"));
      assert.ok(first.duration);
      assert.ok(first.views);
    });

    test("GET /api/videos/:id returns specific video", async () => {
      const res = await fetch(`${baseUrl}/api/videos/vid-1`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.id, "vid-1");
      assert.equal(data.title, "MESOB Center Inauguration Speech");
    });

    test("POST /api/videos validates YouTube URL and adds video", async () => {
      const payload = {
        title: "Hawassa MESOB Special Feature",
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        description: "Special citizen feature",
        author: "MESOB Media",
        category: "Features",
      };

      const res = await fetch(`${baseUrl}/api/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.video.id);
      assert.equal(data.video.embedUrl, "https://www.youtube.com/embed/dQw4w9WgXcQ");
      assert.equal(
        data.video.thumbnail,
        "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
      );
    });

    test("POST /api/videos rejects invalid URL", async () => {
      const res = await fetch(`${baseUrl}/api/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Invalid Video",
          youtubeUrl: "https://not-youtube.com/watch",
        }),
      });

      assert.equal(res.status, 400);
    });
  });

  // ─── 2. Map & Location Endpoints ─────────────────────────────────────────────
  describe("2. Map & Location API (/api/map & /api/location)", () => {
    test("GET /api/map returns authentic Hawassa MESOB Center map, coordinates & headquarters info", async () => {
      const res = await fetch(`${baseUrl}/api/map`);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.contact.address, "MESOB Center, Hawassa, Ethiopia");
      assert.equal(data.contact.operatingHours, "Monday - Friday: 8:00 AM - 6:00 PM");
      assert.equal(data.contact.phone, "+251974270600");
      assert.equal(data.contact.email, "admin@hawassamesobcenter.et");

      assert.equal(data.map.placeName, "HAWASSA CITY MESOB CENTER");
      assert.equal(data.map.coordinates.latitude, 7.0472875);
      assert.equal(data.map.coordinates.longitude, 38.4830077);
      assert.ok(data.map.embedUrl.includes("maps/embed"));
      assert.ok(data.map.iframeHtml.includes("<iframe"));
      assert.ok(data.map.directionsUrl.includes("7.0472875"));
    });

    test("GET /api/location returns alias of map info", async () => {
      const res = await fetch(`${baseUrl}/api/location`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.map.placeName, "HAWASSA CITY MESOB CENTER");
    });

    test("PUT /api/map allows updating contact or location info", async () => {
      const res = await fetch(`${baseUrl}/api/map`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatingHours: "Monday - Friday: 8:00 AM - 6:00 PM (Continuous)",
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(
        data.location.contact.operatingHours,
        "Monday - Friday: 8:00 AM - 6:00 PM (Continuous)"
      );
    });
  });

  // ─── 3. Contact Form Submission Endpoints ────────────────────────────────────
  describe("3. Contact Form Submission (/api/contact)", () => {
    test("GET /api/contact returns contact card information", async () => {
      const res = await fetch(`${baseUrl}/api/contact`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.title, "Hawassa City MESOB Center");
      assert.equal(data.email, "admin@hawassamesobcenter.et");
      assert.equal(data.phone, "+251974270600");
    });

    test("POST /api/contact receives and validates citizen feedback/message", async () => {
      const res = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Abebe Kebede",
          email: "abebe@example.com",
          phone: "+251911223344",
          message: "Inquiry about business license renewal schedule.",
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.data.name, "Abebe Kebede");
    });

    test("POST /api/contact validates required fields", async () => {
      const res = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Incomplete User",
        }),
      });

      assert.equal(res.status, 400);
    });
  });

  // ─── 4. News Endpoints ───────────────────────────────────────────────────────
  describe("4. News API (/api/news)", () => {
    test("GET /api/news returns list of news articles", async () => {
      const res = await fetch(`${baseUrl}/api/news`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data));
      assert.ok(data.length >= 4);

      const item = data[0];
      assert.ok(item.id);
      assert.ok(item.title);
      assert.ok(item.content);
      assert.ok(item.author);
      assert.ok(item.date);
    });

    test("POST /api/news creates a new news article", async () => {
      const res = await fetch(`${baseUrl}/api/news`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Public Wi-Fi Network Launched at MESOB Center",
          content: "High-speed free Wi-Fi is now available in all waiting lounges.",
          author: "IT Support Team",
          category: "Technology",
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.article.id);
      assert.equal(data.article.category, "Technology");
    });
  });

  // ─── 5. Announcements Endpoints ──────────────────────────────────────────────
  describe("5. Announcements API (/api/announcements)", () => {
    test("GET /api/announcements returns list of announcements with priority and type", async () => {
      const res = await fetch(`${baseUrl}/api/announcements`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data));
      assert.ok(data.length >= 4);

      const item = data[0];
      assert.ok(item.id);
      assert.ok(item.title);
      assert.ok(item.content);
      assert.ok(["high", "medium", "low"].includes(item.priority));
      assert.ok(["event", "update", "alert", "general"].includes(item.type));
    });

    test("POST /api/announcements creates a new announcement", async () => {
      const res = await fetch(`${baseUrl}/api/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Urgent Counter Maintenance Notice",
          content: "Counter 4 will undergo quick hardware upgrade today at 4 PM.",
          priority: "high",
          type: "alert",
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.announcement.id);
      assert.equal(data.announcement.priority, "high");
      assert.equal(data.announcement.type, "alert");
    });
  });
});
