/**
 * Cliente Prisma compartilhado para os scripts de migração da Etapa 2.
 *
 * VPS-004: migrado de BetterSQLite3 para PostgreSQL com adapter PG.
 * Os scripts de Etapa 2 (migração Acervo → Obra+Exemplar) já foram executados
 * no SQLite; este cliente aponta agora para PostgreSQL para eventuais verificações.
 *
 * Sempre execute os scripts a partir da raiz do projeto para que as
 * variáveis de ambiente em .env resolvam corretamente.
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const url = process.env.DATABASE_URL ?? 'postgresql://biblioteca:biblioteca@localhost:5432/biblioteca'
const adapter = new PrismaPg(url)
export const prisma = new PrismaClient({ adapter })

export async function disconnect(): Promise<void> {
  await prisma.$disconnect()
}
