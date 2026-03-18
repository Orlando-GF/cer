"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { History, User, Phone, Edit, Copy } from "lucide-react"
import { Paciente } from "./columns"
import { useRouter } from "next/navigation"
import { PacienteForm, PacienteFormData } from "./paciente-form"

interface PacienteSheetMasterProps {
  paciente: Paciente | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PacienteSheetMaster({ paciente, open, onOpenChange }: PacienteSheetMasterProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!open) {
      setIsEditing(false)
    }
  }, [open])

  if (!paciente) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0 flex flex-col bg-card overflow-hidden text-foreground">
        <SheetHeader className="mb-0 border-b border-white/10 flex flex-row items-center justify-between shrink-0">
          <div>
            <SheetTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-white/70" />
              {isEditing ? "EDITAR CADASTRO" : "PRONTUÁRIO ÚNICO"}
            </SheetTitle>
            {!isEditing && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 flex items-center gap-2">
                CNS: <strong className="font-mono text-white/90">{paciente.cns}</strong>
                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full text-white/50 hover:text-white hover:bg-white/10" onClick={() => navigator.clipboard.writeText(paciente.cns)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </p>
            )}
            {isEditing && (
              <button 
                onClick={() => setIsEditing(false)}
                className="text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-white mt-1 transition-all"
              >
                ← Voltar para Visualização
              </button>
            )}
          </div>
          
          {!isEditing && (
            <Button 
                variant="outline" 
                size="sm" 
                className="rounded-none border-white/20 bg-white/10 text-white hover:bg-white/20 font-bold uppercase tracking-widest text-[10px]"
                onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Cadastro
            </Button>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          {isEditing ? (
            <PacienteForm 
              initialData={Object.fromEntries(
                Object.entries(paciente).map(([k, v]) => [k, v === null ? undefined : v])
              ) as PacienteFormData} 
              onSuccess={() => {
                setIsEditing(false)
                router.refresh()
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* VIEW MODE CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card p-5 rounded-none border border-border shadow-sm space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    Identificação
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase font-bold">Nome Completo</Label>
                      <p className="font-semibold text-foreground">{paciente.nome_completo}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground uppercase font-bold">CPF</Label>
                        <p className="font-mono text-xs text-foreground">{paciente.cpf || "Não informado"}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground uppercase font-bold">Nascimento</Label>
                        <p className="text-sm text-foreground">{new Date(paciente.data_nascimento).toLocaleDateString("pt-BR", {timeZone: 'UTC'})}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase font-bold">Filiação (Mãe)</Label>
                      <p className="text-sm text-foreground">{paciente.nome_mae}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card p-5 rounded-none border border-border shadow-sm space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    Contato e Endereço
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase font-bold">Telefones</Label>
                      <p className="text-sm text-foreground">{paciente.telefone_principal || "(Não informado)"}</p>
                      {paciente.telefone_secundario && <p className="text-xs text-muted-foreground mt-0.5">{paciente.telefone_secundario}</p>}
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase font-bold">Localidade</Label>
                      <p className="text-sm text-foreground">{paciente.cidade} - {paciente.uf}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {paciente.logradouro && `${paciente.logradouro}, `}
                        {paciente.numero && `${paciente.numero} - `}
                        {paciente.bairro}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO DE HISTÓRICO (PROMPT PARA FUTURO) */}
              <div className="bg-muted/30 p-6 rounded-none border border-dashed border-border flex flex-col items-center justify-center text-center py-12">
                <div className="w-12 h-12 rounded-none bg-muted flex items-center justify-center mb-3">
                   <History className="w-6 h-6 text-muted-foreground" />
                </div>
                <h4 className="text-sm font-medium text-foreground">Histórico de Atendimentos</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">Em breve: Linha do tempo completa de evoluções e prontuário digital.</p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

