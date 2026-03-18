"use client"

// 1. Externos
import { useState, useTransition, useMemo, useEffect, useCallback } from "react"
import { format, startOfDay, endOfDay, parseISO, isValid } from "date-fns"
import { FileText, Send, History, AlertCircle } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { toast } from "sonner"

// 2. Internos
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  buscarAgendaData, 
  registrarSessaoHistorico
} from "@/actions"
import { projectAgendaSessions } from "@/lib/agenda-utils"

// 3. Tipos
import type { AgendaSession, Profissional } from "@/types"

interface ViewProfissionalProps {
  profissionaisIniciais: Profissional[]
}

export function ViewProfissional({ profissionaisIniciais }: ViewProfissionalProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [profissionais] = useState<Profissional[]>(profissionaisIniciais)
  const [sessões, setSessões] = useState<AgendaSession[]>([])
  const [selectedSessao, setSelectedSessao] = useState<AgendaSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Sincronizar com URL
  const selectedProf = searchParams.get("profId") || ""
  const dateParam = searchParams.get("date")
  
  const dataSelecionada = useMemo(() => {
    if (dateParam && isValid(parseISO(dateParam))) {
      return parseISO(dateParam)
    }
    return startOfDay(new Date())
  }, [dateParam])

  const [evolucao, setEvolucao] = useState("")
  const [conduta, setConduta] = useState("")

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

  const updateAgenda = useCallback(async (): Promise<void> => {
    if (!selectedProf) return
    setLoading(true)
    const start = startOfDay(dataSelecionada).toISOString()
    const end = endOfDay(dataSelecionada).toISOString()
    
    const res = await buscarAgendaData(selectedProf, start, end)
    if (res.success && res.data) {
      const projected = projectAgendaSessions(res.data.vagas, res.data.hist, dataSelecionada, dataSelecionada)
      setSessões(projected)
    } else {
      toast.error("Erro ao carregar agenda: " + res.error)
      setSessões([])
    }
    setLoading(false)
  }, [selectedProf, dataSelecionada])

  useEffect(() => {
    updateAgenda()
  }, [updateAgenda])

  const handleOpenEvolucao = (sessao: AgendaSession): void => {
    setSelectedSessao(sessao)
    setEvolucao("") 
    setConduta("")
  }

  const handleSalvarEvolucao = async (): Promise<void> => {
    if (!selectedSessao || !evolucao) return
    
    startTransition(async () => {
      const res = await registrarSessaoHistorico({
        paciente_id: selectedSessao.paciente_id,
        profissional_id: selectedSessao.profissional_id,
        especialidade_id: selectedSessao.especialidade_id,
        vaga_fixa_id: selectedSessao.vaga_fixa_id,
        data_hora_inicio: selectedSessao.data_hora_inicio.toISOString(),
        data_hora_fim: selectedSessao.data_hora_fim.toISOString(),
        status_comparecimento: "Presente", 
        evolucao_clinica: evolucao,
        conduta: conduta,
        tipo_vaga: selectedSessao.tipo_vaga
      })
      
      if (!res.success) {
        toast.error("Erro: " + res.error)
        return
      }

      toast.success("Evolução registrada com sucesso!")
      setSelectedSessao(null)
      updateAgenda()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-none border shadow-none">
        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Canal de Atendimento</span>
            <Select 
              onValueChange={(val) => setUrlParams({ profId: val })} 
              value={selectedProf}
            >
              <SelectTrigger className="w-[320px] font-medium h-10 rounded-none h-10" aria-label="Selecione o profissional">
                <SelectValue placeholder="Selecione o seu nome profissional">
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
              className="w-[180px] font-medium h-10 rounded-none h-10"
              value={format(dataSelecionada, 'yyyy-MM-dd')}
              onChange={(e) => setUrlParams({ date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Badge className="bg-blue-50 text-blue-700 border-none px-3 py-1 rounded-none font-bold text-[10px] uppercase tracking-widest">
            Minha Agenda
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="border-none shadow-none rounded-none overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b-2 border-slate-100">
                  <TableHead className="w-[100px] text-slate-900 font-bold uppercase text-[10px] tracking-widest pl-6">Hora</TableHead>
                  <TableHead className="text-slate-900 font-bold uppercase text-[10px] tracking-widest">Paciente</TableHead>
                  <TableHead className="text-slate-900 font-bold uppercase text-[10px] tracking-widest">Alertas</TableHead>
                  <TableHead className="text-right text-slate-900 font-bold uppercase text-[10px] tracking-widest pr-6">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-500">Carregando...</TableCell></TableRow>
                ) : sessões.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-500">Nenhum atendimento agendado para hoje.</TableCell></TableRow>
                ) : (
                  sessões.map((sessao) => (
                    <TableRow key={sessao.id} className="hover:bg-slate-50/50 cursor-pointer border-b border-slate-100 last:border-0 h-24" onClick={() => handleOpenEvolucao(sessao)}>
                      <TableCell className="font-bold tabular-nums text-primary text-[18px] pl-6">
                        {format(sessao.data_hora_inicio, 'HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-[20px] font-bold text-slate-900 uppercase tracking-tight">{sessao.paciente_nome}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{sessao.especialidade_nome}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {sessao.laudo_vencido && (
                            <Badge className="bg-red-600 text-white border-none text-[8px] font-bold rounded-none px-1 tracking-tighter">
                              LAUDO VENCIDO
                            </Badge>
                          )}
                          {sessao.status !== "Projetado" && sessao.status !== "Agendado" && (
                            <Badge className="bg-emerald-100 text-emerald-800 border-none text-[8px] font-bold rounded-none px-1">
                              CONCLUÍDO
                            </Badge>
                          )}
                          {sessao.tags_acessibilidade?.map(tag => (
                            <Badge key={tag} variant="outline" className="text-[9px] py-0 px-1 border-slate-200 text-slate-500 uppercase rounded-none bg-slate-50">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button size="sm" variant="ghost" className="text-primary hover:bg-slate-50 rounded-none font-bold text-[11px] uppercase tracking-widest h-9">
                          <FileText className="h-4 w-4 mr-2" />
                          Atender
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-none text-white shadow-none rounded-none overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <History className="h-3 w-3" />
                Resumo do Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums text-blue-500">
                {sessões.filter(s => s.status === "Presente").length} / {sessões.length}
              </div>
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-1">Concluídos</p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-none rounded-none bg-white">
            <CardHeader className="pb-2 px-0">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />
                Pendências de Laudo
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-2">
              {sessões.filter(s => s.laudo_vencido).map(s => (
                <div key={s.id} className="text-[11px] p-3 bg-red-50 border-l-4 border-red-600 text-red-900 font-bold uppercase">
                  {s.paciente_nome}
                </div>
              ))}
              {sessões.filter(s => s.laudo_vencido).length === 0 && (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-6 bg-slate-50">Tudo em dia</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={!!selectedSessao} onOpenChange={() => setSelectedSessao(null)}>
        <SheetContent className="border-none shadow-2xl p-0 flex flex-col rounded-none">
          <SheetHeader className="mb-0 border-b border-white/10 shrink-0">
            <div className="flex flex-col gap-1 w-full text-left">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-white/70" />
                <SheetTitle>EVOLUÇÃO CLÍNICA</SheetTitle>
              </div>
              <div className="flex flex-col mt-2">
                <span className="text-2xl font-bold text-white uppercase tracking-tight">
                  {selectedSessao?.paciente_nome}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">
                  {selectedSessao?.especialidade_nome} | {selectedSessao && format(selectedSessao.data_hora_inicio, 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-slate-50">
            <div className="space-y-4">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Descrição do Desenvolvimento</Label>
              <Textarea 
                placeholder="Descreva aqui o desenvolvimento da sessão, condutas técnicas aplicadas e observações significativas sobre o paciente..."
                className="min-h-[350px] border-none shadow-none focus-visible:ring-0 text-lg bg-white p-6 rounded-none leading-relaxed"
                value={evolucao}
                onChange={e => setEvolucao(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Conduta e Desfecho</Label>
              <Select onValueChange={(val) => val && setConduta(val)} value={conduta}>
                <SelectTrigger className="w-full bg-white border-slate-200 h-14 rounded-none text-base font-bold uppercase tracking-tight">
                  <SelectValue placeholder="SELECIONE A CONDUTA TÉCNICA" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-none shadow-2xl">
                  <SelectItem value="Retorno" className="font-bold uppercase text-xs">Manter Plano Terapêutico</SelectItem>
                  <SelectItem value="Alta por Melhoria" className="font-bold uppercase text-xs">Alta por Melhoria Clínica</SelectItem>
                  <SelectItem value="Alta por Abandono" className="font-bold uppercase text-xs">Alta por Abandono</SelectItem>
                  <SelectItem value="Inserir em Fila de Terapia" className="font-bold uppercase text-xs">Encaminhar para Fila de Transição</SelectItem>
                  <SelectItem value="Encaminhamento Externo" className="font-bold uppercase text-xs">Encaminhamento Externo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between gap-4">
            <Button variant="ghost" onClick={() => setSelectedSessao(null)} className="flex-1 h-14 rounded-none font-bold uppercase tracking-widest text-slate-400">DESCARTAR</Button>
            <Button 
              className="flex-1 h-14 rounded-none font-bold uppercase tracking-widest gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" 
              onClick={handleSalvarEvolucao}
              disabled={isPending || !evolucao}
            >
              {isPending ? "PROCESSANDO..." : <><Send className="h-4 w-4" /> FINALIZAR ATENDIMENTO</>}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
