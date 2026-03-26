'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Users, CalendarCheck, AlertTriangle, BarChart3 } from 'lucide-react'
import type { IndicadoresGerais } from '@/actions/relatorios-actions'

interface PainelRelatoriosProps {
  data: IndicadoresGerais
}

export function PainelRelatorios({ data }: PainelRelatoriosProps) {
  return (
    <div className="space-y-8">
      {/* INDICADORES NUMÉRICOS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="rounded-none border-2 border-border shadow-sm bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">
              Atendimentos (Mês Atual)
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black tabular-nums tracking-tighter text-foreground">
              {data.atendimentosMes}
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Sessões com presença confirmada
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-2 border-border shadow-sm bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">
              Pacientes na Fila
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black tabular-nums tracking-tighter text-foreground">
              {data.pacientesNaFila}
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Aguardando vaga ou em risco
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-2 border-border shadow-sm bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">
              Total de Faltas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-alert-danger-text" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black tabular-nums tracking-tighter text-alert-danger-text">
              {data.totalFaltas}
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Justificadas e injustificadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TABELA DE FILA POR ESPECIALIDADE */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-xs font-black tracking-[0.2em] uppercase text-foreground">
            Distribuição da Fila por Especialidade
          </h2>
          <div className="flex-1 border-t-2 border-border" />
        </div>

        <div className="border-2 border-border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30 border-b-2 border-border">
              <TableRow className="hover:bg-transparent border-b-0">
                <TableHead className="h-12 text-[10px] font-black tracking-widest uppercase text-foreground px-6">
                  Especialidade
                </TableHead>
                <TableHead className="h-12 text-right text-[10px] font-black tracking-widest uppercase text-foreground px-6">
                  Qtd. Pacientes
                </TableHead>
                <TableHead className="h-12 text-right text-[10px] font-black tracking-widest uppercase text-foreground px-6">
                  Status Operacional
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.filaEspecialidade.length > 0 ? (
                data.filaEspecialidade.map((item) => (
                  <TableRow
                    key={item.especialidadeId}
                    className="border-b border-border transition-colors hover:bg-muted/20"
                  >
                    <TableCell className="py-4 px-6 text-xs font-black uppercase tracking-widest text-foreground">
                      {item.especialidadeNome}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right text-lg font-black tabular-nums tracking-tighter">
                      {item.quantidade}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      {item.quantidade > 10 ? (
                        <Badge 
                          variant="outline" 
                          className="rounded-none border-2 border-alert-danger-text bg-alert-danger-bg text-alert-danger-text text-[10px] font-bold tracking-widest uppercase px-3 shadow-[2px_2px_0px_0px_rgba(239,68,68,0.1)]"
                        >
                          Crítico
                        </Badge>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className="rounded-none border-2 border-muted-foreground text-muted-foreground bg-muted/5 text-[10px] font-bold tracking-widest uppercase px-3"
                        >
                          Estável
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-32 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] bg-muted/5"
                  >
                    Nenhum paciente aguardando na fila estratégica.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
