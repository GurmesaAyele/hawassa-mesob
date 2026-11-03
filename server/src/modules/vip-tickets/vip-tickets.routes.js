import express from "express";
import {
  submitVipApplication,
  trackVipApplication,
  trackRateLimiter,
  getVipTicketById,
  getVipTicketByReference,
  listVipTickets,
} from "./vip-tickets.controller.js";
import {
  checkQueueAvailability,
  getQueueStatus,
  reserveCapacity,
  releaseCapacity,
  enqueueVipTicket,
  getQueuePosition,
} from "./vip-queue.controller.js";

const router = express.Router();

// ─── Static VIP Queue Endpoints (Registered before dynamic /:id) ──────────────

// GET /api/vip-tickets/queue/availability - Check if VIP queue can accept new customers
router.get("/queue/availability", checkQueueAvailability);

// GET /api/vip-tickets/queue/status - Current today's VIP queue state (public / staff monitor)
router.get("/queue/status", getQueueStatus);

// POST /api/vip-tickets/reserve-capacity - Pre-payment VIP capacity reservation (body: { ticketId, reference, phone })
router.post("/reserve-capacity", reserveCapacity);

// POST /api/vip-tickets/release-capacity - Explicit release of reserved capacity (body: { ticketId, reference, phone })
router.post("/release-capacity", releaseCapacity);

// ─── VIP Ticket Applications Endpoints ────────────────────────────────────────

// POST /api/vip-tickets - Customer submits a VIP application
router.post("/", submitVipApplication);

// POST /api/vip-tickets/track - Customer tracks an existing VIP application (Registered before dynamic routes)
router.post("/track", trackRateLimiter, trackVipApplication);

// GET /api/vip-tickets - List VIP applications (supports ?status=, ?phone=, ?serviceId=)
router.get("/", listVipTickets);

// GET /api/vip-tickets/reference/:code - Lookup VIP application by reference / ticket code
router.get("/reference/:code", getVipTicketByReference);

// ─── Dynamic Ticket Queue Endpoints ───────────────────────────────────────────

// POST /api/vip-tickets/:id/reserve-capacity - Reserve VIP capacity for specific ticket ID
router.post("/:id/reserve-capacity", reserveCapacity);

// POST /api/vip-tickets/:id/release-capacity - Release VIP capacity for specific ticket ID
router.post("/:id/release-capacity", releaseCapacity);

// POST /api/vip-tickets/:id/enqueue - Enter confirmed VIP ticket into the priority walk-in queue
router.post("/:id/enqueue", enqueueVipTicket);

// GET /api/vip-tickets/:id/queue-position - Customer checks current queue position
router.get("/:id/queue-position", getQueuePosition);

// GET /api/vip-tickets/:id - Lookup VIP application by unique ID
router.get("/:id", getVipTicketById);

export default router;
