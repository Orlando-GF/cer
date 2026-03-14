import { Suspense } from "react"
import { validarAcessoRota } from "@/lib/access-control"
import { AgendaContent } from "@/components/agenda/agenda-content"

export default async function AgendamentosPage() {
  const perfil = await validarAcessoRota("/agendamentos")

  return (
    <div className="p-6 space-y-8 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agenda CER II</h1>
          <p className="text-slate-500 mt-1">Gestão inteligente de vagas fixas e evoluções clínicas.</p>
        </div>
      </div>

      <Suspense fallback={<div className="h-96 w-full animate-pulse bg-slate-100 rounded-lg" />}>
        <AgendaContent perfil={perfil} />
      </Suspense>
    </div>
  )
}
