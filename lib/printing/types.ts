import type { ReactNode } from 'react'

/** Physical specifications of a label sheet model. */
export interface LabelModel {
  /** Unique identifier used by the engine (e.g. 'tr6580') */
  id: string
  /** Display name shown in UI (e.g. 'TR6580') */
  name: string
  /** Human-readable description */
  description: string
  /**
   * Model revision number.
   * Increment when physical dimensions change so consumers can detect stale data.
   * Start at 1; never reset.
   */
  version: number
  /** Paper (physical sheet) dimensions in millimetres */
  paper: {
    name: string    // 'Letter', 'A4', etc.
    width: number   // mm
    height: number  // mm
  }
  /** Grid layout of labels on the sheet */
  grid: {
    columns: number
    rows: number
  }
  /** Individual label dimensions in millimetres */
  label: {
    width: number   // mm
    height: number  // mm
  }
  /**
   * Sheet margins in millimetres — space between the paper edge
   * and the first/last label in each direction.
   */
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  /** Gap between adjacent labels in millimetres */
  gap: {
    x: number  // horizontal — between columns
    y: number  // vertical — between rows
  }
}

/** Pure domain data for a spine label (etiqueta de lombada). */
export interface LabelData {
  cdd: string
  cutter: string
  ano: number | string
  edicao: string
}

/** Content for a single label slot. */
export interface LabelSlot {
  /** 0-based position index on the sheet */
  index: number
  /** Anything React can render */
  content: ReactNode
}
