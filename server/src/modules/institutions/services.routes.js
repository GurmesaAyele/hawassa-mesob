import express from "express";
import {
  listAllServices,
  getService,
  createService,
  updateService,
  deleteService,
} from "./institutions.controller.js";
import { authenticateAdmin, requireRole } from "../../middleware/auth.js";

const router = express.Router();

// ─── Public Service Routes ───────────────────────────────────────────────────
// GET /api/services - Flat list of services across all institutions
router.get("/", listAllServices);

// GET /api/services/:id - Get single service with parent institution
router.get("/:id", getService);

// ─── Protected Admin Service Routes (SUPER_ADMIN and OPERATOR) ────────────────
// POST /api/services - Create service (requires providerId in body)
router.post(
  "/",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  createService
);

// PUT & PATCH /api/services/:id - Update service details
router.put(
  "/:id",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  updateService
);
router.patch(
  "/:id",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  updateService
);

// DELETE /api/services/:id - Delete or deactivate service (?permanent=true for hard delete)
router.delete(
  "/:id",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  deleteService
);

export default router;
