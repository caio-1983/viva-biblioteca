import { Layout } from '@/components/layout/layout'
import { BooksInventory } from '@/components/books/books-inventory'

export default function BooksPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Acervo</h1>
          <p className="mt-2 text-muted-foreground">Consultar livros disponíveis na biblioteca</p>
        </div>

        <BooksInventory />
      </div>
    </Layout>
  )
}
