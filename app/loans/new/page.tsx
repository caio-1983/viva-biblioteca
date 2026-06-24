import { Layout } from '@/components/layout/layout'
import { NewLoanForm } from '@/components/loans/new-loan-form'

export default function NewLoanPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Empréstimo</h1>
          <p className="mt-2 text-muted-foreground">Registrar um novo empréstimo de livro</p>
        </div>

        <NewLoanForm />
      </div>
    </Layout>
  )
}
