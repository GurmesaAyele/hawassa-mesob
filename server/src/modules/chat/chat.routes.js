// src/modules/chat/chat.routes.js
import express from "express";

const router = express.Router();

// Temporary route for scaffolding check
router.get("/health", (req, res) => {
  res.json({ status: "ok", module: "chat" });
});

export default router;
