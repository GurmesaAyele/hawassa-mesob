import express from "express";
import { handleChatMessage } from "./chat.controller.js";
import { chatRateLimiter } from "../../middleware/rate-limiter.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", module: "chat" });
});

router.post("/", chatRateLimiter, handleChatMessage);

export default router;
