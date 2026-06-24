# VIVA Biblioteca

## Objetivo

Sistema de gerenciamento de biblioteca local para controle de acervo, usuários, empréstimos e devoluções.

## Arquitetura

* Next.js 16
* TypeScript
* Prisma
* SQLite
* Shadcn/UI
* React Hook Form
* Zod

## Ambiente

O sistema rodará inicialmente em apenas um computador.

Não haverá:

* Supabase
* PostgreSQL
* Servidor Cloud
* Multiusuário
* Autenticação

## Banco de Dados

SQLite local.

Arquivo:

storage/database/biblioteca.db

## Backup

Os dados serão exportados automaticamente para uma pasta compartilhada (Google Drive, OneDrive ou rede local).

Estrutura:

storage/
├── database/
├── backups/
└── exports/

## Módulos

1. Home
2. Cadastro de Acervo
3. Consulta de Acervo
4. Cadastro de Usuário
5. Consulta de Usuário
6. Empréstimo
7. Devolução
