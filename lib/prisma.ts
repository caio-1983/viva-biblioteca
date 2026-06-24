import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

let prismaInstance: PrismaClient | null = null

export function getPrisma(): PrismaClient {
  if (prismaInstance) return prismaInstance

  if (typeof window !== 'undefined') {
    throw new Error('Cannot use Prisma in browser')
  }

  const url = process.env.DATABASE_URL ?? 'file:./storage/database/biblioteca.db'
  const adapter = new PrismaBetterSqlite3({ url })

  prismaInstance = new PrismaClient({ adapter })
  return prismaInstance
}

export const prisma = new Proxy(
  {},
  {
    get: (_target, prop) => {
      return Reflect.get(getPrisma(), prop)
    },
  }
) as unknown as PrismaClient
