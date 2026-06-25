# ADR-003 — Circulação e Empréstimos

**Status:** Aprovado
**Data:** 24/06/2026
**Projeto:** VIVA Biblioteca

---

# Objetivo

Definir oficialmente o funcionamento do módulo de **Circulação** do VIVA Biblioteca.

Este documento estabelece como o sistema controla empréstimos, devoluções, disponibilidade dos exemplares e futuras funcionalidades relacionadas à circulação do acervo.

---

# Contexto

Uma biblioteca não empresta uma obra.

Ela empresta um **exemplar físico**.

O usuário solicita um título, mas o que sai da estante é um exemplar específico.

Esta diferença é fundamental para toda a arquitetura do sistema.

---

# Conceitos

## Catálogo

Representa o acervo intelectual.

Responsável por:

* Obras
* Autores
* Editoras
* Categorias
* Assuntos
* Coleções

---

## Circulação

Representa o ciclo de vida dos exemplares físicos.

Responsável por:

* Exemplares
* Empréstimos
* Devoluções
* Renovações
* Reservas (futuro)
* Inventário
* Movimentações

---

# Modelo Conceitual

```text
CATÁLOGO

Obra
    │
    └─────────────┐
                  │
                  ▼

CIRCULAÇÃO

Exemplar
    │
    ├──────────────► Empréstimo
    │
    ├──────────────► Reserva (futuro)
    │
    ├──────────────► Movimentações
    │
    └──────────────► Inventário
```

---

# Princípio Fundamental

A circulação trabalha exclusivamente sobre Exemplares.

Nunca sobre Obras.

Toda movimentação física ocorre em um Exemplar.

---

# Fluxo Oficial de Empréstimo

```text
Usuário

↓

Pesquisar obra

↓

Selecionar obra

↓

Sistema procura exemplar disponível

↓

Cria empréstimo

↓

Atualiza status do exemplar
```

---

# Pesquisa de Obras

O usuário pesquisa pelo título.

Exemplo:

```text
Dom Casmurro
```

Resultado:

```text
Dom Casmurro

Machado de Assis

5 exemplares

2 disponíveis

3 emprestados
```

O usuário nunca escolhe inicialmente um código EX.

Ele escolhe a obra.

---

# Seleção do Exemplar

## Modo padrão

O sistema localiza automaticamente o primeiro exemplar disponível.

Critérios:

* ativo
* disponível
* não reservado
* não emprestado
* não extraviado

Esse comportamento será o padrão do sistema.

---

## Seleção Manual (Evolução futura)

Algumas bibliotecas desejam selecionar um exemplar específico.

Exemplo:

```text
Dom Casmurro

Exemplares

EX000021

Disponível

--------------

EX000034

Disponível

--------------

EX000081

Disponível
```

O backend já deverá permitir essa evolução.

---

# Fluxo Completo

```text
Pesquisar obra

↓

Selecionar obra

↓

Existe exemplar disponível?

↓

SIM

↓

Selecionar exemplar automaticamente

↓

Criar empréstimo

↓

Atualizar status

↓

Registrar movimentação

↓

Concluir
```

Caso não exista exemplar disponível:

```text
Obra indisponível.

Deseja entrar na fila de reserva?

(Futuro)
```

---

# Estados do Exemplar

Os estados oficiais passam a ser:

```text
DISPONIVEL

EMPRESTADO

RESERVADO

MANUTENCAO

EXTRAVIADO

BAIXADO
```

Todos os módulos deverão utilizar exclusivamente esses estados.

---

# Mudanças de Estado

## Empréstimo

```text
DISPONIVEL

↓

EMPRESTADO
```

---

## Devolução

```text
EMPRESTADO

↓

DISPONIVEL
```

---

## Reserva (futuro)

```text
DISPONIVEL

↓

RESERVADO

↓

EMPRESTADO
```

---

## Manutenção

```text
DISPONIVEL

↓

MANUTENCAO

↓

DISPONIVEL
```

---

## Extravio

```text
DISPONIVEL

↓

EXTRAVIADO
```

---

## Baixa Patrimonial

```text
Qualquer estado

↓

BAIXADO
```

O exemplar permanece no histórico, porém deixa de participar da circulação.

---

# Empréstimo

Um empréstimo deve possuir obrigatoriamente:

* usuário
* exemplar
* data do empréstimo
* data prevista
* status

Nunca deverá apontar diretamente para uma Obra.

---

# Devolução

Ao devolver um exemplar:

* registrar data de devolução;
* atualizar status para DISPONIVEL;
* registrar movimentação (futuro);
* verificar existência de reservas (futuro).

---

# Renovação

A renovação não cria novo empréstimo.

Ela altera apenas:

* data prevista de devolução.

O histórico permanece contínuo.

---

# Regras de Negócio

## RN-101

Somente exemplares DISPONIVEIS podem ser emprestados.

---

## RN-102

Um exemplar EMPRESTADO não pode receber novo empréstimo.

---

## RN-103

Todo empréstimo deve possuir um usuário válido.

---

## RN-104

Todo empréstimo referencia exatamente um exemplar.

---

## RN-105

Obras nunca são emprestadas.

Somente exemplares.

---

## RN-106

A disponibilidade de uma Obra é calculada pela disponibilidade de seus exemplares.

---

## RN-107

Um exemplar BAIXADO nunca poderá voltar para circulação.

---

## RN-108

Exemplares EXTRAVIADOS permanecem cadastrados para fins históricos.

---

# Indicadores

Toda Obra deverá possuir indicadores calculados.

Exemplo:

```text
Dom Casmurro

Total

5

Disponíveis

2

Emprestados

2

Reservados

1

Extraviados

0
```

Esses indicadores são derivados dos Exemplares.

Nunca armazenados manualmente.

---

# Integração com Configurações

As regras de circulação deverão utilizar obrigatoriamente os parâmetros configuráveis do sistema.

Exemplos:

* prazo padrão de empréstimo;
* quantidade máxima de empréstimos por usuário;
* multas (futuro);
* bloqueios (futuro).

Nenhum valor deverá permanecer fixo no código.

---

# Evoluções Futuras

Esta arquitetura prepara o sistema para:

* reservas;
* fila de espera;
* renovação online;
* multas;
* bloqueio automático;
* inventário por leitor de código de barras;
* RFID;
* múltiplas bibliotecas;
* múltiplas unidades;
* circulação entre unidades.

Nenhuma dessas funcionalidades deverá exigir alteração estrutural na modelagem.

---

# Relação com outros ADRs

* **ADR-001** — Catálogo e Não Duplicação de Obras
* **ADR-002** — Modelagem do Domínio: Obra e Exemplar
* **ADR-004** — Estratégia de Importação CSV
* **ADR-005** — Codificação de Exemplares

Este documento define oficialmente o módulo de **Circulação** do VIVA Biblioteca e estabelece que todas as operações físicas do sistema ocorrem sobre **Exemplares**, preservando a separação entre catálogo bibliográfico e patrimônio físico.
