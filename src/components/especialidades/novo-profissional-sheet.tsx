"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { UserPlus, Loader2, Check } from "lucide-react"
import { cadastrarProfissional } from "@/actions"
import { type PerfilAcesso } from "@/types"
import { formatarNomeClinico } from "@/lib/utils/string-utils"

// Componente de Campo Reutilizável (Padrão PacienteForm)
function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label} {required && <span className="text-alert-danger-text">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-alert-danger-text">{error}</p>}
    </div>
  )
}

export function NovoProfissionalSheet({ 
  especialidades = [] 
}: { 
  especialidades?: {id: string, nome_especialidade: string}[] 
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [dados, setDados] = useState({
    nome_completo: "",
    registro_conselho: "",
    cbo: "",
    perfil_acesso: "Medico_Terapeuta" as PerfilAcesso,
    especialidades_permitidas: [] as string[],
    ativo: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const toggleEspecialidade = (id: string) => {
    setDados(prev => ({
      ...prev,
      especialidades_permitidas: prev.especialidades_permitidas.includes(id)
        ? prev.especialidades_permitidas.filter(i => i !== id)
        : [...prev.especialidades_permitidas, id]
    }))
  }

  async function handleSubmit() {
    // Validação básica manual
    const newErrors: Record<string, string> = {}
    if (!dados.nome_completo) newErrors.nome_completo = "Nome é obrigatório"
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    startTransition(async () => {
      const res = await cadastrarProfissional(dados)
      if (res.success) {
        toast.success("Profissional cadastrado com sucesso!")
        setOpen(false)
        setDados({
          nome_completo: "",
          registro_conselho: "",
          cbo: "",
          perfil_acesso: "Medico_Terapeuta",
          especialidades_permitidas: [],
          ativo: true,
        })
        setErrors({})
      } else {
        toast.error("Erro no cadastro: " + res.error)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button className="gap-2" />}>
        <UserPlus className="h-4 w-4" />
        Novo Profissional
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Cadastrar Novo Profissional</SheetTitle>
          <SheetDescription>
            Adicione um novo membro ao corpo clínico para habilitar agendamentos.
          </SheetDescription>
        </SheetHeader>

          <div className="px-7 py-6 space-y-6">
          <Field label="Nome completo" required error={errors.nome_completo}>
            <Input 
              placeholder="EX: DR. PAULO SILVA" 
              value={dados.nome_completo}
              onChange={(e) => setDados({...dados, nome_completo: formatarNomeClinico(e.target.value)})}
              className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs"
              maxLength={100}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Registro (CRM/CRP)">
              <Input 
                placeholder="EX: CRM-BA 12345" 
                value={dados.registro_conselho}
                onChange={(e) => setDados({...dados, registro_conselho: e.target.value})}
                className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs"
                maxLength={30}
              />
            </Field>
            <Field label="CBO">
              <Input 
                placeholder="EX: 225125" 
                value={dados.cbo}
                onChange={(e) => setDados({...dados, cbo: e.target.value})}
                className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs"
                maxLength={10}
              />
            </Field>
          </div>

          <Field label="Perfil de Acesso">
            <Select 
              value={dados.perfil_acesso} 
              onValueChange={(v) => setDados({...dados, perfil_acesso: v as PerfilAcesso})}
            >
              <SelectTrigger className="w-full h-12 rounded-none border-border font-bold focus:ring-primary bg-card uppercase text-xs tracking-wider">
                <SelectValue placeholder="SELECIONE O PERFIL" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-none shadow-2xl">
                <SelectItem value="Medico_Terapeuta" className="font-bold uppercase text-[11px]">Médico / Terapeuta</SelectItem>
                <SelectItem value="Enfermagem" className="font-bold uppercase text-[11px]">Enfermagem / Acolhimento</SelectItem>
                <SelectItem value="Recepcao" className="font-bold uppercase text-[11px]">Recepção</SelectItem>
                <SelectItem value="Administracao" className="font-bold uppercase text-[11px]">Administração</SelectItem>
                <SelectItem value="Motorista" className="font-bold uppercase text-[11px]">Motorista</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Especialidades Permitidas
            </Label>
            <div className="grid grid-cols-1 gap-2 p-3 border border-border rounded-none bg-background max-h-48 overflow-y-auto">
              {especialidades.map((esp) => (
                <div 
                  key={esp.id}
                  className="flex items-center gap-3 p-2 hover:bg-muted rounded-none transition-colors cursor-pointer group"
                  onClick={() => toggleEspecialidade(esp.id)}
                >
                  <div className={`
                    h-5 w-5 rounded-none border flex items-center justify-center transition-colors
                    ${dados.especialidades_permitidas.includes(esp.id) 
                      ? "bg-primary border-primary" 
                      : "bg-card border-border group-hover:border-primary"}
                  `}>
                    {dados.especialidades_permitidas.includes(esp.id) && (
                      <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground select-none">
                    {esp.nome_especialidade}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[0.8rem] text-muted-foreground">
              Define quais agendas este profissional pode assumir.
            </p>
          </div>

          <div className="pt-8 flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-14 rounded-none border-border font-bold uppercase tracking-widest text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              CANCELAR
            </Button>
            <Button 
              className="flex-1 h-14 rounded-none bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
              disabled={isPending}
              onClick={handleSubmit}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  SALVANDO...
                </>
              ) : (
                "CADASTRAR PROFISSIONAL"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
