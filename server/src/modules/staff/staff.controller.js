import prisma from "../../config/db.js";
import { hashPassword } from "../../utils/auth.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Resolve an institution by either ID (UUID/cuid) or Code (e.g. "CBE", "ICS").
 */
async function resolveInstitution(institutionIdOrCode) {
  if (!institutionIdOrCode || typeof institutionIdOrCode !== "string") {
    return null;
  }

  const trimmed = institutionIdOrCode.trim();

  // 1. Try finding by ID
  let institution = await prisma.serviceProvider.findUnique({
    where: { id: trimmed },
    select: {
      id: true,
      code: true,
      name: true,
      icon: true,
      floorRoomNumber: true,
    },
  });

  // 2. Try finding by code (case-insensitive)
  if (!institution) {
    institution = await prisma.serviceProvider.findFirst({
      where: {
        code: {
          equals: trimmed,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        code: true,
        name: true,
        icon: true,
        floorRoomNumber: true,
      },
    });
  }

  return institution;
}

/**
 * POST /api/admin/staff
 * Super Admin creates a new staff member bound to an institution.
 */
export async function createStaffMember(req, res) {
  try {
    const { name, email, password, institutionId, institutionCode, phone, isActive } = req.body || {};

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ error: "Staff member name must be at least 2 characters." });
    }

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: "A valid email address is required." });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const assignedTarget = institutionId || institutionCode;
    if (!assignedTarget) {
      return res.status(400).json({ error: "An institutionId or institutionCode is required to bind the staff member." });
    }

    const institution = await resolveInstitution(assignedTarget);
    if (!institution) {
      return res.status(404).json({ error: `Assigned institution '${assignedTarget}' was not found.` });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check email uniqueness across all users
    const existingUser = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ error: "A user account with this email address already exists." });
    }

    const passwordHash = await hashPassword(password);

    const staffMember = await prisma.users.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone && typeof phone === "string" ? phone.trim() : null,
        passwordHash,
        role: "STAFF",
        institutionId: institution.id,
        isActive: isActive !== false,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        institutionId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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

    return res.status(201).json({
      success: true,
      message: "Staff member created successfully.",
      data: staffMember,
    });
  } catch (err) {
    console.error("createStaffMember error:", err);
    return res.status(500).json({ error: "Failed to create staff member." });
  }
}

/**
 * GET /api/admin/staff
 * Super Admin lists staff members with optional search, institution filtering, and pagination.
 */
export async function listStaffMembers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const { institutionId, institutionCode, search, status } = req.query;

    const where = {
      role: "STAFF",
    };

    if (institutionId || institutionCode) {
      const institution = await resolveInstitution(institutionId || institutionCode);
      if (institution) {
        where.institutionId = institution.id;
      } else {
        // Provided an unknown institution filter -> return empty results
        return res.json({
          success: true,
          data: [],
          meta: { total: 0, page, limit, totalPages: 0 },
        });
      }
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const [staffMembers, total] = await Promise.all([
      prisma.users.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          role: true,
          institutionId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
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
      }),
      prisma.users.count({ where }),
    ]);

    return res.json({
      success: true,
      data: staffMembers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("listStaffMembers error:", err);
    return res.status(500).json({ error: "Failed to list staff members." });
  }
}

/**
 * GET /api/admin/staff/:id
 * Super Admin retrieves details of a single staff member.
 */
export async function getStaffMemberById(req, res) {
  try {
    const { id } = req.params;

    const staffMember = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        institutionId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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

    if (!staffMember || staffMember.role !== "STAFF") {
      return res.status(404).json({ error: "Staff member not found." });
    }

    return res.json({
      success: true,
      data: staffMember,
    });
  } catch (err) {
    console.error("getStaffMemberById error:", err);
    return res.status(500).json({ error: "Failed to fetch staff member details." });
  }
}

/**
 * PATCH /api/admin/staff/:id
 * Super Admin updates details of a staff member (name, email, phone, institution, status, password).
 */
export async function updateStaffMember(req, res) {
  try {
    const { id } = req.params;
    const { name, email, phone, institutionId, institutionCode, isActive, password } = req.body || {};

    const existingStaff = await prisma.users.findUnique({
      where: { id },
    });

    if (!existingStaff || existingStaff.role !== "STAFF") {
      return res.status(404).json({ error: "Staff member not found." });
    }

    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({ error: "Staff member name must be at least 2 characters." });
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({ error: "A valid email address is required." });
      }
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== existingStaff.email) {
        const emailCollision = await prisma.users.findUnique({
          where: { email: normalizedEmail },
        });
        if (emailCollision && emailCollision.id !== id) {
          return res.status(409).json({ error: "A user account with this email address already exists." });
        }
        updateData.email = normalizedEmail;
      }
    }

    if (phone !== undefined) {
      updateData.phone = phone && typeof phone === "string" ? phone.trim() : null;
    }

    if (institutionId !== undefined || institutionCode !== undefined) {
      const assignedTarget = institutionId || institutionCode;
      const institution = await resolveInstitution(assignedTarget);
      if (!institution) {
        return res.status(404).json({ error: `Assigned institution '${assignedTarget}' was not found.` });
      }
      updateData.institutionId = institution.id;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (password !== undefined) {
      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
      }
      updateData.passwordHash = await hashPassword(password);
    }

    const updated = await prisma.users.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        institutionId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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

    return res.json({
      success: true,
      message: "Staff member updated successfully.",
      data: updated,
    });
  } catch (err) {
    console.error("updateStaffMember error:", err);
    return res.status(500).json({ error: "Failed to update staff member." });
  }
}

/**
 * DELETE /api/admin/staff/:id
 * Super Admin deletes a staff member account.
 */
export async function deleteStaffMember(req, res) {
  try {
    const { id } = req.params;

    const existingStaff = await prisma.users.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!existingStaff || existingStaff.role !== "STAFF") {
      return res.status(404).json({ error: "Staff member not found." });
    }

    if (req.user && req.user.id === id) {
      return res.status(400).json({ error: "You cannot delete your own account." });
    }

    await prisma.users.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Staff member account deleted successfully.",
      data: {
        id: existingStaff.id,
        email: existingStaff.email,
        name: existingStaff.name,
      },
    });
  } catch (err) {
    console.error("deleteStaffMember error:", err);
    return res.status(500).json({ error: "Failed to delete staff member." });
  }
}

