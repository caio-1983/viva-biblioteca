import dynamic from 'next/dynamic'

const AdminWorkspace = dynamic(
  () => import('@/components/admin/admin-workspace').then(m => ({ default: m.AdminWorkspace }))
)

export default function SettingsPage() {
  return <AdminWorkspace />
}
