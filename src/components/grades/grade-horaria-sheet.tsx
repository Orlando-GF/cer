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
import { Plus, Loader2 } from "lucide-react"
import { salvarGradeHoraria } from "@/actions"

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

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

export function GradeHorariaSheet({ 
  profissionalId 
}: { 
  profissionalId: string 
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [dados, setDados] = useState({
    profissional_id: profissionalId,
    dia_semana: "1", // Padrão: Segunda
    horario_inicio: "",
    horario_fim: "",
    capacidade_atendimentos: 1,
    data_inicio_vigencia: new Date().toISOString().split('T')[0],
  })

  async function handleSubmit() {
    if (!dados.horario_inicio || !dados.horario_fim) {
      toast.error("Preencha os horários de início e fim.")
      return
    }
    if (dados.horario_inicio >= dados.horario_fim) {
      toast.error("O horário de fim deve ser posterior ao horário de início.")
      return
    }

    startTransition(async () => {
      const res = await salvarGradeHoraria({
        ...dados,
        dia_semana: parseInt(dados.dia_semana, 10),
      })
      if (res.success) {
        toast.success("Horário cadastrado com sucesso!")
        setOpen(false)
        setDados({
          ...dados,
          horario_inicio: "",
          horario_fim: "",
        })
      } else {
        toast.error("Erro ao salvar: " + res.error)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <Button className="h-9 px-4 rounded-none font-bold uppercase tracking-widest text-[10px] bg-primary text-white hover:bg-primary/90">
          <Plus className="mr-2 h-3.5 w-3.5" /> Adicionar Horário
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Adicionar Horário à Grade</SheetTitle>
          <SheetDescription>
            Defina um novo período de atendimento semanal para o profissional.
          </SheetDescription>
        </SheetHeader>

        <div className="px-7 py-6 space-y-6">
          <Field label="Dia da Semana" required>
            <Select 
              value={dados.dia_semana} 
              onValueChange={(v: string | null) => setDados({...dados, dia_semana: v || "1"})}
            >
              <SelectTrigger className="w-full h-12 rounded-none border-border font-bold focus:ring-primary bg-card uppercase text-xs tracking-wider">
                <SelectValue placeholder="SELECIONE O DIA" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-none shadow-2xl">
                {DIAS.map((dia, idx) => (
                  <SelectItem key={idx} value={idx.toString()} className="font-bold uppercase text-[11px]">
                    {dia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Horário Início" required>
              <Input 
                type="time" 
                value={dados.horario_inicio}
                onChange={(e) => setDados({...dados, horario_inicio: e.target.value})}
                className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs"
              />
            </Field>
            <Field label="Horário Fim" required>
              <Input 
                type="time" 
                value={dados.horario_fim}
                onChange={(e) => setDados({...dados, horario_fim: e.target.value})}
                className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Capacidade" required>
              <Input 
                type="number"
                min={1}
                value={dados.capacidade_atendimentos}
                onChange={(e) => setDados({...dados, capacidade_atendimentos: Number(e.target.value)})}
                className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs"
              />
            </Field>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">A partir de *</Label>
              <Input 
                type="date"
                value={dados.data_inicio_vigencia || ""}
                onChange={(e) => setDados({...dados, data_inicio_vigencia: e.target.value})}
                className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs"
              />
            </div>
          </div>

          <div className="pt-8 flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-14 rounded-none border-border font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted"
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
                "ADICIONAR"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
