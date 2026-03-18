"use client"

import { useState, useTransition, useEffect, useMemo } from "react"
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


export type PacienteFila = {
  id: string
  nome: string
  cns: string
  prioridade: "Rotina" | "Urgencia Clinica" | "Mandado Judicial"
  status: "Aguardando" | "Em Atendimento" | "Em Risco" | "Desistencia" | "Alta"
  especialidade: string
  dataEntrada: string
  faltas: number
}

interface FaltaHistorico {
  id: string
  data_falta: string
  justificada: boolean
  observacao?: string
}

/*
## Fase 8: Depuração de Erro Runtime [/]
- [x] Analisar logs do terminal e stack traces (Identificada causa provável em hooks/promessas)
- [x] Corrigir erro de hooks no `paciente-sheet.tsx` (Hook order fix)
- [/] Adicionar robustez a promessas no `paciente-sheet.tsx` (.catch e neutralização de undefined)
- [ ] Validar integridade dos componentes de UI recém-modificados
*/

interface PacienteSheetProps {
  paciente: PacienteFila | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const prioridadeConfig = {
  "Rotina": { color: "bg-slate-100 text-slate-700", label: "Rotina" },
  "Urgencia Clinica": { color: "bg-orange-100 text-orange-800", label: "Urgência Clínica" },
  "Mandado Judicial": { color: "bg-red-100 text-red-800", label: "Mandado Judicial" },
}

const statusConfig = {
  "Aguardando": { color: "bg-alert-warning-bg text-alert-warning-text", label: "Aguardando" },
  "Em Atendimento": { color: "bg-alert-success-bg text-alert-success-text", label: "Em Atendimento" },
  "Em Risco": { color: "bg-alert-danger-bg text-alert-danger-text border border-alert-danger-text/20", label: "Em Risco (Faltas)" },
  "Desistencia": { color: "bg-slate-100 text-slate-600", label: "Desistência" },
  "Alta": { color: "bg-alert-shared-bg text-alert-shared-text", label: "Alta" },
}

export function PacienteSheet({ paciente, open, onOpenChange }: PacienteSheetProps) {
  const [isRegisteringFalta, setIsRegisteringFalta] = useState(false)
  const [justificada, setJustificada] = useState(false)
  const [observacao, setObservacao] = useState("")
  const [isPending, startTransition] = useTransition()

  const [historicoFaltas, setHistoricoFaltas] = useState<FaltaHistorico[]>([])
  const [isLoadingHistorico, setIsLoadingHistorico] = useState(false)

  // Busca histórico de faltas ao abrir o paciente
  useEffect(() => {
    if (open && paciente?.id) {
      setIsLoadingHistorico(true)
      buscarHistoricoFaltas(paciente.id)
        .then((res) => {
          if (res?.success && res?.data) {
            setHistoricoFaltas(res.data as FaltaHistorico[])
          } else {
            setHistoricoFaltas([])
          }
          setIsLoadingHistorico(false)
        })
        .catch((err) => {
          console.error("Erro ao buscar histórico:", err)
          setHistoricoFaltas([])
          setIsLoadingHistorico(false)
        })
    } else {
      setHistoricoFaltas([])
    }
  }, [open, paciente?.id])

  const diasEspera = useMemo(() => {
    if (!paciente) return 0
    const entrada = new Date(paciente.dataEntrada).getTime()
    if (isNaN(entrada)) return 0
    const hoje = new Date().setHours(0, 0, 0, 0)
    return Math.floor((hoje - entrada) / (1000 * 60 * 60 * 24))
  }, [paciente])

  const prio = paciente ? prioridadeConfig[paciente.prioridade] : { color: "", label: "" }
  const stat = paciente ? statusConfig[paciente.status] : { color: "", label: "" }

  if (!paciente) return null

  const handleRegistrarFalta = () => {
    startTransition(async () => {
      if (!paciente) return
      const result = await registrarFaltaPaciente({
        fila_id: paciente.id,
        justificada,
        observacao,
      })

      if (result.success) {
        toast.success("Falta registrada com sucesso.")
        setIsRegisteringFalta(false)
        setJustificada(false)
        setObservacao("")
        onOpenChange(false)
      } else {
        toast.error(result.error || "Erro ao registrar falta.")
      }
    })
  }

  const fecharOuCancelar = (isOpen: boolean) => {
    if (!isOpen) {
      setIsRegisteringFalta(false)
      setJustificada(false)
      setObservacao("")
    }
    onOpenChange(isOpen)
  }

  return (
    <Sheet open={open} onOpenChange={fecharOuCancelar}>
      <SheetContent
        side="right"
        className="p-0 overflow-hidden flex flex-col"
      >
        {/* HEADER */}
        <SheetHeader className="mb-0 border-b border-white/10 shrink-0">
          <div className="flex items-start justify-between gap-4 w-full">
            <div className="flex-1 min-w-0">
              <SheetTitle className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-white/70" />
                {paciente.nome}
              </SheetTitle>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                CNS: <span className="font-mono text-white/90">{paciente.cns}</span>
              </p>
            </div>
            <div className="flex flex-col gap-1.5 items-end shrink-0">
              <Badge className={`${prio.color} border-none text-[9px] font-bold uppercase tracking-wider rounded-none px-2`}>{prio.label}</Badge>
              <Badge className={`${stat.color} border-none text-[9px] font-bold uppercase tracking-wider rounded-none px-2`}>{stat.label}</Badge>
            </div>
          </div>
        </SheetHeader>

        {/* BODY rolável */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">

          {/* Info da fila */}
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
              Situação na fila
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-none border border-slate-100 bg-white p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Stethoscope className="w-4 h-4" />
                  <span className="text-xs">Especialidade</span>
                </div>
                <p className="text-sm font-medium text-slate-800">{paciente.especialidade}</p>
              </div>
              <div className="rounded-none border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-muted mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">Dias em espera</span>
                </div>
                <p className="text-2xl font-bold text-primary">{diasEspera}</p>
              </div>
              <div className="rounded-none border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs">Faltas</span>
                </div>
                <p className={`text-2xl font-bold ${paciente.faltas >= 2 ? "text-red-600" : "text-slate-700"}`}>
                  {paciente.faltas}<span className="text-sm font-normal text-slate-500">/3</span>
                </p>
              </div>
            </div>
          </section>

          {/* Data de entrada */}
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
              Histórico
            </h3>
            <div className="flex items-center gap-3 p-4 rounded-none border border-slate-100 bg-white">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Data de entrada na fila</p>
                <p className="text-sm font-medium text-slate-800">
                  {new Date(paciente.dataEntrada).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </section>

          {/* Alerta de faltas críticas */}
          {paciente.faltas >= 2 && (
            <div className="flex items-start gap-3 rounded-none border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  {paciente.faltas >= 3 ? "Limite de faltas atingido" : "Atenção: próximo do limite"}
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  {paciente.faltas >= 3
                    ? "Paciente pode ser desligado da fila por 3 faltas injustificadas."
                    : "1 falta restante antes de atingir o limite de desligamento."}
                </p>
              </div>
            </div>
          )}

          {/* Histórico de Faltas - Secão Nova */}
          <section className="pt-4 border-t border-slate-100">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <History className="w-4 h-4" />
              Últimas faltas registradas
            </h3>
            
            {isLoadingHistorico ? (
              <div className="flex items-center justify-center py-6 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : historicoFaltas.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-none bg-slate-50 border border-slate-100 border-dashed">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Nenhum registro de falta para este paciente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historicoFaltas.map((falta) => (
                  <div key={falta.id} className="flex flex-col gap-1 p-3 rounded-none border border-slate-100 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(falta.data_falta + 'T00:00:00').toLocaleDateString("pt-BR")}
                      </span>
                      {falta.justificada ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none text-[10px] font-semibold h-5">Justificada</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 shadow-none text-[10px] font-semibold h-5">Não justificada</Badge>
                      )}
                    </div>
                    {falta.observacao && (
                      <p className="text-xs text-slate-500 pl-5 border-l-2 border-slate-100 ml-1.5 py-0.5 mt-1 align-middle">
                        {falta.observacao}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* FOOTER fixo - Adaptativo */}
        <div className="shrink-0 border-t bg-white px-7 py-4">
          {!isRegisteringFalta ? (
            <div className="flex gap-3">
              <Button className="flex-1 shadow-sm" onClick={() => toast.info("Agendamento em desenvolvimento.", { description: "Esta funcionalidade estará disponível em breve." })}>
                Agendar sessão
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => setIsRegisteringFalta(true)}
              >
                Registrar falta
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between border-b pb-3 border-red-100">
                <h4 className="font-medium text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Registrar nova falta
                </h4>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="justificada" 
                    checked={justificada} 
                    onCheckedChange={setJustificada} 
                  />
                  <Label htmlFor="justificada" className="text-xs text-slate-600 cursor-pointer">
                    Falta justificada?
                  </Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="obs" className="text-xs text-slate-500">Observação (Opcional)</Label>
                <Textarea 
                  id="obs" 
                  placeholder="Motivo da falta ou observação pertinente..."
                  className="resize-none h-20 text-sm"
                  value={observacao}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setObservacao(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsRegisteringFalta(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1 gap-2"
                  onClick={handleRegistrarFalta}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  {isPending ? "Registrando..." : "Confirmar falta"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
