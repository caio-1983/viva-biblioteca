import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { Button }     from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'

type Props = { params: Promise<{ obraId: string }> }

export default async function ObraPage({ params }: Props) {
  const { obraId } = await params

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Obra"
        description={`ID ${obraId}`}
        breadcrumb={
          <Link href="/acervo/consulta">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-slate-500 hover:text-slate-700">
              <ArrowLeft className="size-4" />
              Voltar ao Catálogo
            </Button>
          </Link>
        }
        actions={
          <Link href="/acervo/consulta">
            <Button variant="outline" size="sm">
              Catálogo
            </Button>
          </Link>
        }
      />

      <EmptyState
        icon={<BookOpen className="size-10 text-slate-200" />}
        title="Página da Obra"
        description="Esta página será construída na Sprint UX-03 — Página da Obra."
        size="lg"
      />
    </div>
  )
}
