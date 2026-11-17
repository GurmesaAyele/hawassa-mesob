import express from "express";
import {
  listAdminVipTickets,
  updateVipTicketServiceStatus,
  getAdminVipTicketById,
} from "./admin-vip-tickets.controller.js";
import { authenticateAdmin, requireRole } from "../../middleware/auth.js";

const router = express.Router();

// ─── Protected VIP Tickets Management Endpoints for Staff & Admins ───────────

// GET /api/admin/vip-tickets - List VIP tickets with pagination, status filter, and counts
router.get(
  "/",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "STAFF"),
  listAdminVipTickets
);

// GET /api/admin/vip-tickets/:id - Get ticket details and status history
router.get(
  "/:id",
  authenticateAdmin,
  requireRole("SUPER_ADMIN", "STAFF"),
  getAdminVipTicketById
);

// PATCH /api/admin/vip-tickets/:id/service-status - Advance or correct staff processing status (Staff only)
router.patch(
  "/:id/service-status",
  authenticateAdmin,
  requireRole("STAFF"),
  updateVipTicketServiceStatus
);

// PATCH /api/admin/vip-tickets/:id/services/:serviceId/status - Per-service status update (Staff only)
router.patch(
  "/:id/services/:serviceId/status",
  authenticateAdmin,
  requireRole("STAFF"),
  updateVipTicketServiceStatus
);

// PATCH /api/admin/vip-tickets/:id/services/:serviceId/service-status - Alias for per-service status update (Staff only)
router.patch(
  "/:id/services/:serviceId/service-status",
  authenticateAdmin,
  requireRole("STAFF"),
  updateVipTicketServiceStatus
);

export default router;

