import crypto from "crypto";
import prisma from "../../config/db.js";
import { hashPassword } from "../../utils/auth.js";
import { broadcastQueueUpdate } from "../vip-dashboard/realtime.js";

/**
 * Generate a government-grade cryptographically secure temporary password
 * meeting NIST SP 800-63B standards (e.g. "Mesob#7482!Ax")
 */
function generateSecureTempPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";

  const getRandomChar = (charset) => charset[crypto.randomInt(0, charset.length)];

  const chars = [
    getRandomChar(upper),
    getRandomChar(upper),
    getRandomChar(lower),
    getRandomChar(lower),
    getRandomChar(digits),
    getRandomChar(digits),
    getRandomChar(symbols),
    getRandomChar(symbols),
    getRandomChar(upper),
    getRandomChar(lower),
  ];

  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return "Mesob#" + chars.join("");
}

/**
 * GET /api/admin/reset-requests
 * Super Admin lists all password reset requests with filtering.
 */
export async function listResetRequests(req, res) {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { role: { contains: q, mode: "insensitive" } },
      ];
    }

    const requests = await prisma.password_reset_requests.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const pendingCount = await prisma.password_reset_requests.count({
      where: { status: "PENDING" },
    });

    return res.json({
      success: true,
      data: requests,
      meta: {
        total: requests.length,
        pendingCount,
      },
    });
  } catch (error) {
    console.error("listResetRequests error:", error);
    return res.status(500).json({ error: "Failed to fetch password reset requests." });
  }
}

/**
 * PATCH /api/admin/reset-requests/:id/approve
 * Super Admin approves a reset request, sets a temporary password and forces account password change.
 */
export async function approveResetRequest(req, res) {
  try {
    const { id } = req.params;
    const customTempPassword = req.body?.tempPassword;

    const resetRequest = await prisma.password_reset_requests.findUnique({
      where: { id },
    });

    if (!resetRequest) {
      return res.status(404).json({ error: "Password reset request not found." });
    }

    if (resetRequest.status === "APPROVED" || resetRequest.status === "COMPLETED") {
      return res.status(400).json({ error: `Request is already ${resetRequest.status.toLowerCase()}.` });
    }

    const user = await prisma.users.findUnique({
      where: { email: resetRequest.email },
    });

    if (!user) {
      return res.status(404).json({
        error: `No active account was found matching email '${resetRequest.email}'. Cannot reset password.`,
      });
    }

    const tempPassword = (customTempPassword && customTempPassword.trim().length >= 8)
      ? customTempPassword.trim()
      : generateSecureTempPassword();

    const passwordHash = await hashPassword(tempPassword);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: true,
        isActive: true,
      },
    });

    const updatedRequest = await prisma.password_reset_requests.update({
      where: { id },
      data: {
        status: "APPROVED",
        tempPassword,
        reviewedById: req.user.id,
        reviewedByName: req.user.name,
        reviewedAt: new Date(),
      },
    });

    try {
      broadcastQueueUpdate({
        type: "RESET_REQUEST_APPROVED",
        requestId: id,
        email: user.email,
      });
    } catch {}

    return res.json({
      success: true,
      message: "Password reset approved successfully.",
      tempPassword,
      request: updatedRequest,
    });
  } catch (error) {
    console.error("approveResetRequest error:", error);
    return res.status(500).json({ error: "Failed to approve password reset request." });
  }
}

/**
 * PATCH /api/admin/reset-requests/:id/reject
 * Super Admin rejects an unauthorized or suspicious request.
 */
export async function rejectResetRequest(req, res) {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body || {};

    const resetRequest = await prisma.password_reset_requests.findUnique({
      where: { id },
    });

    if (!resetRequest) {
      return res.status(404).json({ error: "Password reset request not found." });
    }

    const updatedRequest = await prisma.password_reset_requests.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: rejectionReason && rejectionReason.trim() ? rejectionReason.trim() : "Rejected by Super Administrator",
        reviewedById: req.user.id,
        reviewedByName: req.user.name,
        reviewedAt: new Date(),
      },
    });

    try {
      broadcastQueueUpdate({
        type: "RESET_REQUEST_REJECTED",
        requestId: id,
      });
    } catch {}

    return res.json({
      success: true,
      message: "Password reset request has been rejected.",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("rejectResetRequest error:", error);
    return res.status(500).json({ error: "Failed to reject password reset request." });
  }
}

/**
 * DELETE /api/admin/reset-requests/:id
 * Super Admin deletes a request from history.
 */
export async function deleteResetRequest(req, res) {
  try {
    const { id } = req.params;

    await prisma.password_reset_requests.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Reset request removed from history.",
    });
  } catch (error) {
    console.error("deleteResetRequest error:", error);
    return res.status(500).json({ error: "Failed to delete reset request." });
  }
}
