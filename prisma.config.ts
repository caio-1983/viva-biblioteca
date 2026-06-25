import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Prisma 7 não carrega .env automaticamente e não aceita mais `url` no bloco
// datasource do schema.prisma. A URL de conexão usada pelos comandos de Migrate
// (migrate dev/status/diff, db push) precisa ser declarada aqui.
//
// Em runtime, a aplicação continua usando o adapter better-sqlite3 em lib/prisma.ts
// com a mesma DATABASE_URL — ambos apontam para o mesmo arquivo físico.
const databaseUrl =
  process.env.DATABASE_URL ?? 'file:./storage/database/biblioteca.db'

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
})
