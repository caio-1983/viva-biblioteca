# ADR-011 — Convenções de Desenvolvimento

**Status:** Aprovado  
**Data:** 24/06/2026  
**Projeto:** VIVA Biblioteca

---

# Objetivo

Definir o padrão oficial de desenvolvimento do VIVA Biblioteca.

Este documento estabelece as convenções utilizadas durante todo o ciclo de desenvolvimento, garantindo consistência, legibilidade, manutenção e escalabilidade do sistema.

Todos os desenvolvedores deverão seguir estas convenções.

---

# Princípios

Todo desenvolvimento deverá seguir os seguintes princípios:

- Simplicidade
- Clareza
- Baixo acoplamento
- Alta coesão
- Reutilização
- Legibilidade
- Escalabilidade

Código é um ativo do projeto e deve permanecer compreensível durante muitos anos.

---

# Arquitetura

Toda implementação deverá respeitar a arquitetura definida nos ADRs anteriores.

A dependência sempre ocorre de cima para baixo.

```text
Interface

↓

Application

↓

Domain

↓

Repositories

↓

Prisma

↓

Banco de Dados
```

Nenhuma camada poderá acessar diretamente uma camada superior.

---

# Estrutura Oficial do Projeto

```text
src/

├── app/
├── components/
├── features/
├── domain/
├── application/
├── repositories/
├── infrastructure/
├── hooks/
├── lib/
├── types/
├── utils/
├── prisma/
└── styles/
```

---

# Organização por Módulos

O sistema deverá ser organizado por contexto de negócio.

```text
features/

catalogo/

circulacao/

leitores/

inventario/

relatorios/

configuracoes/
```

Cada módulo poderá conter:

```text
components/

hooks/

services/

schemas/

types/

utils/
```

Essa organização reduz acoplamento e facilita manutenção.

---

# Componentes React

Os componentes deverão possuir responsabilidade única.

Devem conter apenas:

- renderização;
- eventos da interface;
- composição visual.

Não deverão conter:

- regras de negócio;
- consultas SQL;
- acesso ao banco;
- lógica complexa.

---

# Hooks

Hooks deverão tratar apenas comportamento de interface.

Exemplos:

- paginação;
- filtros;
- debounce;
- estado do formulário.

Nunca implementar regras do domínio em hooks.

---

# Services

Toda regra de negócio deverá existir em um Service.

Exemplos:

```text
CadastrarObraService

CadastrarExemplarService

EmprestarExemplarService

DevolverExemplarService

ImportarAcervoService
```

Services representam casos de uso do sistema.

---

# Repositories

Todo acesso ao banco deverá passar pelos Repositories.

Exemplo:

```text
ObraRepository

ExemplarRepository

EmprestimoRepository

LeitorRepository
```

É proibido acessar Prisma diretamente em:

- páginas;
- componentes;
- hooks.

---

# Prisma

O Prisma será a única camada responsável pela persistência.

Regras:

- utilizar migrations;
- evitar SQL bruto sempre que possível;
- manter schema organizado;
- documentar alterações estruturais.

---

# Banco de Dados

## Chaves Primárias

Todas as entidades utilizarão UUID.

Nunca IDs sequenciais.

---

## Soft Delete

Sempre que possível utilizar:

```text
deletedAt
```

Em vez de exclusão física.

---

## Auditoria

Entidades principais deverão possuir:

```text
createdAt

updatedAt

deletedAt
```

---

# Convenções de Nomenclatura

## Classes

PascalCase

```text
CadastrarObraService
```

---

## Componentes

PascalCase

```text
ObraCard.tsx
```

---

## Hooks

camelCase

```text
useObras()
```

---

## Funções

camelCase

```text
buscarObra()

gerarCodigoExemplar()
```

---

## Arquivos

kebab-case

```text
obra-card.tsx

obra-form.tsx
```

---

## Rotas

Sempre em kebab-case.

```text
/catalogo

/catalogo/obras

/catalogo/exemplares

/circulacao

/emprestimos
```

---

# Convenções para APIs

Endpoints deverão representar recursos.

Exemplo:

```text
GET    /api/obras

POST   /api/obras

PUT    /api/obras/:id

DELETE /api/obras/:id
```

Evitar verbos na URL.

---

# Validações

Toda entrada deverá ser validada.

Utilizar:

- Zod
- Prisma
- Regras do domínio

Nunca confiar apenas na interface.

---

# Tratamento de Erros

Toda exceção deverá possuir:

- mensagem clara;
- contexto;
- registro em log quando necessário.

Evitar mensagens genéricas.

Exemplo ruim:

```text
Erro inesperado.
```

Exemplo adequado:

```text
Não foi possível criar o exemplar porque a obra informada não existe.
```

---

# Comentários

Comentários deverão explicar decisões.

Nunca descrever código óbvio.

Ruim:

```ts
// Soma 1 ao contador
contador++
```

Bom:

```ts
// Mantém compatibilidade com a sequência histórica de códigos EX
```

---

# Commits

Utilizar Conventional Commits.

Exemplos:

```text
feat:

fix:

refactor:

docs:

test:

style:

perf:

chore:
```

Exemplo:

```text
feat: implementa cadastro de exemplares

fix: corrige validação do ISBN

docs: adiciona ADR-012

refactor: separa obra de exemplar
```

---

# Branches

Padrão oficial:

```text
feature/

fix/

refactor/

docs/

release/

hotfix/
```

Exemplos:

```text
feature/cadastro-obras

feature/importacao-csv

fix/emprestimo

docs/adr-012
```

---

# Pull Requests

Todo Pull Request deverá:

- possuir descrição;
- informar impacto;
- indicar ADR relacionado;
- listar testes realizados.

---

# Testes

Prioridade:

1. Services
2. Repositories
3. Casos de uso
4. APIs
5. Componentes

Regras de negócio devem ser testadas antes da interface.

---

# Performance

Evitar:

- consultas duplicadas;
- re-renderizações desnecessárias;
- componentes gigantes;
- lógica repetida.

Priorizar:

- composição;
- memoização quando necessária;
- consultas otimizadas;
- índices no banco.

---

# Segurança

Nunca:

- expor secrets;
- armazenar senhas em texto;
- confiar em dados do cliente;
- executar SQL construído manualmente.

---

# Documentação

Toda alteração estrutural deverá atualizar:

- ADR correspondente;
- documentação técnica;
- roadmap quando necessário.

---

# Revisão de Código

Antes do merge verificar:

- arquitetura preservada;
- ADR respeitado;
- código limpo;
- testes passando;
- documentação atualizada.

---

# Checklist para Novas Funcionalidades

Antes de implementar qualquer funcionalidade responder:

- Existe ADR para este assunto?
- A regra pertence ao domínio?
- Existe Service semelhante?
- Existe Repository reutilizável?
- Existe componente reutilizável?
- A funcionalidade respeita Obra × Exemplar?
- A implementação preserva compatibilidade?

Caso alguma resposta seja negativa, revisar antes de continuar.

---

# Regra de Ouro

**O domínio sempre prevalece sobre a implementação.**

Nenhuma decisão técnica poderá violar as regras definidas nos ADRs do projeto.

---

# Relação com os ADRs

Este documento complementa todos os ADRs anteriores.

Ele não define regras de negócio.

Ele define **como o software deverá ser desenvolvido** para preservar a arquitetura oficial do VIVA Biblioteca.

---

# Decisão Final

Toda contribuição para o VIVA Biblioteca deverá seguir estas convenções.

O objetivo é manter um código:

- consistente;
- previsível;
- reutilizável;
- bem documentado;
- preparado para evolução contínua.

Este documento passa a ser o padrão oficial de desenvolvimento do projeto.