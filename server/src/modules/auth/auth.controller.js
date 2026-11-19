import prisma from "../../config/db.js";
import { verifyPassword, hashPassword, signToken } from "../../utils/auth.js";
import { broadcastQueueUpdate } from "../vip-dashboard/realtime.js";

const COOKIE_NAME = "mesob_admin_token";
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

function getCookieOptions() {
  const isProduction =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.VERCEL);
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

    let user;
    try {
      user = await prisma.users.findUnique({
        where: { email: normalizedEmail },
        include: {
          institution: {
            select: {
              id: true,
              code: true,
              name: true,
              icon: true,
              floorRoomNumber: true,
            },
          },
        },
      });
    } catch (dbErr) {
      // Graceful fallback if in-memory or node_modules Prisma Client is missing newly migrated enum values
      if (dbErr.message && dbErr.message.includes("UserRole")) {
        const rawUsers = await prisma.$queryRaw`
          SELECT id, email, name, "passwordHash", role::text as role, "institutionId", "isActive"
          FROM users
          WHERE email = ${normalizedEmail}
          LIMIT 1
        `;
        user = rawUsers[0] || null;
      } else {
        throw dbErr;
      }
    }

    // Uniform error message to prevent user enumeration
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: "Your account is deactivated. Contact the system administrator.",
      });
    }

    // Only administrative and staff accounts can log into the staff/admin portal
    const ALLOWED_ADMIN_ROLES = ["SUPER_ADMIN", "OPERATOR", "STAFF"];
    if (!ALLOWED_ADMIN_ROLES.includes(user.role)) {
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
      institutionId: user.institutionId || null,
      institution: user.institution || null,
      mustChangePassword: Boolean(user.mustChangePassword),
    };

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      institutionId: user.institutionId || null,
    });

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
  const isProduction =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.VERCEL);
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
      institutionId: req.user.institutionId || null,
      institution: req.user.institution || null,
      mustChangePassword: Boolean(req.user.mustChangePassword),
    },
  });
}

/**
 * PUT /api/auth/change-password
 * Allows any authenticated user (SUPER_ADMIN, OPERATOR, STAFF) to change their password.
 */
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const userId = req.user.id;

    if (!currentPassword || typeof currentPassword !== "string") {
      return res.status(400).json({ error: "Current password is required." });
    }

    if (!newPassword || typeof newPassword !== "string") {
      return res.status(400).json({ error: "New password is required." });
    }

    // NIST SP 800-63B password complexity standards
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    const complexityMatches = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
    if (complexityMatches < 3) {
      return res.status(400).json({
        error: "Password must satisfy at least 3 of: uppercase letter, lowercase letter, number, and special character.",
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User account not found." });
    }

    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return res.status(400).json({ error: "The current password you entered is incorrect." });
    }

    const isSame = await verifyPassword(newPassword, user.passwordHash);
    if (isSame) {
      return res.status(400).json({ error: "Your new password must be different from your current password." });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.users.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    // Mark any active reset requests for this email as COMPLETED
    try {
      await prisma.password_reset_requests.updateMany({
        where: {
          email: user.email,
          status: { in: ["PENDING", "APPROVED"] },
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    } catch (e) {
      console.warn("Could not mark reset requests completed:", e.message);
    }

    return res.json({
      success: true,
      message: "Your password has been changed successfully.",
    });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({ error: "Failed to change password. Please try again later." });
  }
}

/**
 * POST /api/auth/reset-request
 * Public endpoint for staff/operators/admins who forgot their password to submit a reset request.
 * Controls against unauthorized resets by requiring Super Admin manual review and identity verification.
 */
export async function requestPasswordReset(req, res) {
  try {
    const { email, name, role, phone, institutionName, reason } = req.body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "A valid official email address is required." });
    }

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ error: "Your full name is required." });
    }

    const ALLOWED_ROLES = ["SUPER_ADMIN", "OPERATOR", "STAFF"];
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: "Please select an authorized role (Super Admin, Operator, or Staff)." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify if account exists in database matching role
    const existingUser = await prisma.users.findUnique({
      where: { email: normalizedEmail },
      include: {
        institution: {
          select: { name: true, code: true },
        },
      },
    });

    const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null;
    const userAgent = req.headers["user-agent"] || null;

    if (existingUser && existingUser.isActive && existingUser.role === role) {
      const pendingRequest = await prisma.password_reset_requests.findFirst({
        where: {
          email: normalizedEmail,
          status: "PENDING",
        },
      });

      if (pendingRequest) {
        await prisma.password_reset_requests.update({
          where: { id: pendingRequest.id },
          data: {
            name: name.trim(),
            phone: phone ? phone.trim() : existingUser.phone,
            institutionName: institutionName || existingUser.institution?.name?.en || existingUser.institution?.code || null,
            reason: reason ? reason.trim() : "Forgotten password",
            ipAddress: clientIp,
            userAgent,
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.password_reset_requests.create({
          data: {
            userId: existingUser.id,
            email: normalizedEmail,
            name: name.trim(),
            role,
            phone: phone ? phone.trim() : existingUser.phone,
            institutionName: institutionName || existingUser.institution?.name?.en || existingUser.institution?.code || null,
            reason: reason ? reason.trim() : "Forgotten password",
            status: "PENDING",
            ipAddress: clientIp,
            userAgent,
          },
        });
      }

      try {
        broadcastQueueUpdate({
          type: "PASSWORD_RESET_REQUESTED",
          email: normalizedEmail,
          role,
        });
      } catch {}
    } else {
      // Inward security logging: Record unverified request so Super Admin can audit unauthorized probes,
      // without exposing account existence to external attackers.
      await prisma.password_reset_requests.create({
        data: {
          userId: null,
          email: normalizedEmail,
          name: name.trim(),
          role,
          phone: phone ? phone.trim() : null,
          institutionName: institutionName || null,
          reason: `[UNVERIFIED IDENTITY PROBE] ${reason || "Account recovery attempted"}`,
          status: "PENDING",
          ipAddress: clientIp,
          userAgent,
        },
      });
    }

    return res.json({
      success: true,
      message:
        "Your password reset request has been securely submitted to the Super Administrator. For security verification, your supervisor will verify your identity and contact you.",
    });
  } catch (error) {
    console.error("requestPasswordReset error:", error);
    return res.status(500).json({ error: "Failed to submit reset request. Please try again later." });
  }
}
