import dynamic from 'next/dynamic'

const CirculationWorkspace = dynamic(
  () => import('@/components/circulacao/circulation-workspace').then(m => ({ default: m.CirculationWorkspace }))
)

export default function CirculacaoPage() {
  return <CirculationWorkspace />
}
