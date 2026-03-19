"use client"

import { useState, useTransition } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Loader2,
  Stethoscope,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  ArrowRight
} from "lucide-react"
import { buscarPacientePorDocumento, incluirPacienteNaFila } from "@/actions"
import { type ActionResponse, type Paciente } from "@/types"
import { toast } from "sonner"
import Link from "next/link"

// ─── tipos ────────────────────────────────────────────────────────────────────

interface Especialidade {
  id: string
  nome_especialidade: string
}

interface NovoProntuarioSheetProps {
  especialidades: Especialidade[]
}

// ─── funções de máscara ───────────────────────────────────────────────────────

const onlyDigits = (v: string) => v.replace(/\D/g, "")

function maskCPF(value: string): string {
  const d = onlyDigits(value).substring(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function maskCNS(value: string): string {
  const d = onlyDigits(value).substring(0, 15)
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)} ${d.slice(3)}`
  if (d.length <= 11) return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`
  return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7, 11)} ${d.slice(11)}`
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
      <div className="flex items-center justify-center w-7 h-7 rounded-none bg-muted shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">{title}</span>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ─── componente principal ─────────────────────────────────────────────────────

export function NovoProntuarioSheet({ especialidades }: NovoProntuarioSheetProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [etapa, setEtapa] = useState<"busca" | "formulario">("busca")

  // busca
  const [identificador, setIdentificador] = useState("")
  const [buscando, setBuscando] = useState(false)
  const [statusBusca, setStatusBusca] = useState<"idle" | "encontrado" | "nao_encontrado">("idle")
  const [pacienteEncontrado, setPacienteEncontrado] = useState<Paciente | null>(null)

  // form da fila
  const [origemEncaminhamento, setOrigemEncaminhamento] = useState("")
  const [numProcesso, setNumProcesso] = useState("")
  const [prioridade, setPrioridade] = useState("Rotina")
  const [frequencia, setFrequencia] = useState("A definir")
  const [especialidadeId, setEspecialidadeId] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)

  function handleOpen(v: boolean) {
    setOpen(v)
    if (!v) {
      setEtapa("busca")
      setIdentificador("")
      setStatusBusca("idle")
      setPacienteEncontrado(null)
      setOrigemEncaminhamento("")
      setNumProcesso("")
      setPrioridade("Rotina")
      setFrequencia("A definir")
      setEspecialidadeId("")
      setSubmitError(null)
    }
  }

  async function handleBuscar() {
    if (!identificador.trim()) return
    setBuscando(true)
    setStatusBusca("idle")
    setPacienteEncontrado(null)
    
    const docLimpo = onlyDigits(identificador)
    const result = await buscarPacientePorDocumento(docLimpo)
    
    setBuscando(false)
    if (result.success && result.data) {
      setPacienteEncontrado(result.data)
      setStatusBusca("encontrado")
    } else {
      setStatusBusca("nao_encontrado")
    }
  }

  function handleAvancar() {
    if (!pacienteEncontrado) return
    setEtapa("formulario")
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!pacienteEncontrado) return
    setSubmitError(null)

    const payload = {
      paciente_id: pacienteEncontrado.id,
      especialidade_id: especialidadeId,
      nivel_prioridade: prioridade,
      frequencia_recomendada: frequencia,
      origem_encaminhamento: origemEncaminhamento || undefined,
      numero_processo_judicial: prioridade === "Mandado Judicial" ? numProcesso : undefined,
    }

    startTransition(async () => {
      const result: ActionResponse = await incluirPacienteNaFila(payload)
      if (!result.success) {
        setSubmitError(result.error || "Ocorreu um erro desconhecido.")
      } else {
        toast.success("Paciente inserido na fila com sucesso!")
        handleOpen(false)
      }
    })
  }

  return (
    <>
      <Button
        className="gap-2 shadow-sm"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-4 h-4" />
        Incluir na fila
      </Button>

      <Sheet open={open} onOpenChange={handleOpen}>
        <SheetContent side="right" className="p-0 overflow-hidden flex flex-col">

          {/* HEADER */}
          <SheetHeader className="mb-0 border-b border-white/10 shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-white/70" />
              Inserir na fila de espera
            </SheetTitle>
            {etapa === "busca" && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mt-0.5">
                Localize o paciente cadastrado na Base.
              </p>
            )}
            {etapa === "formulario" && (
              <div className="flex items-center gap-2 mt-1">
                <button type="button" onClick={() => setEtapa("busca")}
                  className="text-xs font-bold uppercase tracking-widest text-white/80 hover:text-white hover:underline transition-all">
                  ← Trocar paciente
                </button>
              </div>
            )}
          </SheetHeader>

          {/* ── ETAPA 0: BUSCA ─────────────────────────────────────────────── */}
          {etapa === "busca" && (
            <div className="flex-1 flex flex-col bg-background items-center justify-center px-10 gap-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-none bg-muted flex items-center justify-center shadow-inner">
                  <Search className="w-7 h-7 text-primary" />
                </div>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Informe o <strong>CNS</strong> ou <strong>CPF</strong> para pesquisar na Base de Pacientes do CER II.
                </p>
              </div>

              <div className="w-full max-w-md space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={identificador}
                    onChange={(e) => {
                      const d = onlyDigits(e.target.value)
                      setIdentificador(d.length > 11 ? maskCNS(d) : maskCPF(d))
                      setStatusBusca("idle")
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                    placeholder="CNS OU CPF..."
                    className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-wider"
                    maxLength={15}
                    autoFocus
                  />
                  <Button type="button" onClick={handleBuscar}
                    disabled={buscando || !identificador.trim()}
                    className="h-12 px-6 rounded-none bg-primary font-bold uppercase tracking-widest shadow-md">
                    {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                  </Button>
                </div>

                {statusBusca === "encontrado" && pacienteEncontrado && (
                  <div className="p-4 rounded-none border border-alert-success-text/20 bg-alert-success-bg animate-in fade-in duration-300">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-alert-success-text shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-alert-success-text">{pacienteEncontrado.nome_completo}</p>
                        <p className="text-xs text-alert-success-text/80 mt-1">CNS: {pacienteEncontrado.cns}</p>
                        <p className="text-xs text-alert-success-text/80">Idade: {new Date().getFullYear() - new Date(pacienteEncontrado.data_nascimento).getFullYear()} anos</p>
                      </div>
                    </div>
                  </div>
                )}
                {statusBusca === "nao_encontrado" && (
                  <div className="p-4 rounded-none border border-alert-warning-text/20 bg-alert-warning-bg flex flex-col items-center text-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                    <AlertCircle className="w-6 h-6 text-alert-warning-text" />
                    <div>
                      <p className="text-sm font-medium text-alert-warning-text">Paciente não localizado</p>
                      <p className="text-xs text-alert-warning-text/80 mt-1">
                        Você precisa realizar o cadastro completo deste paciente antes de inseri-lo na fila.
                      </p>
                    </div>
                    <Link href="/pacientes">
                      <Button type="button" variant="outline" size="sm" className="mt-2 border-alert-warning-text/30 text-alert-warning-text hover:bg-alert-warning-text/10">
                        Ir para Base de Pacientes <ArrowRight className="w-3 h-3 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              <div className="w-full max-w-md pt-4">
                <Button type="button" onClick={handleAvancar}
                  disabled={statusBusca !== "encontrado"}
                  className="w-full h-14 rounded-none text-sm bg-primary border-none hover:bg-primary/90 gap-2 shadow-lg uppercase font-bold tracking-widest">
                  Avançar e inserir na fila
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── ETAPA 1: FILA DE ESPERA FORMULÁRIO ───────────────────────── */}
          {etapa === "formulario" && pacienteEncontrado && (
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden bg-background">

              <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
                
                {/* Paciente Encontrado */}
                <div className="bg-card p-4 rounded-none border border-border shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-none bg-muted flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground leading-tight uppercase text-xs">{pacienteEncontrado.nome_completo}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground mt-0.5 tracking-tight">CNS: {pacienteEncontrado.cns}</p>
                  </div>
                </div>

                {/* FILA */}
                <section className="bg-card p-6 rounded-none border border-border shadow-sm">
                  <SectionHeader icon={Stethoscope} title="Parâmetros de inserção na fila" />
                  <div className="space-y-4">

                      <Field label="Especialidade / Terapia" required>
                        <Select value={especialidadeId} onValueChange={(v) => setEspecialidadeId(v as string)}>
                          <SelectTrigger className="w-full h-12 rounded-none border-border font-bold bg-card text-xs uppercase tracking-wider">
                            <SelectValue placeholder="SELECIONE A ESPECIALIDADE..." />
                          </SelectTrigger>
                        <SelectContent>
                          {especialidades.map((esp) => (
                            <SelectItem key={esp.id} value={esp.id}>{esp.nome_especialidade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Nível de Prioridade" required>
                        <Select value={prioridade} onValueChange={(v) => setPrioridade(v as string)}>
                          <SelectTrigger className="w-full h-12 rounded-none border-border font-bold bg-card text-xs uppercase tracking-wider"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-none border-none shadow-2xl">
                            <SelectItem value="Rotina" className="font-bold uppercase text-[11px]">Rotina</SelectItem>
                            <SelectItem value="Urgencia Clinica" className="font-bold uppercase text-[11px]">Urgência Clínica</SelectItem>
                            <SelectItem value="Mandado Judicial" className="font-bold uppercase text-[11px]">Mandado Judicial</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Frequência Recomendada" required>
                        <Select value={frequencia} onValueChange={(v) => setFrequencia(v as string)}>
                          <SelectTrigger className="w-full h-12 rounded-none border-border font-bold bg-card text-xs uppercase tracking-wider"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-none border-none shadow-2xl">
                            <SelectItem value="A definir" className="font-bold uppercase text-[11px]">A definir</SelectItem>
                            <SelectItem value="Semanal" className="font-bold uppercase text-[11px]">Semanal</SelectItem>
                            <SelectItem value="Quinzenal" className="font-bold uppercase text-[11px]">Quinzenal</SelectItem>
                            <SelectItem value="Mensal" className="font-bold uppercase text-[11px]">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>

                    {prioridade === "Mandado Judicial" && (
                      <div className="animate-in slide-in-from-top-2 duration-200">
                        <Field label="Nº do Processo Judicial" required>
                          <Input
                            value={numProcesso}
                            onChange={(e) => setNumProcesso(e.target.value)}
                            placeholder="0001234-12.2024.8.05.0000"
                            className="rounded-none border-destructive/30 h-12 font-bold focus-visible:ring-destructive/40 bg-alert-danger-bg uppercase text-xs"
                            maxLength={40}
                            required
                          />
                        </Field>
                      </div>
                    )}

                    <Field label="Origem do Encaminhamento">
                      <Input
                        value={origemEncaminhamento}
                        onChange={(e) => setOrigemEncaminhamento(e.target.value)}
                        placeholder="EX: UBS CENTRO, HOSPITAL REGIONAL..."
                        className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs"
                        maxLength={100}
                      />
                    </Field>

                  </div>
                </section>

                {submitError && (
                  <div className="flex items-start gap-2 rounded-none border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                    {submitError}
                  </div>
                )}

              </div>

              {/* FOOTER */}
              <div className="shrink-0 border-t bg-card px-7 py-5 flex gap-3">
                <Button type="button" variant="outline" className="flex-1 h-14 rounded-none border-border font-bold uppercase tracking-widest text-muted-foreground"
                  onClick={() => handleOpen(false)} disabled={isPending}>
                  CANCELAR
                </Button>
                <Button type="submit" className="flex-1 h-14 rounded-none bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest shadow-lg shadow-primary/20 gap-2"
                  disabled={isPending || !especialidadeId}>
                  {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />SALVANDO...</>
                  ) : (
                    <>INSERIR NA FILA<ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </div>

            </form>
          )}

        </SheetContent>
      </Sheet>
    </>
  )
}
