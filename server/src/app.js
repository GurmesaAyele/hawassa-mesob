import express from "express";
import cors from "cors";
import helmet from "helmet";
import chatRoutes from "./modules/chat/chat.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "mesob-hawassa-api",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/chat", chatRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
