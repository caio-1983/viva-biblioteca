import { describe, it, expect } from 'vitest'
import {
  totalSlots,
  getSheetPx,
  getSheetStyles,
  getLabelStyles,
  validateModel,
  validateStartAt,
  paginateSlots,
} from './engine'
import { TR6580 } from './models/tr6580'
import type { LabelModel, LabelSlot } from './types'

// ─── Fixture helpers ──────────────────────────────────────────────────────────

/** Creates a minimal valid model — override fields to test edge cases. */
function makeModel(overrides: Partial<LabelModel> = {}): LabelModel {
  return { ...TR6580, ...overrides }
}

/** Creates a flat list of N dummy label slots. */
function makeSlots(n: number): LabelSlot[] {
  return Array.from({ length: n }, (_, i) => ({ index: i, content: `slot-${i}` }))
}

// ─── totalSlots ───────────────────────────────────────────────────────────────

describe('totalSlots', () => {
  it('returns 30 for TR6580 (3 × 10)', () => {
    expect(totalSlots(TR6580)).toBe(30)
  })

  it('computes columns × rows', () => {
    const m = makeModel({ grid: { columns: 4, rows: 7 } })
    expect(totalSlots(m)).toBe(28)
  })
})

// ─── getSheetPx ───────────────────────────────────────────────────────────────

describe('getSheetPx', () => {
  it('converts TR6580 paper to px at 96 dpi', () => {
    const { width, height } = getSheetPx(TR6580)
    // 215.9 mm × (96/25.4) ≈ 815.27 → rounded to 815
    expect(width).toBe(Math.round(215.9 * 96 / 25.4))
    // 279.4 mm × (96/25.4) ≈ 1055.43 → rounded to 1055
    expect(height).toBe(Math.round(279.4 * 96 / 25.4))
  })

  it('returns integers', () => {
    const { width, height } = getSheetPx(TR6580)
    expect(Number.isInteger(width)).toBe(true)
    expect(Number.isInteger(height)).toBe(true)
  })
})

// ─── getSheetStyles ───────────────────────────────────────────────────────────

describe('getSheetStyles', () => {
  const styles = getSheetStyles(TR6580)

  it('sets paper width and height in mm', () => {
    expect(styles.width).toBe('215.9mm')
    expect(styles.height).toBe('279.4mm')
  })

  it('sets paddings from model margins', () => {
    expect(styles.paddingTop).toBe('12.7mm')
    expect(styles.paddingRight).toBe('4.8mm')
    expect(styles.paddingBottom).toBe('12.7mm')
    expect(styles.paddingLeft).toBe('4.8mm')
  })

  it('sets CSS Grid with correct column and row templates', () => {
    expect(styles.gridTemplateColumns).toContain('repeat(3,')
    expect(styles.gridTemplateColumns).toContain('66.7mm')
    expect(styles.gridTemplateRows).toContain('repeat(10,')
    expect(styles.gridTemplateRows).toContain('25.4mm')
  })

  it('sets column gap from model gap.x', () => {
    expect(styles.columnGap).toBe('3.1mm')
  })

  it('sets row gap from model gap.y', () => {
    expect(styles.rowGap).toBe('0mm')
  })

  it('uses display grid', () => {
    expect(styles.display).toBe('grid')
  })

  it('contains no hardcoded measurements — every value derives from model', () => {
    // If the model changes, the styles must change too.
    const m2 = makeModel({
      paper:  { name: 'A4', width: 210, height: 297 },
      label:  { width: 50, height: 30 },
      margins: { top: 10, right: 5, bottom: 10, left: 5 },
      gap:    { x: 2, y: 1 },
      grid:   { columns: 4, rows: 9 },
    })
    const s2 = getSheetStyles(m2)
    expect(s2.width).toBe('210mm')
    expect(s2.gridTemplateColumns).toContain('repeat(4,')
    expect(s2.columnGap).toBe('2mm')
  })
})

// ─── getLabelStyles ───────────────────────────────────────────────────────────

describe('getLabelStyles', () => {
  const styles = getLabelStyles(TR6580)

  it('sets label width and height in mm', () => {
    expect(styles.width).toBe('66.7mm')
    expect(styles.height).toBe('25.4mm')
  })

  it('hides overflow', () => {
    expect(styles.overflow).toBe('hidden')
  })

  it('uses flexbox for centering', () => {
    expect(styles.display).toBe('flex')
    expect(styles.alignItems).toBe('center')
    expect(styles.justifyContent).toBe('center')
  })
})

// ─── validateModel ────────────────────────────────────────────────────────────

describe('validateModel', () => {
  it('accepts TR6580 without throwing', () => {
    expect(() => validateModel(TR6580)).not.toThrow()
  })

  it('throws on empty id', () => {
    expect(() => validateModel(makeModel({ id: '' }))).toThrow(/id must be/)
  })

  it('throws on version < 1', () => {
    expect(() => validateModel(makeModel({ version: 0 }))).toThrow(/version/)
  })

  it('throws on non-integer version', () => {
    expect(() => validateModel(makeModel({ version: 1.5 }))).toThrow(/version/)
  })

  it('throws on columns = 0', () => {
    expect(() => validateModel(makeModel({ grid: { columns: 0, rows: 10 } }))).toThrow(/columns/)
  })

  it('throws on rows < 1', () => {
    expect(() => validateModel(makeModel({ grid: { columns: 3, rows: -1 } }))).toThrow(/rows/)
  })

  it('throws on non-integer columns', () => {
    expect(() => validateModel(makeModel({ grid: { columns: 2.5, rows: 10 } }))).toThrow(/columns/)
  })

  it('throws on label.width = 0', () => {
    expect(() => validateModel(makeModel({ label: { width: 0, height: 25.4 } }))).toThrow(/label\.width/)
  })

  it('throws on label.height < 0', () => {
    expect(() => validateModel(makeModel({ label: { width: 66.7, height: -1 } }))).toThrow(/label\.height/)
  })

  it('throws on paper.width = 0', () => {
    expect(() => validateModel(makeModel({ paper: { name: 'Test', width: 0, height: 279.4 } }))).toThrow(/paper\.width/)
  })

  it('throws on negative margin', () => {
    expect(() =>
      validateModel(makeModel({ margins: { top: -1, right: 4.8, bottom: 12.7, left: 4.8 } }))
    ).toThrow(/margins/)
  })

  it('throws on negative gap', () => {
    expect(() => validateModel(makeModel({ gap: { x: -0.1, y: 0 } }))).toThrow(/gap\.x/)
  })

  it('throws when horizontal dimensions do not sum to paper width', () => {
    // Label too wide: 4.8 + 4.8 + 3×100 + 2×3.1 = 315.8 ≠ 215.9
    expect(() =>
      validateModel(makeModel({ label: { width: 100, height: 25.4 } }))
    ).toThrow(/horizontal/)
  })

  it('throws when vertical dimensions do not sum to paper height', () => {
    // Row too tall: 12.7 + 12.7 + 10×50 = 525.4 ≠ 279.4
    expect(() =>
      validateModel(makeModel({ label: { width: 66.7, height: 50 } }))
    ).toThrow(/vertical/)
  })
})

// ─── validateStartAt ──────────────────────────────────────────────────────────

describe('validateStartAt', () => {
  it('accepts startAt = 0 (first position)', () => {
    expect(() => validateStartAt(0, TR6580)).not.toThrow()
  })

  it('accepts startAt = 29 (last position on TR6580)', () => {
    expect(() => validateStartAt(29, TR6580)).not.toThrow()
  })

  it('throws on startAt = 30 (= total slots, out of range)', () => {
    expect(() => validateStartAt(30, TR6580)).toThrow(/out of range/)
  })

  it('throws on negative startAt', () => {
    expect(() => validateStartAt(-1, TR6580)).toThrow(/>=/)
  })

  it('throws on non-integer startAt', () => {
    expect(() => validateStartAt(1.5, TR6580)).toThrow(/integer/)
  })
})

// ─── paginateSlots ────────────────────────────────────────────────────────────

describe('paginateSlots', () => {

  it('returns one empty page when slots list is empty', () => {
    const pages = paginateSlots(TR6580, [], 0)
    expect(pages).toHaveLength(1)
    expect(pages[0].slots).toHaveLength(0)
    expect(pages[0].startAt).toBe(0)
  })

  it('fits exactly 30 slots in one page (startAt=0)', () => {
    const pages = paginateSlots(TR6580, makeSlots(30))
    expect(pages).toHaveLength(1)
    expect(pages[0].slots).toHaveLength(30)
    expect(pages[0].startAt).toBe(0)
  })

  it('splits 31 slots into two pages', () => {
    const pages = paginateSlots(TR6580, makeSlots(31))
    expect(pages).toHaveLength(2)
    expect(pages[0].slots).toHaveLength(30)
    expect(pages[1].slots).toHaveLength(1)
    expect(pages[1].startAt).toBe(0)
  })

  it('splits 75 slots with startAt=5 into correct pages', () => {
    const pages = paginateSlots(TR6580, makeSlots(75), 5)
    // Page 1: capacity = 30-5 = 25 slots
    // Page 2: 30 slots
    // Page 3: 20 slots
    expect(pages).toHaveLength(3)
    expect(pages[0].startAt).toBe(5)
    expect(pages[0].slots).toHaveLength(25)
    expect(pages[1].startAt).toBe(0)
    expect(pages[1].slots).toHaveLength(30)
    expect(pages[2].startAt).toBe(0)
    expect(pages[2].slots).toHaveLength(20)
  })

  it('assigns correct sequential indices within each page', () => {
    const pages = paginateSlots(TR6580, makeSlots(35), 5)
    // Page 1: 25 slots starting at position 5
    const p1 = pages[0]
    expect(p1.slots[0].index).toBe(5)
    expect(p1.slots[24].index).toBe(29)
    // Page 2: 10 slots starting at position 0
    const p2 = pages[1]
    expect(p2.slots[0].index).toBe(0)
    expect(p2.slots[9].index).toBe(9)
  })

  it('throws on invalid startAt', () => {
    expect(() => paginateSlots(TR6580, makeSlots(5), 30)).toThrow(/out of range/)
  })

  it('throws on invalid model (propagates validateModel)', () => {
    const bad = makeModel({ grid: { columns: 0, rows: 10 } })
    expect(() => paginateSlots(bad, makeSlots(5))).toThrow(/columns/)
  })

  it('handles exactly one slot at startAt=29 (last position)', () => {
    const pages = paginateSlots(TR6580, makeSlots(1), 29)
    expect(pages).toHaveLength(1)
    expect(pages[0].startAt).toBe(29)
    expect(pages[0].slots).toHaveLength(1)
    expect(pages[0].slots[0].index).toBe(29)
  })

  it('handles large workload — 300 slots = 10 full pages', () => {
    const pages = paginateSlots(TR6580, makeSlots(300))
    expect(pages).toHaveLength(10)
    pages.forEach(p => {
      expect(p.slots).toHaveLength(30)
      expect(p.startAt).toBe(0)
    })
  })
})
