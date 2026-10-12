// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const chatRoutes = require("./modules/chat/chat.routes");

const app = express();

// ─── Global Middleware ───────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ─── Health Check ────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "mesob-hawassa-api",
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ──────────────────────────────────────────
app.use("/api/chat", chatRoutes);

// ─── 404 Handler ─────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global Error Handler ────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
