/**
 * test-emprestimo.ts — VPS-005
 *
 * Valida que empréstimos simultâneos do mesmo exemplar não causam race condition.
 * Dispara N requisições concorrentes; apenas 1 deve ter sucesso.
 */

import { prisma, disconnect } from './_prisma'

const CONCURRENT = 5

async function registrarEmprestimo(
  exemplarId: number,
  usuarioId: number,
  dataPrevistaDevolucao: Date,
) {
  return prisma.$transaction(async (tx) => {
    const config = await tx.configuracao.findFirst()
    if (!config) throw new Error('Configuração não encontrada')

    const ativos = await tx.emprestimo.count({
      where: { usuarioId, status: 'ATIVO' },
    })
    if (ativos >= config.maxEmprestimos) {
      throw new Error(`Limite de empréstimos atingido`)
    }

    const updated = await tx.exemplar.updateMany({
      where: { id: exemplarId, status: 'DISPONIVEL', ativo: true },
      data: { status: 'EMPRESTADO' },
    })
    if (updated.count === 0) {
      const exemplar = await tx.exemplar.findUnique({ where: { id: exemplarId } })
      if (!exemplar || !exemplar.ativo) throw new Error('Exemplar não encontrado')
      throw new Error('Exemplar não está disponível')
    }

    return tx.emprestimo.create({
      data: {
        usuarioId,
        exemplarId,
        dataEmprestimo: new Date(),
        dataPrevistaDevolucao,
        status: 'ATIVO',
      },
    })
  })
}

async function main() {
  console.log('\n=== Teste de Concorrência: Empréstimo ===')

  const exemplar = await prisma.exemplar.findFirst({
    where: { status: 'DISPONIVEL', ativo: true },
    select: { id: true, codigoExemplar: true },
  })
  if (!exemplar) {
    console.log('⚠️  Nenhum exemplar DISPONIVEL — pulando teste')
    return
  }

  const users = await prisma.usuario.findMany({
    where: { ativo: true },
    take: CONCURRENT,
    select: { id: true },
  })
  if (users.length < 2) {
    console.log('⚠️  Precisamos de pelo menos 2 usuários ativos — pulando teste')
    return
  }

  const dataPrevista = new Date()
  dataPrevista.setDate(dataPrevista.getDate() + 14)

  console.log(`Exemplar: ${exemplar.codigoExemplar} (id=${exemplar.id})`)
  console.log(`Disparando ${CONCURRENT} empréstimos simultâneos...`)

  const promises = Array.from({ length: CONCURRENT }, (_, i) =>
    registrarEmprestimo(exemplar.id, users[i % users.length].id, dataPrevista),
  )

  const results = await Promise.allSettled(promises)
  const sucessos = results.filter((r) => r.status === 'fulfilled')
  const falhas   = results.filter((r) => r.status === 'rejected')

  const emprestimosAtivos = await prisma.emprestimo.count({
    where: { exemplarId: exemplar.id, status: 'ATIVO' },
  })
  const statusFinal = await prisma.exemplar.findUnique({
    where: { id: exemplar.id },
    select: { status: true },
  })

  console.log(`Sucessos  : ${sucessos.length} (esperado: 1)`)
  console.log(`Falhas    : ${falhas.length}   (esperado: ${CONCURRENT - 1})`)
  console.log(`Empréstimos ativos no exemplar: ${emprestimosAtivos} (esperado: 1)`)
  console.log(`Status do exemplar: ${statusFinal?.status} (esperado: EMPRESTADO)`)

  const ok =
    sucessos.length === 1 &&
    emprestimosAtivos === 1 &&
    statusFinal?.status === 'EMPRESTADO'

  // Rollback dos dados de teste
  if (sucessos.length > 0) {
    const emp = (sucessos[0] as PromiseFulfilledResult<{ id: number }>).value
    await prisma.emprestimo.delete({ where: { id: emp.id } })
    await prisma.exemplar.update({ where: { id: exemplar.id }, data: { status: 'DISPONIVEL' } })
  }

  if (ok) {
    console.log('✅ PASSOU — sem race condition em empréstimo simultâneo')
    return true
  } else {
    console.log('❌ FALHOU — race condition detectada!')
    return false
  }
}

export { main as testEmprestimo }

if (process.argv[1]?.includes('test-emprestimo')) {
  main()
    .then((ok) => process.exit(ok ? 0 : 1))
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(disconnect)
}
