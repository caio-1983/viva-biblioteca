'use client'

import { useState, useEffect } from 'react'
import type { DashboardData } from '@/lib/dashboard/dashboard.types'

interface UseDashboardResult {
  data: DashboardData | null
  loading: boolean
  error: boolean
}

export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<DashboardData>
      })
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch((err) => {
        console.error('[useDashboard]', err)
        setError(true)
        setLoading(false)
      })
  }, [])

  return { data, loading, error }
}
