# Variáveis de Ambiente — Viva Biblioteca

Documentação de todas as variáveis utilizadas pelo sistema.

---

## Resumo

| Variável       | Obrigatória | Padrão        | Descrição                        |
|----------------|-------------|---------------|----------------------------------|
| `DATABASE_URL` | Sim         | —             | URL de conexão com o PostgreSQL  |
| `NODE_ENV`     | Sim         | —             | Ambiente de execução             |
| `PORT`         | Sim         | —             | Porta do servidor HTTP           |
| `APP_URL`      | Sim         | —             | URL pública da aplicação         |
| `STORAGE_PATH` | Sim         | —             | Diretório raiz de armazenamento  |
| `LOG_LEVEL`    | Não         | `info`        | Nível de log                     |
| `SQLITE_URL`   | Não         | —             | Banco legado (migração apenas)   |
| `NEXT_TELEMETRY_DISABLED` | Não | `1`      | Desabilita telemetria Next.js    |

---

## Variáveis Obrigatórias

### `DATABASE_URL`

URL de conexão com o banco de dados PostgreSQL.

**Formato:** `postgresql://USUARIO:SENHA@HOST:PORTA/BANCO`

| Cenário          | Valor                                                        |
|------------------|--------------------------------------------------------------|
| Desenvolvimento local | `postgresql://biblioteca:biblioteca@localhost:5432/biblioteca` |
| Docker Compose   | `postgresql://biblioteca:biblioteca@postgres:5432/biblioteca` |
| VPS externo      | `postgresql://usuario:senha@ip-do-servidor:5432/biblioteca`  |

> O hostname `postgres` funciona apenas dentro da rede Docker Compose.

---

### `NODE_ENV`

Define o modo de operação da aplicação.

| Valor         | Uso                                    |
|---------------|----------------------------------------|
| `development` | Desenvolvimento local (logs verbose, hot-reload) |
| `production`  | Servidor de produção (otimizações ativas) |
| `test`        | Execução de testes automatizados       |

---

### `PORT`

Porta em que o servidor HTTP irá escutar.

- **Desenvolvimento:** `3000`
- **Docker:** internamente `3000`, externamente `3002` (configurado no `docker-compose.yml`)

---

### `APP_URL`

URL pública base da aplicação, **sem barra no final**.

Usada por:
- `npm run health` para determinar onde verificar a aplicação
- Links gerados pelo sistema

| Cenário        | Valor                        |
|----------------|------------------------------|
| Local          | `http://localhost:3000`      |
| Docker local   | `http://localhost:3002`      |
| VPS            | `http://IP_DO_SERVIDOR:3002` |

---

### `STORAGE_PATH`

Caminho absoluto (ou relativo ao diretório do projeto) para o diretório raiz de armazenamento em disco.

O `npm run setup` cria automaticamente os seguintes subdiretórios:

```
storage/
├── imports/   → arquivos CSV/Excel enviados pelo usuário
├── reports/   → relatórios exportados
├── backups/   → backups do banco de dados
├── temp/      → arquivos temporários
└── logs/      → arquivos de log da aplicação
```

| Cenário  | Valor            |
|----------|------------------|
| Local    | `./storage`      |
| Docker   | `/app/storage`   |

> O volume `./storage:/app/storage` no `docker-compose.yml` mapeia o diretório do host para o container.

---

## Variáveis Opcionais

### `LOG_LEVEL`

Nível de verbosidade do log da aplicação.

| Valor   | Comportamento                     |
|---------|-----------------------------------|
| `error` | Apenas erros críticos             |
| `warn`  | Erros e avisos                    |
| `info`  | Normal — operações relevantes     |
| `debug` | Verbose — útil em desenvolvimento |

**Padrão:** `info`

---

### `NEXT_TELEMETRY_DISABLED`

Quando definido como `1`, desabilita a coleta de telemetria anônima do Next.js.

**Recomendado em produção:** `1`

---

### `SQLITE_URL`

Caminho para o banco SQLite legado. **Necessário somente** ao executar o script de migração `npm run pg:migrate`.

**Formato:** `file:./caminho/para/arquivo.db`

Não é utilizado em nenhuma outra parte do sistema.

---

## Como Configurar

1. Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```

2. Edite `.env` com os valores do seu ambiente.

3. Execute o setup para validar:
   ```bash
   npm run setup
   ```

O `npm run setup` verifica que todas as variáveis obrigatórias estão definidas antes de prosseguir.

---

## Segurança

- **Nunca commite** o arquivo `.env` em sistemas de controle de versão.
- O `.gitignore` já exclui `.env` por padrão.
- Em produção, prefira injetar variáveis via secrets do sistema operacional ou da plataforma de orquestração (Docker secrets, Kubernetes secrets, etc.) em vez de usar arquivos `.env`.
