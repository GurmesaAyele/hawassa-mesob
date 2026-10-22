import express from "express";
import {
  listInstitutions,
  getInstitution,
  listInstitutionServices,
  createInstitution,
  updateInstitution,
  deleteInstitution,
  createService,
  listAllServices,
  listVipServices,
  getService,
  getVipService,
  updateService,
  deleteService,
} from "./institutions.controller.js";
import {
  getVipServiceSlots,
  getVipServiceDates,
} from "./vip-schedule.controller.js";

const router = express.Router();

// ─── Institution Routes ───────────────────────────────────────────────────────
// GET /api/institutions - List institutions
router.get("/", listInstitutions);

// POST /api/institutions - Create institution (optionally with initial services)
router.post("/", createInstitution);

// GET /api/institutions/:id - Get institution with all services
router.get("/:id", getInstitution);

// PUT & PATCH /api/institutions/:id - Update institution details
router.put("/:id", updateInstitution);
router.patch("/:id", updateInstitution);

// DELETE /api/institutions/:id - Delete / deactivate institution (?permanent=true for hard delete)
router.delete("/:id", deleteInstitution);

// ─── Nested Service Routes for Institution ────────────────────────────────────
// GET /api/institutions/:id/services - Paginated services of an institution
router.get("/:id/services", listInstitutionServices);

// POST /api/institutions/:id/services - Add one or more services to this institution
router.post("/:id/services", createService);

export {
  listAllServices,
  listVipServices,
  getService,
  getVipService,
  getVipServiceSlots,
  getVipServiceDates,
  createService,
  updateService,
  deleteService,
};

export default router;
