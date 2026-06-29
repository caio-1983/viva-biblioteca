import dynamic from 'next/dynamic'

const ImportWorkspace = dynamic(
  () =>
    import('@/components/import/ImportWorkspace').then((m) => ({
      default: m.ImportWorkspace,
    })),
)

export default function ImportarAcervoPage() {
  return <ImportWorkspace />
}
