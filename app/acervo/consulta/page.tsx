import dynamic from 'next/dynamic'

const CatalogView = dynamic(
  () => import('@/components/catalog/catalog-view').then(m => ({ default: m.CatalogView }))
)

export default function CatalogoPage() {
  return <CatalogView />
}
