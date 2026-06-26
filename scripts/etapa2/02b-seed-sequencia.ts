/**
 * ETAPA 2 — Script 02b: Semente da Sequência de Exemplares
 *
 * Inicializa a tabela Sequencia com o valor máximo dos códigos EX já migrados,
 * garantindo que novos Exemplares criados pela aplicação (via ExemplarRepository)
 * continuem a partir do próximo número sem conflito.
 *
 * Lógica: Sequencia.valor = maior número extraído de Exemplar.codigoExemplar
 * Exemplo: se o maior código é EX000067, Sequencia.valor = 67.
 *          Próxima chamada ao repositório gerará EX000068.
 *
 * IDEMPOTENTE: se a sequência já existe, verifica se está correta e encerra.
 *
 * Execução (da raiz do projeto):
 *   npx tsx scripts/etapa2/02b-seed-sequencia.ts
 */

import { prisma, disconnect } from './_prisma'

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  ETAPA 2 — Script 02b: Semente da Sequência      ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  // Pré-condição: Exemplares devem existir
  const totalExemplares = await prisma.exemplar.count()
  if (totalExemplares === 0) {
    console.error('❌  Nenhum Exemplar encontrado.')
    console.error('    Execute os Scripts 01 e 02 antes de continuar.\n')
    process.exit(1)
  }

  // Encontra o maior número de código EX entre todos os Exemplares
  // Formato: EX000001 → extrai 1; EX000067 → extrai 67
  const exemplares = await prisma.exemplar.findMany({
    select: { codigoExemplar: true },
  })

  let maxValor = 0
  for (const { codigoExemplar } of exemplares) {
    const match = codigoExemplar.match(/^EX(\d+)$/)
    if (match) {
      const n = parseInt(match[1], 10)
      if (n > maxValor) maxValor = n
    }
  }

  if (maxValor === 0) {
    console.error('❌  Nenhum Exemplar com código no formato EX\\d+ encontrado.')
    console.error(`    Exemplos de códigos presentes: ${exemplares.slice(0, 5).map(e => e.codigoExemplar).join(', ')}\n`)
    process.exit(1)
  }

  console.log(`Maior código EX encontrado: EX${String(maxValor).padStart(6, '0')} (valor = ${maxValor})`)
  console.log(`Total de Exemplares: ${totalExemplares}\n`)

  // Idempotência: verifica se já foi criada
  const existing = await prisma.sequencia.findUnique({ where: { nome: 'exemplar' } })

  if (existing) {
    if (existing.valor === maxValor) {
      console.log(`ℹ️   Sequencia 'exemplar' já existe com valor ${existing.valor} (correto).`)
      console.log('     Script 02b já foi executado — pulando.\n')
      return
    }
    // Valor incorreto: pode ter sido criado manualmente ou com valor errado
    console.log(`⚠️   Sequencia 'exemplar' já existe com valor ${existing.valor} (esperado: ${maxValor}).`)
    await prisma.sequencia.update({
      where: { nome: 'exemplar' },
      data: { valor: maxValor },
    })
    console.log(`  ✅ Corrigido para ${maxValor}\n`)
    console.log('✅  Script 02b concluído.\n')
    return
  }

  await prisma.sequencia.create({
    data: { nome: 'exemplar', valor: maxValor },
  })

  console.log(`  ✅ Sequencia 'exemplar' criada com valor ${maxValor}`)
  console.log(`     Próximo código gerado pela aplicação: EX${String(maxValor + 1).padStart(6, '0')}\n`)
  console.log('✅  Script 02b concluído.\n')
}

main()
  .catch(err => { console.error('Erro inesperado:', err); process.exit(1) })
  .finally(() => disconnect())
