import express from "express";
import { authenticateAdmin, requireRole } from "../../middleware/auth.js";
import {
  createStaffMember,
  listStaffMembers,
  getStaffMemberById,
  updateStaffMember,
  deleteStaffMember,
} from "./staff.controller.js";

const router = express.Router();

// Enforce that all staff management routes require active SUPER_ADMIN
router.use(authenticateAdmin, requireRole("SUPER_ADMIN"));

router.post("/", createStaffMember);
router.get("/", listStaffMembers);
router.get("/:id", getStaffMemberById);
router.patch("/:id", updateStaffMember);
router.put("/:id", updateStaffMember);
router.delete("/:id", deleteStaffMember);

export default router;

