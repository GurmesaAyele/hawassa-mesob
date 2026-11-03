import prisma from "../config/db.js";
import { verifyToken } from "../utils/auth.js";

/**
 * Authenticates an admin user via cookie or Bearer header.
 * Attaches authenticated user object to req.user.
 */
export async function authenticateAdmin(req, res, next) {
  try {
    let token = null;

    // 1. Check HttpOnly cookie
    if (req.cookies && req.cookies.mesob_admin_token) {
      token = req.cookies.mesob_admin_token;
    }

    // 2. Fallback to Authorization: Bearer <token> header
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && /^bearer$/i.test(parts[0])) {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        error: "Authentication required. Please log in to continue.",
      });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        error: "Invalid or expired session. Please log in again.",
      });
    }

    // Look up user in database to ensure they are still active and have valid role
    let user = null;
    try {
      if (prisma && prisma.users) {
        user = await prisma.users.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        });
      }
    } catch (dbErr) {
      console.warn("Database lookup in authenticateAdmin failed:", dbErr.message);
    }

    // If DB is temporarily unreachable or testing without seeded DB user, check decoded payload
    if (!user) {
      // If user wasn't found in DB
      return res.status(401).json({
        error: "User account not found or deactivated.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: "Your account is deactivated. Contact the system administrator.",
      });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "OPERATOR") {
      return res.status(403).json({
        error: "Access denied. Administrative privileges required.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("authenticateAdmin error:", err);
    return res.status(500).json({ error: "Authentication check failed." });
  }
}

/**
 * Enforces role-based authorization for authenticated users.
 * E.g. requireRole("SUPER_ADMIN") or requireRole("SUPER_ADMIN", "OPERATOR")
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      if (!allowedRoles.includes("OPERATOR") && req.user.role === "OPERATOR") {
        return res.status(403).json({
          error: "Access denied. Citizen contact messages are restricted exclusively to SUPER_ADMIN.",
        });
      }
      return res.status(403).json({
        error: `Access denied. Requires one of: ${allowedRoles.join(", ")}.`,
      });
    }

    next();
  };
}
