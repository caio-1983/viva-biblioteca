# ADR-006 — Arquitetura da Aplicação

**Status:** Atualizado — VPS-002
**Data original:** 24/06/2026
**Atualizado em:** 28/06/2026
**Projeto:** VIVA Biblioteca

---

# Contexto

A arquitetura original previa Electron como principal forma de distribuição.
Em VPS-002 (28/06/2026), a dependência do Electron foi removida.
O VIVA Biblioteca passa a ser uma aplicação Next.js pura.

---

# Objetivo

Definir a arquitetura técnica do VIVA Biblioteca como aplicação web executada via Next.js,
preservando total independência entre domínio e interface.

---

# Visão Arquitetural

```text
                     Interface

                  Navegador Web

                       │

────────────────────────────────────────

              Camada de Aplicação

               Services
               Use Cases

────────────────────────────────────────

                 Domínio

Obra
Exemplar
Empréstimo
Leitor
Configurações
Inventário

────────────────────────────────────────

            Camada de Persistência

Repositories

────────────────────────────────────────

             Prisma ORM

────────────────────────────────────────

SQLite / PostgreSQL
```

---

# Princípio Fundamental

A regra de negócio nunca deverá depender da interface.

A mesma lógica deverá funcionar em:

* Navegador;
* API externa;
* CLI;
* Testes automatizados.

---

# Arquitetura Atual

```text
┌────────────────────────────┐
│         Next.js            │
├────────────────────────────┤
│       React + Tailwind     │
├────────────────────────────┤
│     Application Layer      │
├────────────────────────────┤
│         Prisma ORM         │
├────────────────────────────┤
│         SQLite             │
└────────────────────────────┘
```

Toda a aplicação executa localmente via `npm run start` ou em servidor dedicado.

---

# Banco de Dados

A persistência padrão é SQLite.

Localização padrão:

```text
storage/database/biblioteca.db
```

Benefícios:

* instalação simples;
* zero configuração;
* excelente desempenho;
* backup fácil.

---

# Camadas

## Interface

Responsável apenas por:

* páginas;
* formulários;
* componentes;
* tabelas;
* diálogos.

Não contém regra de negócio.

---

## Application

Responsável por:

* casos de uso;
* orquestração;
* validações;
* permissões.

---

## Domínio

Representa as regras do negócio.

Entidades:

* Obra
* Exemplar
* Empréstimo
* Leitor
* Configuração
* Inventário

Toda decisão de negócio permanece nesta camada.

---

## Persistência

Realizada através de Repositories.

```text
ObraRepository
ExemplarRepository
EmprestimoRepository
```

Nenhuma página acessa diretamente o banco.

---

# ORM

O Prisma é a única camada responsável pelo acesso ao banco.

Toda persistência passa pelos Repositories.

---

# Banco Independente

A aplicação não depende de SQLite.

O Repository permite:

```text
SQLite → PostgreSQL → SQL Server (futuro)
```

Sem alterar a regra de negócio.

---

# Estrutura

```text
src/
app/
components/
lib/
domain/
application/
repositories/
prisma/
```

---

# Organização por Módulos

```text
features/
  catalogo/
  circulacao/
  leitores/
  inventario/
  relatorios/
  configuracoes/
```

---

# Configurações

Todas as regras parametrizáveis ficam centralizadas.

Exemplos:

* prazo de empréstimo;
* quantidade máxima;
* multa;
* formato do código EX;
* padrão do tombo.

---

# Backup

O banco permanece separado da aplicação.

Estrutura:

```text
storage/
  database/
    biblioteca.db
    backups/
```

---

# Impressão

A aplicação utiliza recursos nativos do navegador (window.print, PDF).

---

# Evolução para Cliente-Servidor

Para múltiplos computadores, substituir SQLite por PostgreSQL:

```text
Navegador → Next.js → API → PostgreSQL
```

Sem alterações na camada de domínio.

---

# Evolução para Cloud

```text
Navegador → Next.js → Application → Repositories → PostgreSQL
```

A lógica permanece exatamente a mesma.

---

# Regras Arquiteturais

## RA-001

Nenhuma regra de negócio em componentes React.

## RA-002

Nenhuma página acessa diretamente o banco.

## RA-003

Toda persistência passa pelos Repositories.

## RA-004

O Domínio nunca depende da Interface.

## RA-005

A Interface pode ser substituída sem alterar o Domínio.

## RA-006

SQLite é a persistência padrão. A arquitetura permite troca futura do banco.

## RA-007

Toda funcionalidade é implementada pensando primeiro no Domínio.

---

# Histórico de Decisões

| Data       | Decisão                                              |
|------------|------------------------------------------------------|
| 24/06/2026 | Electron + Next.js como stack desktop principal      |
| 28/06/2026 | VPS-002: Electron removido; Next.js puro como stack  |

---

# Relação com outros ADRs

* **ADR-001** — Catálogo e Não Duplicação de Obras
* **ADR-002** — Modelagem do Domínio: Obra e Exemplar
* **ADR-003** — Circulação e Empréstimos
* **ADR-004** — Estratégia de Importação do Acervo
* **ADR-005** — Codificação de Exemplares

Este documento estabelece a arquitetura técnica do VIVA Biblioteca como aplicação **Next.js pura**,
com **Domínio independente da tecnologia**, preservando a possibilidade de evolução para ambientes
em rede e em nuvem sem reescrita da lógica de negócio.
