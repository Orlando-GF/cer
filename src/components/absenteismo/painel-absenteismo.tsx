'use client'

import React, { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Phone,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  ChevronDown,
} from 'lucide-react'
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  justificarFalta,
  registrarContatoRepescagem,
  processarDesligamentoPorAbandono,
} from '@/actions/absenteismo-actions'
import type { AlertaAbsenteismo } from '@/types'
import type { FaltaRecente } from '@/actions/absenteismo-actions'

// ==========================================
// SUBCOMPONENTE: BADGE DE STATUS
// ==========================================

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    'Falta Nao Justificada': {
      label: 'S/ JUSTIFICATIVA',
      classes: 'bg-alert-danger-bg text-alert-danger-text border-alert-danger-text/30',
    },
    'Falta Justificada': {
      label: 'JUSTIFICADA',
      classes: 'bg-alert-success-bg text-alert-success-text border-alert-success-text/30',
    },
  }
  const cfg = map[status] ?? {
    label: status.toUpperCase(),
    classes: 'bg-muted text-muted-foreground',
  }
  return (
    <Badge
      variant="outline"
      className={`rounded-none px-2 py-0.5 text-[9px] font-bold tracking-widest ${cfg.classes}`}
    >
      {cfg.label}
    </Badge>
  )
}

// ==========================================
// SUBCOMPONENTE: DIALOG DE JUSTIFICATIVA
// ==========================================

interface JustificarDialogProps {
  aberto: boolean
  onClose: () => void
  agendamentoId: string
  nomePaciente: string
}

function JustificarDialog({
  aberto,
  onClose,
  agendamentoId,
  nomePaciente,
}: JustificarDialogProps) {
  const [motivo, setMotivo] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    startTransition(async () => {
      const res = await justificarFalta({ agendamentoId, motivo })
      if (res.success) {
        toast.success('Falta justificada com sucesso.', {
          description: `O registro de ${nomePaciente} foi atualizado.`,
        })
        setMotivo('')
        onClose()
      } else {
        toast.error('Erro ao justificar falta.', { description: res.error })
      }
    })
  }

  return (
    <Dialog open={aberto} onOpenChange={onClose}>
      <DialogContent className="rounded-none border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xs font-bold tracking-widest uppercase">
            Justificar Falta
          </DialogTitle>
          <DialogDescription className="text-xs">
            Registando justificativa para{' '}
            <strong>{nomePaciente}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              Motivo da Justificativa
            </Label>
            <Textarea
              className="rounded-none border-border text-xs resize-none"
              placeholder="Ex: Paciente informou internação hospitalar de emergência."
              rows={4}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-none text-[10px] font-bold tracking-widest uppercase"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="rounded-none text-[10px] font-bold tracking-widest uppercase"
            disabled={motivo.trim().length < 5 || isPending}
            onClick={handleSubmit}
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              'Confirmar Justificativa'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ==========================================
// SUBCOMPONENTE: DIALOG DE CONTATO
// ==========================================

interface ContatoDialogProps {
  aberto: boolean
  onClose: () => void
  agendamentoId: string
  nomePaciente: string
  telefone?: string | null
}

function ContatoDialog({
  aberto,
  onClose,
  agendamentoId,
  nomePaciente,
  telefone,
}: ContatoDialogProps) {
  const [tipoContato, setTipoContato] = useState<'Ligação' | 'WhatsApp' | 'Presencial'>('Ligação')
  const [obs, setObs] = useState('')
  const [isPending, startTransition] = useTransition()

  const abrirWhatsApp = () => {
    if (!telefone) return
    const limpo = telefone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Olá! Sou da coordenação do CER II. Notamos ausência do(a) ${nomePaciente} em sessões recentes. Podemos confirmar continuidade no tratamento?`,
    )
    window.open(`https://wa.me/55${limpo}?text=${msg}`, '_blank')
  }

  const handleRegistrar = () => {
    startTransition(async () => {
      const res = await registrarContatoRepescagem({
        agendamentoId,
        tipoContato,
        observacao: obs || null,
      })
      if (res.success) {
        toast.success('Contato registado com sucesso.', {
          description: `Repescagem de ${nomePaciente} registada.`,
        })
        setObs('')
        onClose()
      } else {
        toast.error('Erro ao registrar contato.', { description: res.error })
      }
    })
  }

  return (
    <Dialog open={aberto} onOpenChange={onClose}>
      <DialogContent className="rounded-none border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xs font-bold tracking-widest uppercase">
            Registar Contato de Repescagem
          </DialogTitle>
          <DialogDescription className="text-xs">
            Paciente: <strong>{nomePaciente}</strong>
            {telefone && (
              <span className="ml-2 font-mono text-muted-foreground">
                — {telefone}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              Tipo de Contato
            </Label>
            <div className="flex gap-2">
              {(['Ligação', 'WhatsApp', 'Presencial'] as const).map((tipo) => (
                <Button
                  key={tipo}
                  size="sm"
                  variant={tipoContato === tipo ? 'default' : 'outline'}
                  className="rounded-none text-[10px] font-bold tracking-widest uppercase h-8"
                  onClick={() => setTipoContato(tipo)}
                >
                  {tipo}
                </Button>
              ))}
            </div>
          </div>
          {tipoContato === 'WhatsApp' && telefone && (
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-none text-[10px] font-bold tracking-widest uppercase border-dashed gap-2"
              onClick={abrirWhatsApp}
            >
              <MessageSquare className="h-3 w-3" />
              Abrir WhatsApp Web
            </Button>
          )}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              Observação (opcional)
            </Label>
            <Textarea
              className="rounded-none border-border text-xs resize-none"
              placeholder="Ex: Paciente comprometeu retorno na próxima semana."
              rows={3}
              value={obs}
              onChange={(e) => setObs(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-none text-[10px] font-bold tracking-widest uppercase"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="rounded-none text-[10px] font-bold tracking-widest uppercase"
            disabled={isPending}
            onClick={handleRegistrar}
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              'Registar Contato'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ==========================================
// SUBCOMPONENTE INTERNO: AÇÕES DE LINHA
// ==========================================

interface AcoesLinhaProps {
  falta: FaltaRecente
}

function AcoesLinha({ falta }: AcoesLinhaProps) {
  const [justificarAberto, setJustificarAberto] = useState(false)
  const [contatoAberto, setContatoAberto] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-none border-border text-xs gap-1"
          >
            Ações <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-none min-w-[180px]">
          <DropdownMenuItem
            className="text-xs gap-2 cursor-pointer"
            onClick={() => setContatoAberto(true)}
          >
            <Phone className="h-3 w-3" />
            Registar Contato
          </DropdownMenuItem>
          {falta.status_comparecimento === 'Falta Nao Justificada' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs gap-2 cursor-pointer"
                onClick={() => setJustificarAberto(true)}
              >
                <ClipboardCheck className="h-3 w-3" />
                Justificar Falta
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <JustificarDialog
        aberto={justificarAberto}
        onClose={() => setJustificarAberto(false)}
        agendamentoId={falta.id}
        nomePaciente={falta.paciente.nome_completo ?? 'Paciente'}
      />
      <ContatoDialog
        aberto={contatoAberto}
        onClose={() => setContatoAberto(false)}
        agendamentoId={falta.id}
        nomePaciente={falta.paciente.nome_completo ?? 'Paciente'}
        telefone={(falta.paciente as { telefone_principal?: string | null }).telefone_principal}
      />
    </>
  )
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

interface PainelAbsenteismoProps {
  faltasRecentes: FaltaRecente[]
  alertasCriticos: AlertaAbsenteismo[]
}

export function PainelAbsenteismo({
  faltasRecentes,
  alertasCriticos,
}: PainelAbsenteismoProps) {
  const [confirmDesligAberto, setConfirmDesligAberto] = useState(false)
  const [selectedAlerta, setSelectedAlerta] = useState<{
    id: string
    nome: string
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDesligamento = () => {
    if (!selectedAlerta) return
    startTransition(async () => {
      const res = await processarDesligamentoPorAbandono(selectedAlerta.id)
      if (res.success) {
        toast.success('Desligamento processado.', {
          description: `${selectedAlerta.nome} removido(a) de todas as vagas.`,
        })
      } else {
        toast.error('Erro ao processar desligamento.', {
          description: res.error,
        })
      }
      setConfirmDesligAberto(false)
      setSelectedAlerta(null)
    })
  }

  const naoJustificadas = faltasRecentes.filter(
    (f) => f.status_comparecimento === 'Falta Nao Justificada',
  )
  const justificadas = faltasRecentes.filter(
    (f) => f.status_comparecimento === 'Falta Justificada',
  )

  return (
    <div className="space-y-6">
      {/* ALERTAS CRÍTICOS */}
      {alertasCriticos.length > 0 && (
        <Card className="rounded-none border-alert-danger-text/30 bg-alert-danger-bg/20 shadow-none">
          <CardHeader className="border-b border-alert-danger-text/20 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-alert-danger-text" />
                <CardTitle className="text-sm font-bold tracking-widest uppercase text-alert-danger-text">
                  Alertas Críticos — Regra de Desligamento
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className="rounded-none border-alert-danger-text/30 bg-alert-danger-bg text-alert-danger-text text-[10px] font-bold tracking-widest"
              >
                {alertasCriticos.length} PACIENTE{alertasCriticos.length !== 1 ? 'S' : ''}
              </Badge>
            </div>
            <CardDescription className="text-xs mt-1">
              Estes pacientes acumularam 3 faltas consecutivas sem justificativa. Protocolo: contatar antes de desligar.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-alert-danger-text/10 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                    Paciente
                  </TableHead>
                  <TableHead className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                    Especialidade
                  </TableHead>
                  <TableHead className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                    Datas das Faltas
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                    Ação
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertasCriticos.map((alerta) => (
                  <TableRow
                    key={`${alerta.paciente.id}-${alerta.especialidade}`}
                    className="hover:bg-alert-danger-bg/10 transition-colors border-alert-danger-text/10"
                  >
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-foreground">
                          {alerta.paciente.nome_completo}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          CNS: {alerta.paciente.cns}
                        </span>
                        {alerta.paciente.telefone_principal && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Phone className="h-2.5 w-2.5" />
                            {alerta.paciente.telefone_principal}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-foreground">
                          {alerta.especialidade}
                        </span>
                        <span className="text-[10px] italic text-muted-foreground">
                          {alerta.profissional}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {alerta.ultimas_faltas.map((data: string, i: number) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="rounded-none border-transparent bg-alert-danger-bg/50 text-alert-danger-text text-[9px] tabular-nums font-bold"
                          >
                            {format(parseISO(data), 'dd/MM', { locale: ptBR })}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 rounded-none text-[9px] font-bold tracking-widest uppercase"
                        disabled={isPending}
                        onClick={() => {
                          setSelectedAlerta({
                            id: alerta.paciente.id ?? '',
                            nome: alerta.paciente.nome_completo ?? 'Paciente',
                          })
                          setConfirmDesligAberto(true)
                        }}
                      >
                        {isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Processar Desligamento'
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* FALTAS DOS ÚLTIMOS 30 DIAS */}
      <Card className="rounded-none border-border bg-card shadow-none">
        <CardHeader className="border-b border-border bg-muted/30 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold tracking-widest uppercase text-foreground">
                Faltas — Últimos 30 Dias
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Registros de ausência para acompanhamento e ação.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-none border-alert-danger-text/20 bg-alert-danger-bg text-alert-danger-text text-[9px] font-bold tracking-widest"
              >
                {naoJustificadas.length} S/ JUST.
              </Badge>
              <Badge
                variant="outline"
                className="rounded-none border-alert-success-text/20 bg-alert-success-bg text-alert-success-text text-[9px] font-bold tracking-widest"
              >
                {justificadas.length} JUSTIFICADAS
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="todas" className="w-full">
            <div className="border-b border-border px-4">
              <TabsList className="h-9 rounded-none bg-transparent gap-4 p-0">
                <TabsTrigger
                  value="todas"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none text-[10px] font-bold tracking-widest uppercase px-0 pb-2 pt-2 bg-transparent"
                >
                  Todas ({faltasRecentes.length})
                </TabsTrigger>
                <TabsTrigger
                  value="injustificadas"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none text-[10px] font-bold tracking-widest uppercase px-0 pb-2 pt-2 bg-transparent"
                >
                  Injustificadas ({naoJustificadas.length})
                </TabsTrigger>
                <TabsTrigger
                  value="justificadas"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none text-[10px] font-bold tracking-widest uppercase px-0 pb-2 pt-2 bg-transparent"
                >
                  Justificadas ({justificadas.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {(['todas', 'injustificadas', 'justificadas'] as const).map(
              (tab) => {
                const lista =
                  tab === 'todas'
                    ? faltasRecentes
                    : tab === 'injustificadas'
                      ? naoJustificadas
                      : justificadas

                return (
                  <TabsContent key={tab} value={tab} className="m-0">
                    {lista.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-alert-success-text" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Nenhum registro encontrado.
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                              Paciente
                            </TableHead>
                            <TableHead className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                              Especialidade
                            </TableHead>
                            <TableHead className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                              Data
                            </TableHead>
                            <TableHead className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                              Status
                            </TableHead>
                            <TableHead className="text-right text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                              Ações
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lista.map((falta) => (
                            <TableRow
                              key={falta.id}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <TableCell>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-sm font-bold text-foreground">
                                    {falta.paciente.nome_completo}
                                  </span>
                                  <span className="font-mono text-[10px] text-muted-foreground">
                                    CNS: {falta.paciente.cns}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-medium text-foreground">
                                    {falta.especialidade}
                                  </span>
                                  <span className="text-[10px] italic text-muted-foreground">
                                    {falta.profissional}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                                  {format(
                                    parseISO(falta.data_hora_inicio),
                                    "dd/MM/yyyy 'às' HH:mm",
                                    { locale: ptBR },
                                  )}
                                </span>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={falta.status_comparecimento} />
                              </TableCell>
                              <TableCell className="text-right">
                                <AcoesLinha falta={falta} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                )
              },
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* DIALOG DE CONFIRMAÇÃO DE DESLIGAMENTO */}
      <AlertDialog
        open={confirmDesligAberto}
        onOpenChange={setConfirmDesligAberto}
      >
        <AlertDialogContent className="rounded-none border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xs font-bold tracking-widest uppercase">
              Confirmar Desligamento por Abandono
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              Deseja realmente processar o desligamento de{' '}
              <strong>{selectedAlerta?.nome}</strong>?<br />
              Esta ação encerrará <strong>todas as vagas fixas</strong> e marcará
              o cadastro como <strong>Alta</strong>. Esta operação{' '}
              <strong>não pode ser desfeita</strong>.
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
    </div>
  )
}
