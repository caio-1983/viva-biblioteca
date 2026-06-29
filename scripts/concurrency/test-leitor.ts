/**
 * test-leitor.ts — VPS-005
 *
 * Valida que criações simultâneas de leitores geram numeroCadastro únicos.
 * Dispara N criações concorrentes; todos devem ter sucesso com números distintos.
 */

import { prisma, disconnect } from './_prisma'

const CONCURRENT = 8

async function criarLeitor(nome: string) {
  return prisma.$transaction(async (tx) => {
    const seq = await tx.sequencia.upsert({
      where: { nome: 'usuario' },
      update: { valor: { increment: 1 } },
      create: { nome: 'usuario', valor: 1 },
    })
    const numeroCadastro = `US${String(seq.valor).padStart(6, '0')}`
    return tx.usuario.create({
      data: {
        numeroCadastro,
        nomeCompleto: nome,
        membro: false,
        ativo: false, // ativo=false para não poluir dados reais
      },
    })
  })
}

async function main() {
  console.log(`\n=== Teste de Concorrência: Criação de Leitores (${CONCURRENT} simultâneos) ===`)

  const promises = Array.from({ length: CONCURRENT }, (_, i) =>
    criarLeitor(`Leitor Teste Concorrência ${i + 1}`),
  )

  const results = await Promise.allSettled(promises)
  const sucessos = results.filter((r) => r.status === 'fulfilled')
  const falhas   = results.filter((r) => r.status === 'rejected')

  console.log(`Sucessos: ${sucessos.length} (esperado: ${CONCURRENT})`)
  if (falhas.length > 0) {
    console.log(`Falhas  : ${falhas.length}`)
    falhas.forEach((f) => {
      if (f.status === 'rejected') console.log(`  - ${f.reason?.message}`)
    })
  }

  const numeros = sucessos
    .map((r) => (r as PromiseFulfilledResult<{ numeroCadastro: string; id: number }>).value)
    .map((u) => u.numeroCadastro)

  const unicos = new Set(numeros).size
  console.log(`NumeroCadastro gerados: ${numeros.join(', ')}`)
  console.log(`Únicos: ${unicos} de ${sucessos.length} (esperado: ${CONCURRENT})`)

  const ok = sucessos.length === CONCURRENT && unicos === CONCURRENT

  // Rollback: remove os usuários de teste
  const idsTestados = sucessos
    .map((r) => (r as PromiseFulfilledResult<{ id: number }>).value.id)
  if (idsTestados.length > 0) {
    await prisma.usuario.deleteMany({ where: { id: { in: idsTestados } } })
    console.log(`(${idsTestados.length} usuários de teste removidos)`)
  }

  if (ok) {
    console.log('✅ PASSOU — todos os leitores criados com numeroCadastro únicos')
    return true
  } else {
    console.log('❌ FALHOU — numeroCadastro duplicado ou falha de criação!')
    return false
  }
}

export { main as testLeitor }

if (process.argv[1]?.includes('test-leitor')) {
  main()
    .then((ok) => process.exit(ok ? 0 : 1))
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(disconnect)
}
