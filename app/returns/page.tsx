import { Layout } from '@/components/layout/layout'
import { ReturnsForm } from '@/components/returns/returns-form'

export default function ReturnsPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Devoluções</h1>
          <p className="mt-2 text-muted-foreground">Registrar a devolução de livros emprestados</p>
        </div>

        <ReturnsForm />
      </div>
    </Layout>
  )
}
