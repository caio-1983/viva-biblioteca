'use strict'

const { execSync } = require('child_process')
const path = require('path')

const root = path.resolve(__dirname, '../..')

function run(label, cmd) {
  console.log(`\n→ ${label}`)
  execSync(cmd, { stdio: 'inherit', cwd: root })
}

run('Aplicando migrations do banco...', 'npx prisma migrate deploy')
run('Inicializando registros obrigatórios (seed)...', 'node prisma/seed-init.js')

console.log('\nDeploy concluído.')
