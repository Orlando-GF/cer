'use client'

// 1. Externos
import { useMemo } from 'react'
import { format, startOfDay, parseISO, isValid } from 'date-fns'
import { Truck, MapPin, Accessibility, Phone, User } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

// 2. Internos
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// 3. Tipos
import type { AgendaSession } from '@/types'

interface ViewLogisticaProps {
  // 🚨 NOVA PROP: Dados injetados pelo Servidor como objetos Date nativos
  sessoes: AgendaSession[]
}

export function ViewLogistica({
  sessoes,
}: ViewLogisticaProps): React.ReactNode {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Sincronizar com URL de forma estável
  const dataSelecionada = useMemo(() => {
    const dateParam = searchParams.get('date')
    if (dateParam && isValid(parseISO(dateParam))) {
      return parseISO(dateParam)
    }
    return startOfDay(new Date())
  }, [searchParams])

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

  return (
    <div className="space-y-6">
      <div className="bg-card border-border flex flex-wrap items-center justify-between gap-4 rounded-none border p-5 shadow-none">
        <div className="flex items-center gap-4">
          <div className="space-y-3">
            <h3 className="text-foreground text-base font-semibold tracking-tight">
              Transporte da data
            </h3>
            <input
              type="date"
              className="border-border bg-card focus-visible:ring-primary h-10 w-full cursor-pointer rounded-none border px-2.5 text-xs font-medium focus-visible:ring-2 focus-visible:outline-none"
              value={format(dataSelecionada, 'yyyy-MM-dd')}
              onChange={(e) => setUrlParams({ date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Badge className="bg-primary/10 text-primary flex gap-2 border-transparent px-3 py-1">
            <Truck className="h-4 w-4" /> Rota do dia
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="md:col-span-3">
          <Card className="border-border bg-card overflow-hidden rounded-none shadow-none">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-[80px]">Hora</TableHead>
                  <TableHead>Paciente / Morada</TableHead>
                  <TableHead>Acessibilidade Crítica</TableHead>
                  <TableHead>Terapeuta / Destino</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Removemos o loading falso. Os dados chegam de imediato. */}
                {sessoes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground py-12 text-center"
                    >
                      Nenhum paciente necessita de transporte nesta data.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessoes.map((sessao) => (
                    <TableRow
                      key={sessao.id}
                      className="hover:bg-muted border-border transition-colors"
                    >
                      <TableCell className="text-muted-foreground font-bold tabular-nums">
                        {format(sessao.data_hora_inicio, 'HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-foreground font-bold">
                            {sessao.paciente_nome}
                          </span>
                          <span className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3" />
                            {sessao.paciente_logradouro ||
                              'Endereço não informado'}
                            , {sessao.paciente_numero} -{' '}
                            {sessao.paciente_bairro}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {sessao.tags_acessibilidade?.map((tag: string) => (
                            <Badge
                              key={tag}
                              className="bg-alert-danger-bg text-alert-danger-text border-alert-danger-text/20 rounded-none px-1.5 py-0 text-[9px] shadow-none"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {(!sessao.tags_acessibilidade ||
                            sessao.tags_acessibilidade.length === 0) && (
                            <span className="text-muted-foreground text-[10px] font-semibold">
                              Sem restrições
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-muted text-muted-foreground border-border flex h-6 w-6 items-center justify-center rounded-none border">
                            <User className="h-3 w-3" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-foreground text-xs font-bold">
                              {sessao.profissional_nome}
                            </span>
                            <span className="text-muted-foreground text-[10px] font-semibold">
                              {sessao.especialidade_nome}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="space-y-4 md:col-span-1">
          <div className="bg-alert-warning-bg border-alert-warning-text/20 space-y-3 rounded-none border p-4">
            <h3 className="text-alert-warning-text flex items-center gap-2 text-sm font-bold">
              <Accessibility className="h-4 w-4" /> Resumo de críticos
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-alert-warning-text font-semibold">
                  Cadeirantes
                </span>
                <Badge className="bg-alert-warning-text/20 text-alert-warning-text rounded-none border-none font-bold tabular-nums shadow-none">
                  {
                    sessoes.filter((s) =>
                      s.tags_acessibilidade?.includes('Cadeirante'),
                    ).length
                  }
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-alert-warning-text font-semibold">
                  Uso de Oxigênio
                </span>
                <Badge className="bg-alert-warning-text/20 text-alert-warning-text rounded-none border-none font-bold tabular-nums shadow-none">
                  {
                    sessoes.filter((s) =>
                      s.tags_acessibilidade?.includes('Uso de Oxigénio'),
                    ).length
                  }
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-alert-warning-text font-semibold">
                  Acamados/Maca
                </span>
                <Badge className="bg-alert-warning-text/20 text-alert-warning-text rounded-none border-none font-bold tabular-nums shadow-none">
                  {
                    sessoes.filter((s) =>
                      s.tags_acessibilidade?.includes('Acamado/Uso de Maca'),
                    ).length
                  }
                </Badge>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="text-muted-foreground border-border hover:bg-muted h-12 w-full justify-start gap-2 rounded-none shadow-none"
          >
            <Phone className="h-4 w-4" /> Contatos da Logística
          </Button>
        </div>
      </div>
    </div>
  )
}
