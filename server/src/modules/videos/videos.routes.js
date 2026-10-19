import express from "express";
import {
  listVideos,
  getVideo,
  createVideo,
  deleteVideo,
} from "./videos.controller.js";

const router = express.Router();

// GET /api/videos - List all videos
router.get("/", listVideos);

// GET /api/videos/:id - Single video by ID
router.get("/:id", getVideo);

// POST /api/videos - Create a new video entry
router.post("/", createVideo);

// DELETE /api/videos/:id - Delete video by ID
router.delete("/:id", deleteVideo);

export default router;
