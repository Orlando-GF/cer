"use client"

import { useState, useTransition, useEffect } from "react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, AlertTriangle, Stethoscope, Hash, Loader2, CheckCircle2, History } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { registrarFaltaPaciente, buscarHistoricoFaltas } from "@/actions"
import { PacienteFilaTerapia, FaltaRegistro } from "@/types"

export interface PacienteSheetProps {
  paciente: PacienteFilaTerapia | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PacienteSheet({ paciente, open, onOpenChange }: PacienteSheetProps) {
  const [observacao, setObservacao] = useState("")
  const [justificada, setJustificada] = useState(true)
  const [showFaltas, setShowFaltas] = useState(false)
  const [historico, setHistorico] = useState<FaltaRegistro[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open && paciente) {
      setObservacao("")
      setJustificada(true)
      setShowFaltas(false)
      loadHistorico()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, paciente])

  const loadHistorico = async () => {
    if (!paciente) return
    setLoadingHistorico(true)
    try {
      const { success, data } = await buscarHistoricoFaltas(paciente.id)
      if (success && data) setHistorico(data)
    } finally {
      setLoadingHistorico(false)
    }
  }

  const handleRegistrarFalta = () => {
    if (!paciente) return
    startTransition(async () => {
      const res = await registrarFaltaPaciente({
        paciente_id: paciente.id,
        justificada,
        observacao,
      })
      if (res.success) {
        toast.success("Falta registrada com sucesso")
        loadHistorico()
        setObservacao("")
      } else {
        toast.error(`Erro: ${res.error}`)
      }
    })
  }

  if (!paciente) return null

  const statusMap = {
    "Aguardando Vaga": { color: "bg-alert-warning-bg text-alert-warning-text border-alert-warning-text/20", label: "Aguardando Vaga" },
    "Em Atendimento": { color: "bg-alert-success-bg text-alert-success-text border-alert-success-text/20", label: "Em Atendimento" },
    "Em Risco": { color: "bg-alert-danger-bg text-alert-danger-text border-alert-danger-text/20", label: "Em Risco" },
    Desistencia: { color: "bg-muted text-muted-foreground border-border", label: "Desistência" },
    Alta: { color: "bg-alert-shared-bg text-alert-shared-text border-alert-shared-text/20", label: "Alta Médica" },
  }

  const prioridadeMap = {
    Rotina: { color: "text-muted-foreground bg-muted border-border", label: "Rotina" },
    "Urgencia Clinica": { color: "text-alert-warning-text bg-alert-warning-bg border-alert-warning-text/20", label: "Urgência Clínica" },
    "Mandado Judicial": { color: "text-alert-danger-text bg-alert-danger-bg border-alert-danger-text/20", label: "Mandado Judicial" },
  }

  const s = statusMap[paciente.status as keyof typeof statusMap] || statusMap["Aguardando Vaga"]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="p-0 overflow-hidden flex flex-col">
        <div className="flex flex-col h-full bg-background">
          {/* Header estilizado */}
          <SheetHeader className="mb-0 border-b border-white/10 shrink-0">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-white/50 uppercase tracking-widest font-bold text-[10px]">
                  <Hash className="w-3 h-3" />
                  <span>Prontuário {paciente.cns}</span>
                </div>
                <SheetTitle className="text-xl font-black text-white leading-tight">
                  {paciente.nome}
                </SheetTitle>
              </div>
              <Badge variant="outline" className={`${s.color} border-none font-bold uppercase text-[10px] tracking-widest px-2 py-0.5 rounded-none`}>
                {s.label}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-none text-xs text-white/80 font-bold uppercase tracking-widest">
                <Stethoscope className="w-4 h-4 text-primary-300" />
                <span>{paciente.especialidade}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-none text-xs text-white/80 font-bold uppercase tracking-widest">
                <Calendar className="w-4 h-4 text-primary-300" />
                <span>Na fila desde <strong>{paciente.data_encaminhamento}</strong></span>
              </div>
            </div>
          </SheetHeader>

          <div className="p-7 space-y-8 flex-1 overflow-y-auto">
            {/* Cards de Métricas Rápidas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-card border border-border rounded-none space-y-1.5 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Tempo de espera
                </span>
                <p className="text-2xl font-black text-foreground tabular-nums">{paciente.dias_espera} dias</p>
              </div>
              <div className="p-5 bg-card border border-border rounded-none space-y-1.5 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1.5">
                   Alertas
                </span>
                <p className="text-2xl font-black text-foreground tabular-nums">0</p>
              </div>
            </div>
            {/* Seções de Detalhes */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Informações Clínicas</h4>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-4 border border-border rounded-none bg-card shadow-sm">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Prioridade</span>
                    <Badge variant="outline" className={`${prioridadeMap[paciente.prioridade as keyof typeof prioridadeMap]?.color || 'bg-muted'} border-none font-black uppercase text-[10px] rounded-none px-2 py-0.5`}>
                      {paciente.prioridade}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-none bg-card shadow-sm">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Solicitante</span>
                    <span className="text-sm font-black text-foreground uppercase tracking-tight">{paciente.profissional_nome || "Não informado"}</span>
                  </div>
                </div>
              </div>

              {/* Registro de Faltas */}
              <div className="space-y-5 pt-8 border-t border-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-alert-warning-text" /> Registro de Faltas
                  </h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 rounded-none border-none text-[10px] uppercase font-black tracking-widest text-primary hover:bg-primary/5"
                    onClick={() => setShowFaltas(!showFaltas)}
                  >
                    <History className="w-3.5 h-3.5 mr-2" />
                    Histórico ({historico.length})
                  </Button>
                </div>

                {showFaltas ? (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    {loadingHistorico ? (
                      <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    ) : historico.length === 0 ? (
                      <div className="text-center p-12 bg-muted/30 border border-dashed border-border text-muted-foreground text-xs font-bold uppercase tracking-widest">Nenhuma falta registrada.</div>
                    ) : (
                      <div className="space-y-3">
                        {historico.map(f => (
                          <div key={f.id} className="p-4 bg-card border border-border rounded-none flex items-start gap-4 shadow-sm">
                            <div className={`mt-1.5 h-2.5 w-2.5 rounded-none ${f.justificada ? 'bg-alert-shared-text' : 'bg-alert-danger-text'}`} />
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-black text-foreground tabular-nums">{new Date(f.data_falta).toLocaleDateString('pt-BR')}</span>
                                <Badge variant="outline" className={`text-[9px] uppercase font-black border-none rounded-none ${f.justificada ? 'text-alert-shared-text bg-alert-shared-bg' : 'text-alert-danger-text bg-alert-danger-bg'}`}>
                                  {f.justificada ? 'Justificada' : 'Não Justificada'}
                                </Badge>
                              </div>
                              {f.observacao && <p className="text-xs text-muted-foreground leading-relaxed">{f.observacao}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-muted/40 p-6 border border-border rounded-none space-y-6 shadow-inner">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="justificada" className="text-xs font-black uppercase tracking-widest text-foreground">Falta Justificada?</Label>
                      <Switch 
                        id="justificada" 
                        checked={justificada} 
                        onCheckedChange={setJustificada}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Observações / Motivo</Label>
                      <Textarea 
                        placeholder="Descreva o motivo da falta..." 
                        className="bg-card rounded-none border-border focus-visible:ring-primary min-h-[100px] text-sm"
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full rounded-none bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-xs h-12 shadow-md transition-all active:scale-[0.98] gap-2"
                      size="sm"
                      onClick={handleRegistrarFalta}
                      disabled={isPending}
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Registrar Ocorrência
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
