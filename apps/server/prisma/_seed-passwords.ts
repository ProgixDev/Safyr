/**
 * Script additif (NON destructif) : crée les comptes "credential" (mot de passe)
 * pour les utilisateurs déjà présents en base, sans rien effacer.
 * À supprimer après usage.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../generated/prisma/client";

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Safyr2026!";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main(): Promise<void> {
  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  let created = 0;
  let skipped = 0;
  for (const user of users) {
    const existing = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    created++;
    console.log(`  + credential pour ${user.email}`);
  }

  console.log(`\nTerminé : ${created} créé(s), ${skipped} déjà présent(s).`);
  console.log(`Mot de passe (tous comptes) : ${DEMO_PASSWORD}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("échec:", e);
  process.exit(1);
});
