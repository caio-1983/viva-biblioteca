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
