import { ObraWorkspace } from '@/components/obra/obra-workspace'

type Props = { params: Promise<{ obraId: string }> }

export default async function ObraPage({ params }: Props) {
  const { obraId } = await params
  return <ObraWorkspace obraId={Number(obraId)} />
}
