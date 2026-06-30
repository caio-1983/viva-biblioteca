import { describe, it, expect } from 'vitest'
import { obraToLabelData } from './obra-label.adapter'
import { paginateSlots } from '../engine'
import { TR6580 } from '../models/tr6580'
import type { LabelSlot } from '../types'

// ─── Adapter unit tests ───────────────────────────────────────────────────────

describe('obraToLabelData', () => {
  const obraCompleta = {
    classificacao: '220.6',
    cutter:        'B576a',
    anoPublicacao: 2023,
    edicao:        '2ª edição',
  }

  describe('geração de LabelData', () => {
    it('retorna ok:true com array do tamanho correto', () => {
      const result = obraToLabelData(obraCompleta, 5)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.labels).toHaveLength(5)
    })

    it('retorna ok:true para quantidade 1', () => {
      const result = obraToLabelData(obraCompleta, 1)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.labels).toHaveLength(1)
    })

    it('retorna ok:true para quantidade 0 (array vazio)', () => {
      const result = obraToLabelData(obraCompleta, 0)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.labels).toHaveLength(0)
    })

    it('preenche todos os campos corretamente', () => {
      const result = obraToLabelData(obraCompleta, 3)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      for (const label of result.labels) {
        expect(label.cdd).toBe('220.6')
        expect(label.cutter).toBe('B576a')
        expect(label.ano).toBe(2023)
        expect(label.edicao).toBe('2ª edição')
      }
    })

    it('faz trim nos campos de texto', () => {
      const result = obraToLabelData(
        { classificacao: '  220.6  ', cutter: '  B576a  ', anoPublicacao: 2023, edicao: '  2ª ed  ' },
        1,
      )
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.labels[0].cdd).toBe('220.6')
      expect(result.labels[0].cutter).toBe('B576a')
      expect(result.labels[0].edicao).toBe('2ª ed')
    })
  })

  // ─── Ausência de campos obrigatórios ────────────────────────────────────────

  describe('ausência de campos obrigatórios', () => {
    it('retorna ok:false quando CDD está ausente', () => {
      const result = obraToLabelData({ ...obraCompleta, classificacao: null }, 1)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.camposFaltando).toContain('CDD')
    })

    it('retorna ok:false quando CDD é string vazia', () => {
      const result = obraToLabelData({ ...obraCompleta, classificacao: '   ' }, 1)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.camposFaltando).toContain('CDD')
    })

    it('retorna ok:false quando Cutter está ausente', () => {
      const result = obraToLabelData({ ...obraCompleta, cutter: null }, 1)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.camposFaltando).toContain('Cutter-Sanborn')
    })

    it('retorna ok:false quando Cutter é string vazia', () => {
      const result = obraToLabelData({ ...obraCompleta, cutter: '' }, 1)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.camposFaltando).toContain('Cutter-Sanborn')
    })

    it('retorna ok:false quando Ano está ausente', () => {
      const result = obraToLabelData({ ...obraCompleta, anoPublicacao: null }, 1)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.camposFaltando).toContain('Ano de publicação')
    })

    it('retorna ok:false quando Edição está ausente', () => {
      const result = obraToLabelData({ ...obraCompleta, edicao: null }, 1)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.camposFaltando).toContain('Edição')
    })

    it('lista todos os campos faltando de uma vez', () => {
      const result = obraToLabelData(
        { classificacao: null, cutter: null, anoPublicacao: null, edicao: null },
        1,
      )
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.camposFaltando).toContain('CDD')
      expect(result.camposFaltando).toContain('Cutter-Sanborn')
      expect(result.camposFaltando).toContain('Ano de publicação')
      expect(result.camposFaltando).toContain('Edição')
      expect(result.camposFaltando).toHaveLength(4)
    })

    it('retorna ok:false quando campos são undefined', () => {
      const result = obraToLabelData(
        { classificacao: undefined, cutter: undefined, anoPublicacao: undefined, edicao: undefined },
        1,
      )
      expect(result.ok).toBe(false)
    })
  })
})

// ─── Integração com paginateSlots ─────────────────────────────────────────────

describe('obraToLabelData + paginateSlots', () => {
  const obraCompleta = {
    classificacao: '220.6',
    cutter:        'B576a',
    anoPublicacao: 2023,
    edicao:        '2ª edição',
  }

  function toSlots(quantity: number): LabelSlot[] {
    const result = obraToLabelData(obraCompleta, quantity)
    if (!result.ok) throw new Error('adapter falhou')
    return result.labels.map((_, i) => ({ index: i, content: null }))
  }

  it('30 etiquetas → 1 folha', () => {
    const pages = paginateSlots(TR6580, toSlots(30))
    expect(pages).toHaveLength(1)
    expect(pages[0].slots).toHaveLength(30)
  })

  it('75 etiquetas → 3 folhas', () => {
    const pages = paginateSlots(TR6580, toSlots(75))
    expect(pages).toHaveLength(3)
    expect(pages[0].slots).toHaveLength(30)
    expect(pages[1].slots).toHaveLength(30)
    expect(pages[2].slots).toHaveLength(15)
  })

  it('múltiplas folhas: total correto', () => {
    const pages = paginateSlots(TR6580, toSlots(85))
    const total = pages.reduce((acc, p) => acc + p.slots.length, 0)
    expect(total).toBe(85)
  })

  it('startAt=5 com 25 etiquetas → página 1 com 25 slots, startAt=5', () => {
    const pages = paginateSlots(TR6580, toSlots(25), 5)
    expect(pages).toHaveLength(1)
    expect(pages[0].startAt).toBe(5)
    expect(pages[0].slots).toHaveLength(25)
  })

  it('startAt=10 com 30 etiquetas → 2 folhas', () => {
    // Folha 1: posições 10–29 = 20 slots; Folha 2: posições 0–9 = 10 slots
    const pages = paginateSlots(TR6580, toSlots(30), 10)
    expect(pages).toHaveLength(2)
    expect(pages[0].startAt).toBe(10)
    expect(pages[0].slots).toHaveLength(20)
    expect(pages[1].startAt).toBe(0)
    expect(pages[1].slots).toHaveLength(10)
  })

  it('1 etiqueta → 1 folha com 1 slot', () => {
    const pages = paginateSlots(TR6580, toSlots(1))
    expect(pages).toHaveLength(1)
    expect(pages[0].slots).toHaveLength(1)
  })
})

// ─── LABEL-003: fluxo operacional ─────────────────────────────────────────────

describe('LABEL-003 — Impressão de uma obra (1 exemplar)', () => {
  it('gera exatamente 1 etiqueta e 1 folha', () => {
    const result = obraToLabelData(
      { classificacao: '200', cutter: 'C123b', anoPublicacao: 2020, edicao: '1ª ed.' },
      1,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.labels).toHaveLength(1)
    const pages = paginateSlots(TR6580, result.labels.map((_, i) => ({ index: i, content: null })))
    expect(pages).toHaveLength(1)
    expect(pages[0].slots).toHaveLength(1)
    expect(pages[0].startAt).toBe(0)
  })
})

describe('LABEL-003 — Impressão de múltiplas obras (lote)', () => {
  const obra1 = { classificacao: '100', cutter: 'A100a', anoPublicacao: 2021, edicao: '1ª ed.' }
  const obra2 = { classificacao: '200', cutter: 'B200b', anoPublicacao: 2022, edicao: '2ª ed.' }
  const obra3 = { classificacao: '300', cutter: 'C300c', anoPublicacao: 2023, edicao: '3ª ed.' }

  it('processa cada obra individualmente e concatena labels', () => {
    const r1 = obraToLabelData(obra1, 5)
    const r2 = obraToLabelData(obra2, 3)
    const r3 = obraToLabelData(obra3, 2)

    expect(r1.ok).toBe(true)
    expect(r2.ok).toBe(true)
    expect(r3.ok).toBe(true)

    if (!r1.ok || !r2.ok || !r3.ok) return
    const allLabels = [...r1.labels, ...r2.labels, ...r3.labels]
    expect(allLabels).toHaveLength(10)
  })

  it('15 labels de 3 obras → 1 folha', () => {
    const r1 = obraToLabelData(obra1, 5)
    const r2 = obraToLabelData(obra2, 7)
    const r3 = obraToLabelData(obra3, 3)

    if (!r1.ok || !r2.ok || !r3.ok) throw new Error('adapter falhou')
    const labels = [...r1.labels, ...r2.labels, ...r3.labels]
    const slots: LabelSlot[] = labels.map((_, i) => ({ index: i, content: null }))
    const pages = paginateSlots(TR6580, slots)
    expect(pages).toHaveLength(1)
  })
})

describe('LABEL-003 — Mais de 30 etiquetas (múltiplas folhas)', () => {
  const obraGrande = {
    classificacao: '220.6',
    cutter: 'B576a',
    anoPublicacao: 2023,
    edicao: '2ª ed.',
  }

  it('31 etiquetas → 2 folhas', () => {
    const result = obraToLabelData(obraGrande, 31)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const slots: LabelSlot[] = result.labels.map((_, i) => ({ index: i, content: null }))
    const pages = paginateSlots(TR6580, slots)
    expect(pages).toHaveLength(2)
    expect(pages[0].slots).toHaveLength(30)
    expect(pages[1].slots).toHaveLength(1)
  })

  it('60 etiquetas → 2 folhas completas', () => {
    const result = obraToLabelData(obraGrande, 60)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const slots: LabelSlot[] = result.labels.map((_, i) => ({ index: i, content: null }))
    const pages = paginateSlots(TR6580, slots)
    expect(pages).toHaveLength(2)
    expect(pages[0].slots).toHaveLength(30)
    expect(pages[1].slots).toHaveLength(30)
  })
})

describe('LABEL-003 — Posição inicial diferente de 1', () => {
  const obra = { classificacao: '150', cutter: 'D150d', anoPublicacao: 2019, edicao: '4ª ed.' }

  it('startAt=6 com 10 etiquetas → 1 folha, posição 6 (índice 6)', () => {
    const result = obraToLabelData(obra, 10)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const slots: LabelSlot[] = result.labels.map((_, i) => ({ index: i, content: null }))
    const pages = paginateSlots(TR6580, slots, 6)
    expect(pages).toHaveLength(1)
    expect(pages[0].startAt).toBe(6)
    expect(pages[0].slots).toHaveLength(10)
  })

  it('startAt=25 com 10 etiquetas → 2 folhas (5 na 1ª, 5 na 2ª)', () => {
    const result = obraToLabelData(obra, 10)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const slots: LabelSlot[] = result.labels.map((_, i) => ({ index: i, content: null }))
    const pages = paginateSlots(TR6580, slots, 25)
    expect(pages).toHaveLength(2)
    expect(pages[0].startAt).toBe(25)
    expect(pages[0].slots).toHaveLength(5)
    expect(pages[1].startAt).toBe(0)
    expect(pages[1].slots).toHaveLength(5)
  })
})

describe('LABEL-003 — Obras com campos obrigatórios ausentes', () => {
  it('obra sem cutter retorna camposFaltando com "Cutter-Sanborn"', () => {
    const result = obraToLabelData(
      { classificacao: '200', cutter: null, anoPublicacao: 2020, edicao: '1ª ed.' },
      3,
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.camposFaltando).toContain('Cutter-Sanborn')
    expect(result.camposFaltando).toHaveLength(1)
  })

  it('obra sem CDD retorna camposFaltando com "CDD"', () => {
    const result = obraToLabelData(
      { classificacao: null, cutter: 'A100a', anoPublicacao: 2020, edicao: '1ª ed.' },
      3,
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.camposFaltando).toContain('CDD')
    expect(result.camposFaltando).toHaveLength(1)
  })

  it('em lote: 2 obras válidas + 1 inválida → 8 etiquetas, 1 erro', () => {
    const obraValida1 = { classificacao: '100', cutter: 'A100a', anoPublicacao: 2021, edicao: '1ª ed.' }
    const obraValida2 = { classificacao: '200', cutter: 'B200b', anoPublicacao: 2022, edicao: '2ª ed.' }
    const obraInvalida = { classificacao: null, cutter: null, anoPublicacao: null, edicao: null }

    const r1 = obraToLabelData(obraValida1, 5)
    const r2 = obraToLabelData(obraValida2, 3)
    const r3 = obraToLabelData(obraInvalida, 2)

    expect(r1.ok).toBe(true)
    expect(r2.ok).toBe(true)
    expect(r3.ok).toBe(false)

    if (!r1.ok || !r2.ok || r3.ok) return
    const allLabels = [...r1.labels, ...r2.labels]
    expect(allLabels).toHaveLength(8)
    expect(r3.camposFaltando).toHaveLength(4)
  })

  it('em lote: todas as obras inválidas → 0 etiquetas, todos com erro', () => {
    const obras = [
      { classificacao: null, cutter: 'A', anoPublicacao: 2020, edicao: '1ª ed.' },
      { classificacao: '100', cutter: null, anoPublicacao: 2020, edicao: '1ª ed.' },
    ]
    const results = obras.map(o => obraToLabelData(o, 2))
    expect(results.every(r => !r.ok)).toBe(true)
    const allLabels: LabelSlot[] = []
    for (const r of results) {
      if (r.ok) allLabels.push(...r.labels.map((_, i) => ({ index: i, content: null })))
    }
    expect(allLabels).toHaveLength(0)
  })
})

describe('LABEL-003 — Resumo da impressão', () => {
  const obra = { classificacao: '220.6', cutter: 'B576a', anoPublicacao: 2023, edicao: '2ª ed.' }

  it('48 etiquetas → 2 folhas (TR6580: 30 por folha)', () => {
    const result = obraToLabelData(obra, 48)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const slots: LabelSlot[] = result.labels.map((_, i) => ({ index: i, content: null }))
    const pages = paginateSlots(TR6580, slots)
    expect(pages).toHaveLength(2)
    const totalLabels = pages.reduce((acc, p) => acc + p.slots.length, 0)
    expect(totalLabels).toBe(48)
  })

  it('posição inicial 7 (índice 6) com 24 etiquetas → 2 folhas', () => {
    const result = obraToLabelData(obra, 24)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const slots: LabelSlot[] = result.labels.map((_, i) => ({ index: i, content: null }))
    // startAt=6 → posição 7 na UI (1-indexed)
    const pages = paginateSlots(TR6580, slots, 6)
    // Folha 1: posições 6..29 = 24 slots disponíveis → 24 labels cabe
    expect(pages).toHaveLength(1)
    expect(pages[0].startAt).toBe(6)
    expect(pages[0].slots).toHaveLength(24)
  })

  it('posição inicial 7 com 30 etiquetas → 2 folhas', () => {
    const result = obraToLabelData(obra, 30)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const slots: LabelSlot[] = result.labels.map((_, i) => ({ index: i, content: null }))
    const pages = paginateSlots(TR6580, slots, 6)
    expect(pages).toHaveLength(2)
    expect(pages[0].slots).toHaveLength(24)
    expect(pages[1].slots).toHaveLength(6)
  })
})
