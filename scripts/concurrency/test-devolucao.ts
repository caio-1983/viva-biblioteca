/**
 * test-devolucao.ts — VPS-005
 *
 * Valida que devoluções simultâneas do mesmo empréstimo não causam inconsistência.
 * Dispara N requisições concorrentes; apenas 1 deve ter sucesso.
 */

import { prisma, disconnect } from './_prisma'

const CONCURRENT = 5

async function registrarDevolucao(emprestimoId: number, exemplarId: number) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.emprestimo.updateMany({
      where: { id: emprestimoId, status: 'ATIVO' },
      data: { dataDevolucao: new Date(), status: 'DEVOLVIDO' },
    })
    if (updated.count === 0) {
      const emp = await tx.emprestimo.findUnique({ where: { id: emprestimoId } })
      if (!emp) throw new Error('Empréstimo não encontrado ou já devolvido')
      throw new Error('Empréstimo não está ativo')
    }
    await tx.exemplar.update({ where: { id: exemplarId }, data: { status: 'DISPONIVEL' } })
    return { success: true }
  })
}

async function main() {
  console.log('\n=== Teste de Concorrência: Devolução ===')

  // Cria dados de teste isolados
  const exemplar = await prisma.exemplar.findFirst({
    where: { status: 'DISPONIVEL', ativo: true },
    select: { id: true, codigoExemplar: true },
  })
  if (!exemplar) {
    console.log('⚠️  Nenhum exemplar DISPONIVEL — pulando teste')
    return
  }

  const usuario = await prisma.usuario.findFirst({
    where: { ativo: true },
    select: { id: true },
  })
  if (!usuario) {
    console.log('⚠️  Nenhum usuário ativo — pulando teste')
    return
  }

  // Cria um empréstimo de teste
  await prisma.exemplar.update({ where: { id: exemplar.id }, data: { status: 'EMPRESTADO' } })
  const dataPrevista = new Date()
  dataPrevista.setDate(dataPrevista.getDate() + 14)
  const emprestimo = await prisma.emprestimo.create({
    data: {
      usuarioId: usuario.id,
      exemplarId: exemplar.id,
      dataEmprestimo: new Date(),
      dataPrevistaDevolucao: dataPrevista,
      status: 'ATIVO',
    },
  })

  console.log(`Empréstimo de teste criado: id=${emprestimo.id}`)
  console.log(`Disparando ${CONCURRENT} devoluções simultâneas...`)

  const promises = Array.from({ length: CONCURRENT }, () =>
    registrarDevolucao(emprestimo.id, exemplar.id),
  )

  const results = await Promise.allSettled(promises)
  const sucessos = results.filter((r) => r.status === 'fulfilled')
  const falhas   = results.filter((r) => r.status === 'rejected')

  const statusEmprestimo = await prisma.emprestimo.findUnique({
    where: { id: emprestimo.id },
    select: { status: true },
  })
  const statusExemplar = await prisma.exemplar.findUnique({
    where: { id: exemplar.id },
    select: { status: true },
  })

  console.log(`Sucessos  : ${sucessos.length} (esperado: 1)`)
  console.log(`Falhas    : ${falhas.length}   (esperado: ${CONCURRENT - 1})`)
  console.log(`Status do empréstimo: ${statusEmprestimo?.status} (esperado: DEVOLVIDO)`)
  console.log(`Status do exemplar  : ${statusExemplar?.status} (esperado: DISPONIVEL)`)

  const ok =
    sucessos.length === 1 &&
    statusEmprestimo?.status === 'DEVOLVIDO' &&
    statusExemplar?.status === 'DISPONIVEL'

  // Rollback dos dados de teste
  await prisma.emprestimo.delete({ where: { id: emprestimo.id } })
  if (statusExemplar?.status !== 'DISPONIVEL') {
    await prisma.exemplar.update({ where: { id: exemplar.id }, data: { status: 'DISPONIVEL' } })
  }

  if (ok) {
    console.log('✅ PASSOU — sem race condition em devolução simultânea')
    return true
  } else {
    console.log('❌ FALHOU — race condition detectada!')
    return false
  }
}

export { main as testDevolucao }

if (process.argv[1]?.includes('test-devolucao')) {
  main()
    .then((ok) => process.exit(ok ? 0 : 1))
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(disconnect)
}
