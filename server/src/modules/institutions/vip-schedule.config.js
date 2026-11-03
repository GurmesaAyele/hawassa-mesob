/**
 * VIP Scheduling & Capacity Configuration — Phase 2
 *
 * Provisional Configuration Parameters (Pending Official Center Confirmation):
 * - Operating Hours: 08:00 - 17:00 (provisional)
 * - Working Days: Monday to Friday (1 to 5) (provisional; Saturday morning TBD)
 * - Slot Duration: 30 minutes (provisional)
 * - Slot Capacity: 5 concurrent citizens per slot per service (provisional)
 * - Booking Advance Window: 14 days (provisional)
 * - Timezone: Africa/Addis_Ababa (UTC+3, Ethiopian local time)
 *
 * All scheduling and capacity rules are centralized here so they can be adjusted
 * or backed by database configuration without rewriting availability/booking logic.
 */

export const VIP_SCHEDULE_CONFIG = Object.freeze({
  WORKING_HOURS: Object.freeze({
    start: "08:00",
    end: "17:00",
  }),

  // Day indices in JavaScript Date (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  WORKING_DAYS: Object.freeze([1, 2, 3, 4, 5]),

  SLOT_DURATION_MINUTES: 30,

  DEFAULT_SLOT_CAPACITY: 5,

  BOOKING_WINDOW_DAYS: 14,

  // Provisional list of official Ethiopian national public holidays (YYYY-MM-DD)
  HOLIDAYS: Object.freeze([
    "2026-01-07", // Ethiopian Christmas (Genna)
    "2026-01-19", // Epiphany (Timket)
    "2026-03-02", // Victory of Adwa
    "2026-05-01", // International Labor Day
    "2026-05-05", // Patriots' Victory Day
    "2026-09-11", // Ethiopian New Year (Enkutatash)
    "2026-09-27", // Finding of True Cross (Meskel)
  ]),

  TIMEZONE: "Africa/Addis_Ababa",
});

/**
 * Returns current Date in local Ethiopian Time (UTC+3).
 */
export function getLocalNow() {
  const now = new Date();
  // Format to Africa/Addis_Ababa string and re-parse to ensure accurate local offset
  const localStr = now.toLocaleString("en-US", { timeZone: VIP_SCHEDULE_CONFIG.TIMEZONE });
  return new Date(localStr);
}

/**
 * Converts a Date object to "YYYY-MM-DD" in Africa/Addis_Ababa timezone.
 */
export function formatLocalDate(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIP_SCHEDULE_CONFIG.TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts; // Returns YYYY-MM-DD
}

/**
 * Checks if a given YYYY-MM-DD string is a working day.
 */
export function checkIsWorkingDay(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayOfWeek = d.getUTCDay();

  if (!VIP_SCHEDULE_CONFIG.WORKING_DAYS.includes(dayOfWeek)) {
    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek];
    return { isWorkingDay: false, reason: `Weekend (${dayName})`, dayOfWeek, dayName };
  }

  if (VIP_SCHEDULE_CONFIG.HOLIDAYS.includes(dateStr)) {
    return { isWorkingDay: false, reason: "Official Public Holiday", dayOfWeek, dayName: getDayName(dayOfWeek) };
  }

  return { isWorkingDay: true, reason: null, dayOfWeek, dayName: getDayName(dayOfWeek) };
}

function getDayName(dayIndex) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex] || "";
}

/**
 * Generates regular time slots between start and end hours.
 * E.g., ["08:00", "08:30", ..., "16:30"]
 */
export function generateDayTimeSlots(
  startStr = VIP_SCHEDULE_CONFIG.WORKING_HOURS.start,
  endStr = VIP_SCHEDULE_CONFIG.WORKING_HOURS.end,
  durationMinutes = VIP_SCHEDULE_CONFIG.SLOT_DURATION_MINUTES
) {
  const slots = [];
  const [startHour, startMin] = startStr.split(":").map(Number);
  const [endHour, endMin] = endStr.split(":").map(Number);

  let currentTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = endHour * 60 + endMin;

  while (currentTotalMinutes + durationMinutes <= endTotalMinutes) {
    const slotHour = Math.floor(currentTotalMinutes / 60);
    const slotMin = currentTotalMinutes % 60;
    const nextTotal = currentTotalMinutes + durationMinutes;
    const endSlotHour = Math.floor(nextTotal / 60);
    const endSlotMin = nextTotal % 60;

    const timeString = `${String(slotHour).padStart(2, "0")}:${String(slotMin).padStart(2, "0")}`;
    const endTimeString = `${String(endSlotHour).padStart(2, "0")}:${String(endSlotMin).padStart(2, "0")}`;

    slots.push({
      slotTime: timeString,
      startTime: timeString,
      endTime: endTimeString,
      label: `${timeString} - ${endTimeString}`,
    });

    currentTotalMinutes += durationMinutes;
  }

  return slots;
}

/**
 * Checks if a specific date and time slot has already passed in the local timezone.
 */
export function isSlotInPast(dateStr, slotTimeStr) {
  const localNow = getLocalNow();
  const todayStr = formatLocalDate(localNow);

  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  const currentHour = localNow.getHours();
  const currentMin = localNow.getMinutes();
  const currentTotalMins = currentHour * 60 + currentMin;

  const [slotHour, slotMin] = slotTimeStr.split(":").map(Number);
  const slotTotalMins = slotHour * 60 + slotMin;

  return slotTotalMins <= currentTotalMins;
}
