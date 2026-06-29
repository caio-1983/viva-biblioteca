# VPS-003 — Containerização Docker

## Contexto

Esta tarefa preparou o **viva-biblioteca** para execução em container Docker. A base de dados permanece SQLite para validar a containerização antes da migração para PostgreSQL (VPS-004).

---

## Arquivos criados / modificados

| Arquivo | Ação | Descrição |
|---|---|---|
| `Dockerfile` | Reescrito | Multi-stage build (deps → builder → runner) |
| `docker-compose.yml` | Atualizado | Healthcheck, rede nomeada, volume bind-mount |
| `.dockerignore` | Expandido | Exclui `storage/`, `.env`, `docs/`, `scripts/`, etc. |
| `next.config.ts` | Atualizado | `output: 'standalone'` + `outputFileTracingIncludes` |
| `app/api/health/route.ts` | Criado | Endpoint de healthcheck |

---

## Decisões de arquitetura

### Multi-stage build (3 estágios)

```
deps    →  builder  →  runner
```

| Estágio | Base | Propósito |
|---|---|---|
| `deps` | `node:22-alpine` | Compila `better-sqlite3` (nativo) + instala todas as deps |
| `builder` | `node:22-alpine` | `prisma generate` + `next build` |
| `runner` | `node:22-alpine` | Imagem mínima de produção |

### Node LTS

Fixado em `node:22-alpine` (Node 22 é Active LTS até 2027-04-30). Alpine reduz ~200MB em relação ao Debian slim.

### Standalone output

`next.config.ts` define `output: 'standalone'`, que gera `.next/standalone/server.js` — servidor Node puro sem necessidade de `next` instalado em runtime. Reduz drasticamente as dependências na imagem final.

### Módulos nativos (better-sqlite3)

O `better-sqlite3` compila um binário `.node` em C++. O file-tracing do Next.js não o detecta automaticamente. Solução: cópia explícita no stage `runner`:

```dockerfile
COPY --from=builder /app/node_modules/better-sqlite3        ./node_modules/better-sqlite3
COPY --from=builder /app/node_modules/bindings              ./node_modules/bindings
COPY --from=builder /app/node_modules/file-uri-to-path     ./node_modules/file-uri-to-path
```

`bindings` e `file-uri-to-path` são dependências de runtime do `better-sqlite3` para localizar o arquivo `.node`.

### Prisma com WASM compiler

Com o adapter `@prisma/adapter-better-sqlite3`, o Prisma usa o **WASM query compiler** (`query_compiler_fast_bg.wasm`) em vez do engine Rust nativo. Isso permite excluir os pacotes pesados:

| Pacote | Tamanho | Necessário em runtime? |
|---|---|---|
| `@prisma/engines` | 22.7MB | ❌ Não (engine Rust não usado) |
| `@prisma/studio-core` | 37.6MB | ❌ Não (UI do Prisma Studio) |
| `@prisma/dev` | 14.3MB | ❌ Não (ferramentas de dev) |
| `@prisma/client` | 75.4MB | ✅ Sim |
| `@prisma/adapter-better-sqlite3` | 80KB | ✅ Sim |

Economia: **~77MB** excluindo pacotes desnecessários.

### Electron no Docker

O `electron` está em `dependencies` (não `devDependencies`). Para evitar que o postinstall tente baixar o binário Electron durante `npm ci`:

```dockerfile
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
```

### Usuário não-root

```dockerfile
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs
```

O processo servidor roda como `nextjs` (UID 1001), sem privilégios de root.

### DATABASE_URL no container

Em `docker-compose.yml`, a URL é absoluta para evitar ambiguidade com CWD:

```yaml
DATABASE_URL: "file:/app/storage/database/biblioteca.db"
```

Em `lib/prisma.ts`, o fallback usa caminho relativo — funcional quando CWD = `/app`.

---

## Tamanho da imagem

| Versão | Tamanho |
|---|---|
| Antes da otimização (todos os `@prisma/*`) | 574MB |
| Após otimização (excluindo engines/studio/dev) | 461MB |
| Economia | ~113MB |

---

## Estrutura de volumes

```
./storage/              ← diretório local (bind mount)
  database/
    biblioteca.db       ← banco SQLite persistente
  backups/
  exports/
  imports/
```

O volume é bind-mounted para `./storage` no host, garantindo persistência entre restarts e facilidade de backup.

---

## Rede

```yaml
networks:
  biblioteca_net:
    driver: bridge
```

Rede bridge nomeada `biblioteca_net`. Quando PostgreSQL for adicionado (VPS-004), o serviço de banco de dados será adicionado nesta mesma rede.

---

## Healthcheck

Endpoint: `GET /api/health`

Resposta:
```json
{ "status": "ok", "timestamp": "2026-06-28T18:01:40.000Z" }
```

Configurado tanto no `HEALTHCHECK` do Dockerfile quanto no `healthcheck` do `docker-compose.yml`:
- `interval: 30s` — verifica a cada 30s
- `timeout: 10s` — falha se não responder em 10s
- `start_period: 60s` — aguarda 60s antes da primeira verificação (tempo de boot do Next.js)
- `retries: 3` — marca como `unhealthy` após 3 falhas consecutivas

---

## Comandos

### Build e execução

```bash
# Build
docker compose build

# Subir em background
docker compose up -d

# Ver logs
docker compose logs -f biblioteca

# Status do healthcheck
docker inspect viva-biblioteca --format '{{.State.Health.Status}}'

# Parar
docker compose down
```

### Build direto (sem compose)

```bash
docker build -t viva-biblioteca:latest .
docker run -d \
  --name viva-biblioteca \
  -p 3002:3000 \
  -e DATABASE_URL="file:/app/storage/database/biblioteca.db" \
  -v $(pwd)/storage:/app/storage \
  viva-biblioteca:latest
```

---

## Próximos passos

- **VPS-004**: Substituir SQLite por PostgreSQL — adicionar serviço `postgres` no `docker-compose.yml` e configurar `DATABASE_URL` para `postgresql://...`
- **VPS-005**: Configurar Nginx como reverse proxy (porta 80/443 → 3002)
- **VPS-006**: CI/CD com build automático na pipeline
