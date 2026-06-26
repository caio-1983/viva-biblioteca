import { z } from 'zod'

export const EmprestimoCreateSchema = z.object({
  usuarioId: z.number().int().positive(),
  exemplarId: z.number().int().positive(),
  dataEmprestimo: z.coerce.date().optional(),
  dataPrevistaDevolucao: z.coerce.date(),
})

export type EmprestimoCreate = z.infer<typeof EmprestimoCreateSchema>
