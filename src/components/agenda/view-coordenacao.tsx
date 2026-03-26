'use client'

import { useMemo } from 'react'
import {
  format,
  startOfDay,
  parseISO,
  isValid,
  addMinutes,
  eachHourOfInterval,
} from 'date-fns'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

// 2. Internos
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// 3. Tipos
import type { AgendaSession, Profissional } from '@/types'

interface ViewCoordenacaoProps {
  profissionaisIniciais: Profissional[]
  // 🚨 NOVA PROP: Dados injetados como objetos Date nativos
  sessoes: AgendaSession[]
}

export function ViewCoordenacao({
  profissionaisIniciais,
  sessoes,
}: ViewCoordenacaoProps): React.ReactNode {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Sincronizar com URL
  const dataSelecionada = useMemo(() => {
    const dateParam = searchParams.get('date')
    if (dateParam && isValid(parseISO(dateParam))) {
      return parseISO(dateParam)
    }
    return startOfDay(new Date())
  }, [searchParams])

  const setUrlParams = (
    paramsToUpdate: Record<string, string | null | undefined>,
  ) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    router.replace(`${pathname}?${params.toString()}`)
  }

  // Configuração da Timeline
  const horas = eachHourOfInterval({
    start: addMinutes(startOfDay(dataSelecionada), 7 * 60), // Início 07:00
    end: addMinutes(startOfDay(dataSelecionada), 19 * 60), // Fim 19:00
  })

  const getPosition = (date: Date) => {
    const startHour = 7
    const h = date.getHours()
    const m = date.getMinutes()
    const totalMinutes = (h - startHour) * 60 + m
    return (totalMinutes / 60) * 200 // 200px por hora
  }

  const getWidth = (start: Date, end: Date): number => {
    const diffMs = end.getTime() - start.getTime()
    const diffMin = diffMs / (1000 * 60)
    return (diffMin / 60) * 200
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-none border-2 border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="space-y-3">
            <h3 className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
              Visualização macro
            </h3>
            <input
              type="date"
              className="h-12 w-full cursor-pointer rounded-none border-2 border-border bg-card px-2.5 text-xs font-bold uppercase shadow-sm focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none"
              value={format(dataSelecionada, 'yyyy-MM-dd')}
              onChange={(e) => setUrlParams({ date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Badge
            variant="outline"
            className="rounded-none border-2 border-border bg-card hover:bg-muted font-black text-[10px] uppercase tracking-widest h-10 shadow-sm text-primary"
          >
            Timeline / Gantt view
          </Badge>
        </div>
      </div>

      <Card className="rounded-none border-2 border-border bg-card overflow-hidden shadow-sm">
        <div className="custom-scrollbar overflow-x-auto">
          <div className="relative flex w-fit flex-col">
            {/* Header de Horas */}
            <div className="bg-muted/30 sticky top-0 z-10 flex w-full border-b-2 border-border">
              <div className="border-border bg-muted text-foreground sticky left-0 z-30 w-[200px] shrink-0 border-r-2 p-4 font-black shadow-none uppercase text-[10px] tracking-widest flex items-center h-12">
                Profissional
              </div>
              {horas.map((h) => (
                <div
                  key={h.toISOString()}
                  className="text-muted-foreground border-border w-[200px] shrink-0 border-r border-dashed p-4 text-center text-[10px] font-black tracking-widest uppercase tabular-nums h-12 flex items-center justify-center"
                >
                  {format(h, 'HH:mm')}
                </div>
              ))}
              <div className="border-border w-0 shrink-0 border-r" />
            </div>

            {/* Linhas por Profissional */}
            {profissionaisIniciais.map((prof) => {
              const sessoesProf = sessoes.filter(
                (s) => s.profissional_id === prof.id,
              )

              return (
                <div
                  key={prof.id}
                  className="hover:bg-muted group flex w-full border-b transition-colors"
                >
                  <div className="border-border bg-card sticky left-0 z-20 flex w-[200px] shrink-0 items-center border-r-2 p-4 font-medium shadow-none">
                    <span className="text-foreground truncate text-[11px] font-bold uppercase tracking-tight leading-tight">
                      {prof.nome_completo}
                    </span>
                  </div>

                  <div className="border-border bg-card relative h-20 w-[2600px] shrink-0 border-r">
                    {/* Linhas de grade verticais */}
                    {horas.map((h) => (
                      <div
                        key={h.toISOString()}
                        className="bg-border absolute top-0 bottom-0 left-[var(--pos)] w-px border-l border-dashed"
                        style={
                          {
                            '--pos': `${getPosition(h)}px`,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                    {/* Linha de fechamento final (19:00) */}
                    <div
                      className="bg-border absolute top-0 bottom-0 left-[var(--pos)] z-10 w-px border-l border-solid"
                      style={
                        {
                          '--pos': `${getPosition(addMinutes(startOfDay(dataSelecionada), 19 * 60))}px`,
                        } as React.CSSProperties
                      }
                    />

                    {/* Cards de Sessão */}
                    {sessoesProf.map((sessao) => {
                      const left = getPosition(sessao.data_hora_inicio)
                      const width = getWidth(
                        sessao.data_hora_inicio,
                        sessao.data_hora_fim,
                      )

                      return (
                        <div
                          key={sessao.id}
                          className={cn(
                            'absolute top-2 bottom-2 cursor-help overflow-hidden rounded-none border-2 p-2 text-[10px] shadow-sm transition-all hover:z-20 hover:scale-[1.02]',
                            sessao.status === 'Presente'
                              ? 'bg-alert-success-bg border-alert-success-text/20 text-alert-success-text'
                              : sessao.status === 'Falta Justificada' ||
                                  sessao.status === 'Falta Nao Justificada'
                                ? 'bg-alert-danger-bg border-alert-danger-text/20 text-alert-danger-text'
                                : 'bg-primary/10 border-primary/20 text-primary',
                          )}
                          style={{ left: `${left}px`, width: `${width}px` }}
                          title={`${sessao.paciente_nome} - ${sessao.especialidade_nome}`}
                        >
                          <div className="truncate font-bold">
                            {sessao.paciente_nome}
                          </div>
                          <div className="truncate font-medium opacity-70">
                            {sessao.especialidade_nome}
                          </div>
                          <div className="mt-1 font-mono tabular-nums">
                            {format(sessao.data_hora_inicio, 'HH:mm')}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {profissionaisIniciais.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] bg-muted/5 border-2 border-border border-dashed m-4">
          Nenhum profissional cadastrado para visualização.
        </div>
      )}
    </div>
  )
}
