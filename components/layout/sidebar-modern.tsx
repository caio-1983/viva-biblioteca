'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Cog,
  LogOut,
  Menu,
  ArrowLeftRight,
  ClipboardList,
  User,
} from 'lucide-react'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface MenuItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  match?: string
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard',     href: '/',                icon: LayoutDashboard                         },
  { label: 'Circulação',    href: '/circulacao',      icon: ArrowLeftRight                          },
  { label: 'Catálogo',      href: '/acervo/consulta', icon: BookOpen,    match: '/acervo'           },
  { label: 'Inventário',    href: '/inventario',      icon: ClipboardList                           },
  { label: 'Leitores',      href: '/members',         icon: Users                                   },
  { label: 'Relatórios',    href: '/reports',         icon: BarChart3                               },
  { label: 'Administração', href: '/settings',        icon: Cog                                     },
]

function isRouteActive(pathname: string, item: MenuItem): boolean {
  const prefix = item.match ?? item.href
  if (prefix === '/') return pathname === '/'
  return pathname === item.href || pathname.startsWith(prefix + '/')
}

function UserFooter({ onAction }: { onAction?: () => void }) {
  const { data: session } = useSession()
  const handleLogout = () => {
    onAction?.()
    signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="border-t border-slate-700/50 px-4 py-4">
      <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
          <User className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {session?.user?.nome ?? '—'}
          </p>
          <p className="truncate text-xs text-slate-400">
            {session?.user?.email ?? ''}
          </p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
      >
        <LogOut className="h-4 w-4 flex-shrink-0" />
        <span>Sair</span>
      </button>
    </div>
  )
}

export function SidebarModern({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen w-60 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 border-r border-slate-700">
        {/* Logo */}
        <div className="flex items-center justify-center border-b border-slate-200 px-4 py-6 bg-white">
          <Image
            src="/logo.png"
            alt="Viva Biblioteca"
            width={200}
            height={100}
            className="h-16 w-auto object-contain"
            priority
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = isRouteActive(pathname, item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <UserFooter />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 border-r border-slate-700 transition-transform duration-300 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo + close */}
        <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-4">
          <div className="flex-1">
            <Image
              src="/logo.png"
              alt="Viva Biblioteca"
              width={200}
              height={100}
              className="h-14 w-auto object-contain"
              priority
            />
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-800 flex-shrink-0">
            <Menu className="h-5 w-5 text-slate-300" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = isRouteActive(pathname, item)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <UserFooter onAction={onClose} />
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  )
}
