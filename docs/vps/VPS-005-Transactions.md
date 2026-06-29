# VPS-005 — Atomicidade e Transações

**Sprint:** VPS-005  
**Data de execução:** 2026-06-28  
**Branch:** `release/h-001-homologacao`  
**Status:** ✅ Concluído

---

## 1. Objetivo

Corrigir as três race conditions identificadas em VPS-004 e sinalizadas como pendências críticas no relatório de homologação H-001:

1. **P1 (CRÍTICO):** `emprestimo.service.ts:registrar()` sem transação — TOCTOU em check+write do status do exemplar.
2. **P2 (CRÍTICO):** `devolucao.service.ts:registrar()` sem transação — devolução dupla simultânea.
3. **P3 (MÉDIO):** `leitor.repository.ts:generateNumeroCadastro()` não atômica — `findFirst + increment` manual.

---

## 2. Diagnóstico

O merge de consolidação `ea15769` (VPS 001–005) **não incluiu os fixes transacionais**. O código que chegou à branch `release/h-001-homologacao` ainda tinha as três pendências abertas conforme documentado em `H-001-Relatorio.md §Pendências`.

### Estado pré-fix

| Arquivo | Problema |
|---------|----------|
| `src/services/emprestimo.service.ts` | `exemplarRepository.findById` + `emprestimoRepository.create` + `exemplarRepository.updateStatus` — 3 operações separadas, sem `$transaction` |
| `src/services/devolucao.service.ts` | `emprestimoRepository.findById` + `emprestimoRepository.devolver` + `exemplarRepository.updateStatus` — 3 operações separadas, sem `$transaction` |
| `src/repositories/leitor.repository.ts` | `generateNumeroCadastro()`: `findFirst({ orderBy: createdAt desc })` + `parseInt + 1` — não atômico |

---

## 3. Correções implementadas

### P1 — `emprestimo.service.ts:registrar()`

**Padrão:** check-and-set com `updateMany` dentro de `prisma.$transaction`.

```typescript
return prisma.$transaction(async (tx) => {
  // 1. Verifica limite de empréstimos do usuário (dentro da tx)
  const ativos = await tx.emprestimo.count({ where: { usuarioId, status: 'ATIVO' } })
  if (ativos >= config.maxEmprestimos) throw new Error(...)

  // 2. Check-and-set atômico: atualiza SOMENTE se DISPONIVEL
  const updated = await tx.exemplar.updateMany({
    where: { id: data.exemplarId, status: 'DISPONIVEL', ativo: true },
    data: { status: 'EMPRESTADO' },
  })
  if (updated.count === 0) throw new Error('Exemplar não está disponível')

  // 3. Cria o empréstimo dentro da mesma transação
  return tx.emprestimo.create({ data: { ... } })
})
```

**Por que funciona:** `updateMany` com `WHERE status = 'DISPONIVEL'` retorna `count = 0` se outro processo já mudou o status. Ambas as operações (check + write) são atômicas dentro da transação — eliminando o TOCTOU.

### P2 — `devolucao.service.ts:registrar()`

**Padrão:** check-and-set com `updateMany` dentro de `prisma.$transaction`.

```typescript
return prisma.$transaction(async (tx) => {
  // Check-and-set: só devolve se status ainda é ATIVO
  const updated = await tx.emprestimo.updateMany({
    where: { id: emprestimoId, status: 'ATIVO' },
    data: { dataDevolucao: new Date(), status: 'DEVOLVIDO' },
  })
  if (updated.count === 0) throw new Error('Empréstimo não está ativo')

  await tx.exemplar.update({ where: { id: exemplarId }, data: { status: 'DISPONIVEL' } })
  return { success: true }
})
```

**Por que funciona:** Devolução dupla simultânea — o segundo `updateMany` encontra o empréstimo já com `status = 'DEVOLVIDO'` e retorna `count = 0`, gerando erro controlado. O exemplar não é alterado duas vezes.

### P3 — `leitor.repository.ts:generateNumeroCadastro()`

**Padrão:** `sequencia.upsert` dentro de `prisma.$transaction` — idêntico ao `codigoExemplar`.

```typescript
async create(data: LeitorCreate) {
  return prisma.$transaction(async (tx) => {
    // INSERT ... ON CONFLICT DO UPDATE SET valor = valor + 1 — atômico no PostgreSQL
    const seq = await tx.sequencia.upsert({
      where: { nome: 'usuario' },
      update: { valor: { increment: 1 } },
      create: { nome: 'usuario', valor: 1 },
    })
    const numeroCadastro = `US${String(seq.valor).padStart(6, '0')}`
    return tx.usuario.create({ data: { numeroCadastro, ... } })
  })
}
```

**Por que funciona:** O Prisma traduz `upsert` para `INSERT ... ON CONFLICT DO UPDATE` no PostgreSQL, que é garantidamente atômico. Dois processos simultâneos nunca obtêm o mesmo `valor`. O `create` da transação e o `upsert` da sequência fazem rollback juntos caso o `usuario.create` falhe (ex: CPF duplicado).

**Nota:** Em ambientes com usuários pré-existentes (numeroCadastro US000001..USxxxxxx), executar `npm run seed:usuario-seq` uma vez antes de criar novos usuários para inicializar a linha `Sequencia('usuario')` com o valor máximo atual.

---

## 4. Arquivos criados / alterados

| Arquivo | Mudança |
|---------|---------|
| `src/services/emprestimo.service.ts` | Import `prisma`; `registrar()` reescrito com `$transaction` + check-and-set |
| `src/services/devolucao.service.ts` | Import `prisma`; `registrar()` reescrito com `$transaction` + check-and-set |
| `src/repositories/leitor.repository.ts` | `create()` usa `$transaction` + `sequencia.upsert`; método `generateNumeroCadastro` removido |
| `scripts/concurrency/_prisma.ts` | Cliente Prisma compartilhado para scripts de concorrência |
| `scripts/concurrency/seed-usuario-seq.ts` | Seed único: inicializa `Sequencia('usuario')` com max atual |
| `scripts/concurrency/test-emprestimo.ts` | Teste de concorrência: empréstimos simultâneos |
| `scripts/concurrency/test-devolucao.ts` | Teste de concorrência: devoluções simultâneas |
| `scripts/concurrency/test-leitor.ts` | Teste de concorrência: criação simultânea de leitores |
| `scripts/concurrency/run-all.ts` | Runner: executa todos os testes de concorrência |
| `package.json` | Scripts adicionados: `seed:usuario-seq`, `test:concurrency` |

---

## 5. Testes de concorrência

```bash
# Executar todos os testes de concorrência
npm run test:concurrency

# Executar individualmente
tsx scripts/concurrency/test-emprestimo.ts
tsx scripts/concurrency/test-devolucao.ts
tsx scripts/concurrency/test-leitor.ts

# Inicializar sequência de usuários (deploy único)
npm run seed:usuario-seq
```

### Resultados esperados

| Teste | Cenário | Esperado |
|-------|---------|---------|
| `test-emprestimo` | 5 empréstimos simultâneos do mesmo exemplar | 1 sucesso, 4 falhas controladas, `count(ATIVO)=1` |
| `test-devolucao` | 5 devoluções simultâneas do mesmo empréstimo | 1 sucesso, 4 falhas controladas, status `DEVOLVIDO` |
| `test-leitor` | 8 criações simultâneas de leitores | 8 sucessos, 8 `numeroCadastro` distintos |

---

## 6. Checklist de validação

- [x] `emprestimo.service.ts:registrar()` usa `prisma.$transaction` com check-and-set
- [x] `devolucao.service.ts:registrar()` usa `prisma.$transaction` com check-and-set
- [x] `leitor.repository.ts:create()` usa `sequencia.upsert` dentro de `$transaction`
- [x] `generateNumeroCadastro()` privado removido (lógica internalizada no `create`)
- [x] Scripts de concorrência criados em `scripts/concurrency/`
- [x] `npm run build` — 0 erros TypeScript
- [x] `npm run test:concurrency` — todos os testes passaram
- [x] `H-001-Relatorio.md` atualizado — pendências P1, P2, P3 resolvidas

---

## 7. Riscos residuais

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Acentuação em buscas (`bíblia` ≠ `biblia`) | Baixo (UX) | Constante | Collation `unaccent` — sprint futuro |
| `codigoExemplar` legado (formato não EX000000) | Baixo (cosmético) | Atual | Normalização pós-implantação |
| Senha do PostgreSQL em produção (`biblioteca`) | Médio (segurança) | Alto | Usar Docker Secrets / variáveis seguras |
