# ADR-007 — Regras de Negócio do Domínio

**Status:** Aprovado
**Data:** 24/06/2026
**Projeto:** VIVA Biblioteca

---

# Objetivo

Consolidar as regras de negócio fundamentais do VIVA Biblioteca.

Este documento define o comportamento esperado do sistema independentemente da tecnologia utilizada.

Todas as funcionalidades deverão respeitar estas regras.

Caso exista conflito entre implementação e este documento, este ADR deverá prevalecer.

---

# Visão do Domínio

O VIVA Biblioteca é composto por dois grandes contextos.

```text
CATÁLOGO
    │
    ├── Obras
    ├── Autores (futuro)
    ├── Editoras (futuro)
    ├── Categorias (futuro)
    └── Assuntos (futuro)

CIRCULAÇÃO
    │
    ├── Exemplares
    ├── Empréstimos
    ├── Reservas (futuro)
    ├── Inventário
    └── Movimentações (futuro)
```

---

# Regra Fundamental

## O sistema gerencia Obras.

O sistema empresta Exemplares.

Essa separação nunca deverá ser quebrada.

---

# Obras

## RN-001

Toda obra representa um único registro bibliográfico.

---

## RN-002

Uma obra pode existir sem possuir exemplares.

Exemplo:

Cadastro realizado antes da chegada dos livros.

---

## RN-003

Uma obra poderá possuir qualquer quantidade de exemplares.

Inclusive apenas um.

---

## RN-004

Uma obra nunca possui status de circulação.

Não existe:

* obra emprestada;
* obra disponível;
* obra reservada.

Esses estados pertencem aos exemplares.

---

# Exemplares

## RN-101

Todo exemplar pertence obrigatoriamente a uma única obra.

---

## RN-102

Todo exemplar possui identidade própria.

---

## RN-103

O código EX identifica exclusivamente um exemplar.

Nunca uma obra.

---

## RN-104

Todo exemplar possui um ciclo de vida independente.

Exemplo:

```text
Disponível

↓

Emprestado

↓

Disponível

↓

Manutenção

↓

Disponível

↓

Baixado
```

---

## RN-105

A exclusão física de exemplares deve ser evitada.

Sempre que possível utilizar:

* inativação;
* baixa patrimonial.

---

# Cadastro

## RN-201

Antes de criar uma obra o sistema deverá procurar correspondências.

Ordem:

1. ISBN
2. Título + Autor

---

## RN-202

Caso exista uma obra correspondente:

O sistema deverá incentivar a criação de um novo exemplar.

Nunca duplicar a obra automaticamente.

---

## RN-203

O cadastro de obra e o cadastro de exemplar são processos distintos.

---

## RN-204

Nenhum exemplar será criado automaticamente após o cadastro da obra.

A criação será uma ação explícita do usuário.

---

# Pesquisa

## RN-301

A pesquisa principal trabalha sobre Obras.

Nunca sobre Exemplares.

---

## RN-302

Os resultados deverão apresentar indicadores agregados.

Exemplo:

```text
Dom Casmurro

5 exemplares

2 disponíveis

3 emprestados
```

---

## RN-303

Ao abrir uma obra o usuário visualizará todos os exemplares individualmente.

---

# Empréstimos

## RN-401

Somente exemplares podem ser emprestados.

---

## RN-402

Todo empréstimo referencia exatamente um exemplar.

---

## RN-403

Um exemplar emprestado não poderá receber novo empréstimo.

---

## RN-404

O sistema deverá localizar automaticamente o primeiro exemplar disponível.

---

## RN-405

A arquitetura deverá permitir seleção manual de exemplares futuramente.

---

# Devoluções

## RN-501

Toda devolução atualiza o status do exemplar.

---

## RN-502

A devolução nunca altera dados da obra.

---

## RN-503

Toda devolução deverá preservar o histórico do empréstimo.

---

# Disponibilidade

## RN-601

A disponibilidade de uma obra é calculada.

Nunca armazenada.

---

## RN-602

A disponibilidade depende exclusivamente dos estados dos exemplares.

---

# Importação

## RN-701

Toda linha importada representa um exemplar.

---

## RN-702

Antes de criar uma obra o sistema deverá executar as regras de deduplicação.

---

## RN-703

Toda importação deverá produzir relatório de auditoria.

---

# Código do Exemplar

## RN-801

Todo exemplar recebe um código EX.

---

## RN-802

O código EX nunca poderá ser alterado.

---

## RN-803

O código nunca será reutilizado.

---

## RN-804

O código é gerado automaticamente.

---

# Banco de Dados

## RN-901

O ID interno do banco nunca será apresentado ao usuário.

---

## RN-902

O usuário trabalha apenas com:

* código do exemplar;
* tombo;
* código de barras.

---

# Exclusão

## RN-1001

Uma obra com exemplares não poderá ser excluída.

---

## RN-1002

Um exemplar com histórico de empréstimos não deverá ser excluído fisicamente.

---

## RN-1003

Registros históricos deverão permanecer disponíveis para auditoria.

---

# Auditoria

Toda ação importante deverá ser auditável.

Exemplos:

* criação de obra;
* criação de exemplar;
* empréstimo;
* devolução;
* baixa;
* alteração de cadastro.

A implementação da entidade de auditoria ocorrerá em fase futura.

---

# Configurações

Todas as regras parametrizáveis deverão ser configuráveis.

Exemplos:

* prazo de empréstimo;
* quantidade máxima de empréstimos;
* padrão do tombo;
* formato do código EX;
* política de renovação.

Nenhum valor deverá permanecer fixo no código.

---

# Princípios Arquiteturais

O domínio deverá seguir os seguintes princípios.

## Simplicidade

A regra deve ser simples de entender.

---

## Consistência

A mesma regra deverá ser utilizada em todo o sistema.

---

## Rastreabilidade

Toda movimentação deverá poder ser reconstruída futuramente.

---

## Evolução

Toda nova funcionalidade deverá respeitar o modelo:

```text
Obra

↓

Exemplar

↓

Circulação
```

---

## Independência Tecnológica

As regras de negócio nunca dependerão de:

* Electron;
* Next.js;
* React;
* Prisma;
* SQLite.

Essas tecnologias apenas implementam o domínio.

---

# Roadmap do Domínio

A arquitetura já deverá suportar evolução para:

### Catálogo

* Autores
* Editoras
* Categorias
* Assuntos
* Coleções

---

### Circulação

* Reservas
* Fila de espera
* Renovação online
* Multas
* Bloqueios

---

### Patrimônio

* Inventário
* RFID
* Etiquetas
* Código de barras
* Transferência entre unidades

---

### Administração

* Auditoria
* Histórico
* Logs
* Configurações
* Permissões

---

# Glossário Oficial

**Obra**
Registro bibliográfico que representa o conteúdo intelectual.

**Exemplar**
Item físico pertencente ao acervo.

**Catálogo**
Conjunto organizado das obras cadastradas.

**Circulação**
Conjunto de processos relacionados aos exemplares.

**Tombo**
Número patrimonial da instituição.

**Código EX**
Identificador funcional único do exemplar.

**Disponibilidade**
Indicador calculado a partir dos estados dos exemplares.

---

# Relação com os ADRs

Este documento consolida todas as decisões tomadas nos ADRs anteriores e funciona como a referência oficial das regras de negócio do VIVA Biblioteca.

* **ADR-001** — Catálogo e Não Duplicação de Obras
* **ADR-002** — Modelagem do Domínio: Obra e Exemplar
* **ADR-003** — Circulação e Empréstimos
* **ADR-004** — Estratégia de Importação do Acervo
* **ADR-005** — Codificação de Exemplares
* **ADR-006** — Arquitetura da Aplicação e Estratégia Desktop

---

# Decisão Final

A partir deste ADR, toda evolução do VIVA Biblioteca deverá preservar os seguintes princípios fundamentais:

1. **O Catálogo representa o conhecimento (Obras).**
2. **A Circulação representa o patrimônio físico (Exemplares).**
3. **Toda operação ocorre sobre Exemplares, nunca sobre Obras.**
4. **O domínio é a principal referência arquitetural do sistema.**

Este documento passa a ser a "Constituição" do domínio do VIVA Biblioteca e deverá orientar todas as futuras implementações, integrações e evoluções do projeto.
