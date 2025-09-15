/**
 * Run with:
 *   npx ts-node scripts/seed.ts
 * or compile then run with node
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = "password";
  const hash = await bcrypt.hash(password, 10);

  const acme = await prisma.tenant.upsert({
    where: { slug: "acme" },
    update: {},
    create: { name: "Acme", slug: "acme", plan: "free" },
  });

  const globex = await prisma.tenant.upsert({
    where: { slug: "globex" },
    update: {},
    create: { name: "Globex", slug: "globex", plan: "free" },
  });

  await prisma.user.upsert({
    where: { email: "admin@acme.test" },
    update: {},
    create: {
      email: "admin@acme.test",
      password: hash,
      role: "ADMIN",
      tenantId: acme.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "user@acme.test" },
    update: {},
    create: {
      email: "user@acme.test",
      password: hash,
      role: "MEMBER",
      tenantId: acme.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@globex.test" },
    update: {},
    create: {
      email: "admin@globex.test",
      password: hash,
      role: "ADMIN",
      tenantId: globex.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "user@globex.test" },
    update: {},
    create: {
      email: "user@globex.test",
      password: hash,
      role: "MEMBER",
      tenantId: globex.id,
    },
  });

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
