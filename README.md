# VIVA Biblioteca

Sistema de gestão de biblioteca escolar — Next.js + PostgreSQL + Docker.

## Deploy (VPS)

### Primeiro deploy

```bash
git clone <repo-url> && cd viva-biblioteca

# Crie o .env a partir do template e preencha os valores reais
cp .env.example .env
# Edite .env: POSTGRES_PASSWORD, DATABASE_URL, APP_URL, AUTH_URL, AUTH_SECRET

# Suba os containers (postgres + migrator + app)
docker compose up -d --build
```

### Atualização

```bash
git pull
docker compose up -d --build
```

O deploy é idempotente: migrations e seeds são reaplicados com segurança a cada build.
**Nenhum arquivo precisa ser editado na VPS após um `git pull`.**

### Verificar saúde

```bash
curl https://<seu-dominio>/api/health
# Esperado: {"status":"ok",...}
```

### Variáveis de ambiente

Todas as variáveis obrigatórias estão documentadas em [`.env.example`](.env.example).

| Variável | Descrição |
| --- | --- |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Credenciais do container PostgreSQL |
| `DATABASE_URL` | String de conexão — deve usar os mesmos valores acima |
| `APP_URL` | URL pública da aplicação (ex: `https://biblioteca.exemplo.com`) |
| `AUTH_URL` | Idêntica a `APP_URL` — usada pelo Auth.js para validar o host |
| `AUTH_SECRET` | Segredo JWT — gere com `npx auth secret` |
| `AUTH_TRUST_HOST` | `true` quando a app roda atrás de proxy/Docker |
| `STORAGE_PATH` | Caminho do volume de storage no container |

## Desenvolvimento local

```bash
npm install
cp .env.example .env
# Ajuste DATABASE_URL para localhost:5432

docker compose up postgres -d   # só o banco

npm run dev
```

## Documentação técnica

Consulte [`docs/`](docs/) para arquitetura, regras de negócio e guias de operação.
