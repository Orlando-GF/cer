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
    <div className="space-y-8 p-6">
      {/* INDICADORES NUMÉRICOS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-none border-border shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
              Atendimentos (Mês Atual)
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tabular-nums tracking-tighter">
              {data.atendimentosMes}
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Sessões com presença confirmada
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
              Pacientes na Fila
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tabular-nums tracking-tighter">
              {data.pacientesNaFila}
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Aguardando vaga ou em risco
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
              Total de Faltas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-alert-danger-text" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tabular-nums tracking-tighter text-alert-danger-text">
              {data.totalFaltas}
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Justificadas e injustificadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TABELA DE FILA POR ESPECIALIDADE */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase">
            Distribuição da Fila por Especialidade
          </h2>
          <div className="flex-1 border-t border-border" />
        </div>

        <div className="border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="rounded-none border-b border-border bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-10 text-[10px] font-bold tracking-widest uppercase text-foreground px-4">
                  Especialidade
                </TableHead>
                <TableHead className="h-10 text-right text-[10px] font-bold tracking-widest uppercase text-foreground px-4">
                  Qtd. Pacientes
                </TableHead>
                <TableHead className="h-10 text-right text-[10px] font-bold tracking-widest uppercase text-foreground px-4">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.filaEspecialidade.length > 0 ? (
                data.filaEspecialidade.map((item) => (
                  <TableRow
                    key={item.especialidadeId}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="py-3 px-4 text-sm font-bold tracking-tight">
                      {item.especialidadeNome}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right text-base font-black tabular-nums">
                      {item.quantidade}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      {item.quantidade > 10 ? (
                        <Badge variant="outline" className="rounded-none border-alert-danger-text/20 bg-alert-danger-bg text-alert-danger-text text-[9px] font-heavy tracking-widest uppercase">
                          Crítico
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-none border-border bg-muted/50 text-muted-foreground text-[9px] font-heavy tracking-widest uppercase">
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
                    className="h-24 text-center text-xs text-muted-foreground uppercase tracking-widest"
                  >
                    Nenhum paciente aguardando na fila.
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
