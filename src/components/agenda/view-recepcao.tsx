// 1. Externos
import { useState, useEffect, useTransition, useMemo } from "react"
import { format, startOfDay, endOfDay, parseISO, isValid } from "date-fns"
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

// 2. Internos
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { buscarProfissionais, buscarAgendaData, registrarSessaoHistorico } from "@/actions"
import { projectAgendaSessions } from "@/lib/agenda-utils"

// 3. Tipos
import type { AgendaSession, Profissional } from "@/types"

interface ViewRecepcaoProps {
  profissionaisIniciais: Profissional[]
}

export function ViewRecepcao({ profissionaisIniciais }: ViewRecepcaoProps): React.ReactNode {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [profissionais, setProfissionais] = useState<Profissional[]>(profissionaisIniciais)
  const [sessões, setSessões] = useState<AgendaSession[]>([])
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Sincronizar com URL
  const selectedProf = searchParams.get("profId") || ""
  // Sincronizar com URL de forma estável para evitar loop de renderização
  const dateParam = searchParams.get("date")
  const dataSelecionada = useMemo(() => {
    if (dateParam && isValid(parseISO(dateParam))) {
      return parseISO(dateParam)
    }
    return startOfDay(new Date())
  }, [dateParam]) // Agora depende apenas da string da data na URL

  const setUrlParams = (paramsToUpdate: Record<string, string | null | undefined>): void => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    router.replace(`${pathname}?${params.toString()}`)
  }

  // Carregamento inicial de profissionais removido (agora via SSR)

  useEffect(() => {
    if (!selectedProf) return
    
    async function updateAgenda() {
      setLoading(true)
      const start = startOfDay(dataSelecionada).toISOString()
      const end = endOfDay(dataSelecionada).toISOString()
      
      const res = await buscarAgendaData(selectedProf, start, end)
      if (res.success && res.data) {
        const projetadas = projectAgendaSessions(
          res.data.vagas, 
          res.data.hist, 
          dataSelecionada, 
          dataSelecionada
        )
        setSessões(projetadas)
      }
      setLoading(false)
    }
    updateAgenda()
  }, [selectedProf, dataSelecionada])

  const handleMarcarPresenca = async (sessao: AgendaSession, status: string): Promise<void> => {
    startTransition(async () => {
      const res = await registrarSessaoHistorico({
        paciente_id: sessao.paciente_id,
        profissional_id: sessao.profissional_id,
        especialidade_id: sessao.especialidade_id,
        vaga_fixa_id: sessao.vaga_fixa_id,
        data_hora_inicio: sessao.data_hora_inicio.toISOString(),
        data_hora_fim: sessao.data_hora_fim.toISOString(),
        status_comparecimento: status,
        tipo_vaga: sessao.tipo_vaga
      })
      
      if (!res.success) {
        alert("Erro: " + res.error)
        return
      }

      // Refresh local
      const start = startOfDay(dataSelecionada).toISOString()
      const end = endOfDay(dataSelecionada).toISOString()
      const resRefresh = await buscarAgendaData(selectedProf, start, end)
      
      if (resRefresh.success && resRefresh.data) {
        setSessões(projectAgendaSessions(resRefresh.data.vagas, resRefresh.data.hist, dataSelecionada, dataSelecionada))
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border shadow-sm">
        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Profissional</span>
            <Select 
              onValueChange={(val) => setUrlParams({ profId: val })} 
              value={selectedProf}
            >
              <SelectTrigger className="w-[280px] h-10" aria-label="Selecione o profissional">
                <SelectValue placeholder="Selecione o profissional">
                  {profissionais.find(p => p.id === selectedProf)?.nome_completo}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {profissionais.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nome_completo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Data</span>
            <Input 
              type="date" 
              className="w-[180px] font-medium h-10"
              value={format(dataSelecionada, 'yyyy-MM-dd')}
              onChange={(e) => setUrlParams({ date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 px-3 py-1">
            {sessões.length} Pacientes Esperados
          </Badge>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[100px]">Horário</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Especialidade</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Chegada</TableHead>
              <TableHead className="text-right">Ações de Recepção</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">Carregando agenda...</TableCell>
              </TableRow>
            ) : sessões.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">Nenhum agendamento para este dia.</TableCell>
              </TableRow>
            ) : (
              sessões.map((sessao) => (
                <TableRow key={sessao.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium tabular-nums text-slate-600">
                    {format(sessao.data_hora_inicio, 'HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[20px] font-semibold text-slate-900">{sessao.paciente_nome}</span>
                        {sessao.conflito_intensivo && (
                          <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-bold h-5">
                            ⚠️ Compartilhado
                          </Badge>
                        )}
                        {sessao.tipo_vaga === "Bloco" && (
                          <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500 h-5 tabular-nums">
                            {sessões.filter(s => s.data_hora_inicio.getTime() === sessao.data_hora_inicio.getTime()).indexOf(sessao) + 1}º da Fila
                          </Badge>
                        )}
                      </div>
                      {sessao.laudo_vencido && (
                        <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="h-3 w-3" /> Laudo vencido (BPA bloqueado)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal border-slate-200 bg-white shadow-none">
                      {sessao.especialidade_nome}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {sessao.status === "Projetado" ? (
                      <Badge className="bg-amber-100 text-amber-800 border-none shadow-none font-medium">Aguardando</Badge>
                    ) : sessao.status === "Presente" ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-none shadow-none font-medium">Presente</Badge>
                    ) : sessao.status === "Falta Justificada" || sessao.status === "Falta Nao Justificada" ? (
                      <Badge className="bg-red-100 text-red-800 border-none shadow-none font-medium tabular-nums">Falta</Badge>
                    ) : sessao.status === "Cancelado" ? (
                      <Badge className="bg-slate-100 text-slate-500 border-none shadow-none font-medium">Remarcado</Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-600 border-none shadow-none">{sessao.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-slate-500 font-medium">
                    {sessao.status === "Presente" && sessao.criado_em 
                      ? format(parseISO(sessao.criado_em as any), 'HH:mm') 
                      : '--:--'}
                  </TableCell>
                  <TableCell className="text-right">
                    {sessao.status === "Projetado" ? (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1"
                          onClick={() => handleMarcarPresenca(sessao, "Presente")}
                          disabled={isPending}
                        >
                          <CheckCircle2 className="h-4 w-4" /> Presente
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                          onClick={() => handleMarcarPresenca(sessao, "Falta Nao Justificada")}
                          disabled={isPending}
                        >
                          <XCircle className="h-4 w-4" /> Falta
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-slate-500 hover:bg-slate-100"
                          onClick={() => handleMarcarPresenca(sessao, "Cancelado")}
                          disabled={isPending}
                        >
                          Remarcar
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-slate-500" disabled>
                        Confirmado
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
