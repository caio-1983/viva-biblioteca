# Relatório de Validação — Migração SQLite → PostgreSQL

**Gerado em:** 2026-06-28T18:51:08.981Z  
**Duração:** 0.22s  
**Status:** ✅ **APROVADO**

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de checks | 32 |
| Aprovados | 32 |
| Reprovados | 0 |
| Avisos | 0 |

## Detalhes por check

| Status | Categoria | Item | SQLite | PostgreSQL | Detalhe |
|--------|-----------|------|--------|------------|---------|
| ✅ APROVADO | CONTAGEM | Sequencia | 1 | 1 |  |
| ✅ APROVADO | CONTAGEM | Configuracao | 1 | 1 |  |
| ✅ APROVADO | CONTAGEM | Acervo | 67 | 67 |  |
| ✅ APROVADO | CONTAGEM | Usuario | 4 | 4 |  |
| ✅ APROVADO | CONTAGEM | Obra | 67 | 67 |  |
| ✅ APROVADO | CONTAGEM | Exemplar | 68 | 68 |  |
| ✅ APROVADO | CONTAGEM | MigracaoAuditoria | 67 | 67 |  |
| ✅ APROVADO | CONTAGEM | Emprestimo | 7 | 7 |  |
| ✅ APROVADO | REFERENCIAL | Emprestimo.usuarioId → Usuario | 0 | 0 |  |
| ✅ APROVADO | REFERENCIAL | Emprestimo.exemplarId → Exemplar | 0 | 0 |  |
| ✅ APROVADO | REFERENCIAL | Exemplar.obraId → Obra | 0 | 0 |  |
| ✅ APROVADO | CONSTRAINT | Usuario.numeroCadastro UNIQUE | 0 | 0 |  |
| ✅ APROVADO | CONSTRAINT | Exemplar.codigoExemplar UNIQUE | 0 | 0 |  |
| ✅ APROVADO | CONSTRAINT | Acervo.numeroExemplar UNIQUE | 0 | 0 |  |
| ✅ APROVADO | ENUM | Exemplar.status valores válidos | 0 | 0 |  |
| ✅ APROVADO | ENUM | Acervo.status valores válidos | 0 | 0 |  |
| ✅ APROVADO | ENUM | Emprestimo.status valores válidos | 0 | 0 |  |
| ✅ APROVADO | DATA | Emprestimo.dataEmprestimo NOT NULL | 0 | 0 |  |
| ✅ APROVADO | DATA | Emprestimo.dataPrevistaDevolucao NOT NULL | 0 | 0 |  |
| ✅ APROVADO | DATA | Usuario.dataNascimento sem datas futuras | 0 | 0 |  |
| ✅ APROVADO | CODIGO | Exemplar.codigoExemplar — integridade migração | 68 | 68 |  |
| ✅ APROVADO | CODIGO | Usuario.numeroCadastro formato US000000 | 0 | 0 |  |
| ✅ APROVADO | SEQUENCE | Sequencia exemplar ≥ total de Exemplares | 68 | 68 |  |
| ✅ APROVADO | CONFIG | prazoEmprestimoDias | 20 | 20 |  |
| ✅ APROVADO | CONFIG | maxEmprestimos | 3 | 3 |  |
| ✅ APROVADO | SEQUENCE | Acervo.id sequence | 67 | next=68 |  |
| ✅ APROVADO | SEQUENCE | Configuracao.id sequence | 1 | next=2 |  |
| ✅ APROVADO | SEQUENCE | Usuario.id sequence | 4 | next=5 |  |
| ✅ APROVADO | SEQUENCE | Obra.id sequence | 67 | next=68 |  |
| ✅ APROVADO | SEQUENCE | Exemplar.id sequence | 68 | next=69 |  |
| ✅ APROVADO | SEQUENCE | MigracaoAuditoria.id sequence | 67 | next=68 |  |
| ✅ APROVADO | SEQUENCE | Emprestimo.id sequence | 7 | next=8 |  |

---
*Gerado por scripts/migration/validate-migration.ts*