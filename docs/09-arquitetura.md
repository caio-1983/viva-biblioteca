# Arquitetura do Sistema

## Stack

- Next.js 16 (App Router)
- TypeScript
- Prisma
- SQLite
- Shadcn/UI
- React Hook Form
- Zod

## Banco

SQLite local.

Localização:

storage/database/biblioteca.db

## Estrutura

src/

app/
components/
lib/
services/
repositories/
types/

## Convenções

Toda regra de negócio deve ficar em services.

Toda consulta ao banco deve ficar em repositories.

As páginas não devem acessar Prisma diretamente.

Fluxo:

Page
→ Service
→ Repository
→ Prisma