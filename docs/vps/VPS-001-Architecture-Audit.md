# VPS-001: Architecture Audit — Desktop to Web Migration

**Data:** 2026-06-28  
**Revisão:** 2026-06-28 (v2.0 — Revisão pós-decisões arquiteturais)  
**Status:** ✅ DECISÕES ARQUITETURAIS DEFINIDAS  
**Versão do Sistema:** 0.1.0  
**Linhas de Código:** ~1,273 (src + app)

---

## Histórico de Revisões

| Versão | Data | Motivo |
|--------|------|--------|
| 1.0 | 2026-06-28 | Auditoria inicial |
| 2.0 | 2026-06-28 | Redefinição arquitetural: arquitetura Single-Tenant, autenticação local (Auth.js + Argon2), roadmap por Sprints |

---

## Decisões Arquiteturais Vigentes

> Estas decisões são **definitivas** e devem ser respeitadas por todos os Sprints.

| ID | Decisão | Descrição |
|----|---------|-----------|
| DA-01 | **Single-Tenant** | Cada instalação atende UMA biblioteca. Sem multi-tenancy, sem tenantId, sem isolamento entre organizações. |
| DA-02 | **Autenticação Local** | Auth.js + cookies HttpOnly + Argon2. Sem Clerk, Auth0, Firebase ou qualquer serviço externo de autenticação. |
| DA-03 | **Roadmap por Sprints** | Migração estruturada em 9 Sprints, conforme ordem definida abaixo. |
| DA-04 | **Regras de Negócio Inalteradas** | A migração é exclusivamente de infraestrutura. Zero alteração em fluxos, telas ou regras existentes. |

---

## 1. RESUMO EXECUTIVO

### Estado Atual

O **VIVA Biblioteca** é uma aplicação **single-user desktop** (Next.js + Electron) com banco de dados **SQLite local**. O projeto nunca foi deployado em VPS e possui dependências críticas incompatíveis com produção Linux multi-usuário.

O sistema já é single-tenant por natureza — cada biblioteca instala sua própria cópia. A migração para VPS mantém esse modelo, apenas adicionando a capacidade de **múltiplos operadores internos** (~10 usuários) acessarem simultaneamente via browser.

### Descobertas Críticas

| Categoria | Status | Impacto |
|-----------|--------|---------|
| **Electron** | ❌ Dependência sem uso | Sem código real; deve ser removido no Sprint 006 |
| **SQLite + BetterSQLite3** | ❌ Incompatível com concorrência | Travamentos sob acesso simultâneo; migrar para PostgreSQL nos Sprints 003-004 |
| **Autenticação** | ❌ Inexistente | Sem login, sem controle de acesso; implementar no Sprint 007 |
| **Filesystem Access** | ⚠️ Paths relativos/frágeis | Scripts etapa2 e seed usam `__dirname`; ajustar no Sprint 003 |
| **Docker** | ⚠️ Incompleto | Existe estrutura, mas sem PostgreSQL e sem volumes corretos; corrigir no Sprint 005 |
| **Variáveis de Ambiente** | ⚠️ Fallbacks hardcoded | `DATABASE_URL` tem fallback para arquivo local; corrigir no Sprint 003 |

### O que NÃO muda

- Fluxo de empréstimos e devoluções
- Cadastro de Obras, Exemplares, Leitores (Usuarios)
- Dashboard e Relatórios
- Inventário
- Toda a lógica de negócio existente

### Roadmap de Sprints

| Sprint | Tema | Status |
|--------|------|--------|
| 001 | Arquitetura | ✅ Concluído |
| 002 | Database Readiness Audit | 🔲 Próximo |
| 003 | Migração Prisma → PostgreSQL | 🔲 Pendente |
| 004 | Migração de Dados SQLite → PostgreSQL | 🔲 Pendente |
| 005 | Dockerização Completa | 🔲 Pendente |
| 006 | Remoção do Electron e Limpeza | 🔲 Pendente |
| 007 | Sistema de Autenticação | 🔲 Pendente |
| 008 | Gestão de Usuários e Permissões | 🔲 Pendente |
| 009 | Hardening para Produção | 🔲 Pendente |

---

## 2. ARQUITETURA ATUAL

### 2.1 Stack Tecnológico

```
┌─────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER                                          │
├─────────────────────────────────────────────────────────────┤
│ Next.js 16.2.9 (App Router) + React 19.2.4 + TypeScript 5  │
│ UI: Radix UI + shadcn/ui + Tailwind CSS 4                  │
│ Forms: React Hook Form + Zod (validação)                   │
└─────────────────────────────────────────────────────────────┘
         ↓ API Routes (app/api/**/route.ts)
┌─────────────────────────────────────────────────────────────┐
│ APPLICATION LAYER                                           │
├─────────────────────────────────────────────────────────────┤
│ Services (src/services/*.ts)       — Lógica de negócio      │
│ Repositories (src/repositories/*.ts) — Acesso a dados      │
│ DTOs + Types (src/dto + src/types)   — Tipagem             │
└─────────────────────────────────────────────────────────────┘
         ↓ Prisma Client
┌─────────────────────────────────────────────────────────────┐
│ DATA LAYER                                                  │
├─────────────────────────────────────────────────────────────┤
│ Prisma 7.8.0 + BetterSQLite3 Adapter (❌ incompatível VPS) │
│ SQLite  →  storage/database/biblioteca.db                  │
│                                                             │
│ Desktop Wrapper: Electron 42.4.1 (❌ não implementado)     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Modelo de Dados Atual

```
Acervo (legado) ────→ [Etapa 2 Migração] ────→ Obra + Exemplar
    ↓                                               ↓
    └───────────────────────────────────→ MigracaoAuditoria

Obra (1) ────────────────────────────── (N) Exemplar
                                              ↓
Exemplar (N) ─────────────────────── (N) Emprestimo ──── (1) Usuario

Configuracao (singleton)
Sequencia (contador EX000001)
```

**Modelos e Status:**

| Modelo | Status | Observação |
|--------|--------|------------|
| `Obra` | ✅ Estável | Introduzido na Etapa 2 |
| `Exemplar` | ✅ Estável | Introduzido na Etapa 2 |
| `Usuario` | ✅ Estável | Leitores da biblioteca; sem autenticação |
| `Emprestimo` | ✅ Estável | Circulação |
| `Configuracao` | ✅ Estável | Parâmetros do sistema (singleton) |
| `Sequencia` | ✅ Estável | Gerador de código EX000001 |
| `Acervo` | ⚠️ Legado | Em transição; será removido após validação |
| `MigracaoAuditoria` | ⚠️ Temporária | Será removida após validação da migração |

### 2.3 Estrutura de Diretórios

```
viva-biblioteca/
├── app/
│   ├── api/
│   │   ├── acervo/             # CRUD legado (acervo original)
│   │   ├── obras/              # Obra + Exemplar (novo modelo)
│   │   ├── usuarios/           # Leitores (sem autenticação)
│   │   ├── loans/              # Empréstimos
│   │   ├── returns/            # Devoluções
│   │   ├── reports/            # Relatórios + Export XLSX/CSV
│   │   └── configuracoes/      # Parâmetros do sistema
│   ├── dashboard/
│   ├── circulacao/
│   ├── acervo/
│   ├── members/
│   ├── reports/
│   ├── inventario/
│   └── settings/
│
├── src/
│   ├── services/
│   │   ├── obra.service.ts
│   │   ├── exemplar.service.ts
│   │   ├── emprestimo.service.ts
│   │   ├── devolucao.service.ts
│   │   ├── leitor.service.ts
│   │   ├── relatorio.service.ts
│   │   └── importacao.service.ts
│   ├── repositories/
│   ├── dto/
│   ├── types/
│   └── validators/
│
├── components/
│   ├── layout/                 # Header, Sidebar
│   ├── dashboard/
│   ├── circulacao/
│   ├── ui/                     # Design System
│   └── admin/                  # ⚠️ pastaBackup/pastaExportacao
│
├── lib/
│   ├── prisma.ts               # ⚠️ adapter BetterSQLite3 hardcoded
│   ├── utils.ts
│   └── mock-data.ts            # ⚠️ pode vazar em produção
│
├── prisma/
│   ├── schema.prisma           # ⚠️ provider: "sqlite"
│   ├── seed.ts                 # ⚠️ __dirname, fs.readFileSync
│   └── seed-direct.js
│
├── scripts/etapa2/
│   ├── 01-migrate-obras.ts     # ⚠️ fs, path.join(__cwd__)
│   ├── 02-migrate-exemplares.ts
│   ├── 02b-seed-sequencia.ts
│   ├── 03-migrate-emprestimos.ts
│   ├── 04-validate.ts
│   ├── 05-export-reports.ts    # ⚠️ fs.mkdirSync
│   ├── apply-migration.ts      # ⚠️ better-sqlite3 direto
│   ├── rollback.ts             # ⚠️ better-sqlite3 direto
│   └── _prisma.ts
│
├── storage/
│   ├── database/biblioteca.db  # ⚠️ SQLite single-file
│   ├── backups/
│   └── exports/
│
├── Dockerfile                  # ⚠️ incompleto; sem PostgreSQL
├── docker-compose.yml          # ⚠️ volumes locais; sem pg service
├── next.config.ts              # ⚠️ allowedDevOrigins hardcoded
├── prisma.config.ts            # ⚠️ DATABASE_URL fallback hardcoded
├── package.json                # ⚠️ electron deps presentes
└── .env                        # DATABASE_URL=file:./storage/...
```

### 2.4 Dependências Críticas

#### Dependências para Remover (Sprint 006)

```json
{
  "electron": "^42.4.1",
  "electron-builder": "^26.15.3"
}
```

Nenhum arquivo de código da aplicação importa `electron`. Ambos estão listados como `dependencies` (não `devDependencies`), o que infla o bundle e o tempo de instalação no Docker.

#### Dependências do Banco de Dados (incompatíveis com VPS)

```json
{
  "prisma": "^7.8.0",
  "@prisma/client": "^7.8.0",
  "@prisma/adapter-better-sqlite3": "^7.8.0",
  "better-sqlite3": "^12.11.1"
}
```

**Problema:** `better-sqlite3` requer compilação nativa (`node-gyp`). As versões compiladas para Windows são incompatíveis com o ambiente Linux da VPS. Além disso, SQLite não suporta escritas simultâneas — travamentos ocorrem com mais de 1 usuário ativo.

#### Dependências Estáveis (mantidas)

```json
{
  "next": "16.2.9",
  "react": "19.2.4",
  "typescript": "^5",
  "react-hook-form": "^7.80.0",
  "zod": "^4.4.3",
  "xlsx": "^0.18.5",
  "recharts": "^3.9.0",
  "lucide-react": "^1.21.0"
}
```

### 2.5 Autenticação e Autorização

**Status: ❌ INEXISTENTE**

- Zero autenticação implementada
- Zero controle de acesso (RBAC)
- Sem sessões ou tokens
- Sem contexto de operador logado
- Qualquer pessoa com acesso à URL tem acesso total a todos os dados

**Problema:** A aplicação foi projetada para uso local por um único operador. Na VPS, estará acessível pela rede interna (ou internet), expondo dados sem proteção.

---

## 3. ARQUITETURA DESEJADA (VPS + MULTI-OPERADOR)

### 3.1 Modelo de Instalação

```
┌────────────────────────────────────────────────────────────────┐
│ INSTALAÇÃO: 1 VPS × 1 Biblioteca × ~10 Operadores Internos    │
│                                                                │
│ Sem multi-tenancy. Sem isolamento entre organizações.         │
│ Um banco PostgreSQL. Uma instância da aplicação.              │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 Stack Target

```
┌─────────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER (inalterado)                                │
├─────────────────────────────────────────────────────────────────┤
│ Next.js 16.2.9 (App Router) + React 19.2.4 + TypeScript 5     │
│ UI: Radix UI + shadcn/ui + Tailwind CSS 4                     │
└─────────────────────────────────────────────────────────────────┘
         ↓ Middleware Next.js (valida sessão em todas as rotas)
┌─────────────────────────────────────────────────────────────────┐
│ AUTHENTICATION LAYER (NOVO — Sprint 007)                       │
├─────────────────────────────────────────────────────────────────┤
│ Auth.js (next-auth v5)                                         │
│ Provedor: Credentials (email + senha)                         │
│ Sessão: Cookie HttpOnly (stateless JWT ou DB session)         │
│ Hash: Argon2 (via argon2 ou @node-rs/argon2)                  │
│ Contexto: { operadorId, nome, role }                          │
└─────────────────────────────────────────────────────────────────┘
         ↓ API Routes (proteção via middleware ou getServerSession)
┌─────────────────────────────────────────────────────────────────┐
│ APPLICATION LAYER (inalterado — regras de negócio)             │
├─────────────────────────────────────────────────────────────────┤
│ Services — Lógica de negócio (sem alterações)                  │
│ Repositories — Queries existentes (sem tenantId)              │
│ DTOs + Types                                                   │
└─────────────────────────────────────────────────────────────────┘
         ↓ Prisma Client
┌─────────────────────────────────────────────────────────────────┐
│ DATA LAYER (PostgreSQL — Sprint 003-004)                       │
├─────────────────────────────────────────────────────────────────┤
│ Prisma 7.8.0 + driver PostgreSQL nativo                        │
│ PostgreSQL 15+ (container Docker ou serviço gerenciado)       │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ INFRASTRUCTURE (Sprint 005)                                     │
├─────────────────────────────────────────────────────────────────┤
│ Docker + Docker Compose                                         │
│ Nginx (reverse proxy, SSL/TLS)                                 │
│ Volumes nomeados para dados PostgreSQL                         │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Novo Modelo de Dados: OperadorSistema

O único modelo novo a ser adicionado é `OperadorSistema` — representa os funcionários que operam o sistema (bibliotecários, atendentes, administrador).

**Importante:** Este modelo é SEPARADO do modelo `Usuario`, que representa os *leitores* da biblioteca. Nenhum modelo existente é alterado.

```prisma
// NOVO — Sprint 007
// Operadores internos do sistema (funcionários da biblioteca)
// Distinto de Usuario (que representa leitores/membros da biblioteca)
model OperadorSistema {
  id           String   @id @default(cuid())
  nome         String
  email        String   @unique
  senhaHash    String                        // Argon2id
  role         RoleOperador @default(BIBLIOTECARIO)
  ativo        Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([email])
}

enum RoleOperador {
  ADMINISTRADOR   // Acesso total: usuários, configurações, todos os módulos
  BIBLIOTECARIO   // Acesso a catálogo, empréstimos, devoluções, relatórios
  ATENDENTE       // Acesso a empréstimos e devoluções apenas
}
```

**Modelos existentes: SEM ALTERAÇÕES**

| Modelo | Alteração | Motivo |
|--------|-----------|--------|
| `Obra` | Nenhuma | Regras de negócio inalteradas (DA-04) |
| `Exemplar` | Nenhuma | Idem |
| `Usuario` | Nenhuma | Leitores são entidade separada dos operadores |
| `Emprestimo` | Nenhuma | Idem |
| `Configuracao` | Nenhuma | Idem |
| `Sequencia` | Nenhuma | Idem |

### 3.4 Perfis e Permissões (RBAC)

| Permissão | ADMINISTRADOR | BIBLIOTECARIO | ATENDENTE |
|-----------|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ |
| Catálogo — consultar | ✅ | ✅ | ✅ |
| Catálogo — cadastrar/editar | ✅ | ✅ | ❌ |
| Empréstimos — registrar | ✅ | ✅ | ✅ |
| Devoluções — registrar | ✅ | ✅ | ✅ |
| Leitores — consultar | ✅ | ✅ | ✅ |
| Leitores — cadastrar/editar | ✅ | ✅ | ❌ |
| Relatórios | ✅ | ✅ | ❌ |
| Inventário | ✅ | ✅ | ❌ |
| Configurações do sistema | ✅ | ❌ | ❌ |
| Gestão de operadores | ✅ | ❌ | ❌ |

### 3.5 Fluxo de Autenticação

```
┌────────────────────────────────────────────────────────────────┐
│ 1. LOGIN                                                       │
├────────────────────────────────────────────────────────────────┤
│ POST /api/auth/callback/credentials                            │
│   { email, password }                                          │
│       ↓                                                        │
│   Auth.js: busca OperadorSistema WHERE email = ?               │
│   Argon2.verify(senhaHash, password)                           │
│       ↓ (se válido)                                            │
│   Gera sessão → Set-Cookie: session (HttpOnly, Secure, SameSite│
│       ↓                                                        │
│   Redireciona para /dashboard                                  │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 2. REQUISIÇÃO AUTENTICADA                                      │
├────────────────────────────────────────────────────────────────┤
│ GET /api/obras  (cookie: session)                              │
│       ↓                                                        │
│   middleware.ts → auth() → valida sessão                       │
│       ↓ (sessão inválida → redirect /login)                   │
│       ↓ (sessão válida → { operadorId, role })                │
│   Route Handler: getServerSession() → verifica role            │
│   Service: obras.findAll() [sem alteração de lógica]           │
│       ↓                                                        │
│   Return: Obra[]                                               │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 3. LOGOUT                                                      │
├────────────────────────────────────────────────────────────────┤
│ POST /api/auth/signout                                         │
│   Auth.js: invalida sessão → limpa cookie                      │
│   Redireciona para /login                                      │
└────────────────────────────────────────────────────────────────┘
```

### 3.6 Proteção via Middleware Next.js

```typescript
// middleware.ts (novo arquivo — Sprint 007)
import { auth } from '@/lib/auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/login')

  if (!isLoggedIn && !isAuthPage) {
    return Response.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
```

### 3.7 Arquitetura de Implantação (VPS)

```
Internet / Rede Interna
        ↓
┌───────────────────┐
│   Nginx (porta 80/443)      │
│   SSL/TLS termination       │
│   Proxy reverso para :3000  │
└─────────┬─────────┘
          ↓
┌─────────────────────────────┐
│   App: Next.js (porta 3000) │
│   Container: biblioteca-app  │
└─────────┬───────────────────┘
          ↓
┌─────────────────────────────┐
│   PostgreSQL 15             │
│   Container: biblioteca-db  │
│   Volume nomeado: pg_data   │
└─────────────────────────────┘
```

---

## 4. LISTA COMPLETA DE RISCOS

### 🔴 CRÍTICOS — Impedem execução em VPS

| ID | Risco | Localização | Sprint | Ação |
|----|-------|------------|--------|------|
| R1 | `better-sqlite3` compilado para Windows não roda em Linux | `lib/prisma.ts` L2,14 | 003 | Remover adapter; usar driver PostgreSQL |
| R2 | SQLite não suporta acesso concorrente de múltiplos usuários | `prisma/schema.prisma` L6 | 003 | Migrar para PostgreSQL |
| R3 | `DATABASE_URL` tem fallback hardcoded para arquivo local | `lib/prisma.ts` L13 / `prisma.config.ts` L11 | 003 | Exigir env var obrigatória; sem fallback |
| R4 | `provider = "sqlite"` no schema impede `prisma migrate` para PostgreSQL | `prisma/schema.prisma` L6 | 003 | Alterar para `postgresql` |
| R5 | Sem autenticação: qualquer pessoa com acesso à URL vê e altera dados | `app/api/**/route.ts` (17 arquivos) | 007 | Auth.js + middleware.ts global |
| R6 | Docker Compose sem serviço PostgreSQL; database ainda é SQLite | `docker-compose.yml` | 005 | Adicionar service `db`, volumes nomeados |
| R7 | `Dockerfile` copia `storage/` com banco SQLite para a imagem | `Dockerfile` L9 | 005 | Ignorar `storage/database` no `.dockerignore` |

### 🟠 ALTOS — Impactam funcionalidade ou segurança

| ID | Risco | Localização | Sprint | Ação |
|----|-------|------------|--------|------|
| R8 | `Electron` e `electron-builder` nas `dependencies` (não devDependencies) | `package.json` L31-32 | 006 | Remover completamente |
| R9 | `__dirname` em `seed.ts` quebra em ambiente ESM/produção | `prisma/seed.ts` L79 | 003 | Substituir por `path.resolve(process.cwd(), ...)` |
| R10 | `apply-migration.ts` instancia `better-sqlite3` diretamente (sem Prisma) | `scripts/etapa2/apply-migration.ts` L9-13 | 003 | Converter para `prisma.$executeRawUnsafe` ou remover |
| R11 | `rollback.ts` acessa `_prisma_migrations` via `better-sqlite3` direto | `scripts/etapa2/rollback.ts` | 003 | Converter para Prisma |
| R12 | `pastaBackup` e `pastaExportacao` são campos de filesystem que não fazem sentido em VPS | `components/admin/admin-workspace.tsx` L32-33 | 006 | Remover campos da UI; backup via PostgreSQL dump |
| R13 | `docker-compose.yml` monta volume `./storage` local (path relativo) | `docker-compose.yml` L12 | 005 | Usar volume nomeado `biblioteca_storage` |
| R14 | Docker não expõe HTTPS; porta 3002 diretamente para internet | `docker-compose.yml` L9 | 005 | Adicionar Nginx + SSL no Compose |
| R15 | Seed (`prisma/seed.ts`) usa `fs.existsSync` com path construído por `__dirname` | `prisma/seed.ts` L79-81 | 003 | Corrigir path; ou tornar seed idempotente sem CSV |
| R16 | Scripts etapa2 geram arquivos em `.tmp/` e `reports/` com paths relativos ao CWD | `scripts/etapa2/01,05` | 004 | Aceitar como escopo de migração one-shot; documentar |
| R17 | `npm run db:seed` não é executado no `Dockerfile` | `Dockerfile` | 005 | Adicionar init script ou entrypoint |

### 🟡 MÉDIOS — Degradam experiência ou qualidade

| ID | Risco | Localização | Sprint | Ação |
|----|-------|------------|--------|------|
| R18 | `allowedDevOrigins` hardcoded com IP local de desenvolvimento | `next.config.ts` L5 | 009 | Usar `process.env.ALLOWED_ORIGINS` |
| R19 | Sem rate limiting em endpoints de API | `app/api/**/*.ts` | 009 | Middleware de rate limit (ex.: `@upstash/ratelimit` ou nginx) |
| R20 | `console.log/error` como único mecanismo de log | `app/api/**/*.ts` | 009 | Integrar `pino` ou `winston` |
| R21 | Export XLSX via `xlsx` em memória pode falhar com grandes volumes | `app/api/reports/export/route.ts` L38 | 009 | Implementar streaming ou limite documentado |
| R22 | `mock-data.ts` pode ser importado em produção sem guard de ambiente | `lib/mock-data.ts` | 006 | Remover ou condicionar a `NODE_ENV === 'development'` |
| R23 | Sem endpoint `/api/health` para monitoramento | — | 009 | Adicionar healthcheck que verifica conexão com DB |
| R24 | `soft delete` (`deletedAt`) existe nos modelos mas não é filtrado sistematicamente | `prisma/schema.prisma` L137-138 | 009 | Auditar queries; adicionar `where: { deletedAt: null }` |
| R25 | Sem validação de variáveis de ambiente no startup | — | 009 | Adicionar `env.ts` com Zod para validar env vars obrigatórias |

---

## 5. LISTA COMPLETA DE ARQUIVOS IMPACTADOS

### 5.1 Dependências: Remover

| Pacote | Tipo | Sprint | Motivo |
|--------|------|--------|--------|
| `electron` | dependencies | 006 | Sem uso; incompatível com servidor |
| `electron-builder` | dependencies | 006 | Sem uso |
| `@prisma/adapter-better-sqlite3` | dependencies | 003 | Substituído por driver PostgreSQL |
| `better-sqlite3` | dependencies | 003 | Substituído por PostgreSQL |

### 5.2 Dependências: Adicionar

| Pacote | Sprint | Motivo |
|--------|--------|--------|
| `next-auth` (Auth.js v5) | 007 | Autenticação com cookies HttpOnly |
| `argon2` ou `@node-rs/argon2` | 007 | Hash de senha seguro |

### 5.3 Arquivos: Alterações no Banco de Dados

| Arquivo | Alteração Necessária | Sprint | Risco |
|---------|---------------------|--------|-------|
| `prisma/schema.prisma` | `provider: "sqlite"` → `"postgresql"` | 003 | R2, R4 |
| `lib/prisma.ts` | Remover `PrismaBetterSQLite3`; usar `PrismaClient` padrão (sem adapter) | 003 | R1, R3 |
| `prisma.config.ts` | Remover fallback hardcoded; exigir `DATABASE_URL` via env | 003 | R3 |
| `.env` | Atualizar `DATABASE_URL` para formato `postgresql://...` | 003 | R3 |
| `.env.example` | Criar com vars obrigatórias documentadas | 003 | — |

### 5.4 Arquivos: Scripts de Migração (etapa2)

> Estes scripts são ferramentas one-shot de migração de dados. Serão executados **uma vez** para migrar dados de SQLite → PostgreSQL (Sprint 004) e não precisam de refatoração profunda, apenas das adaptações mínimas para funcionar com PostgreSQL.

| Arquivo | Problema | Sprint | Ação |
|---------|---------|--------|------|
| `scripts/etapa2/apply-migration.ts` | `better-sqlite3` direto; inaplicável em PostgreSQL | 004 | Remover ou converter para `prisma.$executeRaw` |
| `scripts/etapa2/rollback.ts` | `better-sqlite3` direto | 004 | Remover (rollback PostgreSQL via pg_dump) |
| `scripts/etapa2/01-migrate-obras.ts` | `path.join(process.cwd(), ...)` para `.tmp/` | 004 | Manter; executar localmente durante migração |
| `scripts/etapa2/02-migrate-exemplares.ts` | Lê `.tmp/obras-map.json` | 004 | Manter |
| `scripts/etapa2/02b-seed-sequencia.ts` | — | 004 | Manter |
| `scripts/etapa2/03-migrate-emprestimos.ts` | — | 004 | Manter |
| `scripts/etapa2/04-validate.ts` | — | 004 | Manter |
| `scripts/etapa2/05-export-reports.ts` | `fs.mkdirSync` para `reports/` | 004 | Manter; executar localmente |

### 5.5 Arquivos: Seed

| Arquivo | Problema | Sprint | Ação |
|---------|---------|--------|------|
| `prisma/seed.ts` | `__dirname` inválido em ESM; `fs.existsSync(csvPath)` | 003 | Substituir `__dirname` por `path.resolve(process.cwd(), ...)` |
| `prisma/seed.ts` | Usa `new PrismaClient()` sem adapter — compatível com PostgreSQL | 003 | Apenas remover import do adapter se existir |
| `prisma/seed-direct.js` | Verificar dependência de `better-sqlite3` | 003 | Auditar e adaptar |

### 5.6 Arquivos: Docker e Deploy

| Arquivo | Problema | Sprint | Ação |
|---------|---------|--------|------|
| `Dockerfile` | Sem estágio de build adequado; sem PostgreSQL wait | 005 | Reescrever com multi-stage build |
| `docker-compose.yml` | Sem serviço `db`; volume local; sem Nginx | 005 | Adicionar `db` (PostgreSQL), `nginx`, volumes nomeados |
| `.gitignore` | Sem `.dockerignore` equivalente | 005 | Criar `.dockerignore` |

**docker-compose.yml desejado (Sprint 005):**

```yaml
services:
  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      retries: 5

  app:
    build: .
    container_name: biblioteca-app
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      AUTH_SECRET: ${AUTH_SECRET}
      NODE_ENV: production
    ports:
      - "3000:3000"

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    depends_on:
      - app
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./certs:/etc/nginx/certs:ro

volumes:
  pg_data:
```

### 5.7 Arquivos: Autenticação (Novos — Sprint 007)

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `lib/auth.ts` | Novo | Configuração do Auth.js (providers, adapter, callbacks) |
| `middleware.ts` | Novo | Proteção global de rotas via `auth()` do Auth.js |
| `app/(auth)/login/page.tsx` | Novo | Página de login |
| `app/(auth)/login/action.ts` | Novo | Server action de login |
| `app/api/auth/[...nextauth]/route.ts` | Novo | Handler do Auth.js |
| `prisma/schema.prisma` | Modificado | Adicionar model `OperadorSistema` + enum `RoleOperador` |

**Nenhuma rota existente em `app/api/` precisa ser modificada** — a proteção é aplicada globalmente via `middleware.ts`. Rotas que exigem verificação de `role` específico usarão `getServerSession()` internamente.

### 5.8 Arquivos: Gestão de Operadores (Novos — Sprint 008)

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `app/settings/operadores/page.tsx` | Novo | Listagem de operadores (ADMIN only) |
| `app/settings/operadores/[id]/page.tsx` | Novo | Edição de operador |
| `app/api/operadores/route.ts` | Novo | CRUD de operadores (ADMIN only) |
| `app/api/operadores/[id]/route.ts` | Novo | GET/PUT/DELETE de operador |

### 5.9 Arquivos: UI com Referências a Filesystem

| Arquivo | Campo | Sprint | Ação |
|---------|-------|--------|------|
| `components/admin/admin-workspace.tsx` | `pastaBackup` (L32) | 006 | Remover campo da UI; backup é responsabilidade do servidor |
| `components/admin/admin-workspace.tsx` | `pastaExportacao` (L33) | 006 | Remover campo da UI; export já via API `/api/reports/export` |
| `app/api/configuracoes/route.ts` | `pastaBackup`, `pastaExportacao` | 006 | Remover dos schemas Zod e da model Configuracao |

### 5.10 Arquivos: Configurações de Ambiente

| Arquivo | Sprint | Ação |
|---------|--------|------|
| `next.config.ts` | 009 | Remover `allowedDevOrigins` hardcoded; usar env var |
| `lib/mock-data.ts` | 006 | Remover ou guardar com `if (process.env.NODE_ENV !== 'production')` |
| `prisma/schema.prisma` | 003 | Remover `url` do datasource (gerenciado por `prisma.config.ts`) |

---

## 6. ROADMAP DE SPRINTS

### Sprint 001 — Arquitetura ✅ CONCLUÍDO

**Objetivo:** Definir e documentar a arquitetura de migração.  
**Entregável:** Este documento (`VPS-001-Architecture-Audit.md`).  
**Status:** Concluído.

---

### Sprint 002 — Database Readiness Audit

**Objetivo:** Auditar o schema PostgreSQL antes da migração; identificar incompatibilidades de tipos, constraints e queries.

**Escopo:**
- Mapear todos os tipos SQLite para equivalentes PostgreSQL
- Identificar queries com sintaxe SQLite-específica (ex.: `ativo = 1` → `ativo = true`)
- Auditar raw queries no código (`$queryRaw`, `$executeRaw`)
- Validar índices e constraints para PostgreSQL
- Documentar resultados em `docs/vps/VPS-002-DB-Readiness.md`

**Incompatibilidades Conhecidas a Verificar:**

| Construção SQLite | Equivalente PostgreSQL |
|-------------------|------------------------|
| `ativo = 1` / `ativo = 0` | `ativo = true` / `ativo = false` |
| `LIMIT ?` com placeholder | Compatível |
| `INTEGER` autoincrement | `SERIAL` ou `@id @default(autoincrement())` — Prisma abstrai |
| `TEXT` para enums | PostgreSQL tem `ENUM` nativo; Prisma gera corretamente |
| Datas como strings | PostgreSQL usa `TIMESTAMPTZ`; Prisma abstrai |

**Entregável:** `docs/vps/VPS-002-DB-Readiness.md`

---

### Sprint 003 — Migração da Infraestrutura Prisma → PostgreSQL

**Objetivo:** Fazer o projeto compilar e rodar com PostgreSQL localmente (sem migrar dados ainda).

**Tarefas:**

1. Atualizar `prisma/schema.prisma`: `provider: "sqlite"` → `"postgresql"`
2. Reescrever `lib/prisma.ts`: remover `PrismaBetterSQLite3`; usar `PrismaClient` padrão
3. Atualizar `prisma.config.ts`: remover fallback hardcoded
4. Remover dependências: `@prisma/adapter-better-sqlite3`, `better-sqlite3`
5. Criar `.env.example` com todas as variáveis obrigatórias documentadas
6. Corrigir `prisma/seed.ts`: substituir `__dirname` por `path.resolve(process.cwd(), ...)`
7. Auditar e corrigir `prisma/seed-direct.js`
8. Rodar `npx prisma generate` e `npx prisma migrate dev --name init` contra PostgreSQL local
9. Validar que todas as API Routes respondem corretamente
10. Documentar resultado em `docs/vps/VPS-003-Prisma-Migration.md`

**Critério de aceite:** Aplicação roda em `npm run dev` com `DATABASE_URL` apontando para PostgreSQL; todas as rotas respondem 200.

---

### Sprint 004 — Migração de Dados SQLite → PostgreSQL

**Objetivo:** Transferir os dados da instância SQLite de produção para PostgreSQL, preservando integridade referencial.

**Tarefas:**

1. Exportar banco SQLite atual (`biblioteca.db`) como backup
2. Adaptar/remover `scripts/etapa2/apply-migration.ts` (dependência de `better-sqlite3`)
3. Adaptar/remover `scripts/etapa2/rollback.ts`
4. Executar os scripts de migração (01→05) contra PostgreSQL
5. Validar contagem de registros: `Acervo`, `Obra`, `Exemplar`, `Emprestimo`, `Usuario`
6. Validar integridade referencial
7. Executar `04-validate.ts` para confirmar dados
8. Documentar procedimento em `docs/vps/VPS-004-Data-Migration.md`

**Critério de aceite:** Contagem de registros em PostgreSQL bate com SQLite; zero erros de FK.

---

### Sprint 005 — Dockerização Completa

**Objetivo:** Aplicação e banco rodando inteiramente em Docker, pronta para VPS.

**Tarefas:**

1. Reescrever `Dockerfile` com multi-stage build
2. Reescrever `docker-compose.yml` com serviços `app`, `db`, `nginx`
3. Criar `.dockerignore` (excluir `node_modules`, `storage/database`, `.git`, `.env`)
4. Criar `nginx.conf` (proxy reverso, headers de segurança, SSL)
5. Criar script de entrypoint: `docker/entrypoint.sh` (aguardar DB, rodar `prisma migrate deploy`, iniciar app)
6. Criar `docker/init-db.sh` para primeiro setup (seed de configurações)
7. Testar `docker compose up --build` em ambiente limpo
8. Documentar procedimento de deploy em `docs/vps/VPS-005-Docker.md`

**Dockerfile desejado:**

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
```

**Critério de aceite:** `docker compose up` em servidor Linux limpo sobe toda a stack; aplicação acessível via Nginx.

---

### Sprint 006 — Remoção do Electron e Limpeza do Projeto

**Objetivo:** Remover código e dependências mortas que foram herdadas do conceito desktop.

**Tarefas:**

1. Remover `electron` e `electron-builder` do `package.json`
2. Remover `pastaBackup` e `pastaExportacao` da model `Configuracao` (schema + migration)
3. Remover campos correspondentes do schema Zod em `app/api/configuracoes/route.ts`
4. Remover/refatorar campos na UI: `components/admin/admin-workspace.tsx`
5. Auditar e remover `lib/mock-data.ts` ou condicionar a `NODE_ENV`
6. Remover `allowedDevOrigins` hardcoded de `next.config.ts`
7. Remover `scripts/etapa2/apply-migration.ts` e `rollback.ts` (pós-Sprint 004)
8. Avaliar remoção de `Acervo` e `MigracaoAuditoria` (se Etapa 2 validada)
9. Documentar em `docs/vps/VPS-006-Cleanup.md`

**Critério de aceite:** `npm ls electron` retorna vazio; `npm run build` sem warnings de deps desnecessárias.

---

### Sprint 007 — Sistema de Autenticação

**Objetivo:** Implementar login e proteção global de rotas com Auth.js + Argon2.

**Tarefas:**

1. Instalar `next-auth@beta` (Auth.js v5) e `argon2`
2. Criar `prisma/schema.prisma`: adicionar `OperadorSistema` + enum `RoleOperador`
3. Rodar `npx prisma migrate dev --name add_operador_sistema`
4. Criar `lib/auth.ts`: configuração do Auth.js com `CredentialsProvider`
5. Criar `app/api/auth/[...nextauth]/route.ts`
6. Criar `middleware.ts`: proteção global de rotas
7. Criar `app/(auth)/login/page.tsx`: tela de login
8. Criar `app/(auth)/login/action.ts`: server action de autenticação
9. Criar script de setup inicial: `scripts/create-admin.ts` (cria primeiro ADMINISTRADOR)
10. Testar login, logout, redirect, sessão expirada
11. Documentar em `docs/vps/VPS-007-Auth.md`

**Critério de aceite:** Sem sessão válida → redirect para `/login`; login correto → acesso ao dashboard; logout → cookie limpo.

---

### Sprint 008 — Gestão de Usuários e Permissões

**Objetivo:** Interface para o ADMINISTRADOR gerenciar operadores do sistema.

**Tarefas:**

1. Criar `app/api/operadores/route.ts` (GET lista, POST cria)
2. Criar `app/api/operadores/[id]/route.ts` (GET, PUT, DELETE)
3. Criar `app/settings/operadores/page.tsx` (listagem)
4. Criar componente de formulário de operador
5. Implementar verificação de `role === ADMINISTRADOR` em rotas de gestão
6. Implementar change password pelo próprio operador
7. Implementar deactivate/activate de operador pelo ADMINISTRADOR
8. Proteger rota `/settings/operadores` com verificação de role no middleware
9. Documentar em `docs/vps/VPS-008-UserMgmt.md`

**Critério de aceite:** ADMINISTRADOR consegue criar/editar/desativar operadores; BIBLIOTECARIO não acessa `/settings/operadores` (403).

---

### Sprint 009 — Hardening para Produção

**Objetivo:** Tornar a aplicação robusta, segura e observável para uso real em VPS.

**Tarefas:**

1. Criar `lib/env.ts`: validação de variáveis de ambiente com Zod no startup
2. Criar `app/api/health/route.ts`: healthcheck (verifica conexão DB)
3. Configurar `next.config.ts`: security headers (CSP, HSTS, X-Frame-Options)
4. Adicionar rate limiting em endpoints sensíveis (login, API)
5. Configurar logs estruturados (`pino` ou equivalente)
6. Configurar backup automático do PostgreSQL (cron + `pg_dump`)
7. Configurar SSL no Nginx (Let's Encrypt / cert manual)
8. Configurar renovação automática de certificado (Certbot)
9. Auditoria OWASP Top 10 básica
10. Documentar runbook de operação em `docs/vps/VPS-009-Hardening.md`

**Critério de aceite:** Headers de segurança presentes; `/api/health` retorna 200; backup diário configurado; SSL ativo.

---

## 7. CHECKLIST DE VALIDAÇÃO

### Sprint 003 — Prisma/PostgreSQL

- [ ] `provider = "postgresql"` em `prisma/schema.prisma`
- [ ] `lib/prisma.ts` sem `PrismaBetterSQLite3`
- [ ] `DATABASE_URL` não tem fallback hardcoded
- [ ] `.env.example` criado com vars obrigatórias
- [ ] `npx prisma migrate dev` executa sem erros contra PostgreSQL local
- [ ] `npm run dev` sobe com PostgreSQL; todas as rotas respondem

### Sprint 004 — Migração de Dados

- [ ] Backup do `biblioteca.db` feito antes de qualquer operação
- [ ] Scripts etapa2 executados na ordem (00→05)
- [ ] Contagem de `Obra` em PostgreSQL = contagem em SQLite
- [ ] Contagem de `Exemplar` em PostgreSQL = contagem em SQLite
- [ ] Contagem de `Emprestimo` em PostgreSQL = contagem em SQLite
- [ ] Contagem de `Usuario` em PostgreSQL = contagem em SQLite
- [ ] Zero erros de FK após migração
- [ ] Script `04-validate.ts` retorna OK

### Sprint 005 — Docker

- [ ] `docker compose up --build` funciona em Linux limpo
- [ ] PostgreSQL sobe antes da aplicação (healthcheck)
- [ ] `prisma migrate deploy` roda no entrypoint
- [ ] Nginx serve aplicação via porta 80
- [ ] Volume `pg_data` persiste dados entre reinicializações
- [ ] `.dockerignore` exclui `node_modules`, `storage/database`, `.env`

### Sprint 006 — Cleanup

- [ ] `npm ls electron` retorna vazio
- [ ] `npm ls electron-builder` retorna vazio
- [ ] `npm ls better-sqlite3` retorna vazio
- [ ] `pastaBackup` e `pastaExportacao` removidos do schema e da UI
- [ ] `mock-data.ts` não carregado em produção
- [ ] `npm run build` sem erros ou warnings relevantes

### Sprint 007 — Autenticação

- [ ] `OperadorSistema` criado no banco com primeiro ADMINISTRADOR
- [ ] `/login` acessível sem autenticação
- [ ] `/dashboard` redireciona para `/login` sem sessão
- [ ] Login com credenciais corretas → sessão criada (cookie HttpOnly)
- [ ] Login com credenciais erradas → mensagem de erro, sem sessão
- [ ] Logout → cookie limpo; próxima navegação → redirect `/login`
- [ ] Sessão expirada → redirect automático para `/login`
- [ ] Hash de senha usa Argon2 (verificar no DB: `$argon2id$...`)

### Sprint 008 — Gestão de Operadores

- [ ] ADMINISTRADOR consegue listar operadores
- [ ] ADMINISTRADOR consegue criar operador com role BIBLIOTECARIO
- [ ] ADMINISTRADOR consegue desativar operador
- [ ] Operador desativado não consegue fazer login
- [ ] BIBLIOTECARIO não consegue acessar `/settings/operadores` (403)
- [ ] Operador consegue alterar própria senha

### Sprint 009 — Hardening

- [ ] `GET /api/health` retorna `{ status: "ok", db: "connected" }`
- [ ] Headers de segurança presentes (CSP, HSTS, X-Frame-Options, etc.)
- [ ] SSL ativo e redirecionando HTTP → HTTPS
- [ ] Rate limiting ativo em `/api/auth`
- [ ] Backup automático configurado e testado (restauração)
- [ ] Variáveis de ambiente inválidas causam falha no startup com mensagem clara
- [ ] Logs estruturados em JSON

---

## 8. DEPENDÊNCIAS E FERRAMENTAS RECOMENDADAS

### Banco de Dados

| Pacote | Versão | Papel |
|--------|--------|-------|
| PostgreSQL | 15+ | Banco de dados principal |
| Prisma | ^7.8.0 (atual) | ORM (sem mudança) |

### Autenticação (DA-02 — Autenticação Local Obrigatória)

| Pacote | Papel |
|--------|-------|
| `next-auth@beta` (Auth.js v5) | Framework de autenticação; cookies HttpOnly; compatível com App Router |
| `argon2` ou `@node-rs/argon2` | Hash de senha (Argon2id); superior ao bcrypt em segurança |

> **Proibido:** Clerk, Auth0, Firebase Authentication, Supabase Auth ou qualquer serviço externo de autenticação (DA-02).

### Infrastructure

| Ferramenta | Papel |
|-----------|-------|
| Docker + Docker Compose | Containerização |
| Nginx | Reverse proxy, SSL termination |
| Certbot | Renovação automática de certificado SSL |

### Monitoramento e Observabilidade (Sprint 009)

| Opção | Tipo | Custo |
|-------|------|-------|
| `pino` | Logging estruturado | Gratuito |
| Uptime Kuma (self-hosted) | Monitoramento de uptime | Gratuito |
| Sentry (free tier) | Error tracking | Gratuito até limite |
| `pg_dump` via cron | Backup de banco | Gratuito |

### CI/CD (opcional)

| Opção | Indicação |
|-------|-----------|
| GitHub Actions | Recomendado para deploy automático via SSH |
| Manual via SSH | Suficiente para início |

---

## 9. VARIÁVEIS DE AMBIENTE

### Obrigatórias (produção)

```bash
# Banco de Dados
DATABASE_URL="postgresql://user:password@db:5432/biblioteca"

# Autenticação (Auth.js)
AUTH_SECRET="<gerado com: openssl rand -base64 32>"

# Aplicação
NODE_ENV="production"
NEXTAUTH_URL="https://biblioteca.suainstituicao.org"

# PostgreSQL (para docker-compose)
POSTGRES_USER="biblioteca_user"
POSTGRES_PASSWORD="<senha segura>"
POSTGRES_DB="biblioteca"
```

### Opcionais

```bash
# Logging
LOG_LEVEL="info"              # debug | info | warn | error

# Rate limiting
RATE_LIMIT_MAX="100"          # requisições por janela
RATE_LIMIT_WINDOW_MS="60000"  # janela em ms (padrão: 1 minuto)
```

### Nunca em produção

```bash
# Remover estes fallbacks do código:
DATABASE_URL="file:./storage/database/biblioteca.db"  # ← hardcoded atual
```

---

## 10. RISCOS REMANESCENTES (Pós-Sprint 009)

Após completar todos os Sprints, riscos menores que permanecem monitorados:

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| N+1 queries em relatórios com volume alto | Baixa (biblioteca pequena) | Monitorar via logs; adicionar `include` se necessário |
| Export XLSX com 10k+ linhas causando timeout | Baixa | Documentar limite; streaming se necessário |
| Certificado SSL expirado sem renovação automática | Média | Certbot `--dry-run` em cron; alerta de expiração |
| Backup não restaurável | Média | Testar restore periodicamente |
| Versão Node.js desatualizada na imagem | Baixa | Pinned à `node:22-alpine`; atualizar a cada major LTS |

---

## 11. CONCLUSÃO

O **VIVA Biblioteca** é uma aplicação bem estruturada em camadas (services → repositories → Prisma) que foi desenvolvida inicialmente para uso desktop/local. A migração para VPS é **primordialmente de infraestrutura**, preservando integralmente as regras de negócio.

### Resumo das Mudanças Necessárias

| O que muda | Sprint | Impacto |
|-----------|--------|---------|
| SQLite → PostgreSQL (Prisma) | 003-004 | 4 arquivos de infraestrutura |
| Docker + Nginx completos | 005 | 2-3 arquivos novos |
| Remoção Electron + limpeza | 006 | Remoção de deps + 2 arquivos UI |
| Autenticação local (Auth.js) | 007 | 6 arquivos novos; 1 model novo |
| Gestão de operadores | 008 | 4 arquivos novos |
| Hardening de produção | 009 | 3-4 arquivos de config |

### O que NÃO muda (DA-04)

- Todas as regras de negócio
- Fluxo de empréstimos e devoluções
- Cadastro de obras, exemplares e leitores
- Dashboard, relatórios e inventário
- Design e componentes UI existentes

**Esforço estimado:** 6-8 semanas com 1 desenvolvedor.  
**Complexidade:** Média — a maior parte é configuração e adição de camada auth; não há reescrita de lógica de negócio.

---

**Documento Versão:** 2.0  
**Data Criação:** 2026-06-28  
**Data Revisão:** 2026-06-28  
**Status:** ✅ DECISÕES ARQUITETURAIS INCORPORADAS — PRONTO PARA SPRINT 002
