import { Loader2 } from 'lucide-react'

export function ImportProgress() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="relative">
        <div className="rounded-full bg-blue-100 p-5">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        </div>
      </div>

      <div className="text-center">
        <p className="font-semibold text-slate-800 text-lg">Importando acervo…</p>
        <p className="text-sm text-slate-500 mt-1">
          Criando obras e exemplares. Aguarde um momento.
        </p>
      </div>

      <div className="w-72 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full w-1/3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
          style={{
            animation: 'importSlide 1.4s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes importSlide {
          0%   { transform: translateX(-100%) scaleX(1); }
          50%  { transform: translateX(150%) scaleX(1.5); }
          100% { transform: translateX(400%) scaleX(1); }
        }
      `}</style>
    </div>
  )
}
