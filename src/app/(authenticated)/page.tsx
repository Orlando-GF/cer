import { createClient } from "@/utils/supabase/server"
import { Users, ClipboardList, CalendarDays, ShieldAlert } from "lucide-react"
import { validarAcessoRota } from "@/lib/access-control"

export default async function PainelGeral() {
  await validarAcessoRota("/")
  const supabase = await createClient()

  const [
    { count: filaAtivos },
    { count: filaEmRisco },
    { count: totalPacientes },
    { count: agendamentosHoje }
  ] = await Promise.all([
    supabase.from("fila_espera").select("*", { count: "exact", head: true })
      .in("status_fila", ["Aguardando", "Em Atendimento", "Em Risco"]),
    supabase.from("fila_espera").select("*", { count: "exact", head: true })
      .eq("status_fila", "Em Risco"),
    supabase.from("pacientes").select("*", { count: "exact", head: true }),
    supabase.from("agendamentos_historico")
      .select("*", { count: "exact", head: true })
      .gte("data_hora_inicio", new Date().toISOString().split('T')[0] + 'T00:00:00Z')
      .lte("data_hora_inicio", new Date().toISOString().split('T')[0] + 'T23:59:59Z'),
  ])

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Painel Geral</h1>
        <p className="text-muted-foreground mt-1">Resumo das atividades e ocupação do CER 2.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-card border border-border rounded-none p-5">
          <div className="flex items-center gap-3 text-primary mb-2">
            <Users className="w-5 h-5" />
            <span className="font-semibold text-sm tracking-wider text-muted-foreground">Pacientes cadastrados</span>
          </div>
          <p className="text-3xl font-bold text-foreground tabular-nums">{totalPacientes || 0}</p>
        </div>

        <div className="bg-card border border-border border-l-4 border-l-[var(--color-alert-warning-text)] rounded-none p-5">
          <div className="flex items-center gap-3 text-[var(--color-alert-warning-text)] mb-2">
            <ClipboardList className="w-5 h-5" />
            <span className="font-semibold text-sm tracking-wider text-muted-foreground">Fila de espera ativa</span>
          </div>
          <p className="text-3xl font-bold text-foreground tabular-nums">{filaAtivos || 0}</p>
        </div>

        <div className="bg-card border border-border border-l-4 border-l-[var(--color-alert-danger-text)] rounded-none p-5">
          <div className="flex items-center gap-3 text-[var(--color-alert-danger-text)] mb-2">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-semibold text-sm tracking-wider text-muted-foreground">Pacientes em risco</span>
          </div>
          <p className="text-3xl font-bold text-foreground tabular-nums">{filaEmRisco || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Acima de limite de faltas</p>
        </div>

        <div className="bg-card border border-border rounded-none p-5">
          <div className="flex items-center gap-3 text-[var(--color-alert-success-text)] mb-2">
            <CalendarDays className="w-5 h-5" />
            <span className="font-semibold text-sm tracking-wider text-muted-foreground">Agendamentos hoje</span>
          </div>
          <p className="text-3xl font-bold text-foreground tabular-nums">{agendamentosHoje || 0}</p>
        </div>

      </div>
    </div>
  )
}
