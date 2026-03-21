'use client'

// 1. Externos
import { useState, useTransition, useMemo } from 'react'
import { format, startOfDay, parseISO, isValid } from 'date-fns'
import { FileText, Send, History, AlertCircle } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { toast } from 'sonner'

// 2. Internos
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { registrarSessaoHistorico } from '@/actions'

// 3. Tipos
import type { SerializedAgendaSession, Profissional } from '@/types'

interface ViewProfissionalProps {
  profissionaisIniciais: Profissional[]
  // 🚨 NOVA PROP: Sessões injetadas prontas pelo servidor (Serializadas)
  sessoes: SerializedAgendaSession[]
}

export function ViewProfissional({
  profissionaisIniciais,
  sessoes,
}: ViewProfissionalProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [selectedSessao, setSelectedSessao] = useState<SerializedAgendaSession | null>(
    null,
  )
  const [isPending, startTransition] = useTransition()

  const [evolucao, setEvolucao] = useState('')
  const [conduta, setConduta] = useState('')

  // Sincronizar com URL
  const selectedProf = searchParams.get('profId') || ''
  const dateParam = searchParams.get('date')

  const dataSelecionada = useMemo(() => {
    if (dateParam && isValid(parseISO(dateParam))) {
      return parseISO(dateParam)
    }
    return startOfDay(new Date())
  }, [dateParam])

  const setUrlParams = (
    paramsToUpdate: Record<string, string | null | undefined>,
  ): void => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleOpenEvolucao = (sessao: SerializedAgendaSession): void => {
    setSelectedSessao(sessao)
    setEvolucao('')
    setConduta('')
  }

  const handleSalvarEvolucao = async (): Promise<void> => {
    if (!selectedSessao || !evolucao) return

    startTransition(async () => {
      const res = await registrarSessaoHistorico({
        paciente_id: selectedSessao.paciente_id,
        profissional_id: selectedSessao.profissional_id,
        especialidade_id: selectedSessao.especialidade_id,
        vaga_fixa_id: selectedSessao.vaga_fixa_id,
        data_hora_inicio: selectedSessao.data_hora_inicio,
        data_hora_fim: selectedSessao.data_hora_fim,
        status_comparecimento: 'Presente',
        evolucao_clinica: evolucao,
        conduta: conduta,
        tipo_vaga: selectedSessao.tipo_vaga,
      })

      if (!res.success) {
        toast.error('Erro: ' + res.error)
        return
      }

      toast.success('Evolução registrada com sucesso!')
      setSelectedSessao(null)
      // O Next.js encarrega-se de atualizar as 'sessoes' automaticamente via revalidatePath
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border-border flex flex-wrap items-center justify-between gap-4 rounded-none border p-5 shadow-none">
        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Canal de Atendimento
            </span>
            <Select
              onValueChange={(val) => setUrlParams({ profId: val })}
              value={selectedProf}
            >
              <SelectTrigger
                className="h-10 w-[320px] rounded-none font-medium"
                aria-label="Selecione o profissional"
              >
                <SelectValue placeholder="Selecione o seu nome profissional">
                  {
                    profissionaisIniciais.find((p) => p.id === selectedProf)
                      ?.nome_completo
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {profissionaisIniciais.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Data
            </span>
            <input
              type="date"
              className="border-border bg-card focus-visible:ring-primary h-10 w-[180px] cursor-pointer rounded-none border px-2.5 text-xs font-medium focus-visible:ring-2 focus-visible:outline-none"
              value={format(dataSelecionada, 'yyyy-MM-dd')}
              onChange={(e) => setUrlParams({ date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Badge className="bg-primary/10 text-primary rounded-none border-transparent px-3 py-1 text-[10px] font-bold tracking-widest uppercase">
            Minha Agenda
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card className="bg-card overflow-hidden rounded-none border-none shadow-none">
            <Table>
              <TableHeader>
                <TableRow className="border-border border-b-2">
                  <TableHead className="text-foreground w-[100px] pl-6 text-[10px] font-bold tracking-widest uppercase">
                    Hora
                  </TableHead>
                  <TableHead className="text-foreground text-[10px] font-bold tracking-widest uppercase">
                    Paciente
                  </TableHead>
                  <TableHead className="text-foreground text-[10px] font-bold tracking-widest uppercase">
                    Alertas
                  </TableHead>
                  <TableHead className="text-foreground pr-6 text-right text-[10px] font-bold tracking-widest uppercase">
                    Ação
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessoes.length === 0 && selectedProf ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground py-12 text-center"
                    >
                      Nenhum atendimento agendado para este dia.
                    </TableCell>
                  </TableRow>
                ) : !selectedProf ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground py-12 text-center"
                    >
                      Selecione seu perfil profissional para visualizar a
                      agenda.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessoes.map((sessao) => (
                    <TableRow
                      key={sessao.id}
                      className="hover:bg-muted border-border h-24 cursor-pointer border-b transition-colors last:border-0"
                      onClick={() => handleOpenEvolucao(sessao)}
                    >
                      <TableCell className="text-primary pl-6 text-[18px] font-bold tabular-nums">
                        {format(parseISO(sessao.data_hora_inicio), 'HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-foreground text-[20px] font-bold tracking-tight uppercase">
                              {sessao.paciente_nome}
                            </span>
                            <span className="text-muted-foreground mt-0.5 text-[10px] font-bold tracking-widest uppercase">
                              {sessao.especialidade_nome}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {sessao.laudo_vencido && (
                            <Badge className="bg-alert-danger-bg text-alert-danger-text border-alert-danger-text/20 rounded-none px-1 text-[8px] font-bold tracking-tighter">
                              LAUDO VENCIDO
                            </Badge>
                          )}
                          {sessao.status !== 'Projetado' &&
                            sessao.status !== 'Agendado' && (
                              <Badge className="bg-alert-success-bg text-alert-success-text rounded-none border-transparent px-1 text-[8px] font-bold">
                                CONCLUÍDO
                              </Badge>
                            )}
                          {sessao.tags_acessibilidade?.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="border-border text-muted-foreground bg-muted rounded-none px-1 py-0 text-[9px] uppercase"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary hover:bg-muted h-9 rounded-none text-[11px] font-bold tracking-widest uppercase transition-colors"
                        >
                          <FileText className="mr-2 h-4 w-4" />
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

        <div className="space-y-6 lg:col-span-1">
          <Card className="border-border bg-card rounded-none shadow-none">
            <CardHeader className="bg-primary-50 border-border border-b p-5">
              <CardTitle className="text-foreground flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase">
                <History className="text-primary h-4 w-4" />
                Resumo do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-primary text-3xl font-bold tabular-nums">
                {sessoes.filter((s) => s.status === 'Presente').length} /{' '}
                {sessoes.length}
              </div>
              <p className="text-muted-foreground mt-1 text-[10px] font-bold tracking-wider uppercase">
                Concluídos
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card rounded-none shadow-none">
            <CardHeader className="bg-primary-50 border-border border-b p-5">
              <CardTitle className="text-foreground flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase">
                <AlertCircle className="text-primary h-4 w-4" />
                Pendências de Laudo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sessoes
                .filter((s) => s.laudo_vencido)
                .map((s) => (
                  <div
                    key={s.id}
                    className="bg-alert-danger-bg border-border text-alert-danger-text border-b p-4 text-[11px] font-bold uppercase"
                  >
                    {s.paciente_nome}
                  </div>
                ))}
              {sessoes.filter((s) => s.laudo_vencido).length === 0 && (
                <div className="flex justify-center p-8">
                  <p className="text-muted-foreground text-center text-[10px] font-bold tracking-widest uppercase">
                    Tudo em dia
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet
        open={!!selectedSessao}
        onOpenChange={(open) => !open && setSelectedSessao(null)}
      >
        <SheetContent className="flex min-w-[30vw] flex-col rounded-none border-none p-0 shadow-2xl">
          <SheetHeader className="bg-primary mb-0 shrink-0 border-b border-white/10 p-6">
            <div className="flex w-full flex-col gap-1 text-left">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-white/70" />
                <SheetTitle className="text-white">EVOLUÇÃO CLÍNICA</SheetTitle>
              </div>
              <div className="mt-2 flex flex-col">
                <span className="text-2xl font-bold tracking-tight text-white uppercase">
                  {selectedSessao?.paciente_nome}
                </span>
                <span className="mt-1 text-[10px] font-black tracking-widest text-white/70 uppercase">
                  {selectedSessao?.especialidade_nome} |{' '}
                  {selectedSessao &&
                    format(parseISO(selectedSessao.data_hora_inicio), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
            </div>
          </SheetHeader>

          <div className="bg-background flex-1 space-y-10 overflow-y-auto p-8">
            <div className="space-y-4">
              <Label className="text-muted-foreground block text-[10px] font-black tracking-widest uppercase">
                Descrição do Desenvolvimento
              </Label>
              <Textarea
                placeholder="Descreva aqui o desenvolvimento da sessão, condutas técnicas aplicadas e observações significativas sobre o paciente..."
                className="border-border bg-card min-h-[350px] rounded-none border p-6 text-base leading-relaxed shadow-none focus-visible:ring-0"
                value={evolucao}
                onChange={(e) => setEvolucao(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-muted-foreground block text-[10px] font-black tracking-widest uppercase">
                Conduta e Desfecho
              </Label>
              <Select
                onValueChange={(val) => val && setConduta(val)}
                value={conduta}
              >
                <SelectTrigger className="bg-card border-border h-14 w-full rounded-none text-sm font-bold tracking-tight uppercase">
                  <SelectValue placeholder="SELECIONE A CONDUTA TÉCNICA" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-none shadow-2xl">
                  <SelectItem
                    value="Retorno"
                    className="text-xs font-bold uppercase"
                  >
                    Manter Plano Terapêutico
                  </SelectItem>
                  <SelectItem
                    value="Alta por Melhoria"
                    className="text-xs font-bold uppercase"
                  >
                    Alta por Melhoria Clínica
                  </SelectItem>
                  <SelectItem
                    value="Alta por Abandono"
                    className="text-xs font-bold uppercase"
                  >
                    Alta por Abandono
                  </SelectItem>
                  <SelectItem
                    value="Inserir em Fila de Terapia"
                    className="text-xs font-bold uppercase"
                  >
                    Encaminhar para Fila de Transição
                  </SelectItem>
                  <SelectItem
                    value="Encaminhamento Externo"
                    className="text-xs font-bold uppercase"
                  >
                    Encaminhamento Externo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* FOOTER */}
          <div className="bg-background border-border flex justify-between gap-4 border-t p-8">
            <Button
              variant="ghost"
              onClick={() => setSelectedSessao(null)}
              className="text-muted-foreground h-14 flex-1 rounded-none font-bold tracking-widest uppercase"
            >
              DESCARTAR
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 h-14 flex-1 gap-2 rounded-none font-bold tracking-widest uppercase shadow-lg"
              onClick={handleSalvarEvolucao}
              disabled={isPending || !evolucao}
            >
              {isPending ? (
                'PROCESSANDO...'
              ) : (
                <>
                  <Send className="h-4 w-4" /> FINALIZAR ATENDIMENTO
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
