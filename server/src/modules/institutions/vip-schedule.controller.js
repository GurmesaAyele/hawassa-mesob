import prisma from "../../config/db.js";
import {
  VIP_SCHEDULE_CONFIG,
  getLocalNow,
  formatLocalDate,
  checkIsWorkingDay,
  generateDayTimeSlots,
  isSlotInPast,
} from "./vip-schedule.config.js";

/**
 * Helper to localize a json field ({ en, am, sid } or string).
 */
function localize(jsonField, locale = "en") {
  if (!jsonField || typeof jsonField !== "object") return jsonField ?? "";
  return jsonField[locale] ?? jsonField["en"] ?? Object.values(jsonField)[0] ?? "";
}

/**
 * Helper to query VIP tickets by serviceId, supporting both single-service legacy
 * tickets and multi-service tickets via vip_ticket_services join relation.
 */
function getServiceTicketWhere(serviceId) {
  if (prisma.vip_ticket_services) {
    return {
      OR: [
        { serviceId },
        { ticket_services: { some: { serviceId } } },
      ],
    };
  }
  return { serviceId };
}

/**
 * Searches forward from the given date (up to BOOKING_WINDOW_DAYS)
 * to find the earliest eligible working slot with remaining capacity.
 */
async function findNextEligibleSlot(serviceId, fromDateStr = null) {
  const localNow = getLocalNow();
  const todayStr = formatLocalDate(localNow);
  const startDateStr = fromDateStr && fromDateStr >= todayStr ? fromDateStr : todayStr;

  const [startYear, startMonth, startDay] = startDateStr.split("-").map(Number);
  const baseDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 12, 0, 0));

  for (let offset = 0; offset <= VIP_SCHEDULE_CONFIG.BOOKING_WINDOW_DAYS; offset++) {
    const candidateDate = new Date(baseDate.getTime() + offset * 86400000);
    const candidateStr = formatLocalDate(candidateDate);
    const workingInfo = checkIsWorkingDay(candidateStr);

    if (!workingInfo.isWorkingDay) {
      continue;
    }

    const startOfDay = new Date(`${candidateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${candidateStr}T23:59:59.999Z`);

    const bookedTickets = await prisma.vip_tickets.findMany({
      where: {
        ...getServiceTicketWhere(serviceId),
        slotDate: { gte: startOfDay, lte: endOfDay },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { slotTime: true },
    });

    const bookedCounts = {};
    for (const t of bookedTickets) {
      bookedCounts[t.slotTime] = (bookedCounts[t.slotTime] || 0) + 1;
    }

    const daySlots = generateDayTimeSlots();
    for (const slot of daySlots) {
      const past = isSlotInPast(candidateStr, slot.slotTime);
      const booked = bookedCounts[slot.slotTime] || 0;
      const remaining = Math.max(0, VIP_SCHEDULE_CONFIG.DEFAULT_SLOT_CAPACITY - booked);

      if (!past && remaining > 0) {
        return {
          date: candidateStr,
          dayName: workingInfo.dayName,
          slotTime: slot.slotTime,
          startTime: slot.startTime,
          endTime: slot.endTime,
          label: slot.label,
          remainingCapacity: remaining,
          slotCapacity: VIP_SCHEDULE_CONFIG.DEFAULT_SLOT_CAPACITY,
        };
      }
    }
  }

  return null;
}

/**
 * GET /api/services/:id/vip-slots or GET /api/services/:id/vip-schedule
 *
 * Query params:
 *   date   – "YYYY-MM-DD" (optional; defaults to today or next working day)
 *   locale – "en" | "am" | "sid" (default: "en")
 */
export async function getVipServiceSlots(req, res) {
  try {
    const { id } = req.params;
    const locale = req.query.locale || "en";

    // 1. Verify service and provider active state
    const service = await prisma.service.findFirst({
      where: {
        id,
        isActive: true,
        provider: { isActive: true },
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            code: true,
            icon: true,
            contactPhone: true,
            isActive: true,
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({
        error: "VIP service not found, deactivated, or its provider institution is inactive.",
      });
    }

    // 2. Resolve requested date
    let targetDateStr = req.query.date ? req.query.date.trim() : null;
    const localNow = getLocalNow();
    const todayStr = formatLocalDate(localNow);

    if (targetDateStr) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDateStr)) {
        return res.status(400).json({
          error: "Invalid date format. Expected 'YYYY-MM-DD' (e.g. 2026-10-23).",
        });
      }
    } else {
      // Default to today if within working window, otherwise next eligible slot's date
      targetDateStr = todayStr;
    }

    // 3. Evaluate working day rules
    const workingInfo = checkIsWorkingDay(targetDateStr);
    const dayTimeSlots = generateDayTimeSlots();

    // 4. Fetch persisted bookings from database for capacity calculation
    const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`);

    const bookedTickets = await prisma.vip_tickets.findMany({
      where: {
        ...getServiceTicketWhere(service.id),
        slotDate: { gte: startOfDay, lte: endOfDay },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: {
        id: true,
        slotTime: true,
        status: true,
      },
    });

    const bookedCounts = {};
    for (const t of bookedTickets) {
      bookedCounts[t.slotTime] = (bookedCounts[t.slotTime] || 0) + 1;
    }

    // 5. Construct time slot capacity map
    let availableSlotsCount = 0;
    const slots = dayTimeSlots.map((slot) => {
      const booked = bookedCounts[slot.slotTime] || 0;
      const capacity = VIP_SCHEDULE_CONFIG.DEFAULT_SLOT_CAPACITY;
      const remaining = Math.max(0, capacity - booked);
      const past = isSlotInPast(targetDateStr, slot.slotTime);
      const isAvailable = workingInfo.isWorkingDay && remaining > 0 && !past;

      if (isAvailable) availableSlotsCount++;

      return {
        slotTime: slot.slotTime,
        startTime: slot.startTime,
        endTime: slot.endTime,
        label: slot.label,
        capacity,
        booked,
        remaining,
        isAvailable,
        isPast: past,
        reason: !workingInfo.isWorkingDay
          ? workingInfo.reason
          : past
          ? "Time slot has passed"
          : remaining === 0
          ? "Slot at full capacity"
          : null,
      };
    });

    // 6. Find next eligible slot if requested date is non-working, past, or fully booked
    const nextEligibleSlot = await findNextEligibleSlot(service.id, targetDateStr);

    return res.json({
      service: {
        id: service.id,
        title: localize(service.title, locale),
        estimatedFee: service.estimatedFee,
        vipFee: 1000,
        currency: "ETB",
        institution: {
          id: service.provider.id,
          code: service.provider.code,
          name: localize(service.provider.name, locale),
          icon: service.provider.icon,
        },
      },
      schedule: {
        date: targetDateStr,
        dayOfWeek: workingInfo.dayOfWeek,
        dayName: workingInfo.dayName,
        isWorkingDay: workingInfo.isWorkingDay,
        nonWorkingReason: workingInfo.reason,
        workingHours: VIP_SCHEDULE_CONFIG.WORKING_HOURS,
        slotDurationMinutes: VIP_SCHEDULE_CONFIG.SLOT_DURATION_MINUTES,
        totalSlots: slots.length,
        availableSlots: availableSlotsCount,
        timezone: VIP_SCHEDULE_CONFIG.TIMEZONE,
        nextEligibleSlot,
      },
      slots,
    });
  } catch (err) {
    console.error("[vip-schedule] getVipServiceSlots error:", err);
    return res.status(500).json({ error: "Failed to retrieve VIP service time slots." });
  }
}

/**
 * GET /api/services/:id/vip-dates
 *
 * Returns upcoming VIP booking calendar dates with working status and overall slot availability.
 * Query params:
 *   days   – integer (default: 14, max: 30)
 *   locale – "en" | "am" | "sid" (default: "en")
 */
export async function getVipServiceDates(req, res) {
  try {
    const { id } = req.params;
    const locale = req.query.locale || "en";
    const requestedDays = parseInt(req.query.days, 10);
    const windowDays = Number.isFinite(requestedDays) && requestedDays > 0 ? Math.min(requestedDays, 30) : VIP_SCHEDULE_CONFIG.BOOKING_WINDOW_DAYS;

    const service = await prisma.service.findFirst({
      where: {
        id,
        isActive: true,
        provider: { isActive: true },
      },
      select: {
        id: true,
        title: true,
        provider: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!service) {
      return res.status(404).json({
        error: "VIP service not found, deactivated, or its provider institution is inactive.",
      });
    }

    const localNow = getLocalNow();
    const todayStr = formatLocalDate(localNow);
    const [startYear, startMonth, startDay] = todayStr.split("-").map(Number);
    const baseDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 12, 0, 0));

    const endDate = new Date(baseDate.getTime() + windowDays * 86400000);
    const rangeStart = new Date(`${todayStr}T00:00:00.000Z`);
    const rangeEnd = new Date(`${formatLocalDate(endDate)}T23:59:59.999Z`);

    // Fetch all active tickets in the requested calendar window
    const bookedTickets = await prisma.vip_tickets.findMany({
      where: {
        ...getServiceTicketWhere(service.id),
        slotDate: { gte: rangeStart, lte: rangeEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { slotDate: true, slotTime: true },
    });

    const bookedByDateAndTime = {};
    for (const t of bookedTickets) {
      const dStr = formatLocalDate(new Date(t.slotDate));
      if (!bookedByDateAndTime[dStr]) bookedByDateAndTime[dStr] = {};
      bookedByDateAndTime[dStr][t.slotTime] = (bookedByDateAndTime[dStr][t.slotTime] || 0) + 1;
    }

    const daySlotsTemplate = generateDayTimeSlots();
    const totalSlotsPerDay = daySlotsTemplate.length;
    const dailyTotalCapacity = totalSlotsPerDay * VIP_SCHEDULE_CONFIG.DEFAULT_SLOT_CAPACITY;

    const dates = [];
    for (let offset = 0; offset < windowDays; offset++) {
      const candidateDate = new Date(baseDate.getTime() + offset * 86400000);
      const dateStr = formatLocalDate(candidateDate);
      const workingInfo = checkIsWorkingDay(dateStr);
      const dayBookings = bookedByDateAndTime[dateStr] || {};

      let dayAvailableSlotsCount = 0;
      let dayBookedTotal = 0;

      if (workingInfo.isWorkingDay) {
        for (const slot of daySlotsTemplate) {
          const booked = dayBookings[slot.slotTime] || 0;
          dayBookedTotal += booked;
          const past = isSlotInPast(dateStr, slot.slotTime);
          const remaining = Math.max(0, VIP_SCHEDULE_CONFIG.DEFAULT_SLOT_CAPACITY - booked);
          if (!past && remaining > 0) {
            dayAvailableSlotsCount++;
          }
        }
      }

      dates.push({
        date: dateStr,
        dayOfWeek: workingInfo.dayOfWeek,
        dayName: workingInfo.dayName,
        isWorkingDay: workingInfo.isWorkingDay,
        reason: workingInfo.reason,
        totalSlots: totalSlotsPerDay,
        availableSlots: dayAvailableSlotsCount,
        hasAvailability: dayAvailableSlotsCount > 0,
        slotCapacity: VIP_SCHEDULE_CONFIG.DEFAULT_SLOT_CAPACITY,
        dailyCapacity: dailyTotalCapacity,
        dailyBooked: dayBookedTotal,
      });
    }

    return res.json({
      serviceId: service.id,
      serviceTitle: localize(service.title, locale),
      bookingWindowDays: windowDays,
      timezone: VIP_SCHEDULE_CONFIG.TIMEZONE,
      dates,
    });
  } catch (err) {
    console.error("[vip-schedule] getVipServiceDates error:", err);
    return res.status(500).json({ error: "Failed to retrieve VIP service available dates." });
  }
}
