import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Prisma 7 não carrega .env automaticamente. A URL de conexão usada pelos
// comandos de Migrate precisa ser declarada aqui.
const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://biblioteca:biblioteca@localhost:5432/biblioteca'

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
})
