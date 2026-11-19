import express from "express";
import {
  listResetRequests,
  approveResetRequest,
  rejectResetRequest,
  deleteResetRequest,
} from "./reset-requests.controller.js";
import { authenticateAdmin, requireRole } from "../../middleware/auth.js";

const router = express.Router();

// All reset request management endpoints require active SUPER_ADMIN role
router.use(authenticateAdmin, requireRole("SUPER_ADMIN"));

router.get("/", listResetRequests);
router.patch("/:id/approve", approveResetRequest);
router.patch("/:id/reject", rejectResetRequest);
router.delete("/:id", deleteResetRequest);

export default router;
