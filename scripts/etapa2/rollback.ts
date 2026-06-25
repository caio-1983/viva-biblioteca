/**
 * ETAPA 2 — Rollback da Fase 1
 *
 * Reverte a migração de dados e limpa as tabelas novas.
 * Executável em qualquer ponto da Fase 1 (antes ou depois dos Scripts 01–03).
 *
 * O que este script FAZ:
 *   - Zera Emprestimo.exemplarId (se a coluna existir)
 *   - Remove todos os registros de MigracaoAuditoria
 *   - Remove todos os Exemplares
 *   - Remove todas as Obras
 *   - Remove Sequencia 'exemplar'
 *   - Remove .tmp/obras-map.json
 *
 * O que este script NÃO faz (requer migration):
 *   - Não remove a coluna Emprestimo.exemplarId (requer prisma migrate)
 *   - Não remove as tabelas Obra, Exemplar, MigracaoAuditoria, Sequencia
 *   - Não altera Acervo, Emprestimo ou qualquer dado de produção
 *
 * ATENÇÃO: Não execute após o Passo 6 (Fase 2 destrutiva).
 *          Após remover Emprestimo.acervoId, este rollback é irreversível.
 *
 * Execução (da raiz do projeto):
 *   npx tsx scripts/etapa2/rollback.ts
 */

import fs from 'fs'
import path from 'path'
import { prisma, disconnect } from './_prisma'

const MAP_FILE = path.join(process.cwd(), 'scripts', 'etapa2', '.tmp', 'obras-map.json')

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  ETAPA 2 — Rollback da Fase 1                    ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  // Verificação de segurança: se Emprestimo.acervoId foi removido, não prosseguir
  const temAcervoId = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM pragma_table_info('Emprestimo') WHERE name='acervoId'
  `
  if (temAcervoId.length === 0) {
    console.error('🚫  Emprestimo.acervoId não existe — Fase 2 já foi aplicada.')
    console.error('    O rollback desta etapa não é mais possível.\n')
    process.exit(1)
  }

  // Exibe o que será removido
  const obraCount = await prisma.obra.count()
  const exemplarCount = await prisma.exemplar.count()
  const auditCount = await prisma.migracaoAuditoria.count()
  const seqExists = await prisma.sequencia.findUnique({ where: { nome: 'exemplar' } })

  console.log('Estado atual (será zerado):')
  console.log(`  Obras             : ${obraCount}`)
  console.log(`  Exemplares        : ${exemplarCount}`)
  console.log(`  MigracaoAuditoria : ${auditCount}`)
  console.log(`  Sequencia.exemplar: ${seqExists ? seqExists.valor : '(não existe)'}`)
  console.log(`  obras-map.json    : ${fs.existsSync(MAP_FILE) ? 'presente' : 'ausente'}`)
  console.log('')

  if (obraCount === 0 && exemplarCount === 0 && auditCount === 0 && !seqExists) {
    console.log('ℹ️   Nada a remover — tabelas já estão vazias.\n')
    return
  }

  // ── Etapa 1: Zerar Emprestimo.exemplarId se a coluna existir ──────────
  const colExists = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM pragma_table_info('Emprestimo') WHERE name='exemplarId'
  `
  if (colExists.length > 0) {
    await prisma.$executeRaw`UPDATE Emprestimo SET exemplarId = NULL WHERE exemplarId IS NOT NULL`
    console.log('  ✅ Emprestimo.exemplarId zerado')
  } else {
    console.log('  ⏭  Emprestimo.exemplarId não existe (Script 03 não foi executado)')
  }

  // ── Etapa 2: Remover em ordem (respeita FK: Exemplar antes de Obra) ───
  // MigracaoAuditoria não tem FK para Exemplar/Obra, pode ser removida em qualquer ordem
  const deletedAudit = await prisma.migracaoAuditoria.deleteMany()
  console.log(`  ✅ MigracaoAuditoria: ${deletedAudit.count} registro(s) removido(s)`)

  const deletedExemplar = await prisma.exemplar.deleteMany()
  console.log(`  ✅ Exemplar: ${deletedExemplar.count} registro(s) removido(s)`)

  const deletedObra = await prisma.obra.deleteMany()
  console.log(`  ✅ Obra: ${deletedObra.count} registro(s) removido(s)`)

  if (seqExists) {
    await prisma.sequencia.delete({ where: { nome: 'exemplar' } })
    console.log('  ✅ Sequencia \'exemplar\' removida')
  }

  // ── Etapa 3: Remover arquivo de mapa ─────────────────────────────────
  if (fs.existsSync(MAP_FILE)) {
    fs.unlinkSync(MAP_FILE)
    console.log('  ✅ .tmp/obras-map.json removido')
  }

  console.log('\n✅  Rollback concluído. Estado idêntico ao pós-Passo 3.')
  console.log('    Execute 00-pre-check.ts para verificar antes de reiniciar.\n')
}

main()
  .catch(err => { console.error('Erro inesperado:', err); process.exit(1) })
  .finally(() => disconnect())
