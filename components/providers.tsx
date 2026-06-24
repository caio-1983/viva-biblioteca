'use client'

import { LayoutModern } from './layout/layout-modern'
import { PageProvider } from './page-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PageProvider>
      <LayoutModern>{children}</LayoutModern>
    </PageProvider>
  )
}
