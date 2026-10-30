import express from "express";
import {
  listNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
} from "./news.controller.js";
import { authenticateAdmin, requireRole } from "../../middleware/auth.js";

const router = express.Router();

// ─── Public News Routes ───────────────────────────────────────────────────────
// GET /api/news - List news articles
router.get("/", listNews);

// GET /api/news/:id - Single news article
router.get("/:id", getNewsById);

// ─── Protected Admin News Routes (SUPER_ADMIN and OPERATOR) ───────────────────
// POST /api/news - Create news article
router.post(
  "/",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  createNews
);

// PUT /api/news/:id - Update news article
router.put(
  "/:id",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  updateNews
);

// DELETE /api/news/:id - Delete news article
router.delete(
  "/:id",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  deleteNews
);

export default router;
