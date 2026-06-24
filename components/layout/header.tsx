'use client'

import { Menu, Bell, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Left side - Menu button (mobile only) */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Center/Right side - Title (mobile) / Actions (desktop) */}
        <div className="flex flex-1 items-center justify-between md:justify-end">
          <h2 className="text-lg font-semibold md:hidden">Viva Biblioteca</h2>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
            >
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notificações</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
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
