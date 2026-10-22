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

const router = express.Router();

// ─── Global Service Routes ───────────────────────────────────────────────────
// GET /api/services - Flat list of services across all institutions (includes VIP fields)
router.get("/", listAllServices);

// GET /api/services/vip - Thin VIP listing endpoint
router.get("/vip", listVipServices);

// GET /api/services/vip/:id - Thin VIP single service endpoint
router.get("/vip/:id", getVipService);

// POST /api/services - Create service (requires providerId in body)
router.post("/", createService);

// GET /api/services/:id - Get single service with parent institution
router.get("/:id", getService);

// PUT & PATCH /api/services/:id - Update service details
router.put("/:id", updateService);
router.patch("/:id", updateService);

// DELETE /api/services/:id - Delete or deactivate service (?permanent=true for hard delete)
router.delete("/:id", deleteService);

export default router;
