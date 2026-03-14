"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { buscarAgendaCoordenação, buscarProfissionais } from "@/app/actions"
import { projectAgendaSessions, AgendaSession } from "@/lib/agenda-utils"
import { format, startOfDay, endOfDay, parseISO, isValid, addMinutes, eachHourOfInterval, startOfHour } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { User } from "lucide-react"
import { Input } from "@/components/ui/input"

export function ViewCoordenacao() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [sessões, setSessões] = useState<AgendaSession[]>([])
  const [profissionais, setProfissionais] = useState<any[]>([])
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

  useEffect(() => {
    async function init() {
      const resProf = await buscarProfissionais()
      if (resProf.success && resProf.data) {
        setProfissionais(resProf.data)
      }
    }
    init()
  }, [])

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

  const getWidth = (start: Date, end: Date) => {
    const diffMs = end.getTime() - start.getTime()
    const diffMin = diffMs / (1000 * 60)
    return (diffMin / 60) * 200
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 tracking-wider">Visualização macro</span>
            <Input 
              type="date" 
              className="w-full"
              value={format(dataSelecionada, 'yyyy-MM-dd')}
              onChange={(e) => setUrlParams({ date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-50 border-blue-100 text-blue-700">
                Timeline / Gantt view
            </Badge>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="w-fit flex flex-col relative">
            {/* Header de Horas */}
            <div className="flex border-b sticky top-0 bg-white z-10 w-full">
              <div className="w-[200px] shrink-0 p-4 border-r bg-slate-50 font-bold text-slate-900 sticky left-0 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">Profissional</div>
              {horas.map(h => (
                <div key={h.toISOString()} className="w-[200px] shrink-0 p-4 text-center text-xs font-bold text-slate-500 border-r border-slate-100 tracking-tighter">
                  {format(h, 'HH:mm')}
                </div>
              ))}
              {/* Borda final transparente para alinhamento */}
              <div className="w-0 shrink-0 border-r border-slate-200" />
            </div>

            {/* Linhas por Profissional */}
            {profissionais.map((prof) => {
              const sessoesProf = sessões.filter(s => s.profissional_id === prof.id)
              
              return (
                <div key={prof.id} className="flex border-b hover:bg-slate-50/30 transition-colors group w-full">
                  <div className="w-[200px] shrink-0 p-4 border-r font-medium flex items-center bg-white sticky left-0 z-20 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                    <span className="text-sm truncate leading-tight text-slate-700 font-semibold">{prof.nome_completo}</span>
                  </div>
                  
                  <div className="w-[2600px] shrink-0 relative h-20 border-r border-slate-100 bg-white">
                    {/* Linhas de grade verticais */}
                    {horas.map(h => (
                      <div key={h.toISOString()} className="absolute top-0 bottom-0 w-px bg-slate-100 border-l border-dashed left-[var(--pos)]" style={{ '--pos': `${getPosition(h)}px` } as any} />
                    ))}
                    {/* Linha de fechamento final (19:00) */}
                    <div className="absolute top-0 bottom-0 w-px bg-slate-200 border-l border-solid left-[var(--pos)] z-10" style={{ '--pos': `${getPosition(addMinutes(startOfDay(dataSelecionada), 19 * 60))}px` } as any} />

                    {/* Cards de Sessão */}
                    {sessoesProf.map(sessao => {
                      const left = getPosition(sessao.data_hora_inicio)
                      const width = getWidth(sessao.data_hora_inicio, sessao.data_hora_fim)
                      
                      return (
                        <div 
                          key={sessao.id}
                          className={cn(
                            "absolute top-2 bottom-2 rounded-lg border p-2 text-[10px] overflow-hidden shadow-sm transition-all hover:scale-[1.02] hover:z-20 cursor-help",
                            sessao.status === "Presente" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : 
                            sessao.status === "Falta Justificada" ? "bg-red-50 border-red-200 text-red-900" :
                            "bg-blue-50 border-blue-200 text-blue-900"
                          )}
                          style={{ left: `${left}px`, width: `${width}px` }}
                          title={`${sessao.paciente_nome} - ${sessao.especialidade_nome}`}
                        >
                          <div className="font-bold truncate">{sessao.paciente_nome}</div>
                          <div className="opacity-70 truncate font-medium">{sessao.especialidade_nome}</div>
                          <div className="mt-1 font-mono">{format(sessao.data_hora_inicio, 'HH:mm')}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {loading && profissionais.length > 0 && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-30">
                    <Badge variant="outline" className="bg-white shadow-xl px-6 py-2 border-slate-200 text-slate-600 font-bold tracking-widest animate-pulse">
                        Sincronizando timeline...
                    </Badge>
                </div>
            )}
          </div>
        </div>
      </Card>
      
      {profissionais.length === 0 && !loading && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
              <p className="text-slate-500">Nenhum profissional cadastrado para visualização.</p>
          </div>
      )}
    </div>
  )
}
