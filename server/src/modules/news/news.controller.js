import prisma from "../../config/db.js";

let inMemoryNews = [];

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
 * Transform a news article into client-friendly format.
 */
function transformNewsItem(item, locale = "en", isRaw = false) {
  return {
    id: item.id,
    title: isRaw ? item.title : localize(item.title, locale),
    content: isRaw ? item.content : localize(item.content, locale),
    category: isRaw ? item.category : localize(item.category, locale),
    author: isRaw ? item.author : localize(item.author, locale),
    date: item.date instanceof Date ? item.date.toISOString() : item.date,
    image: item.image,
    translations: {
      title: item.title,
      content: item.content,
      category: item.category,
      author: item.author,
    },
  };
}

/**
 * Fetch news articles from Neon DB with in-memory fallback.
 */
async function fetchNewsArticles() {
  try {
    if (prisma && prisma.newsItem) {
      const dbNews = await prisma.newsItem.findMany({
        orderBy: { date: "desc" },
      });
      if (dbNews && dbNews.length > 0) {
        return dbNews;
      }
    }
  } catch (err) {
    console.warn("DB newsItem lookup failed, using fallback:", err.message);
  }
  return inMemoryNews;
}

/**
 * GET /api/news
 * Returns news articles formatted for NewsSection and API guide.
 * Supports:
 *   ?locale=en|am|sid  (default: "en")
 *   ?raw=true          (returns full { en, am, sid } objects)
 *   ?category=...      (filters by category in any language)
 *   ?search=...        (searches across all language variations)
 *   ?limit=...         (limits returned count)
 */
export async function listNews(req, res) {
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

    let result = await fetchNewsArticles();
    const { category, search, limit } = req.query;

    if (category && typeof category === "string") {
      const cat = category.toLowerCase().trim();
      result = result.filter((item) => {
        if (typeof item.category === "string") {
          return item.category.toLowerCase() === cat;
        }
        if (typeof item.category === "object" && item.category !== null) {
          return Object.values(item.category).some(
            (v) => typeof v === "string" && v.toLowerCase() === cat
          );
        }
        return false;
      });
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
        (item) =>
          matchField(item.title) ||
          matchField(item.content) ||
          matchField(item.author)
      );
    }

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
        result = result.slice(0, parsedLimit);
      }
    }

    const transformed = result.map((item) => transformNewsItem(item, locale, isRaw));
    if (isRaw || req.query.includeInactive === "true") {
      return res.json({
        data: transformed,
        meta: { total: result.length },
      });
    }

    return res.json(transformed);
  } catch (error) {
    console.error("Error in listNews:", error);
    return res.status(500).json({ error: "Failed to retrieve news" });
  }
}

/**
 * GET /api/news/:id
 * Returns a single news article by ID with multilingual localization support.
 */
export async function getNewsById(req, res) {
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
    let article = null;

    try {
      if (prisma && prisma.newsItem) {
        article = await prisma.newsItem.findUnique({ where: { id } });
      }
    } catch {
      // Fallback
    }

    if (!article) {
      article = inMemoryNews.find((item) => item.id === id);
    }

    if (!article) {
      return res.status(404).json({ error: `News article with ID '${id}' not found` });
    }

    return res.json(transformNewsItem(article, locale, isRaw));
  } catch (error) {
    console.error("Error in getNewsById:", error);
    return res.status(500).json({ error: "Failed to retrieve news article" });
  }
}

/**
 * POST /api/news
 * Creates a new news article in Neon DB.
 */
export async function createNews(req, res) {
  try {
    const { title, content, image, author, category, date } = req.body || {};

    if (!title || (typeof title === "string" && !title.trim())) {
      return res.status(400).json({ error: "Validation failed: 'title' is required" });
    }

    if (!content || (typeof content === "string" && !content.trim())) {
      return res.status(400).json({ error: "Validation failed: 'content' is required" });
    }

    const newArticle = {
      id: `news-${Date.now()}`,
      title: normalizeLocalizedField(title),
      content: normalizeLocalizedField(content),
      date: date ? new Date(date) : new Date(),
      image: image ? String(image).trim() : null,
      author: author ? normalizeLocalizedField(author) : normalizeLocalizedField("MESOB News Desk"),
      category: category ? normalizeLocalizedField(category) : normalizeLocalizedField("General"),
    };

    try {
      if (prisma && prisma.newsItem) {
        await prisma.newsItem.create({
          data: newArticle,
        });
      }
    } catch (err) {
      console.warn("DB insert newsItem failed, saving in memory:", err.message);
    }

    inMemoryNews.unshift(newArticle);

    return res.status(201).json({
      message: "News article published successfully",
      article: transformNewsItem(newArticle, "en", false),
    });
  } catch (error) {
    console.error("Error in createNews:", error);
    return res.status(500).json({ error: "Failed to publish news article" });
  }
}

/**
 * DELETE /api/news/:id
 * Deletes a news article from Neon DB.
 */
export async function deleteNews(req, res) {
  try {
    const { id } = req.params;
    let found = false;

    try {
      if (prisma && prisma.newsItem) {
        const deleted = await prisma.newsItem.delete({ where: { id } }).catch(() => null);
        if (deleted) found = true;
      }
    } catch {
      // Fallback
    }

    const initialLen = inMemoryNews.length;
    inMemoryNews = inMemoryNews.filter((item) => item.id !== id);
    if (inMemoryNews.length < initialLen) found = true;

    if (!found) {
      return res.status(404).json({ error: `News article with ID '${id}' not found` });
    }

    return res.json({ message: `News article '${id}' deleted successfully` });
  } catch (error) {
    console.error("Error in deleteNews:", error);
    return res.status(500).json({ error: "Failed to delete news article" });
  }
}

/**
 * PUT /api/news/:id
 * Updates an existing news article.
 */
export async function updateNews(req, res) {
  try {
    const { id } = req.params;
    const { title, content, image, author, category, date } = req.body || {};

    let existing = null;
    try {
      if (prisma && prisma.newsItem) {
        existing = await prisma.newsItem.findUnique({ where: { id } });
      }
    } catch {
      // Fallback
    }

    if (!existing) {
      existing = inMemoryNews.find((item) => item.id === id);
    }

    if (!existing) {
      return res.status(404).json({ error: `News article with ID '${id}' not found` });
    }

    const updatedData = {
      ...(title !== undefined && { title: normalizeLocalizedField(title) }),
      ...(content !== undefined && { content: normalizeLocalizedField(content) }),
      ...(image !== undefined && { image: image ? String(image).trim() : null }),
      ...(author !== undefined && { author: normalizeLocalizedField(author) }),
      ...(category !== undefined && { category: normalizeLocalizedField(category) }),
      ...(date !== undefined && { date: new Date(date) }),
    };

    let updated = null;
    try {
      if (prisma && prisma.newsItem) {
        updated = await prisma.newsItem.update({
          where: { id },
          data: updatedData,
        });
      }
    } catch (dbErr) {
      console.warn("DB update newsItem failed, using in-memory:", dbErr.message);
    }

    const memoryIndex = inMemoryNews.findIndex((item) => item.id === id);
    if (memoryIndex !== -1) {
      inMemoryNews[memoryIndex] = { ...inMemoryNews[memoryIndex], ...updatedData };
      if (!updated) updated = inMemoryNews[memoryIndex];
    } else if (!updated) {
      updated = { ...existing, ...updatedData };
      inMemoryNews.unshift(updated);
    }

    return res.json({
      message: "News article updated successfully",
      article: transformNewsItem(updated || { ...existing, ...updatedData }, "en", true),
    });
  } catch (error) {
    console.error("Error in updateNews:", error);
    return res.status(500).json({ error: "Failed to update news article" });
  }
}

