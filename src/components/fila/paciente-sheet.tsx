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
import { PacienteFila, FaltaRegistro } from "@/types"

export interface PacienteSheetProps {
  paciente: PacienteFila | null
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
    Aguardando: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Aguardando" },
    "Em Atendimento": { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Em Atendimento" },
    "Em Risco": { color: "bg-red-100 text-red-700 border-red-200", label: "Em Risco" },
    Desistencia: { color: "bg-slate-100 text-slate-700 border-slate-200", label: "Desistência" },
    Alta: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Alta Médica" },
  }

  const prioridadeMap = {
    Rotina: { color: "text-slate-600 bg-slate-50 border-slate-200", label: "Rotina" },
    "Urgencia Clinica": { color: "text-orange-600 bg-orange-50 border-orange-200", label: "Urgência Clínica" },
    "Mandado Judicial": { color: "text-red-600 bg-red-50 border-red-200", label: "Mandado Judicial" },
  }

  const s = statusMap[paciente.status] || statusMap.Aguardando

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white border-l p-0">
        <div className="flex flex-col h-full">
          {/* Header estilizado */}
          <div className="bg-slate-50 border-b p-6 space-y-4">
            <div className="flex justify-between items-start">
              <SheetHeader className="text-left space-y-1">
                <div className="flex items-center gap-2 text-primary uppercase tracking-tighter font-bold text-xs opacity-60">
                  <Hash className="w-3 h-3" />
                  <span>Prontuário {paciente.cns}</span>
                </div>
                <SheetTitle className="text-2xl font-black text-slate-900 leading-tight">
                  {paciente.nome}
                </SheetTitle>
              </SheetHeader>
              <Badge variant="outline" className={`${s.color} border font-bold uppercase text-[10px] tracking-widest px-2 py-0.5 rounded-none`}>
                {s.label}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-none text-sm text-slate-600 shadow-sm">
                <Stethoscope className="w-4 h-4 text-primary" />
                <span className="font-semibold">{paciente.especialidade}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-none text-sm text-slate-600 shadow-sm">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Na fila desde <strong>{paciente.data_encaminhamento}</strong></span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8 flex-1">
            {/* Cards de Métricas Rápidas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-none space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Tempo de espera
                </span>
                <p className="text-xl font-black text-slate-900">{paciente.dias_espera} dias</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-none space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                   Alertas
                </span>
                <p className="text-xl font-black text-slate-900">0</p>
              </div>
            </div>

            {/* Seções de Detalhes */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest">Informações Clínicas</h4>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-none bg-white">
                    <span className="text-sm text-slate-500">Prioridade</span>
                    <Badge variant="outline" className={`${prioridadeMap[paciente.prioridade as keyof typeof prioridadeMap]?.color || 'bg-slate-50'} border-none font-bold`}>
                      {paciente.prioridade}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-none bg-white">
                    <span className="text-sm text-slate-500">Médico solicitante</span>
                    <span className="text-sm font-semibold">{paciente.profissional_nome || "Não informado"}</span>
                  </div>
                </div>
              </div>

              {/* Registro de Faltas */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-amber-500" /> Registro de Faltas
                  </h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] uppercase font-bold text-primary"
                    onClick={() => setShowFaltas(!showFaltas)}
                  >
                    <History className="w-3.5 h-3.5 mr-1" />
                    Histórico ({historico.length})
                  </Button>
                </div>

                {showFaltas ? (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    {loadingHistorico ? (
                      <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    ) : historico.length === 0 ? (
                      <div className="text-center p-8 bg-slate-50 border border-dashed text-slate-400 text-sm">Nenhuma falta registrada.</div>
                    ) : (
                      <div className="space-y-2">
                        {historico.map(f => (
                          <div key={f.id} className="p-3 bg-white border rounded-none flex items-start gap-3">
                            <div className={`mt-1 h-2 w-2 rounded-full ${f.justificada ? 'bg-blue-400' : 'bg-red-500'}`} />
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold">{new Date(f.data_falta).toLocaleDateString('pt-BR')}</span>
                                <Badge variant="outline" className={`text-[9px] uppercase font-black ${f.justificada ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-red-600 bg-red-50 border-red-100'}`}>
                                  {f.justificada ? 'Justificada' : 'Não Justificada'}
                                </Badge>
                              </div>
                              {f.observacao && <p className="text-xs text-slate-500 leading-relaxed">{f.observacao}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 border rounded-none space-y-4 shadow-inner">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="justificada" className="text-sm font-bold text-slate-700">Falta Justificada?</Label>
                      <Switch 
                        id="justificada" 
                        checked={justificada} 
                        onCheckedChange={setJustificada}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-slate-400">Observações / Motivo</Label>
                      <Textarea 
                        placeholder="Descreva o motivo da falta..." 
                        className="bg-white rounded-none border-slate-200 focus-visible:ring-primary min-h-[80px]"
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full rounded-none font-bold uppercase tracking-widest text-xs h-10 shadow-lg"
                      size="sm"
                      onClick={handleRegistrarFalta}
                      disabled={isPending}
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
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
