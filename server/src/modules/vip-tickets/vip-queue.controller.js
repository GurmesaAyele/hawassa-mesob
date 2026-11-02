import crypto from "node:crypto";
import prisma from "../../config/db.js";
import {
  VIP_QUEUE_CONFIG,
  isQueueWithinOperatingHours,
  isTodayWorkingDay,
} from "./vip-queue.config.js";
import {
  getLocalNow,
  formatLocalDate,
} from "../institutions/vip-schedule.config.js";
import { VIP_CONFIG } from "../institutions/vip.config.js";
import {
  arePhoneNumbersMatching,
  normalizePhoneNumber,
} from "./vip-tickets.controller.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the UTC date range for "today" in Africa/Addis_Ababa timezone,
 * suitable for Prisma DateTime queries.
 */
export function getTodayDateRange() {
  const localNow = getLocalNow();
  const todayStr = formatLocalDate(localNow);
  return {
    todayStr,
    startOfDay: new Date(`${todayStr}T00:00:00.000Z`),
    endOfDay: new Date(`${todayStr}T23:59:59.999Z`),
  };
}

/**
 * Safely parses a capacity reservation payload stored in paymentRef.
 * Returns metadata and validity indicator.
 *
 * @param {string|null} paymentRef
 * @returns {{ isValid: boolean, isExpired: boolean, token?: string, reservedAt?: Date, expiresAt?: Date, date?: string }}
 */
export function parseCapacityReservation(paymentRef) {
  if (!paymentRef || typeof paymentRef !== "string") {
    return { isValid: false, isExpired: true };
  }
  try {
    const data = JSON.parse(paymentRef);
    if (data && data.type === "CAPACITY_RESERVATION" && data.expiresAt) {
      const expiresAt = new Date(data.expiresAt);
      const isExpired = expiresAt.getTime() <= Date.now();
      return {
        isValid: true,
        isExpired,
        token: data.token,
        reservedAt: new Date(data.reservedAt),
        expiresAt,
        date: data.date,
      };
    }
  } catch {
    // Normal paymentRef string (e.g. verified bank transaction reference), not a reservation JSON
  }
  return { isValid: false, isExpired: true };
}

/**
 * Authoritative, unified calculation of today's VIP queue capacity and status counts.
 *
 * Consistent definitions across all VIP endpoints:
 * - dailyCapacity: configured maximum capacity for the day.
 * - confirmedOrActiveCount: tickets in CONFIRMED, QUEUED, SERVING, or USED status for today.
 * - activeReservationsCount: tickets in PENDING status holding an active unexpired capacity reservation for today.
 * - totalCapacityConsumed: confirmedOrActiveCount + activeReservationsCount.
 * - placesRemaining: Math.max(0, dailyCapacity - totalCapacityConsumed).
 * - isCapacityAvailable: placesRemaining > 0.
 * - waitingCount: tickets in QUEUED status (physically waiting in queue).
 * - servingCount: tickets in SERVING status (currently being served).
 * - completedCount: tickets in USED status (service completed today).
 * - Completed (USED) and CANCELLED tickets are strictly excluded from waitingCount.
 *
 * @param {object} txOrPrisma - Prisma client or transaction client
 * @returns {Promise<object>}
 */
export async function getTodayCapacityMetrics(txOrPrisma = prisma) {
  const { startOfDay, endOfDay, todayStr } = getTodayDateRange();
  const now = new Date();

  // 1. Confirmed / enqueued / serving / used tickets for today
  const confirmedOrActiveCount = await txOrPrisma.vip_tickets.count({
    where: {
      OR: [
        { queueDate: { gte: startOfDay, lte: endOfDay } },
        { slotDate: { gte: startOfDay, lte: endOfDay } },
      ],
      status: { in: ["CONFIRMED", "QUEUED", "SERVING", "USED"] },
    },
  });

  // 2. Active unexpired reservations in PENDING status for today
  const pendingCandidates = await txOrPrisma.vip_tickets.findMany({
    where: {
      slotDate: { gte: startOfDay, lte: endOfDay },
      status: "PENDING",
      paymentRef: { not: null },
    },
    select: {
      id: true,
      paymentRef: true,
    },
  });

  let activeReservationsCount = 0;
  for (const candidate of pendingCandidates) {
    const resInfo = parseCapacityReservation(candidate.paymentRef);
    if (resInfo.isValid && !resInfo.isExpired) {
      activeReservationsCount++;
    }
  }

  // 3. Customers currently waiting (status QUEUED only)
  const waitingCount = await txOrPrisma.vip_tickets.count({
    where: {
      queueDate: { gte: startOfDay, lte: endOfDay },
      status: "QUEUED",
    },
  });

  // 4. Customers currently being served (status SERVING only)
  const servingCount = await txOrPrisma.vip_tickets.count({
    where: {
      queueDate: { gte: startOfDay, lte: endOfDay },
      status: "SERVING",
    },
  });

  // 5. Customers completed today (status USED only)
  const completedCount = await txOrPrisma.vip_tickets.count({
    where: {
      queueDate: { gte: startOfDay, lte: endOfDay },
      status: "USED",
    },
  });

  const totalCapacityConsumed = confirmedOrActiveCount + activeReservationsCount;
  const dailyCapacity = VIP_QUEUE_CONFIG.DAILY_VIP_CAPACITY;
  const placesRemaining = Math.max(0, dailyCapacity - totalCapacityConsumed);
  const isCapacityAvailable = placesRemaining > 0;

  return {
    todayStr,
    startOfDay,
    endOfDay,
    dailyCapacity,
    totalCapacityConsumed,
    confirmedOrActiveCount,
    activeReservationsCount,
    placesRemaining,
    isCapacityAvailable,
    waitingCount,
    servingCount,
    completedCount,
    completedToday: completedCount,
    totalQueuedToday: waitingCount + servingCount + completedCount,
  };
}

/**
 * Evaluates whether the VIP queue is currently active and progressing based on real workflow events.
 *
 * Real Event Indicators:
 * - A customer is actively being served (status: SERVING).
 * - Customers have completed service today (status: USED with completedAt timestamp).
 * - When no customers are waiting, the queue is clear.
 * - When customers are waiting but no one is serving and no one has completed, the queue is pending service start.
 *
 * @param {object} metrics - Capacity & count metrics from getTodayCapacityMetrics
 * @param {object} txOrPrisma - Prisma client or transaction client
 * @returns {Promise<object>}
 */
export async function getQueueProgressStatus(metrics, txOrPrisma = prisma) {
  const { startOfDay, endOfDay } = getTodayDateRange();

  // Find the most recent service completion today
  const lastCompleted = await txOrPrisma.vip_tickets.findFirst({
    where: {
      queueDate: { gte: startOfDay, lte: endOfDay },
      status: "USED",
    },
    orderBy: { completedAt: "desc" },
    select: {
      completedAt: true,
      queueNumber: true,
    },
  });

  // Find the currently serving ticket
  const currentlyServing = await txOrPrisma.vip_tickets.findFirst({
    where: {
      queueDate: { gte: startOfDay, lte: endOfDay },
      status: "SERVING",
    },
    orderBy: { queueNumber: "asc" },
    select: {
      queueNumber: true,
      ticketCode: true,
      servedAt: true,
    },
  });

  let isQueueProgressing = false;
  let progressStatusMessage = "";

  if (metrics.waitingCount === 0 && metrics.servingCount === 0) {
    isQueueProgressing = true;
    progressStatusMessage = "VIP queue is currently clear (no customers waiting).";
  } else if (metrics.servingCount > 0) {
    isQueueProgressing = true;
    progressStatusMessage = `VIP queue is actively progressing. Counter is currently serving ticket VIP-${String(currentlyServing.queueNumber).padStart(3, "0")}.`;
  } else if (metrics.completedCount > 0) {
    isQueueProgressing = true;
    progressStatusMessage = `VIP queue has completed ${metrics.completedCount} customer(s) today. Next ticket will be called shortly.`;
  } else {
    isQueueProgressing = false;
    progressStatusMessage = "Waiting for VIP service desk to begin serving tickets for today.";
  }

  return {
    isQueueProgressing,
    progressStatusMessage,
    currentlyServing: currentlyServing
      ? {
          queueNumber: currentlyServing.queueNumber,
          queueDisplay: `VIP-${String(currentlyServing.queueNumber).padStart(3, "0")}`,
          servedAt: currentlyServing.servedAt,
        }
      : null,
    lastCompletedAt: lastCompleted?.completedAt || null,
  };
}

/**
 * Calculates empirical waiting-time metrics strictly from recorded workflow completions today.
 *
 * Rules:
 * - Never assumes fixed 15, 30, or arbitrary duration minutes.
 * - Never derives service duration from the number of selected services in multi-service application.
 * - Requires a defensible minimum sample size (configured via VIP_QUEUE_CONFIG.MIN_COMPLETED_SAMPLES_FOR_ESTIMATE).
 * - If fewer than minimum empirical samples have completed today, returns waitingTime: null with a clear reason.
 * - When valid empirical samples exist, calculates rolling average duration from actual (completedAt - servedAt).
 *
 * @param {object} txOrPrisma - Prisma client or transaction client
 * @param {Date} startOfDay
 * @param {Date} endOfDay
 * @param {number|null} customersAhead - Number of queued customers ahead
 * @param {string|null} customerStatus - Status of the querying ticket
 * @returns {Promise<{ waitingTime: object|null, waitingTimeInfo: object }>}
 */
export async function calculateEmpiricalWaitingTime(
  txOrPrisma,
  startOfDay,
  endOfDay,
  customersAhead = null,
  customerStatus = null
) {
  // If customer is currently being served
  if (customerStatus === "SERVING") {
    const servingInfo = {
      available: false,
      estimatedMinutes: 0,
      reason: "You are currently being served at the VIP counter.",
      isBeingServed: true,
    };
    return {
      waitingTime: servingInfo,
      waitingTimeInfo: servingInfo,
    };
  }

  // If customer is not yet in the active walk-in queue
  if (customerStatus === "PENDING" || customerStatus === "CONFIRMED") {
    const notQueuedInfo = {
      available: false,
      estimatedMinutes: null,
      reason: "Waiting time can only be calculated after in-person check-in admits the customer to the active walk-in priority queue.",
    };
    return {
      waitingTime: null,
      waitingTimeInfo: notQueuedInfo,
    };
  }

  // Query completed tickets today with both servedAt and completedAt timestamps
  const completedTickets = await txOrPrisma.vip_tickets.findMany({
    where: {
      queueDate: { gte: startOfDay, lte: endOfDay },
      status: "USED",
      servedAt: { not: null },
      completedAt: { not: null },
    },
    select: {
      servedAt: true,
      completedAt: true,
    },
  });

  const validDurationsMinutes = [];
  for (const t of completedTickets) {
    const diffMs = t.completedAt.getTime() - t.servedAt.getTime();
    const minutes = diffMs / (1000 * 60);
    // Sanity filter: valid duration between 1 minute and 180 minutes
    if (minutes >= 1 && minutes <= 180) {
      validDurationsMinutes.push(minutes);
    }
  }

  const minSamples = VIP_QUEUE_CONFIG.MIN_COMPLETED_SAMPLES_FOR_ESTIMATE || 3;

  if (validDurationsMinutes.length < minSamples) {
    const reason = `Waiting time estimates are currently unavailable: insufficient recorded service completions today (${validDurationsMinutes.length}/${minSamples} required samples recorded). The center requires real completion data before providing an empirical estimate.`;
    return {
      waitingTime: null,
      waitingTimeInfo: {
        available: false,
        estimatedMinutes: null,
        reason,
        completedSamplesCount: validDurationsMinutes.length,
        requiredSamplesCount: minSamples,
      },
    };
  }

  // Calculate actual empirical average service duration from real recorded workflow
  const totalDuration = validDurationsMinutes.reduce((sum, d) => sum + d, 0);
  const averageServiceDurationMinutes = Math.round(totalDuration / validDurationsMinutes.length);

  const effectiveAhead = typeof customersAhead === "number" ? customersAhead : null;
  const estimatedMinutes = effectiveAhead !== null ? effectiveAhead * averageServiceDurationMinutes : null;

  const result = {
    available: true,
    isEstimate: true,
    estimatedMinutes,
    averageServiceDurationMinutes,
    basedOnCompletedSamples: validDurationsMinutes.length,
    customersAhead: effectiveAhead,
    disclaimer: "Empirical estimate based on actual completed service durations recorded today at Hawassa MESOB Center. Individual service durations vary; this is not an exact countdown.",
  };

  return {
    waitingTime: result,
    waitingTimeInfo: result,
  };
}

/**
 * Determines the next available sequential queue number for today.
 *
 * @param {object} tx - Prisma transaction client
 * @param {Date} startOfDay
 * @param {Date} endOfDay
 * @returns {Promise<number>}
 */
async function getNextQueueNumber(tx, startOfDay, endOfDay) {
  const result = await tx.vip_tickets.aggregate({
    where: {
      queueDate: { gte: startOfDay, lte: endOfDay },
      queueNumber: { not: null },
    },
    _max: { queueNumber: true },
  });
  return (result._max.queueNumber || 0) + 1;
}

// ─── Future Service-Completion Foundation (Internal Methods) ─────────────────

/**
 * Foundation helper for marking a VIP ticket service as started.
 * Intended for future staff counter workflows.
 * (Not exposed as a public unauthenticated route).
 *
 * @param {string} ticketIdOrCode - Unique ticket ID or ticket code
 * @param {object} [txOrPrisma=prisma] - Prisma client or transaction
 * @returns {Promise<object>}
 */
export async function startServingVipTicket(ticketIdOrCode, txOrPrisma = prisma) {
  const cleanId = ticketIdOrCode?.trim();
  const ticket = await txOrPrisma.vip_tickets.findFirst({
    where: {
      OR: [{ id: cleanId }, { ticketCode: cleanId }],
    },
  });

  if (!ticket) {
    throw new Error(`VIP ticket '${ticketIdOrCode}' not found.`);
  }

  if (ticket.status !== "QUEUED") {
    throw new Error(`Ticket must be in QUEUED status to begin service. Current status: ${ticket.status}.`);
  }

  const now = new Date();
  return txOrPrisma.vip_tickets.update({
    where: { id: ticket.id },
    data: {
      status: "SERVING",
      servedAt: now,
      updatedAt: now,
    },
  });
}

/**
 * Foundation helper for marking a VIP ticket service as completed.
 * Intended for future staff counter workflows.
 * Records completion timestamp and enables empirical waiting-time data collection.
 * (Not exposed as a public unauthenticated route).
 *
 * @param {string} ticketIdOrCode - Unique ticket ID or ticket code
 * @param {object} [txOrPrisma=prisma] - Prisma client or transaction
 * @returns {Promise<{ ticket: object, durationMinutes: number|null }>}
 */
export async function completeVipService(ticketIdOrCode, txOrPrisma = prisma) {
  const cleanId = ticketIdOrCode?.trim();
  const ticket = await txOrPrisma.vip_tickets.findFirst({
    where: {
      OR: [{ id: cleanId }, { ticketCode: cleanId }],
    },
  });

  if (!ticket) {
    throw new Error(`VIP ticket '${ticketIdOrCode}' not found.`);
  }

  if (ticket.status !== "SERVING" && ticket.status !== "QUEUED") {
    throw new Error(`Ticket cannot be completed from status '${ticket.status}'. Must be SERVING or QUEUED.`);
  }

  const now = new Date();
  const servedAt = ticket.servedAt || now;
  const durationMs = now.getTime() - servedAt.getTime();
  const durationMinutes = Math.max(1, Math.round(durationMs / (1000 * 60)));

  const updated = await txOrPrisma.vip_tickets.update({
    where: { id: ticket.id },
    data: {
      status: "USED",
      completedAt: now,
      servedAt: ticket.servedAt || now,
      updatedAt: now,
    },
  });

  return {
    ticket: updated,
    durationMinutes,
  };
}

// ─── Public Controllers ───────────────────────────────────────────────────────

/**
 * GET /api/vip-tickets/queue/availability
 *
 * Customer-visible queue information before payment:
 * - Whether VIP service is currently accepting customers
 * - Number of customers currently waiting (status: QUEUED)
 * - Number of customers currently being served (status: SERVING)
 * - Number of customers completed during the current working day (status: USED)
 * - Places remaining under the configured daily capacity
 * - Whether the service is open and operating today
 * - Whether the queue is currently progressing
 * - Customer's queue position and customers ahead (where determinable for an existing ticket)
 * - Defensible waiting-time estimate based on recorded workflow data, or null with clear reason
 * - A clear reason when VIP service is unavailable
 * - Flat VIP fee of 1,000 ETB
 *
 * Does NOT expose other customers' PII.
 */
export async function checkQueueAvailability(req, res) {
  try {
    const workingDay = isTodayWorkingDay();
    const hoursCheck = isQueueWithinOperatingHours();
    const metrics = await getTodayCapacityMetrics(prisma);
    const progress = await getQueueProgressStatus(metrics, prisma);

    const isServiceOpenToday = workingDay.isWorkingDay && hoursCheck.isOpen;
    const acceptingCustomers = isServiceOpenToday && metrics.isCapacityAvailable;

    let reason = null;
    if (!workingDay.isWorkingDay) {
      reason = `VIP service is closed today: ${workingDay.reason}. Please return on the next working day.`;
    } else if (!hoursCheck.isOpen) {
      reason = hoursCheck.reason;
    } else if (!metrics.isCapacityAvailable) {
      reason = `VIP queue has reached today's maximum capacity of ${metrics.dailyCapacity} customers. All capacity is currently utilized or reserved. Please return on the next working day.`;
    }

    // Determine customers ahead & queue position for an existing ticket if query param is provided
    const rawLookup = req.query.reference || req.query.ticketCode || req.query.ticketId;
    let customersAhead = null;
    let queuePosition = null;
    let ticketLookup = null;
    let targetTicketStatus = null;

    if (rawLookup && typeof rawLookup === "string" && rawLookup.trim()) {
      const cleanRef = rawLookup.trim();
      const ticket = await prisma.vip_tickets.findFirst({
        where: {
          OR: [{ ticketCode: cleanRef }, { id: cleanRef }],
        },
        select: {
          id: true,
          ticketCode: true,
          status: true,
          queueNumber: true,
          queueDate: true,
          checkedInAt: true,
          servedAt: true,
          completedAt: true,
          paymentRef: true,
        },
      });

      if (!ticket) {
        ticketLookup = {
          found: false,
          reference: cleanRef,
          message: "No VIP ticket found matching the provided reference.",
        };
      } else {
        targetTicketStatus = ticket.status;
        queuePosition = ticket.queueNumber;

        if (ticket.status === "QUEUED") {
          const ahead = await prisma.vip_tickets.count({
            where: {
              queueDate: ticket.queueDate,
              status: "QUEUED",
              queueNumber: { lt: ticket.queueNumber },
            },
          });
          customersAhead = ahead;
          ticketLookup = {
            found: true,
            reference: ticket.ticketCode,
            status: ticket.status,
            queueNumber: ticket.queueNumber,
            queuePosition: ticket.queueNumber,
            queueDisplay: `VIP-${String(ticket.queueNumber).padStart(3, "0")}`,
            customersAhead: ahead,
            checkedInAt: ticket.checkedInAt,
            message: `You are in the walk-in VIP queue. Position: VIP-${String(ticket.queueNumber).padStart(3, "0")}. There are ${ahead} customer(s) waiting ahead of you.`,
          };
        } else if (ticket.status === "SERVING") {
          customersAhead = 0;
          ticketLookup = {
            found: true,
            reference: ticket.ticketCode,
            status: ticket.status,
            queueNumber: ticket.queueNumber,
            queuePosition: ticket.queueNumber,
            queueDisplay: `VIP-${String(ticket.queueNumber).padStart(3, "0")}`,
            customersAhead: 0,
            servedAt: ticket.servedAt,
            message: "You are currently being served at the VIP counter.",
          };
        } else if (ticket.status === "USED") {
          ticketLookup = {
            found: true,
            reference: ticket.ticketCode,
            status: ticket.status,
            queueNumber: ticket.queueNumber,
            queuePosition: ticket.queueNumber,
            completedAt: ticket.completedAt,
            message: `Service for this ticket was completed at ${ticket.completedAt?.toISOString() || "earlier today"}.`,
          };
        } else if (ticket.status === "CONFIRMED") {
          ticketLookup = {
            found: true,
            reference: ticket.ticketCode,
            status: ticket.status,
            customersAhead: null,
            queuePosition: null,
            message: "Application is confirmed with secured VIP capacity. Physical check-in at Hawassa MESOB Center is required to join the walk-in queue and receive a queue number.",
          };
        } else if (ticket.status === "PENDING") {
          const resInfo = parseCapacityReservation(ticket.paymentRef);
          ticketLookup = {
            found: true,
            reference: ticket.ticketCode,
            status: ticket.status,
            customersAhead: null,
            queuePosition: null,
            hasActiveReservation: resInfo.isValid && !resInfo.isExpired,
            message: "Application is pending payment. An application reference is not a walk-in queue position. Complete payment and check in at the center to join the queue.",
          };
        } else {
          ticketLookup = {
            found: true,
            reference: ticket.ticketCode,
            status: ticket.status,
            customersAhead: null,
            queuePosition: null,
            message: `Ticket is in ${ticket.status} status.`,
          };
        }
      }
    }

    // Calculate defensible empirical waiting time based on actual recorded workflow completions
    const { startOfDay, endOfDay } = getTodayDateRange();
    const { waitingTime, waitingTimeInfo } = await calculateEmpiricalWaitingTime(
      prisma,
      startOfDay,
      endOfDay,
      customersAhead,
      targetTicketStatus
    );

    return res.json({
      success: true,
      acceptingCustomers,
      available: acceptingCustomers,
      reason,
      isOpenToday: isServiceOpenToday,
      isWorkingDay: workingDay.isWorkingDay,
      placesRemaining: metrics.placesRemaining,
      dailyCapacity: metrics.dailyCapacity,
      customersWaiting: metrics.waitingCount,
      customersServing: metrics.servingCount,
      customersCompletedToday: metrics.completedCount,
      completedToday: metrics.completedCount,
      isQueueProgressing: progress.isQueueProgressing,
      queueProgress: {
        isProgressing: progress.isQueueProgressing,
        statusMessage: progress.progressStatusMessage,
        currentlyServing: progress.currentlyServing,
        lastCompletedAt: progress.lastCompletedAt,
      },
      queuePosition,
      customersAhead,
      ticketLookup,
      operatingHours: {
        isOpen: hoursCheck.isOpen,
        currentTime: hoursCheck.currentTime,
        openTime: hoursCheck.openTime,
        closeTime: hoursCheck.closeTime,
        reason: hoursCheck.reason,
      },
      workingDay: {
        isWorkingDay: workingDay.isWorkingDay,
        date: workingDay.todayStr,
        dayName: workingDay.dayName,
        reason: workingDay.reason,
      },
      waitingTime,
      waitingTimeInfo,
      vipFee: VIP_CONFIG.DEFAULT_FEE,
      currency: VIP_CONFIG.DEFAULT_CURRENCY,
      feeNote: "VIP priority service fee is fixed at 1,000 ETB per application.",
      queue: {
        date: metrics.todayStr,
        activeInQueue: metrics.waitingCount,
        customersWaiting: metrics.waitingCount,
        customersServing: metrics.servingCount,
        completedToday: metrics.completedCount,
        customersCompletedToday: metrics.completedCount,
        totalQueuedToday: metrics.totalQueuedToday,
        totalCapacityConsumed: metrics.totalCapacityConsumed,
        dailyCapacity: metrics.dailyCapacity,
        remainingCapacity: metrics.placesRemaining,
        placesRemaining: metrics.placesRemaining,
        isQueueProgressing: progress.isQueueProgressing,
      },
    });
  } catch (err) {
    console.error("[vip-queue] checkQueueAvailability error:", err);
    return res.status(500).json({
      error: "Failed to check VIP queue availability.",
    });
  }
}

/**
 * POST /api/vip-tickets/:id/reserve-capacity
 * POST /api/vip-tickets/reserve-capacity
 *
 * Pre-Payment VIP Capacity Reservation Foundation:
 * - Allows customer to reserve capacity before committing to payment.
 * - Protects remaining capacity from concurrent customers using PostgreSQL advisory locks.
 * - Prevents duplicate reservations for the same application.
 * - Sets an explicit expiration window (default 15 minutes).
 * - Releases capacity automatically if payment is abandoned or fails.
 * - Does NOT mark application as paid or confirmed without verified payment.
 */
export async function reserveCapacity(req, res) {
  try {
    const rawId = req.params.id || req.body?.ticketId || req.body?.reference || req.body?.ticketCode;
    const rawPhone = req.body?.phone || req.body?.citizenPhone;

    if (!rawId || typeof rawId !== "string" || !rawId.trim()) {
      return res.status(400).json({
        error: "Validation failed: Ticket ID or application reference is required to reserve capacity.",
      });
    }

    const cleanId = rawId.trim();

    // 1. Operating day check
    const workingDay = isTodayWorkingDay();
    if (!workingDay.isWorkingDay) {
      return res.status(400).json({
        error: `VIP service is closed today: ${workingDay.reason}. Capacity reservations are only accepted on operating days.`,
      });
    }

    // 2. Operating hours check
    const hoursCheck = isQueueWithinOperatingHours();
    if (!hoursCheck.isOpen) {
      return res.status(400).json({
        error: hoursCheck.reason,
      });
    }

    const { startOfDay, endOfDay, todayStr } = getTodayDateRange();
    const now = new Date();

    // 3. Concurrency-protected transaction using PostgreSQL advisory lock
    const result = await prisma.$transaction(async (tx) => {
      // Serialize capacity reservation attempts for today to prevent overselling
      await tx.$executeRawUnsafe(
        `SELECT pg_advisory_xact_lock(hashtext('vip_reservation_' || $1));`,
        todayStr
      );

      // Find the ticket
      const ticket = await tx.vip_tickets.findFirst({
        where: {
          OR: [{ id: cleanId }, { ticketCode: cleanId }],
        },
      });

      if (!ticket) {
        return { error: "VIP ticket application not found.", status: 404 };
      }

      // If phone is provided, verify matching phone number for security
      if (rawPhone) {
        const normalizedPhone = normalizePhoneNumber(rawPhone);
        if (!normalizedPhone || !arePhoneNumbersMatching(ticket.citizenPhone, normalizedPhone)) {
          return {
            error: "Phone number verification failed for this application.",
            status: 403,
          };
        }
      }

      // Check current status
      if (ticket.status === "CANCELLED") {
        return {
          error: "This application has been cancelled and cannot reserve VIP capacity.",
          status: 400,
        };
      }

      if (
        ticket.status === "CONFIRMED" ||
        ticket.status === "QUEUED" ||
        ticket.status === "SERVING" ||
        ticket.status === "USED"
      ) {
        return {
          alreadyConfirmed: true,
          ticket,
          message: `VIP capacity is already confirmed for this application (status: ${ticket.status}).`,
        };
      }

      // If PENDING, check if it already has an active, unexpired reservation for today
      if (ticket.status === "PENDING" && ticket.paymentRef) {
        const existingReservation = parseCapacityReservation(ticket.paymentRef);
        if (
          existingReservation.isValid &&
          !existingReservation.isExpired &&
          existingReservation.date === todayStr
        ) {
          const remainingSec = Math.max(
            0,
            Math.floor((existingReservation.expiresAt.getTime() - now.getTime()) / 1000)
          );
          return {
            alreadyReserved: true,
            ticket,
            reservation: {
              token: existingReservation.token,
              reservedAt: existingReservation.reservedAt.toISOString(),
              expiresAt: existingReservation.expiresAt.toISOString(),
              expiresInSeconds: remainingSec,
              queueDate: todayStr,
            },
          };
        }
      }

      // Calculate current capacity consumed for today inside the lock
      const confirmedCount = await tx.vip_tickets.count({
        where: {
          OR: [
            { queueDate: { gte: startOfDay, lte: endOfDay } },
            { slotDate: { gte: startOfDay, lte: endOfDay } },
          ],
          status: { in: ["CONFIRMED", "QUEUED", "SERVING", "USED"] },
        },
      });

      const pendingReserved = await tx.vip_tickets.findMany({
        where: {
          slotDate: { gte: startOfDay, lte: endOfDay },
          status: "PENDING",
          paymentRef: { not: null },
          id: { not: ticket.id }, // exclude current ticket if renewing
        },
        select: {
          id: true,
          paymentRef: true,
        },
      });

      let activeReservations = 0;
      for (const p of pendingReserved) {
        const parsed = parseCapacityReservation(p.paymentRef);
        if (parsed.isValid && !parsed.isExpired) {
          activeReservations++;
        }
      }

      const totalConsumed = confirmedCount + activeReservations;
      if (totalConsumed >= VIP_QUEUE_CONFIG.DAILY_VIP_CAPACITY) {
        return {
          error: `VIP queue has reached today's maximum capacity of ${VIP_QUEUE_CONFIG.DAILY_VIP_CAPACITY} customers. No additional reservations can be accepted today.`,
          status: 503,
        };
      }

      // Capacity is available: Create new reservation
      const reservationToken = `res_${crypto.randomUUID()}`;
      const expiresAt = new Date(
        now.getTime() + VIP_QUEUE_CONFIG.RESERVATION_HOLD_MINUTES * 60 * 1000
      );
      const reservationPayload = JSON.stringify({
        type: "CAPACITY_RESERVATION",
        token: reservationToken,
        reservedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        date: todayStr,
      });

      const updated = await tx.vip_tickets.update({
        where: { id: ticket.id },
        data: {
          slotDate: startOfDay,
          paymentRef: reservationPayload,
          updatedAt: now,
        },
      });

      const placesRemainingAfter = Math.max(
        0,
        VIP_QUEUE_CONFIG.DAILY_VIP_CAPACITY - (totalConsumed + 1)
      );

      return {
        ticket: updated,
        reservationToken,
        reservedAt: now,
        expiresAt,
        holdMinutes: VIP_QUEUE_CONFIG.RESERVATION_HOLD_MINUTES,
        expiresInSeconds: VIP_QUEUE_CONFIG.RESERVATION_HOLD_MINUTES * 60,
        placesRemaining: placesRemainingAfter,
      };
    });

    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    if (result.alreadyConfirmed) {
      return res.status(200).json({
        success: true,
        alreadyConfirmed: true,
        message: result.message,
        data: {
          ticketCode: result.ticket.ticketCode,
          status: result.ticket.status,
        },
      });
    }

    if (result.alreadyReserved) {
      return res.status(200).json({
        success: true,
        alreadyReserved: true,
        message: `An active VIP capacity reservation is already held for this application. Holds expire in ${result.reservation.expiresInSeconds} seconds.`,
        data: {
          ticketCode: result.ticket.ticketCode,
          status: result.ticket.status,
          reservationToken: result.reservation.token,
          reservedAt: result.reservation.reservedAt,
          expiresAt: result.reservation.expiresAt,
          expiresInSeconds: result.reservation.expiresInSeconds,
          queueDate: todayStr,
          dailyCapacity: VIP_QUEUE_CONFIG.DAILY_VIP_CAPACITY,
          vipFee: VIP_CONFIG.DEFAULT_FEE,
          currency: VIP_CONFIG.DEFAULT_CURRENCY,
          nextStep: "Proceed to payment. If payment is not completed before expiration, capacity is automatically released.",
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: `VIP capacity reserved successfully for today. Please complete payment within ${result.holdMinutes} minutes.`,
      data: {
        ticketCode: result.ticket.ticketCode,
        status: result.ticket.status,
        reservationToken: result.reservationToken,
        reservedAt: result.reservedAt.toISOString(),
        expiresAt: result.expiresAt.toISOString(),
        holdMinutes: result.holdMinutes,
        expiresInSeconds: result.expiresInSeconds,
        queueDate: todayStr,
        dailyCapacity: VIP_QUEUE_CONFIG.DAILY_VIP_CAPACITY,
        placesRemaining: result.placesRemaining,
        vipFee: VIP_CONFIG.DEFAULT_FEE,
        currency: VIP_CONFIG.DEFAULT_CURRENCY,
        nextStep: "Proceed to verified payment. If payment is not completed within 15 minutes, this capacity will be released automatically.",
      },
    });
  } catch (err) {
    console.error("[vip-queue] reserveCapacity error:", err);
    return res.status(500).json({
      error: "Failed to reserve VIP capacity. Please try again.",
    });
  }
}

/**
 * POST /api/vip-tickets/:id/release-capacity
 * POST /api/vip-tickets/release-capacity
 *
 * Explicitly releases a held VIP capacity reservation if a customer cancels,
 * navigates away, or payment fails.
 */
export async function releaseCapacity(req, res) {
  try {
    const rawId = req.params.id || req.body?.ticketId || req.body?.reference || req.body?.ticketCode;
    const rawPhone = req.body?.phone || req.body?.citizenPhone;

    if (!rawId || typeof rawId !== "string" || !rawId.trim()) {
      return res.status(400).json({
        error: "Validation failed: Ticket ID or application reference is required to release capacity.",
      });
    }

    const cleanId = rawId.trim();

    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.vip_tickets.findFirst({
        where: {
          OR: [{ id: cleanId }, { ticketCode: cleanId }],
        },
      });

      if (!ticket) {
        return { error: "VIP ticket application not found.", status: 404 };
      }

      if (rawPhone) {
        const normalizedPhone = normalizePhoneNumber(rawPhone);
        if (!normalizedPhone || !arePhoneNumbersMatching(ticket.citizenPhone, normalizedPhone)) {
          return {
            error: "Phone number verification failed for this application.",
            status: 403,
          };
        }
      }

      if (ticket.status !== "PENDING") {
        return {
          error: `Cannot release reservation for ticket in '${ticket.status}' status. Only PENDING reservations can be released.`,
          status: 400,
        };
      }

      const resInfo = parseCapacityReservation(ticket.paymentRef);
      if (!resInfo.isValid) {
        return {
          message: "No active capacity reservation found to release.",
          released: false,
        };
      }

      await tx.vip_tickets.update({
        where: { id: ticket.id },
        data: {
          slotDate: null,
          paymentRef: null,
          updatedAt: new Date(),
        },
      });

      return { released: true, message: "VIP capacity reservation released successfully." };
    });

    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    return res.json({
      success: true,
      released: result.released,
      message: result.message,
    });
  } catch (err) {
    console.error("[vip-queue] releaseCapacity error:", err);
    return res.status(500).json({
      error: "Failed to release VIP capacity reservation.",
    });
  }
}

/**
 * POST /api/vip-tickets/:id/enqueue
 *
 * Physical In-Person VIP Check-In Endpoint:
 * - Assigns a confirmed VIP application a real sequential walk-in queue position.
 * - Requires ticket to be in CONFIRMED status (verified payment).
 * - Enforces working day, operating hours, and daily capacity cap.
 * - Protected by PostgreSQL transaction advisory locks to guarantee queue number uniqueness
 *   and prevent concurrent check-in overflow beyond daily capacity.
 * - Excludes cancelled and completed tickets from active counts.
 * - Prevents duplicate check-ins for the same application.
 */
export async function enqueueVipTicket(req, res) {
  try {
    const rawId = req.params.id;

    if (!rawId || typeof rawId !== "string" || !rawId.trim()) {
      return res.status(400).json({
        error: "Validation failed: Ticket ID or reference is required for physical check-in.",
      });
    }

    const cleanId = rawId.trim();

    // 1. Working day check
    const workingDay = isTodayWorkingDay();
    if (!workingDay.isWorkingDay) {
      return res.status(400).json({
        error: `VIP queue is not available today: ${workingDay.reason}`,
      });
    }

    // 2. Operating hours check
    const hoursCheck = isQueueWithinOperatingHours();
    if (!hoursCheck.isOpen) {
      return res.status(400).json({
        error: hoursCheck.reason,
      });
    }

    const { startOfDay, endOfDay, todayStr } = getTodayDateRange();
    const now = new Date();

    // 3. Concurrency-protected check-in using PostgreSQL advisory lock
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SELECT pg_advisory_xact_lock(hashtext('vip_enqueue_' || $1));`,
        todayStr
      );

      const ticket = await tx.vip_tickets.findFirst({
        where: {
          OR: [{ id: cleanId }, { ticketCode: cleanId }],
        },
      });

      if (!ticket) {
        return { error: "VIP ticket not found.", status: 404 };
      }

      if (ticket.status === "QUEUED" || ticket.status === "SERVING") {
        return {
          error: `This ticket is already in the queue (status: ${ticket.status}) with queue number VIP-${String(ticket.queueNumber).padStart(3, "0")}.`,
          status: 409,
        };
      }

      if (ticket.status === "USED") {
        return {
          error: "This ticket has already been used and completed.",
          status: 409,
        };
      }

      if (ticket.status === "CANCELLED") {
        return {
          error: "This ticket has been cancelled and cannot join the walk-in queue.",
          status: 409,
        };
      }

      if (ticket.queueNumber !== null) {
        return {
          error: `This ticket has already been assigned queue number VIP-${String(ticket.queueNumber).padStart(3, "0")} and cannot join again.`,
          status: 409,
        };
      }

      if (ticket.status !== "CONFIRMED") {
        return {
          error: `Ticket must be in CONFIRMED status with verified payment before physical queue check-in. Current status: ${ticket.status}.`,
          status: 400,
        };
      }

      // Check daily capacity under the advisory lock
      const totalQueued = await tx.vip_tickets.count({
        where: {
          queueDate: { gte: startOfDay, lte: endOfDay },
          status: { in: ["QUEUED", "SERVING", "USED"] },
        },
      });

      if (totalQueued >= VIP_QUEUE_CONFIG.DAILY_VIP_CAPACITY) {
        return {
          error: `VIP queue has reached today's maximum capacity of ${VIP_QUEUE_CONFIG.DAILY_VIP_CAPACITY}. Please return on the next working day.`,
          status: 503,
        };
      }

      // Assign next sequential queue number atomically under lock
      const queueNumber = await getNextQueueNumber(tx, startOfDay, endOfDay);

      const updated = await tx.vip_tickets.update({
        where: { id: ticket.id },
        data: {
          status: "QUEUED",
          queueNumber,
          queueDate: startOfDay,
          checkedInAt: now,
          updatedAt: now,
        },
      });

      return { ticket: updated, queueNumber };
    });

    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    const { ticket: updated, queueNumber } = result;

    const metrics = await getTodayCapacityMetrics(prisma);
    const progress = await getQueueProgressStatus(metrics, prisma);

    const positionAhead = await prisma.vip_tickets.count({
      where: {
        queueDate: { gte: startOfDay, lte: endOfDay },
        status: "QUEUED",
        queueNumber: { lt: queueNumber },
      },
    });

    // Calculate empirical waiting time based on actual recorded workflow data
    const { waitingTime, waitingTimeInfo } = await calculateEmpiricalWaitingTime(
      prisma,
      startOfDay,
      endOfDay,
      positionAhead,
      "QUEUED"
    );

    return res.status(200).json({
      success: true,
      message: `VIP ticket checked in successfully. Your queue number is VIP-${String(queueNumber).padStart(3, "0")}.`,
      data: {
        ticketCode: updated.ticketCode,
        status: updated.status,
        queueNumber,
        queuePosition: queueNumber,
        queueDisplay: `VIP-${String(queueNumber).padStart(3, "0")}`,
        queueDate: todayStr,
        checkedInAt: updated.checkedInAt,
        positionAhead,
        customersAhead: positionAhead,
        totalWaiting: metrics.waitingCount,
        customersWaiting: metrics.waitingCount,
        customersServing: metrics.servingCount,
        customersCompletedToday: metrics.completedCount,
        isQueueProgressing: progress.isQueueProgressing,
        dailyCapacity: metrics.dailyCapacity,
        placesRemaining: metrics.placesRemaining,
        waitingTime,
        waitingTimeInfo,
      },
    });
  } catch (err) {
    console.error("[vip-queue] enqueueVipTicket error:", err);
    return res.status(500).json({
      error: "Failed to enqueue VIP ticket. Please try again.",
    });
  }
}

/**
 * GET /api/vip-tickets/:id/queue-position
 *
 * Customer checks current queue position for a ticket.
 *
 * Provides real-time event-based queue progress:
 * - Queue number and display (e.g. VIP-001)
 * - Exact number of queued customers ahead
 * - Total waiting customers, currently serving customers, and completed today count
 * - Real queue progress status (isQueueProgressing, lastCompletedAt)
 * - Defensible waiting-time estimate based on recorded workflow data, or null with clear explanation
 * - Does NOT expose other customers' PII.
 */
export async function getQueuePosition(req, res) {
  try {
    const rawId = req.params.id;

    if (!rawId || typeof rawId !== "string" || !rawId.trim()) {
      return res.status(400).json({
        error: "Validation failed: Ticket ID or reference is required.",
      });
    }

    const cleanId = rawId.trim();

    const ticket = await prisma.vip_tickets.findFirst({
      where: {
        OR: [{ id: cleanId }, { ticketCode: cleanId }],
      },
      select: {
        id: true,
        ticketCode: true,
        status: true,
        queueNumber: true,
        queueDate: true,
        checkedInAt: true,
        servedAt: true,
        completedAt: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "VIP ticket not found.",
      });
    }

    const metrics = await getTodayCapacityMetrics(prisma);
    const progress = await getQueueProgressStatus(metrics, prisma);

    if (ticket.status !== "QUEUED" && ticket.status !== "SERVING") {
      let message = `Ticket status is ${ticket.status}.`;
      if (ticket.status === "PENDING") {
        message = "Application is pending payment. An application reference is not a walk-in queue position. Physical check-in at Hawassa MESOB Center is required to join the priority walk-in queue.";
      } else if (ticket.status === "CONFIRMED") {
        message = "Application has confirmed VIP capacity. Physical check-in at Hawassa MESOB Center is required to join the priority walk-in queue and receive a queue number.";
      } else if (ticket.status === "USED") {
        message = `VIP service for this ticket was completed at ${ticket.completedAt?.toISOString() || "earlier today"}.`;
      }
      return res.status(400).json({
        error: message,
        data: {
          ticketCode: ticket.ticketCode,
          status: ticket.status,
          isQueued: false,
          customersWaiting: metrics.waitingCount,
          customersServing: metrics.servingCount,
          customersCompletedToday: metrics.completedCount,
          isQueueProgressing: progress.isQueueProgressing,
        },
      });
    }

    // Number of QUEUED tickets ahead of this one
    let positionAhead = 0;
    if (ticket.status === "QUEUED") {
      positionAhead = await prisma.vip_tickets.count({
        where: {
          queueDate: ticket.queueDate,
          status: "QUEUED",
          queueNumber: { lt: ticket.queueNumber },
        },
      });
    }

    const currentlyServing = await prisma.vip_tickets.findFirst({
      where: {
        queueDate: ticket.queueDate,
        status: "SERVING",
      },
      orderBy: { queueNumber: "asc" },
      select: { queueNumber: true, servedAt: true },
    });

    // Calculate empirical waiting time based on actual recorded workflow completions
    const { startOfDay, endOfDay } = getTodayDateRange();
    const { waitingTime, waitingTimeInfo } = await calculateEmpiricalWaitingTime(
      prisma,
      startOfDay,
      endOfDay,
      positionAhead,
      ticket.status
    );

    return res.json({
      success: true,
      data: {
        ticketCode: ticket.ticketCode,
        status: ticket.status,
        queueNumber: ticket.queueNumber,
        queuePosition: ticket.queueNumber,
        queueDisplay: `VIP-${String(ticket.queueNumber).padStart(3, "0")}`,
        positionAhead,
        customersAhead: positionAhead,
        customersWaiting: metrics.waitingCount,
        customersServing: metrics.servingCount,
        customersCompletedToday: metrics.completedCount,
        completedToday: metrics.completedCount,
        isQueueProgressing: progress.isQueueProgressing,
        progressStatusMessage: progress.progressStatusMessage,
        currentlyServingNumber: currentlyServing?.queueNumber || null,
        currentlyServingDisplay: currentlyServing ? `VIP-${String(currentlyServing.queueNumber).padStart(3, "0")}` : null,
        checkedInAt: ticket.checkedInAt,
        servedAt: ticket.servedAt,
        completedAt: ticket.completedAt,
        lastCompletedAt: progress.lastCompletedAt,
        waitingTime,
        waitingTimeInfo,
      },
    });
  } catch (err) {
    console.error("[vip-queue] getQueuePosition error:", err);
    return res.status(500).json({
      error: "Failed to retrieve queue position.",
    });
  }
}

/**
 * GET /api/vip-tickets/queue/status
 *
 * Real-time queue progress monitor (public display / staff screen):
 * - Number of customers waiting, serving, and completed today
 * - Queue progression indicator based on active service events
 * - Currently serving ticket and next in queue (without PII)
 * - Excludes cancelled and completed tickets from active waiting counts
 */
export async function getQueueStatus(req, res) {
  try {
    const workingDay = isTodayWorkingDay();
    const hoursCheck = isQueueWithinOperatingHours();
    const metrics = await getTodayCapacityMetrics(prisma);
    const progress = await getQueueProgressStatus(metrics, prisma);

    // Current ticket being served (no PII)
    const servingTicket = await prisma.vip_tickets.findFirst({
      where: {
        queueDate: { gte: metrics.startOfDay, lte: metrics.endOfDay },
        status: "SERVING",
      },
      orderBy: { queueNumber: "asc" },
      select: {
        queueNumber: true,
        ticketCode: true,
        servedAt: true,
      },
    });

    // Next in queue (no PII)
    const nextTicket = await prisma.vip_tickets.findFirst({
      where: {
        queueDate: { gte: metrics.startOfDay, lte: metrics.endOfDay },
        status: "QUEUED",
      },
      orderBy: { queueNumber: "asc" },
      select: {
        queueNumber: true,
        ticketCode: true,
      },
    });

    return res.json({
      success: true,
      queue: {
        date: metrics.todayStr,
        isWorkingDay: workingDay.isWorkingDay,
        isOpen: hoursCheck.isOpen,
        isQueueProgressing: progress.isQueueProgressing,
        progressStatusMessage: progress.progressStatusMessage,
        operatingHours: {
          openTime: hoursCheck.openTime,
          closeTime: hoursCheck.closeTime,
          currentTime: hoursCheck.currentTime,
        },
        counts: {
          waiting: metrics.waitingCount,
          serving: metrics.servingCount,
          completedToday: metrics.completedCount,
          activeReservations: metrics.activeReservationsCount,
          totalConsumed: metrics.totalCapacityConsumed,
        },
        capacity: {
          daily: metrics.dailyCapacity,
          remaining: metrics.placesRemaining,
          placesRemaining: metrics.placesRemaining,
        },
        currentlyServing: servingTicket
          ? {
              queueNumber: servingTicket.queueNumber,
              queueDisplay: `VIP-${String(servingTicket.queueNumber).padStart(3, "0")}`,
              ticketCode: servingTicket.ticketCode,
              servedAt: servingTicket.servedAt,
            }
          : null,
        nextInQueue: nextTicket
          ? {
              queueNumber: nextTicket.queueNumber,
              queueDisplay: `VIP-${String(nextTicket.queueNumber).padStart(3, "0")}`,
              ticketCode: nextTicket.ticketCode,
            }
          : null,
        lastCompletedAt: progress.lastCompletedAt,
      },
    });
  } catch (err) {
    console.error("[vip-queue] getQueueStatus error:", err);
    return res.status(500).json({
      error: "Failed to retrieve VIP queue status.",
    });
  }
}
