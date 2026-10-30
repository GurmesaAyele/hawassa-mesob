import express from "express";
import {
  listAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "./announcements.controller.js";
import { authenticateAdmin, requireRole } from "../../middleware/auth.js";

const router = express.Router();

// ─── Public Announcement Routes ───────────────────────────────────────────────
// GET /api/announcements - List announcements
router.get("/", listAnnouncements);

// GET /api/announcements/:id - Single announcement
router.get("/:id", getAnnouncementById);

// ─── Protected Admin Announcement Routes (SUPER_ADMIN and OPERATOR) ───────────
// POST /api/announcements - Create announcement
router.post(
  "/",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  createAnnouncement
);

// PUT /api/announcements/:id - Update announcement
router.put(
  "/:id",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  updateAnnouncement
);

// DELETE /api/announcements/:id - Delete announcement
router.delete(
  "/:id",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  deleteAnnouncement
);

export default router;
