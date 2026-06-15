# Safyr — backend NestJS (processus persistant) pour Railway / Render / VPS.
# Railway clone le repo Git et build ce Dockerfile automatiquement.
FROM oven/bun:1.3

WORKDIR /app

# Copie du monorepo (.dockerignore exclut node_modules, .next, secrets…)
COPY . .

# Dépendances du workspace
RUN bun install --no-frozen-lockfile

# Le serveur importe @safyr/schemas depuis dist → on le build
RUN cd packages/schemas && bun run build

# Client Prisma (DATABASE_URL factice, uniquement pour la génération qui ne se
# connecte pas) puis build du serveur NestJS.
RUN cd apps/server \
  && DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/db" bunx prisma generate \
  && bunx nest build

ENV NODE_ENV=production

WORKDIR /app/apps/server
# Railway fournit la variable PORT ; main.ts écoute sur process.env.PORT / 0.0.0.0
CMD ["node", "dist/main.js"]
