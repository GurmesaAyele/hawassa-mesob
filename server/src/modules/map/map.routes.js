import express from "express";
import {
  getMapLocation,
  updateMapLocation,
  getContactInfo,
  submitContactMessage,
  listContactMessages,
  updateContactMessageReviewStatus,
} from "./map.controller.js";
import { authenticateAdmin, requireRole } from "../../middleware/auth.js";

const router = express.Router();

// ─── Public Map & Location Query ──────────────────────────────────────────────
// GET /api/map - Complete map and headquarters info
router.get("/", getMapLocation);

// ─── Protected Site Settings Updates (SUPER_ADMIN and OPERATOR) ───────────────
// PUT & POST /api/map (and /api/location) - Update map and contact settings
router.put(
  "/",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  updateMapLocation
);
router.post(
  "/",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "OPERATOR"),
  updateMapLocation
);

export default router;

// ─── Dedicated Contact Router for /api/contact ────────────────────────────────
export const contactRouter = express.Router();

// Public contact information
contactRouter.get("/", getContactInfo);

// Public citizen contact form submissions
contactRouter.post("/", submitContactMessage);
contactRouter.post("/submit", submitContactMessage);

// Protected citizen contact message inbox (STRICTLY RESTRICTED TO SUPER_ADMIN)
contactRouter.get(
  "/messages",
  authenticateAdmin,
  requireRole("SUPER_ADMIN"),
  listContactMessages
);

contactRouter.patch(
  "/messages/:id",
  authenticateAdmin,
  requireRole("SUPER_ADMIN"),
  updateContactMessageReviewStatus
);
