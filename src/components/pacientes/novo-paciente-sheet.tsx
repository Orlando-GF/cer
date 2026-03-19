"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Loader2,
  User,
  Search,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { PacienteForm, PacienteFormData } from "./paciente-form"
import { buscarPacientePorDocumento } from "@/actions"
// ─── funções auxiliares ───────────────────────────────────────────────────────

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

export function NovoPacienteSheet() {
  const [open, setOpen] = useState(false)
  const [etapa, setEtapa] = useState<"busca" | "formulario">("busca")

  // busca
  const [identificador, setIdentificador] = useState("")
  const [buscando, setBuscando] = useState(false)
  const [statusBusca, setStatusBusca] = useState<"idle" | "encontrado" | "nao_encontrado">("idle")

  // dados iniciais para o form
  const [dados, setDados] = useState<PacienteFormData>({})

  function handleOpen(v: boolean) {
    setOpen(v)
    if (!v) {
      setEtapa("busca")
      setIdentificador("")
      setStatusBusca("idle")
      setDados({})
    }
  }

  async function handleBuscar() {
    if (!identificador.trim()) return
    setBuscando(true)
    setStatusBusca("idle")
    
    const docLimpo = onlyDigits(identificador)
    const result = await buscarPacientePorDocumento(docLimpo)
    
    setBuscando(false)
    if (result.success && result.data) {
      setDados(result.data as PacienteFormData)
      setStatusBusca("encontrado")
    } else {
      setStatusBusca("nao_encontrado")
    }
  }

  function handleAvancar() {
    const val = onlyDigits(identificador)
    const isCns = val.length === 15
    setDados({ [isCns ? "cns" : "cpf"]: val })
    setEtapa("formulario")
  }

  return (
    <>
      <Button
        className="gap-2 shadow-sm"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-4 h-4" />
        Cadastrar Paciente
      </Button>

      <Sheet open={open} onOpenChange={handleOpen}>
        <SheetContent side="right" className="p-0 overflow-hidden flex flex-col">

          {/* HEADER */}
          <SheetHeader className="mb-0 border-b border-white/10 shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <User className="w-4 h-4 text-white/70" />
              CADASTRO BASE DE PACIENTE
            </SheetTitle>
            {etapa === "busca" && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mt-0.5">
                Informe o CNS OU CPF para começar.
              </p>
            )}
            {etapa === "formulario" && (
              <div className="flex items-center gap-2 mt-1">
                <button type="button" onClick={() => setEtapa("busca")}
                  className="text-[10px] font-bold uppercase tracking-widest text-white/80 hover:text-white transition-all">
                  ← Voltar à busca
                </button>
                <span className="text-white/20">|</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Preencha os dados obrigatórios para salvar.
                </span>
              </div>
            )}
          </SheetHeader>

          {/* ── ETAPA 0: BUSCA ─────────────────────────────────────────────── */}
          {etapa === "busca" && (
            <div className="flex-1 flex flex-col items-center justify-center px-10 gap-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-none bg-muted/40 flex items-center justify-center">
                  <Search className="w-7 h-7 text-primary" />
                </div>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Digite o <strong>CNS</strong> (15 dígitos) ou <strong>CPF</strong> (11 dígitos). Os dados serão pré-preenchidos quando disponível, ou preencha o cadastro manualmente.
                </p>
              </div>

              <div className="w-full max-w-md space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={identificador}
                    onChange={(e) => {
                      const d = onlyDigits(e.target.value)
                      setIdentificador(d.length > 11 ? maskCNS(d) : maskCPF(d))
                      setStatusBusca("idle")
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                    placeholder="CNS OU CPF"
                    className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-wider"
                    maxLength={15}
                    autoFocus
                  />
                  <Button type="button" onClick={handleBuscar}
                    disabled={buscando || !identificador.trim()}
                    className="h-12 px-6 rounded-none bg-primary font-bold uppercase tracking-widest shadow-md">
                    {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>

                {statusBusca === "encontrado" && (
                  <div className="flex items-center gap-2 text-sm text-[var(--color-alert-success-text)] bg-[var(--color-alert-success-bg)] border border-[var(--color-alert-success-text)]/20 rounded-none px-4 py-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Paciente encontrado! Dados pré-preenchidos.</span>
                  </div>
                )}
                {statusBusca === "nao_encontrado" && (
                  <div className="flex items-start gap-2 text-sm text-[var(--color-alert-warning-text)] bg-[var(--color-alert-warning-bg)] border border-[var(--color-alert-warning-text)]/20 rounded-none px-4 py-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Nenhum registro encontrado. Preencha os dados manualmente.</span>
                  </div>
                )}
              </div>

              <div className="w-full max-w-md flex flex-col gap-2">
                <Button type="button" onClick={handleAvancar}
                  disabled={!identificador.trim()}
                  className="w-full h-14 rounded-none text-sm bg-primary text-primary-foreground border-none hover:bg-primary/90 gap-2 shadow-lg uppercase font-bold tracking-widest">
                  {statusBusca === "encontrado" ? "Confirmar e avançar" : "Preencher manualmente"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" className="w-full h-12 rounded-none font-bold uppercase tracking-widest text-muted-foreground" onClick={() => handleOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* ── ETAPA 1: FORMULÁRIO ────────────────────────────────────────── */}
          {etapa === "formulario" && (
            <PacienteForm 
              initialData={dados} 
              onSuccess={() => handleOpen(false)}
              onCancel={() => handleOpen(false)} 
            />
          )}

        </SheetContent>
      </Sheet>
    </>
  )
}
