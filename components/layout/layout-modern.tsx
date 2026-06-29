'use client'

import { useState } from 'react'
import { SidebarModern } from './sidebar-modern'
import { HeaderModern } from './header-modern'
import { CommandCenter } from '@/components/search/command-center'

interface LayoutModernProps {
  children: React.ReactNode
}

export function LayoutModern({ children }: LayoutModernProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Global Command Center — Ctrl+K */}
      <CommandCenter />

      {/* Sidebar */}
      <SidebarModern open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area - respects sidebar on desktop */}
      <div className="flex flex-1 flex-col overflow-hidden md:ml-60">
        {/* Header */}
        <HeaderModern onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="w-full px-6 py-10 md:px-10 md:py-12">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
