import { INITIAL_ANNOUNCEMENTS } from "./announcements.data.js";

let announcements = [...INITIAL_ANNOUNCEMENTS];

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
    date: item.date,
    translations: {
      title: item.title,
      content: item.content,
    },
  };
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

    let result = [...announcements];
    const { priority, type, search, limit } = req.query;

    if (priority && typeof priority === "string") {
      result = result.filter(
        (a) => a.priority?.toLowerCase() === priority.toLowerCase()
      );
    }

    if (type && typeof type === "string") {
      result = result.filter(
        (a) => a.type?.toLowerCase() === type.toLowerCase()
      );
    }

    if (search && typeof search === "string") {
      const q = search.toLowerCase().trim();
      const matchField = (f) => {
        if (!f) return false;
        if (typeof f === "string") return f.toLowerCase().includes(q);
        if (typeof f === "object" && f !== null) {
          return Object.values(f).some(
            (v) => typeof v === "string" && v.toLowerCase() === q
          );
        }
        return false;
      };

      result = result.filter(
        (a) => matchField(a.title) || matchField(a.content)
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
    const item = announcements.find((a) => a.id === id);

    if (!item) {
      return res.status(404).json({ error: `Announcement with ID '${id}' not found` });
    }

    return res.json(transformAnnouncement(item, locale, isRaw));
  } catch (error) {
    console.error("Error in getAnnouncementById:", error);
    return res.status(500).json({ error: "Failed to retrieve announcement" });
  }
}

/**
 * POST /api/announcements
 * Creates a new announcement. Accepts either strings or localized objects { en, am, sid }.
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
    const validTypes = ["event", "update", "alert", "general"];

    const selectedPriority = validPriorities.includes(priority?.toLowerCase())
      ? priority.toLowerCase()
      : "medium";

    const selectedType = validTypes.includes(type?.toLowerCase())
      ? type.toLowerCase()
      : "general";

    const newAnnouncement = {
      id: `ann-${Date.now()}`,
      title: normalizeLocalizedField(title),
      content: normalizeLocalizedField(content),
      priority: selectedPriority,
      type: selectedType,
      date: date || new Date().toISOString(),
    };

    announcements.unshift(newAnnouncement);

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
 * Deletes an announcement.
 */
export async function deleteAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const initialLen = announcements.length;
    announcements = announcements.filter((a) => a.id !== id);

    if (announcements.length === initialLen) {
      return res.status(404).json({ error: `Announcement with ID '${id}' not found` });
    }

    return res.json({ message: `Announcement '${id}' deleted successfully` });
  } catch (error) {
    console.error("Error in deleteAnnouncement:", error);
    return res.status(500).json({ error: "Failed to delete announcement" });
  }
}
