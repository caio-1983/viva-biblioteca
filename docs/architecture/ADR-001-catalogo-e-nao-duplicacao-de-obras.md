# ADR-001 — Catálogo e Não Duplicação de Obras

**Status:** Aprovado
**Data:** 24/06/2026
**Projeto:** VIVA Biblioteca

---

# Contexto

O VIVA Biblioteca está sendo reestruturado para separar corretamente os conceitos de **Obra** e **Exemplar**.

Durante essa evolução foi identificado um problema recorrente em sistemas de bibliotecas: a duplicação de obras no catálogo.

Exemplos:

* cadastrar "Dom Casmurro" diversas vezes;
* criar uma nova obra sempre que um novo exemplar chega à biblioteca;
* possuir diversos registros bibliográficos idênticos.

Essa abordagem gera inconsistências, dificulta pesquisas, prejudica relatórios e aumenta o custo de manutenção do catálogo.

---

# Decisão Arquitetural

O sistema passa a adotar oficialmente o seguinte modelo:

```text
Catálogo
    │
    └── Obras
            │
            └── Exemplares
```

Onde:

* **Obra** representa o registro bibliográfico.
* **Exemplar** representa o item físico pertencente à obra.

Uma obra pode possuir diversos exemplares.

Um exemplar pertence obrigatoriamente a apenas uma obra.

---

# Regra BR-001 — Não Duplicação de Obras

Antes da criação de uma nova obra o sistema deverá verificar se ela já existe no catálogo.

Essa verificação é obrigatória.

---

# Ordem de Verificação

## 1. ISBN

Se existir ISBN válido:

* procurar obra pelo ISBN;
* caso encontrada, impedir a criação automática de uma nova obra.

---

## 2. Título + Autor

Caso não exista ISBN:

normalizar:

* título
* autor

Se houver correspondência exata:

considerar que a obra já existe.

---

## 3. Similaridade (Evolução futura)

Em versões futuras poderá ser utilizada busca por similaridade.

Exemplos:

* distância de Levenshtein;
* trigram similarity;
* busca semântica.

Essa etapa será apenas sugestiva.

Nunca criará vínculos automaticamente.

---

# Fluxo Oficial de Cadastro

```text
Nova Obra
      │
      ▼
Pesquisar ISBN
      │
      ├── Encontrou
      │
      │      ▼
      │  Obra existente
      │
      │  + Adicionar exemplar
      │
      └── Não encontrou
             │
             ▼
Pesquisar Título + Autor
             │
             ├── Encontrou
             │
             │     ▼
             │ Obra existente
             │
             │ + Adicionar exemplar
             │
             └── Não encontrou
                    │
                    ▼
             Cadastro da nova obra
```

---

# Ações quando uma obra já existir

Caso uma obra correspondente seja encontrada, o sistema deverá apresentar:

* informações da obra;
* quantidade de exemplares;
* disponibilidade atual.

O usuário poderá escolher apenas uma das opções:

* Adicionar novo exemplar;
* Visualizar a obra;
* Cancelar a operação.

O sistema **não deverá criar automaticamente uma nova obra**.

---

# Cadastro de Exemplares

Após a criação de uma obra, os exemplares serão cadastrados separadamente.

Fluxo:

```text
Obra

↓

Salvar

↓

Tela da Obra

↓

Exemplares

↓

Adicionar exemplar
```

Cada exemplar receberá:

* código do exemplar;
* tombo;
* localização;
* estado físico;
* código de barras;
* demais informações patrimoniais.

---

# Objetivos

Esta decisão busca:

* eliminar duplicação de registros bibliográficos;
* centralizar a manutenção dos dados da obra;
* facilitar relatórios;
* melhorar a experiência do bibliotecário;
* permitir crescimento do catálogo sem inconsistências.

---

# Benefícios

Com essa arquitetura:

* uma alteração no título atualiza todos os exemplares;
* novos exemplares não exigem novo cadastro bibliográfico;
* pesquisas retornam obras em vez de registros duplicados;
* empréstimos continuam ocorrendo sobre exemplares;
* futuras funcionalidades como reservas, inventário, RFID e múltiplas unidades poderão ser implementadas sem alterações estruturais.

---

# Impactos

Essa decisão influencia diretamente:

* modelagem do banco de dados;
* APIs de cadastro;
* importação CSV;
* pesquisa;
* empréstimos;
* inventário;
* relatórios;
* interface do usuário.

Todas as novas funcionalidades deverão respeitar esta regra.

---

# Evoluções Futuras

Esta decisão prepara o sistema para a futura criação dos módulos:

* Autores
* Editoras
* Categorias
* Assuntos
* Coleções
* Movimentações de Exemplares
* Reservas
* Inventário Patrimonial
* RFID
* Integração com leitores de código de barras

Essas funcionalidades deverão utilizar esta arquitetura como referência oficial do domínio.
