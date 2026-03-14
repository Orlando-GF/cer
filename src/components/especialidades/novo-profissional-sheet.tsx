"use client"

import { useState, useEffect, useTransition } from "react"
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
import { cadastrarProfissional, buscarEspecialidades } from "@/actions"
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
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function NovoProfissionalSheet() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [especialidades, setEspecialidades] = useState<{id: string, nome_especialidade: string}[]>([])

  const [dados, setDados] = useState({
    nome_completo: "",
    registro_conselho: "",
    cbo: "",
    perfil_acesso: "Medico_Terapeuta" as const,
    especialidades_permitidas: [] as string[],
    ativo: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      buscarEspecialidades().then(res => {
        if (res.success && res.data) {
          setEspecialidades(res.data)
        }
      })
    }
  }, [open])

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
        alert("Profissional cadastrado com sucesso!")
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
        alert("Erro no cadastro: " + res.error)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button className="gap-2" />}>
        <UserPlus className="h-4 w-4" />
        Novo Profissional
      </SheetTrigger>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Cadastrar Novo Profissional</SheetTitle>
          <SheetDescription>
            Adicione um novo membro ao corpo clínico para habilitar agendamentos.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 py-4">
          <Field label="Nome completo" required error={errors.nome_completo}>
            <Input 
              placeholder="Ex: Dr. Paulo Silva" 
              value={dados.nome_completo}
              onChange={(e) => setDados({...dados, nome_completo: formatarNomeClinico(e.target.value)})}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Registro (CRM/CRP)">
              <Input 
                placeholder="Ex: CRM-BA 12345" 
                value={dados.registro_conselho}
                onChange={(e) => setDados({...dados, registro_conselho: e.target.value})}
              />
            </Field>
            <Field label="CBO">
              <Input 
                placeholder="Ex: 225125" 
                value={dados.cbo}
                onChange={(e) => setDados({...dados, cbo: e.target.value})}
              />
            </Field>
          </div>

          <Field label="Perfil de Acesso">
            <Select 
              value={dados.perfil_acesso} 
              onValueChange={(v: any) => setDados({...dados, perfil_acesso: v})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Medico_Terapeuta">Médico / Terapeuta</SelectItem>
                <SelectItem value="Enfermagem">Enfermagem / Acolhimento</SelectItem>
                <SelectItem value="Recepcao">Recepção</SelectItem>
                <SelectItem value="Administracao">Administração</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700 text-sm font-medium text-slate-700">
              Especialidades Permitidas
            </Label>
            <div className="grid grid-cols-1 gap-2 p-3 border rounded-lg bg-slate-50 max-h-48 overflow-y-auto">
              {especialidades.map((esp) => (
                <div 
                  key={esp.id}
                  className="flex items-center gap-3 p-2 hover:bg-white rounded-md transition-colors cursor-pointer group"
                  onClick={() => toggleEspecialidade(esp.id)}
                >
                  <div className={`
                    h-5 w-5 rounded border flex items-center justify-center transition-colors
                    ${dados.especialidades_permitidas.includes(esp.id) 
                      ? "bg-blue-600 border-blue-600" 
                      : "bg-white border-slate-300 group-hover:border-blue-400"}
                  `}>
                    {dados.especialidades_permitidas.includes(esp.id) && (
                      <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />
                    )}
                  </div>
                  <span className="text-sm text-slate-600 select-none">
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
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 shadow-sm"
              disabled={isPending}
              onClick={handleSubmit}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Cadastrar Profissional"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
