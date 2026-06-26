# ADR-002 — Modelagem do Domínio: Obra e Exemplar

**Status:** Aprovado
**Data:** 24/06/2026
**Projeto:** VIVA Biblioteca

---

# Objetivo

Definir oficialmente a modelagem do domínio bibliotecário do VIVA Biblioteca, separando corretamente os conceitos de **Obra** e **Exemplar**.

Esta decisão estabelece a base arquitetural para todas as funcionalidades do sistema.

---

# Contexto

Na modelagem anterior, a entidade `Acervo` acumulava simultaneamente informações bibliográficas e patrimoniais.

Exemplo:

```text
Acervo

id
titulo
autor
isbn
editora

numeroExemplar
tombo
status
localizacao
```

Essa abordagem causava diversos problemas:

* duplicação de dados bibliográficos;
* inconsistência entre exemplares do mesmo título;
* dificuldade para manutenção;
* relatórios incorretos;
* crescimento desorganizado do catálogo.

A partir desta decisão esses conceitos passam a ser separados.

---

# Princípios do Domínio

O sistema passa a trabalhar com dois conceitos fundamentais.

## Obra

Representa o conteúdo intelectual.

Uma obra existe apenas uma vez no catálogo.

Ela descreve "o que é o livro".

Exemplos:

* Dom Casmurro
* O Pequeno Príncipe
* Bíblia Sagrada

A obra não representa um objeto físico.

---

## Exemplar

Representa uma cópia física pertencente à biblioteca.

Cada exemplar possui sua própria identidade.

Cada exemplar pertence obrigatoriamente a uma única obra.

Ele representa "qual livro físico está na estante".

---

# Modelo Conceitual

```text
                CATÁLOGO

                    │

                ┌────────┐
                │  Obra  │
                └────────┘
                     │
                     │ 1
                     │
                     │
                     │ N
             ┌──────────────┐
             │  Exemplar    │
             └──────────────┘
                     │
        ┌────────────┼─────────────┐
        │            │             │
        ▼            ▼             ▼

   Empréstimos   Reservas      Movimentações
                   (futuro)        (futuro)
```

---

# Responsabilidades da Obra

A Obra contém exclusivamente informações bibliográficas.

Exemplos:

* título
* subtítulo
* ISBN
* tipo de publicação
* autor
* editora
* edição
* idioma
* ano de publicação
* classificação
* assuntos
* coleção
* sinopse
* imagem da capa

A Obra nunca possui:

* status
* localização
* tombo
* disponibilidade
* patrimônio
* empréstimos

Essas informações pertencem ao Exemplar.

---

# Responsabilidades do Exemplar

O Exemplar representa um patrimônio físico.

Cada exemplar possui vida própria.

Campos previstos:

* obraId
* código do exemplar
* código de barras
* tombo
* status
* estado físico
* localização
* data de aquisição
* origem
* valor
* observações patrimoniais

Cada exemplar poderá possuir um histórico próprio de utilização.

---

# Relacionamento

Uma Obra pode possuir diversos Exemplares.

```text
Dom Casmurro

↓

EX000001

EX000002

EX000003

EX000004
```

Um Exemplar pertence obrigatoriamente a apenas uma Obra.

Não existe Exemplar sem Obra.

---

# Ciclo de Vida

## Obra

```text
Criada

↓

Atualizada

↓

Inativada
```

A Obra não pode ser excluída caso possua Exemplares ativos.

---

## Exemplar

```text
Criado

↓

Disponível

↓

Emprestado

↓

Devolvido

↓

Manutenção

↓

Disponível

↓

Baixado
```

O ciclo de vida do exemplar é independente da obra.

---

# Cadastro

O cadastro será dividido em duas etapas.

## Etapa 1

Cadastro da Obra.

Nesta etapa são informados apenas os dados bibliográficos.

Nenhum exemplar é criado automaticamente.

---

## Etapa 2

Gerenciamento dos Exemplares.

Após salvar a Obra o sistema direciona para sua página de detalhes.

A partir dela o bibliotecário poderá cadastrar quantos exemplares desejar.

Cada clique em **Adicionar Exemplar** cria exatamente um novo exemplar.

---

# Pesquisa

A pesquisa principal do sistema trabalha sobre Obras.

Resultado esperado:

```text
Dom Casmurro

Machado de Assis

ISBN

5 exemplares

2 disponíveis

3 emprestados
```

Ao abrir a obra:

```text
Dom Casmurro

EX000001

Disponível

----------------

EX000002

Emprestado

----------------

EX000003

Disponível
```

---

# Empréstimos

O empréstimo sempre referencia um Exemplar.

Nunca uma Obra.

```text
Usuário

↓

Exemplar

↓

Empréstimo
```

O leitor solicita uma obra.

O sistema identifica automaticamente um exemplar disponível.

---

# Indicadores da Obra

Embora pertençam aos Exemplares, algumas informações serão apresentadas como indicadores agregados da Obra.

Esses valores não precisam ser armazenados fisicamente.

Podem ser calculados dinamicamente.

Indicadores previstos:

* Total de exemplares
* Disponíveis
* Emprestados
* Reservados
* Em manutenção
* Extraviados

Esses indicadores serão utilizados na pesquisa, dashboards e relatórios.

---

# Campos previstos para evolução

A modelagem deverá permitir futura normalização das seguintes entidades:

* Autor
* Editora
* Categoria
* Assunto
* Coleção
* Série

Inicialmente esses dados permanecerão armazenados como texto.

Nenhuma decisão atual deve impedir essa evolução.

---

# Regras de Negócio

## RN-001

Toda Obra deve possuir pelo menos um título.

---

## RN-002

Todo Exemplar pertence obrigatoriamente a uma Obra.

---

## RN-003

Um Exemplar nunca poderá pertencer a duas Obras.

---

## RN-004

Uma Obra poderá existir sem Exemplares.

Exemplo:

Cadastro bibliográfico realizado antes da chegada dos livros.

---

## RN-005

O status pertence exclusivamente ao Exemplar.

A Obra nunca possui status de circulação.

---

## RN-006

Tombo, código de barras e localização pertencem exclusivamente ao Exemplar.

---

## RN-007

Empréstimos, reservas e movimentações sempre referenciam Exemplares.

Nunca Obras.

---

# Benefícios

Esta arquitetura proporciona:

* eliminação da duplicação de dados;
* manutenção centralizada do catálogo;
* maior consistência bibliográfica;
* relatórios mais precisos;
* melhor experiência de pesquisa;
* escalabilidade para novas funcionalidades.

---

# Impactos Arquiteturais

Esta decisão afeta diretamente:

* Banco de dados
* APIs
* Importação CSV
* Pesquisa
* Cadastro
* Empréstimos
* Relatórios
* Inventário
* Dashboard

Todos os novos módulos deverão respeitar esta modelagem.

---

# Relação com outros ADRs

* **ADR-001** — Catálogo e Não Duplicação de Obras
* **ADR-003** — Circulação e Empréstimos
* **ADR-004** — Estratégia de Importação CSV
* **ADR-005** — Codificação de Exemplares

Este documento define o modelo de domínio oficial do VIVA Biblioteca e deverá servir como referência para toda evolução futura do sistema.
