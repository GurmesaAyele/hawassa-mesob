import express from "express";
import { listAllServices, getService } from "../institutions/institutions.controller.js";

const router = express.Router();

// GET /api/services
router.get("/", listAllServices);

// GET /api/services/:id
router.get("/:id", getService);

export default router;
