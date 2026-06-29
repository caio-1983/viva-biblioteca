# Deploy em VPS — Viva Biblioteca

Guia de implantação em servidor VPS usando Docker Compose.

---

## Requisitos do Servidor

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU     | 1 vCPU | 2 vCPU      |
| RAM     | 1 GB   | 2 GB        |
| Disco   | 10 GB  | 20 GB       |
| OS      | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Docker  | 24+    | 24+         |

---

## Preparação do Servidor

### 1. Instalar Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Reconecte a sessão SSH após este comando
```

### 2. Verificar instalação

```bash
docker --version
docker compose version
```

---

## Deploy

### 1. Clonar o repositório

```bash
cd /opt
sudo git clone <url-do-repositório> viva-biblioteca
sudo chown -R $USER:$USER /opt/viva-biblioteca
cd /opt/viva-biblioteca
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
nano .env
```

Ajuste os valores para produção. **Atenção especial:**

- `NODE_ENV=production`
- `APP_URL` — URL pública do servidor (ex: `http://SEU_IP:3002`)
- `DATABASE_URL` — use `postgres` como hostname (nome do serviço Docker)
- `STORAGE_PATH=/app/storage` — caminho dentro do container

Exemplo de `.env` para VPS:

```env
DATABASE_URL="postgresql://biblioteca:SENHA_FORTE@postgres:5432/biblioteca"
NODE_ENV="production"
PORT="3000"
APP_URL="http://SEU_IP:3002"
STORAGE_PATH="/app/storage"
```

> Troque `SENHA_FORTE` por uma senha segura e atualize também no `docker-compose.yml`.

### 3. Ajustar senha do PostgreSQL (recomendado)

Edite `docker-compose.yml` e altere:

```yaml
environment:
  POSTGRES_PASSWORD: SENHA_FORTE   # ← altere aqui
```

E atualize `DATABASE_URL` no `.env` com a mesma senha.

### 4. Construir e iniciar

```bash
docker compose up -d --build
```

Aguarde os containers subirem:

```bash
docker compose ps
```

Ambos os serviços (`postgres` e `biblioteca`) devem estar com status `healthy`.

### 5. Executar o setup inicial

Execute o setup **dentro do container** na primeira implantação:

```bash
docker compose exec biblioteca npm run setup
```

### 6. Verificar

```bash
curl http://localhost:3002/api/health
```

A resposta deve ser `"status": "ok"`.

---

## Atualização

```bash
cd /opt/viva-biblioteca
git pull
docker compose down
docker compose up -d --build
docker compose exec biblioteca npm run setup
```

O `npm run setup` aplica migrations pendentes automaticamente.

---

## Logs

```bash
# Logs da aplicação
docker compose logs -f biblioteca

# Logs do banco
docker compose logs -f postgres

# Últimas 100 linhas
docker compose logs --tail=100 biblioteca
```

---

## Backup do Banco de Dados

### Backup manual

```bash
docker compose exec postgres pg_dump \
  -U biblioteca -d biblioteca \
  > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup

```bash
docker compose exec -T postgres psql \
  -U biblioteca -d biblioteca \
  < backup_arquivo.sql
```

---

## Exposição via Nginx (opcional)

Para servir na porta 80/443 com Nginx como proxy reverso:

```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Reinício Automático

Os containers estão configurados com `restart: unless-stopped`. Eles reiniciam automaticamente após uma queda ou reinicialização do servidor.

Para verificar o status após reinicialização:

```bash
docker compose ps
curl http://localhost:3002/api/health
```
