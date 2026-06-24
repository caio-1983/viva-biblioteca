'use client'

import { Menu, Bell, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="border-b border-border bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex h-20 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Left side - Menu button (mobile only) */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-10 w-10 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Center/Right side - Title (mobile) / Actions (desktop) */}
        <div className="flex flex-1 items-center justify-between md:justify-end">
          <h2 className="text-lg font-bold bg-linear-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent md:hidden">
            Viva Biblioteca
          </h2>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notificações</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Configurações</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
