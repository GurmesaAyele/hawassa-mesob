import express from "express";
import cors from "cors";
import helmet from "helmet";
import chatRoutes from "./modules/chat/chat.routes.js";
import { generalRateLimiter } from "./middleware/rate-limiter.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());

// ─── Hardened CORS Configuration ──────────────────────────────
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (curl, mobile apps, server-to-server) without Origin header
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // In development or local testing, permit private LAN IPv4 origins if requested
    if (
      process.env.NODE_ENV !== "production" &&
      (/^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin))
    ) {
      return callback(null, true);
    }
    return callback(new Error(`Origin '${origin}' not allowed by CORS policy`), false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "100kb" }));

// ─── Global API Rate Limiter ──────────────────────────────────
app.use("/api", generalRateLimiter);

// ─── Health Endpoint ──────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "mesob-hawassa-api",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/chat", chatRoutes);

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Centralized Error Handler ────────────────────────────────
app.use((err, req, res, next) => {
  // Catch malformed JSON payloads from express.json()
  if (err.type === "entity.parse.failed" || (err instanceof SyntaxError && err.status === 400 && "body" in err)) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  // Catch CORS policy rejection
  if (err.message && err.message.includes("not allowed by CORS")) {
    return res.status(403).json({ error: err.message });
  }

  console.error("Unhandled error:", err.message || err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
