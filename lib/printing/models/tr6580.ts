import type { LabelModel } from '../types'

/**
 * Pimaco TR6580 — 30 etiquetas por folha Letter (3 colunas × 10 linhas).
 *
 * Medidas verificadas algebricamente:
 *   Horizontal: 4,8 + 66,7 + 3,1 + 66,7 + 3,1 + 66,7 + 4,8 = 215,9 mm ✓
 *   Vertical:  12,7 + (10 × 25,4) + (9 × 0) + 12,7        = 279,4 mm ✓
 */
export const TR6580: LabelModel = {
  id: 'tr6580',
  name: 'TR6580',
  description: 'Pimaco TR6580 — 30 etiquetas, 3 colunas × 10 linhas, papel Letter',
  version: 1,
  paper: {
    name: 'Letter',
    width:  215.9,  // 8,5"
    height: 279.4,  // 11"
  },
  grid: {
    columns: 3,
    rows:    10,
  },
  label: {
    width:  66.7,  // mm
    height: 25.4,  // mm (1")
  },
  margins: {
    top:    12.7,  // mm (0,5")
    right:   4.8,  // mm
    bottom: 12.7,  // mm (0,5")
    left:    4.8,  // mm
  },
  gap: {
    x: 3.1,  // mm — entre colunas
    y: 0,    // mm — sem espaço entre linhas
  },
}
