# LABEL-001 — Arquitetura de Impressão de Etiquetas

> Branch de origem: `feat/label-printing`
> Implementado em: LABEL-001 / revisado em LABEL-001 architectural review

---

## Visão geral

O módulo de impressão de etiquetas é construído sobre três princípios:

1. **Modelo como fonte única de verdade** — toda medida física vive em um `LabelModel`. Componentes e a engine nunca definem dimensões diretamente.
2. **Engine pura** — `lib/printing/engine.ts` é TypeScript puro sem dependências de UI. Valida modelos, computa CSS e pagina listas de etiquetas.
3. **Mesmo markup para tela e impressora** — `<LabelSheet>` é o único componente que renderiza a grelha. `<PrintPreview>` escala via `transform:scale()` na tela; a impressão usa o elemento oculto com `data-print-target` que não recebe o transform.

---

## Estrutura de arquivos

```
lib/printing/
├── types.ts              Interface LabelModel, LabelSlot
├── engine.ts             Funções puras: validação, estilos CSS, paginação
├── index.ts              Barrel export de toda a lib
└── models/
    ├── index.ts          Registry: AVAILABLE_MODELS + getModel(id)
    └── tr6580.ts         Modelo Pimaco TR6580 (30 etiq, Letter, 3×10)

components/printing/
├── label.tsx             Célula individual dimensionada pelo engine
├── label-sheet.tsx       CSS Grid completo; reutilizado em tela e impressora
├── print-preview.tsx     Escala a folha via ResizeObserver + transform:scale
├── position-selector.tsx Grade mini para escolha de posição inicial
└── index.ts              Barrel export

components/admin/
└── label-printing-section.tsx   UI admin: modelo, seletor, preview, imprimir

app/globals.css           Bloco @media print (visibility trick + @page)
```

---

## Fluxo de dados

```
LabelModel (tr6580.ts)
    │
    ▼
Registry (models/index.ts)  ──getModel(id)──►  LabelPrintingSection
    │
    ▼
engine.ts
    ├── validateModel()         ←── falha rápida em definição incorreta
    ├── validateStartAt()       ←── falha rápida em posição inválida
    ├── getSheetStyles()        ──► <LabelSheet> inline styles
    ├── getLabelStyles()        ──► <Label> inline styles
    ├── getSheetPx()            ──► <PrintPreview> escala de tela
    └── paginateSlots()         ──► divisão automática em páginas
```

---

## LabelModel — especificação

```typescript
interface LabelModel {
  id:          string   // identificador único, ex: 'tr6580'
  name:        string   // nome exibido na UI, ex: 'TR6580'
  description: string   // descrição legível
  version:     number   // revisão (int >= 1); incrementar ao alterar dimensões

  paper: {
    name:   string  // 'Letter', 'A4', etc.
    width:  number  // mm
    height: number  // mm
  }

  grid: {
    columns: number  // inteiro >= 1
    rows:    number  // inteiro >= 1
  }

  label: {
    width:  number  // mm
    height: number  // mm
  }

  margins: {
    top:    number  // mm — entre borda superior e primeira linha de etiquetas
    right:  number  // mm
    bottom: number  // mm
    left:   number  // mm
  }

  gap: {
    x: number  // mm — entre colunas adjacentes
    y: number  // mm — entre linhas adjacentes (0 se não houver espaço)
  }
}
```

### Invariante dimensional

O engine valida que as dimensões somam exatamente ao tamanho do papel (tolerância ±0,5 mm):

```
Horizontal: marginLeft + (columns × labelWidth) + (columns-1) × gapX + marginRight = paper.width
Vertical:   marginTop  + (rows    × labelHeight) + (rows-1)    × gapY + marginBottom = paper.height
```

Se um modelo falhar nessa equação, `validateModel()` lança um erro descritivo antes de qualquer renderização.

---

## Engine — responsabilidades

| Função | Entrada | Saída | Efeito colateral |
|---|---|---|---|
| `totalSlots(model)` | LabelModel | number | nenhum |
| `getSheetPx(model)` | LabelModel | {width, height} px | nenhum |
| `getSheetStyles(model)` | LabelModel | CSSProperties | nenhum |
| `getLabelStyles(model)` | LabelModel | CSSProperties | nenhum |
| `validateModel(model)` | LabelModel | void | lança Error |
| `validateStartAt(n, model)` | number, LabelModel | void | lança Error |
| `paginateSlots(model, slots, startAt?)` | LabelModel, LabelSlot[], number | PageLayout[] | lança Error |

A engine não importa React, não usa state, não tem efeitos colaterais além de erros síncronos.

---

## Impressão — mecanismo CSS

A impressão utiliza a estratégia `visibility:hidden` global + `visibility:visible` local:

```css
@media print {
  /* 1. Silencia tudo */
  body * { visibility: hidden; }

  /* 2. Revela somente o alvo de impressão */
  [data-print-target],
  [data-print-target] * { visibility: visible; }

  /* 3. Âncora o alvo no canto superior esquerdo da página */
  [data-print-target] {
    display: block !important;  /* sobrepõe `hidden` do Tailwind */
    position: fixed;
    inset: 0;
  }

  /* 4. Dimensões da página sem margens do browser */
  @page {
    size: letter portrait;
    margin: 0;
  }
}
```

**Por que não modificar a sidebar/header?**
A estratégia `visibility:hidden` em `body *` oculta toda a árvore DOM sem precisar adicionar classes individuais em nenhum elemento de layout. Apenas o `[data-print-target]` fica visível.

**Por que `[data-print-target]` e não uma classe?**
Atributos `data-*` são semânticos e não entram em conflito com sistemas de classes (Tailwind, BEM, etc.). Facilitam seleção específica e não aparecem como utility classes.

---

## Paginação de etiquetas

Para imprimir um número arbitrário de etiquetas (ex: todos os exemplares do acervo), use `paginateSlots()`:

```typescript
import { paginateSlots, getModel } from '@/lib/printing'

const model = getModel('tr6580')
const pages = paginateSlots(model, slots, startAt)

// pages[0] → { startAt: N, slots: [...] }   primeira folha (pode ter espaços)
// pages[1] → { startAt: 0, slots: [...] }   folhas seguintes sempre cheias
// pages[N] → { startAt: 0, slots: [...] }   última folha (pode ser parcial)
```

A UI de múltiplas páginas (ex: `for page of pages → <LabelSheet>`) fica inteiramente fora da engine e pode ser implementada na LABEL-002 sem alterar nenhum arquivo da lib.

---

## Como adicionar um novo modelo

1. Criar `lib/printing/models/<id>.ts` implementando `LabelModel`:

   ```typescript
   import type { LabelModel } from '../types'

   export const MEU_MODELO: LabelModel = {
     id:      'meu-modelo',
     name:    'Meu Modelo',
     version: 1,
     // ... dimensões exatas
   }
   ```

2. Registrar em `lib/printing/models/index.ts`:

   ```typescript
   import { MEU_MODELO } from './meu-modelo'

   export const AVAILABLE_MODELS = [TR6580, MEU_MODELO] as const
   ```

3. Verificar: `validateModel(MEU_MODELO)` não deve lançar.

4. Nenhum componente, nenhuma engine, nenhum CSS precisa ser alterado.

---

## Boas práticas

| Regra | Motivo |
|---|---|
| Nunca definir mm diretamente em componentes | Modelos mudam; componentes não deveriam |
| Sempre chamar `validateModel()` no bootstrap | Detecta erros de digitação em modelos novos cedo |
| Importar modelos através do registry | Permite substituição, mock em testes, listagem dinâmica |
| Não usar `position: absolute` na grelha | CSS Grid garante alinhamento preciso sem cálculos manuais |
| `version` incremental em modelos | Permite detectar dados armazenados com versão desatualizada |
| Testar `paginateSlots` ao adicionar modelo | Confirma que as dimensões somam ao tamanho do papel |

---

## Sugestões para LABEL-002

1. **Impressão de etiquetas reais** — implementar `ExemplarLabelContent` e integrar com a consulta de exemplares do acervo.
2. **UI de múltiplas páginas** — exibir `paginateSlots()` em um carrossel ou lista de folhas com navegação.
3. **Seletor de modelo na UI** — exibir `AVAILABLE_MODELS` em um select e persistir a escolha em `Configuracao`.
4. **Seleção de exemplares** — permitir selecionar quais exemplares imprimir etiquetas (checkbox na listagem de inventário).
5. **Barcode/QR** — adicionar um campo opcional `barcode?: string` ao `LabelSlot` e um componente `BarcodeLabel`.
6. **Impressão em lote** — usar `paginateSlots` para gerar todas as páginas e imprimir via um iframe oculto (sem abrir diálogo do browser para cada folha).
