import type { LabelModel } from '../types'
import { TR6580 } from './tr6580'

/**
 * Central registry of all supported label sheet models.
 *
 * To add a new model:
 *   1. Create  lib/printing/models/<id>.ts   implementing LabelModel.
 *   2. Import it here and add it to AVAILABLE_MODELS.
 *   3. No engine or component changes required.
 */
export const AVAILABLE_MODELS: readonly LabelModel[] = [
  TR6580,
] as const

/**
 * Retrieves a model by its unique id.
 * Throws if the id is not registered — this is a programming error, not a
 * user error, so a hard throw (rather than a null return) is intentional.
 */
export function getModel(id: string): LabelModel {
  const model = AVAILABLE_MODELS.find(m => m.id === id)
  if (!model) {
    const known = AVAILABLE_MODELS.map(m => `"${m.id}"`).join(', ')
    throw new Error(
      `Label model "${id}" is not registered. ` +
      `Known models: ${known}. ` +
      `Add it to lib/printing/models/index.ts.`,
    )
  }
  return model
}
