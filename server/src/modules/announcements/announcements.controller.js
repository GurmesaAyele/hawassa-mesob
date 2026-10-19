import { INITIAL_ANNOUNCEMENTS } from "./announcements.data.js";

let announcements = [...INITIAL_ANNOUNCEMENTS];

/**
 * GET /api/announcements
 * Returns announcements formatted for AnnouncementsSection and API guide.
 */
export async function listAnnouncements(req, res) {
  try {
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
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.content?.toLowerCase().includes(q)
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
    console.error("Error in listAnnouncements:", error);
    return res.status(500).json({ error: "Failed to retrieve announcements" });
  }
}

/**
 * GET /api/announcements/:id
 * Returns a single announcement by ID.
 */
export async function getAnnouncementById(req, res) {
  try {
    const { id } = req.params;
    const item = announcements.find((a) => a.id === id);

    if (!item) {
      return res.status(404).json({ error: `Announcement with ID '${id}' not found` });
    }

    return res.json(item);
  } catch (error) {
    console.error("Error in getAnnouncementById:", error);
    return res.status(500).json({ error: "Failed to retrieve announcement" });
  }
}

/**
 * POST /api/announcements
 * Creates a new announcement.
 */
export async function createAnnouncement(req, res) {
  try {
    const { title, content, priority, type, date } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Validation failed: 'title' is required" });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
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
      title: title.trim(),
      content: content.trim(),
      priority: selectedPriority,
      type: selectedType,
      date: date || new Date().toISOString(),
    };

    announcements.unshift(newAnnouncement);

    return res.status(201).json({
      message: "Announcement created successfully",
      announcement: newAnnouncement,
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
