import express from "express";
import {
  listVideos,
  getVideo,
  createVideo,
  updateVideo,
  deleteVideo,
} from "./videos.controller.js";
import { authenticateAdmin, requireRole } from "../../middleware/auth.js";

const router = express.Router();

// ─── Public Video Routes ──────────────────────────────────────────────────────
// GET /api/videos - List all videos
router.get("/", listVideos);

// GET /api/videos/:id - Single video by ID
router.get("/:id", getVideo);

// ─── Protected Admin Video Routes (SUPER_ADMIN and OPERATOR) ──────────────────
// POST /api/videos - Create a new video entry
router.post(
  "/",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  createVideo
);

// PUT /api/videos/:id - Update video entry
router.put(
  "/:id",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  updateVideo
);

// DELETE /api/videos/:id - Delete video by ID
router.delete(
  "/:id",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  deleteVideo
);

export default router;
