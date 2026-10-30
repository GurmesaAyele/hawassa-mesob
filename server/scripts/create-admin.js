import dotenv from "dotenv";
dotenv.config();

import prisma from "../src/config/db.js";
import { hashPassword } from "../src/utils/auth.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: node scripts/create-admin.js <email> <password> [name] [role]");
    console.error("Allowed roles: SUPER_ADMIN (default), OPERATOR");
    console.error("Example: node scripts/create-admin.js manager@hawassa.gov.et Pass1234! 'Hawassa MESOB Manager' SUPER_ADMIN");
    process.exit(1);
  }

  const [email, password, name = "Administrator", role = "SUPER_ADMIN"] = args;

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole = role.trim().toUpperCase();

  if (!["SUPER_ADMIN", "OPERATOR"].includes(normalizedRole)) {
    console.error(`Error: Invalid role '${normalizedRole}'. Role must be 'SUPER_ADMIN' or 'OPERATOR'.`);
    process.exit(1);
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
      isActive: true,
    },
    create: {
      email: normalizedEmail,
      name: name.trim(),
      passwordHash,
      role: normalizedRole,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });

  console.log("--------------------------------------------------");
  console.log("Administrative account successfully provisioned!");
  console.log(`  ID:    ${user.id}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Name:  ${user.name}`);
  console.log(`  Role:  ${user.role}`);
  console.log(`  Active: ${user.isActive}`);
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
