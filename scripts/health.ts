#!/usr/bin/env tsx
/**
 * npm run health
 *
 * Consulta o endpoint /api/health e exibe o resultado formatado.
 * Retorna exit code 0 em sucesso, 1 em falha.
 */

import 'dotenv/config'

void (async () => {
  const port   = process.env.PORT    ?? '3000'
  const appUrl = (process.env.APP_URL ?? `http://localhost:${port}`).replace(/\/$/, '')
  const url    = `${appUrl}/api/health`

  console.log(`\nConsultando ${url} ...\n`)

  try {
    const res  = await fetch(url)
    const data = await res.json() as Record<string, unknown>

    console.log(JSON.stringify(data, null, 2))

    const status = String(data.status ?? '')
    if (res.ok && status === 'ok') {
      console.log('\n\x1b[32m✔  Aplicação operacional\x1b[0m\n')
      process.exit(0)
    } else {
      console.error('\n\x1b[33m⚠  Aplicação com status degradado\x1b[0m\n')
      process.exit(1)
    }
  } catch (e) {
    console.error(`\x1b[31m✘  Falha ao conectar em ${url}: ${(e as Error).message}\x1b[0m\n`)
    process.exit(1)
  }
})()
