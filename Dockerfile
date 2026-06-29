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

# Prisma: cliente WASM gerado + escopo @prisma completo (inclui @prisma/engines
# e demais pacotes internos exigidos pelo CLI) + CLI para migrate deploy no entrypoint
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma     ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma     ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma      ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

# Driver PostgreSQL — necessário para o seed (seed-init.js usa pg diretamente)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg                   ./node_modules/pg
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-connection-string ./node_modules/pg-connection-string
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-pool              ./node_modules/pg-pool
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-protocol          ./node_modules/pg-protocol
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-types             ./node_modules/pg-types
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pgpass               ./node_modules/pgpass

# Schema, migrations e seed de inicialização
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Diretórios de persistência (exports/imports montados como volume em produção)
RUN mkdir -p storage/exports storage/imports && \
    chown -R nextjs:nodejs storage

# Entrypoint: executa migrate deploy antes de iniciar a aplicação
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["./docker-entrypoint.sh"]
