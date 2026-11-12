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

export const VERIFIED_TICKET_STATUSES = ["CONFIRMED", "QUEUED", "SERVING", "USED"];

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
 * Computes an aggregate ServiceProcessingStatus from an array of service statuses.
 */
export function computeAggregateStatus(statuses) {
  if (!statuses || statuses.length === 0) return "PENDING";
  const allCompleted = statuses.every((s) => s === "COMPLETED");
  if (allCompleted) return "COMPLETED";
  const anyStarted = statuses.some((s) => s === "IN_PROGRESS" || s === "COMPLETED");
  if (anyStarted) return "IN_PROGRESS";
  return "PENDING";
}

/**
 * Formats a raw VIP ticket database record into the client-side admin contract.
 * If staffInstitutionId is provided, cross-institution privacy is enforced:
 * only services belonging to that institution are included in the response.
 */
export function formatAdminTicket(ticket, staffInstitutionId = null) {
  // Extract all related ticket-services
  let rawTicketServices = [];
  if (Array.isArray(ticket.ticket_services) && ticket.ticket_services.length > 0) {
    rawTicketServices = ticket.ticket_services;
  } else if (ticket.services) {
    rawTicketServices = [
      {
        id: `legacy-${ticket.services.id}`,
        serviceId: ticket.services.id,
        service: ticket.services,
        serviceProcessingStatus: ticket.serviceProcessingStatus || "PENDING",
        servedAt: ticket.servedAt || null,
        completedAt: ticket.completedAt || null,
        servedById: null,
        notes: null,
      },
    ];
  }

  // Filter for staff member's assigned institution if requested
  const visibleTicketServices = staffInstitutionId
    ? rawTicketServices.filter((ts) => ts.service?.providerId === staffInstitutionId)
    : rawTicketServices;

  const formattedServices = visibleTicketServices.map((ts) => {
    const s = ts.service || {};
    let name = s.id || "Unknown Service";
    if (s.title) {
      if (typeof s.title === "string") {
        name = s.title;
      } else if (typeof s.title === "object") {
        name = s.title.en || s.title.am || s.title.sid || Object.values(s.title)[0] || s.id;
      }
    }
    return {
      id: s.id,
      ticketServiceId: ts.id,
      name,
      estimatedFee: s.estimatedFee ?? null,
      processingDays: s.processingDays ?? null,
      status: serializeStatus(ts.serviceProcessingStatus || ticket.serviceProcessingStatus || "PENDING"),
      servedAt: ts.servedAt instanceof Date ? ts.servedAt.toISOString() : ts.servedAt || null,
      completedAt: ts.completedAt instanceof Date ? ts.completedAt.toISOString() : ts.completedAt || null,
      servedById: ts.servedById || null,
      notes: ts.notes || null,
      provider: s.provider
        ? {
            id: s.provider.id,
            code: s.provider.code,
            name: typeof s.provider.name === "object" ? s.provider.name.en || Object.values(s.provider.name)[0] : s.provider.name,
          }
        : null,
    };
  });

  // Determine effective status for this view:
  // For Staff: Status of their institution's specific service(s)
  // For SuperAdmin: Overall ticket status
  let effectiveDbStatus = ticket.serviceProcessingStatus;
  if (staffInstitutionId && visibleTicketServices.length > 0) {
    const instStatuses = visibleTicketServices.map((ts) => ts.serviceProcessingStatus || "PENDING");
    effectiveDbStatus = computeAggregateStatus(instStatuses);
  }

  // Joined service label for quick dashboard display
  const serviceLabel = formattedServices.length > 0
    ? formattedServices.map((s) => s.name).join(", ")
    : ticket.purpose || "VIP Service";

  // Filter history if staffInstitutionId is present
  const historyList = Array.isArray(ticket.status_history)
    ? ticket.status_history
        .filter((h) => {
          if (!staffInstitutionId) return true;
          // Include history if it matches one of this institution's services or is generic
          if (!h.serviceId) return true;
          return visibleTicketServices.some((ts) => ts.serviceId === h.serviceId);
        })
        .map((h) => ({
          id: h.id,
          serviceId: h.serviceId || null,
          previousStatus: serializeStatus(h.previousStatus),
          newStatus: serializeStatus(h.newStatus),
          changedById: h.changedById,
          changedByName: h.changedByName,
          notes: h.notes || null,
          createdAt: h.createdAt instanceof Date ? h.createdAt.toISOString() : h.createdAt,
        }))
    : undefined;

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
    ticketStatus: ticket.status, // Existing queue/payment status ('CONFIRMED', 'PENDING', etc.)
    status: serializeStatus(effectiveDbStatus), // Staff processing status ('pending' | 'in-progress' | 'completed')
    overallStatus: serializeStatus(ticket.serviceProcessingStatus),
    institutionId: staffInstitutionId || null,
    issuedAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
    updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : ticket.updatedAt,
    queueNumber: ticket.queueNumber || null,
    queueDisplay: ticket.queueNumber ? `VIP-${String(ticket.queueNumber).padStart(3, "0")}` : null,
    history: historyList,
  };
}

/**
 * GET /api/admin/vip-tickets
 *
 * Dedicated admin list endpoint for Staff, Operator, and Super Admin.
 * - STAFF: Strict tenant isolation (only see orders containing services for their institution).
 *   By default, only verified/confirmed orders are returned to staff desks.
 * - SUPER_ADMIN: Global visibility with optional ?institutionId filter.
 */
export async function listAdminVipTickets(req, res) {
  try {
    const { page = 1, limit = 25, status, institutionId: queryInstitutionId, ticketStatus, includeUnconfirmed } = req.query;
    const currentUser = req.user;

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

    // Parse status filter if requested
    let targetDbStatus = null;
    if (status && status !== "all") {
      targetDbStatus = parseStatus(status);
      if (!targetDbStatus) {
        return res.status(400).json({
          error: `Invalid status query parameter '${status}'. Allowed values are: 'pending', 'in-progress', 'completed'.`,
        });
      }
    }

    const isStaff = currentUser.role === "STAFF";
    let effectiveInstitutionId = null;

    if (isStaff) {
      if (!currentUser.institutionId) {
        return res.status(403).json({
          error: "Access denied. Staff account is not associated with any institution. Contact system administrator.",
        });
      }
      effectiveInstitutionId = currentUser.institutionId;
    } else if (currentUser.role === "SUPER_ADMIN" && queryInstitutionId) {
      effectiveInstitutionId = queryInstitutionId.trim();
    }

    // ─── Build Where Clause ──────────────────────────────────────────────────
    const where = {};

    // 1. Institution Isolation Clause
    if (effectiveInstitutionId) {
      if (targetDbStatus) {
        // Find tickets that have a service for this institution in the target status
        where.ticket_services = {
          some: {
            service: { providerId: effectiveInstitutionId },
            serviceProcessingStatus: targetDbStatus,
          },
        };
      } else {
        // Find all tickets containing services for this institution
        where.ticket_services = {
          some: {
            service: { providerId: effectiveInstitutionId },
          },
        };
      }
    } else if (targetDbStatus) {
      where.serviceProcessingStatus = targetDbStatus;
    }

    // 2. Verified VIP Orders Filter
    // For staff: by default, show verified/paid tickets unless explicitly requested otherwise
    const shouldFilterVerified = isStaff && includeUnconfirmed !== "true" && (!ticketStatus || ticketStatus === "verified");
    if (shouldFilterVerified) {
      where.status = { in: VERIFIED_TICKET_STATUSES };
    } else if (ticketStatus && ticketStatus !== "all") {
      where.status = ticketStatus.toUpperCase();
    }

    // Run queries concurrently: tickets and total count
    const [tickets, totalCount] = await Promise.all([
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
    ]);

    // Compute Status Counts
    const statusCounts = {
      pending: 0,
      "in-progress": 0,
      completed: 0,
    };

    if (effectiveInstitutionId) {
      // For institution desk: count statuses of this institution's service orders
      const countWhere = {
        service: { providerId: effectiveInstitutionId },
      };
      if (shouldFilterVerified) {
        countWhere.ticket = { status: { in: VERIFIED_TICKET_STATUSES } };
      }

      const countsGroup = await prisma.vip_ticket_services.groupBy({
        by: ["serviceProcessingStatus"],
        where: countWhere,
        _count: { id: true },
      });

      for (const group of countsGroup) {
        const clientKey = STATUS_DB_TO_CLIENT[group.serviceProcessingStatus];
        if (clientKey) {
          statusCounts[clientKey] = group._count.id;
        }
      }
    } else {
      // Global counts for Super Admin
      const statusGroupCounts = await prisma.vip_tickets.groupBy({
        by: ["serviceProcessingStatus"],
        _count: { id: true },
      });
      for (const group of statusGroupCounts) {
        const clientKey = STATUS_DB_TO_CLIENT[group.serviceProcessingStatus];
        if (clientKey) {
          statusCounts[clientKey] = group._count.id;
        }
      }
    }

    // Format data with tenant privacy
    const formattedData = tickets.map((t) => formatAdminTicket(t, isStaff ? effectiveInstitutionId : null));

    return res.status(200).json({
      data: formattedData,
      meta: {
        total: totalCount,
        page: parsedPage,
        limit: safeLimit,
        totalPages: Math.ceil(totalCount / safeLimit),
        statusCounts,
        institutionId: effectiveInstitutionId,
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
 * PATCH /api/admin/vip-tickets/:id/services/:serviceId/status
 *
 * Updates the service-processing status of an institution's VIP service order.
 * - STAFF: Can only update services belonging to their assigned institution.
 *   Allowed forward transitions: PENDING -> IN_PROGRESS -> COMPLETED.
 * - SUPER_ADMIN: Can update any institution's service, with corrective override.
 * - OPERATOR: Disallowed from updating service processing status (403).
 */
export async function updateVipTicketServiceStatus(req, res) {
  try {
    const { id, serviceId: paramServiceId } = req.params;
    const { status, serviceId: bodyServiceId, notes } = req.body || {};
    const currentUser = req.user;
    const requestedServiceId = paramServiceId || bodyServiceId;

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

    const isStaff = currentUser.role === "STAFF";
    if (isStaff && !currentUser.institutionId) {
      return res.status(403).json({
        error: "Access denied. Staff account is not associated with any institution.",
      });
    }

    // Look up ticket with join relations
    const ticket = await prisma.vip_tickets.findUnique({
      where: { id: id.trim() },
      include: getAdminTicketIncludes(),
    });

    if (!ticket) {
      return res.status(404).json({
        error: `VIP ticket with ID '${id}' was not found.`,
      });
    }

    const allTicketServices = ticket.ticket_services || [];

    // ─── Institution Authorization Check ────────────────────────────────────
    let targetTicketServices = [];

    if (isStaff) {
      // Staff can ONLY operate on services belonging to their institution
      const instServices = allTicketServices.filter((ts) => ts.service?.providerId === currentUser.institutionId);

      if (instServices.length === 0) {
        return res.status(403).json({
          error: "Access denied: You are only authorized to manage VIP orders for your assigned institution.",
        });
      }

      if (requestedServiceId) {
        targetTicketServices = instServices.filter((ts) => ts.serviceId === requestedServiceId.trim());
        if (targetTicketServices.length === 0) {
          return res.status(403).json({
            error: "Access denied: The specified service does not belong to your assigned institution.",
          });
        }
      } else {
        targetTicketServices = instServices;
      }
    } else {
      // Super Admin: target specific service if requested, or all
      if (requestedServiceId) {
        targetTicketServices = allTicketServices.filter((ts) => ts.serviceId === requestedServiceId.trim());
        if (targetTicketServices.length === 0) {
          return res.status(404).json({
            error: `Service '${requestedServiceId}' not found on this VIP ticket.`,
          });
        }
      } else {
        targetTicketServices = allTicketServices;
      }
    }

    // ─── Transition Validation ──────────────────────────────────────────────
    // For STAFF: Check that transition is valid forward progression
    for (const ts of targetTicketServices) {
      const currentDbStatus = ts.serviceProcessingStatus || "PENDING";
      if (isStaff) {
        if (currentDbStatus === targetDbStatus) {
          // Idempotent: nothing to change for this service
          continue;
        }

        const isValidTransition =
          (currentDbStatus === "PENDING" && targetDbStatus === "IN_PROGRESS") ||
          (currentDbStatus === "IN_PROGRESS" && targetDbStatus === "COMPLETED");

        if (!isValidTransition) {
          return res.status(400).json({
            error: `Invalid status transition from '${serializeStatus(currentDbStatus)}' to '${serializeStatus(targetDbStatus)}'. Staff can only advance status forward: 'pending' -> 'in-progress' -> 'completed'.`,
          });
        }
      }
    }

    // If all target services already in target status, return 200 idempotently
    const allAlreadyTarget = targetTicketServices.every((ts) => ts.serviceProcessingStatus === targetDbStatus);
    if (allAlreadyTarget) {
      return res.status(200).json({
        success: true,
        message: `Service(s) already in '${serializeStatus(targetDbStatus)}' status.`,
        data: formatAdminTicket(ticket, isStaff ? currentUser.institutionId : null),
      });
    }

    // ─── Execute Atomic Updates in Transaction ───────────────────────────────
    const now = new Date();
    const trimmedNotes = typeof notes === "string" && notes.trim() ? notes.trim() : null;
    let lastHistoryRecord = null;

    await prisma.$transaction(async (tx) => {
      // 1. Update each target ticket_services row
      for (const ts of targetTicketServices) {
        const prevStatus = ts.serviceProcessingStatus || "PENDING";
        if (prevStatus === targetDbStatus) continue;

        const updateData = {
          serviceProcessingStatus: targetDbStatus,
          servedById: currentUser.id,
          notes: trimmedNotes,
        };

        if (targetDbStatus === "IN_PROGRESS" && !ts.servedAt) {
          updateData.servedAt = now;
        }
        if (targetDbStatus === "COMPLETED") {
          updateData.completedAt = now;
        }

        await tx.vip_ticket_services.update({
          where: { id: ts.id },
          data: updateData,
        });

        // Insert audit log for this service
        lastHistoryRecord = await tx.vip_ticket_status_history.create({
          data: {
            id: crypto.randomUUID(),
            ticketId: ticket.id,
            serviceId: ts.serviceId,
            previousStatus: prevStatus,
            newStatus: targetDbStatus,
            changedById: currentUser.id,
            changedByName: currentUser.name,
            notes: trimmedNotes,
            createdAt: now,
          },
        });
      }

      // 2. Re-compute overall ticket serviceProcessingStatus
      const refreshedTicketServices = await tx.vip_ticket_services.findMany({
        where: { ticketId: ticket.id },
      });

      const allStatuses = refreshedTicketServices.map((r) => r.serviceProcessingStatus);
      const aggregateStatus = computeAggregateStatus(allStatuses);

      const ticketUpdateData = {
        serviceProcessingStatus: aggregateStatus,
        updatedAt: now,
      };
      if (aggregateStatus === "IN_PROGRESS" && !ticket.servedAt) {
        ticketUpdateData.servedAt = now;
      }
      if (aggregateStatus === "COMPLETED") {
        ticketUpdateData.completedAt = now;
      }

      await tx.vip_tickets.update({
        where: { id: ticket.id },
        data: ticketUpdateData,
      });
    });

    // Fetch refreshed ticket
    const updatedTicket = await prisma.vip_tickets.findUnique({
      where: { id: ticket.id },
      include: getAdminTicketIncludes(),
    });

    return res.status(200).json({
      success: true,
      message: `VIP order service status updated to '${serializeStatus(targetDbStatus)}'.`,
      data: formatAdminTicket(updatedTicket, isStaff ? currentUser.institutionId : null),
      history: lastHistoryRecord
        ? {
            id: lastHistoryRecord.id,
            previousStatus: serializeStatus(lastHistoryRecord.previousStatus),
            newStatus: serializeStatus(lastHistoryRecord.newStatus),
            changedBy: lastHistoryRecord.changedByName,
            notes: lastHistoryRecord.notes,
            createdAt: lastHistoryRecord.createdAt.toISOString(),
          }
        : undefined,
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
 * Retrieves a single VIP ticket with unmasked details and audit history.
 * Enforces institution boundary: STAFF cannot view tickets that don't belong to their institution.
 */
export async function getAdminVipTicketById(req, res) {
  try {
    const { id } = req.params;
    const currentUser = req.user;

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

    const isStaff = currentUser.role === "STAFF";
    if (isStaff) {
      if (!currentUser.institutionId) {
        return res.status(403).json({
          error: "Access denied. Staff account is not associated with an institution.",
        });
      }

      const hasMatchingService = (ticket.ticket_services || []).some(
        (ts) => ts.service?.providerId === currentUser.institutionId
      );

      if (!hasMatchingService) {
        return res.status(403).json({
          error: "Access denied: You are not authorized to view VIP orders from other institutions.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: formatAdminTicket(ticket, isStaff ? currentUser.institutionId : null),
    });
  } catch (error) {
    console.error("[admin-vip-tickets] getAdminVipTicketById error:", error);
    return res.status(500).json({
      error: "Failed to retrieve VIP ticket details.",
    });
  }
}
