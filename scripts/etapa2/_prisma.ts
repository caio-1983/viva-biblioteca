/**
 * Cliente Prisma compartilhado para os scripts de migração da Etapa 2.
 *
 * Usa a mesma configuração de lib/prisma.ts (adapter better-sqlite3),
 * sem o Proxy de singleton (desnecessário em scripts de execução única).
 *
 * Sempre execute os scripts a partir da raiz do projeto para que os
 * caminhos relativos à DATABASE_URL resolvam corretamente.
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const url = process.env.DATABASE_URL ?? 'file:./storage/database/biblioteca.db'
const adapter = new PrismaBetterSqlite3({ url })
export const prisma = new PrismaClient({ adapter })

export async function disconnect(): Promise<void> {
  await prisma.$disconnect()
}
