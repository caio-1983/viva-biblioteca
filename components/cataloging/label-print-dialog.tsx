'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Printer, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'

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
import type { LabelSlot }    from '@/lib/printing/types'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface LabelPrintDialogProps {
  open:     boolean
  onClose:  () => void
  obra:     ObraParaEtiqueta & { titulo?: string | null }
  quantity: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LabelPrintDialog({ open, onClose, obra, quantity }: LabelPrintDialogProps) {
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
    const t = setTimeout(() => setStatus('ready'), 180)
    return () => clearTimeout(t)
  }, [open])

  // Reset page when startAt changes
  useEffect(() => { setCurrentPage(0) }, [startAt])

  const adapterResult = useMemo(
    () => obraToLabelData(obra, quantity),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [obra.classificacao, obra.cutter, obra.anoPublicacao, obra.edicao, quantity],
  )

  const pages = useMemo(() => {
    if (!adapterResult.ok) return []
    const slots: LabelSlot[] = adapterResult.labels.map((data, i) => ({
      index:   i,
      content: <LombadaLabel data={data} model={model} />,
    }))
    return paginateSlots(model, slots, startAt)
  }, [adapterResult, startAt, model])

  const totalPages  = pages.length
  const activePage  = pages[currentPage] ?? null
  const labelCount  = adapterResult.ok ? quantity : 0
  const description = obra.titulo
    ? `${labelCount} etiqueta${labelCount !== 1 ? 's' : ''} — ${obra.titulo}`
    : `${labelCount} etiqueta${labelCount !== 1 ? 's' : ''}`

  const handlePrint = useCallback(() => {
    const target = document.querySelector('[data-print-target="catalog-labels"]')
    if (!target) {
      console.error('[LabelPrintDialog] data-print-target ausente no DOM — impressão cancelada')
      return
    }
    window.print()
  }, [])

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      title="Imprimir Etiquetas"
      description={description}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          {adapterResult.ok && (
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="size-3.5" />
              Imprimir
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">

        {/* ── Erro de validação ── */}
        {!adapterResult.ok && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600 shrink-0" />
              <p className="text-sm font-semibold text-amber-800">
                Não é possível gerar as etiquetas
              </p>
            </div>
            <p className="text-sm text-amber-700">
              Os seguintes campos precisam ser preenchidos na Obra antes da impressão:
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              {adapterResult.camposFaltando.map(campo => (
                <li key={campo} className="text-sm font-medium text-amber-800">{campo}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Estado de carregamento ── */}
        {adapterResult.ok && status === 'loading' && (
          <div className="flex items-center justify-center py-10 text-slate-400 text-sm gap-2">
            <span className="inline-block size-3.5 rounded-full border-2 border-slate-300 border-t-brand-500 animate-spin" />
            Gerando etiquetas...
          </div>
        )}

        {/* ── Conteúdo pronto ── */}
        {adapterResult.ok && status === 'ready' && (
          <>
            {/* Status — pronto para impressão */}
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-700">
                <span className="font-semibold">{labelCount} etiqueta{labelCount !== 1 ? 's' : ''} preparada{labelCount !== 1 ? 's' : ''}.</span>
                {' '}Pronto para impressão.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-5">

              {/* ── Painel lateral: posição + resumo ── */}
              <div className="space-y-5 lg:w-44 shrink-0">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
                    Posição inicial
                  </p>
                  <PositionSelector model={model} value={startAt} onChange={setStartAt} />
                </div>

                {/* Resumo da impressão */}
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

              {/* ── Preview ── */}
              <div className="flex-1 min-w-0">
                {/* Header do preview com navegação */}
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
                  {activePage && (
                    <PrintPreview model={model}>
                      <LabelSheet
                        model={model}
                        slots={activePage.slots}
                        startAt={activePage.startAt}
                        outlined
                      />
                    </PrintPreview>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </Modal>

    {/*
      ── Alvo de impressão — portal direto em document.body ──────────────────
      Renderizado FORA do Modal para não ser removido quando o Radix UI
      desmontar o DialogPortal. Posicionado off-screen (não display:none)
      para garantir captura correta pelo @media print.
      Condicionado nos dados (adapterResult.ok), não em `open`, para
      sobreviver a qualquer evento de fechamento do dialog durante a impressão.
    */}
    {isMounted && adapterResult.ok && pages.length > 0 && createPortal(
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
