import express from "express";
import { login, logout, getCurrentUser, changePassword, requestPasswordReset } from "./auth.controller.js";
import { authenticateAdmin } from "../../middleware/auth.js";
import { authRateLimiter } from "../../middleware/rate-limiter.js";

const router = express.Router();

// Public login endpoint with rate limiting
router.post("/login", authRateLimiter, login);

// Logout endpoint
router.post("/logout", logout);

// Session inspection endpoint (requires active authentication)
router.get("/me", authenticateAdmin, getCurrentUser);

// Self-service change password endpoint for authenticated staff/operators/super-admins
router.put("/change-password", authenticateAdmin, changePassword);

// Public password reset request endpoint with rate limiting
router.post("/reset-request", authRateLimiter, requestPasswordReset);

export default router;
