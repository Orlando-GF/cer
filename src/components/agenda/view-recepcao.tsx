"use client"

// 1. Externos
import { useState, useTransition, useMemo, useEffect, useCallback } from "react"
import { format, startOfDay, endOfDay, parseISO, isValid } from "date-fns"
import { RefreshCw } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { toast } from "sonner"

// 2. Internos
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { 
  buscarAgendaData, 
  registrarSessaoHistorico
} from "@/actions"
import { projectAgendaSessions } from "@/lib/agenda-utils"

// 3. Tipos
import type { AgendaSession, Profissional } from "@/types"

interface ViewRecepcaoProps {
  profissionaisIniciais: Profissional[]
}

export function ViewRecepcao({ profissionaisIniciais }: ViewRecepcaoProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [profissionais] = useState<Profissional[]>(profissionaisIniciais)
  const [sessões, setSessões] = useState<AgendaSession[]>([])
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

  // Carregamento da agenda memoizado para evitar ciclos
  const loadAgenda = useCallback(async () => {
    if (!selectedProf) return
    
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
    } else {
      toast.error("Erro ao carregar agenda: " + res.error)
      setSessões([])
    }
    setLoading(false)
  }, [selectedProf, dataSelecionada])

  useEffect(() => {
    loadAgenda()
  }, [loadAgenda])

  const handleMarcarPresenca = async (sessao: AgendaSession, status: string): Promise<void> => {
    startTransition(async () => {
      const res = await registrarSessaoHistorico({
        paciente_id: sessao.paciente_id,
        profissional_id: sessao.profissional_id,
        especialidade_id: sessao.especialidade_id,
        vaga_fixa_id: sessao.vaga_fixa_id,
        data_hora_inicio: sessao.data_hora_inicio.toISOString(),
        data_hora_fim: sessao.data_hora_fim.toISOString(),
        status_comparecimento: status as "Presente" | "Falta Justificada" | "Falta Nao Justificada" | "Cancelado",
        tipo_vaga: sessao.tipo_vaga
      })
      
      if (!res.success) {
        toast.error("Erro: " + res.error)
        return
      }

      toast.success("Presença registrada com sucesso!")
      loadAgenda()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-5 rounded-none border border-border shadow-none">
        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Profissional</span>
            <Select 
              onValueChange={(val) => setUrlParams({ profId: val })} 
              value={selectedProf}
            >
              <SelectTrigger className="w-[280px] h-10 rounded-none h-10" aria-label="Selecione o profissional">
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
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Data</span>
            <Input 
              type="date" 
              className="w-[180px] font-medium h-10 rounded-none h-10"
              value={format(dataSelecionada, 'yyyy-MM-dd')}
              onChange={(e) => setUrlParams({ date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Badge variant="outline" className="bg-muted/40 border-border text-muted-foreground px-3 py-1 rounded-none">
            {sessões.length} Pacientes Esperados
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-none border-border text-foreground hover:bg-muted gap-1"
            onClick={loadAgenda}
            disabled={loading || isPending}
          >
            <RefreshCw className={`h-4 w-4 ${loading || isPending ? 'animate-spin' : ''}`} />
            Recarregar
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-none rounded-none overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-b-2 border-border">
              <TableHead className="w-[100px] text-foreground font-bold uppercase text-[10px] tracking-widest pl-6">Horário</TableHead>
              <TableHead className="text-foreground font-bold uppercase text-[10px] tracking-widest">Paciente</TableHead>
              <TableHead className="text-foreground font-bold uppercase text-[10px] tracking-widest">Especialidade</TableHead>
              <TableHead className="text-center text-foreground font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
              <TableHead className="text-center text-foreground font-bold uppercase text-[10px] tracking-widest">Chegada</TableHead>
              <TableHead className="text-right text-foreground font-bold uppercase text-[10px] tracking-widest pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">Carregando agenda...</TableCell>
              </TableRow>
            ) : sessões.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">Nenhum agendamento para este dia.</TableCell>
              </TableRow>
            ) : (
              sessões.map((sessao) => (
                <TableRow key={sessao.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0 h-20">
                  <TableCell className="font-bold tabular-nums text-primary text-[16px] pl-6">
                    {format(sessao.data_hora_inicio, 'HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-foreground uppercase tracking-tight">{sessao.paciente_nome}</span>
                        {sessao.conflito_intensivo && (
                          <Badge className="bg-amber-500 text-white border-none text-[8px] font-bold h-4 rounded-none px-1">
                            COMPARTILHADO
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sessao.tags_acessibilidade?.map(tag => (
                          <Badge key={tag} variant="outline" className="text-[9px] py-0 px-1 border-slate-200 text-slate-500 uppercase rounded-none bg-slate-50">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{sessao.especialidade_nome}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    {sessao.status === "Projetado" ? (
                      <Badge className="bg-[var(--color-alert-warning-bg)] text-[var(--color-alert-warning-text)] border-none shadow-none font-bold text-[10px] rounded-none">AGUARDANDO</Badge>
                    ) : sessao.status === "Presente" ? (
                      <Badge className="bg-[var(--color-alert-success-bg)] text-[var(--color-alert-success-text)] border-none shadow-none font-bold text-[10px] rounded-none">PRESENTE</Badge>
                    ) : sessao.status === "Falta Justificada" || sessao.status === "Falta Nao Justificada" ? (
                      <Badge className="bg-[var(--color-alert-danger-bg)] text-[var(--color-alert-danger-text)] border-none shadow-none font-bold text-[10px] rounded-none">FALTA</Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground border-none shadow-none font-bold text-[10px] rounded-none uppercase">{sessao.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-slate-500 font-bold">
                    {sessao.status === "Presente" && sessao.criado_em 
                      ? format(parseISO(sessao.criado_em), 'HH:mm') 
                      : '--:--'}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    {sessao.status === "Projetado" ? (
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-none h-8 font-bold text-[11px] uppercase tracking-wider"
                          onClick={() => handleMarcarPresenca(sessao, "Presente")}
                          disabled={isPending}
                        >
                          Chegada
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 rounded-none h-8 font-bold text-[11px] uppercase tracking-wider"
                          onClick={() => handleMarcarPresenca(sessao, "Falta Nao Justificada")}
                          disabled={isPending}
                        >
                          Falta
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Registrado</span>
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
