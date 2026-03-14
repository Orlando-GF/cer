"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { buscarProfissionais, buscarAgendaData, registrarSessaoHistorico } from "@/app/actions"
import { projectAgendaSessions, AgendaSession } from "@/lib/agenda-utils"
import { format, startOfDay, endOfDay, parseISO, isValid } from "date-fns"
import { FileText, Send, AlertCircle, History, User, Truck, Accessibility } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

export function ViewProfissional() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [profissionais, setProfissionais] = useState<any[]>([])
  const [sessões, setSessões] = useState<AgendaSession[]>([])
  const [selectedSessao, setSelectedSessao] = useState<AgendaSession | null>(null)
  
  // Sincronizar com URL
  const selectedProf = searchParams.get("profId") || ""
  const dateParam = searchParams.get("date")
  const dataSelecionada = dateParam && isValid(parseISO(dateParam))
    ? parseISO(dateParam)
    : new Date()

  const setUrlParams = (paramsToUpdate: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    router.replace(`${pathname}?${params.toString()}`)
  }

  // Evolution state
  const [evolucao, setEvolucao] = useState("")
  const [conduta, setConduta] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function loadProfissionais() {
      const res = await buscarProfissionais()
      if (res.success && res.data) setProfissionais(res.data)
    }
    loadProfissionais()
  }, [])

  useEffect(() => {
    if (!selectedProf) return
    updateAgenda()
  }, [selectedProf, dataSelecionada])

  const updateAgenda = async () => {
    setLoading(true)
    const start = startOfDay(dataSelecionada).toISOString()
    const end = endOfDay(dataSelecionada).toISOString()
    const res = await buscarAgendaData(selectedProf, start, end)
    if (res.success && res.data) {
      setSessões(projectAgendaSessions(res.data.vagas, res.data.hist, dataSelecionada, dataSelecionada))
    }
    setLoading(false)
  }

  const handleOpenEvolucao = (sessao: AgendaSession) => {
    setSelectedSessao(sessao)
    // Se já tiver histórico, poderíamos carregar a evolução anterior aqui
    setEvolucao("") 
    setConduta("")
  }

  const handleSalvarEvolucao = async () => {
    if (!selectedSessao) return
    
    startTransition(async () => {
      const res = await registrarSessaoHistorico({
        paciente_id: selectedSessao.paciente_id,
        profissional_id: selectedSessao.profissional_id,
        especialidade_id: selectedSessao.especialidade_id,
        vaga_fixa_id: selectedSessao.vaga_fixa_id,
        data_hora_inicio: selectedSessao.data_hora_inicio.toISOString(),
        data_hora_fim: selectedSessao.data_hora_fim.toISOString(),
        status_comparecimento: "Presente", // Se está evoluindo, é porque está presente
        evolucao_clinica: evolucao,
        conduta: conduta,
        tipo_vaga: selectedSessao.tipo_vaga
      })
      
      if (res.success) {
        setSelectedSessao(null)
        updateAgenda()
      } else {
        alert("Erro: " + res.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 tracking-wider">Seu canal de atendimento</span>
            <Select 
              onValueChange={(val) => setUrlParams({ profId: val })} 
              value={selectedProf}
            >
              <SelectTrigger className="w-[320px] font-medium">
                <SelectValue placeholder="Selecione o seu nome profissional" />
              </SelectTrigger>
              <SelectContent>
                {profissionais.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nome_completo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 tracking-wider">Período</span>
            <Input 
              type="date" 
              className="w-[180px] font-medium"
              value={format(dataSelecionada, 'yyyy-MM-dd')}
              onChange={(e) => setUrlParams({ date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Badge className="bg-blue-50 text-blue-700 border-none px-3 py-1">
            Minha Agenda
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[100px]">Hora</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Alerta / Condição</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12">Carregando...</TableCell></TableRow>
                ) : sessões.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-500">Nenhum atendimento agendado para hoje.</TableCell></TableRow>
                ) : (
                  sessões.map((sessao) => (
                    <TableRow key={sessao.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => handleOpenEvolucao(sessao)}>
                      <TableCell className="font-bold tabular-nums text-blue-600">
                        {format(sessao.data_hora_inicio, 'HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{sessao.paciente_nome}</span>
                              {sessao.tipo_vaga === "Bloco" && (
                                <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500 h-5">
                                  {sessões.filter(s => s.data_hora_inicio.getTime() === sessao.data_hora_inicio.getTime()).indexOf(sessao) + 1}º da Fila
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">{sessao.especialidade_nome}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {sessao.laudo_vencido && (
                            <Badge className="bg-red-600 text-white border-none text-[10px] font-bold animate-pulse">
                              ⚠️ Laudo vencido
                            </Badge>
                          )}
                          {sessao.conflito_intensivo && (
                            <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-bold">
                              ⚠️ Atendimento compartilhado
                            </Badge>
                          )}
                          {sessao.status !== "Projetado" && sessao.status !== "Agendado" && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] font-bold">
                              Evolução registrada
                            </Badge>
                          )}
                          {/* Tags de Acessibilidade (Item 7.1) */}
                          {(sessao as any).tags_acessibilidade?.map((tag: string) => (
                            <Badge key={tag} variant="outline" className="border-blue-200 text-blue-700 text-[10px] flex items-center gap-1">
                              <Accessibility className="w-2.5 h-2.5" /> {tag.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
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

        <div className="md:col-span-1 space-y-6">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-none text-white shadow-lg overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <History className="h-4 w-4" />
                Resumo do Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">
                {sessões.filter(s => s.status === "Presente").length} / {sessões.length}
              </div>
              <p className="text-blue-100 text-xs mt-1">Atendimentos concluídos hoje.</p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 tracking-wider flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Pendências de laudo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessões.filter(s => s.laudo_vencido).map(s => (
                <div key={s.id} className="text-xs p-2 bg-red-50 rounded border border-red-100 text-red-800 font-medium">
                  {s.paciente_nome}
                </div>
              ))}
              {sessões.filter(s => s.laudo_vencido).length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-4">Nenhuma pendência crítica.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Evolução Sheet */}
      <Sheet open={!!selectedSessao} onOpenChange={() => setSelectedSessao(null)}>
        <SheetContent className="sm:max-w-[600px] border-l-0 shadow-2xl p-0 flex flex-col">
          <div className="bg-slate-900 text-white p-6">
            <SheetHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                  <User className="h-6 w-6 text-slate-500" />
                </div>
                <div>
                  <SheetTitle className="text-white text-xl">{selectedSessao?.paciente_nome}</SheetTitle>
                  <SheetDescription className="text-slate-500">
                    {selectedSessao?.especialidade_nome} | {selectedSessao && format(selectedSessao.data_hora_inicio, 'dd/MM/yyyy HH:mm')}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-4">
              <Label className="text-base font-bold text-slate-900 border-l-4 border-blue-600 pl-3">Evolução clínica do atendimento</Label>
              <Textarea 
                placeholder="Descreva aqui o desenvolvimento da sessão, condutas técnicas aplicadas e observações significativas sobre o paciente..."
                className="min-h-[300px] border-slate-200 focus-visible:ring-blue-600 text-base resize-none"
                value={evolucao}
                onChange={e => setEvolucao(e.target.value)}
              />
            </div>

            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <Label className="text-sm font-bold text-slate-900 tracking-wide">Conduta e desfecho</Label>
              <Select onValueChange={(val) => val && setConduta(val)} value={conduta}>
                <SelectTrigger className="w-full bg-white border-slate-200">
                  <SelectValue placeholder="Selecione a conduta para este paciente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Retorno">Manter Plano Terapêutico (Próxima Sessão)</SelectItem>
                  <SelectItem value="Alta por Melhoria">Alta por Melhoria Clínica (Reabilitação)</SelectItem>
                  <SelectItem value="Alta por Abandono">Alta por Abandono (3+ Faltas)</SelectItem>
                  <SelectItem value="Inserir em Fila de Terapia">Encaminhar para Fila de Transição</SelectItem>
                  <SelectItem value="Encaminhamento Externo">Encaminhamento Externo / Rede</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-6 bg-white border-t flex justify-between gap-4">
            <Button variant="outline" onClick={() => setSelectedSessao(null)} className="flex-1">Cancelar</Button>
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2" 
              onClick={handleSalvarEvolucao}
              disabled={isPending || !evolucao}
            >
              {isPending ? "Processando..." : <><Send className="h-4 w-4" /> Finalizar Atendimento</>}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
