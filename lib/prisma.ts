import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

let prismaInstance: PrismaClient | null = null

export function getPrisma(): PrismaClient {
  if (prismaInstance) return prismaInstance

  if (typeof window !== 'undefined') {
    throw new Error('Cannot use Prisma in browser')
  }

  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Missing required environment variable: DATABASE_URL')
  const adapter = new PrismaPg(url)

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
