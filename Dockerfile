# syntax=docker/dockerfile:1

# ============================================================
# Stage 1 — deps
# Instala dependências (pg é pure JS — sem compilação nativa)
# ============================================================
FROM node:22-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1

COPY package*.json ./

RUN npm ci

# ============================================================
# Stage 2 — builder
# Gera cliente Prisma e compila Next.js
# ============================================================
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

# ============================================================
# Stage 3 — migrate
# Derivado do builder: contém Prisma CLI (node_modules/.bin/prisma
# com symlinks criados pelo npm), prisma.config.ts, schema, migrations,
# pg e seed. Usado exclusivamente pelo serviço biblioteca-migrate.
# ============================================================
FROM builder AS migrate

ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed-init.js"]

# ============================================================
# Stage 4 — runner
# Imagem de produção. Inicia com node server.js.
# Inclui Prisma CLI, schema e migrations para permitir:
#   docker exec <container> npx prisma migrate deploy
#   docker exec <container> npx tsx prisma/seed-auth.ts
# ============================================================
FROM node:22-alpine AS runner

RUN apk add --no-cache libc6-compat curl

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Saída standalone do Next.js (inclui node_modules rastreados pelo nft)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cliente Prisma gerado (WASM) — não incluso no trace standalone
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# @prisma/client, @prisma/adapter-pg e @prisma/engines — garantia além do trace standalone
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# ── Prisma CLI + schema + migrations ───────────────────────────────────────
# Permite executar: npx prisma migrate deploy
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

# ── tsx + esbuild ──────────────────────────────────────────────────────────
# Permite executar: npx tsx prisma/seed-auth.ts
# @esbuild/ aqui é o binário Linux instalado no estágio builder (Alpine)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/tsx ./node_modules/.bin/tsx
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@esbuild ./node_modules/@esbuild

# ── Runtime deps do seed-auth.ts ───────────────────────────────────────────
# dotenv e bcryptjs: imports diretos em seed-auth.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/dotenv ./node_modules/dotenv
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs
# pg + deps transitivas completas (necessário pelo @prisma/adapter-pg)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg ./node_modules/pg
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-connection-string ./node_modules/pg-connection-string
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-int8 ./node_modules/pg-int8
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-pool ./node_modules/pg-pool
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-protocol ./node_modules/pg-protocol
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-types ./node_modules/pg-types
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pgpass ./node_modules/pgpass
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres-array ./node_modules/postgres-array
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres-bytea ./node_modules/postgres-bytea
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres-date ./node_modules/postgres-date
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres-interval ./node_modules/postgres-interval
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/split2 ./node_modules/split2

RUN mkdir -p storage/exports storage/imports && \
    chown -R nextjs:nodejs storage

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
