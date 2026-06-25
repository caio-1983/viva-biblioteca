import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <h1 className="text-6xl font-bold text-slate-300">404</h1>
      <p className="text-lg text-muted-foreground">Página não encontrada</p>
      <Link
        href="/"
        className="mt-2 text-sm text-blue-600 hover:underline"
      >
        Voltar ao início
      </Link>
    </div>
  )
}
