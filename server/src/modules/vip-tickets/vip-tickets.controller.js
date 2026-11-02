import crypto from "node:crypto";
import rateLimit from "express-rate-limit";
import prisma from "../../config/db.js";
import {
  getVipServiceConfig,
  calculateVipApplicationFee,
  VIP_CONFIG,
} from "../institutions/vip.config.js";

/**
 * Dedicated Rate Limiter for Application Tracking.
 * Protects against brute-force enumeration of application references and phone numbers.
 * Limit: 20 tracking attempts per minute per IP.
 */
export const trackRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    error: "Too many tracking requests. Please wait a minute before trying again.",
  },
});

/**
 * Generate a unique, readable VIP application ticket code.
 * Follows the existing MESOB VIP ticket naming convention (e.g. VIP-845123-A4B2).
 */
async function getUniqueTicketCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const timestampPart = Date.now().toString().slice(-6);
    const randomHex = crypto.randomBytes(2).toString("hex").toUpperCase();
    const candidate = `VIP-${timestampPart}-${randomHex}`;

    const existing = await prisma.vip_tickets.findUnique({
      where: { ticketCode: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }

  // Fallback high-entropy code in the rare event of collision
  return `VIP-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

/**
 * Normalize and validate Ethiopian or international phone numbers.
 * Supports: 0912345678, 0712345678, +251912345678, +251712345678, 251912345678, etc.
 */
export function normalizePhoneNumber(phone) {
  if (typeof phone !== "string") return null;
  const cleaned = phone.trim().replace(/[\s\-()]/g, "");

  // Ethiopian mobile regex: 09/07 or +2519/+2517 with 8 trailing digits
  const ethioPhoneRegex = /^(\+?251|0)?[79]\d{8}$/;
  // General E.164-compatible pattern (9 to 15 digits)
  const generalPhoneRegex = /^\+?[0-9]{9,15}$/;

  if (ethioPhoneRegex.test(cleaned) || generalPhoneRegex.test(cleaned)) {
    return cleaned;
  }
  return null;
}

/**
 * Compares two phone numbers for identity match.
 * Intelligently recognizes Ethiopian mobile equivalence between local (09...)
 * and international (+2519... / 2519...) formats by checking the trailing 9 digits.
 */
export function arePhoneNumbersMatching(phoneA, phoneB) {
  if (!phoneA || !phoneB) return false;
  const normA = phoneA.replace(/[\s\-()]/g, "");
  const normB = phoneB.replace(/[\s\-()]/g, "");

  if (normA === normB) return true;

  // Ethiopian mobile numbers have 9 core digits (e.g. 912345678)
  const last9A = normA.slice(-9);
  const last9B = normB.slice(-9);
  if (last9A.length === 9 && last9B.length === 9 && last9A === last9B) {
    return true;
  }

  return false;
}

/**
 * Masks a phone number to protect citizen PII.
 * Example: "0912345678" -> "09****5678", "+251912345678" -> "+2519****5678"
 */
export function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== "string") return "";
  const cleaned = phone.trim().replace(/[\s\-()]/g, "");
  if (cleaned.length <= 4) return "****";

  const prefixLength = cleaned.startsWith("+251") ? 5 : cleaned.startsWith("251") ? 4 : 2;
  const suffixLength = 4;

  if (cleaned.length <= prefixLength + suffixLength) {
    return cleaned.slice(0, 2) + "****" + cleaned.slice(-2);
  }

  const prefix = cleaned.slice(0, prefixLength);
  const suffix = cleaned.slice(-suffixLength);
  return `${prefix}****${suffix}`;
}

/**
 * Masks a citizen's full name to protect personal identity.
 * Example: "Abebe Kebede" -> "Abebe K."
 */
export function maskName(name) {
  if (!name || typeof name !== "string") return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].length > 2
      ? parts[0][0] + "*".repeat(Math.min(parts[0].length - 2, 4)) + parts[0].slice(-1)
      : parts[0];
  }
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/**
 * Formats a VIP ticket application record into the standard API response structure,
 * returning selected services as an array and protecting citizen PII and internal secrets.
 *
 * @param {Object} ticket - Database ticket record
 * @param {Array<Object>} [fallbackServices=[]] - Pre-fetched services if join relation is not yet hydrated
 */
function formatVipApplication(ticket, fallbackServices = []) {
  // If ticket_services join relation is present, extract the related services
  let services = [];
  if (Array.isArray(ticket.ticket_services) && ticket.ticket_services.length > 0) {
    services = ticket.ticket_services
      .map((ts) => ts.service)
      .filter(Boolean);
  } else if (fallbackServices && fallbackServices.length > 0) {
    services = fallbackServices;
  } else if (ticket.services) {
    services = [ticket.services];
  }

  const formattedServices = services.map((s) => ({
    id: s.id,
    title: s.title,
    estimatedFee: s.estimatedFee,
    processingDays: s.processingDays,
    isActive: s.isActive,
    provider: s.provider
      ? {
        id: s.provider.id,
        code: s.provider.code,
        name: s.provider.name,
        icon: s.provider.icon,
        floorRoomNumber: s.provider.floorRoomNumber,
      }
      : null,
  }));

  const fee =
    ticket.vipFee !== undefined && ticket.vipFee !== null
      ? ticket.vipFee
      : VIP_CONFIG.DEFAULT_FEE;
  const currency = ticket.currency || VIP_CONFIG.DEFAULT_CURRENCY;

  // Structure appointment details
  const appointment = ticket.slotDate
    ? {
      isAssigned: true,
      status: "ASSIGNED",
      slotDate: ticket.slotDate,
      slotTime: ticket.slotTime || null,
      message: "Appointment slot confirmed. Please arrive 10 minutes prior to your scheduled time.",
    }
    : {
      isAssigned: false,
      status: "UNASSIGNED",
      slotDate: null,
      slotTime: null,
      message: "Appointment has not been scheduled yet. Your application is currently under review.",
    };

  // Structure walk-in queue details
  // An application reference alone is NOT a confirmed queue position.
  // Physical check-in at the center is required to receive a queue position and queue number.
  const queue = ticket.queueNumber
    ? {
      isQueued: true,
      queueNumber: ticket.queueNumber,
      queueDisplay: `VIP-${String(ticket.queueNumber).padStart(3, "0")}`,
      queueDate: ticket.queueDate,
      checkedInAt: ticket.checkedInAt,
      servedAt: ticket.servedAt || null,
      completedAt: ticket.completedAt || null,
      message: "Customer has physically checked in and is active in the priority walk-in queue.",
    }
    : {
      isQueued: false,
      queueNumber: null,
      queueDisplay: null,
      queueDate: null,
      checkedInAt: null,
      servedAt: null,
      completedAt: null,
      message: "Application reference only. Not yet in queue. Physical check-in at Hawassa MESOB Center is required to join the priority walk-in queue.",
    };

  // Parse capacity reservation status if held in PENDING status
  let capacityReservation = null;
  if (ticket.status === "PENDING" && ticket.paymentRef) {
    try {
      const parsed = JSON.parse(ticket.paymentRef);
      if (parsed && parsed.type === "CAPACITY_RESERVATION") {
        const expiresAt = new Date(parsed.expiresAt);
        const now = new Date();
        const isExpired = expiresAt <= now;
        capacityReservation = {
          hasActiveReservation: !isExpired,
          isExpired,
          reservedAt: parsed.reservedAt,
          expiresAt: parsed.expiresAt,
          expiresInSeconds: isExpired ? 0 : Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000)),
          queueDate: parsed.date,
        };
      }
    } catch {
      // not a capacity reservation JSON payload
    }
  }

  return {
    reference: ticket.ticketCode,
    status: ticket.status,
    purpose: ticket.purpose,
    serviceCount: formattedServices.length,
    services: formattedServices,
    service: formattedServices[0] || null,
    vipFee: fee,
    currency,
    isFlatFee: true,
    maskedPhone: maskPhoneNumber(ticket.citizenPhone),
    maskedCitizenName: maskName(ticket.citizenName),
    appointment,
    queue,
    capacityReservation,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

/**
 * Standard Prisma include clause that safely includes join relations
 * when generated client contains `vip_ticket_services`.
 */
function getTicketQueryInclude() {
  return {
    services: {
      include: {
        provider: true,
      },
    },
    ...(prisma.vip_ticket_services
      ? {
        ticket_services: {
          include: {
            service: {
              include: {
                provider: true,
              },
            },
          },
        },
      }
      : {}),
  };
}

/**
 * POST /api/vip-tickets
 * Customer submits a VIP application with one or more services.
 */
export async function submitVipApplication(req, res) {
  try {
    const { citizenName, citizenPhone, purpose, serviceIds, serviceId } =
      req.body || {};

    // ─── 1. Field-level Validations ─────────────────────────────────────────
    if (!citizenName || typeof citizenName !== "string" || !citizenName.trim()) {
      return res.status(400).json({
        error: "Validation failed: 'citizenName' is required.",
      });
    }

    const trimmedCitizenName = citizenName.trim();
    if (trimmedCitizenName.length < 2 || trimmedCitizenName.length > 150) {
      return res.status(400).json({
        error: "Validation failed: 'citizenName' must be between 2 and 150 characters.",
      });
    }

    if (!citizenPhone || typeof citizenPhone !== "string" || !citizenPhone.trim()) {
      return res.status(400).json({
        error: "Validation failed: 'citizenPhone' is required.",
      });
    }

    const normalizedPhone = normalizePhoneNumber(citizenPhone);
    if (!normalizedPhone) {
      return res.status(400).json({
        error: "Validation failed: 'citizenPhone' must be a valid phone number (e.g. 0912345678 or +251912345678).",
      });
    }

    if (!purpose || typeof purpose !== "string" || !purpose.trim()) {
      return res.status(400).json({
        error: "Validation failed: 'purpose' is required.",
      });
    }

    const trimmedPurpose = purpose.trim();
    if (trimmedPurpose.length < 3 || trimmedPurpose.length > 1000) {
      return res.status(400).json({
        error: "Validation failed: 'purpose' must be between 3 and 1000 characters.",
      });
    }

    // ─── 2. Service IDs Resolution & Deduplication ──────────────────────────
    let rawServiceIds = [];
    if (Array.isArray(serviceIds)) {
      rawServiceIds = serviceIds;
    } else if (typeof serviceId === "string" && serviceId.trim()) {
      rawServiceIds = [serviceId.trim()];
    } else {
      return res.status(400).json({
        error: "Validation failed: 'serviceIds' must be a non-empty array of service IDs.",
      });
    }

    if (rawServiceIds.length === 0) {
      return res.status(400).json({
        error: "Validation failed: 'serviceIds' must contain at least one service ID.",
      });
    }

    const uniqueServiceIds = [];
    const seenIds = new Set();
    for (let i = 0; i < rawServiceIds.length; i++) {
      const sId = rawServiceIds[i];
      if (!sId || typeof sId !== "string" || !sId.trim()) {
        return res.status(400).json({
          error: `Validation failed: serviceIds[${i}] must be a non-empty string ID.`,
        });
      }
      const trimmedId = sId.trim();
      if (seenIds.has(trimmedId)) {
        return res.status(400).json({
          error: `Validation failed: Duplicate service ID '${trimmedId}' found in 'serviceIds'. Each service may only be selected once per application.`,
        });
      }
      seenIds.add(trimmedId);
      uniqueServiceIds.push(trimmedId);
    }

    // ─── 3. Service & Institution Verification ─────────────────────────────
    const services = await prisma.service.findMany({
      where: {
        id: { in: uniqueServiceIds },
      },
      include: {
        provider: true,
      },
    });

    if (services.length !== uniqueServiceIds.length) {
      const foundMap = new Set(services.map((s) => s.id));
      const missing = uniqueServiceIds.filter((id) => !foundMap.has(id));
      return res.status(404).json({
        error: `The following requested service(s) do not exist in the catalog: ${missing.join(", ")}.`,
      });
    }

    const serviceMap = new Map(services.map((s) => [s.id, s]));
    const orderedServices = uniqueServiceIds.map((id) => serviceMap.get(id));

    for (const service of orderedServices) {
      const serviceTitle = service.title?.en || service.id;

      if (!service.isActive) {
        return res.status(400).json({
          error: `Service '${serviceTitle}' (${service.id}) is currently inactive and not accepting VIP applications.`,
        });
      }

      if (!service.provider || !service.provider.isActive) {
        const providerName = service.provider?.name?.en || "Unknown";
        return res.status(400).json({
          error: `The institution '${providerName}' providing service '${serviceTitle}' is currently inactive and not accepting VIP applications.`,
        });
      }

      const vipConfig = getVipServiceConfig(service, service.provider);
      if (!vipConfig.vipAvailable) {
        return res.status(400).json({
          error: `Service '${serviceTitle}' (${service.id}) is not eligible for VIP service.`,
        });
      }
    }

    // Check for an existing active application from this phone number.

    const phoneSuffix = normalizedPhone.slice(-9);

    const activeApplications = await prisma.vip_tickets.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        citizenPhone: {
          endsWith: phoneSuffix,
        },
      },
      include: getTicketQueryInclude(),
    });


    const requestedServiceIds = [...uniqueServiceIds].sort();

    const duplicate = activeApplications.find((application) => {
      if (
        !arePhoneNumbersMatching(
          application.citizenPhone,
          normalizedPhone
        )
      ) {
        return false;
      }

      const existingServiceIds = [
        ...new Set([
          ...(application.ticket_services || []).map(
            (item) => item.serviceId
          ),
          ...(application.serviceId ? [application.serviceId] : []),
        ]),
      ].sort();

      return (
        existingServiceIds.length === requestedServiceIds.length &&
        existingServiceIds.every(
          (id, index) => id === requestedServiceIds[index]
        )
      );
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: "An active VIP application already exists for this phone number and selected services.",
        data: {
          reference: duplicate.ticketCode,
          status: duplicate.status,
        },
      });
    }

    // ─── 4. Authoritative Fee Calculation (Flat 1000 ETB) ───────────────────
    const { vipFee, currency } = calculateVipApplicationFee(orderedServices);

    // ─── 5. Atomic Application Creation in Prisma Transaction ──────────────
    const ticketCode = await getUniqueTicketCode();
    const ticketId = crypto.randomUUID();
    const now = new Date();

    const createdTicket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.vip_tickets.create({
        data: {
          id: ticketId,
          ticketCode,
          citizenName: trimmedCitizenName,
          citizenPhone: normalizedPhone,
          serviceId: orderedServices[0].id,
          purpose: trimmedPurpose,
          slotDate: null,
          slotTime: null,
          status: "PENDING",
          paymentRef: null,
          qrCodeUrl: null,
          vipFee,
          currency,
          createdAt: now,
          updatedAt: now,
        },
      });

      if (tx.vip_ticket_services) {
        for (const s of orderedServices) {
          await tx.vip_ticket_services.create({
            data: {
              id: crypto.randomUUID(),
              ticketId: ticket.id,
              serviceId: s.id,
              createdAt: now,
            },
          });
        }
      }

      return ticket;
    });

    const responseData = formatVipApplication(createdTicket, orderedServices);

    return res.status(201).json({
      success: true,
      message: `VIP ticket application for ${orderedServices.length} service(s) submitted successfully. Total flat fee: ${vipFee} ${currency}. Application is pending review.`,
      data: responseData,
    });
  } catch (err) {
    console.error("[vip-tickets] submitVipApplication error:", err);
    return res.status(500).json({
      error: "Failed to submit VIP application. Please try again later.",
    });
  }
}

/**
 * POST /api/vip-tickets/track
 *
 * Phase 4: Customer Application Tracking Endpoint.
 *
 * Accepts application reference and registered phone number.
 * Verifies that both reference and phone match the same record.
 * Returns application status, purpose, selected services, flat fee, and appointment info.
 *
 * Security:
 * - Does not return full phone numbers, internal database IDs, or payment secrets.
 * - Uses consistent 404 response for both unknown references and phone mismatches to prevent enumeration.
 */
export async function trackVipApplication(req, res) {
  try {
    const { reference, ticketCode, phone, citizenPhone } = req.body || {};

    const rawReference = reference || ticketCode;
    const rawPhone = phone || citizenPhone;

    // 1. Validate inputs
    if (!rawReference || typeof rawReference !== "string" || !rawReference.trim()) {
      return res.status(400).json({
        error: "Validation failed: 'reference' is required.",
      });
    }

    if (!rawPhone || typeof rawPhone !== "string" || !rawPhone.trim()) {
      return res.status(400).json({
        error: "Validation failed: 'phone' is required.",
      });
    }

    const normalizedPhone = normalizePhoneNumber(rawPhone);
    if (!normalizedPhone) {
      return res.status(400).json({
        error: "Validation failed: 'phone' must be a valid phone number (e.g. 0912345678 or +251912345678).",
      });
    }

    const cleanRef = rawReference.trim();

    // 2. Query ticket by ticketCode / reference
    const ticket = await prisma.vip_tickets.findFirst({
      where: {
        OR: [
          { ticketCode: cleanRef },
          { id: cleanRef },
        ],
      },
      include: getTicketQueryInclude(),
    });

    // 3. Security: Consistent 404 response for both unknown reference and phone mismatch
    if (!ticket || !arePhoneNumbersMatching(ticket.citizenPhone, normalizedPhone)) {
      return res.status(404).json({
        error: "No matching VIP application found with the provided reference and phone number.",
      });
    }

    // 4. Return safe tracking details
    return res.status(200).json({
      success: true,
      data: formatVipApplication(ticket),
    });
  } catch (err) {
    console.error("[vip-tickets] trackVipApplication error:", err);
    return res.status(500).json({
      error: "Failed to track VIP application. Please try again later.",
    });
  }
}

/**
 * GET /api/vip-tickets/:id
 * Retrieve a VIP application by primary ID with masked PII.
 */
export async function getVipTicketById(req, res) {
  try {
    const { id } = req.params;

    const ticket = await prisma.vip_tickets.findUnique({
      where: { id },
      include: getTicketQueryInclude(),
    });

    if (!ticket) {
      return res.status(404).json({
        error: `VIP ticket application '${id}' not found.`,
      });
    }

    return res.json({
      success: true,
      data: formatVipApplication(ticket),
    });
  } catch (err) {
    console.error("[vip-tickets] getVipTicketById error:", err);
    return res.status(500).json({
      error: "Failed to retrieve VIP application.",
    });
  }
}

/**
 * GET /api/vip-tickets/reference/:code
 * Retrieve a VIP application by reference / ticketCode with masked PII.
 */
export async function getVipTicketByReference(req, res) {
  try {
    const { code } = req.params;

    const ticket = await prisma.vip_tickets.findUnique({
      where: { ticketCode: code },
      include: getTicketQueryInclude(),
    });

    if (!ticket) {
      return res.status(404).json({
        error: `VIP ticket application with reference '${code}' not found.`,
      });
    }

    return res.json({
      success: true,
      data: formatVipApplication(ticket),
    });
  } catch (err) {
    console.error("[vip-tickets] getVipTicketByReference error:", err);
    return res.status(500).json({
      error: "Failed to retrieve VIP application.",
    });
  }
}

/**
 * GET /api/vip-tickets
 * List VIP applications with optional query filters (status, phone, serviceId).
 * Masked PII to protect citizen privacy.
 */
export async function listVipTickets(req, res) {
  try {
    const { status, phone, serviceId, limit = 50, page = 1 } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (phone) {
      where.citizenPhone = { contains: phone.trim() };
    }
    if (serviceId) {
      const sId = serviceId.trim();
      if (prisma.vip_ticket_services) {
        where.OR = [
          { serviceId: sId },
          { ticket_services: { some: { serviceId: sId } } },
        ];
      } else {
        where.serviceId = sId;
      }
    }

    const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const skip = Math.max((parseInt(page, 10) || 1) - 1, 0) * take;

    const [tickets, totalCount] = await Promise.all([
      prisma.vip_tickets.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: "desc" },
        include: getTicketQueryInclude(),
      }),
      prisma.vip_tickets.count({ where }),
    ]);

    const formatted = tickets.map((t) => formatVipApplication(t));

    return res.json({
      success: true,
      data: formatted,
      meta: {
        total: totalCount,
        page: parseInt(page, 10) || 1,
        limit: take,
        totalPages: Math.ceil(totalCount / take),
      },
    });
  } catch (err) {
    console.error("[vip-tickets] listVipTickets error:", err);
    return res.status(500).json({
      error: "Failed to retrieve VIP applications.",
    });
  }
}
