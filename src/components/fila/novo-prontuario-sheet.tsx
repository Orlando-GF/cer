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
import { buscarPacientePorDocumento, incluirPacienteNaFila, type ActionResponse } from "@/app/actions"
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
  return onlyDigits(value).substring(0, 15)
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 shrink-0">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <span className="text-xs font-semibold tracking-widest text-slate-500">{title}</span>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
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
  const [pacienteEncontrado, setPacienteEncontrado] = useState<any>(null)

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
        handleOpen(false)
      }
    })
  }

  return (
    <>
      <Button
        className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-4 h-4" />
        Incluir na fila
      </Button>

      <Sheet open={open} onOpenChange={handleOpen}>
        <SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-[600px] p-0 overflow-hidden flex flex-col">

          {/* HEADER */}
          <SheetHeader className="px-7 py-5 border-b bg-white shrink-0">
            <SheetTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              Inserir na fila de espera
            </SheetTitle>
            {etapa === "busca" && (
              <p className="text-sm text-slate-500 mt-0.5">
                Localize o paciente cadastrado na Base.
              </p>
            )}
            {etapa === "formulario" && (
              <div className="flex items-center gap-2 mt-1">
                <button type="button" onClick={() => setEtapa("busca")}
                  className="text-xs text-blue-600 hover:underline">
                  ← Trocar paciente
                </button>
              </div>
            )}
          </SheetHeader>

          {/* ── ETAPA 0: BUSCA ─────────────────────────────────────────────── */}
          {etapa === "busca" && (
            <div className="flex-1 flex flex-col bg-slate-50 items-center justify-center px-10 gap-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shadow-inner">
                  <Search className="w-7 h-7 text-blue-600" />
                </div>
                <p className="text-slate-600 text-sm max-w-sm">
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
                    placeholder="CNS ou CPF..."
                    className="text-base h-12 tracking-wider font-mono shadow-sm bg-white"
                    autoFocus
                  />
                  <Button type="button" onClick={handleBuscar}
                    disabled={buscando || !identificador.trim()}
                    className="h-12 px-6 bg-blue-600 hover:bg-blue-700 shrink-0 shadow-sm">
                    {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                  </Button>
                </div>

                {statusBusca === "encontrado" && pacienteEncontrado && (
                  <div className="p-4 rounded-xl border border-green-200 bg-green-50 animate-in fade-in duration-300">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-800">{pacienteEncontrado.nome_completo}</p>
                        <p className="text-xs text-green-700 mt-1">CNS: {pacienteEncontrado.cns}</p>
                        <p className="text-xs text-green-700">Idade: {new Date().getFullYear() - new Date(pacienteEncontrado.data_nascimento).getFullYear()} anos</p>
                      </div>
                    </div>
                  </div>
                )}
                {statusBusca === "nao_encontrado" && (
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 flex flex-col items-center text-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Paciente não localizado</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Você precisa realizar o cadastro completo deste paciente antes de inseri-lo na fila.
                      </p>
                    </div>
                    <Link href="/pacientes">
                      <Button type="button" variant="outline" size="sm" className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100">
                        Ir para Base de Pacientes <ArrowRight className="w-3 h-3 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              <div className="w-full max-w-md pt-4">
                <Button type="button" onClick={handleAvancar}
                  disabled={statusBusca !== "encontrado"}
                  className="w-full h-12 text-sm bg-slate-800 hover:bg-slate-900 gap-2 shadow-md">
                  Avançar e inserir na fila
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── ETAPA 1: FILA DE ESPERA FORMULÁRIO ───────────────────────── */}
          {etapa === "formulario" && pacienteEncontrado && (
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden bg-slate-50">

              <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
                
                {/* Paciente Encontrado */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800 leading-tight">{pacienteEncontrado.nome_completo}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">CNS: {pacienteEncontrado.cns}</p>
                  </div>
                </div>

                {/* FILA */}
                <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <SectionHeader icon={Stethoscope} title="Parâmetros de inserção na fila" />
                  <div className="space-y-4">

                    <Field label="Especialidade / Terapia" required>
                      <Select value={especialidadeId} onValueChange={(v) => setEspecialidadeId(v as string)}>
                        <SelectTrigger className="w-full">
                          <span className={especialidadeId ? "text-foreground" : "text-muted-foreground"}>
                            {especialidadeId
                              ? especialidades.find((e) => e.id === especialidadeId)?.nome_especialidade
                              : "Selecione a especialidade..."}
                          </span>
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
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Rotina">Rotina</SelectItem>
                            <SelectItem value="Urgencia Clinica">Urgência Clínica</SelectItem>
                            <SelectItem value="Mandado Judicial">Mandado Judicial</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Frequência Recomendada" required>
                        <Select value={frequencia} onValueChange={(v) => setFrequencia(v as string)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A definir">A definir</SelectItem>
                            <SelectItem value="Semanal">Semanal</SelectItem>
                            <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                            <SelectItem value="Mensal">Mensal</SelectItem>
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
                            className="border-red-300 focus-visible:ring-red-400"
                            required
                          />
                        </Field>
                      </div>
                    )}

                    <Field label="Origem do Encaminhamento">
                      <Input
                        value={origemEncaminhamento}
                        onChange={(e) => setOrigemEncaminhamento(e.target.value)}
                        placeholder="Ex: UBS Centro, Hospital Regional..."
                      />
                    </Field>

                  </div>
                </section>

                {submitError && (
                  <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                    {submitError}
                  </div>
                )}

              </div>

              {/* FOOTER */}
              <div className="shrink-0 border-t bg-white px-7 py-4 flex gap-3">
                <Button type="button" variant="outline" className="flex-1"
                  onClick={() => handleOpen(false)} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                  disabled={isPending || !especialidadeId}>
                  {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
                  ) : (
                    <>Inserir na fila<CheckCircle2 className="h-4 w-4" /></>
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
