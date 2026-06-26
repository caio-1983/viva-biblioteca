import dynamic from 'next/dynamic'

const ReadersWorkspace = dynamic(
  () => import('@/components/readers/readers-workspace').then(m => ({ default: m.ReadersWorkspace }))
)

export default function MembersPage() {
  return <ReadersWorkspace />
}
