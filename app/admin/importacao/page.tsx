'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, AlertCircle, CheckCircle } from 'lucide-react'

interface AnalysisResult {
  totalRows: number
  columns: {
    found: string[]
    mapped: string[]
    ignored: string[]
  }
}

interface ImportResult {
  total: number
  imported: number
  skipped: number
  errors: Array<{ row: number; reason: string }>
  columns: {
    found: string[]
    mapped: string[]
    ignored: string[]
  }
}

export default function ImportacaoPage() {
  const [file, setFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'upload' | 'analyze' | 'import' | 'result'>('upload')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Por favor, selecione um arquivo CSV')
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError('Por favor, selecione um arquivo')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const content = await file.text()
      const response = await fetch(
        `/api/acervo/import?csv=${encodeURIComponent(content)}`
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao analisar CSV')
      }

      const analysis: AnalysisResult = await response.json()
      setAnalysis(analysis)
      setStep('analyze')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao analisar CSV')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!file) {
      setError('Arquivo não selecionado')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/acervo/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao importar CSV')
      }

      const importResult: ImportResult = await response.json()
      setResult(importResult)
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar CSV')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setAnalysis(null)
    setResult(null)
    setError(null)
    setStep('upload')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Link href="/acervo/consulta">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Importação de Acervo</h1>
            <p className="text-sm text-muted-foreground">
              Importe exemplares de um arquivo CSV
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex gap-2 justify-between">
          {['upload', 'analyze', 'import', 'result'].map((s, i) => (
            <div
              key={s}
              className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition-all ${
                step === s
                  ? 'bg-primary text-primary-foreground'
                  : ['upload', 'analyze', 'import'].includes(step) && i < ['upload', 'analyze', 'import', 'result'].indexOf(step)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i === 0 ? 'Upload' : i === 1 ? 'Análise' : i === 2 ? 'Importar' : 'Resultado'}
            </div>
          ))}
        </div>

        {/* Content */}
        <Card className="border-0 bg-card shadow-lg">
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800">Erro</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {step === 'upload' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-4 text-foreground">
                    Selecione o arquivo CSV
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-input"
                    />
                    <label htmlFor="file-input" className="cursor-pointer block">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="font-medium text-foreground mb-1">
                        Clique para selecionar ou arraste um arquivo
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Aceita apenas arquivos CSV
                      </p>
                    </label>
                  </div>
                </div>

                {file && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      <span className="font-semibold">Arquivo selecionado:</span>{' '}
                      {file.name}
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!file || loading}
                    className="flex-1"
                  >
                    {loading ? 'Analisando...' : 'Analisar CSV'}
                  </Button>
                </div>
              </div>
            )}

            {step === 'analyze' && analysis && (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800">
                    <span className="font-semibold">Total de linhas:</span>{' '}
                    {analysis.totalRows}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Colunas Encontradas
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {analysis.columns.found.length}
                    </p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Colunas Mapeadas
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {analysis.columns.mapped.length}
                    </p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Colunas Ignoradas
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {analysis.columns.ignored.length}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-foreground">
                    Colunas Mapeadas:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.columns.mapped.map((col) => (
                      <span
                        key={col}
                        className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                {analysis.columns.ignored.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-foreground">
                      Colunas Ignoradas:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.columns.ignored.map((col) => (
                        <span
                          key={col}
                          className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button onClick={handleImport} disabled={loading} className="flex-1">
                    {loading ? 'Importando...' : 'Confirmar Importação'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {step === 'result' && result && (
              <div className="space-y-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800">
                      Importação Concluída!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Total Processado
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {result.total}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-2">
                      Importados com Sucesso
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {result.imported}
                    </p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Ignorados (Duplicados)
                    </p>
                    <p className="text-3xl font-bold text-orange-600">
                      {result.skipped}
                    </p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Erros
                    </p>
                    <p className="text-3xl font-bold text-red-600">
                      {result.errors.length}
                    </p>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 text-foreground">Erros Encontrados:</h3>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {result.errors.slice(0, 10).map((err, i) => (
                        <div
                          key={i}
                          className="p-3 bg-red-50 border border-red-200 rounded text-sm"
                        >
                          <p className="text-red-800">
                            <span className="font-semibold">Linha {err.row}:</span> {err.reason}
                          </p>
                        </div>
                      ))}
                      {result.errors.length > 10 && (
                        <p className="text-xs text-muted-foreground p-3">
                          ... e mais {result.errors.length - 10} erros
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Link href="/acervo/consulta" className="flex-1">
                    <Button className="w-full">
                      Ver Acervo Importado
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={handleReset}>
                    Importar Outro Arquivo
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
