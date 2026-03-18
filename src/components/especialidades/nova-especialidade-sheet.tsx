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
import { type TipoAtendimento } from "@/types"

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
        tipo_atendimento: formData.get("tipo") as TipoAtendimento,
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
        
        <form onSubmit={onSubmit} className="px-7 py-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome da Especialidade</Label>
            <Input id="nome" name="nome" placeholder="EX: FISIOTERAPIA ADULTO" required className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipe" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Equipe Responsável</Label>
            <Input id="equipe" name="equipe" placeholder="EX: EQUIPE DE REABILITAÇÃO FÍSICA" className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linha" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Linha de Reabilitação</Label>
            <Input id="linha" name="linha" placeholder="EX: INTELECTUAL / AUTISMO" className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Atendimento</Label>
            <Select name="tipo" defaultValue="Terapia Continua">
              <SelectTrigger className="w-full h-12 rounded-none border-border font-bold focus:ring-primary bg-card uppercase text-xs tracking-wider">
                <SelectValue placeholder="SELECIONE O TIPO" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-none shadow-2xl">
                <SelectItem value="Consulta Medica" className="font-bold uppercase text-[11px]">Consulta Médica</SelectItem>
                <SelectItem value="Terapia Continua" className="font-bold uppercase text-[11px]">Terapia Contínua</SelectItem>
                <SelectItem value="Dispensacao_OPM" className="font-bold uppercase text-[11px]">Dispensação OPM</SelectItem>
                <SelectItem value="Avaliacao_Diagnostica" className="font-bold uppercase text-[11px]">Avaliação Diagnóstica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full h-14 mt-6 rounded-none bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest shadow-lg shadow-primary/20" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            CADASTRAR ESPECIALIDADE
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
