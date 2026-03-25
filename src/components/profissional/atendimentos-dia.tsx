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
          <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase">Atendimentos de Hoje</h2>
          <p className="text-muted-foreground text-sm uppercase tracking-wider font-medium">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="rounded-none border-primary/20 text-primary font-bold uppercase tracking-widest text-[10px]">
          Atualizar Agenda
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {atendimentos.map((atend) => (
          <Card key={atend.id} className="rounded-none border-border hover:border-primary/50 transition-all shadow-sm overflow-hidden group">
             <div className="h-1.5 w-full bg-primary" />
             <CardHeader className="pb-3">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{format(new Date(atend.data_hora_inicio), "HH:mm")}</span>
                  </div>
                  <Badge variant="outline" className={`rounded-none uppercase text-[9px] font-bold border-none ${
                    atend.status_comparecimento === 'Presente' ? 'bg-alert-success-bg text-alert-success-text' :
                    atend.status_comparecimento === 'Falta Nao Justificada' ? 'bg-alert-danger-bg text-alert-danger-text' :
                    atend.status_comparecimento === 'Falta Justificada' ? 'bg-alert-warning-bg text-alert-warning-text' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {atend.status_comparecimento}
                  </Badge>
               </div>
               <CardTitle className="text-base font-bold text-foreground mt-2 line-clamp-1 uppercase">
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
          <Card key={vaga.id} className="rounded-none border-dashed border-muted-foreground/30 bg-muted/5 opacity-80 hover:opacity-100 transition-all shadow-none group">
             <div className="h-1.5 w-full bg-muted-foreground/20" />
             <CardHeader className="pb-3">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 text-muted-foreground font-bold">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{vaga.horario_inicio.slice(0, 5)}</span>
                  </div>
                  <Badge variant="outline" className="rounded-none uppercase text-[9px] font-bold border-muted-foreground/30 text-muted-foreground">
                    Pendente
                  </Badge>
               </div>
               <CardTitle className="text-base font-bold text-muted-foreground mt-2 line-clamp-1 uppercase">
                 {vaga.pacientes?.nome_completo}
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
                    variant="outline" 
                    className="w-full rounded-none text-[10px] h-9 font-bold uppercase tracking-widest border-primary/20 text-primary hover:bg-primary hover:text-white"
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
