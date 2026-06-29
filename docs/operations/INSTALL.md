# Instalação — Viva Biblioteca

Guia de instalação em máquina limpa.

---

## Requisitos

| Componente | Versão mínima |
|------------|---------------|
| Node.js    | 20 LTS        |
| npm        | 10+           |
| Docker     | 24+           |
| Docker Compose | v2 (`docker compose`) |
| PostgreSQL | 16 (via Docker) |

> O PostgreSQL é provisionado pelo Docker Compose. Não é necessário instalá-lo separadamente.

---

## Instalação

### 1. Clonar o repositório

```bash
git clone <url-do-repositório>
cd viva-biblioteca
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` e ajuste os valores para o seu ambiente.
Veja [ENVIRONMENT.md](ENVIRONMENT.md) para documentação completa de cada variável.

### 4. Iniciar o banco de dados

```bash
docker compose up -d postgres
```

Aguarde o container ficar saudável:

```bash
docker compose ps
```

O status do serviço `postgres` deve ser `healthy`.

### 5. Executar o setup

```bash
npm run setup
```

O comando irá:
- Validar variáveis de ambiente
- Testar a conexão com o PostgreSQL
- Gerar o cliente Prisma
- Executar as migrations
- Popular o banco com dados iniciais
- Criar os diretórios de storage
- Validar a instalação

### 6. Iniciar a aplicação

**Desenvolvimento:**
```bash
npm run dev
```

**Produção:**
```bash
npm run build
npm run start
```

### 7. Verificar a instalação

```bash
npm run health
```

A saída deve exibir `"status": "ok"` com informações sobre a conexão com o banco.

Também é possível verificar via browser em: `http://localhost:3000/api/health`

---

## Primeiro Acesso

Após a instalação, acesse `http://localhost:3000` (ou a `APP_URL` configurada).

O seed inicial cria as configurações padrão do sistema (prazo de empréstimo, limite de exemplares por leitor). Não há usuário administrador pré-configurado — o acesso ao sistema não requer autenticação nesta versão.

---

## Atualização

Para atualizar uma instalação existente:

```bash
git pull
npm install
npm run setup
npm run build
npm run start
```

O `npm run setup` aplica automaticamente as migrations pendentes.

---

## Resolução de Problemas

**Erro: variáveis de ambiente ausentes**
- Verifique se o arquivo `.env` existe na raiz do projeto.
- Compare com `.env.example` para identificar variáveis faltando.

**Erro: falha na conexão com PostgreSQL**
- Verifique se o container está em execução: `docker compose ps`
- Verifique se `DATABASE_URL` aponta para o host e porta corretos.
- Inspecione os logs: `docker compose logs postgres`

**Erro: prisma generate falhou**
- Execute `npm install` novamente para garantir que o pacote `prisma` está instalado.

**Porta 3000 em uso**
- Ajuste `PORT` no `.env` e reinicie.
