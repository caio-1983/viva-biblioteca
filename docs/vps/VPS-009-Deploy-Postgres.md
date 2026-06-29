# VPS-009 — Deploy PostgreSQL

## Contexto

Migrations e seed não fazem parte do ciclo de vida da stack do Portainer.
O serviço `biblioteca` inicia apenas com `node server.js`.
Migrations são executadas manualmente via script antes de cada deploy com schema changes.

A stack do Portainer contém apenas serviços permanentes:

| Serviço | Função |
| --- | --- |
| `postgres` | Banco de dados |
| `biblioteca` | Aplicação Next.js |

---

## Fluxo de deploy

```text
Portainer — Pull and redeploy
  └── constrói target: runner
  └── inicia biblioteca (node server.js)

Antes do deploy (quando há migrations):
  └── ./scripts/deploy/run-migrate.sh
        ├── constrói target: migrate
        ├── prisma migrate deploy
        └── node prisma/seed-init.js
```

---

## Primeira instalação

No servidor, com a stack já ativa no Portainer:

```bash
# 1. Garante que o postgres está rodando
docker compose up -d postgres

# 2. Executa migrations e seed
./scripts/deploy/run-migrate.sh

# 3. Sobe a aplicação via Portainer (Pull and redeploy)
#    ou via CLI:
docker compose up -d biblioteca
```

---

## Deploys futuros com novas migrations

```bash
# Antes de fazer Pull and redeploy no Portainer:
./scripts/deploy/run-migrate.sh
```

Se não houver migrations novas, o script é seguro de executar assim mesmo — o Prisma
detecta que não há nada a aplicar e finaliza sem erro.

---

## Como o script funciona

`scripts/deploy/run-migrate.sh`:

1. Constrói o stage `migrate` do Dockerfile (`docker build --target migrate`)
2. Executa o container temporário conectado à rede da stack (`--network viva-biblioteca_default`)
3. O container alcança o `biblioteca-postgres` pela rede, aplica as migrations e encerra

O container é descartado automaticamente (`--rm`). Nenhum serviço permanente é alterado.

### Variáveis configuráveis

```bash
# Rede da stack (padrão: viva-biblioteca_default)
NETWORK=minha-stack_default ./scripts/deploy/run-migrate.sh

# URL customizada do banco
DATABASE_URL="postgresql://user:pass@host:5432/db" ./scripts/deploy/run-migrate.sh
```

O nome da rede padrão é `<nome-da-stack>_default`. Se o nome da stack no Portainer
for diferente de `viva-biblioteca`, ajuste a variável `NETWORK`.

---

## Rollback

O Prisma não oferece rollback automático. Para reverter:

1. Restaurar backup do volume `postgres_data`
2. Fazer checkout da versão anterior do código
3. Executar `./scripts/deploy/run-migrate.sh`
4. Fazer Pull and redeploy no Portainer

Mantenha backups do volume `postgres_data` antes de qualquer deploy com schema changes.

---

## Alternativa local (sem Docker)

```bash
DATABASE_URL="postgresql://..." npm run deploy:postgres
```

Executa a mesma sequência localmente via Node.js:
`prisma migrate deploy` → `node prisma/seed-init.js`.

---

## Referência

| Comando | Descrição |
| --- | --- |
| `./scripts/deploy/run-migrate.sh` | Executa migrations + seed via Docker |
| `npm run deploy:postgres` | Executa migrations + seed localmente |
| `docker compose up -d postgres` | Inicia apenas o banco |
| `docker compose up -d biblioteca` | Inicia apenas a aplicação |
