import { INITIAL_VIDEOS } from "./videos.data.js";

// In-memory persistent video store initialized with authentic Hawassa MESOB videos
let videos = [...INITIAL_VIDEOS];

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
 */
export async function listVideos(req, res) {
  try {
    let result = [...videos];

    const { category, search, limit } = req.query;

    if (category && typeof category === "string") {
      result = result.filter(
        (v) => v.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (search && typeof search === "string") {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.title?.toLowerCase().includes(q) ||
          v.description?.toLowerCase().includes(q) ||
          v.author?.toLowerCase().includes(q)
      );
    }

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
        result = result.slice(0, parsedLimit);
      }
    }

    return res.json(result);
  } catch (error) {
    console.error("Error in listVideos:", error);
    return res.status(500).json({ error: "Failed to retrieve videos" });
  }
}

/**
 * GET /api/videos/:id
 * Returns a single video by ID.
 */
export async function getVideo(req, res) {
  try {
    const { id } = req.params;
    const video = videos.find((v) => v.id === id);

    if (!video) {
      return res.status(404).json({ error: `Video with ID '${id}' not found` });
    }

    return res.json(video);
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

    if (!title || typeof title !== "string" || !title.trim()) {
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

    const newVideo = {
      id: `vid-${Date.now()}`,
      title: title.trim(),
      youtubeUrl: youtubeUrl.trim(),
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      description: description ? description.trim() : "",
      duration: duration || "N/A",
      views: views || "0 views",
      author: author ? author.trim() : "MESOB",
      category: category ? category.trim() : "General",
      date: new Date().toISOString(),
    };

    videos.unshift(newVideo);

    return res.status(201).json({
      message: "Video added successfully",
      video: newVideo,
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
