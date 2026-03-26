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
import Link from 'next/link'
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
// FUNÇÕES AUXILIARES
// ==========================================

const formatDateStr = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR })
  } catch (e) {
    return dateStr
  }
}

const formatSimpleDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'dd/MM')
  } catch (e) {
    return dateStr
  }
}

// ==========================================
// SUBCOMPONENTE: BADGE DE STATUS
// ==========================================

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    'Falta Nao Justificada': {
      label: 'S/ JUSTIFICATIVA',
      classes: 'border-alert-danger-text text-alert-danger-text bg-alert-danger-bg/20',
    },
    'Falta Justificada': {
      label: 'JUSTIFICADA',
      classes: 'border-alert-success-text text-alert-success-text bg-alert-success-bg/20',
    },
  }
  const cfg = map[status] ?? {
    label: status.toUpperCase(),
    classes: 'bg-muted text-muted-foreground',
  }
  return (
    <Badge
      variant="outline"
      className={`rounded-none px-2 py-0.5 text-[10px] font-black tracking-widest border-2 ${cfg.classes}`}
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
        toast.success('Falta justificada.', {
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
      <DialogContent className="rounded-none border-2 border-border max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-sm font-black tracking-widest uppercase">
            Justificar Falta — Processo Corporativo
          </DialogTitle>
          <DialogDescription className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground">
            Paciente: <span className="text-foreground">{nomePaciente}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black tracking-widest uppercase text-foreground">
              Motivo da Justificativa
            </Label>
            <Textarea
              className="rounded-none border-2 border-border text-xs resize-none bg-background focus:ring-0"
              placeholder="Descreva o motivo da ausência conforme contato realizado."
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
            className="rounded-none border-2 border-border text-[10px] font-bold tracking-widest uppercase hover:bg-muted"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="rounded-none border-2 border-primary text-[10px] font-black tracking-widest uppercase"
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
        toast.success('Contato registado.', {
          description: `Repescagem de ${nomePaciente} concluída.`,
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
      <DialogContent className="rounded-none border-2 border-border max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-sm font-black tracking-widest uppercase">
            Registar Contato de Repescagem
          </DialogTitle>
          <DialogDescription className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground">
            Paciente: <span className="text-foreground">{nomePaciente}</span>
            {telefone && (
              <span className="ml-2 font-mono text-primary">
                [{telefone}]
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black tracking-widest uppercase text-foreground">
              Célula de Contato
            </Label>
            <div className="flex gap-2">
              {(['Ligação', 'WhatsApp', 'Presencial'] as const).map((tipo) => (
                <Button
                  key={tipo}
                  size="sm"
                  variant={tipoContato === tipo ? 'default' : 'outline'}
                  className={`rounded-none border-2 text-[10px] font-bold tracking-widest uppercase h-8 flex-1 transition-all ${
                    tipoContato === tipo ? 'border-primary' : 'border-border'
                  }`}
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
              className="w-full rounded-none border-2 border-dashed border-primary/40 text-[10px] font-bold tracking-widest uppercase gap-2 hover:bg-primary/5"
              onClick={abrirWhatsApp}
            >
              <MessageSquare className="h-3 w-3" />
              Executar WhatsApp Web
            </Button>
          )}
          <div className="space-y-2">
            <Label className="text-[10px] font-black tracking-widest uppercase text-foreground">
              Atas / Observações
            </Label>
            <Textarea
              className="rounded-none border-2 border-border text-xs resize-none bg-background focus:ring-0"
              placeholder="Resumo do contato realizado para o prontuário."
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
            className="rounded-none border-2 border-border text-[10px] font-bold tracking-widest uppercase px-6"
            onClick={onClose}
          >
            Fechar
          </Button>
          <Button
            size="sm"
            className="rounded-none border-2 border-primary text-[10px] font-black tracking-widest uppercase px-6"
            disabled={isPending}
            onClick={handleRegistrar}
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              'Efetuar Registro'
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
        <DropdownMenuTrigger
          className="h-8 px-3 flex items-center justify-center rounded-none border-2 border-border text-[10px] font-black uppercase tracking-widest gap-2 bg-card hover:bg-muted focus:outline-none transition-all"
        >
          Ações <ChevronDown className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-none border-2 border-border min-w-[190px] p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
          <DropdownMenuItem
            className="text-[10px] font-bold uppercase tracking-widest gap-3 cursor-pointer p-3 hover:bg-muted focus:bg-muted"
            onClick={() => setContatoAberto(true)}
          >
            <Phone className="h-3 w-3" />
            Registar Contato
          </DropdownMenuItem>
          {falta.status_comparecimento !== 'Falta Justificada' && (
            <>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                className="text-[10px] font-bold uppercase tracking-widest gap-3 cursor-pointer p-3 hover:bg-muted focus:bg-muted"
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
        nomePaciente={falta.paciente.nome_completo || 'Paciente'}
      />
      <ContatoDialog
        aberto={contatoAberto}
        onClose={() => setContatoAberto(false)}
        agendamentoId={falta.id}
        nomePaciente={falta.paciente.nome_completo || 'Paciente'}
        telefone={falta.paciente.telefone_principal}
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

  const naoJustificadas = faltasRecentes.filter((f) => f.status_comparecimento === 'Falta Nao Justificada')
  const justificadas = faltasRecentes.filter((f) => f.status_comparecimento === 'Falta Justificada')

  return (
    <div className="space-y-6">
      {/* ALERTAS CRÍTICOS */}
      {alertasCriticos.length > 0 && (
        <Card className="rounded-none border-2 border-alert-danger-text/60 bg-alert-danger-bg shadow-none overflow-hidden">
          <CardHeader className="border-b border-alert-danger-text/40 pb-3 bg-alert-danger-bg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-alert-danger-text" />
                <CardTitle className="text-sm font-black tracking-widest uppercase text-alert-danger-text">
                  Alertas Críticos — Regra de Desligamento
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className="rounded-none border-2 border-alert-danger-text bg-alert-danger-text text-alert-danger-bg text-[10px] font-black tracking-widest px-3 tabular-nums"
              >
                {alertasCriticos.length} PACIENTE{alertasCriticos.length !== 1 ? 'S' : ''}
              </Badge>
            </div>
            <CardDescription className="text-[10px] mt-1 font-bold uppercase tracking-wider text-alert-danger-text/80 leading-tight">
              Atenção: Pacientes com 3 faltas consecutivas sem justificativa. Proceder com desligamento imediato conforme regras da unidade.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30 border-b-2 border-border">
                <TableRow className="border-alert-danger-text/10 hover:bg-transparent">
                  <TableHead className="text-[11px] font-black tracking-widest uppercase text-alert-danger-text/70">
                    Paciente
                  </TableHead>
                  <TableHead className="text-[11px] font-black tracking-widest uppercase text-alert-danger-text/70">
                    Especialidade
                  </TableHead>
                  <TableHead className="text-[11px] font-black tracking-widest uppercase text-alert-danger-text/70">
                    Sessões Ausentes
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-black tracking-widest uppercase text-alert-danger-text/70 px-6">
                    Ação Decisória
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertasCriticos.map((alerta, idx) => (
                  <TableRow
                    key={`${alerta.paciente.id}-${idx}`}
                    className="hover:bg-alert-danger-bg/5 transition-colors border-alert-danger-text/10"
                  >
                    <TableCell>
                      <Link
                        href={`/dashboard/pacientes/${alerta.paciente.id}`}
                        className="font-black uppercase tracking-tight hover:underline text-alert-danger-text text-sm"
                      >
                        {alerta.paciente.nome_completo}
                      </Link>
                    </TableCell>
                    <TableCell className="text-[10px] font-bold uppercase tracking-widest text-alert-danger-text/80">
                      {alerta.especialidade}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {alerta.ultimas_faltas.map((data, fIdx) => (
                          <Badge
                            key={fIdx}
                            variant="outline"
                            className="rounded-none border border-alert-danger-text/30 bg-alert-danger-bg text-alert-danger-text text-[9px] font-black uppercase px-1.5 tabular-nums"
                          >
                            {formatSimpleDate(data)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-none border-2 border-alert-danger-text text-alert-danger-text hover:bg-alert-danger-text hover:text-alert-danger-bg transition-all text-[9px] font-black uppercase tracking-widest"
                        onClick={() => {
                          setSelectedAlerta({ 
                            id: alerta.paciente.id || '', 
                            nome: alerta.paciente.nome_completo || 'Paciente' 
                          })
                          setConfirmDesligAberto(true)
                        }}
                        disabled={isPending && selectedAlerta?.id === alerta.paciente.id}
                      >
                        {isPending && selectedAlerta?.id === alerta.paciente.id ? (
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
      <Card className="rounded-none border-2 border-border bg-card shadow-none overflow-hidden">
        <CardHeader className="border-b-2 border-border bg-muted/20 pb-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-black tracking-tighter uppercase text-foreground">
                Relatório de Absenteísmo — Últimos 30 Dias
              </CardTitle>
              <CardDescription className="text-[10px] mt-0.5 font-bold uppercase tracking-widest text-muted-foreground">
                Controle estruturado de ausências para gestão clínica e operacional do CER II.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-alert-danger-text mb-1">Injustificadas</span>
                <Badge
                  variant="outline"
                  className="rounded-none border-2 border-alert-danger-text bg-alert-danger-bg/20 text-alert-danger-text text-[11px] font-black tracking-widest px-3 py-0.5 tabular-nums"
                >
                  {naoJustificadas.length}
                </Badge>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-alert-success-text mb-1">Justificadas</span>
                <Badge
                  variant="outline"
                  className="rounded-none border-2 border-alert-success-text bg-alert-success-bg/20 text-alert-success-text text-[11px] font-black tracking-widest px-3 py-0.5 tabular-nums"
                >
                  {justificadas.length}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="todas" className="w-full">
            <div className="border-b-2 border-border px-4 py-3 bg-muted/10">
              <TabsList className="w-full flex">
                <TabsTrigger
                  value="todas"
                  className="uppercase font-bold tracking-widest text-[10px]"
                >
                  Visão Geral ({faltasRecentes.length})
                </TabsTrigger>
                <TabsTrigger
                  value="injustificadas"
                  className="uppercase font-bold tracking-widest text-[10px]"
                >
                  Injustificadas ({naoJustificadas.length})
                </TabsTrigger>
                <TabsTrigger
                  value="justificadas"
                  className="uppercase font-bold tracking-widest text-[10px]"
                >
                  Justificadas ({justificadas.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {(['todas', 'injustificadas', 'justificadas'] as const).map((tab) => {
              const lista =
                tab === 'todas'
                  ? faltasRecentes
                  : tab === 'injustificadas'
                    ? naoJustificadas
                    : justificadas

              return (
                <TabsContent key={tab} value={tab} className="m-0">
                  {lista.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-28 text-center gap-6 border-b-2 border-border bg-muted/5">
                      <CheckCircle2 className="h-16 w-16 text-muted-foreground/30" />
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-muted-foreground/60">
                          Operação Limpa
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                          Nenhum registro encontrado nesta categoria.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-muted/30 border-b-2 border-border">
                        <TableRow className="border-b-0 hover:bg-transparent">
                          <TableHead className="text-[11px] font-black tracking-widest uppercase text-foreground/70 w-[280px]">
                            Paciente Identificado
                          </TableHead>
                          <TableHead className="text-[11px] font-black tracking-widest uppercase text-foreground/70">
                            Cronograma
                          </TableHead>
                          <TableHead className="text-[11px] font-black tracking-widest uppercase text-foreground/70">
                            Setor Clínico
                          </TableHead>
                          <TableHead className="text-[11px] font-black tracking-widest uppercase text-foreground/70">
                            Classificação
                          </TableHead>
                          <TableHead className="text-right text-[11px] font-black tracking-widest uppercase text-foreground/70 px-6">
                            Gestão
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lista.map((falta) => (
                          <TableRow
                            key={falta.id}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-black uppercase tracking-tight text-foreground">
                                  {falta.paciente.nome_completo}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                  CNS: {falta.paciente.cns || 'N/A'}
                                  {falta.paciente.telefone_principal && (
                                    <>
                                      <span className="text-border">|</span>
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-2 w-2" />
                                        {falta.paciente.telefone_principal}
                                      </span>
                                    </>
                                  )}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase text-foreground">
                                  {formatDateStr(falta.data_hora_inicio)}
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                  {format(parseISO(falta.data_hora_inicio), 'HH:mm')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-[10px] font-bold uppercase tracking-widest text-foreground/80">
                              {falta.especialidade}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={falta.status_comparecimento} />
                            </TableCell>
                            <TableCell className="text-right px-6">
                              <AcoesLinha falta={falta} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* DIALOG DE CONFIRMAÇÃO DE DESLIGAMENTO (COMPARTILHADO) */}
      <AlertDialog
        open={confirmDesligAberto}
        onOpenChange={setConfirmDesligAberto}
      >
        <AlertDialogContent className="rounded-none border-4 border-alert-danger-text bg-card max-w-lg shadow-[8px_8px_0px_0px_rgba(239,68,68,0.2)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter uppercase text-alert-danger-text leading-none">
              Ação Crítica de Desligamento
            </AlertDialogTitle>
            <div className="py-2 border-y-2 border-alert-danger-text/20 my-4">
              <AlertDialogDescription className="text-sm font-bold uppercase tracking-tight text-foreground leading-relaxed">
                Você está prestes a desligar <span className="text-alert-danger-text font-black px-1 bg-alert-danger-bg">{selectedAlerta?.nome}</span> da unidade CER II por absenteísmo excessivo.
              </AlertDialogDescription>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Impactos: Encerramento de todas as vagas fixas e alteração do status para ALTA.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel 
              className="rounded-none border-2 border-border text-[11px] font-black tracking-widest uppercase px-8 hover:bg-muted"
            >
              Abortar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                handleDesligamento()
              }}
              className="bg-alert-danger-text text-alert-danger-bg hover:bg-alert-danger-text/90 rounded-none border-2 border-alert-danger-text text-[11px] font-black tracking-widest uppercase px-8 transition-all active:translate-y-1"
              disabled={isPending}
            >
              {isPending ? 'PROCESSANDO...' : 'EXECUTAR DESLIGAMENTO'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
