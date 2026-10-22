import crypto from "node:crypto";
import prisma from "../../config/db.js";
import {
  getVipServiceConfig,
  calculateVipApplicationFee,
  VIP_CONFIG,
} from "../institutions/vip.config.js";

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
function normalizePhoneNumber(phone) {
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
 * Formats a VIP ticket application record into the standard API response structure,
 * returning selected services as an array.
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

  return {
    id: ticket.id,
    ticketCode: ticket.ticketCode,
    reference: ticket.ticketCode,
    status: ticket.status,
    citizenName: ticket.citizenName,
    citizenPhone: ticket.citizenPhone,
    purpose: ticket.purpose,
    vipFee: fee,
    currency,
    serviceCount: formattedServices.length,
    services: formattedServices,
    // Legacy alias for single-service consumers
    service: formattedServices[0] || null,
    slotDate: ticket.slotDate,
    slotTime: ticket.slotTime,
    paymentRef: ticket.paymentRef,
    qrCodeUrl: ticket.qrCodeUrl,
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
 *
 * Customer submits a VIP application with one or more services.
 *
 * Business Rules:
 * 1. Customer can select 1 or more VIP-eligible services.
 * 2. All selected services belong to one VIP application with one reference.
 * 3. Total VIP application fee is a fixed 1,000 ETB regardless of service count.
 * 4. Customer pays once for the whole application.
 * 5. Backend is authoritative for eligibility, fee, currency, reference, and initial PENDING status.
 * 6. Appointments (slotDate, slotTime) remain unassigned during submission.
 * 7. Creation of application and service links is atomic inside a Prisma transaction.
 *
 * Expected Request Body:
 * {
 *   "citizenName": "Abebe Kebede",
 *   "citizenPhone": "0912345678",
 *   "purpose": "I need assistance with several services",
 *   "serviceIds": ["actual-service-id-1", "actual-service-id-2"]
 * }
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
      // Backwards-compatible single serviceId fallback
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

    // Maintain client submission order
    const serviceMap = new Map(services.map((s) => [s.id, s]));
    const orderedServices = uniqueServiceIds.map((id) => serviceMap.get(id));

    // Verify each requested service & its provider meet active-status and VIP eligibility rules
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

    // ─── 4. Authoritative Fee Calculation (Flat 1000 ETB) ───────────────────
    const { vipFee, currency } = calculateVipApplicationFee(orderedServices);

    // ─── 5. Atomic Application Creation in Prisma Transaction ──────────────
    const ticketCode = await getUniqueTicketCode();
    const ticketId = crypto.randomUUID();
    const now = new Date();

    const createdTicket = await prisma.$transaction(async (tx) => {
      // 1. Create the application ticket
      const ticket = await tx.vip_tickets.create({
        data: {
          id: ticketId,
          ticketCode,
          citizenName: trimmedCitizenName,
          citizenPhone: normalizedPhone,
          serviceId: orderedServices[0].id, // Primary service reference for legacy/scheduling backward compatibility
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

      // 2. Persist join records for each selected service if join table model is available
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
 * GET /api/vip-tickets/:id
 * Retrieve a VIP application by primary ID.
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
 * Retrieve a VIP application by reference / ticketCode (e.g. VIP-845123-A4B2).
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
