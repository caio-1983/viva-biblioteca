import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const url = process.env.DATABASE_URL ?? 'postgresql://biblioteca:biblioteca@localhost:5432/biblioteca'
const adapter = new PrismaPg(url)
export const prisma = new PrismaClient({ adapter })

export async function disconnect(): Promise<void> {
  await prisma.$disconnect()
}
