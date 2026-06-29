#!/usr/bin/env tsx
/**
 * npm run setup
 *
 * Prepara o ambiente para execução da aplicação:
 *   1. Valida variáveis de ambiente obrigatórias
 *   2. Testa conexão com PostgreSQL
 *   3. Executa prisma generate
 *   4. Executa prisma migrate deploy
 *   5. Executa seed do banco de dados
 *   6. Cria diretórios de storage
 *   7. Valida a instalação
 *   8. Exibe resumo
 */

import 'dotenv/config'
import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { Client } from 'pg'

// ── Formatação ──────────────────────────────────────────────────────────────

const C = {
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  bold:   '\x1b[1m',
  reset:  '\x1b[0m',
}

function ok(msg: string)   { console.log(`  ${C.green}✔${C.reset}  ${msg}`) }
function fail(msg: string)  { console.error(`  ${C.red}✘${C.reset}  ${msg}`) }
function warn(msg: string)  { console.warn(`  ${C.yellow}⚠${C.reset}  ${msg}`) }
function step(msg: string)  { console.log(`\n${C.cyan}${C.bold}▶  ${msg}${C.reset}`) }
function info(msg: string)  { console.log(`     ${msg}`) }

function run(cmd: string, label: string): boolean {
  try {
    execSync(cmd, { stdio: 'inherit' })
    ok(label)
    return true
  } catch {
    fail(`${label} — falhou`)
    return false
  }
}

// ── Passo 1: Variáveis de ambiente ──────────────────────────────────────────

step('Validando variáveis de ambiente')

const REQUIRED: string[] = ['DATABASE_URL', 'NODE_ENV', 'PORT', 'APP_URL', 'STORAGE_PATH']
let envErrors = 0

for (const v of REQUIRED) {
  if (process.env[v]) {
    ok(v)
  } else {
    fail(`${v}  ← não definida`)
    envErrors++
  }
}

if (envErrors > 0) {
  console.error(
    `\n${C.red}${envErrors} variável(is) obrigatória(s) ausente(s).` +
    `\nCopie .env.example → .env e preencha os valores.${C.reset}\n`
  )
  process.exit(1)
}

void (async () => {
  // ── Passo 2: Conexão com PostgreSQL ─────────────────────────────────────────

  step('Testando conexão com PostgreSQL')

  const pgClient = new Client({ connectionString: process.env.DATABASE_URL })
  try {
    await pgClient.connect()
    const res = await pgClient.query<{ version: string }>('SELECT version()')
    const shortVer = res.rows[0]?.version?.split(' ').slice(0, 2).join(' ') ?? 'desconhecida'
    ok(`Conectado — ${shortVer}`)
    await pgClient.end()
  } catch (e) {
    fail(`Falha na conexão: ${(e as Error).message}`)
    console.error(
      `\n${C.red}Verifique se o PostgreSQL está em execução` +
      `\ne se DATABASE_URL está correto.${C.reset}\n`
    )
    process.exit(1)
  }

  // ── Passo 3: prisma generate ─────────────────────────────────────────────────

  step('Executando prisma generate')
  if (!run('npx prisma generate', 'prisma generate')) process.exit(1)

  // ── Passo 4: prisma migrate deploy ───────────────────────────────────────────

  step('Executando prisma migrate deploy')
  if (!run('npx prisma migrate deploy', 'prisma migrate deploy')) process.exit(1)

  // ── Passo 5: Seed ────────────────────────────────────────────────────────────

  step('Populando banco de dados (seed)')
  const seedOk = run('tsx prisma/seed.ts', 'prisma seed')
  if (!seedOk) {
    warn('Seed falhou — dados iniciais podem já existir (continuando)')
  }

  // ── Passo 6: Diretórios de storage ───────────────────────────────────────────

  step('Criando estrutura de storage')

  const STORAGE_PATH = process.env.STORAGE_PATH!
  const STORAGE_DIRS = ['imports', 'reports', 'backups', 'temp', 'logs']

  for (const dir of STORAGE_DIRS) {
    const full = join(STORAGE_PATH, dir)
    if (!existsSync(full)) {
      mkdirSync(full, { recursive: true })
      ok(`Criado  → ${full}`)
    } else {
      ok(`OK      → ${full}`)
    }
  }

  // ── Passo 7: Validação ────────────────────────────────────────────────────────

  step('Validando instalação')

  let validationErrors = 0

  const prismaClientPath = join(process.cwd(), 'node_modules', '.prisma', 'client')
  if (existsSync(prismaClientPath)) {
    ok('@prisma/client gerado')
  } else {
    fail('@prisma/client não encontrado em node_modules/.prisma/client')
    validationErrors++
  }

  for (const dir of STORAGE_DIRS) {
    const full = join(STORAGE_PATH, dir)
    if (existsSync(full)) {
      ok(`storage/${dir}/`)
    } else {
      fail(`storage/${dir}/ — diretório ausente`)
      validationErrors++
    }
  }

  if (validationErrors > 0) {
    console.error(`\n${C.red}Validação falhou com ${validationErrors} erro(s).${C.reset}\n`)
    process.exit(1)
  }

  // ── Resumo ────────────────────────────────────────────────────────────────────

  console.log(`
${C.bold}${C.green}╔══════════════════════════════════════════════╗
║   Instalação concluída com sucesso!          ║
╚══════════════════════════════════════════════╝${C.reset}

${C.bold}Ambiente:${C.reset}
`)
  info(`NODE_ENV     ${process.env.NODE_ENV}`)
  info(`APP_URL      ${process.env.APP_URL}`)
  info(`PORT         ${process.env.PORT}`)
  info(`STORAGE_PATH ${STORAGE_PATH}`)

  console.log(`
${C.bold}Próximos passos:${C.reset}
`)
  info(`npm run build    — compilar para produção`)
  info(`npm run start    — iniciar servidor de produção`)
  info(`npm run dev      — iniciar em modo desenvolvimento`)
  info(`npm run health   — verificar saúde da aplicação`)
  console.log()
})()
