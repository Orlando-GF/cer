"use client"

import { Calendar, Clock, User, Trash2, MapPin } from "lucide-react"
import { type VagaFixaComJoins } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface VagasAtivasListProps {
  vagas: VagaFixaComJoins[]
  onRemove?: (id: string) => void
}

const DIAS_SEMANA_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
}

export function VagasAtivasList({ vagas, onRemove }: VagasAtivasListProps) {
  if (vagas.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Calendar className="h-16 w-16 mx-auto mb-6 opacity-50" />
        <p className="font-bold uppercase text-[10px] tracking-[0.2em]">Nenhuma vaga fixa ativa encontrada</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
      {vagas.map((vaga) => (
        <div key={vaga.id} className="group relative bg-card border border-border p-4 transition-all hover:border-primary/20 hover:shadow-md">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-transparent rounded-none font-bold text-[9px] uppercase tracking-wider">
                {DIAS_SEMANA_LABELS[vaga.dia_semana]}
              </Badge>
              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {vaga.horario_inicio} - {vaga.horario_fim}
              </span>
            </div>
            {onRemove && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => onRemove(vaga.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-none bg-background border border-border flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-foreground uppercase truncate">
                  {vaga.pacientes?.nome_completo || "Paciente não identificado"}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter truncate">
                  {vaga.linhas_cuidado_especialidades?.nome_especialidade || "Especialidade n/a"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Presencial
            </span>
            <span className="text-[9px] font-bold text-primary uppercase">Contrato Ativo</span>
          </div>
        </div>
      ))}
    </div>
  )
}
