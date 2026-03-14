"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { buscarProfissionais, buscarEspecialidades, salvarVagaFixa } from "@/actions"
import { Plus, Trash2, Calendar, Clock } from "lucide-react"

const DIAS_SEMANA = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda-feira" },
  { value: "2", label: "Terça-feira" },
  { value: "3", label: "Quarta-feira" },
  { value: "4", label: "Quinta-feira" },
  { value: "5", label: "Sexta-feira" },
  { value: "6", label: "Sábado" },
]

export function ViewConfiguracao() {
  const [profissionais, setProfissionais] = useState<any[]>([])
  const [especialidades, setEspecialidades] = useState<any[]>([])
  const [isPending, startTransition] = useTransition()
  
  // Form State
  const [pacienteId, setPacienteId] = useState("")
  const [profissionalId, setProfissionalId] = useState("")
  const [especialidadeId, setEspecialidadeId] = useState("")
  const [diaSemana, setDiaSemana] = useState("")
  const [horaInicio, setHoraInicio] = useState("08:00")
  const [horaFim, setHoraFim] = useState("09:00")

  useEffect(() => {
    async function loadData() {
      const [resP, resE] = await Promise.all([buscarProfissionais(), buscarEspecialidades()])
      if (resP.success && resP.data) setProfissionais(resP.data)
      if (resE.success && resE.data) setEspecialidades(resE.data)
    }
    loadData()
  }, [])

  const handleSave = async () => {
    if (!pacienteId || !profissionalId || !especialidadeId || !diaSemana) {
      alert("Preencha todos os campos obrigatórios.")
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
      })

      if (res.success) {
        alert("Vaga fixa cadastrada com sucesso!")
        // Limpar form
        setPacienteId("")
      } else {
        alert("Erro ao salvar: " + res.error)
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Nova vaga fixa
          </CardTitle>
          <CardDescription>Configure a recorrência para um paciente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Paciente</Label>
            <Input 
              placeholder="UUID do Paciente (temporariamente)" 
              value={pacienteId} 
              onChange={e => setPacienteId(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label>Profissional</Label>
            <Select onValueChange={(val) => val && setProfissionalId(val)} value={profissionalId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {profissionais.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nome_completo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Especialidade</Label>
            <Select onValueChange={(val) => val && setEspecialidadeId(val)} value={especialidadeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a especialidade" />
              </SelectTrigger>
              <SelectContent>
                {especialidades.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.nome_especialidade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dia da Semana</Label>
              <Select onValueChange={(val) => val && setDiaSemana(val)} value={diaSemana}>
                <SelectTrigger>
                  <SelectValue placeholder="Dia" />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <div className="flex items-center gap-2">
                <Input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className="p-1" />
                <span>-</span>
                <Input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} className="p-1" />
              </div>
            </div>
          </div>

          <Button 
            className="w-full mt-4" 
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? "Salvando..." : "Confirmar vaga fixa"}
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-none shadow-sm">
        <CardHeader>
          <CardTitle>Vagas ativas</CardTitle>
          <CardDescription>Lista de contratos de recorrência vigentes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Selecione um profissional para ver suas vagas fixas.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
