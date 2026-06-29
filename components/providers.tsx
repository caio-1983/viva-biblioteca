'use client'

import { usePathname } from 'next/navigation'
import { LayoutModern } from './layout/layout-modern'
import { PageProvider } from './page-context'
import { ToastProvider } from './ui/toast'

const AUTH_ROUTES = ['/login', '/auth', '/register', '/forgot-password']

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname?.startsWith(r))

  return (
    <ToastProvider>
      <PageProvider>
        {isAuthRoute ? children : <LayoutModern>{children}</LayoutModern>}
      </PageProvider>
    </ToastProvider>
  )
}
