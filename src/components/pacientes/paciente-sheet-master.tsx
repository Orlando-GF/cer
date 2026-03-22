import { useState, useEffect } from "react"
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
  Copy,
  Loader2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { type Paciente } from "@/types"
import { PacienteForm, PacienteFormData } from "./paciente-form"
import { HistoricoClinico } from "./historico-clinico"
import { AvaliacaoSocialForm } from "./avaliacao-social-form"
import { RegistroAtendimentoForm } from "../profissional/registro-atendimento-form"
import { buscarPacienteCompleto, buscarHistoricoClinicoPaciente } from "@/actions"
import { AgendamentoHistoricoComJoins } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { PlusCircle } from "lucide-react"

interface PacienteSheetMasterProps {
  pacienteId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: string
  vagaFixaIdContext?: string
  especialidadeIdContext?: string
  profissionalIdContext?: string
}

export function PacienteSheetMaster({ 
  pacienteId, 
  open, 
  onOpenChange,
  defaultTab,
  vagaFixaIdContext,
  especialidadeIdContext,
  profissionalIdContext
}: PacienteSheetMasterProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState(defaultTab || "clinico")
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [historico, setHistorico] = useState<AgendamentoHistoricoComJoins[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistorico, setIsLoadingHistorico] = useState(false)

  // Busca dados completos sempre que o sheet abrir com um novo ID
  useEffect(() => {
    async function loadPaciente() {
      if (open && pacienteId) {
        setIsLoading(true)
        setIsLoadingHistorico(true)
        try {
          const [pacienteRes, historicoRes] = await Promise.all([
            buscarPacienteCompleto(pacienteId),
            buscarHistoricoClinicoPaciente(pacienteId)
          ])

          if (pacienteRes.success) {
            setPaciente(pacienteRes.data ?? null)
          } else {
            toast.error("Erro ao carregar dados do paciente")
            onOpenChange(false)
          }

          if (historicoRes.success && historicoRes.data) {
            setHistorico(historicoRes.data)
          }
        } catch (error) {
          toast.error("Erro inesperado ao carregar dados")
          console.error(error)
        } finally {
          setIsLoading(false)
          setIsLoadingHistorico(false)
        }
      }
    }

    loadPaciente()
  }, [open, pacienteId, onOpenChange])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsEditing(false)
      setActiveTab(defaultTab || "clinico")
      // Não limpamos o paciente aqui para evitar flicker ao fechar, 
      // mas o useEffect cuidará de atualizar ao abrir o próximo.
    }
    onOpenChange(newOpen)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="p-0 flex flex-col bg-background overflow-hidden text-foreground w-full sm:max-w-[820px] border-l border-border">
        <SheetHeader className="mb-0 flex flex-row items-center justify-between shrink-0 p-6 pr-14 bg-clinico-900 shadow-md border-b border-white/10">
          <div className="flex-1">
            <SheetTitle className="flex items-center gap-2 text-white font-black">
              <User className="w-5 h-5 text-white/70" />
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                  <span>CARREGANDO...</span>
                </div>
              ) : isEditing ? (
                "EDITAR CADASTRO"
              ) : (
                "PRONTUÁRIO INTEGRADO"
              )}
            </SheetTitle>
            
            {!isLoading && paciente && !isEditing && (
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mt-1 flex items-center gap-2">
                CNS: <strong className="font-mono text-white/90">{paciente.cns}</strong>
                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-none text-white/40 hover:text-white hover:bg-white/10" onClick={() => navigator.clipboard.writeText(paciente.cns)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </p>
            )}

            {isEditing && (
              <button 
                onClick={() => setIsEditing(false)}
                className="text-[10px] font-black uppercase tracking-widest text-primary-300 hover:text-white mt-1 transition-all"
              >
                ← Voltar para Visualização
              </button>
            )}
          </div>
          
          {!isLoading && paciente && !isEditing && (
            <Button 
                variant="outline" 
                size="sm" 
                className="rounded-none border-white/20 bg-white/5 text-white hover:bg-white/10 font-bold uppercase tracking-widest text-[10px]"
                onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Cadastro
            </Button>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-32 w-full rounded-none" />
                <Skeleton className="h-32 w-full rounded-none" />
              </div>
              <Skeleton className="h-8 w-full rounded-none" />
              <div className="space-y-4">
                <Skeleton className="h-20 w-full rounded-none" />
                <Skeleton className="h-20 w-full rounded-none" />
                <Skeleton className="h-20 w-full rounded-none" />
              </div>
            </div>
          ) : !paciente ? (
             <div className="flex-1 flex items-center justify-center p-12 text-center text-muted-foreground uppercase text-xs font-bold tracking-widest">
                Nenhum paciente selecionado ou erro na carga.
             </div>
          ) : isEditing ? (
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden bg-background">
              <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted/30 h-11 px-6 gap-8 shadow-inner">
                <TabsTrigger value="clinico" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-muted-foreground/80 hover:text-foreground rounded-none h-11 px-0 text-[10px] font-black uppercase tracking-widest transition-all">
                  Histórico Clínico
                </TabsTrigger>
                <TabsTrigger value="social" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-muted-foreground/80 hover:text-foreground rounded-none h-11 px-0 text-[10px] font-black uppercase tracking-widest transition-all">
                  Serviço Social
                </TabsTrigger>
                
                {profissionalIdContext && especialidadeIdContext && (
                  <TabsTrigger value="registrar" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-muted-foreground/80 hover:text-foreground rounded-none h-11 px-0 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                    <PlusCircle className="w-3 h-3" />
                    Novo Registro
                  </TabsTrigger>
                )}
              </TabsList>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <TabsContent value="clinico" className="mt-0 space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
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
                            <p className="font-mono text-xs text-foreground uppercase">{paciente.cpf || "Não informado"}</p>
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground uppercase font-bold">Nascimento</Label>
                            <p className="text-sm text-foreground">{paciente.data_nascimento ? new Date(paciente.data_nascimento).toLocaleDateString("pt-BR", {timeZone: 'UTC'}) : "-"}</p>
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
                          <p className="text-sm text-foreground uppercase">{paciente.cidade} - {paciente.uf}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                      <History className="w-4 h-4 text-primary" />
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                        Evoluções e Cronologia
                      </h3>
                    </div>
                    <HistoricoClinico historico={historico} isLoading={isLoadingHistorico} />
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

                {profissionalIdContext && especialidadeIdContext && (
                  <TabsContent value="registrar" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 px-6 py-6">
                    <div className="bg-card border border-border/60 shadow-lg p-6">
                      <div className="mb-6 space-y-1">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Registrar Atendimento Clínico
                        </h3>
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">Lançamento de evolução e conduta terapêutica</p>
                      </div>
                      
                      <RegistroAtendimentoForm 
                        pacienteId={paciente.id}
                        profissionalId={profissionalIdContext}
                        especialidadeId={especialidadeIdContext}
                        vagaFixaId={vagaFixaIdContext}
                        dataHoraInicio={new Date().toISOString()}
                        dataHoraFim={new Date().toISOString()}
                        onSuccess={() => {
                          setActiveTab("clinico")
                          router.refresh()
                        }}
                      />
                    </div>
                  </TabsContent>
                )}
              </div>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
