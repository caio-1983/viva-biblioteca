'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  BarChart3,
  Users,
  Cog,
  ChevronDown,
  Menu,
  BookMarked,
  LogOut,
} from 'lucide-react'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const menuItems = [
  {
    label: 'Início',
    href: '/',
    icon: BarChart3,
  },
  {
    label: 'Novo Empréstimo',
    href: '/loans/new',
    icon: BookMarked,
  },
  {
    label: 'Devoluções',
    href: '/returns',
    icon: ChevronDown,
  },
  {
    label: 'Acervo',
    href: '/books',
    icon: BookOpen,
  },
  {
    label: 'Usuário',
    href: '/members',
    icon: Users,
  },
  {
    label: 'Relatórios',
    href: '/reports',
    icon: BarChart3,
  },
  {
    label: 'Configurações',
    href: '/settings',
    icon: Cog,
  },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r border-border bg-white dark:bg-slate-950 md:flex md:flex-col">
        {/* Logo/Brand */}
        <Link href="/" className="flex items-center gap-3 border-b border-border px-6 py-8 hover:opacity-80 transition-opacity">
          <Image
            src="/logo-biblioteca.png"
            alt="Viva Biblioteca"
            width={48}
            height={48}
            className="rounded-lg"
          />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Viva</h1>
            <p className="text-xs font-medium text-muted-foreground">Biblioteca</p>
          </div>
        </Link>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 px-3 py-8">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-border px-3 py-6">
          <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:bg-red-500/10 hover:text-red-500">
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-white dark:bg-slate-950 transition-transform duration-300 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo/Brand */}
        <div className="flex items-center justify-between border-b border-border px-6 py-8">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image
              src="/logo-biblioteca.png"
              alt="Viva Biblioteca"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">Viva</h1>
              <p className="text-xs font-medium text-muted-foreground">Biblioteca</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2 px-4 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-600 dark:text-blue-400'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-border px-3 py-6">
          <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:bg-red-500/10 hover:text-red-500">
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  )
}
