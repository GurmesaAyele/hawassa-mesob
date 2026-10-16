import prisma from "../../config/db.js";

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

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/institutions
 *
 * List all active service providers (institutions).
 *
 * Query params:
 *   locale  – "en" | "am" | "sid"  (default: "en")
 *   page    – positive integer      (default: 1)
 *   limit   – positive integer 1-50 (default: 20)
 *   search  – free-text search on institution name (optional)
 */
export async function listInstitutions(req, res) {
  try {
    const locale = resolveLocale(req, res);
    if (!locale) return;

    const page  = parsePosInt(req.query.page,  1);
    const limit = Math.min(parsePosInt(req.query.limit, 20), 50);
    const skip  = (page - 1) * limit;
    const searchTerm = req.query.search?.trim() ?? "";

    // Build a case-insensitive name search across all locale columns if provided
    const whereClause = {
      isActive: true,
      ...(searchTerm && {
        OR: [
          { name: { path: ["en"],  string_contains: searchTerm, mode: "insensitive" } },
          { name: { path: ["am"],  string_contains: searchTerm, mode: "insensitive" } },
          { name: { path: ["sid"], string_contains: searchTerm, mode: "insensitive" } },
        ],
      }),
    };

    const [total, providers] = await Promise.all([
      prisma.serviceProvider.count({ where: whereClause }),
      prisma.serviceProvider.findMany({
        where: whereClause,
        select: {
          id:             true,
          name:           true,
          code:           true,
          icon:           true,
          floorRoomNumber: true,
          contactPhone:   true,
          _count: {
            select: { services: { where: { isActive: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
    ]);

    const data = providers.map((p) => ({
      id:             p.id,
      code:           p.code,
      name:           localize(p.name, locale),
      icon:           p.icon,
      floorRoomNumber: p.floorRoomNumber,
      contactPhone:   p.contactPhone,
      serviceCount:   p._count.services,
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
 * Get a single institution with its full active services list.
 *
 * Params:
 *   id      – provider id (cuid)
 * Query:
 *   locale  – "en" | "am" | "sid" (default: "en")
 */
export async function getInstitution(req, res) {
  try {
    const locale = resolveLocale(req, res);
    if (!locale) return;

    const provider = await prisma.serviceProvider.findFirst({
      where: { id: req.params.id, isActive: true },
      select: {
        id:             true,
        name:           true,
        code:           true,
        icon:           true,
        floorRoomNumber: true,
        contactPhone:   true,
        services: {
          where: { isActive: true },
          select: {
            id:             true,
            title:          true,
            description:    true,
            requirements:   true,
            estimatedFee:   true,
            processingDays: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!provider) {
      return res.status(404).json({ error: "Institution not found." });
    }

    return res.json({
      id:             provider.id,
      code:           provider.code,
      name:           localize(provider.name, locale),
      icon:           provider.icon,
      floorRoomNumber: provider.floorRoomNumber,
      contactPhone:   provider.contactPhone,
      services: provider.services.map((s) => ({
        id:             s.id,
        title:          localize(s.title, locale),
        description:    localize(s.description, locale),
        requirements:   localizeArray(s.requirements, locale),
        estimatedFee:   s.estimatedFee,
        processingDays: s.processingDays,
      })),
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
 *
 * Params:
 *   id      – provider id (cuid)
 * Query:
 *   locale  – "en" | "am" | "sid" (default: "en")
 *   page    – positive integer      (default: 1)
 *   limit   – positive integer 1-50 (default: 20)
 */
export async function listInstitutionServices(req, res) {
  try {
    const locale = resolveLocale(req, res);
    if (!locale) return;

    const page  = parsePosInt(req.query.page,  1);
    const limit = Math.min(parsePosInt(req.query.limit, 20), 50);
    const skip  = (page - 1) * limit;

    // Confirm institution exists and is active
    const providerExists = await prisma.serviceProvider.findFirst({
      where: { id: req.params.id, isActive: true },
      select: { id: true, name: true, code: true },
    });

    if (!providerExists) {
      return res.status(404).json({ error: "Institution not found." });
    }

    const [total, services] = await Promise.all([
      prisma.service.count({
        where: { providerId: req.params.id, isActive: true },
      }),
      prisma.service.findMany({
        where: { providerId: req.params.id, isActive: true },
        select: {
          id:             true,
          title:          true,
          description:    true,
          requirements:   true,
          estimatedFee:   true,
          processingDays: true,
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
        name: localize(providerExists.name, locale),
      },
      data: services.map((s) => ({
        id:             s.id,
        title:          localize(s.title, locale),
        description:    localize(s.description, locale),
        requirements:   localizeArray(s.requirements, locale),
        estimatedFee:   s.estimatedFee,
        processingDays: s.processingDays,
      })),
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

/**
 * GET /api/services
 *
 * Flat list of ALL active services across all institutions (with institution info).
 * Useful for a global search or overview page.
 *
 * Query:
 *   locale  – "en" | "am" | "sid" (default: "en")
 *   page    – positive integer      (default: 1)
 *   limit   – positive integer 1-50 (default: 20)
 *   search  – free-text search on service title (optional)
 */
export async function listAllServices(req, res) {
  try {
    const locale = resolveLocale(req, res);
    if (!locale) return;

    const page  = parsePosInt(req.query.page,  1);
    const limit = Math.min(parsePosInt(req.query.limit, 20), 50);
    const skip  = (page - 1) * limit;
    const searchTerm = req.query.search?.trim() ?? "";

    const whereClause = {
      isActive: true,
      provider: { isActive: true },
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
          provider: {
            select: {
              id:             true,
              name:           true,
              code:           true,
              icon:           true,
              floorRoomNumber: true,
              contactPhone:   true,
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
        id:             s.id,
        title:          localize(s.title, locale),
        description:    localize(s.description, locale),
        requirements:   localizeArray(s.requirements, locale),
        estimatedFee:   s.estimatedFee,
        processingDays: s.processingDays,
        institution: {
          id:             s.provider.id,
          code:           s.provider.code,
          name:           localize(s.provider.name, locale),
          icon:           s.provider.icon,
          floorRoomNumber: s.provider.floorRoomNumber,
          contactPhone:   s.provider.contactPhone,
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
 *
 * Get a single service with its parent institution info.
 *
 * Params:
 *   id     – service id (cuid)
 * Query:
 *   locale – "en" | "am" | "sid" (default: "en")
 */
export async function getService(req, res) {
  try {
    const locale = resolveLocale(req, res);
    if (!locale) return;

    const service = await prisma.service.findFirst({
      where: { id: req.params.id, isActive: true, provider: { isActive: true } },
      select: {
        id:             true,
        title:          true,
        description:    true,
        requirements:   true,
        estimatedFee:   true,
        processingDays: true,
        provider: {
          select: {
            id:             true,
            name:           true,
            code:           true,
            icon:           true,
            floorRoomNumber: true,
            contactPhone:   true,
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found." });
    }

    return res.json({
      id:             service.id,
      title:          localize(service.title, locale),
      description:    localize(service.description, locale),
      requirements:   localizeArray(service.requirements, locale),
      estimatedFee:   service.estimatedFee,
      processingDays: service.processingDays,
      institution: {
        id:             service.provider.id,
        code:           service.provider.code,
        name:           localize(service.provider.name, locale),
        icon:           service.provider.icon,
        floorRoomNumber: service.provider.floorRoomNumber,
        contactPhone:   service.provider.contactPhone,
      },
    });
  } catch (err) {
    console.error("[institutions] getService error:", err);
    return res.status(500).json({ error: "Failed to fetch service." });
  }
}
