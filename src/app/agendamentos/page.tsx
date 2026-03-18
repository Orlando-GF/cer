import React, { Suspense } from "react"
import { validarAcessoRota } from "@/lib/access-control"
import { AgendaContent } from "@/components/agenda/agenda-content"
import { buscarProfissionais, buscarEspecialidades } from "@/actions"

export default async function AgendamentosPage(): Promise<React.ReactNode> {
  const [perfil, resProf, resEsp] = await Promise.all([
    validarAcessoRota("/agendamentos"),
    buscarProfissionais(),
    buscarEspecialidades()
  ])

  const profissionais = resProf.success && resProf.data ? resProf.data : []
  const especialidades = resEsp.success && resEsp.data ? resEsp.data : []

  return (
    <div className="p-6 space-y-8 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agenda CER II</h1>
          <p className="text-muted-foreground mt-1">Gestão inteligente de vagas fixas e evoluções clínicas.</p>
        </div>
      </div>

      <Suspense fallback={<div className="h-96 w-full animate-pulse bg-muted rounded-none" />}>
        <AgendaContent 
          perfil={perfil} 
          profissionaisIniciais={profissionais} 
          especialidadesIniciais={especialidades}
        />
      </Suspense>
    </div>
  )
}
