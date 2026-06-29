'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Menu, Search } from 'lucide-react'
import { SidebarModern } from './sidebar-modern'
import { CommandCenter } from '@/components/search/command-center'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/components/page-context'

function PageHeader() {
  const { title, subtitle } = usePageTitle()
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {subtitle && (
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      )}
    </div>
  )
}

interface LayoutModernProps {
  children: React.ReactNode
}

export function LayoutModern({ children }: LayoutModernProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50">
      <CommandCenter />
      <SidebarModern open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden md:ml-60">
        {/* Mobile-only top bar — grid 3 colunas simétricas para centro óptico real */}
        <div
          className="grid h-14 border-b border-slate-100 bg-white md:hidden"
          style={{ gridTemplateColumns: '56px 1fr 56px' }}
        >
          {/* Coluna esquerda — hambúrguer */}
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-9 w-9 text-slate-500"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Coluna central — branding empilhado */}
          <div className="flex flex-col items-center justify-center gap-0.5">
            <Image
              src="/logo.png"
              alt="VIVA"
              width={52}
              height={26}
              className="h-[20px] w-auto object-contain"
              priority
            />
            <span
              className="text-[10px] font-medium tracking-widest text-slate-500 uppercase"
              style={{ lineHeight: 1 }}
            >
              Biblioteca
            </span>
          </div>

          {/* Coluna direita — pesquisa */}
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.dispatchEvent(new CustomEvent('viva:search:open'))}
              className="h-9 w-9 text-slate-500"
              aria-label="Pesquisar"
            >
              <Search className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </div>

        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="w-full px-6 py-10 md:px-10 md:py-12">
            <div className="mx-auto max-w-7xl">
              <PageHeader />
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
