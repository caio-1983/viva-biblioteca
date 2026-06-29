'use client'

import { useState, useMemo } from 'react'
import { Printer, AlertTriangle } from 'lucide-react'

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
  const [startAt, setStartAt] = useState(0)
  const model = AVAILABLE_MODELS[0]

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

  const firstPage = pages[0] ?? null
  const labelCount = quantity
  const pageCount  = pages.length
  const description = obra.titulo
    ? `${labelCount} etiqueta${labelCount !== 1 ? 's' : ''} — ${obra.titulo}`
    : `${labelCount} etiqueta${labelCount !== 1 ? 's' : ''}`

  return (
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
            <Button onClick={() => window.print()} className="gap-2">
              <Printer className="size-3.5" />
              Imprimir
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5">

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

        {/* ── Controles + Preview ── */}
        {adapterResult.ok && firstPage && (
          <div className="flex flex-col lg:flex-row gap-5">

            {/* Controles: posição + resumo */}
            <div className="space-y-5 lg:w-44 shrink-0">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
                  Posição inicial
                </p>
                <PositionSelector model={model} value={startAt} onChange={setStartAt} />
              </div>

              <div className="pt-3 border-t border-border/40 space-y-1">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Resumo</p>
                <p className="text-xs text-slate-600">
                  <span className="font-medium">{labelCount}</span>{' '}
                  etiqueta{labelCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-slate-400">
                  {pageCount} folha{pageCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Preview — primeira folha com escalonamento */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide text-center mb-2">
                Pré-visualização — {model.paper.name} · Folha 1 de {pageCount}
              </p>
              <div className="border border-border/60 rounded-lg overflow-hidden bg-slate-100 p-2">
                <PrintPreview model={model}>
                  <LabelSheet
                    model={model}
                    slots={firstPage.slots}
                    startAt={firstPage.startAt}
                    outlined
                  />
                </PrintPreview>
              </div>
            </div>
          </div>
        )}

        {/*
          ── Alvo de impressão ──────────────────────────────────────────────────
          Oculto na tela; o @media print em globals.css torna este elemento
          o único visível, posicionado em fixed; inset: 0 no tamanho real (mm).
          Todas as folhas são renderizadas aqui para impressão em lote.
        */}
        {adapterResult.ok && (
          <div
            className="hidden"
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
          </div>
        )}

      </div>
    </Modal>
  )
}
