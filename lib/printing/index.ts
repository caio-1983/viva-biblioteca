// Types
export type { LabelModel, LabelSlot } from './types'

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
