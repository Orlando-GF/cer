"use client" // v6.1 - Fixed Runtime Error

import * as React from "react"
import { useState } from "react"
import { AgendamentoHistoricoComJoins, VagaFixaComJoins, Paciente } from "@/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PacienteSheetMaster } from "@/components/pacientes/paciente-sheet-master"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface AtendimentosDiaProps {
  initialData: { vagas: VagaFixaComJoins[]; hist: AgendamentoHistoricoComJoins[] }
}

export function AtendimentosDia({ initialData }: AtendimentosDiaProps) {
  const router = useRouter()
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetTab, setSheetTab] = useState("clinico")
  const [contextoRegistro, setContextoRegistro] = useState<{ 
    vagaId?: string; 
    especialidadeId?: string; 
    profissionalId?: string;
    dataHoraInicio?: string;
    dataHoraFim?: string;
  }>({})

  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

  function handleRefresh() {
    router.refresh()
  }

  const data = initialData

  // Combinar vagas fixas (não materializadas) com histórico (materializado/realizado)
  const atendimentos = data?.hist || []
  const vagasPendentes = data?.vagas.filter(v => 
    !atendimentos.some(h => h.vaga_fixa_id === v.id && h.data_hora_inicio.startsWith(hoje))
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-widest text-foreground uppercase">Atendimentos de Hoje</h2>
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold mt-1">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="rounded-none border-2 border-border font-bold uppercase tracking-widest text-[10px] shadow-sm hover:bg-muted/50">
          Atualizar Agenda
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {atendimentos.map((atend) => (
          <Card key={atend.id} className="rounded-none border-2 border-border hover:border-primary/50 transition-all shadow-sm overflow-hidden group">
             <div className="h-1.5 w-full bg-primary" />
             <CardHeader className="pb-3">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 text-primary font-black">
                    <Clock className="w-4 h-4" />
                    <span className="text-lg tabular-nums tracking-tighter">{format(new Date(atend.data_hora_inicio), "HH:mm")}</span>
                  </div>
                  <Badge variant="outline" className={cn(
                    "rounded-none border-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                    atend.status_comparecimento === 'Presente' ? 'border-alert-success-text text-alert-success-text bg-alert-success-bg/20' :
                    atend.status_comparecimento === 'Falta Nao Justificada' ? 'border-alert-danger-text text-alert-danger-text bg-alert-danger-bg/20' :
                    atend.status_comparecimento === 'Falta Justificada' ? 'border-alert-warning-text text-alert-warning-text bg-alert-warning-bg/20' :
                    'border-primary text-primary bg-primary/10'
                  )}>
                    {atend.status_comparecimento}
                  </Badge>
               </div>
               <CardTitle className="text-sm font-black text-foreground mt-2 line-clamp-1 uppercase tracking-tight">
                 {atend.pacientes?.nome_completo}
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" /> Especialidade
                  </span>
                  <p className="text-sm font-semibold truncate text-foreground">{atend.linhas_cuidado_especialidades?.nome_especialidade}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="default" 
                    className="flex-1 rounded-none text-[10px] h-9 font-bold uppercase tracking-widest"
                    onClick={() => {
                        setSelectedPaciente(atend.pacientes as unknown as Paciente)
                        setContextoRegistro({ 
                          dataHoraInicio: atend.data_hora_inicio, 
                          dataHoraFim: atend.data_hora_fim || new Date().toISOString() 
                        })
                        setSheetTab("clinico")
                        setSheetOpen(true)
                    }}
                  >
                    Abrir Prontuário
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-none text-[10px] h-9 font-bold uppercase tracking-widest border-primary/20 text-primary"
                    onClick={() => {
                      setSelectedPaciente(atend.pacientes as unknown as Paciente)
                      setContextoRegistro({ 
                        vagaId: atend.vaga_fixa_id || undefined,
                        especialidadeId: atend.especialidade_id || undefined,
                        profissionalId: atend.profissional_id || undefined,
                        dataHoraInicio: atend.data_hora_inicio,
                        dataHoraFim: (atend.data_hora_fim || new Date().toISOString()) || undefined
                      })
                      setSheetTab(atend.status_comparecimento === 'Presente' ? 'clinico' : 'registrar')
                      setSheetOpen(true)
                    }}
                  >
                    {atend.status_comparecimento === 'Presente' ? 'Ver Evolução' : 'Registrar'}
                  </Button>
                </div>
             </CardContent>
          </Card>
        ))}

        {vagasPendentes.map((vaga) => (
          <Card key={vaga.id} className="rounded-none border-2 border-border bg-card hover:opacity-100 transition-all shadow-sm group">
             <div className="h-1.5 w-full bg-primary/50" />
             <CardHeader className="pb-3">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 text-muted-foreground font-black">
                    <Clock className="w-4 h-4" />
                    <span className="text-lg tabular-nums tracking-tighter">{vaga.horario_inicio.slice(0, 5)}</span>
                  </div>
                  <Badge variant="outline" className="rounded-none border-2 border-alert-warning-text text-alert-warning-text bg-alert-warning-bg/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
                    Pendente
                  </Badge>
               </div>
               <CardTitle className="text-sm font-black text-muted-foreground mt-2 line-clamp-1 uppercase tracking-tight">
                 {vaga.pacientes?.nome_completo || 'PACIENTE NÃO VINCULADO'}
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" /> Especialidade
                  </span>
                  <p className="text-sm font-semibold truncate text-muted-foreground opacity-70">{vaga.linhas_cuidado_especialidades?.nome_especialidade}</p>
                </div>

                 <div className="flex gap-2 pt-2">
                  <Button 
                    variant="default" 
                    className="w-full rounded-none h-12 border-2 border-primary bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-widest text-[10px] transition-all"
                    disabled={!vaga.pacientes}
                    onClick={() => {
                        setSelectedPaciente(vaga.pacientes as unknown as Paciente)
                        setContextoRegistro({ 
                          vagaId: vaga.id, 
                          especialidadeId: vaga.linhas_cuidado_especialidades?.id, 
                          profissionalId: vaga.profissionais?.id,
                          dataHoraInicio: `${hoje}T${vaga.horario_inicio.substring(0,5)}:00Z`,
                          dataHoraFim: `${hoje}T${vaga.horario_fim.substring(0,5)}:00Z`
                        })
                        setSheetTab("registrar")
                        setSheetOpen(true)
                    }}
                  >
                    Registrar Atendimento
                  </Button>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>

      {(atendimentos.length === 0 && vagasPendentes.length === 0) && (
        <div className="flex flex-col items-center justify-center h-[50vh] border border-dashed border-border bg-muted/10 text-center px-6">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground/70 uppercase">Nenhum atendimento para hoje</h3>
          <p className="text-muted-foreground text-sm max-w-[280px] mt-2 leading-relaxed">
            Sua agenda está livre para hoje. Use este tempo para atualizar prontuários ou revisar planos terapêuticos.
          </p>
        </div>
      )}

      {selectedPaciente && (
        <PacienteSheetMaster 
          pacienteId={selectedPaciente.id} 
          open={sheetOpen} 
          onOpenChange={setSheetOpen}
          defaultTab={sheetTab}
          vagaFixaIdContext={contextoRegistro.vagaId}
          especialidadeIdContext={contextoRegistro.especialidadeId}
          profissionalIdContext={contextoRegistro.profissionalId}
          dataHoraInicioContext={contextoRegistro.dataHoraInicio}
          dataHoraFimContext={contextoRegistro.dataHoraFim}
        />
      )}
    </div>
  )
}
