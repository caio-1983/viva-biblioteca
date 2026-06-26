'use client'

import { useState, useEffect } from 'react'
import { Menu, Bell, User, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/components/page-context'

interface HeaderModernProps {
  onMenuClick: () => void
}

export function HeaderModern({ onMenuClick }: HeaderModernProps) {
  const { title, subtitle } = usePageTitle()
  const [dateTime, setDateTime] = useState({ date: '', time: '' })

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      const date = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      const time = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
      setDateTime({ date, time })
    }

    updateDateTime()
    const interval = setInterval(updateDateTime, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
      <div className="flex h-20 items-center justify-between px-4 md:px-8">
        {/* Left side - Menu button (mobile only) */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-10 w-10"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Center/Right side */}
        <div className="flex flex-1 items-center justify-between">
          {/* Left section - Page Title and Date/Time */}
          <div className="flex-1">
            <h1>
              {title}
            </h1>
            {subtitle && (
              <p className="subtitle">{subtitle}</p>
            )}
            {!subtitle && (
              <div className="hidden md:block mt-0.5">
                <p className="text-xs text-slate-500">
                  {dateTime.date ? `${dateTime.date} • ${dateTime.time}` : 'Carregando...'}
                </p>
              </div>
            )}
          </div>

          {/* Right section - Actions and user */}
          <div className="flex items-center gap-4">
            {/* Global search trigger */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('viva:search:open'))}
              className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Pesquisar…</span>
              <kbd className="ml-2 inline-flex items-center rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs font-mono text-slate-400">
                Ctrl+K
              </kbd>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-slate-600 hover:text-slate-900 md:hidden"
              onClick={() => window.dispatchEvent(new CustomEvent('viva:search:open'))}
              aria-label="Pesquisar"
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-slate-600 hover:text-slate-900"
            >
              <Bell className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-slate-900">Administrator</p>
                <p className="text-xs text-slate-500">admin@biblioteca.com</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-purple-500 to-purple-600">
                <User className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
