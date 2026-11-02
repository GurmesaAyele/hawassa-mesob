import express from "express";
import {
  listAllServices,
  listVipServices,
  getService,
  getVipService,
  createService,
  updateService,
  deleteService,
} from "./institutions.controller.js";
import {
  getVipServiceSlots,
  getVipServiceDates,
} from "./vip-schedule.controller.js";

import { authenticateAdmin, requireRole } from "../../middleware/auth.js";

const router = express.Router();


// ─── VIP Specific Catalog & Schedule Routes ───────────────────────────────────
// GET /api/services/vip - Thin VIP listing endpoint
router.get("/vip", listVipServices);

// GET /api/services/vip/:id/slots & dates - Dedicated VIP schedule routes
router.get("/vip/:id/slots", getVipServiceSlots);
router.get("/vip/:id/dates", getVipServiceDates);

// GET /api/services/vip/:id - Thin VIP single service endpoint
router.get("/vip/:id", getVipService);

// ─── Service Specific VIP Scheduling Routes ───────────────────────────────────
// GET /api/services/:id/vip-slots - Time slots with real-time capacity and remaining availability
router.get("/:id/vip-slots", getVipServiceSlots);
// GET /api/services/:id/vip-schedule - Alias for full slot schedule
router.get("/:id/vip-schedule", getVipServiceSlots);
// GET /api/services/:id/vip-dates - Available upcoming booking dates calendar
router.get("/:id/vip-dates", getVipServiceDates);


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
