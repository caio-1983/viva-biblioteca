import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const CirculationWorkspace = dynamic(
  () => import('@/components/circulacao/circulation-workspace').then(m => ({ default: m.CirculationWorkspace }))
)

export default function CirculacaoPage() {
  return (
    <Suspense>
      <CirculationWorkspace />
    </Suspense>
  )
}
