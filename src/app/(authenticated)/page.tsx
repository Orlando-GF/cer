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
      .gte("data_hora_inicio", new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }) + 'T00:00:00-03:00')
      .lte("data_hora_inicio", new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }) + 'T23:59:59-03:00'),
  ])

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-widest text-foreground">
          Painel Geral
        </h1>
        <p className="text-muted-foreground mt-1 text-[10px] font-bold uppercase tracking-wider">
          Resumo das atividades e ocupação do CER II.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="rounded-none border-2 border-border shadow-sm bg-card hover:shadow-md transition-all p-5">
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-muted-foreground pb-2">
            <Users className="w-4 h-4 text-primary/70" />
            <span>Pacientes cadastrados</span>
          </div>
          <p className="text-5xl font-black tabular-nums tracking-tighter text-foreground">
            {totalPacientes || 0}
          </p>
        </div>

        <div className="rounded-none border-y-2 border-r-2 border-border border-l-4 border-l-[var(--color-alert-warning-text)] shadow-sm bg-card hover:shadow-md transition-all p-5">
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-muted-foreground pb-2">
            <ClipboardList className="w-4 h-4 text-[var(--color-alert-warning-text)]" />
            <span>Fila de espera ativa</span>
          </div>
          <p className="text-5xl font-black tabular-nums tracking-tighter text-foreground">
            {filaAtivos || 0}
          </p>
        </div>

        <div className="rounded-none border-y-2 border-r-2 border-border border-l-4 border-l-[var(--color-alert-danger-text)] shadow-sm bg-card hover:shadow-md transition-all p-5">
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-muted-foreground pb-2">
            <ShieldAlert className="w-4 h-4 text-[var(--color-alert-danger-text)]" />
            <span>Pacientes em risco</span>
          </div>
          <p className="text-5xl font-black tabular-nums tracking-tighter text-alert-danger-text">
            {filaEmRisco || 0}
          </p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Acima de limite de faltas
          </p>
        </div>

        <div className="rounded-none border-2 border-border shadow-sm bg-card hover:shadow-md transition-all p-5">
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-muted-foreground pb-2">
            <CalendarDays className="w-4 h-4 text-[var(--color-alert-success-text)]" />
            <span>Agendamentos hoje</span>
          </div>
          <p className="text-5xl font-black tabular-nums tracking-tighter text-foreground">
            {agendamentosHoje || 0}
          </p>
        </div>

      </div>
    </div>
  )
}
