import { INITIAL_NEWS } from "./news.data.js";

let newsList = [...INITIAL_NEWS];

/**
 * GET /api/news
 * Returns news articles formatted for NewsSection and API guide.
 */
export async function listNews(req, res) {
  try {
    let result = [...newsList];
    const { category, search, limit } = req.query;

    if (category && typeof category === "string") {
      result = result.filter(
        (item) => item.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (search && typeof search === "string") {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.content?.toLowerCase().includes(q) ||
          item.author?.toLowerCase().includes(q)
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
    console.error("Error in listNews:", error);
    return res.status(500).json({ error: "Failed to retrieve news" });
  }
}

/**
 * GET /api/news/:id
 * Returns a single news article by ID.
 */
export async function getNewsById(req, res) {
  try {
    const { id } = req.params;
    const article = newsList.find((item) => item.id === id);

    if (!article) {
      return res.status(404).json({ error: `News article with ID '${id}' not found` });
    }

    return res.json(article);
  } catch (error) {
    console.error("Error in getNewsById:", error);
    return res.status(500).json({ error: "Failed to retrieve news article" });
  }
}

/**
 * POST /api/news
 * Creates a new news article.
 */
export async function createNews(req, res) {
  try {
    const { title, content, image, author, category, date } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Validation failed: 'title' is required" });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Validation failed: 'content' is required" });
    }

    const newArticle = {
      id: `news-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      date: date || new Date().toISOString(),
      image: image ? image.trim() : null,
      author: author ? author.trim() : "MESOB News Desk",
      category: category ? category.trim() : "General",
    };

    newsList.unshift(newArticle);

    return res.status(201).json({
      message: "News article published successfully",
      article: newArticle,
    });
  } catch (error) {
    console.error("Error in createNews:", error);
    return res.status(500).json({ error: "Failed to publish news article" });
  }
}

/**
 * DELETE /api/news/:id
 * Deletes a news article.
 */
export async function deleteNews(req, res) {
  try {
    const { id } = req.params;
    const initialLen = newsList.length;
    newsList = newsList.filter((item) => item.id !== id);

    if (newsList.length === initialLen) {
      return res.status(404).json({ error: `News article with ID '${id}' not found` });
    }

    return res.json({ message: `News article '${id}' deleted successfully` });
  } catch (error) {
    console.error("Error in deleteNews:", error);
    return res.status(500).json({ error: "Failed to delete news article" });
  }
}
