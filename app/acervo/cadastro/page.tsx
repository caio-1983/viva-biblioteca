import dynamic from 'next/dynamic'

const CatalogingWorkspace = dynamic(
  () => import('@/components/cataloging/cataloging-workspace').then(m => ({ default: m.CatalogingWorkspace }))
)

export default function CadastroAcervoPage() {
  return <CatalogingWorkspace />
}
