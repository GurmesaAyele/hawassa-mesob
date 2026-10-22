import prisma from "../../config/db.js";
import { getVipServiceConfig } from "./vip.config.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALLOWED_LOCALES = ["en", "am", "sid"];

/**
 * Extract the correct locale string from a JSONB name/title/description field.
 * Falls back: requested locale → "en" → first available key → raw object.
 */
function localize(jsonField, locale = "en") {
  if (!jsonField || typeof jsonField !== "object") return jsonField ?? "";
  return jsonField[locale] ?? jsonField["en"] ?? Object.values(jsonField)[0] ?? "";
}

/**
 * Localize an array of JSONB items (e.g. requirements).
 */
function localizeArray(arr, locale = "en") {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) =>
    typeof item === "object" && item !== null ? localize(item, locale) : item
  );
}

/**
 * Validate & parse the `locale` query param.
 * Returns "en" by default; sends 400 on invalid value.
 */
function resolveLocale(req, res) {
  const locale = req.query.locale ?? "en";
  if (!ALLOWED_LOCALES.includes(locale)) {
    res.status(400).json({
      error: `Invalid locale '${locale}'. Supported values: en, am, sid.`,
    });
    return null;
  }
  return locale;
}

/**
 * Parse positive integer query param with a fallback default.
 */
function parsePosInt(value, defaultVal) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultVal;
}

function formatDuration(days) {
  if (days === null || days === undefined) return "Same day / Variable";
  return days === 1 ? "1 day" : `${days} days`;
}

function formatCost(fee) {
  if (fee === null || fee === undefined) return "Free / Variable";
  return fee === 0 ? "Free of charge" : `${fee} ETB`;
}

function transformService(s, locale, isRaw, providerOrActive) {
  const title = isRaw ? s.title : localize(s.title, locale);
  const description = isRaw ? s.description : localize(s.description, locale);
  const requirements = isRaw ? s.requirements : localizeArray(s.requirements, locale);
  const vipInfo = getVipServiceConfig(s, providerOrActive);

  return {
    id:                s.id,
    title,
    name:              title,
    description,
    requirements,
    requiredDocuments: requirements,
    estimatedFee:      s.estimatedFee,
    cost:              formatCost(s.estimatedFee),
    processingDays:    s.processingDays,
    duration:          formatDuration(s.processingDays),
    isActive:          s.isActive,
    vipAvailable:      vipInfo.vipAvailable,
    vipFee:            vipInfo.vipFee,
    currency:          vipInfo.currency,
    createdAt:         s.createdAt,
    updatedAt:         s.updatedAt,
  };
}

/**
 * Normalizes a localized field ({ en, am, sid } or a string).
 * If admin supplies a single string, populates across all three locales.
 */
export function normalizeLocalizedField(val) {
  if (!val) return { en: "", am: "", sid: "" };
  if (typeof val === "string") {
    const trimmed = val.trim();
    return { en: trimmed, am: trimmed, sid: trimmed };
  }
  if (typeof val === "object" && !Array.isArray(val)) {
    const en = (val.en || val.am || val.sid || "").trim();
    const am = (val.am || val.en || val.sid || "").trim();
    const sid = (val.sid || val.en || val.am || "").trim();
    return { en, am, sid };
  }
  return { en: "", am: "", sid: "" };
}

/**
 * Normalizes requirements into an array of { en, am, sid } objects.
 * Accepts an array of strings or objects.
 */
export function normalizeRequirements(reqs) {
  if (!reqs) return [];
  if (!Array.isArray(reqs)) {
    if (typeof reqs === "string") return [normalizeLocalizedField(reqs)];
    return [];
  }
  return reqs.map((item) => {
    if (typeof item === "string") return normalizeLocalizedField(item);
    if (typeof item === "object" && item !== null) return normalizeLocalizedField(item);
    return { en: String(item), am: String(item), sid: String(item) };
  });
}

// ─── Public & Admin Institution Queries ──────────────────────────────────────

/**
 * GET /api/institutions
 *
 * Query params:
 *   locale          – "en" | "am" | "sid" (default: "en")
 *   page            – positive integer    (default: 1)
 *   limit           – positive integer    (default: 20, max 50)
 *   search          – text filter on name (optional)
 *   includeInactive – "true" | "false"    (default: "false", admin mode)
 *   raw             – "true" | "false"    (returns full {en,am,sid} JSONB for admin editing)
 */
export async function listInstitutions(req, res) {
  try {
    const isRaw = req.query.raw === "true";
    let locale = "en";
    if (!isRaw) {
      locale = resolveLocale(req, res);
      if (!locale) return;
    }

    const includeInactive = req.query.includeInactive === "true";
    const includeServices = req.query.includeServices === "true";
    const page  = parsePosInt(req.query.page,  1);
    const limit = Math.min(parsePosInt(req.query.limit, 20), 50);
    const skip  = (page - 1) * limit;
    const searchTerm = req.query.search?.trim() ?? "";

    const whereClause = {
      ...(!includeInactive && { isActive: true }),
      ...(searchTerm && {
        OR: [
          { name: { path: ["en"],  string_contains: searchTerm, mode: "insensitive" } },
          { name: { path: ["am"],  string_contains: searchTerm, mode: "insensitive" } },
          { name: { path: ["sid"], string_contains: searchTerm, mode: "insensitive" } },
          { code: { contains: searchTerm, mode: "insensitive" } },
        ],
      }),
    };

    const [total, providers] = await Promise.all([
      prisma.serviceProvider.count({ where: whereClause }),
      prisma.serviceProvider.findMany({
        where: whereClause,
        select: {
          id:              true,
          name:            true,
          code:            true,
          icon:            true,
          floorRoomNumber: true,
          contactPhone:    true,
          isActive:        true,
          createdAt:       true,
          updatedAt:       true,
          _count: {
            select: {
              services: {
                where: includeInactive ? {} : { isActive: true },
              },
            },
          },
          ...(includeServices && {
            services: {
              where: includeInactive ? {} : { isActive: true },
              select: {
                id:             true,
                title:          true,
                description:    true,
                requirements:   true,
                estimatedFee:   true,
                processingDays: true,
                isActive:       true,
                createdAt:      true,
                updatedAt:      true,
              },
              orderBy: { createdAt: "asc" },
            },
          }),
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
    ]);

    const data = providers.map((p) => ({
      id:              p.id,
      code:            p.code,
      name:            isRaw ? p.name : localize(p.name, locale),
      icon:            p.icon,
      logo:            p.icon,
      floorRoomNumber: p.floorRoomNumber,
      contactPhone:    p.contactPhone,
      isActive:        p.isActive,
      serviceCount:    p._count.services,
      createdAt:       p.createdAt,
      updatedAt:       p.updatedAt,
      ...(includeServices && {
        services: (p.services || []).map((s) => transformService(s, locale, isRaw, p.isActive)),
      }),
    }));

    return res.json({
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[institutions] listInstitutions error:", err);
    return res.status(500).json({ error: "Failed to fetch institutions." });
  }
}

/**
 * GET /api/institutions/:id
 *
 * Query params:
 *   locale          – "en" | "am" | "sid" (default: "en")
 *   includeInactive – "true" | "false"    (default: "false")
 *   raw             – "true" | "false"    (returns full {en,am,sid} for admin editing)
 */
export async function getInstitution(req, res) {
  try {
    const isRaw = req.query.raw === "true";
    let locale = "en";
    if (!isRaw) {
      locale = resolveLocale(req, res);
      if (!locale) return;
    }

    const includeInactive = req.query.includeInactive === "true";

    const provider = await prisma.serviceProvider.findFirst({
      where: {
        id: req.params.id,
        ...(!includeInactive && { isActive: true }),
      },
      select: {
        id:              true,
        name:            true,
        code:            true,
        icon:            true,
        floorRoomNumber: true,
        contactPhone:    true,
        isActive:        true,
        createdAt:       true,
        updatedAt:       true,
        services: {
          where: includeInactive ? {} : { isActive: true },
          select: {
            id:             true,
            title:          true,
            description:    true,
            requirements:   true,
            estimatedFee:   true,
            processingDays: true,
            isActive:       true,
            createdAt:      true,
            updatedAt:      true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!provider) {
      return res.status(404).json({ error: "Institution not found." });
    }

    return res.json({
      id:              provider.id,
      code:            provider.code,
      name:            isRaw ? provider.name : localize(provider.name, locale),
      icon:            provider.icon,
      logo:            provider.icon,
      floorRoomNumber: provider.floorRoomNumber,
      contactPhone:    provider.contactPhone,
      isActive:        provider.isActive,
      createdAt:       provider.createdAt,
      updatedAt:       provider.updatedAt,
      services: provider.services.map((s) => transformService(s, locale, isRaw, provider.isActive)),
    });
  } catch (err) {
    console.error("[institutions] getInstitution error:", err);
    return res.status(500).json({ error: "Failed to fetch institution." });
  }
}

/**
 * GET /api/institutions/:id/services
 *
 * Paginated list of services for a specific institution.
 */
export async function listInstitutionServices(req, res) {
  try {
    const isRaw = req.query.raw === "true";
    let locale = "en";
    if (!isRaw) {
      locale = resolveLocale(req, res);
      if (!locale) return;
    }

    const isVipOnly = req.query.vipOnly === "true" || req.query.vip === "true";
    const includeInactive = req.query.includeInactive === "true" && !isVipOnly;
    const page  = parsePosInt(req.query.page,  1);
    const limit = Math.min(parsePosInt(req.query.limit, 20), 50);
    const skip  = (page - 1) * limit;

    const providerExists = await prisma.serviceProvider.findFirst({
      where: {
        id: req.params.id,
        ...(!includeInactive && { isActive: true }),
      },
      select: { id: true, name: true, code: true, icon: true, isActive: true },
    });

    if (!providerExists) {
      return res.status(404).json({ error: "Institution not found." });
    }

    const whereClause = {
      providerId: req.params.id,
      ...(!includeInactive && { isActive: true }),
    };

    const [total, services] = await Promise.all([
      prisma.service.count({ where: whereClause }),
      prisma.service.findMany({
        where: whereClause,
        select: {
          id:             true,
          title:          true,
          description:    true,
          requirements:   true,
          estimatedFee:   true,
          processingDays: true,
          isActive:       true,
          createdAt:      true,
          updatedAt:      true,
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
    ]);

    return res.json({
      institution: {
        id:   providerExists.id,
        code: providerExists.code,
        name: isRaw ? providerExists.name : localize(providerExists.name, locale),
        icon: providerExists.icon,
        logo: providerExists.icon,
        isActive: providerExists.isActive,
      },
      data: services.map((s) => transformService(s, locale, isRaw, providerExists.isActive)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[institutions] listInstitutionServices error:", err);
    return res.status(500).json({ error: "Failed to fetch services." });
  }
}

// ─── Admin Institution Mutators (Create / Update / Delete) ───────────────────

/**
 * POST /api/institutions
 *
 * Create a new institution, optionally with an initial batch of active services.
 *
 * Body:
 * {
 *   "name": "Hawassa City Water Bureau" | { "en": "...", "am": "...", "sid": "..." },
 *   "code": "HAWASSA_WATER",
 *   "icon": "/water.png",
 *   "floorRoomNumber": "Counter 7",
 *   "contactPhone": "+251 46 220 9999",
 *   "isActive": true,
 *   "services": [ ...optional initial services... ]
 * }
 */
export async function createInstitution(req, res) {
  try {
    const { name, code, icon, floorRoomNumber, contactPhone, isActive, services } = req.body || {};

    if (!name || (typeof name === "string" && !name.trim())) {
      return res.status(400).json({ error: "Institution 'name' is required." });
    }

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ error: "Institution unique 'code' is required (e.g. 'HAWASSA_WATER')." });
    }

    const normalizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    const normalizedName = normalizeLocalizedField(name);

    // Check code collision
    const existing = await prisma.serviceProvider.findUnique({
      where: { code: normalizedCode },
    });
    if (existing) {
      return res.status(409).json({
        error: `An institution with code '${normalizedCode}' already exists.`,
      });
    }

    // Build nested service creation data if provided
    const servicesCreateData = Array.isArray(services) && services.length > 0
      ? services.map((s) => ({
          title: normalizeLocalizedField(s.title || "Untitled Service"),
          description: normalizeLocalizedField(s.description || ""),
          requirements: normalizeRequirements(s.requirements),
          estimatedFee: s.estimatedFee !== undefined && s.estimatedFee !== null ? Number(s.estimatedFee) : null,
          processingDays: s.processingDays !== undefined && s.processingDays !== null ? parseInt(s.processingDays, 10) : null,
          isActive: s.isActive !== undefined ? Boolean(s.isActive) : true,
        }))
      : [];

    const newProvider = await prisma.serviceProvider.create({
      data: {
        name: normalizedName,
        code: normalizedCode,
        icon: icon?.trim() || null,
        floorRoomNumber: floorRoomNumber?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        ...(servicesCreateData.length > 0 && {
          services: {
            create: servicesCreateData,
          },
        }),
      },
      include: {
        services: true,
      },
    });

    return res.status(201).json({
      message: "Institution created successfully.",
      data: newProvider,
    });
  } catch (err) {
    console.error("[institutions] createInstitution error:", err);
    return res.status(500).json({ error: "Failed to create institution." });
  }
}

/**
 * PUT /api/institutions/:id or PATCH /api/institutions/:id
 *
 * Update an existing institution.
 */
export async function updateInstitution(req, res) {
  try {
    const { id } = req.params;
    const { name, code, icon, floorRoomNumber, contactPhone, isActive } = req.body || {};

    const existing = await prisma.serviceProvider.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Institution not found." });
    }

    const updateData = {};

    if (name !== undefined) {
      updateData.name = normalizeLocalizedField(name);
    }

    if (code !== undefined) {
      const normalizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
      if (normalizedCode !== existing.code) {
        const codeTaken = await prisma.serviceProvider.findUnique({
          where: { code: normalizedCode },
        });
        if (codeTaken) {
          return res.status(409).json({
            error: `Code '${normalizedCode}' is already in use by another institution.`,
          });
        }
        updateData.code = normalizedCode;
      }
    }

    if (icon !== undefined) updateData.icon = icon ? icon.trim() : null;
    if (floorRoomNumber !== undefined) updateData.floorRoomNumber = floorRoomNumber ? floorRoomNumber.trim() : null;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone ? contactPhone.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.serviceProvider.update({
      where: { id },
      data: updateData,
      include: {
        _count: { select: { services: true } },
      },
    });

    return res.json({
      message: "Institution updated successfully.",
      data: {
        ...updated,
        serviceCount: updated._count.services,
      },
    });
  } catch (err) {
    console.error("[institutions] updateInstitution error:", err);
    return res.status(500).json({ error: "Failed to update institution." });
  }
}

/**
 * DELETE /api/institutions/:id
 *
 * Deletes or deactivates an institution.
 * Query: ?permanent=true (hard delete) or default soft-delete (isActive = false).
 */
export async function deleteInstitution(req, res) {
  try {
    const { id } = req.params;
    const isPermanent = req.query.permanent === "true";

    const existing = await prisma.serviceProvider.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Institution not found." });
    }

    if (isPermanent) {
      await prisma.serviceProvider.delete({ where: { id } });
      return res.json({
        message: "Institution permanently deleted.",
        id,
      });
    }

    // Soft delete: deactivate institution and all its child services
    const [updatedProvider] = await prisma.$transaction([
      prisma.serviceProvider.update({
        where: { id },
        data: { isActive: false },
      }),
      prisma.service.updateMany({
        where: { providerId: id },
        data: { isActive: false },
      }),
    ]);

    return res.json({
      message: "Institution and its services deactivated successfully.",
      data: updatedProvider,
    });
  } catch (err) {
    console.error("[institutions] deleteInstitution error:", err);
    return res.status(500).json({ error: "Failed to delete institution." });
  }
}

// ─── Public & Admin Services Queries & Mutators ──────────────────────────────

/**
 * GET /api/services
 *
 * Flat catalog of services across institutions.
 */
export async function listAllServices(req, res) {
  try {
    const isRaw = req.query.raw === "true";
    let locale = "en";
    if (!isRaw) {
      locale = resolveLocale(req, res);
      if (!locale) return;
    }

    const isVipOnly = req.query.vipOnly === "true" || req.query.vip === "true";
    const includeInactive = req.query.includeInactive === "true" && !isVipOnly;
    const page  = parsePosInt(req.query.page,  1);
    const limit = Math.min(parsePosInt(req.query.limit, 20), 50);
    const skip  = (page - 1) * limit;
    const searchTerm = req.query.search?.trim() ?? "";
    const providerId = req.query.providerId || req.query.institutionId;
    const providerCode = req.query.providerCode || req.query.code;

    const providerFilter = {};
    if (!includeInactive || isVipOnly) {
      providerFilter.isActive = true;
    }
    if (providerCode) {
      providerFilter.code = providerCode.toUpperCase();
    }

    const whereClause = {
      ...((!includeInactive || isVipOnly) && { isActive: true }),
      ...(Object.keys(providerFilter).length > 0 && { provider: providerFilter }),
      ...(providerId && { providerId }),
      ...(searchTerm && {
        OR: [
          { title: { path: ["en"],  string_contains: searchTerm, mode: "insensitive" } },
          { title: { path: ["am"],  string_contains: searchTerm, mode: "insensitive" } },
          { title: { path: ["sid"], string_contains: searchTerm, mode: "insensitive" } },
        ],
      }),
    };

    const [total, services] = await Promise.all([
      prisma.service.count({ where: whereClause }),
      prisma.service.findMany({
        where: whereClause,
        select: {
          id:             true,
          title:          true,
          description:    true,
          requirements:   true,
          estimatedFee:   true,
          processingDays: true,
          isActive:       true,
          createdAt:      true,
          updatedAt:      true,
          provider: {
            select: {
              id:              true,
              name:            true,
              code:            true,
              icon:            true,
              floorRoomNumber: true,
              contactPhone:    true,
              isActive:        true,
            },
          },
        },
        orderBy: [{ provider: { code: "asc" } }, { createdAt: "asc" }],
        skip,
        take: limit,
      }),
    ]);

    return res.json({
      data: services.map((s) => ({
        ...transformService(s, locale, isRaw, s.provider),
        institution: {
          id:              s.provider.id,
          code:            s.provider.code,
          name:            isRaw ? s.provider.name : localize(s.provider.name, locale),
          icon:            s.provider.icon,
          logo:            s.provider.icon,
          floorRoomNumber: s.provider.floorRoomNumber,
          contactPhone:    s.provider.contactPhone,
          isActive:        s.provider.isActive,
        },
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[institutions] listAllServices error:", err);
    return res.status(500).json({ error: "Failed to fetch services." });
  }
}

/**
 * GET /api/services/:id
 */
export async function getService(req, res) {
  try {
    const isRaw = req.query.raw === "true";
    let locale = "en";
    if (!isRaw) {
      locale = resolveLocale(req, res);
      if (!locale) return;
    }

    const includeInactive = req.query.includeInactive === "true";

    const service = await prisma.service.findFirst({
      where: {
        id: req.params.id,
        ...(!includeInactive && {
          isActive: true,
          provider: { isActive: true },
        }),
      },
      select: {
        id:             true,
        title:          true,
        description:    true,
        requirements:   true,
        estimatedFee:   true,
        processingDays: true,
        isActive:       true,
        createdAt:      true,
        updatedAt:      true,
        provider: {
          select: {
            id:              true,
            name:            true,
            code:            true,
            icon:            true,
            floorRoomNumber: true,
            contactPhone:    true,
            isActive:        true,
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found." });
    }

    return res.json({
      ...transformService(service, locale, isRaw, service.provider),
      institution: {
        id:              service.provider.id,
        code:            service.provider.code,
        name:            isRaw ? service.provider.name : localize(service.provider.name, locale),
        icon:            service.provider.icon,
        logo:            service.provider.icon,
        floorRoomNumber: service.provider.floorRoomNumber,
        contactPhone:    service.provider.contactPhone,
        isActive:        service.provider.isActive,
      },
    });
  } catch (err) {
    console.error("[institutions] getService error:", err);
    return res.status(500).json({ error: "Failed to fetch service." });
  }
}

/**
 * POST /api/institutions/:id/services OR POST /api/services
 *
 * Adds one or more services to an institution.
 *
 * Body can be a single service object or `{ services: [ ... ] }` or an array `[ ... ]`.
 */
export async function createService(req, res) {
  try {
    const providerId = req.params.id || req.body.providerId || req.body.institutionId;

    if (!providerId) {
      return res.status(400).json({
        error: "Missing target institution ID. Specify it in the URL (:id/services) or in request body ('providerId').",
      });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
    });
    if (!provider) {
      return res.status(404).json({ error: "Target institution not found." });
    }

    // Determine if single service or batch array
    const rawItems = Array.isArray(req.body)
      ? req.body
      : Array.isArray(req.body.services)
      ? req.body.services
      : [req.body];

    if (rawItems.length === 0) {
      return res.status(400).json({ error: "Please provide at least one service to create." });
    }

    const createdServices = [];

    for (const item of rawItems) {
      if (!item.title) {
        return res.status(400).json({ error: "Each service requires a 'title'." });
      }

      const title = normalizeLocalizedField(item.title);
      const description = normalizeLocalizedField(item.description || "");
      const requirements = normalizeRequirements(item.requirements);
      const estimatedFee = item.estimatedFee !== undefined && item.estimatedFee !== null ? Number(item.estimatedFee) : null;
      const processingDays = item.processingDays !== undefined && item.processingDays !== null ? parseInt(item.processingDays, 10) : null;
      const isActive = item.isActive !== undefined ? Boolean(item.isActive) : true;

      const newService = await prisma.service.create({
        data: {
          providerId,
          title,
          description,
          requirements,
          estimatedFee,
          processingDays,
          isActive,
        },
      });
      createdServices.push(newService);
    }

    return res.status(201).json({
      message: `${createdServices.length} service(s) created successfully.`,
      data: createdServices.length === 1 ? createdServices[0] : createdServices,
    });
  } catch (err) {
    console.error("[institutions] createService error:", err);
    return res.status(500).json({ error: "Failed to create service(s)." });
  }
}

/**
 * PUT /api/services/:id or PATCH /api/services/:id
 *
 * Update an existing service.
 */
export async function updateService(req, res) {
  try {
    const { id } = req.params;
    const { title, description, requirements, estimatedFee, processingDays, isActive, providerId } = req.body || {};

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Service not found." });
    }

    const updateData = {};

    if (title !== undefined) updateData.title = normalizeLocalizedField(title);
    if (description !== undefined) updateData.description = normalizeLocalizedField(description);
    if (requirements !== undefined) updateData.requirements = normalizeRequirements(requirements);
    if (estimatedFee !== undefined) updateData.estimatedFee = estimatedFee !== null ? Number(estimatedFee) : null;
    if (processingDays !== undefined) updateData.processingDays = processingDays !== null ? parseInt(processingDays, 10) : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    if (providerId !== undefined && providerId !== existing.providerId) {
      const providerExists = await prisma.serviceProvider.findUnique({ where: { id: providerId } });
      if (!providerExists) {
        return res.status(404).json({ error: "New institution providerId not found." });
      }
      updateData.providerId = providerId;
    }

    const updated = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        provider: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return res.json({
      message: "Service updated successfully.",
      data: updated,
    });
  } catch (err) {
    console.error("[institutions] updateService error:", err);
    return res.status(500).json({ error: "Failed to update service." });
  }
}

/**
 * DELETE /api/services/:id
 *
 * Deletes or deactivates a service.
 * Query: ?permanent=true (hard delete) or default soft-delete (isActive = false).
 */
export async function deleteService(req, res) {
  try {
    const { id } = req.params;
    const isPermanent = req.query.permanent === "true";

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Service not found." });
    }

    if (isPermanent) {
      await prisma.service.delete({ where: { id } });
      return res.json({
        message: "Service permanently deleted.",
        id,
      });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return res.json({
      message: "Service deactivated successfully.",
      data: updated,
    });
  } catch (err) {
    console.error("[institutions] deleteService error:", err);
    return res.status(500).json({ error: "Failed to delete service." });
  }
}

// ─── VIP Specific Service Queries ─────────────────────────────────────────────

/**
 * GET /api/services/vip
 *
 * Thin VIP-specific listing endpoint reusing existing service catalog logic.
 * Returns only active services from active providers with VIP metadata.
 */
export async function listVipServices(req, res) {
  req.query.vipOnly = "true";
  return listAllServices(req, res);
}

/**
 * GET /api/services/vip/:id
 *
 * Thin VIP-specific single service endpoint reusing getService.
 */
export async function getVipService(req, res) {
  return getService(req, res);
}

