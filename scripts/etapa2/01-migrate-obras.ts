/**
 * ETAPA 2 — Script 01: Migração de Obras
 *
 * Lê todos os registros Acervo, agrupa pelo algoritmo de deduplicação de 3 estratégias
 * (ADR-001, ADR-002) e cria uma Obra por grupo bibliográfico único.
 *
 * Saída: .tmp/obras-map.json  — mapeamento acervoId → obraId, utilizado pelo Script 02.
 *
 * IDEMPOTENTE: se Obras já existem e o mapa já foi gerado, encerra sem recriar.
 *
 * Execução (da raiz do projeto):
 *   npx tsx scripts/etapa2/01-migrate-obras.ts
 */

import fs from 'fs'
import path from 'path'
import { Acervo } from '@prisma/client'
import { prisma, disconnect } from './_prisma'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Estrategia = 'ISBN' | 'COMPOSTA' | 'INDIVIDUAL'

export interface ObraMapEntry {
  obraId: number
  estrategia: Estrategia
  chave: string
  needsReview: boolean
}

export interface ObraMapFile {
  metadata: {
    generatedAt: string
    totalAcervos: number
    totalObras: number
    porEstrategia: Record<Estrategia, number>
    deduplicados: number
  }
  map: Record<number, ObraMapEntry>  // acervoId → entry
}

// ─── Algoritmo de deduplicação (ADR-001) ──────────────────────────────────────

function normalizar(s: string | null | undefined): string {
  if (!s) return ''
  return s.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}

function calcularChave(row: Acervo): { key: string; estrategia: Estrategia; needsReview: boolean } {
  const isbn = (row.isbn ?? '').replace(/[^0-9Xx]/g, '').toUpperCase()
  if (isbn.length >= 10) {
    return { key: `isbn:${isbn}`, estrategia: 'ISBN', needsReview: false }
  }

  const t = normalizar(row.titulo)
  const a = normalizar(row.autor)
  const ed = normalizar(row.editora)
  const ei = normalizar(row.edicao)
  if (t && a && ed && ei) {
    return { key: `comp:${t}|${a}|${ed}|${ei}`, estrategia: 'COMPOSTA', needsReview: false }
  }

  // Estratégia conservadora: chave individual = nunca une, marca para revisão
  return { key: `ind:${row.id}`, estrategia: 'INDIVIDUAL', needsReview: true }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractYear(date: Date | null | undefined): number | null {
  if (!date) return null
  return new Date(date).getFullYear()
}

const TMP_DIR = path.join(process.cwd(), 'scripts', 'etapa2', '.tmp')
const MAP_FILE = path.join(TMP_DIR, 'obras-map.json')

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  ETAPA 2 — Script 01: Migração de Obras          ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  // Idempotência: se Obras existem e o mapa foi gerado, não recria
  const existingObras = await prisma.obra.count()
  if (existingObras > 0 && fs.existsSync(MAP_FILE)) {
    console.log(`ℹ️   ${existingObras} Obras já existem e o mapa está presente.`)
    console.log('     Script 01 já foi executado — pulando.\n')
    return
  }
  if (existingObras > 0 && !fs.existsSync(MAP_FILE)) {
    console.error('❌  Obras existem mas .tmp/obras-map.json está ausente.')
    console.error('    Execute rollback.ts e reinicie a partir do Script 00.\n')
    process.exit(1)
  }

  console.log('Lendo registros do Acervo...')
  const acervos = await prisma.acervo.findMany({ orderBy: { id: 'asc' } })
  console.log(`  → ${acervos.length} registros encontrados\n`)

  // ── Fase 1: Deduplicação ─────────────────────────────────────────────────
  // Para cada chave, usa o primeiro Acervo encontrado (menor ID) como fonte
  // dos dados bibliográficos da Obra.
  const keyToFirst = new Map<string, Acervo>()
  const acervoKeyMap = new Map<number, ReturnType<typeof calcularChave>>()

  for (const acervo of acervos) {
    const dedup = calcularChave(acervo)
    acervoKeyMap.set(acervo.id, dedup)
    if (!keyToFirst.has(dedup.key)) {
      keyToFirst.set(dedup.key, acervo)
    }
  }

  const totalObras = keyToFirst.size
  const deduplicados = acervos.length - totalObras
  console.log(`Deduplicação:`)
  console.log(`  Acervos totais  : ${acervos.length}`)
  console.log(`  Obras únicas    : ${totalObras}`)
  console.log(`  Deduplicados    : ${deduplicados}`)
  console.log('')

  // ── Fase 2: Criação das Obras em transação ──────────────────────────────
  console.log('Criando Obras no banco...')

  const keyToObraId = new Map<string, number>()
  const contadores: Record<Estrategia, number> = { ISBN: 0, COMPOSTA: 0, INDIVIDUAL: 0 }

  await prisma.$transaction(async (tx) => {
    for (const [key, acervo] of keyToFirst.entries()) {
      const { estrategia } = acervoKeyMap.get(acervo.id)!
      const obra = await tx.obra.create({
        data: {
          isbn: acervo.isbn,
          titulo: acervo.titulo,
          subtitulo: acervo.subtitulo,
          tipoPublicacao: acervo.tipoPublicacao,
          anoPublicacao: extractYear(acervo.dataPublicacao),
          autor: acervo.autor,
          editora: acervo.editora,
          edicao: acervo.edicao,
          classificacao: acervo.classificacao,
          assunto1: acervo.assunto1,
          assunto2: acervo.assunto2,
          assunto3: acervo.assunto3,
          colecao: acervo.colecao,
          ativo: acervo.ativo,
          createdAt: acervo.createdAt,
        },
      })
      keyToObraId.set(key, obra.id)
      contadores[estrategia]++
    }
  })

  console.log(`  ✅ ${totalObras} Obras criadas\n`)

  // ── Fase 3: Construção do mapa e persistência ──────────────────────────
  const obraMap: Record<number, ObraMapEntry> = {}
  for (const acervo of acervos) {
    const dedup = acervoKeyMap.get(acervo.id)!
    const obraId = keyToObraId.get(dedup.key)!
    obraMap[acervo.id] = {
      obraId,
      estrategia: dedup.estrategia,
      chave: dedup.key,
      needsReview: dedup.needsReview,
    }
  }

  const mapFile: ObraMapFile = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalAcervos: acervos.length,
      totalObras,
      porEstrategia: contadores,
      deduplicados,
    },
    map: obraMap,
  }

  fs.mkdirSync(TMP_DIR, { recursive: true })
  fs.writeFileSync(MAP_FILE, JSON.stringify(mapFile, null, 2), 'utf-8')
  console.log(`📄  Mapa salvo em ${MAP_FILE}\n`)

  // Relatório final
  const needsReviewCount = Object.values(obraMap).filter(e => e.needsReview).length
  console.log('Resumo por estratégia:')
  console.log(`  ISBN       : ${contadores.ISBN} obras  (${Object.values(obraMap).filter(e => e.estrategia === 'ISBN').length} acervos)`)
  console.log(`  COMPOSTA   : ${contadores.COMPOSTA} obras  (${Object.values(obraMap).filter(e => e.estrategia === 'COMPOSTA').length} acervos)`)
  console.log(`  INDIVIDUAL : ${contadores.INDIVIDUAL} obras  (${needsReviewCount} acervos — needsReview = true)`)
  console.log('')

  if (needsReviewCount > 0) {
    console.log(`⚠️   ${needsReviewCount} registro(s) com estratégia INDIVIDUAL marcados para revisão manual.`)
    console.log('     O relatório final (Script 05) listará os detalhes.\n')
  }

  console.log('✅  Script 01 concluído.\n')
}

main()
  .catch(err => { console.error('Erro inesperado:', err); process.exit(1) })
  .finally(() => disconnect())
