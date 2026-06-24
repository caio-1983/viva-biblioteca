import { PrismaClient } from '@prisma/client'

let prismaInstance: PrismaClient | null = null

export function getPrisma(): PrismaClient {
  if (prismaInstance) {
    return prismaInstance
  }

  if (typeof window !== 'undefined') {
    throw new Error('Cannot use Prisma in browser')
  }

  prismaInstance = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn'] : [],
  })
  return prismaInstance
}

export const prisma = new Proxy(
  {},
  {
    get: (target, prop) => {
      const client = getPrisma()
      return Reflect.get(client, prop)
    },
  }
) as unknown as PrismaClient
