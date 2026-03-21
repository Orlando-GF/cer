'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Phone, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react'
import { processarDesligamentoPorAbandono } from '@/actions'
import { format, parseISO } from 'date-fns'
import type { AlertaAbsenteismo } from '@/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface AbsenteismoClientProps {
  alertas: AlertaAbsenteismo[]
}

export function AbsenteismoClient({ alertas }: AbsenteismoClientProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedAlerta, setSelectedAlerta] = useState<{
    id: string
    nome: string
  } | null>(null)

  const abrirWhatsApp = (telefone: string, nome: string) => {
    const limpo = telefone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Olá, sou da coordenação do CER 2. Notamos que ${nome} faltou às últimas 3 sessões consecutivas. Gostaria de entender o motivo e confirmar se haverá continuidade no tratamento.`,
    )
    window.open(`https://wa.me/55${limpo}?text=${msg}`, '_blank')
  }

  const handleDesligamento = () => {
    if (!selectedAlerta) return

    startTransition(async () => {
      const res = await processarDesligamentoPorAbandono(selectedAlerta.id)
      if (res.success) {
        toast.success('Desligamento processado com sucesso.', {
          description: `${selectedAlerta.nome} foi removido(a) de todas as vagas fixas.`,
        })
      } else {
        toast.error('Erro ao processar desligamento.', {
          description: res.error,
        })
      }
      setConfirmOpen(false)
      setSelectedAlerta(null)
    })
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paciente</TableHead>
            <TableHead>Especialidade / Profissional</TableHead>
            <TableHead>Datas das Faltas</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alertas.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-muted-foreground py-20 text-center"
              >
                <CheckCircle2 className="text-alert-success-text mx-auto mb-2 h-8 w-8" />
                Nenhum alerta de absenteísmo crítico no momento. 🙌
              </TableCell>
            </TableRow>
          ) : (
            alertas.map((alerta, idx) => (
              <TableRow key={idx} className="hover:bg-muted transition-colors">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-foreground font-bold">
                      {alerta.paciente.nome_completo}
                    </span>
                    <span className="text-muted-foreground font-mono text-xs">
                      CNS: {alerta.paciente.cns}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-medium">
                      {alerta.especialidade}
                    </span>
                    <span className="text-muted-foreground text-xs italic">
                      {alerta.profissional}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {alerta.ultimas_faltas.map((data: string, i: number) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-muted/50 text-foreground rounded-none border-transparent font-normal tabular-nums"
                      >
                        {format(parseISO(data), 'dd/MM')}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span className="text-sm tabular-nums">
                      {alerta.paciente.telefone_principal || 'Sem tel'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:bg-alert-success-bg hover:text-alert-success-text border-border h-8 gap-2 rounded-none text-xs"
                      onClick={() =>
                        abrirWhatsApp(
                          alerta.paciente.telefone_principal || '',
                          alerta.paciente.nome_completo || '',
                        )
                      }
                    >
                      <MessageSquare className="h-3 w-3" /> Contatar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 gap-2 rounded-none text-xs"
                      disabled={isPending}
                      onClick={() => {
                        setSelectedAlerta({
                          id: alerta.paciente.id ?? '',
                          nome: alerta.paciente.nome_completo ?? 'Paciente',
                        })
                        setConfirmOpen(true)
                      }}
                    >
                      {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Processar Desligamento'
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-border rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold tracking-widest uppercase">
              Confirmar Desligamento
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Deseja realmente processar o desligamento de{' '}
              <strong>{selectedAlerta?.nome}</strong>?
              <br />
              Esta ação encerrará todas as vagas fixas e marcará o cadastro como
              Inativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none text-[10px] font-bold tracking-widest uppercase">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                handleDesligamento()
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-none text-[10px] font-bold tracking-widest uppercase"
              disabled={isPending}
            >
              {isPending ? 'PROCESSANDO...' : 'CONFIRMAR DESLIGAMENTO'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
