'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface PageContextType {
  title: string
  subtitle?: string
  setPageInfo: (title: string, subtitle?: string) => void
}

const PageContext = createContext<PageContextType | undefined>(undefined)

export function PageProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('Dashboard')
  const [subtitle, setSubtitle] = useState<string | undefined>()

  const setPageInfo = (newTitle: string, newSubtitle?: string) => {
    setTitle(newTitle)
    setSubtitle(newSubtitle)
  }

  return (
    <PageContext.Provider value={{ title, subtitle, setPageInfo }}>
      {children}
    </PageContext.Provider>
  )
}

export function usePageTitle() {
  const context = useContext(PageContext)
  if (!context) {
    throw new Error('usePageTitle must be used within PageProvider')
  }
  return context
}
