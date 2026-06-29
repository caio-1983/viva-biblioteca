# VPS-009 — Deploy PostgreSQL via Container Dedicado

## Contexto

Migrations e seed não são executados pelo container da aplicação (`biblioteca`).
Isso evita dependência do Prisma CLI no runtime e mantém o startup da aplicação simples (`node server.js`).

A imagem `viva-biblioteca:latest` contém tanto a aplicação quanto o Prisma CLI.
O comando padrão (`CMD`) inicia apenas a aplicação. O serviço `biblioteca-migrate`
sobrescreve esse comando para executar migrations.

---

## Fluxo de deploy

```
docker compose build

         ↓

docker compose run --rm biblioteca-migrate
  ├── npx prisma migrate deploy   (aplica migrations pendentes)
  └── node prisma/seed-init.js    (garante registros obrigatórios)

         ↓

docker compose up -d biblioteca   (inicia a aplicação)
```

---

## Primeira instalação

```bash
# 1. Build da imagem
docker compose build

# 2. Sobe o banco e aguarda o healthcheck
docker compose up -d postgres

# 3. Executa migrations e seed
docker compose run --rm biblioteca-migrate

# 4. Inicia a aplicação
docker compose up -d biblioteca
```

---

## Deploys futuros

Sempre que houver novas migrations:

```bash
# 1. Rebuild da imagem com o novo código
docker compose build

# 2. Executa migrations (idempotente — não afeta dados existentes)
docker compose run --rm biblioteca-migrate

# 3. Reinicia a aplicação
docker compose up -d --no-deps biblioteca
```

Se não houver migrations novas, o passo 2 é seguro de executar mesmo assim
(o Prisma detecta que não há nada a aplicar e finaliza sem erro).

---

## Rollback

O Prisma não oferece rollback automático de migrations. Para reverter:

1. Restaurar backup do banco de dados
2. Fazer checkout da versão anterior do código
3. Rebuildar a imagem
4. Subir a aplicação

Mantenha backups regulares do volume `postgres_data` antes de deploys com schema changes.

---

## Executar migrations manualmente

Dentro do container em execução:

```bash
docker compose exec biblioteca node node_modules/prisma/bin/prisma.js migrate deploy
```

Ou via serviço dedicado (reinicia o container temporário):

```bash
docker compose run --rm biblioteca-migrate
```

---

## Alternativa local (sem Docker)

Para ambientes com Node.js disponível diretamente:

```bash
DATABASE_URL="postgresql://..." npm run deploy:postgres
```

O script `scripts/deploy/deploy-postgres.js` executa a mesma sequência:
prisma migrate deploy → seed-init.js.

---

## Referência

| Comando | Descrição |
|---------|-----------|
| `docker compose build` | Gera imagem `viva-biblioteca:latest` |
| `docker compose run --rm biblioteca-migrate` | Executa migrations + seed |
| `docker compose up -d biblioteca` | Inicia a aplicação |
| `docker compose up -d postgres` | Inicia apenas o banco |
| `npm run deploy:postgres` | Migrations locais (sem Docker) |
