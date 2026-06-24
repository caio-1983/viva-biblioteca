import { AcervoCreateSchema, AcervoUpdateSchema, AcervoCreate, AcervoUpdate } from '@/src/types/acervo'
import { ZodError } from 'zod'

export interface ValidationResult<T> {
  valid: boolean
  data?: T
  errors?: ReturnType<ZodError['flatten']>
}

export function validateAcervoCreate(data: unknown): ValidationResult<AcervoCreate> {
  const result = AcervoCreateSchema.safeParse(data)
  if (!result.success) {
    return { valid: false, errors: result.error.flatten() }
  }
  return { valid: true, data: result.data }
}

export function validateAcervoUpdate(data: unknown): ValidationResult<AcervoUpdate> {
  const result = AcervoUpdateSchema.safeParse(data)
  if (!result.success) {
    return { valid: false, errors: result.error.flatten() }
  }
  return { valid: true, data: result.data }
}
