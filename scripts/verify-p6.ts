import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./storage/database/biblioteca.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  const cols = await prisma.$queryRaw<Array<{ name: string }>>`SELECT name FROM pragma_table_info('Emprestimo')`
  console.log('Colunas:', cols.map(c => c.name).join(', '))
  const acervoColExists = cols.some(c => c.name === 'acervoId')
  console.log(acervoColExists ? '❌ acervoId ainda existe!' : '✅ acervoId removido')
  const exemplarColNotNull = cols.some(c => c.name === 'exemplarId')
  console.log(exemplarColNotNull ? '✅ exemplarId existe' : '❌ exemplarId não existe')
  const rows = await prisma.emprestimo.findMany({ select: { id: true, exemplarId: true } })
  console.log('Empréstimos:', JSON.stringify(rows))
  console.log(rows.every(e => e.exemplarId !== null) ? '✅ 100% preenchidos' : '❌ há NULL')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
