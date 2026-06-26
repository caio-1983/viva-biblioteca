import dynamic from 'next/dynamic'

const InventoryWorkspace = dynamic(
  () => import('@/components/inventario/inventory-workspace').then(m => ({ default: m.InventoryWorkspace }))
)

export default function InventarioPage() {
  return <InventoryWorkspace />
}
