/**
 * VIP Queue Configuration — Walk-in Priority Queue
 *
 * This module centralises all VIP queue capacity and availability rules.
 * It is intentionally separate from the appointment-based vip-schedule.config.js
 * because the VIP queue operates as a walk-in priority system, not an
 * appointment-booking system.
 *
 * Configuration Parameters (Provisional — Pending Official Center Confirmation):
 *
 * - DAILY_VIP_CAPACITY: Maximum number of VIP customers the center can serve
 *   per working day across all services. This is a global cap, not per-service.
 *   Set conservatively until the center confirms actual throughput.
 *
 * - ESTIMATED_SERVICE_MINUTES: Estimated average service duration per VIP
 *   customer in minutes. This is unknown and cannot be reliably estimated
 *   until real operational data is collected. Set to null to indicate that
 *   waiting-time estimation is not yet possible.
 *
 * - QUEUE_OPEN_TIME / QUEUE_CLOSE_TIME: The window during which customers
 *   can join the VIP queue. Outside this window, the queue is closed.
 *
 * - WORKING_DAYS: Inherited from vip-schedule.config.js for consistency.
 *
 * - TIMEZONE: Africa/Addis_Ababa (UTC+3).
 */

import {
  VIP_SCHEDULE_CONFIG,
  getLocalNow,
  formatLocalDate,
  checkIsWorkingDay,
} from "../institutions/vip-schedule.config.js";

export const VIP_QUEUE_CONFIG = Object.freeze({
  /**
   * Maximum VIP customers that can be accepted into the queue per working day.
   * This is a center-wide daily cap. When this number is reached, the VIP
   * queue is closed for the day.
   *
   * Configurable via VIP_DAILY_CAPACITY environment variable.
   * Provisional default value: 30 customers/day (pending official MESOB confirmation).
   */
  DAILY_VIP_CAPACITY: parseInt(process.env.VIP_DAILY_CAPACITY, 10) || 30,

  /**
   * Reservation hold duration in minutes.
   * Capacity is temporarily reserved for this duration while the customer proceeds to payment.
   * If payment is not completed before this duration expires, capacity is released automatically.
   *
   * Configurable via VIP_RESERVATION_HOLD_MINUTES environment variable.
   * Default: 15 minutes.
   */
  RESERVATION_HOLD_MINUTES: parseInt(process.env.VIP_RESERVATION_HOLD_MINUTES, 10) || 15,

  /**
   * Estimated average service duration in minutes per VIP customer.
   *
   * Set strictly to null because no real operational data exists yet.
   * Waiting-time countdowns or arbitrary durations must not be invented.
   * When reliable service-duration data is collected, this can be updated.
   */
  ESTIMATED_SERVICE_MINUTES: null,

  /**
   * Minimum number of completed services with valid timestamps recorded today
   * required to compute an empirical rolling average duration.
   * If fewer completed samples exist, waitingTime is reported as unavailable.
   */
  MIN_COMPLETED_SAMPLES_FOR_ESTIMATE: 3,

  /**
   * Time window during which customers can join the VIP queue.
   * Format: "HH:MM" in Africa/Addis_Ababa timezone.
   */
  QUEUE_OPEN_TIME: process.env.VIP_QUEUE_OPEN_TIME || "08:00",
  QUEUE_CLOSE_TIME: process.env.VIP_QUEUE_CLOSE_TIME || "16:00",

  /**
   * Working days (inherited from schedule config for consistency).
   */
  WORKING_DAYS: VIP_SCHEDULE_CONFIG.WORKING_DAYS,

  /**
   * Holidays (inherited from schedule config for consistency).
   */
  HOLIDAYS: VIP_SCHEDULE_CONFIG.HOLIDAYS,

  TIMEZONE: VIP_SCHEDULE_CONFIG.TIMEZONE,
});

/**
 * Determines whether the VIP queue is currently within operating hours.
 *
 * @returns {{ isOpen: boolean, reason: string|null, currentTime: string, openTime: string, closeTime: string }}
 */
export function isQueueWithinOperatingHours() {
  const localNow = getLocalNow();
  const currentHour = localNow.getHours();
  const currentMin = localNow.getMinutes();
  const currentTotal = currentHour * 60 + currentMin;

  const [openH, openM] = VIP_QUEUE_CONFIG.QUEUE_OPEN_TIME.split(":").map(Number);
  const [closeH, closeM] = VIP_QUEUE_CONFIG.QUEUE_CLOSE_TIME.split(":").map(Number);
  const openTotal = openH * 60 + openM;
  const closeTotal = closeH * 60 + closeM;

  const currentTime = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;

  if (currentTotal < openTotal) {
    return {
      isOpen: false,
      reason: `VIP queue opens at ${VIP_QUEUE_CONFIG.QUEUE_OPEN_TIME}. Current time: ${currentTime}.`,
      currentTime,
      openTime: VIP_QUEUE_CONFIG.QUEUE_OPEN_TIME,
      closeTime: VIP_QUEUE_CONFIG.QUEUE_CLOSE_TIME,
    };
  }

  if (currentTotal >= closeTotal) {
    return {
      isOpen: false,
      reason: `VIP queue closed for today at ${VIP_QUEUE_CONFIG.QUEUE_CLOSE_TIME}. Please return tomorrow.`,
      currentTime,
      openTime: VIP_QUEUE_CONFIG.QUEUE_OPEN_TIME,
      closeTime: VIP_QUEUE_CONFIG.QUEUE_CLOSE_TIME,
    };
  }

  return {
    isOpen: true,
    reason: null,
    currentTime,
    openTime: VIP_QUEUE_CONFIG.QUEUE_OPEN_TIME,
    closeTime: VIP_QUEUE_CONFIG.QUEUE_CLOSE_TIME,
  };
}

/**
 * Checks whether today is a working day.
 *
 * @returns {{ isWorkingDay: boolean, reason: string|null, todayStr: string, dayName: string }}
 */
export function isTodayWorkingDay() {
  const localNow = getLocalNow();
  const todayStr = formatLocalDate(localNow);
  const info = checkIsWorkingDay(todayStr);

  return {
    isWorkingDay: info.isWorkingDay,
    reason: info.reason,
    todayStr,
    dayName: info.dayName,
  };
}
