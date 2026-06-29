import type { CSSProperties } from 'react'
import type { LabelModel, LabelSlot } from './types'

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Returns a CSS `mm` string. Accurate on screen (96 dpi) and exact on paper. */
const mm = (v: number): string => `${v}mm`

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Total number of label slots on the sheet (columns × rows). */
export function totalSlots(model: LabelModel): number {
  return model.grid.columns * model.grid.rows
}

/**
 * Physical sheet dimensions in CSS pixels at 96 dpi.
 * Used by PrintPreview to compute the scale factor for screen display.
 */
export function getSheetPx(model: LabelModel): { width: number; height: number } {
  const PX_PER_MM = 96 / 25.4
  return {
    width:  Math.round(model.paper.width  * PX_PER_MM),
    height: Math.round(model.paper.height * PX_PER_MM),
  }
}

// ─── Style builders ───────────────────────────────────────────────────────────

/**
 * Inline styles for the sheet container.
 *
 * All measurements use `mm` units so that:
 *   • on screen the browser converts mm → px at the display dpi, and
 *   • on paper the printer uses the physical mm values exactly.
 *
 * CSS Grid places the labels; no absolute positioning is involved.
 */
export function getSheetStyles(model: LabelModel): CSSProperties {
  return {
    width:  mm(model.paper.width),
    height: mm(model.paper.height),
    paddingTop:    mm(model.margins.top),
    paddingRight:  mm(model.margins.right),
    paddingBottom: mm(model.margins.bottom),
    paddingLeft:   mm(model.margins.left),
    display: 'grid',
    gridTemplateColumns: `repeat(${model.grid.columns}, ${mm(model.label.width)})`,
    gridTemplateRows:    `repeat(${model.grid.rows},    ${mm(model.label.height)})`,
    columnGap: mm(model.gap.x),
    rowGap:    mm(model.gap.y),
    boxSizing: 'border-box',
    backgroundColor: 'white',
  }
}

/**
 * Inline styles for a single label cell.
 * The cell is a flex container so content can be centred without extra wrappers.
 */
export function getLabelStyles(model: LabelModel): CSSProperties {
  return {
    width:  mm(model.label.width),
    height: mm(model.label.height),
    overflow: 'hidden',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates a LabelModel for internal consistency.
 *
 * Checks:
 *   • required string fields are non-empty
 *   • grid columns and rows are positive integers
 *   • label and paper dimensions are positive
 *   • margins and gaps are non-negative
 *   • horizontal dimensions sum to paper width   (± 0.5 mm tolerance)
 *   • vertical dimensions sum to paper height    (± 0.5 mm tolerance)
 *
 * Throws a descriptive Error on the first failed check.
 */
export function validateModel(model: LabelModel): void {
  if (!model.id || typeof model.id !== 'string') {
    throw new Error('LabelModel: id must be a non-empty string')
  }
  if (!model.name || typeof model.name !== 'string') {
    throw new Error(`LabelModel "${model.id}": name must be a non-empty string`)
  }
  if (typeof model.version !== 'number' || model.version < 1 || !Number.isInteger(model.version)) {
    throw new Error(`LabelModel "${model.id}": version must be a positive integer, got ${model.version}`)
  }

  // Grid
  if (!Number.isInteger(model.grid.columns) || model.grid.columns < 1) {
    throw new Error(
      `LabelModel "${model.id}": grid.columns must be a positive integer, got ${model.grid.columns}`,
    )
  }
  if (!Number.isInteger(model.grid.rows) || model.grid.rows < 1) {
    throw new Error(
      `LabelModel "${model.id}": grid.rows must be a positive integer, got ${model.grid.rows}`,
    )
  }

  // Dimensions
  if (model.label.width <= 0) {
    throw new Error(`LabelModel "${model.id}": label.width must be > 0, got ${model.label.width}`)
  }
  if (model.label.height <= 0) {
    throw new Error(`LabelModel "${model.id}": label.height must be > 0, got ${model.label.height}`)
  }
  if (model.paper.width <= 0) {
    throw new Error(`LabelModel "${model.id}": paper.width must be > 0, got ${model.paper.width}`)
  }
  if (model.paper.height <= 0) {
    throw new Error(`LabelModel "${model.id}": paper.height must be > 0, got ${model.paper.height}`)
  }

  // Margins
  const { top, right, bottom, left } = model.margins
  if (top < 0 || right < 0 || bottom < 0 || left < 0) {
    throw new Error(`LabelModel "${model.id}": all margins must be >= 0`)
  }

  // Gaps
  if (model.gap.x < 0) {
    throw new Error(`LabelModel "${model.id}": gap.x must be >= 0, got ${model.gap.x}`)
  }
  if (model.gap.y < 0) {
    throw new Error(`LabelModel "${model.id}": gap.y must be >= 0, got ${model.gap.y}`)
  }

  // Dimensional consistency — horizontal
  const TOLERANCE_MM = 0.5
  const computedW =
    left + right +
    model.grid.columns * model.label.width +
    (model.grid.columns - 1) * model.gap.x
  const diffW = Math.abs(computedW - model.paper.width)
  if (diffW > TOLERANCE_MM) {
    throw new Error(
      `LabelModel "${model.id}": horizontal dimensions don't match paper width. ` +
      `Paper=${model.paper.width} mm, computed=${computedW.toFixed(3)} mm ` +
      `(diff=${diffW.toFixed(3)} mm > ${TOLERANCE_MM} mm tolerance). ` +
      `Formula: marginLeft(${left}) + marginRight(${right}) ` +
      `+ columns(${model.grid.columns}) × labelWidth(${model.label.width}) ` +
      `+ (columns-1) × gapX(${model.gap.x})`,
    )
  }

  // Dimensional consistency — vertical
  const computedH =
    top + bottom +
    model.grid.rows * model.label.height +
    (model.grid.rows - 1) * model.gap.y
  const diffH = Math.abs(computedH - model.paper.height)
  if (diffH > TOLERANCE_MM) {
    throw new Error(
      `LabelModel "${model.id}": vertical dimensions don't match paper height. ` +
      `Paper=${model.paper.height} mm, computed=${computedH.toFixed(3)} mm ` +
      `(diff=${diffH.toFixed(3)} mm > ${TOLERANCE_MM} mm tolerance). ` +
      `Formula: marginTop(${top}) + marginBottom(${bottom}) ` +
      `+ rows(${model.grid.rows}) × labelHeight(${model.label.height}) ` +
      `+ (rows-1) × gapY(${model.gap.y})`,
    )
  }
}

/**
 * Validates a start position against a model.
 *
 * @param startAt - 0-based index of the first slot to fill on the sheet.
 *                  Must satisfy: 0 ≤ startAt < totalSlots(model).
 *
 * Throws a descriptive Error when the position is invalid.
 */
export function validateStartAt(startAt: number, model: LabelModel): void {
  if (!Number.isInteger(startAt)) {
    throw new Error(`startAt must be an integer, got ${startAt}`)
  }
  if (startAt < 0) {
    throw new Error(`startAt must be >= 0 (position 1), got ${startAt}`)
  }
  const total = totalSlots(model)
  if (startAt >= total) {
    throw new Error(
      `startAt ${startAt} is out of range for model "${model.id}". ` +
      `Valid range: 0–${total - 1} (positions 1–${total}).`,
    )
  }
}

// ─── Pagination ───────────────────────────────────────────────────────────────

/** Describes the label slots to render on one physical sheet. */
export interface PageLayout {
  /** 0-based position where filling starts on this sheet. */
  startAt: number
  /** Label slots assigned to this sheet, with indices already resolved. */
  slots: LabelSlot[]
}

/**
 * Splits an arbitrarily-large flat list of label slots into pages.
 *
 * The first page starts at `startAt`; subsequent pages always start at 0.
 * This lets you print a partial sheet first (using leftover positions) and
 * then continue with full sheets.
 *
 * Example — 75 slots, startAt=5, model with 30 slots/page:
 *   Page 1 → startAt=5, slots[0..24]   (25 labels, positions 5–29)
 *   Page 2 → startAt=0, slots[25..54]  (30 labels, positions 0–29)
 *   Page 3 → startAt=0, slots[55..74]  (20 labels, positions 0–19)
 *
 * @param model   - Validated LabelModel.
 * @param slots   - Flat list of slots (content only; indices are recomputed).
 * @param startAt - 0-based start position on the first sheet (default: 0).
 *
 * Returns at least one PageLayout even when `slots` is empty.
 */
export function paginateSlots(
  model: LabelModel,
  slots: LabelSlot[],
  startAt: number = 0,
): PageLayout[] {
  validateModel(model)
  validateStartAt(startAt, model)

  const perPage = totalSlots(model)
  const pages: PageLayout[] = []
  let cursor = 0
  let pageStart = startAt

  while (cursor < slots.length) {
    const capacity  = perPage - pageStart
    const pageItems = slots.slice(cursor, cursor + capacity)

    pages.push({
      startAt: pageStart,
      slots: pageItems.map((slot, i) => ({
        ...slot,
        index: pageStart + i,
      })),
    })

    cursor    += capacity
    pageStart  = 0  // every subsequent page fills from position 0
  }

  // Always return at least one page descriptor (empty sheet preview use-case).
  if (pages.length === 0) {
    pages.push({ startAt, slots: [] })
  }

  return pages
}
