# syntax=docker/dockerfile:1

# ============================================================
# Stage 1 — deps
# Instala dependências (pg é pure JS — sem compilação nativa)
# ============================================================
FROM node:22-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Impede download do binário Electron (não necessário em servidor)
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
# Stage 3 — runner
# Imagem de produção mínima (~standalone)
# ============================================================
FROM node:22-alpine AS runner

RUN apk add --no-cache libc6-compat curl

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Saída standalone do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cliente Prisma gerado (WASM query compiler — sem engine Rust necessário)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma                      ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client               ./node_modules/@prisma/client
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client-runtime-utils ./node_modules/@prisma/client-runtime-utils
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/adapter-pg           ./node_modules/@prisma/adapter-pg
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/driver-adapter-utils ./node_modules/@prisma/driver-adapter-utils
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/debug                ./node_modules/@prisma/debug
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/config               ./node_modules/@prisma/config
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/engines-version      ./node_modules/@prisma/engines-version

# Driver PostgreSQL (pure JS — explicitado para garantir inclusão no standalone)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg                           ./node_modules/pg
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-connection-string         ./node_modules/pg-connection-string
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-pool                      ./node_modules/pg-pool
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-protocol                  ./node_modules/pg-protocol
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-types                     ./node_modules/pg-types
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pgpass                       ./node_modules/pgpass

# Diretórios de persistência (exports/imports montados como volume em produção)
RUN mkdir -p storage/exports storage/imports && \
    chown -R nextjs:nodejs storage

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
