#!/bin/sh
set -e

echo "→ Aplicando migrations do banco..."
node_modules/.bin/prisma migrate deploy

echo "→ Inicializando registros obrigatórios (seed)..."
node prisma/seed-init.js

echo "→ Iniciando aplicação..."
exec node server.js
