# VPS-004 — Migração SQLite → PostgreSQL

**Sprint:** VPS-004  
**Data de execução:** 2026-06-28  
**Status:** ✅ Concluído

---

## 1. Objetivo

Migrar completamente a camada de persistência do Viva Biblioteca de SQLite para PostgreSQL, sem alterar regras de negócio, interfaces ou APIs.

---

## 2. Arquitetura adotada

### Antes (SQLite)
```
Next.js App
    ↓
lib/prisma.ts (PrismaClient + BetterSQLite3 Adapter)
    ↓
storage/database/biblioteca.db (arquivo SQLite)
```

### Depois (PostgreSQL)
```
Next.js App
    ↓
lib/prisma.ts (PrismaClient + PrismaPg Adapter)
    ↓
PostgreSQL 16 (Docker: biblioteca-postgres:5432)
    ↓
Volume persistente: postgres_data
```

### Observações sobre Prisma 7

Em Prisma 7, o engine padrão é o **query engine Wasm** ("client"), que é **obrigatoriamente** ativado com um driver adapter. Não é possível usar `new PrismaClient()` sem passar `adapter` ou `accelerateUrl`.

- **SQLite:** `@prisma/adapter-better-sqlite3` → removido
- **PostgreSQL:** `@prisma/adapter-pg` + `pg` → adicionado

---

## 3. Arquivos criados

| Arquivo | Descrição |
|---------|-----------|
| `scripts/migration/sqlite-to-postgres.ts` | Script de migração de dados SQLite → PostgreSQL |
| `scripts/migration/validate-migration.ts` | Script de validação pós-migração |
| `storage/reports/migration-validation.json` | Relatório de validação (JSON) |
| `storage/reports/migration-validation.md` | Relatório de validação (Markdown) |
| `docs/vps/VPS-004-PostgreSQL-Migration.md` | Este documento |
| `prisma/migrations/20260628183701_init_postgresql/` | Migration SQL para PostgreSQL |
| `prisma/_sqlite_migrations_archive/` | Migrations SQLite arquivadas |

---

## 4. Arquivos alterados

| Arquivo | O que mudou |
|---------|-------------|
| `prisma/schema.prisma` | `provider = "sqlite"` → `provider = "postgresql"` |
| `prisma/migrations/migration_lock.toml` | `provider = "sqlite"` → `provider = "postgresql"` |
| `lib/prisma.ts` | Trocado BetterSQLite3 por PrismaPg adapter |
| `prisma.config.ts` | URL padrão atualizada para PostgreSQL |
| `.env` | `DATABASE_URL` → PostgreSQL; `SQLITE_URL` adicionado para migração |
| `docker-compose.yml` | Adicionado serviço `postgres` (PostgreSQL 16-alpine com healthcheck) |
| `Dockerfile` | Adicionado `python3 make g++` para compilar `better-sqlite3` |
| `package.json` | Removido `@prisma/adapter-better-sqlite3`; adicionado `@prisma/adapter-pg`, `pg`, `@types/pg`, `@types/better-sqlite3` |
| `src/repositories/exemplar.repository.ts` | Adicionado `mode: 'insensitive'` em 5 queries `contains` |
| `src/repositories/emprestimo.repository.ts` | Corrigido `findMaisEmprestados` e `findPorDia` para PostgreSQL |
| `scripts/etapa2/_prisma.ts` | Trocado BetterSQLite3 por PrismaPg adapter |
| `scripts/verify-p6.ts` | Trocado Prisma+adapter por `better-sqlite3` direto |

---

## 5. Estratégia de migração

### Ordem de migração de dados

A ordem respeita as dependências referenciais:

```
Sequencia → Configuracao → Acervo → Usuario → Obra
    → Exemplar → MigracaoAuditoria → Emprestimo
```

### Processo

1. **SQLite aberto em modo leitura** (`{ readonly: true }`) para garantir que a origem não seja alterada
2. **Verificação de banco vazio** antes de iniciar: aborta se PostgreSQL já contém dados
3. **IDs preservados** via `createMany` com IDs explícitos
4. **Conversão de tipos**: strings ISO para `Date`, inteiros `0/1` para `boolean`
5. **Sequences atualizadas** com `setval(seq, MAX(id)+1, false)` após cada tabela
6. **Execução única segura**: verificação inicial impede re-execução acidental

### Resultado da migração

| Tabela | SQLite | PostgreSQL | Status |
|--------|--------|------------|--------|
| Sequencia | 1 | 1 | ✅ |
| Configuracao | 1 | 1 | ✅ |
| Acervo | 67 | 67 | ✅ |
| Usuario | 4 | 4 | ✅ |
| Obra | 67 | 67 | ✅ |
| Exemplar | 68 | 68 | ✅ |
| MigracaoAuditoria | 67 | 67 | ✅ |
| Emprestimo | 7 | 7 | ✅ |
| **Total** | **282** | **282** | ✅ |

---

## 6. Resultado da validação

**Status: ✅ APROVADO — 32/32 checks passaram**

| Categoria | Checks | Resultado |
|-----------|--------|-----------|
| CONTAGEM | 8 | ✅ Todos aprovados |
| REFERENCIAL | 3 | ✅ Todos aprovados |
| CONSTRAINT | 3 | ✅ Todos aprovados |
| ENUM | 3 | ✅ Todos aprovados |
| DATA | 3 | ✅ Todos aprovados |
| CODIGO/SEQUENCE | 3 | ✅ Todos aprovados |
| CONFIG | 2 | ✅ Todos aprovados |
| SEQUENCE | 7 | ✅ Todos aprovados |

Relatório completo em: `storage/reports/migration-validation.json`

---

## 7. Compatibilidade PostgreSQL — correções no código

### 7.1 Buscas case-insensitive

SQLite faz `LIKE` case-insensitivo por padrão. PostgreSQL faz case-sensível.

**Arquivo:** `src/repositories/exemplar.repository.ts`

```typescript
// Antes
titulo: { contains: filters.titulo }

// Depois
titulo: { contains: filters.titulo, mode: 'insensitive' }
```

Campos corrigidos: `titulo`, `autor`, `assunto1`, `assunto2`, `assunto3`

### 7.2 Raw SQL — Identificadores case-sensitive

PostgreSQL requer que identificadores camelCase sejam citados com aspas duplas.

**Arquivo:** `src/repositories/emprestimo.repository.ts`

**`findMaisEmprestados`:**
```sql
-- Antes (SQLite)
SELECT o.titulo, o.autor, ex.codigoExemplar, COUNT(*) AS totalEmprestimos
FROM Emprestimo e JOIN Exemplar ex ON ex.id = e.exemplarId
JOIN Obra o ON o.id = ex.obraId
GROUP BY e.exemplarId ORDER BY totalEmprestimos DESC LIMIT ${limit}

-- Depois (PostgreSQL)
SELECT o.titulo, o.autor, ex."codigoExemplar", COUNT(*) AS "totalEmprestimos"
FROM "Emprestimo" e JOIN "Exemplar" ex ON ex.id = e."exemplarId"
JOIN "Obra" o ON o.id = ex."obraId"
GROUP BY ex."codigoExemplar", o.titulo, o.autor
ORDER BY COUNT(*) DESC LIMIT ${limit}
```

Nota: `GROUP BY` expandido para incluir todos os campos não-agregados (obrigatório no PostgreSQL, SQLite era permissivo).

**`findPorDia`:**
```sql
-- Antes (SQLite)
SELECT date(dataEmprestimo) AS data, COUNT(*) AS total
FROM Emprestimo WHERE date(dataEmprestimo) >= ${sinceStr}

-- Depois (PostgreSQL)
SELECT TO_CHAR("dataEmprestimo", 'YYYY-MM-DD') AS data, COUNT(*) AS total
FROM "Emprestimo" WHERE "dataEmprestimo" >= ${since}
```

- `date()` → `TO_CHAR()` para retornar string ao invés de tipo `date`
- Parâmetro `since` como `Date` object (ao invés de string ISO)

---

## 8. Infraestrutura Docker

### docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: biblioteca-postgres
    environment:
      POSTGRES_DB: biblioteca
      POSTGRES_USER: biblioteca
      POSTGRES_PASSWORD: biblioteca
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U biblioteca -d biblioteca"]

  biblioteca:
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://biblioteca:biblioteca@postgres:5432/biblioteca

volumes:
  postgres_data:
```

---

## 9. Comandos utilizados

```bash
# 1. Iniciar PostgreSQL
docker compose up -d postgres

# 2. Aguardar health check
docker compose ps postgres

# 3. Instalar dependências
npm install

# 4. Criar migration PostgreSQL
npx prisma migrate dev --name init_postgresql

# 5. Gerar Prisma Client
npx prisma generate

# 6. Build da aplicação
npm run build

# 7. Executar migração de dados
npm run pg:migrate

# 8. Validar migração
npm run pg:validate
```

---

## 10. Estratégia de rollback

Em caso de problemas graves, o rollback consiste em:

1. **Parar a aplicação**
2. **Restaurar `.env`** com `DATABASE_URL` apontando para SQLite: `file:./storage/database/biblioteca.db`
3. **Restaurar `lib/prisma.ts`** para usar `@prisma/adapter-better-sqlite3`
4. **Restaurar `prisma/schema.prisma`** com `provider = "sqlite"`
5. **Restaurar migrations** de `prisma/_sqlite_migrations_archive/` para `prisma/migrations/`

O banco SQLite (`storage/database/biblioteca.db`) nunca foi alterado (aberto apenas em modo leitura pela migração).

---

## 11. Riscos e limitações

### Riscos identificados

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Race condition em `generateNumeroCadastro` | Alto | Alto (PostgreSQL concorrente) | **Sprint 005** |
| Race condition em empréstimo/devolução | Médio | Médio | **Sprint 005** |
| `codigoExemplar` com formato legado (não EX000000) | Baixo | Atual | Dados herdados da Etapa 2 |

### Limitações desta sprint

1. **Race conditions NÃO corrigidas** (conforme especificado, Sprint 005 tratará isso):
   - `leitor.repository.ts:generateNumeroCadastro` — busca findFirst + incremento manual sem transação
   - `emprestimo.service.ts` e `devolucao.service.ts` — operações sem atomicidade completa

2. **Códigos EX legados** — A Etapa 2 gerou `codigoExemplar` usando `numeroExemplar` do Acervo (não no formato `EX000000`). Isso é dado pré-existente, não um problema de migração.

3. **SQLite não removido** — mantido como fonte de migração e backup.

---

## 12. Checklist de validação

- [x] `prisma/schema.prisma` com `provider = "postgresql"`
- [x] `lib/prisma.ts` usando `@prisma/adapter-pg`
- [x] `docker-compose.yml` com serviço PostgreSQL + healthcheck
- [x] Migration SQL gerada e aplicada (`20260628183701_init_postgresql`)
- [x] `npm install` sem erros
- [x] `prisma generate` sem erros
- [x] `prisma migrate dev` sem erros
- [x] `npm run build` sem erros
- [x] Migração de dados: 282/282 registros
- [x] Validação: 32/32 checks aprovados
- [x] Sequences PostgreSQL atualizadas
- [x] Integridade referencial preservada
- [x] Enums PostgreSQL funcionando
- [x] Buscas case-insensitive corrigidas
- [x] Raw SQL adaptado para PostgreSQL

---

## 13. Pendências para Sprint 005

1. **Corrigir race condition** em `leitor.repository.ts:generateNumeroCadastro`:
   - Usar tabela `Sequencia` para `numeroCadastro` (igual ao `codigoExemplar`)
   - Ou usar `SELECT ... FOR UPDATE` numa transação

2. **Atomicidade em empréstimos/devoluções** em `emprestimo.service.ts` e `devolucao.service.ts`:
   - Envolver create + updateStatus em transação única

3. **Normalizar `codigoExemplar` legados** (opcional):
   - 65 de 68 exemplares têm códigos no formato antigo (não `EX000000`)
   - Avaliar se vale a pena renumerar ou manter o formato legado

4. **Configurar variáveis sensíveis de produção**:
   - `POSTGRES_PASSWORD` não deve ser `biblioteca` em produção
   - Usar secrets do Docker Swarm ou variáveis de ambiente seguras
