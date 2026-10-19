import express from "express";
import {
  listAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  deleteAnnouncement,
} from "./announcements.controller.js";

const router = express.Router();

// GET /api/announcements - List announcements
router.get("/", listAnnouncements);

// GET /api/announcements/:id - Single announcement
router.get("/:id", getAnnouncementById);

// POST /api/announcements - Create announcement
router.post("/", createAnnouncement);

// DELETE /api/announcements/:id - Delete announcement
router.delete("/:id", deleteAnnouncement);

export default router;
