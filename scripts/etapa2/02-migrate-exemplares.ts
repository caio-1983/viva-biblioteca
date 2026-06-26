/**
 * ETAPA 2 — Script 02: Migração de Exemplares e Auditoria
 *
 * Requer que o Script 01 tenha sido executado (.tmp/obras-map.json deve existir).
 *
 * Para cada Acervo:
 *   1. Cria um Exemplar na nova tabela, preservando codigoExemplar = Acervo.numeroExemplar
 *   2. Registra o mapeamento em MigracaoAuditoria (acervoId → exemplarId + obraId)
 *
 * IDEMPOTENTE: verifica se a migração já foi concluída antes de prosseguir.
 *
 * Execução (da raiz do projeto):
 *   npx tsx scripts/etapa2/02-migrate-exemplares.ts
 */

import fs from 'fs'
import path from 'path'
import { StatusExemplar } from '@prisma/client'
import { prisma, disconnect } from './_prisma'
import type { ObraMapFile } from './01-migrate-obras'

const MAP_FILE = path.join(process.cwd(), 'scripts', 'etapa2', '.tmp', 'obras-map.json')

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  ETAPA 2 — Script 02: Exemplares + Auditoria     ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  // Pré-condição: mapa do Script 01 deve existir
  if (!fs.existsSync(MAP_FILE)) {
    console.error('❌  .tmp/obras-map.json não encontrado.')
    console.error('    Execute o Script 01 antes de continuar.\n')
    process.exit(1)
  }

  const mapFile: ObraMapFile = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'))

  // Idempotência: se todos os Exemplares já existem, pula
  const totalAcervos = await prisma.acervo.count()
  const existingExemplar = await prisma.exemplar.count()
  const existingAudit = await prisma.migracaoAuditoria.count()

  if (existingExemplar === totalAcervos && existingAudit === totalAcervos) {
    console.log(`ℹ️   ${existingExemplar} Exemplares e ${existingAudit} registros de auditoria já existem.`)
    console.log('     Script 02 já foi executado — pulando.\n')
    return
  }

  if (existingExemplar > 0 || existingAudit > 0) {
    console.error(`❌  Estado parcial: Exemplar=${existingExemplar}, Auditoria=${existingAudit}, Acervo=${totalAcervos}`)
    console.error('    Execute rollback.ts e reinicie a partir do Script 00.\n')
    process.exit(1)
  }

  console.log(`Lendo ${totalAcervos} registros do Acervo...`)
  const acervos = await prisma.acervo.findMany({ orderBy: { id: 'asc' } })

  // Valida que o mapa cobre todos os acervos presentes
  const acervosNoMapa = new Set(Object.keys(mapFile.map).map(Number))
  const faltando = acervos.filter(a => !acervosNoMapa.has(a.id))
  if (faltando.length > 0) {
    console.error(`❌  ${faltando.length} Acervo(s) não estão no mapa do Script 01.`)
    console.error('    IDs faltando:', faltando.map(a => a.id).join(', '))
    console.error('    Execute rollback.ts e reinicie a partir do Script 01.\n')
    process.exit(1)
  }

  console.log('Criando Exemplares e registros de Auditoria em transação...\n')

  await prisma.$transaction(async (tx) => {
    for (const acervo of acervos) {
      const entry = mapFile.map[acervo.id]

      const exemplar = await tx.exemplar.create({
        data: {
          obraId: entry.obraId,
          codigoExemplar: acervo.numeroExemplar,
          tombo: acervo.tombo,
          observacao: acervo.observacao,
          status: acervo.status as StatusExemplar,
          ativo: acervo.ativo,
          createdAt: acervo.createdAt,
          // codigoBarras, estadoFisico, localizacao, origem, dataAquisicao, valor:
          // não existem em Acervo — ficarão null; o bibliotecário preenche progressivamente
        },
      })

      await tx.migracaoAuditoria.create({
        data: {
          acervoId: acervo.id,
          exemplarId: exemplar.id,
          obraId: entry.obraId,
          estrategia: entry.estrategia,
          chaveDeduplicacao: entry.chave,
          needsReview: entry.needsReview,
        },
      })
    }
  })

  const finalExemplar = await prisma.exemplar.count()
  const finalAudit = await prisma.migracaoAuditoria.count()
  const needsReview = await prisma.migracaoAuditoria.count({ where: { needsReview: true } })

  console.log(`  ✅ ${finalExemplar} Exemplares criados`)
  console.log(`  ✅ ${finalAudit} registros de MigracaoAuditoria criados`)
  if (needsReview > 0) {
    console.log(`  ⚠️  ${needsReview} marcados needsReview=true (estratégia INDIVIDUAL)`)
  }
  console.log('')
  console.log('✅  Script 02 concluído.\n')
}

main()
  .catch(err => { console.error('Erro inesperado:', err); process.exit(1) })
  .finally(() => disconnect())
