import prisma from "../../config/db.js";
import crypto from "crypto";

// Allowed service-processing status transitions
const STATUS_DB_TO_CLIENT = {
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
};

const STATUS_CLIENT_TO_DB = {
  pending: "PENDING",
  "in-progress": "IN_PROGRESS",
  inprogress: "IN_PROGRESS",
  completed: "COMPLETED",
};

export function serializeStatus(status) {
  if (!status) return null;
  return STATUS_DB_TO_CLIENT[status] || status.toLowerCase();
}

export function parseStatus(statusStr) {
  if (!statusStr || typeof statusStr !== "string") return null;
  const normalized = statusStr.trim().toLowerCase();
  return STATUS_CLIENT_TO_DB[normalized] || null;
}

/**
 * Standard Prisma include clause for admin VIP ticket queries
 */
export function getAdminTicketIncludes() {
  return {
    services: {
      include: {
        provider: {
          select: {
            id: true,
            code: true,
            name: true,
            icon: true,
            floorRoomNumber: true,
          },
        },
      },
    },
    ticket_services: {
      include: {
        service: {
          include: {
            provider: {
              select: {
                id: true,
                code: true,
                name: true,
                icon: true,
                floorRoomNumber: true,
              },
            },
          },
        },
      },
    },
    status_history: {
      orderBy: { createdAt: "desc" },
      take: 20,
    },
  };
}

/**
 * Formats a raw VIP ticket database record into the client-side admin contract.
 */
export function formatAdminTicket(ticket) {
  // Extract all related services
  let services = [];
  if (Array.isArray(ticket.ticket_services) && ticket.ticket_services.length > 0) {
    services = ticket.ticket_services
      .map((ts) => ts.service)
      .filter(Boolean);
  } else if (ticket.services) {
    services = [ticket.services];
  }

  const formattedServices = services.map((s) => {
    let name = s.id;
    if (s.title) {
      if (typeof s.title === "string") {
        name = s.title;
      } else if (typeof s.title === "object") {
        name = s.title.en || s.title.am || s.title.sid || Object.values(s.title)[0] || s.id;
      }
    }
    return {
      id: s.id,
      name,
      estimatedFee: s.estimatedFee ?? null,
      processingDays: s.processingDays ?? null,
      provider: s.provider
        ? {
            id: s.provider.id,
            code: s.provider.code,
            name: typeof s.provider.name === "object" ? s.provider.name.en || Object.values(s.provider.name)[0] : s.provider.name,
          }
        : null,
    };
  });

  // Joined service label for quick dashboard display
  const serviceLabel = formattedServices.length > 0
    ? formattedServices.map((s) => s.name).join(", ")
    : ticket.purpose || "VIP Service";

  return {
    id: ticket.id,
    reference: ticket.ticketCode,
    person: ticket.citizenName,
    phone: ticket.citizenPhone,
    email: ticket.email || null,
    service: serviceLabel,
    services: formattedServices,
    purpose: ticket.purpose || null,
    vipFee: ticket.vipFee,
    currency: ticket.currency,
    ticketStatus: ticket.status, // Existing queue/payment status
    status: serializeStatus(ticket.serviceProcessingStatus), // Staff processing status ('pending' | 'in-progress' | 'completed')
    issuedAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
    updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : ticket.updatedAt,
    queueNumber: ticket.queueNumber || null,
    queueDisplay: ticket.queueNumber ? `VIP-${String(ticket.queueNumber).padStart(3, "0")}` : null,
    history: Array.isArray(ticket.status_history)
      ? ticket.status_history.map((h) => ({
          id: h.id,
          previousStatus: serializeStatus(h.previousStatus),
          newStatus: serializeStatus(h.newStatus),
          changedById: h.changedById,
          changedByName: h.changedByName,
          notes: h.notes || null,
          createdAt: h.createdAt instanceof Date ? h.createdAt.toISOString() : h.createdAt,
        }))
      : undefined,
  };
}

/**
 * GET /api/admin/vip-tickets
 *
 * Dedicated admin list endpoint for Staff, Operator, and Super Admin.
 * Supports pagination, status filtering, and returns global status counts.
 */
export async function listAdminVipTickets(req, res) {
  try {
    const { page = 1, limit = 25, status } = req.query;

    // Validate page
    const parsedPage = parseInt(page, 10);
    if (isNaN(parsedPage) || parsedPage < 1) {
      return res.status(400).json({
        error: "Validation failed: 'page' must be a positive integer greater than or equal to 1.",
      });
    }

    // Validate limit (capped at 100)
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({
        error: "Validation failed: 'limit' must be a positive integer between 1 and 100.",
      });
    }
    const safeLimit = Math.min(parsedLimit, 100);
    const skip = (parsedPage - 1) * safeLimit;

    // Build filter clause
    const where = {};
    if (status) {
      const dbStatus = parseStatus(status);
      if (!dbStatus) {
        return res.status(400).json({
          error: `Invalid status query parameter '${status}'. Allowed values are: 'pending', 'in-progress', 'completed'.`,
        });
      }
      where.serviceProcessingStatus = dbStatus;
    }

    // Run queries concurrently: tickets, filtered count, and global status counts
    const [tickets, totalCount, statusGroupCounts] = await Promise.all([
      prisma.vip_tickets.findMany({
        where,
        take: safeLimit,
        skip,
        orderBy: [
          { createdAt: "desc" },
          { id: "desc" },
        ],
        include: getAdminTicketIncludes(),
      }),
      prisma.vip_tickets.count({ where }),
      prisma.vip_tickets.groupBy({
        by: ["serviceProcessingStatus"],
        _count: { id: true },
      }),
    ]);

    // Format global status counts for UI badge pills
    const statusCounts = {
      pending: 0,
      "in-progress": 0,
      completed: 0,
    };

    for (const group of statusGroupCounts) {
      const clientKey = STATUS_DB_TO_CLIENT[group.serviceProcessingStatus];
      if (clientKey) {
        statusCounts[clientKey] = group._count.id;
      }
    }

    const formattedData = tickets.map((t) => formatAdminTicket(t));

    return res.status(200).json({
      data: formattedData,
      meta: {
        total: totalCount,
        page: parsedPage,
        limit: safeLimit,
        totalPages: Math.ceil(totalCount / safeLimit),
        statusCounts,
      },
    });
  } catch (error) {
    console.error("[admin-vip-tickets] listAdminVipTickets error:", error);
    return res.status(500).json({
      error: "Failed to retrieve VIP tickets list. Please try again later.",
    });
  }
}

/**
 * PATCH /api/admin/vip-tickets/:id/service-status
 *
 * Updates the service-processing status of a VIP ticket with role enforcement and audit trail.
 * - STAFF: Allowed forward transitions PENDING -> IN_PROGRESS -> COMPLETED.
 * - SUPER_ADMIN: Allowed all transitions, including corrective rollbacks.
 * - OPERATOR: Disallowed from updating service processing status.
 */
export async function updateVipTicketServiceStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body || {};
    const currentUser = req.user;

    if (!id || typeof id !== "string" || !id.trim()) {
      return res.status(400).json({
        error: "Validation failed: Ticket ID is required in URL path.",
      });
    }

    // Role check: Only SUPER_ADMIN and STAFF may change service processing status
    if (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF") {
      return res.status(403).json({
        error: "Access denied. Only STAFF and SUPER_ADMIN roles are authorized to change service-processing status.",
      });
    }

    // Validate requested status
    if (!status || typeof status !== "string" || !status.trim()) {
      return res.status(400).json({
        error: "Validation failed: 'status' is required. Allowed values are: 'pending', 'in-progress', 'completed'.",
      });
    }

    const targetDbStatus = parseStatus(status);
    if (!targetDbStatus) {
      return res.status(400).json({
        error: `Invalid status '${status}'. Allowed values are: 'pending', 'in-progress', 'completed'.`,
      });
    }

    // Look up ticket
    const ticket = await prisma.vip_tickets.findUnique({
      where: { id: id.trim() },
      include: getAdminTicketIncludes(),
    });

    if (!ticket) {
      return res.status(404).json({
        error: `VIP ticket with ID '${id}' was not found.`,
      });
    }

    const currentDbStatus = ticket.serviceProcessingStatus;

    // ─── Idempotency Check ──────────────────────────────────────────────────
    // If ticket is already in the target status, return 200 without duplicate audit row
    if (currentDbStatus === targetDbStatus) {
      return res.status(200).json({
        success: true,
        message: `Ticket is already in '${serializeStatus(targetDbStatus)}' status.`,
        data: formatAdminTicket(ticket),
      });
    }

    // ─── Transition Validation ──────────────────────────────────────────────
    // STAFF can only progress forward: PENDING -> IN_PROGRESS -> COMPLETED
    if (currentUser.role === "STAFF") {
      const isValidTransition =
        (currentDbStatus === "PENDING" && targetDbStatus === "IN_PROGRESS") ||
        (currentDbStatus === "IN_PROGRESS" && targetDbStatus === "COMPLETED");

      if (!isValidTransition) {
        return res.status(400).json({
          error: `Invalid status transition from '${serializeStatus(currentDbStatus)}' to '${serializeStatus(targetDbStatus)}'. Staff can only advance status forward: 'pending' -> 'in-progress' -> 'completed'.`,
        });
      }
    }
    // SUPER_ADMIN can perform any transition (e.g., reset back to pending or in-progress)

    // ─── Atomic Database Transaction ────────────────────────────────────────
    const now = new Date();
    const historyId = crypto.randomUUID();
    const trimmedNotes = typeof notes === "string" && notes.trim() ? notes.trim() : null;

    const [updatedTicket, historyRecord] = await prisma.$transaction([
      prisma.vip_tickets.update({
        where: { id: ticket.id },
        data: {
          serviceProcessingStatus: targetDbStatus,
          updatedAt: now,
        },
        include: getAdminTicketIncludes(),
      }),
      prisma.vip_ticket_status_history.create({
        data: {
          id: historyId,
          ticketId: ticket.id,
          previousStatus: currentDbStatus,
          newStatus: targetDbStatus,
          changedById: currentUser.id,
          changedByName: currentUser.name,
          notes: trimmedNotes,
          createdAt: now,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: `VIP ticket service-processing status updated from '${serializeStatus(currentDbStatus)}' to '${serializeStatus(targetDbStatus)}'.`,
      data: formatAdminTicket(updatedTicket),
      history: {
        id: historyRecord.id,
        previousStatus: serializeStatus(historyRecord.previousStatus),
        newStatus: serializeStatus(historyRecord.newStatus),
        changedBy: historyRecord.changedByName,
        notes: historyRecord.notes,
        createdAt: historyRecord.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[admin-vip-tickets] updateVipTicketServiceStatus error:", error);
    return res.status(500).json({
      error: "Failed to update VIP ticket service status. Please try again later.",
    });
  }
}

/**
 * GET /api/admin/vip-tickets/:id
 *
 * Retrieves a single VIP ticket with unmasked details, joined services, and audit trail.
 */
export async function getAdminVipTicketById(req, res) {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !id.trim()) {
      return res.status(400).json({
        error: "Validation failed: Ticket ID is required in URL path.",
      });
    }

    const ticket = await prisma.vip_tickets.findUnique({
      where: { id: id.trim() },
      include: getAdminTicketIncludes(),
    });

    if (!ticket) {
      return res.status(404).json({
        error: `VIP ticket with ID '${id}' was not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: formatAdminTicket(ticket),
    });
  } catch (error) {
    console.error("[admin-vip-tickets] getAdminVipTicketById error:", error);
    return res.status(500).json({
      error: "Failed to retrieve VIP ticket details.",
    });
  }
}

