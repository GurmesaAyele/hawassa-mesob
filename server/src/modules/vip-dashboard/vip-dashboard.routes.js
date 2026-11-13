import express from "express";
import {
  getPublicVipDashboard,
  getPublicVipStats,
} from "./vip-dashboard.controller.js";

const router = express.Router();

/**
 * Route-specific cache control middleware for public dashboard endpoints.
 * Prevents stale caching across CDNs, reverse proxies, and browsers.
 * Strips incoming conditional headers (if-none-match, if-modified-since)
 * so clients always receive fresh 200 OK responses with up-to-date queue metrics.
 */
function setDashboardCacheHeaders(req, res, next) {
  if (req.headers) {
    delete req.headers["if-none-match"];
    delete req.headers["if-modified-since"];
  }

  if (typeof res.set === "function") {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Surrogate-Control": "no-store",
    });
  } else if (typeof res.setHeader === "function") {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
  }
  next();
}

// ─── Public Centralized VIP Dashboard Endpoints ───────────────────────────────

// GET /api/vip-dashboard - Full centralized public dashboard payload
router.get("/", setDashboardCacheHeaders, getPublicVipDashboard);

// GET /api/vip-dashboard/stats - Safe aggregate VIP statistics endpoint
router.get("/stats", setDashboardCacheHeaders, getPublicVipStats);

export default router;

