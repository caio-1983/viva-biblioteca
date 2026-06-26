'use client'

import { LayoutModern } from './layout/layout-modern'
import { PageProvider } from './page-context'
import { ToastProvider } from './ui/toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <PageProvider>
        <LayoutModern>{children}</LayoutModern>
      </PageProvider>
    </ToastProvider>
  )
}
