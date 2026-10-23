import prisma from "../../config/db.js";

let inMemoryAnnouncements = [];

const ALLOWED_LOCALES = ["en", "am", "sid"];

/**
 * Extract localized string from JSONB / localized object.
 */
function localize(field, locale = "en") {
  if (!field || typeof field !== "object") return field ?? "";
  return field[locale] ?? field["en"] ?? Object.values(field)[0] ?? "";
}

/**
 * Normalizes field into { en, am, sid }.
 * If string provided, replicates across all 3 locales.
 */
function normalizeLocalizedField(val) {
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
 * Transform an announcement into client-friendly format.
 */
function transformAnnouncement(item, locale = "en", isRaw = false) {
  return {
    id: item.id,
    title: isRaw ? item.title : localize(item.title, locale),
    content: isRaw ? item.content : localize(item.content, locale),
    priority: item.priority,
    type: item.type,
    date: item.date instanceof Date ? item.date.toISOString() : item.date,
    translations: {
      title: item.title,
      content: item.content,
    },
  };
}

/**
 * Fetch announcements from Neon DB with in-memory fallback.
 */
async function fetchAnnouncements() {
  try {
    if (prisma && prisma.announcement) {
      const dbAnnouncements = await prisma.announcement.findMany({
        orderBy: { date: "desc" },
      });
      if (dbAnnouncements && dbAnnouncements.length > 0) {
        return dbAnnouncements;
      }
    }
  } catch (err) {
    console.warn("DB announcement lookup failed, using fallback:", err.message);
  }
  return inMemoryAnnouncements;
}

/**
 * GET /api/announcements
 * Returns announcements formatted for AnnouncementsSection and API guide.
 * Supports:
 *   ?locale=en|am|sid  (default: "en")
 *   ?raw=true          (returns full { en, am, sid } objects)
 *   ?priority=...      (high, medium, low)
 *   ?type=...          (event, update, alert, general)
 *   ?search=...        (searches across all language variations)
 *   ?limit=...         (limits returned count)
 */
export async function listAnnouncements(req, res) {
  try {
    const isRaw = req.query.raw === "true";
    let locale = "en";

    if (!isRaw && req.query.locale) {
      if (!ALLOWED_LOCALES.includes(req.query.locale)) {
        return res.status(400).json({
          error: `Invalid locale '${req.query.locale}'. Supported: en, am, sid.`,
        });
      }
      locale = req.query.locale;
    }

    let result = await fetchAnnouncements();
    const { priority, type, search, limit } = req.query;

    if (priority && typeof priority === "string") {
      const p = priority.toLowerCase().trim();
      result = result.filter((item) => item.priority?.toLowerCase() === p);
    }

    if (type && typeof type === "string") {
      const t = type.toLowerCase().trim();
      result = result.filter((item) => item.type?.toLowerCase() === t);
    }

    if (search && typeof search === "string") {
      const q = search.toLowerCase().trim();
      const matchField = (f) => {
        if (!f) return false;
        if (typeof f === "string") return f.toLowerCase().includes(q);
        if (typeof f === "object" && f !== null) {
          return Object.values(f).some(
            (v) => typeof v === "string" && v.toLowerCase().includes(q)
          );
        }
        return false;
      };

      result = result.filter(
        (item) => matchField(item.title) || matchField(item.content)
      );
    }

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
        result = result.slice(0, parsedLimit);
      }
    }

    return res.json(result.map((item) => transformAnnouncement(item, locale, isRaw)));
  } catch (error) {
    console.error("Error in listAnnouncements:", error);
    return res.status(500).json({ error: "Failed to retrieve announcements" });
  }
}

/**
 * GET /api/announcements/:id
 * Returns a single announcement by ID with multilingual localization support.
 */
export async function getAnnouncementById(req, res) {
  try {
    const isRaw = req.query.raw === "true";
    let locale = "en";

    if (!isRaw && req.query.locale) {
      if (!ALLOWED_LOCALES.includes(req.query.locale)) {
        return res.status(400).json({
          error: `Invalid locale '${req.query.locale}'. Supported: en, am, sid.`,
        });
      }
      locale = req.query.locale;
    }

    const { id } = req.params;
    let announcement = null;

    try {
      if (prisma && prisma.announcement) {
        announcement = await prisma.announcement.findUnique({ where: { id } });
      }
    } catch {
      // Fallback
    }

    if (!announcement) {
      announcement = inMemoryAnnouncements.find((item) => item.id === id);
    }

    if (!announcement) {
      return res.status(404).json({ error: `Announcement with ID '${id}' not found` });
    }

    return res.json(transformAnnouncement(announcement, locale, isRaw));
  } catch (error) {
    console.error("Error in getAnnouncementById:", error);
    return res.status(500).json({ error: "Failed to retrieve announcement" });
  }
}

/**
 * POST /api/announcements
 * Creates a new announcement in Neon DB.
 */
export async function createAnnouncement(req, res) {
  try {
    const { title, content, priority, type, date } = req.body || {};

    if (!title || (typeof title === "string" && !title.trim())) {
      return res.status(400).json({ error: "Validation failed: 'title' is required" });
    }

    if (!content || (typeof content === "string" && !content.trim())) {
      return res.status(400).json({ error: "Validation failed: 'content' is required" });
    }

    const validPriorities = ["high", "medium", "low"];
    const validTypes = ["update", "alert", "event", "general"];

    const normalizedPriority =
      priority && validPriorities.includes(priority.toLowerCase())
        ? priority.toLowerCase()
        : "medium";

    const normalizedType =
      type && validTypes.includes(type.toLowerCase())
        ? type.toLowerCase()
        : "update";

    const newAnnouncement = {
      id: `ann-${Date.now()}`,
      title: normalizeLocalizedField(title),
      content: normalizeLocalizedField(content),
      priority: normalizedPriority,
      type: normalizedType,
      date: date ? new Date(date) : new Date(),
    };

    try {
      if (prisma && prisma.announcement) {
        await prisma.announcement.create({
          data: newAnnouncement,
        });
      }
    } catch (err) {
      console.warn("DB insert announcement failed, saving in memory:", err.message);
    }

    inMemoryAnnouncements.unshift(newAnnouncement);

    return res.status(201).json({
      message: "Announcement created successfully",
      announcement: transformAnnouncement(newAnnouncement, "en", false),
    });
  } catch (error) {
    console.error("Error in createAnnouncement:", error);
    return res.status(500).json({ error: "Failed to create announcement" });
  }
}

/**
 * DELETE /api/announcements/:id
 * Deletes an announcement from Neon DB.
 */
export async function deleteAnnouncement(req, res) {
  try {
    const { id } = req.params;
    let found = false;

    try {
      if (prisma && prisma.announcement) {
        const deleted = await prisma.announcement.delete({ where: { id } }).catch(() => null);
        if (deleted) found = true;
      }
    } catch {
      // Fallback
    }

    const initialLen = inMemoryAnnouncements.length;
    inMemoryAnnouncements = inMemoryAnnouncements.filter((item) => item.id !== id);
    if (inMemoryAnnouncements.length < initialLen) found = true;

    if (!found) {
      return res.status(404).json({ error: `Announcement with ID '${id}' not found` });
    }

    return res.json({ message: `Announcement '${id}' deleted successfully` });
  } catch (error) {
    console.error("Error in deleteAnnouncement:", error);
    return res.status(500).json({ error: "Failed to delete announcement" });
  }
}
