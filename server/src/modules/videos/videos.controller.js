import { INITIAL_VIDEOS } from "./videos.data.js";

// In-memory persistent video store initialized with authentic Hawassa MESOB videos
let videos = [...INITIAL_VIDEOS];

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
 * Transform video item into client-friendly format.
 */
function transformVideoItem(item, locale = "en", isRaw = false) {
  return {
    id: item.id,
    title: isRaw ? item.title : localize(item.title, locale),
    description: isRaw ? item.description : localize(item.description, locale),
    category: isRaw ? item.category : localize(item.category, locale),
    author: isRaw ? item.author : localize(item.author, locale),
    youtubeUrl: item.youtubeUrl,
    embedUrl: item.embedUrl,
    thumbnail: item.thumbnail,
    duration: item.duration,
    views: item.views,
    date: item.date,
    translations: {
      title: item.title,
      description: item.description,
      category: item.category,
      author: item.author,
    },
  };
}

/**
 * Extract YouTube video ID from various YouTube URL formats.
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== "string") return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * GET /api/videos
 * Returns list of videos formatted for the frontend VideosSection and API guide.
 * Supports:
 *   ?locale=en|am|sid  (default: "en")
 *   ?raw=true          (returns full { en, am, sid } objects)
 *   ?category=...      (filters by category in any language)
 *   ?search=...        (searches across all language variations)
 *   ?limit=...         (limits returned count)
 */
export async function listVideos(req, res) {
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

    let result = [...videos];

    const { category, search, limit } = req.query;

    if (category && typeof category === "string") {
      const cat = category.toLowerCase().trim();
      result = result.filter((v) => {
        if (typeof v.category === "string") {
          return v.category.toLowerCase() === cat;
        }
        if (typeof v.category === "object" && v.category !== null) {
          return Object.values(v.category).some(
            (val) => typeof val === "string" && val.toLowerCase() === cat
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
        if (typeof f === "object") {
          return Object.values(f).some(
            (val) => typeof val === "string" && val.toLowerCase().includes(q)
          );
        }
        return false;
      };

      result = result.filter(
        (v) =>
          matchField(v.title) ||
          matchField(v.description) ||
          matchField(v.category) ||
          matchField(v.author)
      );
    }

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
        result = result.slice(0, parsedLimit);
      }
    }

    const payload = result.map((item) =>
      transformVideoItem(item, locale, isRaw)
    );
    return res.json(payload);
  } catch (error) {
    console.error("Error in listVideos:", error);
    return res.status(500).json({ error: "Failed to retrieve videos" });
  }
}

/**
 * GET /api/videos/:id
 * Returns a single video by ID.
 * Supports:
 *   ?locale=en|am|sid (default: "en")
 *   ?raw=true
 */
export async function getVideo(req, res) {
  try {
    const { id } = req.params;
    const video = videos.find((v) => v.id === id);

    if (!video) {
      return res.status(404).json({ error: `Video with ID '${id}' not found` });
    }

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

    return res.json(transformVideoItem(video, locale, isRaw));
  } catch (error) {
    console.error("Error in getVideo:", error);
    return res.status(500).json({ error: "Failed to retrieve video" });
  }
}

/**
 * POST /api/videos
 * Adds a new YouTube video link to the catalog.
 */
export async function createVideo(req, res) {
  try {
    const { title, youtubeUrl, description, duration, author, category, views } = req.body;

    if (!title || (typeof title === "string" && !title.trim())) {
      return res.status(400).json({ error: "Validation failed: 'title' is required" });
    }

    if (!youtubeUrl || typeof youtubeUrl !== "string" || !youtubeUrl.trim()) {
      return res.status(400).json({ error: "Validation failed: 'youtubeUrl' is required" });
    }

    const videoId = extractYouTubeId(youtubeUrl.trim());
    if (!videoId) {
      return res.status(400).json({
        error: "Invalid YouTube URL. Please provide a valid YouTube watch, share, or embed link.",
      });
    }

    const normalizedTitle = normalizeLocalizedField(title);
    const normalizedDesc = normalizeLocalizedField(description || "");
    const normalizedAuthor = normalizeLocalizedField(author || "MESOB");
    const normalizedCat = normalizeLocalizedField(category || "General");

    const newVideo = {
      id: `vid-${Date.now()}`,
      title: normalizedTitle,
      youtubeUrl: youtubeUrl.trim(),
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      description: normalizedDesc,
      duration: duration || "N/A",
      views: views || "0 views",
      author: normalizedAuthor,
      category: normalizedCat,
      date: new Date().toISOString(),
    };

    videos.unshift(newVideo);

    return res.status(201).json({
      message: "Video added successfully",
      video: transformVideoItem(newVideo, "en", false),
    });
  } catch (error) {
    console.error("Error in createVideo:", error);
    return res.status(500).json({ error: "Failed to add video" });
  }
}

/**
 * DELETE /api/videos/:id
 * Removes a video by ID.
 */
export async function deleteVideo(req, res) {
  try {
    const { id } = req.params;
    const initialLen = videos.length;
    videos = videos.filter((v) => v.id !== id);

    if (videos.length === initialLen) {
      return res.status(404).json({ error: `Video with ID '${id}' not found` });
    }

    return res.json({ message: `Video '${id}' deleted successfully` });
  } catch (error) {
    console.error("Error in deleteVideo:", error);
    return res.status(500).json({ error: "Failed to delete video" });
  }
}
