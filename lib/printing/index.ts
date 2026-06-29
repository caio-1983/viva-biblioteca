// Types
export type { LabelModel, LabelSlot, LabelData } from './types'

// Engine — style builders
export { totalSlots, getSheetPx, getSheetStyles, getLabelStyles } from './engine'

// Engine — validation
export { validateModel, validateStartAt } from './engine'

// Engine — pagination
export type { PageLayout } from './engine'
export { paginateSlots } from './engine'

// Model registry
export { AVAILABLE_MODELS, getModel } from './models/index'

// Individual models (for tests and direct references within lib/ only)
// Components must import through the registry (getModel / AVAILABLE_MODELS).
export { TR6580 } from './models/tr6580'

// Adapters — domain → LabelData (engine boundary)
export type { ObraParaEtiqueta, AdapterResult } from './adapters/obra-label.adapter'
export { obraToLabelData } from './adapters/obra-label.adapter'
