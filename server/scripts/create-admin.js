import dotenv from "dotenv";
dotenv.config();

import prisma from "../src/config/db.js";
import { hashPassword } from "../src/utils/auth.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: node scripts/create-admin.js <email> <password> [name] [role] [institutionCodeOrId]");
    console.error("Allowed roles: SUPER_ADMIN (default), OPERATOR, STAFF");
    console.error("Example: node scripts/create-admin.js cbe.staff@mesob.hawassa.gov.et Pass1234! 'CBE VIP Staff' STAFF CBE");
    process.exit(1);
  }

  const [email, password, name = "Administrator", role = "SUPER_ADMIN", institutionInput] = args;

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole = role.trim().toUpperCase();

  if (!["SUPER_ADMIN", "OPERATOR", "STAFF"].includes(normalizedRole)) {
    console.error(`Error: Invalid role '${normalizedRole}'. Role must be 'SUPER_ADMIN', 'OPERATOR', or 'STAFF'.`);
    process.exit(1);
  }

  let institutionId = null;
  let institutionRecord = null;

  if (normalizedRole === "STAFF") {
    if (institutionInput) {
      institutionRecord = await prisma.serviceProvider.findFirst({
        where: {
          OR: [
            { id: institutionInput.trim() },
            { code: { equals: institutionInput.trim(), mode: "insensitive" } },
          ],
        },
      });

      if (!institutionRecord) {
        const available = await prisma.serviceProvider.findMany({
          select: { code: true, id: true, name: true },
        });
        console.error(`Error: Institution '${institutionInput}' was not found.`);
        console.error("Available institution codes:");
        available.forEach((inst) => {
          const enName = typeof inst.name === "object" ? inst.name.en : inst.name;
          console.error(`  - ${inst.code} (${enName}) [ID: ${inst.id}]`);
        });
        process.exit(1);
      }
      institutionId = institutionRecord.id;
    } else {
      // Default fallback to first institution if not specified (e.g. CBE)
      institutionRecord = await prisma.serviceProvider.findFirst({
        where: { code: "CBE" },
      }) || await prisma.serviceProvider.findFirst();
      if (institutionRecord) {
        institutionId = institutionRecord.id;
      }
    }
  }

  if (password.length < 8) {
    console.error("Error: Password must be at least 8 characters long.");
    process.exit(1);
  }

  console.log(`Hashing password with scrypt for ${normalizedEmail}...`);
  const passwordHash = await hashPassword(password);

  console.log(`Connecting to database and saving ${normalizedRole} account...`);
  const user = await prisma.users.upsert({
    where: { email: normalizedEmail },
    update: {
      name: name.trim(),
      passwordHash,
      role: normalizedRole,
      institutionId,
      isActive: true,
    },
    create: {
      email: normalizedEmail,
      name: name.trim(),
      passwordHash,
      role: normalizedRole,
      institutionId,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      institutionId: true,
      institution: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      isActive: true,
      updatedAt: true,
    },
  });

  const instName = user.institution?.name?.en || user.institution?.code || "None (Center-wide)";

  console.log("--------------------------------------------------");
  console.log("Administrative account successfully provisioned!");
  console.log(`  ID:          ${user.id}`);
  console.log(`  Email:       ${user.email}`);
  console.log(`  Name:        ${user.name}`);
  console.log(`  Role:        ${user.role}`);
  console.log(`  Institution: ${instName} (${user.institutionId || "Global"})`);
  console.log(`  Active:      ${user.isActive}`);
  console.log("--------------------------------------------------");
}

main()
  .catch((err) => {
    console.error("Failed to provision admin:", err.message || err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
