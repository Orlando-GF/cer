"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
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
import { PlusCircle, Loader2, Pencil } from "lucide-react"
import { cadastrarEspecialidade, atualizarEspecialidade } from "@/actions"
import { type Especialidade, type TipoAtendimento } from "@/types"
import { especialidadeSchema } from "@/lib/validations/schema"

export function NovaEspecialidadeSheet({
  especialidade,
  open: controlledOpen,
  onOpenChange,
}: {
  especialidade?: Especialidade
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const router = useRouter()
  const isEditing = !!especialidade
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const [dados, setDados] = useState({
    nome_especialidade: "",
    equipe_responsavel: "",
    linha_reabilitacao: "",
    tipo_atendimento: "Consulta Medica" as TipoAtendimento,
    ativo: true,
  })

  useEffect(() => {
    if (open) {
      if (especialidade) {
        setDados({
          nome_especialidade: especialidade.nome_especialidade,
          equipe_responsavel: especialidade.equipe_responsavel || "",
          linha_reabilitacao: especialidade.linha_reabilitacao || "",
          tipo_atendimento: (especialidade.tipo_atendimento as TipoAtendimento) || "Consulta Medica",
          ativo: especialidade.ativo ?? true,
        })
      } else {
        setDados({
          nome_especialidade: "",
          equipe_responsavel: "",
          linha_reabilitacao: "",
          tipo_atendimento: "Consulta Medica" as TipoAtendimento,
          ativo: true,
        })
      }
    }
  }, [especialidade, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const validacao = especialidadeSchema.safeParse(dados)
    if (!validacao.success) {
      toast.error(validacao.error.issues?.[0]?.message || "Preencha os campos obrigatórios corretamente")
      return
    }

    startTransition(async () => {
      const res = isEditing
        ? await atualizarEspecialidade(especialidade!.id, dados)
        : await cadastrarEspecialidade(dados)

      if (res.success) {
        toast.success(isEditing ? "Especialidade atualizada!" : "Especialidade cadastrada!")
        setOpen(false)
        router.refresh()
        if (!isEditing) {
          setDados({
            nome_especialidade: "",
            equipe_responsavel: "",
            linha_reabilitacao: "",
            tipo_atendimento: "Consulta Medica",
            ativo: true,
          })
        }
      } else {
        toast.error("Erro: " + res.error)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {isEditing ? (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setOpen(true)}
          className="h-8 w-8 p-0 rounded-none text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <SheetTrigger render={<Button className="gap-2" />}>
          <PlusCircle className="h-4 w-4" />
          Nova Especialidade
        </SheetTrigger>
      )}
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{isEditing ? "Editar Especialidade" : "Nova Especialidade"}</SheetTitle>
          <SheetDescription>
            {isEditing 
              ? "Ajuste os parâmetros da especialidade para configurar a linha de cuidado."
              : "Defina uma nova especialidade para habilitar o encaminhamento de pacientes."}
          </SheetDescription>
        </SheetHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="px-7 py-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome da Especialidade *</Label>
            <Input 
              value={dados.nome_especialidade}
              onChange={(e) => setDados({...dados, nome_especialidade: e.target.value})}
              placeholder="EX: FISIOTERAPIA MOTORA"
              className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Atendimento</Label>
            <Select 
              value={dados.tipo_atendimento} 
              onValueChange={(v) => setDados({...dados, tipo_atendimento: v as TipoAtendimento})}
            >
              <SelectTrigger className="w-full h-12 rounded-none border-border font-bold focus:ring-primary bg-card uppercase text-xs tracking-wider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-none shadow-2xl">
                <SelectItem value="Consulta Medica" className="font-bold uppercase text-[11px]">CONSULTA MÉDICA</SelectItem>
                <SelectItem value="Terapia Continua" className="font-bold uppercase text-[11px]">TERAPIA CONTÍNUA</SelectItem>
                <SelectItem value="Avaliacao_Diagnostica" className="font-bold uppercase text-[11px]">AVALIAÇÃO DIAGNÓSTICA</SelectItem>
                <SelectItem value="Acolhimento" className="font-bold uppercase text-[11px]">ACOLHIMENTO</SelectItem>
                <SelectItem value="Dispensacao_OPM" className="font-bold uppercase text-[11px]">DISPENSAÇÃO OPM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Equipe Responsável</Label>
              <Input 
                value={dados.equipe_responsavel}
                onChange={(e) => setDados({...dados, equipe_responsavel: e.target.value})}
                placeholder="EX: EQUIPE A"
                className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Linha de Reabilitação</Label>
              <Input 
                value={dados.linha_reabilitacao}
                onChange={(e) => setDados({...dados, linha_reabilitacao: e.target.value})}
                placeholder="EX: FÍSICA"
                className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs"
              />
            </div>
          </div>

          <div className="pt-8 flex gap-3">
            <Button 
              type="button"
              variant="outline" 
              className="flex-1 h-14 rounded-none border-border font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              CANCELAR
            </Button>
            <Button 
              type="submit"
              className="flex-1 h-14 rounded-none bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  SALVANDO...
                </>
              ) : (
                isEditing ? "SALVAR ALTERAÇÕES" : "CADASTRAR ESPECIALIDADE"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
