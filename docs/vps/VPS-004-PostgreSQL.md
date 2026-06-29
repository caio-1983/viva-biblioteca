# VPS-004 — Migração SQLite → PostgreSQL

> **Status**: Planejamento  
> **Pré-requisito**: VPS-003 (containerização Docker) concluído  
> **Estratégia**: 4 etapas independentes, validação obrigatória antes da troca definitiva

---

## 1. Contexto e motivações

O sistema usa SQLite via `@prisma/adapter-better-sqlite3`. Para produção em VPS com múltiplos usuários simultâneos, PostgreSQL oferece:

- Controle de concorrência granular (MVCC)
- Suporte real a múltiplas conexões simultâneas
- Tipos nativos para enums, timestamps e SERIAL/SEQUENCE
- Melhor desempenho em consultas filtradas por índice

O sistema está em fase de demonstração — sem dados de produção reais — o que permite uma migração sem restrição de tempo de inatividade.

---

## 2. Análise de impacto

### 2.1 Diferenças críticas SQLite → PostgreSQL

| Aspecto | SQLite | PostgreSQL | Impacto |
|---|---|---|---|
| Enums | TEXT (validado pelo Prisma) | Tipo nativo `CREATE TYPE` | Schema muda; dados válidos se os valores coincidirem |
| DateTime | INTEGER (unix) ou TEXT ISO | TIMESTAMPTZ | Conversão necessária no script de migração |
| Auto-increment | `AUTOINCREMENT` | `SERIAL` / `SEQUENCE` | Sequences devem ser resetadas após import |
| Concorrência | Write serializado | MVCC total | Race conditions latentes ficam expostas |
| Sensibilidade a case | NOCASE por padrão | Sensível a maiúsculas | Queries `contains` mudarão comportamento |
| NULL em campos únicos | Um NULL por coluna | Múltiplos NULLs permitidos | Sem impacto negativo |

### 2.2 Achados na análise do código

#### Geração de codigoExemplar (EX000001) — **SEGURO**
`exemplar.repository.ts:10-52` e `obra.repository.ts:21-45` usam `$transaction` com `{ increment: 1 }`. O Prisma traduz para `UPDATE "Sequencia" SET "valor" = "valor" + 1 WHERE "nome" = 'exemplar' RETURNING "valor"` — operação atômica também no PostgreSQL com lock de linha no `UPDATE`.

#### Geração de numeroCadastro (US000001) — **RACE CONDITION**
`leitor.repository.ts:55-58` faz `findFirst` + incremento manual **sem transação**. No PostgreSQL com conexões paralelas, duas requisições simultâneas lerão o mesmo `last` e gerarão o mesmo `numeroCadastro`. A constraint `@unique` capturará o erro, mas a UX será `500 Internal Server Error`. Deve ser corrigido na **Etapa 4**.

#### Empréstimos e Devoluções — **RACE CONDITION LATENTE**
`emprestimo.service.ts:21-22` e `devolucao.service.ts:10-11` executam `create/update` e `updateStatus` como operações separadas sem transação. No PostgreSQL, o risco de duplicação de empréstimo do mesmo exemplar é real. Será corrigido na **Etapa 4** junto com a troca definitiva.

#### Buscas com `contains` — **MUDANÇA DE COMPORTAMENTO**
Queries como `{ titulo: { contains: filters.titulo } }` são case-insensitive no SQLite por padrão. No PostgreSQL, passam a ser case-sensitive. Deve-se usar `{ contains: value, mode: 'insensitive' }` em todos os filtros de texto.

---

## 3. Etapa 1 — Infraestrutura PostgreSQL

**Objetivo**: criar a infraestrutura completa sem tocar nos dados. Ao final, a aplicação continuará rodando com SQLite; o PostgreSQL ficará disponível mas vazio.

### 3.1 Arquivos alterados

| Arquivo | Tipo | O que muda |
|---|---|---|
| `docker-compose.yml` | Modificado | Adiciona serviço `postgres` e `pgadmin` (opcional) |
| `docker-compose.sqlite.yml` | Criado | Backup do compose atual (rollback) |
| `prisma/schema.prisma` | Modificado | `provider = "postgresql"` |
| `prisma.config.ts` | Modificado | URL → `postgresql://` |
| `prisma/migrations/` | Criado | Migrations limpas geradas para PostgreSQL |

### 3.2 Mudança no schema.prisma

```diff
datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
}
```

Os enums (`StatusExemplar`, `StatusEmprestimo`) serão criados automaticamente como tipos PostgreSQL nativos pela migration.

### 3.3 Mudança no docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: viva-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: biblioteca
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: biblioteca
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - biblioteca_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U biblioteca"]
      interval: 10s
      timeout: 5s
      retries: 5

  biblioteca:
    # ... (mantém configuração atual até Etapa 4)
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
```

A variável `POSTGRES_PASSWORD` virá de um arquivo `.env` (não versionado).

### 3.4 Geração de migrations limpas

```bash
# Com o PostgreSQL rodando via compose:
DATABASE_URL="postgresql://biblioteca:senha@localhost:5432/biblioteca" \
  npx prisma migrate dev --name init_postgresql --create-only

# Revisar a migration gerada em prisma/migrations/
# Executar contra o banco PostgreSQL:
npx prisma migrate deploy
```

A migration gerada conterá:
- `CREATE TYPE "StatusExemplar" AS ENUM (...)`
- `CREATE TYPE "StatusEmprestimo" AS ENUM (...)`
- `CREATE TABLE "Obra" (id SERIAL PRIMARY KEY, ...)`
- Todos os índices definidos no schema
- Todas as foreign keys com `ON DELETE RESTRICT`

### 3.5 Verificação ao final da Etapa 1

```bash
# Conectar ao PostgreSQL e verificar o schema:
docker exec -it viva-postgres psql -U biblioteca -c "\dt"
# Deve listar: Obra, Exemplar, Usuario, Emprestimo, Acervo,
#              MigracaoAuditoria, Configuracao, Sequencia

docker exec -it viva-postgres psql -U biblioteca -c "\dT+"
# Deve listar: StatusExemplar, StatusEmprestimo
```

---

## 4. Etapa 2 — Script de migração de dados

**Arquivo**: `scripts/migration/sqlite-to-postgres.ts`

**Execução**: standalone, fora do Next.js, com `tsx scripts/migration/sqlite-to-postgres.ts`

### 4.1 Princípios do script

- **Idempotente**: usa `upsert` onde possível (nas tabelas sem FK); nas dependentes, verifica existência antes de inserir
- **Fail-fast**: qualquer erro de validação ou inserção interrompe imediatamente a execução com log do registro problemático
- **Log detalhado**: cada tabela registra início, fim, contagem e eventuais erros
- **Transacional por tabela**: cada tabela é migrada em uma única transação PostgreSQL para rollback parcial em caso de erro
- **Preserva IDs**: usa `id` originais para manter integridade das FKs durante a migração

### 4.2 Ordem de importação (respeita dependências de FK)

```
1. Sequencia         (sem FK; autônomos)
2. Configuracao      (sem FK)
3. Acervo            (sem FK)
4. Usuario           (sem FK)
5. Obra              (sem FK)
6. Exemplar          (FK → Obra)
7. MigracaoAuditoria (sem FK formal; depende de Exemplar/Obra por integridade lógica)
8. Emprestimo        (FK → Usuario + Exemplar)

9. RESET SEQUENCES   (após todas as inserções)
```

### 4.3 Conversões de tipo necessárias

| Campo | SQLite | PostgreSQL | Conversão |
|---|---|---|---|
| `DateTime` | ISO 8601 string ou integer | `Date` JS → Prisma `new Date(value)` | `new Date(rawValue)` |
| `Boolean` | `0` / `1` | `true` / `false` | `Boolean(rawValue)` |
| Enums | `"DISPONIVEL"` (string) | `StatusExemplar.DISPONIVEL` | Validar contra enum conhecido |
| `Float` (valor) | REAL | FLOAT8 | Sem conversão necessária |
| `Int` (anoPublicacao) | INTEGER | INTEGER | Sem conversão |
| `null` | `null` / `undefined` | `null` | Normalizar `undefined` → `null` |

### 4.4 Estrutura do script

```typescript
// scripts/migration/sqlite-to-postgres.ts

const SQLITE_URL = process.env.SQLITE_URL ?? './storage/database/biblioteca.db'
const PG_URL = process.env.DATABASE_URL  // postgresql://...

// Abre conexão direta com SQLite (sem Prisma, para leitura raw)
// Usa @prisma/client com adapter pg para escrita no PostgreSQL

// Para cada tabela:
//   1. Lê todos os registros do SQLite
//   2. Valida tipos e valores de enum
//   3. Converte tipos
//   4. Insere em PostgreSQL dentro de $transaction
//   5. Loga contagem e duração
// 
// Ao final:
//   6. Reseta todas as sequences do PostgreSQL
//   7. Imprime resumo
```

### 4.5 Reset de sequences PostgreSQL após importação

```sql
-- Executado automaticamente ao final do script de migração:
SELECT setval(pg_get_serial_sequence('"Obra"',              'id'), COALESCE(MAX(id), 0)) FROM "Obra";
SELECT setval(pg_get_serial_sequence('"Exemplar"',          'id'), COALESCE(MAX(id), 0)) FROM "Exemplar";
SELECT setval(pg_get_serial_sequence('"Usuario"',           'id'), COALESCE(MAX(id), 0)) FROM "Usuario";
SELECT setval(pg_get_serial_sequence('"Emprestimo"',        'id'), COALESCE(MAX(id), 0)) FROM "Emprestimo";
SELECT setval(pg_get_serial_sequence('"Acervo"',            'id'), COALESCE(MAX(id), 0)) FROM "Acervo";
SELECT setval(pg_get_serial_sequence('"Configuracao"',      'id'), COALESCE(MAX(id), 0)) FROM "Configuracao";
SELECT setval(pg_get_serial_sequence('"MigracaoAuditoria"', 'id'), COALESCE(MAX(id), 0)) FROM "MigracaoAuditoria";
-- Sequencia.nome é PK string — sem SERIAL; não precisa de reset
```

Se qualquer `MAX(id)` retornar `NULL` (tabela vazia), o `COALESCE` garante que a sequence seja setada para `0`, iniciando no próximo `nextval()` = 1.

---

## 5. Etapa 3 — Validação automatizada

**Arquivo**: `scripts/migration/validate-migration.ts`

**Execução**: `tsx scripts/migration/validate-migration.ts`

### 5.1 Validações obrigatórias

| Categoria | O que verificar |
|---|---|
| **Contagem de registros** | `COUNT(*)` igual entre SQLite e PG para: Obra, Exemplar, Usuario, Emprestimo, Acervo, Configuracao, Sequencia |
| **Integridade referencial** | Todo `Exemplar.obraId` existe em `Obra`; todo `Emprestimo.usuarioId` existe em `Usuario`; todo `Emprestimo.exemplarId` existe em `Exemplar` |
| **Valores de enum** | Nenhum valor fora de `StatusExemplar` ou `StatusEmprestimo` |
| **Datas convertidas** | `dataEmprestimo`, `dataPrevistaDevolucao`, `dataDevolucao`, `createdAt`, `updatedAt` não são `null` onde obrigatórios; valores de data plausíveis (> 2000-01-01) |
| **codigoExemplar** | Todos no formato `EX\d{6}`; nenhuma duplicata no PostgreSQL |
| **numeroCadastro** | Todos no formato `US\d{6}`; nenhuma duplicata |
| **Sequencia** | `valor` no PG ≥ `valor` no SQLite |
| **Sequences PG** | `nextval()` > `MAX(id)` para todas as tabelas com SERIAL |
| **Índices** | `\di` lista todos os índices esperados |
| **Constraints** | FKs e UNIQUE constraints existem no schema PG |
| **Sample check** | 5 registros aleatórios de cada tabela com comparação campo a campo |

### 5.2 Relatório de saída

```
=== RELATÓRIO DE VALIDAÇÃO — VPS-004 ===
Data/hora: 2026-07-xx HH:MM:SS
Duração total: Xs

CONTAGEM DE REGISTROS
  Obra          SQLite: 42    PG: 42    ✓ OK
  Exemplar      SQLite: 47    PG: 47    ✓ OK
  Usuario       SQLite: 15    PG: 15    ✓ OK
  Emprestimo    SQLite: 8     PG: 8     ✓ OK
  Configuracao  SQLite: 1     PG: 1     ✓ OK
  Sequencia     SQLite: 1     PG: 1     ✓ OK

INTEGRIDADE REFERENCIAL
  Exemplar → Obra:           ✓ 0 órfãos
  Emprestimo → Usuario:      ✓ 0 órfãos
  Emprestimo → Exemplar:     ✓ 0 órfãos

ENUMS
  StatusExemplar (valores únicos): DISPONIVEL, EMPRESTADO  ✓
  StatusEmprestimo (valores únicos): ATIVO, DEVOLVIDO      ✓

DATAS
  dataEmprestimo: min=2025-01-01, max=2026-06-28   ✓
  dataDevolucao: 3 nulls (ativos), resto OK         ✓

CÓDIGOS
  codigoExemplar: 47 registros, todos EX\d{6}       ✓
  numeroCadastro: 15 registros, todos US\d{6}        ✓

SEQUENCES POSTGRESQL
  Obra:           nextval seria 43, MAX(id)=42       ✓
  Exemplar:       nextval seria 48, MAX(id)=47       ✓
  Usuario:        nextval seria 16, MAX(id)=15       ✓

VERIFICAÇÃO AMOSTRAL (5 registros por tabela)
  Obra id=3:     titulo ✓, autor ✓, isbn ✓
  Exemplar id=7: codigoExemplar ✓, status ✓, obraId ✓
  ...

DIVERGÊNCIAS ENCONTRADAS: 0
ERROS: 0

RESULTADO: ✅ VALIDAÇÃO APROVADA — seguro prosseguir para Etapa 4
```

Se qualquer verificação falhar, o relatório marca `❌ FALHA` e a Etapa 4 não deve ser executada até resolução.

---

## 6. Etapa 4 — Troca definitiva

Executada **somente após relatório de validação com resultado ✅ APROVADO**.

### 6.1 Arquivos alterados na Etapa 4

| Arquivo | Tipo | O que muda |
|---|---|---|
| `lib/prisma.ts` | Modificado | Troca `PrismaBetterSQLite3` por `@prisma/adapter-pg` |
| `docker-compose.yml` | Modificado | Remove configuração SQLite; adiciona `DATABASE_URL` PG para `biblioteca` |
| `Dockerfile` | Modificado | Remove `python3 make g++` (não precisam compilar better-sqlite3); remove `ELECTRON_SKIP_BINARY_DOWNLOAD` se electron for movido para devDependencies |
| `package.json` | Modificado | Remove `better-sqlite3`, `@prisma/adapter-better-sqlite3`; adiciona `pg`, `@prisma/adapter-pg` |
| `src/repositories/leitor.repository.ts` | Modificado | `generateNumeroCadastro` → atomic via Sequencia |
| `src/services/emprestimo.service.ts` | Modificado | Wrap em `$transaction` + SELECT FOR UPDATE |
| `src/services/devolucao.service.ts` | Modificado | Wrap em `$transaction` |
| `src/repositories/exemplar.repository.ts` | Modificado | `contains` → `{ contains, mode: 'insensitive' }` |
| `src/repositories/emprestimo.repository.ts` | Modificado | Queries com texto → `mode: 'insensitive'` |
| `prisma.config.ts` | Modificado | `url` → `postgresql://` (runtime) |
| `prisma/schema.prisma` | Já alterado na Etapa 1 | Sem mudanças adicionais |

### 6.2 Mudança em lib/prisma.ts

```typescript
// ANTES (SQLite)
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
const adapter = new PrismaBetterSqlite3({ url })

// DEPOIS (PostgreSQL)
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
const pool = new Pool({ connectionString: url })
const adapter = new PrismaPg(pool)
```

### 6.3 Correção de race conditions (Etapa 4)

**leitor.repository.ts — generateNumeroCadastro:**
```typescript
// ANTES (race condition)
const last = await prisma.usuario.findFirst({ orderBy: { createdAt: 'desc' } })
const next = last ? parseInt(last.numeroCadastro.slice(2), 10) + 1 : 1

// DEPOIS (atomic via Sequencia — adicionar entrada 'leitor' na tabela)
const seq = await tx.sequencia.update({
  where: { nome: 'leitor' },
  data: { valor: { increment: 1 } },
})
return `US${String(seq.valor).padStart(6, '0')}`
```

Requer seed da entrada `{ nome: 'leitor', valor: MAX(usuario.numeroCadastro numérico) }` no script de migração.

**emprestimo.service.ts:**
```typescript
// DEPOIS (transação + verificação atômica)
return prisma.$transaction(async (tx) => {
  // SELECT FOR UPDATE garante exclusividade
  const exemplar = await tx.exemplar.findUniqueOrThrow({
    where: { id: data.exemplarId },
  })
  if (exemplar.status !== 'DISPONIVEL') throw new Error('Exemplar não está disponível')
  // ... demais validações
  const emprestimo = await tx.emprestimo.create({ data: { ... } })
  await tx.exemplar.update({ where: { id: data.exemplarId }, data: { status: 'EMPRESTADO' } })
  return emprestimo
})
```

**devolucao.service.ts:**
```typescript
return prisma.$transaction(async (tx) => {
  const emprestimo = await tx.emprestimo.findUniqueOrThrow({ where: { id: emprestimoId } })
  if (emprestimo.status !== 'ATIVO') throw new Error('Empréstimo não está ativo')
  await tx.emprestimo.update({ where: { id: emprestimoId }, data: { dataDevolucao: new Date(), status: 'DEVOLVIDO' } })
  await tx.exemplar.update({ where: { id: exemplarId }, data: { status: 'DISPONIVEL' } })
  return { success: true }
})
```

### 6.4 Dependências a remover

```json
"dependencies": {
  "better-sqlite3": "REMOVER",
  "@prisma/adapter-better-sqlite3": "REMOVER"
}
```

### 6.5 Dependências a adicionar

```json
"dependencies": {
  "pg": "^8.x",
  "@prisma/adapter-pg": "^7.x"
}
```

O `@types/pg` vai para `devDependencies`.

### 6.6 Otimizações de índice para PostgreSQL

O schema já define os índices necessários. Nenhum índice adicional é criado pelo Prisma nesta etapa. Índices planejados para Etapa 5 (futura):

```sql
-- Full-text search em titulo (futuro)
CREATE INDEX idx_obra_titulo_fts ON "Obra" USING GIN (to_tsvector('portuguese', titulo));

-- Pesquisa case-insensitive em autor (alternativa ao mode: 'insensitive')
CREATE INDEX idx_obra_autor_lower ON "Obra" (LOWER(autor));
```

---

## 7. Análise dos requisitos específicos

### 7.1 Geração de codigoExemplar em concorrência

**Situação atual**: `exemplarRepository.create()` e `obraRepository.addExemplar()` ambos usam:

```typescript
const seq = await tx.sequencia.update({
  where: { nome: 'exemplar' },
  data: { valor: { increment: 1 } },
})
```

Dentro de `$transaction`. O PostgreSQL aplica um **lock de linha** no `UPDATE` da tabela `Sequencia`. Requisições concorrentes serão serializadas neste ponto. Não há risco de duplicação de `codigoExemplar`.

**Garantia adicional**: a constraint `@unique` em `codigoExemplar` é a última linha de defesa — se por qualquer razão dois registros tentarem o mesmo código, o banco rejeitará com `unique_violation` (código 23505).

**Por que não migrar para PostgreSQL SEQUENCE nativa**: o padrão atual funciona corretamente e é agnóstico de banco. Uma SEQUENCE nativa aumentaria o acoplamento com PostgreSQL sem benefício funcional para o volume atual. Pode ser avaliado na Etapa 5.

### 7.2 Unicidade com PostgreSQL

| Campo | Mecanismo | Proteção atual | Status pós-Etapa 4 |
|---|---|---|---|
| `Exemplar.codigoExemplar` | `@unique` | ✅ `$transaction` + UNIQUE constraint | Mantido |
| `Acervo.numeroExemplar` | `@unique` | N/A (tabela legacy) | UNIQUE constraint via migration |
| `Usuario.numeroCadastro` | `@unique` | ❌ Sem transação | Corrigido na Etapa 4 via Sequencia |
| `MigracaoAuditoria.acervoId` | `@unique` | N/A (script de migração) | UNIQUE constraint via migration |
| `MigracaoAuditoria.exemplarId` | `@unique` | N/A | UNIQUE constraint via migration |

### 7.3 Transações durante empréstimos e devoluções

**Isolamento padrão do PostgreSQL**: `READ COMMITTED`. Duas transações simultâneas podem ler o mesmo exemplar como `DISPONIVEL` antes que qualquer uma efetive a mudança de status. A correção na Etapa 4 garante:

1. A leitura do exemplar e a criação do empréstimo ocorrem na **mesma transação**
2. O `UPDATE exemplar SET status = 'EMPRESTADO'` dentro da transação adquire um **lock de linha**
3. A segunda transação tentando atualizar o mesmo exemplar será bloqueada até a primeira comitar
4. Se a primeira comitou (empréstimo criado), a segunda lerá o status atualizado `EMPRESTADO` e falhará na validação com a mensagem correta

### 7.4 Índices para buscas

Os índices definidos no schema serão recriados pela migration do PostgreSQL:

| Índice | Tabela | Colunas | Tipo PG |
|---|---|---|---|
| `isbn` | Obra | isbn | B-tree |
| `titulo` | Obra | titulo | B-tree |
| `autor` | Obra | autor | B-tree |
| `obraId` | Exemplar | obraId | B-tree |
| `tombo` | Exemplar | tombo | B-tree |
| `codigoBarras` | Exemplar | codigoBarras | B-tree |
| `status` | Exemplar | status | B-tree |
| `usuarioId` | Emprestimo | usuarioId | B-tree |
| `exemplarId` | Emprestimo | exemplarId | B-tree |
| `dataEmprestimo` | Emprestimo | dataEmprestimo | B-tree |
| `obraId` | MigracaoAuditoria | obraId | B-tree |
| `exemplarId` | MigracaoAuditoria | exemplarId | B-tree |

Buscas case-insensitive serão tratadas via `mode: 'insensitive'` nas queries Prisma (usa `ILIKE` no PostgreSQL).

### 7.5 Reset de sequences após importação

Crítico: se as sequences não forem resetadas, o próximo `INSERT` tentará usar `id = 1` e colide com os dados importados, resultando em `unique_violation`.

O reset é executado ao final do script de migração via `$queryRaw`:

```typescript
await prisma.$queryRaw`SELECT setval(pg_get_serial_sequence('"Obra"', 'id'), COALESCE((SELECT MAX(id) FROM "Obra"), 0))`
// ... (repetido para cada tabela com SERIAL)
```

Verificação: `SELECT last_value FROM "Obra_id_seq"` deve ser `>= MAX(id) FROM "Obra"`.

---

## 8. Lista completa de arquivos alterados

### Etapa 1 (Infraestrutura)
- `prisma/schema.prisma` — `provider = "postgresql"`
- `prisma.config.ts` — URL PostgreSQL (via env)
- `docker-compose.yml` — serviço `postgres`
- `docker-compose.sqlite.yml` — **CRIADO** (backup para rollback)
- `.env.example` — **CRIADO** (documentar `POSTGRES_PASSWORD`)
- `prisma/migrations/YYYYMMDDHHMMSS_init_postgresql/migration.sql` — **GERADO** pelo Prisma

### Etapa 2 (Script de migração)
- `scripts/migration/sqlite-to-postgres.ts` — **CRIADO**

### Etapa 3 (Validação)
- `scripts/migration/validate-migration.ts` — **CRIADO**

### Etapa 4 (Troca definitiva)
- `lib/prisma.ts` — adapter `pg`
- `package.json` — remove `better-sqlite3`, `@prisma/adapter-better-sqlite3`; adiciona `pg`, `@prisma/adapter-pg`
- `Dockerfile` — remove build deps nativos
- `docker-compose.yml` — atualiza `DATABASE_URL` do serviço `biblioteca`
- `src/repositories/leitor.repository.ts` — `generateNumeroCadastro` atômico
- `src/services/emprestimo.service.ts` — `$transaction`
- `src/services/devolucao.service.ts` — `$transaction`
- `src/repositories/exemplar.repository.ts` — `mode: 'insensitive'` em filtros
- `src/repositories/emprestimo.repository.ts` — `mode: 'insensitive'` se aplicável
- `prisma.config.ts` — remover fallback SQLite

---

## 9. Estratégia de rollback

Como o sistema é de demonstração sem dados de produção reais, o rollback é simples:

### Rollback antes da Etapa 4 (Troca definitiva)
Nenhuma ação necessária — a aplicação ainda usa SQLite. Basta parar o PostgreSQL:
```bash
docker compose stop postgres
```

### Rollback após a Etapa 4
O SQLite original permanece intacto em `./storage/database/biblioteca.db`. Para reverter:

```bash
# 1. Restaurar docker-compose para versão SQLite
cp docker-compose.sqlite.yml docker-compose.yml

# 2. Reverter lib/prisma.ts para adapter better-sqlite3
git checkout HEAD~1 -- lib/prisma.ts

# 3. Reverter prisma/schema.prisma
git checkout HEAD~1 -- prisma/schema.prisma

# 4. Reinstalar deps SQLite
npm install

# 5. Subir a aplicação
docker compose up -d --build
```

O banco SQLite nunca foi modificado durante a migração (somente leitura no script de Etapa 2).

### Janela de rollback segura
O rollback é totalmente seguro enquanto a Etapa 4 não for executada. Após a Etapa 4, quaisquer novos dados estarão **somente no PostgreSQL**. Se novos dados forem inseridos após a Etapa 4 e um rollback for necessário, os dados do PostgreSQL precisarão ser re-exportados para SQLite manualmente.

---

## 10. Checklist técnico pré-execução

### Pré-requisitos gerais
- [ ] Branch `feat/vps-004-postgresql` criada a partir de `feat/vps-003-docker`
- [ ] Docker Desktop rodando com recursos suficientes (≥ 2GB RAM)
- [ ] Backup do banco SQLite em local seguro: `cp storage/database/biblioteca.db storage/database/biblioteca.db.bak`
- [ ] Variáveis de ambiente definidas no `.env` local (não versionado): `POSTGRES_PASSWORD`
- [ ] `tsx` disponível globalmente ou via `npx tsx`

### Antes da Etapa 1
- [ ] Versão do PostgreSQL definida (recomendado: `postgres:16-alpine`)
- [ ] Porta local para PostgreSQL disponível (padrão: 5432)
- [ ] Schema Prisma revisado (nenhuma feature SQLite-only em uso)

### Antes da Etapa 2 (script de migração)
- [ ] Etapa 1 concluída e PostgreSQL saudável (`pg_isready`)
- [ ] Schema PostgreSQL aplicado via `prisma migrate deploy`
- [ ] Banco PostgreSQL **vazio** (verificar com `SELECT COUNT(*) FROM "Obra"` = 0)
- [ ] `SQLITE_URL` e `DATABASE_URL` (PostgreSQL) corretamente configuradas no ambiente de execução do script
- [ ] Backup SQLite confirmar íntegro: `sqlite3 storage/database/biblioteca.db "PRAGMA integrity_check"`

### Antes da Etapa 3 (validação)
- [ ] Script de migração executado com saída `SUCESSO` (sem erros)
- [ ] Contagem manual rápida: `sqlite3 biblioteca.db "SELECT COUNT(*) FROM Exemplar"` vs `psql -c 'SELECT COUNT(*) FROM "Exemplar"'`

### Antes da Etapa 4 (troca definitiva)
- [ ] Relatório de validação com **resultado ✅ APROVADO** salvo em `docs/vps/VPS-004-validation-report.txt`
- [ ] Revisão de todas as queries com `contains` para adicionar `mode: 'insensitive'`
- [ ] `docker-compose.sqlite.yml` criado como backup do compose atual
- [ ] Testes manuais das rotas principais no ambiente PostgreSQL (usando variável de ambiente apontando para PG) antes de remover o SQLite

---

## 11. Estrutura final de arquivos novos

```
scripts/
  migration/
    sqlite-to-postgres.ts    # Script de migração (Etapa 2)
    validate-migration.ts    # Script de validação (Etapa 3)

docs/
  vps/
    VPS-003-Docker.md                # Concluído
    VPS-004-PostgreSQL.md            # Este documento
    VPS-004-validation-report.txt    # Gerado após Etapa 3

prisma/
  migrations/
    YYYYMMDDHHMMSS_init_postgresql/
      migration.sql                  # Gerado pela Etapa 1

docker-compose.sqlite.yml            # Backup para rollback (criado na Etapa 1)
.env.example                         # Documentação de variáveis (criado na Etapa 1)
```
