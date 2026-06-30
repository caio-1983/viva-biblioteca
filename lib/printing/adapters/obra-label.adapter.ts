import type { LabelData } from '../types'

/**
 * Minimal obra fields required by the adapter.
 * No Prisma types or domain models cross this boundary —
 * the engine stays completely decoupled from the acervo domain.
 */
export interface ObraParaEtiqueta {
  classificacao: string | null | undefined
  cutter:        string | null | undefined
  anoPublicacao: number | null | undefined
  edicao:        string | null | undefined
}

export type AdapterResult =
  | { ok: true;  labels: LabelData[] }
  | { ok: false; camposFaltando: string[] }

/**
 * Converts obra metadata into an array of LabelData for spine labels.
 *
 * Returns { ok: false, camposFaltando } when any required field is absent so
 * the UI can show a targeted message without ever calling window.print().
 *
 * @param obra     - Plain obra metadata (not a Prisma model).
 * @param quantity - Number of copies registered (one label per exemplar).
 */
export function obraToLabelData(obra: ObraParaEtiqueta, quantity: number): AdapterResult {
  const camposFaltando: string[] = []

  if (!obra.classificacao?.trim()) camposFaltando.push('CDD')
  if (!obra.cutter?.trim())        camposFaltando.push('Cutter-Sanborn')

  if (camposFaltando.length > 0) return { ok: false, camposFaltando }

  const base: LabelData = {
    cdd:    obra.classificacao!.trim(),
    cutter: obra.cutter!.trim(),
    ano:    obra.anoPublicacao ?? '',
    edicao: obra.edicao?.trim() ?? '',
  }

  return {
    ok:     true,
    labels: Array.from({ length: quantity }, () => base),
  }
}
