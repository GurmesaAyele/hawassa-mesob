import express from "express";
import {
  listInstitutions,
  getInstitution,
  listInstitutionServices,
  listAllServices,
  getService,
} from "../institutions/institutions.controller.js";

const router = express.Router();

// ─── Institutions ─────────────────────────────────────────────────────────────
// GET /api/institutions
router.get("/", listInstitutions);

// GET /api/institutions/:id
router.get("/:id", getInstitution);

// GET /api/institutions/:id/services
router.get("/:id/services", listInstitutionServices);

// ─── Global Services (flat list) ─────────────────────────────────────────────
// These are mounted at /api/services in app.js, not here.
// Exported separately so app.js can attach them to the right prefix.
export { listAllServices, getService };

export default router;
