import express from "express";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", module: "chat" });
});

export default router;
