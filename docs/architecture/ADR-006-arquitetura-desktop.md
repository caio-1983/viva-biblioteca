# ADR-006 — Arquitetura da Aplicação e Estratégia Desktop

**Status:** Aprovado
**Data:** 24/06/2026
**Projeto:** VIVA Biblioteca

---

# Objetivo

Definir oficialmente a arquitetura técnica do VIVA Biblioteca, estabelecendo uma base que permita executar a aplicação como:

* Sistema Desktop (.exe) — principal forma de distribuição;
* Sistema Web (futuro);
* Ambiente Cliente-Servidor (futuro);
* Ambiente Cloud (futuro).

Esta decisão busca garantir que o domínio da aplicação permaneça independente da tecnologia utilizada para distribuição.

---

# Visão Arquitetural

O VIVA Biblioteca será desenvolvido seguindo uma arquitetura em camadas.

```text
                     Interface

          Electron / Desktop
                 ou
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

Ou seja:

A mesma lógica deverá funcionar em:

* Electron;
* Navegador;
* API externa;
* CLI;
* Testes automatizados.

---

# Desktop como Plataforma Principal

O VIVA Biblioteca nasce com foco em uso local.

A distribuição principal será:

```text
VIVABibliotecaSetup.exe
```

O usuário não precisará instalar:

* Node.js;
* Banco de dados;
* Servidor Web.

Tudo será instalado automaticamente.

---

# Arquitetura Desktop

```text
┌────────────────────────────┐
│        Electron            │
├────────────────────────────┤
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

Toda a aplicação executará localmente.

---

# Banco de Dados

A persistência padrão será SQLite.

Exemplo:

```text
AppData/

VIVA Biblioteca/

biblioteca.db
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

Exemplo:

```text
Cadastrar Obra

↓

Criar Exemplar

↓

Registrar Empréstimo
```

---

## Domínio

Representa as regras do negócio.

Entidades previstas:

* Obra
* Exemplar
* Empréstimo
* Leitor
* Configuração
* Inventário

Toda decisão de negócio deverá permanecer nesta camada.

---

## Persistência

A persistência será realizada através de Repositories.

Exemplo:

```text
ObraRepository

ExemplarRepository

EmprestimoRepository
```

Nenhuma página acessará diretamente o banco.

---

# ORM

O Prisma será a única camada responsável pelo acesso ao banco.

Não deverão existir:

* SQL espalhado pela aplicação;
* consultas duplicadas;
* acesso direto ao SQLite.

Toda persistência deverá passar pelos Repositories.

---

# Banco Independente

A aplicação não deverá depender de SQLite.

O Repository deverá permitir:

```text
SQLite

↓

PostgreSQL

↓

SQL Server (futuro)
```

Sem alterar a regra de negócio.

---

# Estrutura Recomendada

```text
src/

app/

components/

features/

lib/

domain/

application/

repositories/

infrastructure/

prisma/
```

---

# Organização por Módulos

A aplicação deverá ser organizada por contexto de negócio.

Exemplo:

```text
features/

catalogo/

circulacao/

leitores/

inventario/

relatorios/

configuracoes/
```

Cada módulo conterá:

* componentes;
* hooks;
* services;
* validações.

---

# Configurações

Todas as regras parametrizáveis deverão ficar centralizadas.

Exemplos:

* prazo de empréstimo;
* quantidade máxima;
* multa;
* formato do código EX;
* padrão do tombo;
* impressão.

Nunca utilizar valores fixos no código.

---

# Atualizações

A arquitetura deverá permitir atualização automática.

Fluxo previsto:

```text
Nova versão

↓

Download

↓

Atualização

↓

Reinício
```

Sem perda de dados.

---

# Backup

O banco deverá permanecer totalmente separado da aplicação.

Estrutura sugerida:

```text
VIVA Biblioteca/

biblioteca.db

config.json

backups/

logs/
```

A reinstalação do sistema nunca deverá apagar o banco.

---

# Impressão

A aplicação deverá utilizar recursos nativos do sistema operacional.

Exemplos:

* etiquetas;
* relatórios;
* carteirinhas;
* código de barras.

Sem depender do navegador.

---

# Leitores de Código de Barras

Os leitores serão tratados como dispositivos de entrada.

Fluxo:

```text
Cursor

↓

Scanner

↓

EX000321

↓

Enter

↓

Localizar exemplar
```

Nenhuma configuração especial deverá ser necessária.

---

# Evolução para Cliente-Servidor

Caso uma biblioteca utilize vários computadores, a arquitetura deverá permitir substituir o SQLite por PostgreSQL.

Nesse cenário:

```text
Electron

↓

API

↓

PostgreSQL
```

Sem alterações na camada de domínio.

---

# Evolução para Cloud

A mesma arquitetura permitirá disponibilizar o sistema na Web.

```text
Navegador

↓

Next.js

↓

Application

↓

Repositories

↓

PostgreSQL
```

A lógica permanecerá exatamente a mesma.

---

# Regras Arquiteturais

## RA-001

Nenhuma regra de negócio poderá existir em componentes React.

---

## RA-002

Nenhuma página acessará diretamente o banco.

---

## RA-003

Toda persistência deverá passar pelos Repositories.

---

## RA-004

O Domínio nunca dependerá da Interface.

---

## RA-005

A Interface poderá ser substituída sem alterar o Domínio.

---

## RA-006

SQLite será a persistência padrão.

A arquitetura deverá permitir troca futura do banco.

---

## RA-007

Toda funcionalidade deverá ser implementada pensando primeiro no Domínio.

A interface será apenas uma representação dessa lógica.

---

# Benefícios

Esta arquitetura proporciona:

* manutenção simplificada;
* alta escalabilidade;
* reutilização de código;
* facilidade de testes;
* suporte a múltiplas plataformas;
* evolução para ambientes corporativos.

---

# Roadmap Técnico

A arquitetura suporta três modalidades oficiais.

### VIVA Biblioteca Local

* Electron
* SQLite
* Uso individual

---

### VIVA Biblioteca Rede

* Electron
* PostgreSQL
* Servidor local
* Múltiplos computadores

---

### VIVA Biblioteca Cloud

* Navegador
* PostgreSQL
* Acesso remoto
* Multiunidade

Todas compartilham o mesmo domínio e as mesmas regras de negócio.

---

# Relação com outros ADRs

* **ADR-001** — Catálogo e Não Duplicação de Obras
* **ADR-002** — Modelagem do Domínio: Obra e Exemplar
* **ADR-003** — Circulação e Empréstimos
* **ADR-004** — Estratégia de Importação do Acervo
* **ADR-005** — Codificação de Exemplares

Este documento estabelece oficialmente a arquitetura técnica do VIVA Biblioteca e define que o sistema será desenvolvido com **Domínio independente da tecnologia**, tendo o **Desktop (Electron)** como principal forma de distribuição, preservando a possibilidade de evolução para ambientes em rede e em nuvem sem reescrita da lógica de negócio.
