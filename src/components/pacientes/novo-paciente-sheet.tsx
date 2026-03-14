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
  return onlyDigits(value).substring(0, 15)
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
    
    // Stub da busca SUS - simulando atraso
    await new Promise((r) => setTimeout(r, 800))
    
    setBuscando(false)
    setStatusBusca("nao_encontrado")
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
        <SheetContent side="right" className="w-full sm:w-[820px] sm:max-w-[820px] p-0 overflow-hidden flex flex-col">

          {/* HEADER */}
          <SheetHeader className="px-7 py-5 border-b bg-white shrink-0">
            <SheetTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Cadastro Base de Paciente
            </SheetTitle>
            {etapa === "busca" && (
              <p className="text-sm text-slate-500 mt-0.5">
                Informe o <strong>CNS</strong> ou <strong>CPF</strong> para começar.
              </p>
            )}
            {etapa === "formulario" && (
              <div className="flex items-center gap-2 mt-1">
                <button type="button" onClick={() => setEtapa("busca")}
                  className="text-xs text-blue-600 hover:underline">
                  ← Voltar à busca
                </button>
                <span className="text-slate-300">|</span>
                <span className="text-xs text-slate-500">
                  Preencha os dados obrigatórios para salvar.
                </span>
              </div>
            )}
          </SheetHeader>

          {/* ── ETAPA 0: BUSCA ─────────────────────────────────────────────── */}
          {etapa === "busca" && (
            <div className="flex-1 flex flex-col items-center justify-center px-10 gap-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <Search className="w-7 h-7 text-blue-500" />
                </div>
                <p className="text-slate-600 text-sm max-w-xs">
                  Digite o <strong>CNS</strong> (15 dígitos) ou <strong>CPF</strong> (11 dígitos) para buscar os dados automaticamente.
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
                    placeholder="CNS ou CPF"
                    className="text-base h-11 tracking-wider font-mono"
                    autoFocus
                  />
                  <Button type="button" onClick={handleBuscar}
                    disabled={buscando || !identificador.trim()}
                    className="h-11 px-5 shrink-0">
                    {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>

                {statusBusca === "encontrado" && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Paciente encontrado! Dados pré-preenchidos.</span>
                  </div>
                )}
                {statusBusca === "nao_encontrado" && (
                  <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-4 py-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Nenhum registro encontrado. Preencha os dados manualmente.</span>
                  </div>
                )}
              </div>

              <div className="w-full max-w-md flex flex-col gap-2">
                <Button type="button" onClick={handleAvancar}
                  disabled={!identificador.trim()}
                  className="w-full h-11 gap-2">
                  {statusBusca === "encontrado" ? "Confirmar e avançar" : "Preencher manualmente"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => handleOpen(false)}>
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
