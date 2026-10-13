import express from "express";
import { handleChatMessage } from "./chat.controller.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", module: "chat" });
});

router.post("/", handleChatMessage);

export default router;
