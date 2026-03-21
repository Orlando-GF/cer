'use client'

// 1. Externos
import { useTransition, useMemo } from 'react'
import { format, startOfDay, parseISO, isValid } from 'date-fns'
import { RefreshCw } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { toast } from 'sonner'

// 2. Internos
import { Card } from '@/components/ui/card'
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
import { registrarSessaoHistorico } from '@/actions'

// 3. Tipos
import type { AgendaSession, Profissional } from '@/types'

interface ViewRecepcaoProps {
  profissionaisIniciais: Profissional[]
  // 🚨 NOVA PROP: Os dados agora vêm injetados pelo Servidor!
  sessoes: AgendaSession[]
}

export function ViewRecepcao({
  profissionaisIniciais,
  sessoes,
}: ViewRecepcaoProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [isPending, startTransition] = useTransition()

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

  // Não precisamos mais de loadAgenda nem useEffect.
  // O router.refresh() diz ao servidor para mandar dados novos se necessário.
  const handleRecarregar = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  const handleMarcarPresenca = async (
    sessao: AgendaSession,
    status: string,
  ): Promise<void> => {
    startTransition(async () => {
      const res = await registrarSessaoHistorico({
        paciente_id: sessao.paciente_id,
        profissional_id: sessao.profissional_id,
        especialidade_id: sessao.especialidade_id,
        vaga_fixa_id: sessao.vaga_fixa_id,
        data_hora_inicio: sessao.data_hora_inicio.toISOString(),
        data_hora_fim: sessao.data_hora_fim.toISOString(),
        status_comparecimento: status as
          | 'Presente'
          | 'Falta Justificada'
          | 'Falta Nao Justificada'
          | 'Cancelado',
        tipo_vaga: sessao.tipo_vaga,
      })

      if (!res.success) {
        toast.error('Erro: ' + res.error)
        return
      }

      toast.success('Presença registrada com sucesso!')
      // A Action no backend faz revalidatePath. O Next.js atualiza as 'sessoes' via props automaticamente.
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border-border flex flex-wrap items-center justify-between gap-4 rounded-none border p-5 shadow-none">
        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Profissional
            </span>
            <Select
              onValueChange={(val) => setUrlParams({ profId: val })}
              value={selectedProf}
            >
              <SelectTrigger
                className="h-10 w-[280px] rounded-none"
                aria-label="Selecione o profissional"
              >
                <SelectValue placeholder="Selecione o profissional">
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
          <Badge
            variant="outline"
            className="bg-muted/40 border-border text-muted-foreground rounded-none px-3 py-1"
          >
            {sessoes.length} Pacientes Esperados
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="border-border text-foreground hover:bg-muted gap-1 rounded-none"
            onClick={handleRecarregar}
            disabled={isPending}
          >
            <RefreshCw
              className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`}
            />
            Recarregar
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden rounded-none border-none shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="border-border border-b-2">
              <TableHead className="text-foreground w-[100px] pl-6 text-[10px] font-bold tracking-widest uppercase">
                Horário
              </TableHead>
              <TableHead className="text-foreground text-[10px] font-bold tracking-widest uppercase">
                Paciente
              </TableHead>
              <TableHead className="text-foreground text-[10px] font-bold tracking-widest uppercase">
                Especialidade
              </TableHead>
              <TableHead className="text-foreground text-center text-[10px] font-bold tracking-widest uppercase">
                Status
              </TableHead>
              <TableHead className="text-foreground text-center text-[10px] font-bold tracking-widest uppercase">
                Chegada
              </TableHead>
              <TableHead className="text-foreground pr-6 text-right text-[10px] font-bold tracking-widest uppercase">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Como o Servidor fornece os dados, não há estado de "Carregando" inicial no cliente */}
            {sessoes.length === 0 && selectedProf ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-12 text-center"
                >
                  Nenhum agendamento para este dia.
                </TableCell>
              </TableRow>
            ) : !selectedProf ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-12 text-center"
                >
                  Selecione um profissional para ver a agenda.
                </TableCell>
              </TableRow>
            ) : (
              sessoes.map((sessao) => (
                <TableRow
                  key={sessao.id}
                  className="group hover:bg-muted border-border h-20 border-b transition-colors last:border-0"
                >
                  <TableCell className="text-primary pl-6 text-[16px] font-bold tabular-nums">
                    {format(sessao.data_hora_inicio, 'HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-lg font-bold tracking-tight uppercase">
                          {sessao.paciente_nome}
                        </span>
                        {sessao.conflito_intensivo && (
                          <Badge className="bg-alert-warning-bg text-alert-warning-text h-4 rounded-none border-none px-1 text-[8px] font-bold">
                            COMPARTILHADO
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
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
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      {sessao.especialidade_nome}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {sessao.status === 'Projetado' ? (
                      <Badge className="bg-alert-warning-bg text-alert-warning-text rounded-none border-none text-[10px] font-bold shadow-none">
                        AGUARDANDO
                      </Badge>
                    ) : sessao.status === 'Presente' ? (
                      <Badge className="bg-alert-success-bg text-alert-success-text rounded-none border-none text-[10px] font-bold shadow-none">
                        PRESENTE
                      </Badge>
                    ) : sessao.status === 'Falta Justificada' ||
                      sessao.status === 'Falta Nao Justificada' ? (
                      <Badge className="bg-alert-danger-bg text-alert-danger-text rounded-none border-none text-[10px] font-bold shadow-none">
                        FALTA
                      </Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground rounded-none border-none text-[10px] font-bold uppercase shadow-none">
                        {sessao.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-center font-bold tabular-nums">
                    {sessao.status === 'Presente' && sessao.criado_em
                      ? format(parseISO(sessao.criado_em), 'HH:mm')
                      : '--:--'}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    {sessao.status === 'Projetado' ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-alert-success-text border-alert-success-text/30 hover:bg-alert-success-bg h-8 rounded-none text-[11px] font-bold tracking-wider uppercase"
                          onClick={() =>
                            handleMarcarPresenca(sessao, 'Presente')
                          }
                          disabled={isPending}
                        >
                          Chegada
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 rounded-none text-[11px] font-bold tracking-wider uppercase"
                          onClick={() =>
                            handleMarcarPresenca(
                              sessao,
                              'Falta Nao Justificada',
                            )
                          }
                          disabled={isPending}
                        >
                          Falta
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted text-[10px] font-bold tracking-widest uppercase">
                        Registrado
                      </span>
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
