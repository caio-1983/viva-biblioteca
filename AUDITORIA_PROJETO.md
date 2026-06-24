# AUDITORIA COMPLETA - VIVA BIBLIOTECA
**Data:** 23/06/2026  
**Status:** Relatório de Auditoria Pré-Desenvolvimento

---

## RESUMO EXECUTIVO

O projeto VIVA Biblioteca foi iniciado com base em um template Next.js padrão. Atualmente possui:
- ✅ Documentação completa e alinhada
- ⚠️ Estrutura parcialmente preparada
- ⚠️ Código mockado/rascunho que precisa ser removido
- ⚠️ Schema Prisma desalinhado com a documentação
- ⚠️ Arquitetura incompleta (faltam services, repositories, types)

**Conclusão:** Projeto requer limpeza e preparação arquitetônica antes do desenvolvimento funcional.

---

## 1. ESTRUTURA ATUAL ENCONTRADA

### 1.1 Diretórios Raiz
```
viva-biblioteca/
├── app/                    ✅ Rotas Next.js (App Router)
├── components/             ✅ Componentes React
├── lib/                    ✅ Utilitários
├── prisma/                 ⚠️ Configuração Prisma (schema desalinhado)
├── public/                 ✅ Assets estáticos
├── docs/                   ✅ Documentação completa (14 arquivos)
├── .claude/                ✅ Configuração Claude Code
├── .next/                  ✅ Build artefatos
└── node_modules/           ✅ Dependências instaladas
```

### 1.2 Estrutura de Arquivos

**SRC vs Root:** A documentação prevê `src/` mas o projeto usa estrutura no root:
- `app/` ← Rotas e páginas
- `components/` ← Componentes React
- `lib/` ← Utilitários
- **Faltam:** `repositories/`, `services/`, `types/`

### 1.3 Rotas Implementadas (Páginas)
```
app/
├── page.tsx                     ✅ Home com Dashboard
├── layout.tsx                   ✅ Layout raiz
├── loans/
│   └── new/
│       └── page.tsx             ⚠️ Rascunho (sem persistência)
├── returns/
│   └── page.tsx                 ⚠️ Rascunho (sem persistência)
├── books/
│   └── page.tsx                 ✅ Consulta com mockData
├── members/
│   └── page.tsx                 ❌ Página vazia (em desenvolvimento)
├── settings/
│   └── page.tsx                 ❌ Página vazia (em desenvolvimento)
├── reports/
│   └── page.tsx                 ❌ Página vazia (em desenvolvimento)
└── globals.css                  ✅ Estilos globais
```

### 1.4 Componentes Implementados

**Layout:**
- `layout.tsx` - Container principal com sidebar + header
- `sidebar.tsx` - Menu de navegação (desktop/mobile)
- `header.tsx` - Topo com notificações

**Dashboard:**
- `dashboard.tsx` - Página inicial
- `stats-cards.tsx` - Cards de resumo
- `stat-card.tsx` - Card individual
- `action-cards.tsx` - Cards de ação rápida
- `recent-loans.tsx` ❌ **NÃO UTILIZADO** (componente órfão)
- `categories.tsx` ❌ **NÃO UTILIZADO** (componente órfão)

**Funcionalidades:**
- `loans/new-loan-form.tsx` - Formulário empréstimo (mockado)
- `returns/returns-form.tsx` - Formulário devolução (mockado)
- `books/books-inventory.tsx` - Tabela acervo com mockData

**UI Base (Shadcn):**
- `ui/card.tsx`
- `ui/button.tsx`
- `ui/input.tsx`
- `ui/badge.tsx`

---

## 2. ARQUIVOS CANDIDATOS À REMOÇÃO

### 2.1 Componentes Órfãos (Não Utilizados)

| Arquivo | Razão | Impacto |
|---------|-------|--------|
| `components/dashboard/recent-loans.tsx` | Não importado em nenhum lugar; mockData com dados estáticos | BAIXO - Removível sem afetar funcionalidade |
| `components/dashboard/categories.tsx` | Não importado em nenhum lugar; mockData com dados estáticos | BAIXO - Removível sem afetar funcionalidade |

### 2.2 Páginas Vazias (Rascunho)

| Arquivo | Status | Razão | Impacto |
|---------|--------|-------|--------|
| `app/members/page.tsx` | Em desenvolvimento | Placeholder apenas | BAIXO - Link funciona, rota segura manter |
| `app/settings/page.tsx` | Em desenvolvimento | Placeholder apenas | BAIXO - Link funciona, rota segura manter |
| `app/reports/page.tsx` | Em desenvolvimento | Placeholder apenas | BAIXO - Link funciona, rota segura manter |

### 2.3 Dados Mockados (Mock Data)

| Arquivo | Conteúdo | Razão | Impacto |
|---------|----------|-------|--------|
| `lib/mock-data.ts` | dashboardStats, recentLoans, libraryCategories | Dados de exemplo do Create Next App | MÉDIO - Remove após confirmar não é usado em testes |
| `components/books/books-inventory.tsx` | mockBooks (array hardcoded) | Dados de exemplo | MÉDIO - Será substituído por dados Prisma na Sprint 1 |
| `components/loans/new-loan-form.tsx` | Mock form sem persistência | Rascunho | MÉDIO - Será completo com backend na Sprint 1 |
| `components/returns/returns-form.tsx` | Mock form sem persistência | Rascunho | MÉDIO - Será completo com backend na Sprint 1 |

### 2.4 Arquivos de Configuração Padrão

| Arquivo | Status | Ação |
|---------|--------|------|
| `public/` (assets do Next.js) | Pode remover | OPCIONAL - Limpar quando criar assets reais |
| `README.md` | Template padrão | OPÇÕES: Manter ou sobrescrever com doc própria |
| `eslint.config.mjs` | Config padrão | MANTER - Usar como baseline |

---

## 3. PROBLEMAS ENCONTRADOS

### 3.1 🔴 CRÍTICOS

#### 1. Schema Prisma Desalinhado com Documentação
**Problema:**
```prisma
// Atual (schema.prisma):
model Livro { ... }
model Membro { ... }
model Emprestimo { ... }

// Esperado (segundo docs/02-modelagem-banco.md):
model Acervo { numeroExemplar, tipoPublicacao, isbn, ... }
model Usuario { numeroCadastro, ... }
model Emprestimo { ... }
model Configuracao { ... }
```

**Impacto:** CRÍTICO
- Schema atual tem apenas 3 tabelas (Livro, Membro, Emprestimo)
- Documentação prevê 4 tabelas (Acervo, Usuario, Emprestimo, Configuracao)
- Campos estão incompletos/diferentes
- Não há tabela de Configuração para prazo de empréstimo

**Necessário:** Refazer completamente o schema antes de qualquer desenvolvimento

#### 2. Ausência de Estrutura Arquitetônica (Services/Repositories/Types)
**Problema:**
- Documentação define fluxo: Page → Service → Repository → Prisma
- Projeto atual: Pages acessam componentes diretamente, sem lógica de negócio

**Diretórios Faltando:**
```
src/services/      ❌ (não existe)
src/repositories/  ❌ (não existe)
src/types/         ❌ (não existe)
```

**Impacto:** CRÍTICO
- Lógica de negócio será espalhada pelos componentes
- Difícil de testar, manter e escalar
- Não segue arquitetura documentada

#### 3. Banco de Dados
**Problema:**
- `biblioteca.db` existe (32KB) com schema antigo
- `.env` aponta para `file:./biblioteca.db` (raiz do projeto)
- Documentação prevê: `storage/database/biblioteca.db`

**Impacto:** CRÍTICO
- Banco em lugar errado
- Estrutura de pastas inexistente: `storage/`, `storage/backups/`, `storage/exports/`

### 3.2 ⚠️ ALTOS

#### 4. Configuração Prisma Incompleta
**Problema:**
```typescript
// prisma.config.ts existe, mas:
// - Não está em .gitignore corretamente
// - DATABASE_URL em .env com caminho relativo (problema em produção)
// - Sem migrações implementadas corretamente
```

**Impacto:** ALTO
- Será necessário refazer migrações após novo schema

#### 5. TypeScript Paths Desalinhados
**Problema:**
```json
// tsconfig.json:
"paths": {
  "@/*": ["./*"]  ← Aponta para raiz
}
// Documentação prevê: src/
// Projeto usa: app/, components/, lib/ no raiz
```

**Impacto:** MÉDIO - Funciona mas pode confundir

#### 6. Falta de Validação com Zod
**Problema:**
- Documentação lista Zod como dependência
- Nenhum schema Zod implementado
- Formulários sem validação

**Impacto:** ALTO
- Sprint 1 com Importação Excel vai precisar de validação

#### 7. Falta de React Hook Form
**Problema:**
- Documentação lista React Hook Form
- Formulários usam useState manual

**Impacto:** MÉDIO
- Formulários funcionam, mas não seguem padrão documentado

### 3.3 ℹ️ MÉDIOS

#### 8. Componentes Órfãos
**Problema:**
- `recent-loans.tsx` e `categories.tsx` não são usados
- Ocupam espaço e confundem desenvolvimento

**Impacto:** BAIXO
- Apenas poluição de código

#### 9. Dados CSV no Raiz
**Problema:**
- `acervo.csv` e `cadastro_usuarios.csv` na raiz
- Documentação prevê importação de Excel (não CSV manual)

**Impacto:** BAIXO
- Precisam ser processados na Sprint 1 (Importação Excel)

#### 10. Tailwind com Postcss v4
**Problema:**
```json
"@tailwindcss/postcss": "^4",
"tailwindcss": "^4"
```

**Impacto:** BAIXO
- Versão nova, funciona, mas menos compatibilidade em alguns plugins

---

## 4. SUGESTÕES DE CORREÇÃO

### 4.1 Fase 1: Limpeza (Sem Remover Funções)

**Remover:**
1. `components/dashboard/recent-loans.tsx` - Componente órfão
2. `components/dashboard/categories.tsx` - Componente órfão
3. `lib/mock-data.ts` - Dados de exemplo não usados na home
4. Limpar `public/` de assets desnecessários

**Manter:**
- Páginas vazias (`members/`, `settings/`, `reports/`) - são rascunhos válidos
- Formulários mockados - serão completos na Sprint 1
- `components/books/books-inventory.tsx` - template para acervo

### 4.2 Fase 2: Preparação Arquitetônica

**Criar Estrutura:**
```
src/
├── app/               ← Mover app/ para src/app
├── components/        ← Mover components/ para src/components
├── lib/               ← Mover lib/ para src/lib
├── services/          ← CRIAR: Lógica de negócio
│   ├── acervo.service.ts
│   ├── usuario.service.ts
│   ├── emprestimo.service.ts
│   └── configuracao.service.ts
├── repositories/      ← CRIAR: Acesso a dados
│   ├── acervo.repository.ts
│   ├── usuario.repository.ts
│   ├── emprestimo.repository.ts
│   └── configuracao.repository.ts
└── types/            ← CRIAR: TypeScript types
    ├── acervo.ts
    ├── usuario.ts
    ├── emprestimo.ts
    └── configuracao.ts
```

**Atualizar tsconfig.json:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"]
}
```

### 4.3 Fase 3: Banco de Dados

**Estrutura de Pastas:**
```
storage/
├── database/
│   └── biblioteca.db
├── backups/
└── exports/
```

**Refazer Schema Prisma** conforme `docs/02-modelagem-banco.md`:
- ✅ Acervo (com todos os campos: numeroExemplar, ISBN, classificação, etc)
- ✅ Usuario (com numeroCadastro, CPF, etc)
- ✅ Emprestimo (com relacionamentos)
- ✅ Configuracao (para prazo configurável)
- ✅ Adicionar campos: `ativo`, `createdAt`, `updatedAt`

### 4.4 Fase 4: Validação

**Criar Schemas Zod:**
```typescript
// src/types/acervo.ts
import { z } from 'zod'

export const acervoSchema = z.object({
  numeroExemplar: z.string().regex(/^EX\d{6}$/),
  titulo: z.string().min(3),
  autor: z.string(),
  isbn: z.string().optional(),
  // ... outros campos
})

export type Acervo = z.infer<typeof acervoSchema>
```

**Atualizar Formulários:**
- `new-loan-form.tsx` → usar React Hook Form + Zod
- `returns-form.tsx` → usar React Hook Form + Zod
- Importação Excel → validar com Zod

---

## 5. PLANO PARA SPRINT 1

### 5.1 Objetivo Sprint 1
**Conforme `docs/10-roadmap.md`:**
- Modelagem Prisma ✅
- Configuração SQLite ✅
- Importação Excel
- Cadastro de Acervo
- Consulta de Acervo

### 5.2 Ordem de Tarefas

#### ANTES DO DESENVOLVIMENTO (0 Sprints)

1. **Limpeza (2h)**
   - [ ] Remover `recent-loans.tsx` e `categories.tsx`
   - [ ] Remover `lib/mock-data.ts`
   - [ ] Remover assets desnecessários de `public/`

2. **Refatorar Schema Prisma (4h)**
   - [ ] Reescrever schema conforme documentação
   - [ ] Incluir `Configuracao` table
   - [ ] Adicionar campos `ativo`, `createdAt`, `updatedAt`
   - [ ] Gerar nova migration

3. **Criar Estrutura Arquitetônica (4h)**
   - [ ] Criar diretórios: `src/services/`, `src/repositories/`, `src/types/`
   - [ ] Mover `app/`, `components/`, `lib/` para `src/`
   - [ ] Atualizar `tsconfig.json`, `next.config.ts`
   - [ ] Atualizar imports em todos os arquivos

4. **Criar Base de Tipos (3h)**
   - [ ] `src/types/acervo.ts` com schema Zod
   - [ ] `src/types/usuario.ts` com schema Zod
   - [ ] `src/types/emprestimo.ts` com schema Zod
   - [ ] `src/types/configuracao.ts` com schema Zod

5. **Criar Repositories (4h)**
   - [ ] `AcervoRepository` (CRUD)
   - [ ] `UsuarioRepository` (CRUD)
   - [ ] `EmprestimoRepository` (CRUD)
   - [ ] `ConfiguracaoRepository` (CRUD)

6. **Criar Services (4h)**
   - [ ] `AcervoService` (lógica de negócio)
   - [ ] `UsuarioService` (lógica de negócio)
   - [ ] `EmprestimoService` (lógica de negócio)
   - [ ] `ConfiguracaoService` (lógica de negócio)

#### SPRINT 1 (Conforme Roadmap)

7. **Importação Excel (6h)**
   - [ ] Criar endpoint de upload
   - [ ] Parsear XLSX com `xlsx`
   - [ ] Validar com Zod
   - [ ] Importar para Prisma

8. **Cadastro de Acervo (8h)**
   - [ ] Página: `app/books/new/page.tsx`
   - [ ] Formulário com React Hook Form + Zod
   - [ ] Integração com `AcervoService`
   - [ ] Toast de sucesso

9. **Consulta de Acervo (6h)**
   - [ ] Melhorar `app/books/page.tsx`
   - [ ] Busca, ordenação, paginação
   - [ ] Integração com `AcervoService`
   - [ ] Listar dados do Prisma (não mockData)

### 5.3 Checklist Técnico Obrigatório

**Antes de começar Sprint 1:**
- [ ] Schema Prisma refatorado
- [ ] Estrutura `src/` criada e funcionando
- [ ] Todos os imports atualizados
- [ ] TypeScript sem erros (`tsc --noEmit`)
- [ ] ESLint limpo (`eslint .`)
- [ ] Build funcionando (`next build`)
- [ ] Dev server funcionando (`npm run dev`)

---

## 6. ANÁLISE DE DEPENDÊNCIAS

### 6.1 Stack Confirmado
| Pacote | Versão | Status | Necessário para |
|--------|--------|--------|-----------------|
| next | 16.2.9 | ✅ OK | Framework |
| react | 19.2.4 | ✅ OK | UI |
| typescript | ^5 | ✅ OK | Type safety |
| prisma | ^7.8.0 | ✅ OK | ORM |
| @prisma/client | ^7.8.0 | ✅ OK | DB client |
| sqlite | (better-sqlite3) | ✅ OK | Database |
| tailwindcss | ^4 | ✅ OK | CSS |
| shadcn | ^4.11.0 | ✅ OK | UI components |
| zod | ❌ NÃO INSTALADO | ⚠️ PRECISA | Validação |
| react-hook-form | ❌ NÃO INSTALADO | ⚠️ PRECISA | Forms |

### 6.2 Dependências Faltando
```bash
npm install zod react-hook-form
```

### 6.3 Dependências Desnecessárias
- `electron`: Instalado mas não previsto na documentação
- `electron-builder`: Instalado mas não previsto na documentação
- (Nota: Pode ser deixado para versão desktop no futuro)

---

## 7. CONFIGURAÇÃO ARQUIVO .env

**Atual:**
```
DATABASE_URL="file:./biblioteca.db"
```

**Necessário (após reorganização):**
```
DATABASE_URL="file:./storage/database/biblioteca.db"
```

**Adicionar (para futuro):**
```
# Backup/Export
STORAGE_BACKUP_PATH="./storage/backups"
STORAGE_EXPORT_PATH="./storage/exports"

# Configurações
LOAN_DEFAULT_DAYS=14
```

---

## 8. STATUS DE DOCUMENTAÇÃO

| Documento | Status | Alinhamento |
|-----------|--------|------------|
| `00-visao-geral.md` | ✅ Completo | ✅ Alinhado com projeto |
| `01-regras-negocio.md` | ✅ Completo | ⚠️ Parcialmente implementado |
| `02-modelagem-banco.md` | ✅ Completo | ❌ Schema Prisma desalinhado |
| `03-tela-home.md` | ✅ Completo | ✅ Implementado |
| `04-tela-emprestimo.md` | ✅ Completo | ⚠️ Rascunho (sem persistência) |
| `05-tela-devolucao.md` | ✅ Completo | ⚠️ Rascunho (sem persistência) |
| `06-tela-acervo.md` | ✅ Completo | ⚠️ Mock data, sem persistência |
| `07-tela-usuarios.md` | ✅ Completo | ❌ Não implementado |
| `08-importacao-excel.md` | ✅ Completo | ❌ Não implementado |
| `09-arquitetura.md` | ✅ Completo | ❌ Estrutura não criada |
| `10-roadmap.md` | ✅ Completo | ✅ Alinhado |
| `11-layout.md` | ✅ Completo | ✅ Implementado |
| `12-padroes-ui.md` | ✅ Completo | ⚠️ Parcialmente seguido |
| `13-backup-e-exportacao.md` | ✅ Completo | ❌ Não implementado |
| `14-prompts-claude.md` | ✅ Presente | (Sistema prompt) |

---

## 9. RECOMENDAÇÕES FINAIS

### ✅ O QUE ESTÁ BOM
1. Documentação é excelente e clara
2. Layout/UI base está pronto
3. Dependências corretas instaladas
4. Next.js 16 com App Router configurado
5. Tailwind + Shadcn bem estruturados
6. Roteiro (Roadmap) é realista

### ❌ O QUE PRECISA MUDAR
1. **Crítico:** Refazer schema Prisma (3 → 4 tabelas)
2. **Crítico:** Criar estrutura de pastas (src/)
3. **Crítico:** Implementar services/repositories
4. **Alto:** Instalar Zod + React Hook Form
5. **Alto:** Criar tipos TypeScript
6. **Médio:** Remover componentes órfãos
7. **Médio:** Reorganizar banco de dados para `storage/`

### 🎯 PRÓXIMO PASSO
**Aguardar aprovação do relatório para prosseguir com limpeza e preparação.**

---

## APÊNDICE: Comando Git para Arquivos a Remover

Após aprovação, executar:
```bash
# Remover componentes órfãos
git rm components/dashboard/recent-loans.tsx
git rm components/dashboard/categories.tsx

# Remover mock data
git rm lib/mock-data.ts

# Commit
git commit -m "refactor: remove unused mock components and data"
```

---

**Relatório preparado para:** Desenvolvimento do VIVA Biblioteca  
**Próxima Ação:** Aguardando aprovação para Fase 1 (Limpeza)  
**Estimativa:** 27 horas de trabalho pré-Sprint 1
