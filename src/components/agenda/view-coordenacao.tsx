import { useState, useEffect, useMemo } from "react"
import { format, startOfDay, endOfDay, parseISO, isValid, addMinutes, eachHourOfInterval } from "date-fns"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

// 2. Internos
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buscarAgendaCoordenação } from "@/actions"
import { projectAgendaSessions } from "@/lib/agenda-utils"
import { cn } from "@/lib/utils"

// 3. Tipos
import type { AgendaSession, Profissional } from "@/types"

interface ViewCoordenacaoProps {
  profissionaisIniciais: Profissional[]
}

export function ViewCoordenacao({ profissionaisIniciais }: ViewCoordenacaoProps): React.ReactNode {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [sessões, setSessões] = useState<AgendaSession[]>([])
  const [profissionais] = useState<Profissional[]>(profissionaisIniciais)
  const [loading, setLoading] = useState(false)

  // Sincronizar com URL de forma estável para evitar loop de renderização
  const dataSelecionada = useMemo(() => {
    const dateParam = searchParams.get("date")
    if (dateParam && isValid(parseISO(dateParam))) {
      return parseISO(dateParam)
    }
    return startOfDay(new Date())
  }, [searchParams]) // Só muda se os parâmetros da URL mudarem

  const setUrlParams = (paramsToUpdate: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    router.replace(`${pathname}?${params.toString()}`)
  }

  // Carregamento inicial de profissionais via SSR

  useEffect(() => {
    async function updateCoord() {
      setLoading(true)
      const start = startOfDay(dataSelecionada).toISOString()
      const end = endOfDay(dataSelecionada).toISOString()
      
      const res = await buscarAgendaCoordenação(start, end)
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
    updateCoord()
  }, [dataSelecionada])

  // Configuração da Timeline
  const horas = eachHourOfInterval({
    start: addMinutes(startOfDay(dataSelecionada), 7 * 60), // Início 07:00
    end: addMinutes(startOfDay(dataSelecionada), 19 * 60)  // Fim 19:00
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
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-5 rounded-none border border-border shadow-none">
        <div className="flex items-center gap-4">
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-foreground tracking-tight">Visualização macro</h3>
            <input
              type="date"
              className="w-full h-10 rounded-none border border-border bg-card px-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              value={format(dataSelecionada, 'yyyy-MM-dd')}
              onChange={(e) => setUrlParams({ date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
            <Badge variant="outline" className="bg-primary/10 border-transparent text-primary rounded-none">
                Timeline / Gantt view
            </Badge>
        </div>
      </div>

      <Card className="border border-border shadow-none bg-card overflow-hidden rounded-none">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="w-fit flex flex-col relative">
            {/* Header de Horas */}
            <div className="flex border-b sticky top-0 bg-card z-10 w-full">
              <div className="w-[200px] shrink-0 p-4 border-r border-border bg-muted font-bold text-foreground sticky left-0 z-30 shadow-none">Profissional</div>
              {horas.map(h => (
                <div key={h.toISOString()} className="w-[200px] shrink-0 p-4 text-center text-xs font-bold text-muted-foreground border-r border-border tracking-tighter tabular-nums">
                  {format(h, 'HH:mm')}
                </div>
              ))}
              {/* Borda final transparente para alinhamento */}
              <div className="w-0 shrink-0 border-r border-border" />
            </div>

            {/* Linhas por Profissional */}
            {profissionais.map((prof) => {
              const sessoesProf = sessões.filter(s => s.profissional_id === prof.id)
              
              return (
                <div key={prof.id} className="flex border-b hover:bg-muted transition-colors group w-full">
                  <div className="w-[200px] shrink-0 p-4 border-r border-border font-medium flex items-center bg-card sticky left-0 z-20 shadow-none">
                    <span className="text-sm truncate leading-tight text-foreground font-semibold">{prof.nome_completo}</span>
                  </div>
                  
                  <div className="w-[2600px] shrink-0 relative h-20 border-r border-border bg-card">
                    {/* Linhas de grade verticais */}
                    {horas.map(h => (
                      <div key={h.toISOString()} className="absolute top-0 bottom-0 w-px bg-border border-l border-dashed left-[var(--pos)]" style={{ '--pos': `${getPosition(h)}px` } as React.CSSProperties} />
                    ))}
                    {/* Linha de fechamento final (19:00) */}
                    <div className="absolute top-0 bottom-0 w-px bg-border border-l border-solid left-[var(--pos)] z-10" style={{ '--pos': `${getPosition(addMinutes(startOfDay(dataSelecionada), 19 * 60))}px` } as React.CSSProperties} />

                    {/* Cards de Sessão */}
                    {sessoesProf.map(sessao => {
                      const left = getPosition(sessao.data_hora_inicio)
                      const width = getWidth(sessao.data_hora_inicio, sessao.data_hora_fim)
                      
                      return (
                        <div 
                          key={sessao.id}
                          className={cn(
                            "absolute top-2 bottom-2 rounded-none border p-2 text-[10px] overflow-hidden shadow-none transition-all hover:scale-[1.02] hover:z-20 cursor-help",
                            sessao.status === "Presente" ? "bg-alert-success-bg border-alert-success-text/20 text-alert-success-text" : 
                            sessao.status === "Falta Justificada" || sessao.status === "Falta Nao Justificada" ? "bg-alert-danger-bg border-alert-danger-text/20 text-alert-danger-text" :
                            "bg-primary/10 border-primary/20 text-primary"
                          )}
                          style={{ left: `${left}px`, width: `${width}px` }}
                          title={`${sessao.paciente_nome} - ${sessao.especialidade_nome}`}
                        >
                          <div className="font-bold truncate">{sessao.paciente_nome}</div>
                          <div className="opacity-70 truncate font-medium">{sessao.especialidade_nome}</div>
                          <div className="mt-1 font-mono tabular-nums">{format(sessao.data_hora_inicio, 'HH:mm')}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {loading && profissionais.length > 0 && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-30">
                    <Badge variant="outline" className="bg-card shadow-xl px-6 py-2 border-border text-muted-foreground rounded-none font-bold tracking-widest animate-pulse">
                        Sincronizando timeline...
                    </Badge>
                </div>
            )}
          </div>
        </div>
      </Card>
      
      {profissionais.length === 0 && !loading && (
          <div className="text-center py-20 bg-card rounded-none border border-dashed border-border">
              <p className="text-muted-foreground">Nenhum profissional cadastrado para visualização.</p>
          </div>
      )}
    </div>
  )
}
