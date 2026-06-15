# Safyr — backend NestJS (processus persistant) pour Railway / Render / VPS.
# Multi-stage : on BUILD avec bun (rapide, gère le workspace), mais on EXECUTE
# avec un VRAI Node.js. L'image oven/bun n'a pas de node : son binaire `node`
# lance en fait bun, et bun casse la DI NestJS (resolution des providers
# cross-module). En local `node dist/main.js` fonctionne -> on reproduit
# exactement cet environnement en prod.

# --- Stage build (bun) ---
FROM oven/bun:1.3 AS build
WORKDIR /app

# Copie du monorepo (.dockerignore exclut node_modules, .next, secrets…)
COPY . .

# Dépendances du workspace.
# --linker=hoisted : node_modules à plat (façon npm) au lieu du linker isolé
# (.bun symlinks) de bun, pour que Node résolve des instances uniques.
RUN bun install --no-frozen-lockfile --linker=hoisted

# Le serveur importe @safyr/schemas depuis dist → on le build
RUN cd packages/schemas && bun run build

# Client Prisma (DATABASE_URL factice, uniquement pour la génération qui ne se
# connecte pas) puis build du serveur NestJS.
RUN cd apps/server \
  && DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/db" bunx prisma generate \
  && bunx nest build

# --- Stage runtime (vrai Node.js) ---
FROM node:22-slim AS runtime
WORKDIR /app

# On récupère tout le workspace déjà installé + buildé depuis le stage bun
COPY --from=build /app /app

ENV NODE_ENV=production

WORKDIR /app/apps/server
# Railway fournit la variable PORT ; main.ts écoute sur process.env.PORT / 0.0.0.0
CMD ["node", "dist/main.js"]
