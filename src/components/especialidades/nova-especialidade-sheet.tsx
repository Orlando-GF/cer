"use client"

import { useState } from "react"
import { useTransition } from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { cadastrarEspecialidade } from "@/actions"

export function NovaEspecialidadeSheet() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await cadastrarEspecialidade({
        nome_especialidade: formData.get("nome") as string,
        equipe_responsavel: formData.get("equipe") as string,
        linha_reabilitacao: formData.get("linha") as string,
        tipo_atendimento: formData.get("tipo") as any,
      })

      if (res.success) {
        setOpen(false)
      } else {
        console.error(res.error)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger 
        render={
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nova Especialidade
          </Button>
        }
      />
      <SheetContent>
        <SheetHeader className="mb-6">
          <SheetTitle>Nova Especialidade / Linha de Cuidado</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Especialidade</Label>
            <Input id="nome" name="nome" placeholder="Ex: Fisioterapia Adulto" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipe">Equipe Responsável</Label>
            <Input id="equipe" name="equipe" placeholder="Ex: Equipe de Reabilitação Física" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linha">Linha de Reabilitação</Label>
            <Input id="linha" name="linha" placeholder="Ex: Intelectual / Autismo" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Atendimento</Label>
            <Select name="tipo" defaultValue="Terapia Continua">
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Consulta Medica">Consulta Médica</SelectItem>
                <SelectItem value="Terapia Continua">Terapia Contínua</SelectItem>
                <SelectItem value="Dispensacao_OPM">Dispensação OPM</SelectItem>
                <SelectItem value="Avaliacao_Diagnostica">Avaliação Diagnóstica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full mt-6" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Cadastrar Especialidade
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
