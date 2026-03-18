"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { salvarVagaFixa, buscarVagasFixas, encerrarVagaFixa } from "@/actions"
import { Plus, Calendar, Loader2 } from "lucide-react"
import { type Profissional, type Especialidade, type VagaFixaComJoins } from "@/types"
import { toast } from "sonner"
import { PacienteSelector } from "@/components/pacientes/paciente-selector"
import { VagasAtivasList } from "./vagas-ativas-list"
import { useEffect, useCallback } from "react"

const DIAS_SEMANA = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda-feira" },
  { value: "2", label: "Terça-feira" },
  { value: "3", label: "Quarta-feira" },
  { value: "4", label: "Quinta-feira" },
  { value: "5", label: "Sexta-feira" },
  { value: "6", label: "Sábado" },
]

interface ViewConfiguracaoProps {
  profissionaisIniciais: Profissional[]
  especialidadesIniciais: Especialidade[]
}

export function ViewConfiguracao({ profissionaisIniciais, especialidadesIniciais }: ViewConfiguracaoProps) {
  const [profissionais] = useState<Profissional[]>(profissionaisIniciais)
  const [especialidades] = useState<Especialidade[]>(especialidadesIniciais)
  const [isPending, startTransition] = useTransition()
  
  // Form State
  const [pacienteId, setPacienteId] = useState("")
  const [profissionalId, setProfissionalId] = useState("")
  const [especialidadeId, setEspecialidadeId] = useState("")
  const [diaSemana, setDiaSemana] = useState("")
  const [horaInicio, setHoraInicio] = useState("08:00")
  const [horaFim, setHoraFim] = useState("09:00")

  // Vagas State
  const [vagasAtivas, setVagasAtivas] = useState<VagaFixaComJoins[]>([])
  const [loadingVagas, setLoadingVagas] = useState(false)

  const loadVagas = useCallback(async (pId: string) => {
    setLoadingVagas(true)
    const res = await buscarVagasFixas(pId)
    if (res.success && res.data) {
      setVagasAtivas(res.data)
    }
    setLoadingVagas(false)
  }, [])

  useEffect(() => {
    if (profissionalId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadVagas(profissionalId)
    } else {
      setVagasAtivas([])
    }
  }, [profissionalId, loadVagas])


  const handleSave = async () => {
    if (!pacienteId || !profissionalId || !especialidadeId || !diaSemana) {
      toast.error("Preencha todos os campos obrigatórios.")
      return
    }

    startTransition(async () => {
      const res = await salvarVagaFixa({
        paciente_id: pacienteId,
        profissional_id: profissionalId,
        especialidade_id: especialidadeId,
        dia_semana: parseInt(diaSemana),
        horario_inicio: horaInicio,
        horario_fim: horaFim,
        data_inicio_contrato: new Date().toISOString().split("T")[0],
        status_vaga: 'Ativa'
      })

      if (res.success) {
        toast.success("Vaga fixa cadastrada com sucesso!")
        setPacienteId("")
        loadVagas(profissionalId)
      } else {
        toast.error("Erro ao salvar: " + res.error)
      }
    })
  }

  const handleRemoveVaga = async (id: string) => {
    if (!confirm("Tem certeza que deseja encerrar esta vaga fixa?")) return
    
    const res = await encerrarVagaFixa(id)
    if (res.success) {
      toast.success("Vaga encerrada com sucesso!")
      loadVagas(profissionalId)
    } else {
      toast.error("Erro ao encerrar vaga: " + res.error)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 border-border shadow-none rounded-none bg-card">
        <CardHeader className="border-b border-border px-0 pb-6 mx-6">
          <CardTitle className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm text-foreground">
            <Plus className="h-4 w-4 text-primary" />
            Nova Vaga Fixa
          </CardTitle>
          <CardDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Configuração de recorrência</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Paciente</Label>
            <PacienteSelector 
              value={pacienteId}
              onSelect={setPacienteId}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Profissional Responsável</Label>
            <Select onValueChange={(val) => val && setProfissionalId(val)} value={profissionalId}>
              <SelectTrigger className="rounded-none border-border h-12 font-bold focus:ring-primary bg-background">
                <SelectValue placeholder="SELECIONE O PROFISSIONAL" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-none shadow-2xl">
                {profissionais.map(p => (
                  <SelectItem key={p.id} value={p.id} className="font-bold uppercase text-[11px]">{p.nome_completo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Especialidade</Label>
            <Select onValueChange={(val) => val && setEspecialidadeId(val)} value={especialidadeId}>
              <SelectTrigger className="rounded-none border-border h-12 font-bold focus:ring-primary bg-background">
                <SelectValue placeholder="SELECIONE A ESPECIALIDADE" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-none shadow-2xl">
                {especialidades.map(e => (
                  <SelectItem key={e.id} value={e.id} className="font-bold uppercase text-[11px]">{e.nome_especialidade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dia da Semana</Label>
              <Select onValueChange={(val) => val && setDiaSemana(val)} value={diaSemana}>
                <SelectTrigger className="rounded-none border-border h-12 font-bold focus:ring-primary bg-background">
                  <SelectValue placeholder="DIA DA SEMANA" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-none shadow-2xl">
                  {DIAS_SEMANA.map(d => (
                    <SelectItem key={d.value} value={d.value} className="font-bold uppercase text-[11px]">{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Janela de Horário</Label>
              <div className="flex items-center gap-2">
                <Input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className="rounded-none border-border h-12 font-bold bg-card" />
                <span className="text-muted-foreground font-bold">às</span>
                <Input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} className="rounded-none border-border h-12 font-bold bg-card" />
              </div>
            </div>
          </div>

          <Button 
            className="w-full h-14 mt-4 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest shadow-lg shadow-primary/20" 
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? "PROCESSANDO..." : "VINCULAR AGENDA FIXA"}
          </Button>

        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-border shadow-none rounded-none bg-card">
        <CardHeader className="border-b border-border px-0 pb-6 mx-6">
          <CardTitle className="text-foreground font-bold uppercase tracking-widest text-sm">Vagas Ativas na Unidade</CardTitle>
          <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Contratos de recorrência vigentes</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadingVagas ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin mb-4" />
              <p className="font-bold uppercase text-[10px] tracking-widest">Carregando vagas...</p>
            </div>
          ) : profissionalId ? (
            <VagasAtivasList vagas={vagasAtivas} onRemove={handleRemoveVaga} />
          ) : (
            <div className="text-center py-24 text-muted-foreground">
              <Calendar className="h-16 w-16 mx-auto mb-6 opacity-50" />
              <p className="font-bold uppercase text-[10px] tracking-[0.2em]">Selecione um profissional para carregar os dados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
