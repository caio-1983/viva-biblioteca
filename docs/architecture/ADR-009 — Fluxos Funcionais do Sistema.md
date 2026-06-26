# ADR-009 — Fluxos Funcionais do Sistema

**Status:** Aprovado
**Data:** 24/06/2026
**Projeto:** VIVA Biblioteca

---

# Objetivo

Documentar os principais fluxos funcionais do VIVA Biblioteca.

Este documento descreve a jornada do usuário dentro do sistema e estabelece o comportamento esperado de cada processo.

Todos os fluxos deverão respeitar os ADRs anteriores.

---

# Mapa Geral

```text
                  VIVA Biblioteca

                        │
        ┌───────────────┼────────────────┐
        │               │                │

   Catálogo       Circulação      Administração

        │               │                │

   Obras         Empréstimos      Configurações

   Exemplares    Devoluções       Usuários

   Pesquisa      Renovação        Relatórios

                 Inventário
```

---

# Fluxo 01 — Cadastro de Obra

Objetivo:

Cadastrar um novo registro bibliográfico.

Fluxo:

```text
Nova Obra

↓

Pesquisar ISBN

↓

ISBN encontrado?

↓

SIM

↓

Mostrar Obra existente

↓

Adicionar Exemplar

↓

FIM

-----------------------------

NÃO

↓

Pesquisar Título + Autor

↓

Encontrou?

↓

SIM

↓

Mostrar Obra existente

↓

Adicionar Exemplar

↓

FIM

-----------------------------

NÃO

↓

Cadastrar Obra

↓

Salvar

↓

Abrir detalhes da Obra
```

---

# Fluxo 02 — Cadastro de Exemplar

Objetivo:

Adicionar uma nova cópia física.

Fluxo:

```text
Abrir Obra

↓

Exemplares

↓

Adicionar Exemplar

↓

Gerar Código EX

↓

Informar

Tombo

Estado

Localização

Aquisição

↓

Salvar
```

Resultado:

```text
Obra

↓

Novo Exemplar
```

---

# Fluxo 03 — Pesquisa

Objetivo:

Localizar obras.

Fluxo:

```text
Pesquisar

↓

Título

Autor

ISBN

Código EX

Tombo

↓

Resultados
```

Resultado esperado:

```text
Dom Casmurro

Machado de Assis

5 Exemplares

2 Disponíveis

3 Emprestados
```

---

# Fluxo 04 — Empréstimo

Objetivo:

Emprestar um exemplar.

Fluxo:

```text
Selecionar Leitor

↓

Pesquisar Obra

↓

Selecionar Obra

↓

Existe exemplar disponível?

↓

SIM

↓

Selecionar automaticamente

↓

Registrar empréstimo

↓

Atualizar status

↓

Concluir
```

Caso não exista exemplar:

```text
Indisponível

↓

Oferecer Reserva

(Futuro)
```

---

# Fluxo 05 — Devolução

Objetivo:

Registrar devolução.

Fluxo:

```text
Ler Código EX

↓

Localizar empréstimo

↓

Registrar devolução

↓

Atualizar status

↓

Disponível
```

---

# Fluxo 06 — Renovação

Fluxo:

```text
Localizar empréstimo

↓

Validar regras

↓

Atualizar data prevista

↓

Salvar
```

---

# Fluxo 07 — Importação CSV

Fluxo:

```text
Selecionar arquivo

↓

Dry Run

↓

Relatório

↓

Confirmar

↓

Importação

↓

Relatório Final
```

Para cada linha:

```text
Identificar Obra

↓

Existe?

↓

SIM

↓

Criar Exemplar

↓

NÃO

↓

Criar Obra

↓

Criar Exemplar
```

---

# Fluxo 08 — Inventário

Fluxo:

```text
Iniciar Inventário

↓

Ler Código EX

↓

Confirmar localização

↓

Registrar leitura

↓

Próximo exemplar
```

Ao final:

```text
Itens encontrados

Itens ausentes

Itens divergentes
```

---

# Fluxo 09 — Impressão de Etiquetas

Fluxo:

```text
Selecionar Obra

↓

Selecionar Exemplares

↓

Gerar Etiquetas

↓

Enviar para Impressora
```

Cada etiqueta deverá conter:

* Código EX
* Código de Barras
* Título
* Biblioteca

---

# Fluxo 10 — Baixa Patrimonial

Fluxo:

```text
Selecionar Exemplar

↓

Motivo

↓

Confirmar

↓

Status

BAIXADO
```

O exemplar permanece no histórico.

---

# Fluxo 11 — Busca Rápida

Objetivo:

Localizar rapidamente qualquer registro.

Critérios aceitos:

* ISBN
* Código EX
* Tombo
* Título
* Autor

O sistema deverá identificar automaticamente o tipo da pesquisa.

---

# Fluxo 12 — Dashboard

Ao iniciar o sistema deverão ser apresentados indicadores gerais.

Exemplo:

```text
Obras

12.431

──────────────

Exemplares

18.502

──────────────

Emprestados

431

──────────────

Disponíveis

18.071

──────────────

Leitores

2.351
```

Todos os indicadores serão calculados automaticamente.

---

# Fluxo 13 — Backup

Fluxo:

```text
Configurações

↓

Backup

↓

Selecionar destino

↓

Compactar banco

↓

Backup concluído
```

---

# Fluxo 14 — Restauração

Fluxo:

```text
Selecionar Backup

↓

Validar

↓

Confirmar

↓

Restaurar Banco
```

---

# Fluxo 15 — Atualização do Sistema

Desktop:

```text
Nova versão

↓

Download

↓

Instalar

↓

Reiniciar
```

Nenhum dado poderá ser perdido.

---

# Fluxos Futuros

O sistema já deverá permitir evolução para:

* Reservas
* Multas
* Autoatendimento
* RFID
* Múltiplas bibliotecas
* Transferência entre unidades

Esses fluxos deverão respeitar o modelo:

```text
Obra

↓

Exemplar

↓

Circulação
```

---

# Princípios dos Fluxos

Todos os fluxos deverão seguir:

### Simplicidade

Poucos passos.

---

### Consistência

Mesmo comportamento em todo o sistema.

---

### Segurança

Nenhuma operação crítica sem confirmação.

---

### Rastreabilidade

Toda ação importante deverá gerar histórico.

---

### Performance

Pesquisas e empréstimos deverão ocorrer em poucos cliques.

---

# Relação com outros ADRs

* ADR-001 — Catálogo e Não Duplicação de Obras
* ADR-002 — Modelagem do Domínio
* ADR-003 — Circulação
* ADR-004 — Importação
* ADR-005 — Codificação
* ADR-006 — Arquitetura
* ADR-007 — Regras de Negócio
* ADR-008 — Modelo de Dados

---

# Decisão Final

Todos os novos módulos do VIVA Biblioteca deverão ser desenvolvidos respeitando os fluxos definidos neste documento.

Alterações nesses fluxos deverão ser registradas por meio de um novo ADR ou de uma revisão deste documento, garantindo que a experiência do usuário permaneça consistente em toda a aplicação.
