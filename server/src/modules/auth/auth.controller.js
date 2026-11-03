import prisma from "../../config/db.js";
import { verifyPassword, signToken } from "../../utils/auth.js";

const COOKIE_NAME = "mesob_admin_token";
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  };
}

/**
 * POST /api/auth/login
 * Authenticates an admin user (SUPER_ADMIN or OPERATOR).
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Email is required." });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({ error: "Password is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    // Uniform error message to prevent user enumeration
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: "Your account is deactivated. Contact the system administrator.",
      });
    }

    // Citizen accounts cannot log into the administrative dashboard
    if (user.role !== "SUPER_ADMIN" && user.role !== "OPERATOR") {
      return res.status(403).json({
        error: "Access denied. Administrative role required.",
      });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = signToken(safeUser);

    res.cookie(COOKIE_NAME, token, getCookieOptions());

    return res.json({
      message: "Authentication successful.",
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Sign in failed. Please try again later." });
  }
}

/**
 * POST /api/auth/logout
 * Clears the session cookie and invalidates client session.
 */
export function logout(req, res) {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });

  return res.json({
    success: true,
    message: "Logged out successfully.",
  });
}

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile and assigned role.
 */
export function getCurrentUser(req, res) {
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    },
  });
}
