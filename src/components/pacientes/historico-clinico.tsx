"use client"

import { AgendamentoHistoricoComJoins } from "@/types"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Loader2, Calendar, User, Stethoscope, MessageSquare } from "lucide-react"

interface HistoricoClinicoProps {
  historico: AgendamentoHistoricoComJoins[]
  isLoading?: boolean
}

export function HistoricoClinico({ historico, isLoading }: HistoricoClinicoProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p className="text-xs uppercase tracking-widest font-bold">Carregando histórico...</p>
      </div>
    )
  }

  if (historico.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border bg-muted/10">
        <Calendar className="w-8 h-8 mb-2 opacity-20" />
        <p className="text-xs uppercase tracking-widest font-bold">Nenhum atendimento registrado.</p>
      </div>
    )
  }

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-border">
      {historico.map((item) => (
        <div key={item.id} className="relative flex items-start gap-6 group">
          {/* Timeline Dot */}
          <div className="absolute left-0 mt-1.5 w-10 flex items-center justify-center">
            <div className="w-3 h-3 rounded-none bg-primary ring-4 ring-background border border-primary group-hover:scale-125 transition-transform" />
          </div>

          <div className="flex-1 bg-card border border-border p-5 shadow-sm space-y-4 hover:border-primary/30 transition-colors">
            {/* Header: Date and Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">
                  {format(parseISO(item.data_hora_inicio), "PPP 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border border-border shadow-sm rounded-none ${
                item.status_comparecimento === 'Presente' 
                  ? 'bg-alert-success-bg text-alert-success-text' 
                  : (item.status_comparecimento === 'Falta Justificada' || item.status_comparecimento === 'Falta Nao Justificada')
                    ? 'bg-alert-danger-bg text-alert-danger-text' 
                    : 'bg-muted/20 text-muted-foreground'
              }`}>
                {item.status_comparecimento}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Profissional
                </span>
                <p className="font-semibold text-foreground">
                  {item.profissionais?.nome_completo}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Stethoscope className="w-3 h-3" /> Especialidade
                </span>
                <p className="font-semibold text-foreground">
                  {item.linhas_cuidado_especialidades?.nome_especialidade}
                </p>
              </div>
            </div>

            {/* Evolution Content */}
            <div className="space-y-2 bg-muted/30 p-4 border-l-2 border-primary/50">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" /> Evolução Clínica
              </span>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {item.evolucao_clinica || "Nenhuma evolução registrada para este atendimento."}
              </p>
              {item.conduta && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Conduta / Orientações</span>
                  <p className="text-sm text-foreground mt-1">{item.conduta}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
