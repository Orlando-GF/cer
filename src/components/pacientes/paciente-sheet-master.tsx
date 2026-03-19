"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { 
  History, 
  User, 
  Phone, 
  Edit, 
  Copy 
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Paciente } from "./columns"
import { PacienteForm, PacienteFormData } from "./paciente-form"
import { HistoricoClinico } from "./historico-clinico"
import { AvaliacaoSocialForm } from "./avaliacao-social-form"

interface PacienteSheetMasterProps {
  paciente: Paciente | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PacienteSheetMaster({ paciente, open, onOpenChange }: PacienteSheetMasterProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("clinico")

  // Reset state when sheet closes using the onOpenChange wrapper
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsEditing(false)
      setActiveTab("clinico")
    }
    onOpenChange(newOpen)
  }

  if (!paciente) return null

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="p-0 flex flex-col bg-card overflow-hidden text-foreground w-full sm:max-w-[820px] border-l border-border">
        <SheetHeader className="mb-0 border-b border-border flex flex-row items-center justify-between shrink-0 p-4 bg-muted/20">
          <div>
            <SheetTitle className="flex items-center gap-2 text-foreground">
              <User className="w-5 h-5 text-primary" />
              {isEditing ? "EDITAR CADASTRO" : "PRONTUÁRIO INTEGRADO"}
            </SheetTitle>
            {!isEditing && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 flex items-center gap-2">
                CNS: <strong className="font-mono text-foreground/90">{paciente.cns}</strong>
                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => navigator.clipboard.writeText(paciente.cns)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </p>
            )}
            {isEditing && (
              <button 
                onClick={() => setIsEditing(false)}
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline mt-1 transition-all"
              >
                ← Voltar para Visualização
              </button>
            )}
          </div>
          
          {!isEditing && (
            <Button 
                variant="outline" 
                size="sm" 
                className="rounded-none border-border bg-background text-foreground hover:bg-muted font-bold uppercase tracking-widest text-[10px]"
                onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Cadastro
            </Button>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {isEditing ? (
            <div className="flex-1 overflow-y-auto">
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
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted/10 h-10 px-4 gap-4">
                <TabsTrigger value="clinico" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-0 text-[10px] font-bold uppercase tracking-widest">
                  Histórico Clínico
                </TabsTrigger>
                <TabsTrigger value="social" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-0 text-[10px] font-bold uppercase tracking-widest">
                  Serviço Social
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <TabsContent value="clinico" className="mt-0 space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                  {/* VIEW MODE CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card p-5 rounded-none border border-border shadow-sm space-y-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
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
                      </div>
                    </div>

                    <div className="bg-card p-5 rounded-none border border-border shadow-sm space-y-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        Contato
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
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO DE HISTÓRICO - EVOLUÇÃO CLÍNICA */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                      <History className="w-4 h-4 text-primary" />
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                        Evoluções e Cronologia
                      </h3>
                    </div>
                    <HistoricoClinico pacienteId={paciente.id} />
                  </div>
                </TabsContent>

                <TabsContent value="social" className="mt-0 space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                   <div className="bg-muted/10 border border-border p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Nova Avaliação Socioeconômica</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Utilize este formulário para registrar a situação social, composição familiar e condições de moradia do paciente.
                      </p>
                      
                      <div className="border-t border-border pt-6">
                        <AvaliacaoSocialForm 
                          pacienteId={paciente.id} 
                          onSuccess={() => setActiveTab("clinico")}
                        />
                      </div>
                   </div>
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
