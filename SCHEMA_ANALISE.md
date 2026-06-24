# ANÁLISE: Schema Prisma Atual vs. Proposto

## 1. SCHEMA ATUAL (Em Produção)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
}

model Livro {
  id                   Int    @id @default(autoincrement())
  codigo               String @unique
  titulo               String
  autor                String?
  categoria            String?

  quantidadeTotal      Int @default(1)
  quantidadeDisponivel Int @default(1)

  emprestimos Emprestimo[]
}

model Membro {
  id              Int @id @default(autoincrement())
  nome            String
  dataNascimento  DateTime?
  telefone        String?
  observacoes     String?

  emprestimos Emprestimo[]
}

model Emprestimo {
  id Int @id @default(autoincrement())

  livroId  Int
  membroId Int

  dataEmprestimo DateTime @default(now())
  dataPrevista   DateTime
  dataDevolucao  DateTime?

  livro  Livro  @relation(fields: [livroId], references: [id])
  membro Membro @relation(fields: [membroId], references: [id])
}
```

**Características:**
- ❌ 3 modelos (Livro, Membro, Emprestimo)
- ❌ Faltam campos críticos do Acervo
- ❌ Sem tabela de Configuracao
- ❌ Sem campos de auditoria (createdAt, updatedAt)
- ❌ Sem campos de soft-delete (ativo)

---

## 2. SCHEMA PROPOSTO (Documentação)

Baseado em `docs/02-modelagem-banco.md`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ============================================
// ACERVO - Livros/Exemplares
// ============================================
model Acervo {
  id                  Int     @id @default(autoincrement())
  numeroExemplar      String  @unique
  tipoPublicacao      String?
  isbn                String?
  classificacao       String?
  titulo              String
  subtitulo           String?
  autor               String?
  edicao              String?
  editora             String?
  dataPublicacao      DateTime?
  tombo               String?
  assunto1            String?
  assunto2            String?
  assunto3            String?
  colecao             String?
  observacao          String?
  status              String  @default("DISPONÍVEL") // DISPONÍVEL, EMPRESTADO, DANIFICADO
  ativo               Boolean @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  emprestimos         Emprestimo[]
}

// ============================================
// USUÁRIO - Membros da Biblioteca
// ============================================
model Usuario {
  id                  Int     @id @default(autoincrement())
  numeroCadastro      String  @unique
  nomeCompleto        String
  cpf                 String?
  dataNascimento      DateTime?
  celular             String?
  email               String?
  membro              Boolean @default(true)
  ativo               Boolean @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  emprestimos         Emprestimo[]
}

// ============================================
// EMPRÉSTIMO - Histórico de Circulação
// ============================================
model Emprestimo {
  id                  Int     @id @default(autoincrement())
  usuarioId           Int
  acervoId            Int
  dataEmprestimo      DateTime @default(now())
  dataPrevistaDevolucao DateTime
  dataDevolucao       DateTime?
  status              String  @default("ATIVO") // ATIVO, DEVOLVIDO, ATRASADO
  createdAt           DateTime @default(now())

  usuario             Usuario @relation(fields: [usuarioId], references: [id], onDelete: Restrict)
  acervo              Acervo  @relation(fields: [acervoId], references: [id], onDelete: Restrict)

  @@index([usuarioId])
  @@index([acervoId])
  @@index([dataEmprestimo])
}

// ============================================
// CONFIGURAÇÃO - Parâmetros do Sistema
// ============================================
model Configuracao {
  id                      Int     @id @default(autoincrement())
  prazoEmprestimoDias     Int     @default(14)
  pastaBackup             String?
  pastaExportacao         String?
  updatedAt               DateTime @updatedAt
}
```

**Características:**
- ✅ 4 modelos (Acervo, Usuario, Emprestimo, Configuracao)
- ✅ Campos completos do Acervo (ISBN, classificação, etc)
- ✅ Campos de auditoria (createdAt, updatedAt)
- ✅ Soft-delete (ativo)
- ✅ Status tracking (para livros e empréstimos)
- ✅ Índices de performance (Emprestimo)

---

## 3. COMPARAÇÃO DETALHADA

### Modelo Livro → Acervo

| Campo | Atual | Proposto | Diferença |
|-------|-------|----------|-----------|
| id | Int @id | Int @id | ✅ Igual |
| codigo | String @unique | numeroExemplar String @unique | ⚠️ Renomeado para documentação |
| titulo | String | titulo String | ✅ Igual |
| autor | String? | autor String? | ✅ Igual |
| categoria | String? | ❌ REMOVIDO | ❌ Será substituída por classificação |
| - | ❌ Falta | tipoPublicacao String? | ⭐ NOVO |
| - | ❌ Falta | isbn String? | ⭐ NOVO |
| - | ❌ Falta | classificacao String? | ⭐ NOVO |
| - | ❌ Falta | subtitulo String? | ⭐ NOVO |
| - | ❌ Falta | edicao String? | ⭐ NOVO |
| - | ❌ Falta | editora String? | ⭐ NOVO |
| - | ❌ Falta | dataPublicacao DateTime? | ⭐ NOVO |
| - | ❌ Falta | tombo String? | ⭐ NOVO |
| - | ❌ Falta | assunto1, assunto2, assunto3 | ⭐ NOVO |
| - | ❌ Falta | colecao String? | ⭐ NOVO |
| - | ❌ Falta | observacao String? | ⭐ NOVO |
| quantidadeTotal | Int | ❌ REMOVIDO | ❌ Cada exemplar é um registro |
| quantidadeDisponivel | Int | ❌ REMOVIDO | ❌ Substituída por status |
| status | ❌ Falta | status String ("DISPONÍVEL"...) | ⭐ NOVO |
| ativo | ❌ Falta | ativo Boolean @default(true) | ⭐ NOVO (soft-delete) |
| - | ❌ Falta | createdAt DateTime | ⭐ NOVO (auditoria) |
| - | ❌ Falta | updatedAt DateTime | ⭐ NOVO (auditoria) |

### Modelo Membro → Usuario

| Campo | Atual | Proposto | Diferença |
|-------|-------|----------|-----------|
| id | Int @id | Int @id | ✅ Igual |
| nome | String | nomeCompleto String | ⚠️ Renomeado para clareza |
| dataNascimento | DateTime? | dataNascimento DateTime? | ✅ Igual |
| telefone | String? | celular String? | ⚠️ Renomeado para específico |
| observacoes | String? | ❌ REMOVIDO | ❌ Não previsto na documentação |
| - | ❌ Falta | numeroCadastro String @unique | ⭐ NOVO (identificador) |
| - | ❌ Falta | cpf String? | ⭐ NOVO |
| - | ❌ Falta | email String? | ⭐ NOVO |
| - | ❌ Falta | membro Boolean | ⭐ NOVO |
| - | ❌ Falta | ativo Boolean | ⭐ NOVO (soft-delete) |
| - | ❌ Falta | createdAt DateTime | ⭐ NOVO (auditoria) |
| - | ❌ Falta | updatedAt DateTime | ⭐ NOVO (auditoria) |

### Modelo Emprestimo

| Campo | Atual | Proposto | Diferença |
|-------|-------|----------|-----------|
| id | Int @id | Int @id | ✅ Igual |
| livroId → acervoId | Int | Int | ✅ Renomeado |
| membroId → usuarioId | Int | Int | ✅ Renomeado |
| dataEmprestimo | DateTime @default(now()) | DateTime @default(now()) | ✅ Igual |
| dataPrevista → dataPrevistaDevolucao | DateTime | DateTime | ⚠️ Renomeado para clareza |
| dataDevolucao | DateTime? | DateTime? | ✅ Igual |
| status | ❌ Falta | status String @default("ATIVO") | ⭐ NOVO |
| - | ❌ Falta | createdAt DateTime | ⭐ NOVO (auditoria) |
| - | ❌ Falta | índices | ⭐ NOVO (performance) |

### Novo Modelo: Configuracao

**Proposto:**
```prisma
model Configuracao {
  id                      Int     @id @default(autoincrement())
  prazoEmprestimoDias     Int     @default(14)
  pastaBackup             String?
  pastaExportacao         String?
  updatedAt               DateTime @updatedAt
}
```

**Razão:** Documentação prevê configuração de prazo dinâmico (14 dias inicialmente)

---

## 4. MUDANÇAS ESTRUTURAIS

### Paradigma de Modelagem

**ATUAL:** Um livro pode ter múltiplas cópias (quantidadeTotal / quantidadeDisponivel)
```
Livro (1 registro) → 5 cópias
```

**PROPOSTO:** Cada exemplar é um registro separado
```
Livro "Clean Code" → 5 registros Acervo (EX000001, EX000002, ...)
```

**Vantagem:** Cada exemplar pode ter status independente, histórico de empréstimo único, etc.

---

## 5. ESTRATÉGIA DE MIGRAÇÃO

### Opção A: Migração do Banco Existente (RECOMENDADO)

1. **Backup do banco atual:**
   ```bash
   cp storage/database/biblioteca.db storage/database/biblioteca.db.backup
   ```

2. **Remover banco antigo:**
   ```bash
   rm storage/database/biblioteca.db
   ```

3. **Criar nova migration:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Resultado:** Schema novo, banco vazio, pronto para Sprint 1

**Impacto:** Os 2 registros mockados em Livro/Membro/Emprestimo são perdidos (não importa, eram dados de teste)

### Opção B: Manter Dados Antigos (NÃO RECOMENDADO)

Complexo demais para este estágio. Banco antigo será descartado.

---

## 6. IMPACTO NO CÓDIGO

### Mudanças Necessárias (Sprint 1)

**Services:**
```typescript
// Antes
acervoService.buscarLivroPorCodigo(codigo)

// Depois
acervoService.buscarExemplarPorNumero(numeroExemplar)
```

**Repositories:**
```typescript
// Antes
const livros = await livroRepository.findMany()

// Depois
const acervos = await acervoRepository.findMany()
```

**Types:**
```typescript
// Antes
interface Livro { codigo: string, ... }

// Depois
interface Acervo { numeroExemplar: string, ... }
```

### Componentes Impactados

- `components/books/books-inventory.tsx` - Atualizar para Acervo
- `components/loans/new-loan-form.tsx` - Atualizar para Usuario
- `components/returns/returns-form.tsx` - Atualizar para Usuario
- Todos os serviços/repositories (novos de qualquer forma)

---

## 7. RECOMENDAÇÃO FINAL

✅ **USAR SCHEMA PROPOSTO**

**Razão:**
1. Alinhado com documentação (fonte de verdade)
2. Melhor modelo de negócio (exemplares independentes)
3. Suporta regras de negócio (numeroExemplar nunca muda, soft-delete)
4. Facilita auditoria (createdAt, updatedAt)
5. Preparado para futuro (status tracking)

**Plano:**
1. Criar nova schema Prisma
2. Deletar banco atual
3. Executar `npx prisma migrate dev --name init`
4. Testes (build, lint, type-check)
5. Próximo passo: Criar tipos TypeScript

---

## PRÓXIMA APROVAÇÃO NECESSÁRIA

Antes de implementar nova migration, confirmar:
- ✅ Schema proposto está correto?
- ✅ Proceder com Opção A (migração fresh)?
- ✅ Alguma alteração no schema proposto?

Aguardando aprovação para prosseguir.
