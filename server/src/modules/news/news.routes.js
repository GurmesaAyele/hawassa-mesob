import express from "express";
import {
  listNews,
  getNewsById,
  createNews,
  deleteNews,
} from "./news.controller.js";

const router = express.Router();

// GET /api/news - List news articles
router.get("/", listNews);

// GET /api/news/:id - Single news article
router.get("/:id", getNewsById);

// POST /api/news - Create news article
router.post("/", createNews);

// DELETE /api/news/:id - Delete news article
router.delete("/:id", deleteNews);

export default router;
