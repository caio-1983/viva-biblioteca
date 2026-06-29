#!/bin/sh
# Executa migrations e seed em um container temporário fora da stack do Portainer.
#
# Uso:
#   ./scripts/deploy/run-migrate.sh
#
# Variáveis de ambiente (opcionais):
#   NETWORK      — rede Docker da stack (padrão: viva-biblioteca_default)
#   DATABASE_URL — URL do banco      (padrão: aponta para biblioteca-postgres)
#
# O container se conecta à rede existente da stack para alcançar o postgres,
# executa migrate deploy + seed e encerra automaticamente.

set -e

NETWORK="${NETWORK:-viva-biblioteca_default}"
DATABASE_URL="${DATABASE_URL:-postgresql://biblioteca:biblioteca@biblioteca-postgres:5432/biblioteca}"
IMAGE="viva-biblioteca-migrate:local"

echo "==> Construindo stage migrate..."
docker build --target migrate -t "$IMAGE" .

echo "==> Executando migrations e seed na rede '$NETWORK'..."
docker run --rm \
  --network "$NETWORK" \
  -e DATABASE_URL="$DATABASE_URL" \
  "$IMAGE"

echo "==> Concluído."
