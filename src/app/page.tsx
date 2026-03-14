import { createClient } from "@/utils/supabase/server"
import { Users, ClipboardList, CalendarDays, ShieldAlert } from "lucide-react"

export default async function PainelGeral() {
  const supabase = await createClient()

  // Buscar totais de cada sessão (Resumo Rápido)
  const { count: filaAtivos } = await supabase
    .from("fila_espera")
    .select("*", { count: "exact", head: true })
    .in("status_fila", ["Aguardando", "Em Atendimento", "Em Risco"])

  const { count: filaEmRisco } = await supabase
    .from("fila_espera")
    .select("*", { count: "exact", head: true })
    .eq("status_fila", "Em Risco")

  const { count: totalPacientes } = await supabase
    .from("pacientes")
    .select("*", { count: "exact", head: true })

  return (
    <main className="min-h-screen bg-slate-50 p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Painel Geral</h1>
        <p className="text-slate-500 mt-1">Resumo das atividades e ocupação do CER 2.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <Users className="w-5 h-5" />
            <span className="font-semibold text-sm tracking-wider text-slate-500">Pacientes cadastrados</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalPacientes || 0}</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3 text-amber-600 mb-2">
            <ClipboardList className="w-5 h-5" />
            <span className="font-semibold text-sm tracking-wider text-slate-500">Fila de espera ativa</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{filaAtivos || 0}</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm border-l-4 border-l-red-500">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-semibold text-sm tracking-wider text-slate-500">Pacientes em risco</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{filaEmRisco || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Acima de limite de faltas</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm opacity-60">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <CalendarDays className="w-5 h-5" />
            <span className="font-semibold text-sm tracking-wider text-slate-500">Agendamentos hoje</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">-</p>
          <p className="text-xs text-slate-500 mt-1">Em desenvolvimento</p>
        </div>

      </div>
    </main>
  )
}
