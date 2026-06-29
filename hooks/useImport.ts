'use client'

import { useState, useCallback } from 'react'
import { parseExcelFile } from '@/lib/import/parser'
import { validateRows } from '@/lib/import/validator'
import { ImportValidRow, ImportError, ImportResult } from '@/src/types/import'

export type ImportPhase =
  | 'idle'
  | 'file_selected'
  | 'validating'
  | 'validated'
  | 'importing'
  | 'done'
  | 'error'

interface ImportState {
  phase: ImportPhase
  file: File | null
  fileName: string | null
  totalLinhas: number
  linhasValidas: number
  totalErros: number
  erros: ImportError[]
  validRows: ImportValidRow[]
  result: ImportResult | null
  errorMessage: string | null
  missingColumns: string[] | null
}

const INITIAL_STATE: ImportState = {
  phase: 'idle',
  file: null,
  fileName: null,
  totalLinhas: 0,
  linhasValidas: 0,
  totalErros: 0,
  erros: [],
  validRows: [],
  result: null,
  errorMessage: null,
  missingColumns: null,
}

export function useImport() {
  const [state, setState] = useState<ImportState>(INITIAL_STATE)

  const setFile = useCallback((file: File) => {
    setState({
      ...INITIAL_STATE,
      phase: 'file_selected',
      file,
      fileName: file.name,
    })
  }, [])

  const validate = useCallback(async () => {
    setState((s) => ({ ...s, phase: 'validating' }))

    try {
      const buffer = await state.file!.arrayBuffer()
      const parseResult = parseExcelFile(buffer)

      if (!parseResult.ok) {
        setState((s) => ({
          ...s,
          phase: 'error',
          missingColumns: parseResult.missingColumns ?? null,
          errorMessage:
            parseResult.error ??
            (parseResult.missingColumns
              ? 'Colunas obrigatórias ausentes na planilha'
              : 'Erro ao ler arquivo'),
        }))
        return
      }

      const { valid, errors } = validateRows(parseResult.rows)

      setState((s) => ({
        ...s,
        phase: 'validated',
        totalLinhas: parseResult.rows.length,
        linhasValidas: valid.length,
        totalErros: errors.length,
        erros: errors,
        validRows: valid,
      }))
    } catch (err) {
      setState((s) => ({
        ...s,
        phase: 'error',
        errorMessage: `Erro inesperado: ${err instanceof Error ? err.message : 'Desconhecido'}`,
      }))
    }
  }, [state.file])

  const importar = useCallback(async () => {
    setState((s) => ({ ...s, phase: 'importing' }))

    try {
      const res = await fetch('/api/acervo/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: state.validRows }),
      })

      const data = await res.json()

      if (!res.ok || data.erros?.length > 0) {
        // Server found additional tombo conflicts — merge into error list
        const serverErrors: ImportError[] = data.erros ?? []
        setState((s) => {
          const allErros = [...s.erros, ...serverErrors]
          const conflictLines = new Set(serverErrors.map((e) => e.linha))
          const remainingValid = s.validRows.filter(
            (r) => !conflictLines.has(r.linha),
          )
          return {
            ...s,
            phase: 'validated',
            erros: allErros,
            totalErros: allErros.length,
            validRows: remainingValid,
            linhasValidas: remainingValid.length,
          }
        })
        return
      }

      setState((s) => ({
        ...s,
        phase: 'done',
        result: {
          obrasCriadas: data.obrasCriadas,
          exemplaresCriados: data.exemplaresCriados,
          linhasIgnoradas: data.linhasIgnoradas,
          duracaoMs: data.duracaoMs,
        },
      }))
    } catch (err) {
      setState((s) => ({
        ...s,
        phase: 'error',
        errorMessage: `Erro de conexão: ${err instanceof Error ? err.message : 'Desconhecido'}`,
      }))
    }
  }, [state.validRows])

  const reset = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])

  return { state, setFile, validate, importar, reset }
}
