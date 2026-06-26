# ADR-004 — Estratégia de Importação do Acervo (CSV)

**Status:** Aprovado
**Data:** 24/06/2026
**Projeto:** VIVA Biblioteca

---

# Objetivo

Definir a estratégia oficial para importação de acervo no VIVA Biblioteca.

Esta decisão estabelece como o sistema deve interpretar arquivos CSV, evitar duplicação de obras e criar exemplares de forma consistente.

---

# Contexto

Historicamente, a importação de planilhas cria um registro para cada linha do arquivo.

Esse comportamento gera diversos problemas:

* duplicação de obras;
* inconsistência bibliográfica;
* múltiplos cadastros do mesmo título;
* manutenção complexa do catálogo.

No VIVA Biblioteca, o processo de importação deverá respeitar o modelo oficial do domínio:

```text
Obra (1)

↓

Exemplar (N)
```

Toda linha importada representa um **Exemplar**, mas antes é necessário identificar a **Obra** correspondente.

---

# Princípio Fundamental

Durante a importação:

**Primeiro identifica-se a Obra.**

**Depois cria-se o Exemplar.**

Nunca o contrário.

---

# Fluxo Geral

```text
Arquivo CSV

↓

Ler linha

↓

Identificar Obra

↓

Obra existe?

↓

SIM
│
└── Criar Exemplar

↓

NÃO

↓

Criar Obra

↓

Criar Exemplar
```

---

# Processo de Identificação

O sistema deverá utilizar a seguinte ordem obrigatória.

---

## Etapa 1 — ISBN

Caso exista ISBN válido:

* normalizar o ISBN;
* pesquisar no catálogo.

Encontrando correspondência:

→ utilizar a Obra existente.

---

## Etapa 2 — Título + Autor

Caso não exista ISBN:

normalizar:

* título
* autor

Pesquisar utilizando ambos.

Encontrando correspondência:

→ reutilizar a Obra existente.

---

## Etapa 3 — Sem correspondência

Caso nenhuma regra encontre correspondência:

→ criar uma nova Obra.

---

# Regras de Normalização

Antes das comparações o sistema deverá:

* remover espaços duplicados;
* remover espaços no início e final;
* ignorar diferença entre maiúsculas e minúsculas;
* remover acentuação;
* padronizar caracteres especiais.

Exemplo:

```text
Dom Casmurro

DOM CASMURRO

dom casmurro

Dom  Casmurro
```

Todos representam o mesmo título.

---

# Registros Incompletos

Caso o arquivo possua apenas:

```text
Título
```

Sem:

* ISBN
* Autor

O sistema **não deverá deduplicar automaticamente**.

Será criada uma nova Obra.

Esse registro deverá ser marcado para revisão posterior.

---

# Casos Ambíguos

Quando houver conflito, o sistema deverá ser conservador.

Exemplo:

Mesmo título

Autores diferentes

↓

Criar nova Obra

↓

Registrar conflito

Nunca unir automaticamente obras diferentes.

---

# Criação de Exemplares

Após identificar a Obra:

Criar um novo Exemplar contendo:

* obraId
* código do exemplar
* tombo
* localização
* estado físico
* origem
* data de aquisição
* observações

Os dados bibliográficos nunca serão duplicados.

---

# Código do Exemplar

Cada exemplar receberá um código único.

Exemplo:

```text
EX000001

EX000002

EX000003
```

O código é exclusivo do Exemplar.

Nunca da Obra.

---

# Relatório de Importação

Ao final de toda importação deverá ser gerado um relatório.

Exemplo:

```text
Importação concluída

Total de linhas:

500

Obras novas:

85

Obras reutilizadas:

415

Exemplares criados:

500

Conflitos:

7

Registros para revisão:

12
```

---

# Relatório de Conflitos

Além do resumo, o sistema deverá gerar um relatório detalhado.

Exemplo:

```text
Linha 35

Título semelhante

Autores diferentes

Ação:

Nova obra criada

-----------------------

Linha 98

ISBN inválido

Ação:

Importado sem deduplicação
```

Esse relatório servirá para auditoria e correção manual.

---

# Dry Run

Toda importação deverá possuir um modo de simulação.

Nesse modo:

* nenhuma alteração é realizada no banco;
* todas as validações são executadas;
* todos os conflitos são identificados;
* é produzido o mesmo relatório da importação real.

O usuário poderá revisar o resultado antes de confirmar.

---

# Regras de Negócio

## RN-201

Toda linha do CSV gera exatamente um Exemplar.

---

## RN-202

Uma nova Obra só poderá ser criada após falha em todas as regras de identificação.

---

## RN-203

ISBN válido possui prioridade absoluta.

---

## RN-204

Título + Autor somente serão utilizados quando não houver ISBN válido.

---

## RN-205

Registros incompletos nunca serão deduplicados automaticamente.

---

## RN-206

Conflitos nunca serão resolvidos automaticamente.

Sempre será preferível criar uma nova Obra do que unir duas Obras diferentes incorretamente.

---

## RN-207

Toda importação deverá gerar relatório de auditoria.

---

## RN-208

Toda importação deverá possuir modo Dry Run.

---

# Evoluções Futuras

A arquitetura deverá permitir novas estratégias de identificação.

Exemplos:

* similaridade por Levenshtein;
* trigram similarity;
* busca semântica;
* integração com APIs bibliográficas por ISBN;
* enriquecimento automático de metadados.

Essas estratégias atuarão apenas como sugestão.

A decisão final continuará sendo controlada pelo sistema e pelo bibliotecário.

---

# Integração com Cadastro Manual

O mesmo mecanismo utilizado na importação deverá ser utilizado no cadastro manual.

Assim:

* cadastro manual;
* importação CSV;
* futuras integrações;

sempre utilizarão exatamente as mesmas regras de identificação de Obras.

Isso garante consistência em todo o sistema.

---

# Benefícios

Esta estratégia proporciona:

* eliminação de duplicidade de obras;
* preservação da qualidade do catálogo;
* criação automática de exemplares;
* auditoria completa das importações;
* segurança na migração de acervos antigos;
* possibilidade de evoluções futuras sem refatorações.

---

# Relação com outros ADRs

* **ADR-001** — Catálogo e Não Duplicação de Obras
* **ADR-002** — Modelagem do Domínio: Obra e Exemplar
* **ADR-003** — Circulação e Empréstimos
* **ADR-005** — Codificação de Exemplares

Este documento estabelece a estratégia oficial de importação de acervo do VIVA Biblioteca, garantindo que toda entrada de dados preserve a integridade do catálogo e respeite o modelo **Obra → Exemplar**.
