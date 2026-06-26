import dynamic from 'next/dynamic'

const ReportsView = dynamic(
  () => import('@/components/reports/reports-view').then(m => ({ default: m.ReportsView }))
)

export default function ReportsPage() {
  return <ReportsView />
}
