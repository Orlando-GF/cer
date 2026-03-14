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
import { PacienteForm } from "./paciente-form"

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
      <SheetContent side="right" className="w-full sm:w-[820px] sm:max-w-[820px] p-0 flex flex-col bg-slate-50 overflow-hidden text-slate-900">
        <SheetHeader className="px-6 py-5 border-b bg-white flex flex-row items-center justify-between shrink-0">
          <div>
            <SheetTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              {isEditing ? "Editar Cadastro" : "Prontuário Único"}
            </SheetTitle>
            {!isEditing && (
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                CNS: <strong className="font-mono text-slate-700">{paciente.cns}</strong>
                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full" onClick={() => navigator.clipboard.writeText(paciente.cns)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </p>
            )}
            {isEditing && (
              <button 
                onClick={() => setIsEditing(false)}
                className="text-xs text-blue-600 hover:underline mt-1"
              >
                ← Voltar para Visualização
              </button>
            )}
          </div>
          
          {!isEditing && (
            <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-blue-600 border-blue-100 hover:bg-blue-50"
                onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4" />
              Editar Cadastro
            </Button>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          {isEditing ? (
            <PacienteForm 
              initialData={paciente as any} 
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
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    Identificação
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-[10px] text-slate-500 uppercase font-bold">Nome Completo</Label>
                      <p className="font-semibold text-slate-800">{paciente.nome_completo}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-slate-500 uppercase font-bold">CPF</Label>
                        <p className="font-mono text-xs text-slate-600">{paciente.cpf || "Não informado"}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500 uppercase font-bold">Nascimento</Label>
                        <p className="text-sm text-slate-700">{new Date(paciente.data_nascimento).toLocaleDateString("pt-BR", {timeZone: 'UTC'})}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-slate-500 uppercase font-bold">Filiação (Mãe)</Label>
                      <p className="text-sm text-slate-700">{paciente.nome_mae}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    Contato e Endereço
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-[10px] text-slate-500 uppercase font-bold">Telefones</Label>
                      <p className="text-sm text-slate-700">{paciente.telefone_principal || "(Não informado)"}</p>
                      {paciente.telefone_secundario && <p className="text-xs text-slate-500 mt-0.5">{paciente.telefone_secundario}</p>}
                    </div>
                    <div>
                      <Label className="text-[10px] text-slate-500 uppercase font-bold">Localidade</Label>
                      <p className="text-sm text-slate-700">{paciente.cidade} - {paciente.uf}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {paciente.logradouro && `${paciente.logradouro}, `}
                        {paciente.numero && `${paciente.numero} - `}
                        {paciente.bairro}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO DE HISTÓRICO (PROMPT PARA FUTURO) */}
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm border-dashed flex flex-col items-center justify-center text-center py-12">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                   <History className="w-6 h-6 text-slate-300" />
                </div>
                <h4 className="text-sm font-medium text-slate-600">Histórico de Atendimentos</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[240px]">Em breve: Linha do tempo completa de evoluções e prontuário digital.</p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

