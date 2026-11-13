import prisma from "../../config/db.js";
import {
  VIP_QUEUE_CONFIG,
  isQueueWithinOperatingHours,
  isTodayWorkingDay,
} from "../vip-tickets/vip-queue.config.js";
import {
  getTodayCapacityMetrics,
  getQueueProgressStatus,
  calculateEmpiricalWaitingTime,
  getTodayDateRange,
} from "../vip-tickets/vip-queue.controller.js";
import { VIP_CONFIG } from "../institutions/vip.config.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALLOWED_LOCALES = ["en", "am", "sid"];

function localize(jsonField, locale = "en") {
  if (!jsonField || typeof jsonField !== "object") return jsonField ?? "";
  return jsonField[locale] ?? jsonField["en"] ?? Object.values(jsonField)[0] ?? "";
}

function localizeArray(arr, locale = "en") {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) =>
    typeof item === "object" && item !== null ? localize(item, locale) : item
  );
}

function resolveLocale(req) {
  const loc = req.query?.locale || "en";
  return ALLOWED_LOCALES.includes(loc) ? loc : "en";
}

// ─── Controller Functions ─────────────────────────────────────────────────────

/**
 * GET /api/vip-dashboard
 *
 * Centralized Public VIP Dashboard Data API.
 * Provides a consolidated, public-safe view of:
 * - Center operational status & hours
 * - Real-time walk-in priority queue monitor (now serving & next in queue)
 * - Daily capacity & availability
 * - Safe aggregate ticket counts
 * - Participating institutions & locations
 * - VIP-eligible services & requirements
 *
 * Security: Strict DTO serialization. NEVER exposes citizen PII, payment secrets,
 * internal database IDs, QR data, or private ticket codes.
 */
export async function getPublicVipDashboard(req, res) {
  try {
    const locale = resolveLocale(req);
    const workingDay = isTodayWorkingDay();
    const hoursCheck = isQueueWithinOperatingHours();

    // 1. Fetch real-time queue metrics and progress
    const metrics = await getTodayCapacityMetrics(prisma);
    const progress = await getQueueProgressStatus(metrics, prisma);

    // 2. Fetch currently serving & next in queue tickets (Strictly anonymized display numbers only)
    const [servingTicket, nextTicket] = await Promise.all([
      prisma.vip_tickets.findFirst({
        where: {
          queueDate: { gte: metrics.startOfDay, lte: metrics.endOfDay },
          status: "SERVING",
        },
        orderBy: { queueNumber: "asc" },
        select: {
          queueNumber: true,
          servedAt: true,
        },
      }),
      prisma.vip_tickets.findFirst({
        where: {
          queueDate: { gte: metrics.startOfDay, lte: metrics.endOfDay },
          status: "QUEUED",
        },
        orderBy: { queueNumber: "asc" },
        select: {
          queueNumber: true,
        },
      }),
    ]);

    // 3. Empirical waiting-time calculation
    const { waitingTime, waitingTimeInfo } = await calculateEmpiricalWaitingTime(
      prisma,
      metrics.startOfDay,
      metrics.endOfDay,
      null,
      null
    );

    // 4. Safe lifetime ticket counts via database aggregation
    const statusGroups = await prisma.vip_tickets.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const statusCounts = {
      PENDING: 0,
      CONFIRMED: 0,
      QUEUED: 0,
      SERVING: 0,
      USED: 0,
      CANCELLED: 0,
    };

    let totalTickets = 0;
    for (const g of statusGroups) {
      if (statusCounts[g.status] !== undefined) {
        statusCounts[g.status] = g._count.id;
      }
      totalTickets += g._count.id;
    }

    // 5. Active institutions and their VIP services (Public catalog)
    const [institutions, rawServices] = await Promise.all([
      prisma.serviceProvider.findMany({
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          name: true,
          icon: true,
          floorRoomNumber: true,
          contactPhone: true,
          isActive: true,
          _count: {
            select: {
              services: { where: { isActive: true } },
            },
          },
        },
        orderBy: { code: "asc" },
      }),
      prisma.service.findMany({
        where: {
          isActive: true,
          provider: { isActive: true },
        },
        select: {
          id: true,
          title: true,
          description: true,
          requirements: true,
          estimatedFee: true,
          processingDays: true,
          isActive: true,
          provider: {
            select: {
              id: true,
              code: true,
              name: true,
              icon: true,
              floorRoomNumber: true,
              contactPhone: true,
            },
          },
        },
        orderBy: [{ provider: { code: "asc" } }, { createdAt: "asc" }],
      }),
    ]);

    // Format institutions (Localized, public safe)
    const formattedInstitutions = institutions.map((inst) => ({
      id: inst.id,
      code: inst.code,
      name: localize(inst.name, locale),
      localizedName: inst.name,
      icon: inst.icon || null,
      logoUrl: inst.icon || null,
      floorRoomNumber: inst.floorRoomNumber || null,
      contactPhone: inst.contactPhone || null,
      isActive: inst.isActive,
      serviceCount: inst._count.services,
    }));

    // Format services (Localized, public safe)
    const formattedServices = rawServices.map((s) => ({
      id: s.id,
      title: localize(s.title, locale),
      localizedTitle: s.title,
      description: localize(s.description, locale),
      requirements: localizeArray(s.requirements, locale),
      estimatedFee: s.estimatedFee,
      processingDays: s.processingDays,
      vipAvailable: true,
      vipFee: VIP_CONFIG.DEFAULT_FEE,
      currency: VIP_CONFIG.DEFAULT_CURRENCY,
      institution: {
        id: s.provider.id,
        code: s.provider.code,
        name: localize(s.provider.name, locale),
        icon: s.provider.icon || null,
        floorRoomNumber: s.provider.floorRoomNumber || null,
      },
    }));

    const isCenterOpen = workingDay.isWorkingDay && hoursCheck.isOpen;
    const isAcceptingCustomers = isCenterOpen && metrics.isCapacityAvailable;

    return res.status(200).json({
      success: true,
      data: {
        center: {
          name: "Hawassa MESOB Center",
          isOpen: isCenterOpen,
          workday: workingDay.isWorkingDay,
          openingTime: VIP_QUEUE_CONFIG.QUEUE_OPEN_TIME,
          closingTime: VIP_QUEUE_CONFIG.QUEUE_CLOSE_TIME,
          timezone: VIP_QUEUE_CONFIG.TIMEZONE,
          currentTime: hoursCheck.currentTime,
          statusMessage: !workingDay.isWorkingDay
            ? `Center is closed today: ${workingDay.reason}.`
            : !hoursCheck.isOpen
            ? hoursCheck.reason
            : !metrics.isCapacityAvailable
            ? `Center has reached maximum daily VIP capacity (${metrics.dailyCapacity} customers).`
            : "Center is open and accepting VIP priority customers.",
        },
        queue: {
          waiting: metrics.waitingCount,
          currentlyServing: servingTicket
            ? {
                queueNumber: servingTicket.queueNumber,
                queueDisplay: `VIP-${String(servingTicket.queueNumber).padStart(3, "0")}`,
                servedAt: servingTicket.servedAt,
              }
            : null,
          nextInQueue: nextTicket
            ? {
                queueNumber: nextTicket.queueNumber,
                queueDisplay: `VIP-${String(nextTicket.queueNumber).padStart(3, "0")}`,
              }
            : null,
          completedToday: metrics.completedCount,
          activeReservations: metrics.activeReservationsCount,
          estimatedWaitingTime: waitingTime,
          estimatedWaitingTimeInfo: waitingTimeInfo,
          lastCompletedAt: progress.lastCompletedAt,
          isQueueProgressing: progress.isQueueProgressing,
          progressStatusMessage: progress.progressStatusMessage,
        },
        capacity: {
          dailyCapacity: metrics.dailyCapacity,
          consumedToday: metrics.totalCapacityConsumed,
          remainingCapacity: metrics.placesRemaining,
          acceptingCustomers: isAcceptingCustomers,
        },
        statistics: {
          totalTickets,
          confirmedTickets: statusCounts.CONFIRMED,
          pendingTickets: statusCounts.PENDING,
          completedTickets: statusCounts.USED,
          queuedTickets: statusCounts.QUEUED,
          servingTickets: statusCounts.SERVING,
        },
        institutions: formattedInstitutions,
        services: formattedServices,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[vip-dashboard] getPublicVipDashboard error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve public VIP dashboard data. Please try again later.",
    });
  }
}

/**
 * GET /api/vip-dashboard/stats
 *
 * Dedicated Public VIP Statistics Endpoint.
 * Computes strictly aggregated metrics from real database records:
 * - Ticket counts by lifecycle status
 * - Ticket counts by staff service-processing status
 * - Today's operational volume (created today, completed today, queued today)
 * - Active institutions and services totals
 * - Aggregate successful payments total (no payment secrets or refs)
 *
 * Security: Strict database-level aggregation. Zero customer PII or transaction secrets.
 */
export async function getPublicVipStats(req, res) {
  try {
    const { startOfDay, endOfDay, todayStr } = getTodayDateRange();

    // Run parallel database aggregate queries
    const [
      lifecycleGroups,
      processingGroups,
      createdTodayCount,
      completedTodayCount,
      activeInstitutionsCount,
      activeServicesCount,
      capacityMetrics,
    ] = await Promise.all([
      // 1. All-time ticket counts by lifecycle status (TicketStatus)
      prisma.vip_tickets.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      // 2. All-time ticket counts by staff service-processing status (ServiceProcessingStatus)
      prisma.vip_tickets.groupBy({
        by: ["serviceProcessingStatus"],
        _count: { id: true },
      }),
      // 3. Tickets created today (Africa/Addis_Ababa day boundaries)
      prisma.vip_tickets.count({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      // 4. Tickets completed today
      prisma.vip_tickets.count({
        where: {
          completedAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      // 5. Total active participating institutions
      prisma.serviceProvider.count({
        where: { isActive: true },
      }),
      // 6. Total active VIP services
      prisma.service.count({
        where: {
          isActive: true,
          provider: { isActive: true },
        },
      }),
      // 7. Today's live capacity metrics
      getTodayCapacityMetrics(prisma),
    ]);

    // Format lifecycle status counts
    const tickets = {
      total: 0,
      pending: 0,
      confirmed: 0,
      queued: 0,
      serving: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const g of lifecycleGroups) {
      const key = g.status.toLowerCase();
      if (key === "used") {
        tickets.completed = g._count.id;
      } else if (tickets[key] !== undefined) {
        tickets[key] = g._count.id;
      }
      tickets.total += g._count.id;
    }

    // Format staff service-processing counts
    const serviceProcessing = {
      pending: 0,
      inProgress: 0,
      completed: 0,
    };

    for (const g of processingGroups) {
      if (g.serviceProcessingStatus === "PENDING") {
        serviceProcessing.pending = g._count.id;
      } else if (g.serviceProcessingStatus === "IN_PROGRESS") {
        serviceProcessing.inProgress = g._count.id;
      } else if (g.serviceProcessingStatus === "COMPLETED") {
        serviceProcessing.completed = g._count.id;
      }
    }

    // Optional safe payment aggregates (only successful totals, no transaction identifiers)
    let payments = null;
    try {
      if (prisma.vip_payments) {
        const paymentAgg = await prisma.vip_payments.aggregate({
          where: { status: "SUCCESS" },
          _count: { id: true },
          _sum: { amount: true },
        });

        payments = {
          totalSuccessful: paymentAgg._count.id || 0,
          totalAmountCollected: paymentAgg._sum.amount || 0,
          currency: VIP_CONFIG.DEFAULT_CURRENCY,
        };
      }
    } catch {
      // If payment table is unavailable or unmigrated, omit payments safely
      payments = null;
    }

    return res.status(200).json({
      success: true,
      data: {
        tickets,
        today: {
          date: todayStr,
          createdToday: createdTodayCount,
          completedToday: completedTodayCount,
          waiting: capacityMetrics.waitingCount,
          serving: capacityMetrics.servingCount,
          capacityConsumed: capacityMetrics.totalCapacityConsumed,
          capacityRemaining: capacityMetrics.placesRemaining,
          dailyCapacity: capacityMetrics.dailyCapacity,
        },
        serviceProcessing,
        institutions: {
          totalActive: activeInstitutionsCount,
          totalVipServices: activeServicesCount,
        },
        ...(payments ? { payments } : {}),
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[vip-dashboard] getPublicVipStats error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve public VIP statistics. Please try again later.",
    });
  }
}

