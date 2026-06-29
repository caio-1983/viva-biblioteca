/**
 * seed-usuario-seq.ts
 *
 * Inicializa (ou corrige) a linha 'usuario' na tabela Sequencia com o valor
 * máximo atual dos numeroCadastro existentes.
 *
 * Deve ser executado UMA VEZ em ambientes com usuários pré-existentes antes
 * de ativar o novo generateNumeroCadastro baseado em Sequencia.
 *
 * Uso: npm run seed:usuario-seq
 */

import { prisma, disconnect } from './_prisma'

async function main() {
  console.log('=== Seed: Sequencia usuario ===')

  const lastUser = await prisma.usuario.findFirst({
    where: { numeroCadastro: { startsWith: 'US' } },
    orderBy: { numeroCadastro: 'desc' },
    select: { numeroCadastro: true },
  })

  const currentMax = lastUser
    ? (parseInt(lastUser.numeroCadastro.slice(2), 10) || 0)
    : 0

  const seq = await prisma.sequencia.upsert({
    where: { nome: 'usuario' },
    update: { valor: currentMax },
    create: { nome: 'usuario', valor: currentMax },
  })

  console.log(`✅ Sequencia('usuario') = ${seq.valor}`)
  console.log(`   Próximo numeroCadastro: US${String(seq.valor + 1).padStart(6, '0')}`)
}

main()
  .catch((e) => { console.error('❌ Erro:', e.message); process.exit(1) })
  .finally(disconnect)
