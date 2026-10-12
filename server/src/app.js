// src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import chatRoutes from "./modules/chat/chat.routes.js";

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

export default app;
