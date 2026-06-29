'use client'

import { AlertTriangle, ArrowLeft, BookUp, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { FileDropZone } from '@/components/import/FileDropZone'
import { ImportStats } from '@/components/import/ImportStats'
import { ErrorTable } from '@/components/import/ErrorTable'
import { ImportProgress } from '@/components/import/ImportProgress'
import { ImportSummary } from '@/components/import/ImportSummary'
import { useImport } from '@/hooks/useImport'

export function ImportWorkspace() {
  const { state, setFile, validate, importar, reset } = useImport()
  const { phase } = state

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      <PageHeader
        title="Importar Acervo"
        description="Importe obras e exemplares a partir de uma planilha Excel (.xlsx)"
        breadcrumb={
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Administração
          </Link>
        }
      />

      <Card className="max-w-3xl mx-auto shadow-sm">
        <CardContent className="p-8">
          {/* IDLE / FILE SELECTED */}
          {(phase === 'idle' || phase === 'file_selected') && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-slate-800 mb-1">
                  Selecionar planilha
                </h2>
                <p className="text-sm text-slate-500">
                  O arquivo deve seguir o layout padrão com as colunas obrigatórias.
                </p>
              </div>

              <FileDropZone
                onFile={setFile}
                fileName={state.fileName}
              />

              {phase === 'file_selected' && (
                <div className="flex justify-end">
                  <Button
                    onClick={validate}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Validar planilha
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* VALIDATING */}
          {phase === 'validating' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="rounded-full bg-blue-100 p-4">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-800">Validando planilha…</p>
                <p className="text-sm text-slate-500 mt-1">
                  Lendo e verificando todos os registros.
                </p>
              </div>
            </div>
          )}

          {/* VALIDATED / PREVIEW */}
          {phase === 'validated' && (
            <div className="space-y-6">
              {/* File name banner */}
              <div className="flex items-center justify-between bg-slate-100 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-slate-700">
                  {state.fileName}
                </span>
                <button
                  onClick={reset}
                  className="text-xs text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Trocar arquivo
                </button>
              </div>

              <ImportStats
                totalLinhas={state.totalLinhas}
                linhasValidas={state.linhasValidas}
                totalErros={state.totalErros}
              />

              <ErrorTable errors={state.erros} />

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  {state.linhasValidas > 0 ? (
                    <>
                      <span className="font-semibold text-slate-700">
                        {state.linhasValidas}
                      </span>{' '}
                      registro{state.linhasValidas !== 1 ? 's' : ''} pronto
                      {state.linhasValidas !== 1 ? 's' : ''} para importar
                    </>
                  ) : (
                    'Nenhum registro válido para importar.'
                  )}
                </p>
                <Button
                  onClick={importar}
                  disabled={state.linhasValidas === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white gap-2"
                >
                  <BookUp className="h-4 w-4" />
                  Importar {state.linhasValidas > 0 ? state.linhasValidas : ''}{' '}
                  registro{state.linhasValidas !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}

          {/* IMPORTING */}
          {phase === 'importing' && <ImportProgress />}

          {/* DONE */}
          {phase === 'done' && state.result && (
            <ImportSummary result={state.result} onNewImport={reset} />
          )}

          {/* ERROR */}
          {phase === 'error' && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-5 bg-red-50 rounded-xl border border-red-200">
                <div className="rounded-full bg-red-100 p-2 flex-shrink-0 mt-0.5">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-red-800">
                    {state.errorMessage ?? 'Erro ao processar a planilha'}
                  </p>

                  {state.missingColumns && state.missingColumns.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-red-700 font-medium mb-2">
                        Colunas ausentes:
                      </p>
                      <ul className="space-y-1">
                        {state.missingColumns.map((col) => (
                          <li
                            key={col}
                            className="text-sm text-red-600 font-mono bg-red-100/60 rounded px-2 py-0.5 inline-block mr-1.5 mb-1"
                          >
                            {col}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={reset} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Layout guide */}
      {(phase === 'idle' || phase === 'file_selected') && (
        <Card className="max-w-3xl mx-auto shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Layout da planilha
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              A planilha deve conter exatamente as colunas abaixo. Campos
              obrigatórios são marcados com *.
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
              {[
                { col: 'TÍTULO', required: true },
                { col: 'Subtítulo', required: false },
                { col: 'Autor', required: true },
                { col: 'Edição', required: false },
                { col: 'Ano', required: false },
                { col: 'Editora', required: false },
                { col: 'ISBN', required: false },
                { col: 'Classificação', required: false },
                { col: 'Notação do Autor', required: false },
                { col: 'Assunto1', required: false },
                { col: 'Assunto2', required: false },
                { col: 'Assunto3', required: false },
                { col: 'Tombo', required: false },
                { col: 'Observação', required: false },
              ].map(({ col, required }) => (
                <div key={col} className="flex items-center gap-2 text-xs">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      required ? 'bg-blue-500' : 'bg-slate-300'
                    }`}
                  />
                  <span className="font-mono text-slate-600">{col}</span>
                  {required && (
                    <span className="text-blue-600 font-medium">*</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
