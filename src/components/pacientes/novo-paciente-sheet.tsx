"use client"

import * as React from "react"
import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input, focusClasses } from "@/components/ui/input"
import {
  Plus,
  Loader2,
  User,
  Search,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PacienteForm } from "./paciente-form"
import { buscarPacientePorDocumento } from "@/actions"
import { type Paciente } from "@/types"

// ─── TIPAGEM RIGOROSA ────────────────────────────────────────────────────────

/**
 * Interface para os dados do formulário. 
 * Usamos Partial<Paciente> para garantir que apenas campos existentes 
 * na base de dados sejam aceitos, eliminando o uso de 'any'.
 */
export type PacienteFormData = Partial<Paciente>

// ─── UTILITÁRIOS DE MÁSCARA ───────────────────────────────────────────────────

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

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export function NovoPacienteSheet() {
  const [open, setOpen] = useState(false)
  const [etapa, setEtapa] = useState<"busca" | "formulario">("busca")
  const [identificador, setIdentificador] = useState("")
  const [buscando, setBuscando] = useState(false)
  const [statusBusca, setStatusBusca] = useState<"idle" | "encontrado" | "nao_encontrado">("idle")
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
    
    // Chamada à Server Action real com tipagem garantida
    const result = await buscarPacientePorDocumento(onlyDigits(identificador))
    
    setBuscando(false)
    if (result.success && result.data) {
      setDados(result.data as PacienteFormData)
      setStatusBusca("encontrado")
    } else {
      setStatusBusca("nao_encontrado")
    }
  }

  const handleAvancar = () => {
    const val = onlyDigits(identificador)
    const isCns = val.length === 15
    setDados({ [isCns ? "cns" : "cpf"]: val })
    setEtapa("formulario")
  }

  return (
    <>
      <Button 
        className="gap-2 shadow-sm rounded-none bg-primary hover:bg-primary/90 uppercase text-xs font-bold tracking-wider px-6 h-12" 
        onClick={() => setOpen(true)}
      >
        <Plus className="w-4 h-4" /> Cadastrar Paciente
      </Button>

      <Sheet open={open} onOpenChange={handleOpen}>
        <SheetContent side="right" className="p-0 overflow-hidden flex flex-col bg-background border-l border-border">
          
          {/* HEADER PADRONIZADO CER II */}
          <SheetHeader className="mb-0 shrink-0 border-b border-white/10 bg-slate-900 p-6">
            <SheetTitle className="flex items-center gap-2 text-white uppercase text-sm font-black tracking-widest">
              <User className="w-4 h-4 text-white/70" />
              CADASTRO BASE DE PACIENTE
            </SheetTitle>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mt-0.5">
              {etapa === "busca" ? "Localize o paciente antes de iniciar." : "Preencha os dados clínicos e pessoais."}
            </p>
          </SheetHeader>

          {/* ETAPA DE BUSCA */}
          {etapa === "busca" ? (
            <div className="flex-1 flex flex-col items-center justify-center px-10 gap-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 bg-muted flex items-center justify-center border border-border shadow-inner">
                  <Search className="w-7 h-7 text-primary" />
                </div>
                <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                  Informe o <strong>CNS</strong> ou <strong>CPF</strong> para pesquisar na base central do CER II.
                </p>
              </div>

              <div className="w-full max-w-md space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={identificador}
                    onChange={(e) => {
                      const d = onlyDigits(e.target.value)
                      setIdentificador(d.length > 11 ? maskCNS(d) : maskCPF(d))
                      setStatusBusca("idle")
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                    placeholder="CNS OU CPF..."
                    className={cn(
                      "rounded-none h-12 font-black bg-card uppercase text-xs tracking-wider border-border",
                      focusClasses // Usando a constante unificada (ring-ring do tema)
                    )}
                    maxLength={18}
                    autoFocus
                  />
                  <Button 
                    onClick={handleBuscar} 
                    disabled={buscando || !identificador.trim()} 
                    className="h-12 px-6 rounded-none font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-md"
                  >
                    {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Feedbacks de Busca */}
                {statusBusca === "encontrado" && (
                  <div className="p-4 bg-[var(--color-alert-success-bg)] border border-[var(--color-alert-success-text)]/20 flex items-start gap-3 animate-in fade-in duration-300">
                    <CheckCircle2 className="w-5 h-5 text-[var(--color-alert-success-text)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-[var(--color-alert-success-text)] uppercase tracking-tight">Paciente já cadastrado!</p>
                    </div>
                  </div>
                )}
                
                {statusBusca === "nao_encontrado" && (
                  <div className="p-4 bg-[var(--color-alert-warning-bg)] border border-[var(--color-alert-warning-text)]/20 flex items-start gap-3 animate-in fade-in duration-300">
                    <AlertCircle className="w-5 h-5 text-[var(--color-alert-warning-text)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-[var(--color-alert-warning-text)] uppercase tracking-tight">Registro não localizado.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full max-w-md pt-4 flex flex-col gap-2">
                <Button 
                  onClick={handleAvancar} 
                  disabled={!identificador.trim()}
                  className="w-full h-14 rounded-none bg-primary hover:bg-primary/90 gap-2 shadow-lg uppercase font-bold tracking-widest text-xs transition-all active:scale-[0.98]"
                >
                  {statusBusca === "encontrado" ? "Confirmar e Visualizar" : "Preencher Novo Cadastro"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => handleOpen(false)}
                  className="w-full h-12 rounded-none font-bold uppercase tracking-widest text-muted-foreground text-[10px]"
                >
                  Cancelar Operação
                </Button>
              </div>
            </div>
          ) : (
            /* FORMULÁRIO DE DADOS REAL */
            <PacienteForm 
              initialData={dados as import("./paciente-form").PacienteFormData} 
              onSuccess={() => handleOpen(false)}
              onCancel={() => setEtapa("busca")} 
            />
          )}

        </SheetContent>
      </Sheet>
    </>
  )
}
