# ADR-010 — Roadmap Técnico e Estratégia de Evolução

**Status:** Aprovado
**Data:** 24/06/2026
**Projeto:** VIVA Biblioteca

---

# Objetivo

Definir o roadmap oficial de evolução do VIVA Biblioteca.

Este documento estabelece a ordem de implementação dos módulos, priorizando:

* menor risco;
* maior valor entregue;
* preservação da arquitetura;
* facilidade de manutenção.

O roadmap deverá servir como referência para planejamento de releases e priorização do desenvolvimento.

---

# Princípios

Toda evolução deverá seguir os seguintes princípios:

1. O domínio sempre vem antes da interface.
2. Nenhuma funcionalidade pode violar os ADRs anteriores.
3. Implementações devem ser incrementais.
4. Cada fase deve resultar em um sistema funcional.
5. Refatorações estruturais devem ocorrer antes de novas funcionalidades.

---

# Roadmap Geral

```text
FASE 1
Arquitetura

↓

FASE 2
Catálogo

↓

FASE 3
Circulação

↓

FASE 4
Patrimônio

↓

FASE 5
Desktop

↓

FASE 6
Cloud

↓

FASE 7
Ecossistema
```

---

# FASE 1 — Arquitetura (Fundação)

Objetivo:

Preparar a base técnica.

Entregas:

* Refatoração Obra × Exemplar
* Nova modelagem do banco
* Migração dos dados
* Prisma atualizado
* Repositories
* Services
* APIs
* Refatoração das telas

Resultado esperado:

Arquitetura consolidada.

---

# FASE 2 — Catálogo

Objetivo:

Finalizar o módulo bibliográfico.

Entregas:

* Cadastro de Obras
* Cadastro de Exemplares
* Pesquisa inteligente
* Importação CSV
* Deduplicação
* Capa da obra
* Indicadores

Resultado esperado:

Catálogo totalmente operacional.

---

# FASE 3 — Circulação

Objetivo:

Controlar o empréstimo dos exemplares.

Entregas:

* Empréstimos
* Devoluções
* Renovação
* Histórico
* Dashboard
* Busca rápida

Resultado esperado:

Biblioteca totalmente operacional.

---

# FASE 4 — Patrimônio

Objetivo:

Controlar o acervo físico.

Entregas:

* Inventário
* Código de barras
* Impressão de etiquetas
* Baixa patrimonial
* Manutenção
* Movimentações

Resultado esperado:

Controle patrimonial completo.

---

# FASE 5 — Desktop

Objetivo:

Transformar o sistema em um aplicativo instalável.

Entregas:

* Electron
* Instalador (.exe)
* Atualizações automáticas
* Backup automático
* Impressão nativa
* Scanner de código de barras

Resultado esperado:

VIVA Biblioteca Desktop.

---

# FASE 6 — Cloud

Objetivo:

Preparar versão multiusuário.

Entregas:

* PostgreSQL
* API compartilhada
* Controle de usuários
* Múltiplas bibliotecas
* Sincronização
* Acesso Web

Resultado esperado:

Versão corporativa.

---

# FASE 7 — Ecossistema

Objetivo:

Expandir funcionalidades.

Entregas:

* RFID
* Autoatendimento
* Reserva online
* Aplicativo móvel
* API pública
* Integração com sistemas externos
* IA para catalogação

Resultado esperado:

Ecossistema completo.

---

# Roadmap Funcional

## Catálogo

* Obras
* Exemplares
* Autores
* Editoras
* Categorias
* Assuntos
* Coleções

---

## Circulação

* Empréstimos
* Devoluções
* Renovação
* Reservas
* Fila de espera

---

## Patrimônio

* Inventário
* Movimentações
* Localização
* Transferências
* RFID

---

## Administração

* Usuários
* Permissões
* Configurações
* Auditoria
* Logs

---

## Relatórios

* Acervo
* Circulação
* Leitores
* Patrimônio
* Indicadores

---

# Roadmap Técnico

## Banco

* SQLite
* PostgreSQL
* Migrações
* Backup
* Restore

---

## Backend

* Prisma
* Repository Pattern
* Services
* Validações
* Testes

---

## Frontend

* Design System
* Componentes reutilizáveis
* Acessibilidade
* Responsividade
* Performance

---

## Desktop

* Electron
* Atualizações
* Impressão
* Scanner
* Instalação

---

# Critérios para iniciar uma nova fase

Uma fase somente poderá ser iniciada quando:

* a fase anterior estiver estável;
* os testes estiverem aprovados;
* a documentação estiver atualizada;
* os ADRs permanecerem consistentes.

---

# Gestão de Mudanças

Toda alteração estrutural deverá:

1. atualizar os ADRs afetados;
2. documentar impactos;
3. preservar compatibilidade sempre que possível;
4. possuir estratégia de rollback.

---

# Indicadores de Evolução

Ao final de cada fase deverão ser avaliados:

* cobertura funcional;
* qualidade do código;
* desempenho;
* documentação;
* testes;
* estabilidade.

---

# Critérios para Releases

Cada release deverá conter:

* changelog;
* migrações;
* atualização dos ADRs;
* plano de rollback;
* validação funcional.

---

# Visão de Longo Prazo

O objetivo do VIVA Biblioteca é evoluir para uma plataforma completa de gestão bibliotecária.

Arquitetura alvo:

```text
                VIVA Biblioteca

                    │

        ┌───────────┼───────────┐

        │           │           │

   Desktop      Web Cloud     Mobile

        │           │           │

        └───────────┼───────────┘

               Domínio Compartilhado

                    │

              PostgreSQL / SQLite
```

A lógica de negócio será única para todas as plataformas.

---

# Relação com os ADRs

Este roadmap consolida a estratégia de evolução definida pelos ADRs:

* ADR-001 — Catálogo e Não Duplicação de Obras
* ADR-002 — Modelagem do Domínio
* ADR-003 — Circulação
* ADR-004 — Importação
* ADR-005 — Codificação
* ADR-006 — Arquitetura
* ADR-007 — Regras de Negócio
* ADR-008 — Modelo de Dados
* ADR-009 — Fluxos Funcionais

---

# Decisão Final

O VIVA Biblioteca será desenvolvido de forma incremental, preservando a arquitetura definida pelos ADRs.

Cada nova funcionalidade deverá:

* respeitar o domínio;
* reutilizar componentes existentes;
* manter compatibilidade com o modelo Obra → Exemplar;
* contribuir para a evolução da plataforma sem comprometer sua simplicidade.

Este roadmap passa a ser o plano oficial de evolução técnica do projeto.
