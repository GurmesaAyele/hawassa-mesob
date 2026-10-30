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
import { authenticateAdmin, requireRole } from "../../middleware/auth.js";
import { handleLogoUpload } from "../../middleware/upload.js";

const router = express.Router();

// ─── Public Institution Routes ────────────────────────────────────────────────
// GET /api/institutions - List institutions
router.get("/", listInstitutions);

// GET /api/institutions/:id - Get institution with all services
router.get("/:id", getInstitution);

// GET /api/institutions/:id/services - Paginated services of an institution
router.get("/:id/services", listInstitutionServices);

// ─── Protected Admin Institution Routes (SUPER_ADMIN and OPERATOR) ────────────
// POST /api/institutions - Create institution (supports logo upload)
router.post(
  "/",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  handleLogoUpload,
  createInstitution
);

// PUT & PATCH /api/institutions/:id - Update institution details (supports logo upload)
router.put(
  "/:id",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  handleLogoUpload,
  updateInstitution
);
router.patch(
  "/:id",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  handleLogoUpload,
  updateInstitution
);

// DELETE /api/institutions/:id - Delete / deactivate institution (?permanent=true for hard delete)
router.delete(
  "/:id",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  deleteInstitution
);

// POST /api/institutions/:id/services - Add one or more services to this institution
router.post(
  "/:id/services",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  createService
);

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
