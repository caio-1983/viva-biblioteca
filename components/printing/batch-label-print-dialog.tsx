'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Printer, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2, Info } from 'lucide-react'

import { Modal }             from '@/components/ui/modal'
import { Button }            from '@/components/ui/button'
import { LabelSheet }        from '@/components/printing/label-sheet'
import { PrintPreview }      from '@/components/printing/print-preview'
import { PositionSelector }  from '@/components/printing/position-selector'
import { LombadaLabel }      from '@/components/printing/lombada-label'

import { AVAILABLE_MODELS }  from '@/lib/printing/models/index'
import { paginateSlots }     from '@/lib/printing/engine'
import { obraToLabelData }   from '@/lib/printing/adapters/obra-label.adapter'
import type { ObraParaEtiqueta } from '@/lib/printing/adapters/obra-label.adapter'
import type { LabelData, LabelSlot } from '@/lib/printing/types'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ObraParaLote extends ObraParaEtiqueta {
  obraId:          number
  titulo:          string
  totalExemplares: number
}

export interface BatchLabelPrintDialogProps {
  open:    boolean
  onClose: () => void
  obras:   ObraParaLote[]
}

interface ObraComErro {
  titulo:         string
  camposFaltando: string[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BatchLabelPrintDialog({ open, onClose, obras }: BatchLabelPrintDialogProps) {
  const [startAt,     setStartAt]     = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [status,      setStatus]      = useState<'loading' | 'ready'>('loading')
  const [isMounted,   setIsMounted]   = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  const model = AVAILABLE_MODELS[0]

  // Reset state when dialog opens
  useEffect(() => {
    if (!open) return
    setStatus('loading')
    setCurrentPage(0)
    setStartAt(0)
    const t = setTimeout(() => setStatus('ready'), 200)
    return () => clearTimeout(t)
  }, [open])

  // Reset to first page when startAt changes
  useEffect(() => { setCurrentPage(0) }, [startAt])

  // ── Processar todas as obras ────────────────────────────────────────────────

  const { validLabels, obrasComErro } = useMemo(() => {
    const valid: LabelData[]    = []
    const errors: ObraComErro[] = []

    for (const obra of obras) {
      const result = obraToLabelData(obra, obra.totalExemplares)
      if (result.ok) {
        valid.push(...result.labels)
      } else {
        errors.push({ titulo: obra.titulo, camposFaltando: result.camposFaltando })
      }
    }

    return { validLabels: valid, obrasComErro: errors }
  }, [obras])

  // ── Paginar etiquetas válidas ───────────────────────────────────────────────

  const pages = useMemo(() => {
    if (validLabels.length === 0) return []
    const slots: LabelSlot[] = validLabels.map((data, i) => ({
      index:   i,
      content: <LombadaLabel data={data} model={model} />,
    }))
    return paginateSlots(model, slots, startAt)
  }, [validLabels, startAt, model])

  const totalPages  = pages.length
  const activePage  = pages[currentPage] ?? null
  const labelCount  = validLabels.length
  const errorCount  = obrasComErro.length
  const hasValid    = labelCount > 0

  const description = `${obras.length} obra${obras.length !== 1 ? 's' : ''} selecionada${obras.length !== 1 ? 's' : ''}`

  const handlePrint = useCallback(() => {
    const target = document.querySelector('[data-print-target="catalog-labels"]')
    if (!target) {
      console.error('[BatchLabelPrintDialog] data-print-target ausente no DOM — impressão cancelada')
      return
    }
    window.print()
  }, [])

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      title="Imprimir Etiquetas — Lote"
      description={description}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          {hasValid && (
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="size-3.5" />
              Imprimir {labelCount} etiqueta{labelCount !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">

        {/* ── Estado de carregamento ── */}
        {status === 'loading' && (
          <div className="flex items-center justify-center py-10 text-slate-400 text-sm gap-2">
            <span className="inline-block size-3.5 rounded-full border-2 border-slate-300 border-t-brand-500 animate-spin" />
            Gerando etiquetas...
          </div>
        )}

        {status === 'ready' && (
          <>
            {/* ── Avisos de dados incompletos ── */}
            {errorCount > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {hasValid && (
                      <p className="text-sm font-semibold text-amber-800">
                        {labelCount} etiqueta{labelCount !== 1 ? 's' : ''} {labelCount !== 1 ? 'serão impressas' : 'será impressa'}.
                      </p>
                    )}
                    <p className="text-sm text-amber-700">
                      {errorCount} etiqueta{errorCount !== 1 ? 's' : ''} não {errorCount !== 1 ? 'puderam ser geradas' : 'pôde ser gerada'}.
                    </p>
                  </div>
                </div>

                <div className="border-t border-amber-200 pt-3 space-y-1.5">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Motivos:</p>
                  <ul className="space-y-1">
                    {obrasComErro.map((e, i) => (
                      <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                        <span className="text-amber-500 shrink-0">•</span>
                        <span>
                          <span className="font-medium">{e.titulo}</span>
                          {' — '}
                          {e.camposFaltando.join(', ')} {e.camposFaltando.length === 1 ? 'ausente' : 'ausentes'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ── Nenhuma etiqueta válida ── */}
            {!hasValid && errorCount > 0 && (
              <div className="flex flex-col items-center py-8 text-center gap-2">
                <Info className="size-8 text-slate-300" />
                <p className="text-sm text-slate-500 font-medium">
                  Nenhuma etiqueta pode ser gerada.
                </p>
                <p className="text-xs text-slate-400">
                  Preencha os campos obrigatórios nas obras listadas acima e tente novamente.
                </p>
              </div>
            )}

            {/* ── Status pronto ── */}
            {hasValid && errorCount === 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700">
                  <span className="font-semibold">{labelCount} etiqueta{labelCount !== 1 ? 's' : ''} preparada{labelCount !== 1 ? 's' : ''}.</span>
                  {' '}Pronto para impressão.
                </p>
              </div>
            )}

            {hasValid && errorCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700">
                  <span className="font-semibold">{labelCount} etiqueta{labelCount !== 1 ? 's' : ''} válida{labelCount !== 1 ? 's' : ''} preparada{labelCount !== 1 ? 's' : ''}.</span>
                  {' '}As obras com erro foram ignoradas.
                </p>
              </div>
            )}

            {/* ── Preview ── */}
            {hasValid && activePage && (
              <div className="flex flex-col lg:flex-row gap-5">

                {/* Painel lateral */}
                <div className="space-y-5 lg:w-44 shrink-0">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
                      Posição inicial
                    </p>
                    <PositionSelector model={model} value={startAt} onChange={setStartAt} />
                  </div>

                  <div className="pt-3 border-t border-border/40">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-2">Resumo</p>
                    <dl className="space-y-1.5">
                      <div className="flex justify-between items-baseline gap-2">
                        <dt className="text-xs text-slate-400 shrink-0">Modelo</dt>
                        <dd className="text-xs font-medium text-slate-700 text-right">{model.name}</dd>
                      </div>
                      <div className="flex justify-between items-baseline gap-2">
                        <dt className="text-xs text-slate-400 shrink-0">Folhas</dt>
                        <dd className="text-xs font-medium text-slate-700">{totalPages}</dd>
                      </div>
                      <div className="flex justify-between items-baseline gap-2">
                        <dt className="text-xs text-slate-400 shrink-0">Etiquetas</dt>
                        <dd className="text-xs font-medium text-slate-700">{labelCount}</dd>
                      </div>
                      <div className="flex justify-between items-baseline gap-2">
                        <dt className="text-xs text-slate-400 shrink-0">Posição inicial</dt>
                        <dd className="text-xs font-medium text-slate-700">{startAt + 1}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Preview com navegação */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                      {model.paper.name} · Folha {currentPage + 1} de {totalPages}
                    </p>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                          disabled={currentPage === 0}
                          className="flex items-center justify-center size-6 rounded border border-border/60 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Folha anterior"
                        >
                          <ChevronLeft className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={currentPage === totalPages - 1}
                          className="flex items-center justify-center size-6 rounded border border-border/60 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Próxima folha"
                        >
                          <ChevronRight className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="border border-border/60 rounded-lg overflow-hidden bg-slate-100 p-2">
                    <PrintPreview model={model}>
                      <LabelSheet
                        model={model}
                        slots={activePage.slots}
                        startAt={activePage.startAt}
                        outlined
                      />
                    </PrintPreview>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </Modal>

    {/*
      ── Alvo de impressão — portal direto em document.body ──────────────────
      Fora do Modal para sobreviver ao fechamento do Radix UI DialogPortal.
      Posicionado off-screen (não display:none) para captura correta no print.
    */}
    {isMounted && hasValid && pages.length > 0 && createPortal(
      <div
        style={{ position: 'fixed', left: '-9999px', top: 0 }}
        aria-hidden="true"
        data-print-target="catalog-labels"
      >
        {pages.map((page, pi) => (
          <LabelSheet
            key={pi}
            model={model}
            slots={page.slots}
            startAt={page.startAt}
          />
        ))}
      </div>,
      document.body,
    )}
    </>
  )
}
