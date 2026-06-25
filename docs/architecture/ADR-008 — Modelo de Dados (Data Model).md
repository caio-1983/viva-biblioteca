# ADR-008 — Modelo de Dados (Data Model)

**Status:** Aprovado
**Data:** 24/06/2026
**Projeto:** VIVA Biblioteca

---

# Objetivo

Definir o modelo de dados oficial do VIVA Biblioteca.

Este documento estabelece:

* entidades;
* relacionamentos;
* cardinalidades;
* chaves;
* convenções;
* índices;
* estratégias de integridade.

Toda implementação do banco deverá seguir esta especificação.

---

# Modelo Conceitual

```text
                 CATÁLOGO

                  OBRA
                    │
                    │ 1
                    │
                    │
                    │ N
               EXEMPLAR
                    │
      ┌─────────────┼─────────────┐
      │             │             │
      ▼             ▼             ▼

EMPRÉSTIMO   MOVIMENTAÇÃO   INVENTÁRIO

                    │
                    ▼

                 LEITOR
```

---

# Entidade: Obra

Representa o registro bibliográfico.

## Campos

| Campo          | Tipo     | Obrigatório |
| -------------- | -------- | ----------- |
| id             | UUID     | Sim         |
| isbn           | String   | Não         |
| titulo         | String   | Sim         |
| subtitulo      | String   | Não         |
| tipoPublicacao | Enum     | Sim         |
| autor          | String   | Sim         |
| editora        | String   | Não         |
| edicao         | String   | Não         |
| anoPublicacao  | Integer  | Não         |
| idioma         | String   | Não         |
| classificacao  | String   | Não         |
| assunto1       | String   | Não         |
| assunto2       | String   | Não         |
| assunto3       | String   | Não         |
| colecao        | String   | Não         |
| sinopse        | Text     | Não         |
| capaUrl        | String   | Não         |
| ativo          | Boolean  | Sim         |
| createdAt      | DateTime | Sim         |
| updatedAt      | DateTime | Sim         |

---

# Relacionamentos

```text
Obra

1

↓

N

Exemplares
```

---

# Entidade: Exemplar

Representa um patrimônio físico.

## Campos

| Campo          | Tipo     |
| -------------- | -------- |
| id             | UUID     |
| obraId         | UUID     |
| codigoExemplar | String   |
| codigoBarras   | String   |
| tombo          | String   |
| status         | Enum     |
| estadoFisico   | Enum     |
| localizacao    | String   |
| origem         | Enum     |
| dataAquisicao  | Date     |
| valor          | Decimal  |
| observacoes    | Text     |
| ativo          | Boolean  |
| createdAt      | DateTime |
| updatedAt      | DateTime |

---

# Status do Exemplar

```text
DISPONIVEL

EMPRESTADO

RESERVADO

MANUTENCAO

EXTRAVIADO

BAIXADO
```

---

# Relacionamentos

```text
Exemplar

1

↓

N

Empréstimos
```

```text
Exemplar

1

↓

N

Movimentações
```

---

# Entidade: Leitor

Representa um usuário da biblioteca.

## Campos

| Campo     | Tipo     |
| --------- | -------- |
| id        | UUID     |
| matricula | String   |
| nome      | String   |
| cpf       | String   |
| email     | String   |
| telefone  | String   |
| categoria | Enum     |
| ativo     | Boolean  |
| createdAt | DateTime |

---

# Entidade: Empréstimo

Representa a circulação do exemplar.

## Campos

| Campo          | Tipo     |
| -------------- | -------- |
| id             | UUID     |
| exemplarId     | UUID     |
| leitorId       | UUID     |
| dataEmprestimo | DateTime |
| dataPrevista   | DateTime |
| dataDevolucao  | DateTime |
| status         | Enum     |
| observacoes    | Text     |

---

# Status do Empréstimo

```text
ATIVO

DEVOLVIDO

ATRASADO

CANCELADO
```

---

# Entidade: Movimentação (Futura)

Representa qualquer evento ocorrido com um exemplar.

## Campos

| Campo      | Tipo     |
| ---------- | -------- |
| id         | UUID     |
| exemplarId | UUID     |
| tipo       | Enum     |
| usuario    | UUID     |
| data       | DateTime |
| observacao | Text     |

---

# Tipos de Movimentação

```text
CADASTRO

EMPRESTIMO

DEVOLUCAO

RENOVACAO

TRANSFERENCIA

MANUTENCAO

EXTRAVIO

BAIXA

INVENTARIO
```

---

# Cardinalidades

```text
Obra

1 → N Exemplares
```

```text
Exemplar

1 → N Empréstimos
```

```text
Leitor

1 → N Empréstimos
```

```text
Exemplar

1 → N Movimentações
```

---

# Chaves Estrangeiras

```text
Exemplar.obraId

→ Obra.id
```

```text
Emprestimo.exemplarId

→ Exemplar.id
```

```text
Emprestimo.leitorId

→ Leitor.id
```

```text
Movimentacao.exemplarId

→ Exemplar.id
```

---

# Exclusão

O sistema utilizará Soft Delete.

Campo padrão:

```text
deletedAt
```

Nenhum registro será removido fisicamente.

Exceções deverão ser documentadas.

---

# Índices Obrigatórios

## Obra

* ISBN
* Título

---

## Exemplar

* Código EX
* Tombo
* Código de barras
* Status

---

## Empréstimos

* Exemplar
* Leitor
* Status
* Data prevista

---

# Campos Calculados

Não deverão existir fisicamente.

Serão calculados.

Exemplo:

```text
Obra

↓

totalExemplares

↓

disponiveis

↓

emprestados

↓

reservados
```

---

# Convenções

## IDs

Todos os IDs utilizarão UUID.

Nunca números sequenciais.

---

## Datas

Todas as datas utilizarão UTC.

A conversão ocorrerá apenas na interface.

---

## Auditoria

Todas as tabelas deverão possuir:

```text
createdAt

updatedAt

deletedAt
```

Sempre que aplicável.

---

# Estratégia de Evolução

O modelo deverá permitir futura normalização das entidades:

* Autor
* Editora
* Categoria
* Assunto
* Coleção
* Série

Inicialmente esses campos permanecerão como texto.

---

# Estratégia de Migração

A tabela atual "Acervo" será decomposta em:

```text
Obra

+

Exemplar
```

Os empréstimos permanecerão vinculados aos Exemplares.

Nenhum histórico será perdido.

---

# Benefícios

Esta modelagem proporciona:

* eliminação de duplicidade;
* integridade referencial;
* maior desempenho;
* facilidade para evolução;
* compatibilidade com múltiplas plataformas.

---

# Relação com outros ADRs

* ADR-001 — Catálogo e Não Duplicação de Obras
* ADR-002 — Modelagem Obra × Exemplar
* ADR-003 — Circulação
* ADR-004 — Importação
* ADR-005 — Codificação
* ADR-006 — Arquitetura

Este documento define oficialmente o **modelo de dados** do VIVA Biblioteca e deverá servir como referência para a implementação do banco de dados, Prisma Schema, migrations e APIs.
