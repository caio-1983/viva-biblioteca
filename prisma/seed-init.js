'use strict'

/**
 * Seed de inicialização — executado no entrypoint após prisma migrate deploy.
 *
 * Garante que os registros obrigatórios para o funcionamento da aplicação
 * existam no banco. Totalmente idempotente: usa INSERT ... ON CONFLICT / WHERE NOT EXISTS.
 *
 * Usa pg diretamente para evitar dependência de tsx ou compilação TypeScript
 * no container de produção.
 */

const { Client } = require('pg')

const url =
  process.env.DATABASE_URL ??
  'postgresql://biblioteca:biblioteca@localhost:5432/biblioteca'

const client = new Client({ connectionString: url })

async function main() {
  await client.connect()

  // Configuração padrão da biblioteca (idempotente)
  await client.query(`
    INSERT INTO "Configuracao" ("prazoEmprestimoDias", "maxEmprestimos", "updatedAt")
    SELECT 14, 3, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM "Configuracao")
  `)

  // Sequência de códigos de exemplar (idempotente)
  await client.query(`
    INSERT INTO "Sequencia" (nome, valor)
    VALUES ('exemplar', 0)
    ON CONFLICT (nome) DO NOTHING
  `)

  console.log('→ Registros obrigatórios verificados/criados.')
  await client.end()
}

main().catch((err) => {
  console.error('Erro no seed de inicialização:', err.message)
  process.exit(1)
})
