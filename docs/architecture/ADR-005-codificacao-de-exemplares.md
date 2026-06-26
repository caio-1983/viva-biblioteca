# ADR-005 — Codificação e Identificação de Exemplares

**Status:** Aprovado
**Data:** 24/06/2026
**Projeto:** VIVA Biblioteca

---

# Objetivo

Definir oficialmente como os exemplares físicos serão identificados dentro do VIVA Biblioteca.

Este documento estabelece os padrões para:

* código do exemplar;
* número de tombo;
* código de barras;
* identificação interna;
* futuras integrações com RFID.

---

# Contexto

Uma das decisões mais importantes do sistema é separar claramente:

* identificação da Obra;
* identificação do Exemplar.

Embora uma Obra possa possuir dezenas de exemplares, cada exemplar deve possuir identidade própria durante todo seu ciclo de vida.

---

# Princípio Fundamental

Cada exemplar físico possui identidade única.

Essa identidade nunca poderá ser reutilizada.

Mesmo que um exemplar seja baixado ou descartado.

---

# Modelo de Identificação

```text
Obra

↓

Dom Casmurro

↓

Exemplares

EX000001

EX000002

EX000003

EX000004
```

Cada exemplar representa um patrimônio independente.

---

# Identificadores Oficiais

O sistema trabalhará com quatro identificadores distintos.

## 1. ID Interno

Utilizado exclusivamente pelo banco de dados.

Exemplo:

```text
id = 1254
```

Nunca será exibido ao usuário.

Não poderá ser utilizado em etiquetas.

---

## 2. Código do Exemplar

Identificador funcional do sistema.

Exemplo:

```text
EX000001

EX000002

EX000003
```

Características:

* único;
* imutável;
* permanente;
* utilizado em pesquisas;
* utilizado na circulação;
* utilizado em etiquetas.

Este será o principal identificador visível para o bibliotecário.

---

## 3. Número de Tombo

Representa o patrimônio da instituição.

Exemplo:

```text
2026-001

2026-002

2026-003
```

O tombo:

* pode seguir regras da instituição;
* pode ser informado manualmente;
* pode ser diferente do código do exemplar;
* não substitui o código EX.

O sistema permitirá bibliotecas que não utilizam tombo.

Nesse caso o campo será opcional.

---

## 4. Código de Barras

Representa a identificação utilizada pelos leitores ópticos.

Por padrão:

```text
Código de Barras

=

Código do Exemplar
```

Exemplo:

```text
EX000321
```

Futuramente poderá utilizar outros padrões.

---

# Código do Exemplar

Formato oficial:

```text
EX000001
```

Estrutura:

```text
EX

+

Número sequencial

+

Zeros à esquerda
```

Exemplo:

```text
EX000001

EX000002

EX000003

EX000004
```

---

# Independência do ID

O código do exemplar não deverá depender do ID do banco.

Exemplo:

```text
id

1542

↓

Código

EX000321
```

Isso permite:

* migrações;
* importações;
* sincronizações;
* futuras integrações.

O ID interno poderá mudar.

O código do exemplar nunca.

---

# Sequência

A sequência será única para toda a biblioteca.

Nunca reiniciará.

Exemplo:

```text
EX000001

EX000002

EX000003

...

EX152431
```

Mesmo após exclusões.

Nunca reutilizar números.

---

# Geração

O código será gerado automaticamente.

O usuário nunca poderá escolher manualmente.

Fluxo:

```text
Adicionar exemplar

↓

Sistema reserva próximo código

↓

Salvar

↓

Código definitivo
```

---

# Reserva de Código

Durante o cadastro o sistema poderá apresentar um código provisório.

Entretanto o código definitivo será confirmado apenas na gravação da transação.

Isso evita conflitos em ambientes multiusuário.

---

# Pesquisa

O sistema permitirá localizar um exemplar através de:

* código do exemplar;
* código de barras;
* tombo.

Todos deverão apontar para o mesmo registro.

---

# Impressão de Etiquetas

As etiquetas deverão utilizar prioritariamente:

```text
EX000321
```

Opcionalmente poderão conter:

* título da obra;
* autor;
* código de barras;
* QR Code;
* logotipo da biblioteca.

---

# Código de Barras

O sistema deverá permitir diferentes estratégias de impressão.

Exemplos:

* Code 128
* Code 39
* EAN-13 (quando aplicável)

A escolha será configurável.

O valor codificado continuará sendo o código do exemplar.

---

# QR Code

Futuramente o sistema poderá gerar QR Codes.

Conteúdo sugerido:

```text
EX000321
```

ou

```text
https://biblioteca.local/exemplares/EX000321
```

Essa funcionalidade não altera a identificação oficial.

---

# RFID

A arquitetura deverá prever integração futura com RFID.

Estrutura prevista:

```text
Exemplar

↓

RFID Tag

↓

UID do Chip
```

O RFID será um identificador adicional.

Nunca substituirá o código do exemplar.

---

# Regras de Negócio

## RN-301

Todo exemplar deve possuir um código único.

---

## RN-302

O código do exemplar nunca poderá ser alterado.

---

## RN-303

O código nunca poderá ser reutilizado.

---

## RN-304

O código deverá ser gerado automaticamente.

---

## RN-305

O usuário não poderá editar manualmente o código.

---

## RN-306

Tombo e código do exemplar representam conceitos diferentes.

---

## RN-307

Código de barras e QR Code representam apenas formas diferentes de acessar o mesmo exemplar.

---

## RN-308

A identificação oficial do sistema é o código do exemplar.

O ID do banco nunca será apresentado ao usuário.

---

# Evoluções Futuras

Esta decisão prepara o sistema para:

* impressão de etiquetas;
* integração com leitores ópticos;
* RFID;
* inventário automático;
* autoatendimento;
* múltiplas bibliotecas;
* sincronização entre unidades.

Nenhuma dessas funcionalidades deverá alterar o padrão de identificação definido neste documento.

---

# Benefícios

Esta estratégia proporciona:

* estabilidade da identificação dos exemplares;
* independência do banco de dados;
* facilidade para migrações;
* integração com dispositivos físicos;
* padronização em todo o sistema;
* rastreabilidade do patrimônio.

---

# Relação com outros ADRs

* **ADR-001** — Catálogo e Não Duplicação de Obras
* **ADR-002** — Modelagem do Domínio: Obra e Exemplar
* **ADR-003** — Circulação e Empréstimos
* **ADR-004** — Estratégia de Importação do Acervo

Este documento define oficialmente o padrão de identificação dos exemplares do VIVA Biblioteca e estabelece que o **Código do Exemplar (EX)** é a identidade funcional permanente de cada item físico do acervo, independente do identificador interno do banco de dados.
