import express from "express";
import {
  submitVipApplication,
  getVipTicketById,
  getVipTicketByReference,
  listVipTickets,
} from "./vip-tickets.controller.js";

const router = express.Router();

// ─── VIP Ticket Applications Endpoints ────────────────────────────────────────

// POST /api/vip-tickets - Customer submits a VIP application
router.post("/", submitVipApplication);

// GET /api/vip-tickets - List VIP applications (supports ?status=, ?phone=, ?serviceId=)
router.get("/", listVipTickets);

// GET /api/vip-tickets/reference/:code - Lookup VIP application by reference / ticket code
router.get("/reference/:code", getVipTicketByReference);

// GET /api/vip-tickets/:id - Lookup VIP application by unique ID
router.get("/:id", getVipTicketById);

export default router;
