// src/modules/chat/chat.routes.js
const express = require("express");

const router = express.Router();

// Temporary route for scaffolding check
router.get("/health", (req, res) => {
  res.json({ status: "ok", module: "chat" });
});

module.exports = router;
