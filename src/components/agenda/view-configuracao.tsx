'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { salvarVagaFixa, encerrarVagaFixa } from '@/actions/agendamentos-actions'
import { Plus, Calendar, Clock, User, Trash2, MapPin } from 'lucide-react'
import {
  type Profissional,
  type Especialidade,
  type VagaFixaComJoins,
} from '@/types'
import { toast } from 'sonner'
import { PacienteSelector } from '@/components/pacientes/paciente-selector'
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

const DIAS_SEMANA = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Segunda-feira' },
  { value: '2', label: 'Terça-feira' },
  { value: '3', label: 'Quarta-feira' },
  { value: '4', label: 'Quinta-feira' },
  { value: '5', label: 'Sexta-feira' },
  { value: '6', label: 'Sábado' },
]

const DIAS_SEMANA_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
}

// --- COMPONENTE FILHO ---
interface VagasAtivasListProps {
  vagas: VagaFixaComJoins[]
  onRemove?: (id: string) => void
}

// Helper local para transformar '11:00:00+00' em hora do navegador (e.g. '08:00')
function formatLocalTime(timetzStr: string | undefined | null) {
  if (!timetzStr) return ''
  // Adiciona uma data base (1970) para forçar o parse correto no fuso localizado do navegador
  const isTimeTz = timetzStr.includes('+') || timetzStr.includes('-')
  const timeString = isTimeTz ? timetzStr : `${timetzStr}Z`
  const d = new Date(`1970-01-01T${timeString}`)
  if (isNaN(d.getTime())) return timetzStr.substring(0, 5) // Fallback seguro
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function VagasAtivasList({ vagas, onRemove }: VagasAtivasListProps) {
  if (vagas.length === 0) {
    return (
      <div className="text-muted-foreground py-20 text-center">
        <Calendar className="mx-auto mb-6 h-16 w-16 opacity-50" />
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase">
          Nenhuma vaga fixa ativa encontrada
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
      {vagas.map((vaga) => (
        <div
          key={vaga.id}
          className="group bg-card border-border hover:border-primary/20 relative border p-4 transition-all hover:shadow-md"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary rounded-none border-transparent text-[9px] font-bold tracking-wider uppercase">
                {DIAS_SEMANA_LABELS[vaga.dia_semana]}
              </Badge>
              <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-bold">
                <Clock className="h-3 w-3" />
                {formatLocalTime(vaga.horario_inicio)} - {formatLocalTime(vaga.horario_fim)}
              </span>
            </div>
            {onRemove && (
               <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive h-8 w-8 transition-colors"
                onClick={() => onRemove(vaga.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="bg-background border-border flex h-8 w-8 shrink-0 items-center justify-center rounded-none border">
                <User className="text-primary h-4 w-4" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-foreground truncate text-[11px] font-bold uppercase">
                  {vaga.pacientes?.nome_completo || 'Paciente não identificado'}
                </span>
                <span className="text-muted-foreground truncate text-[9px] font-bold tracking-tighter uppercase">
                  {vaga.linhas_cuidado_especialidades?.nome_especialidade ||
                    'Especialidade n/a'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-border/50 mt-3 flex items-center justify-between border-t pt-3">
            <span className="text-muted-foreground flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase">
              <MapPin className="h-3 w-3" />
              Presencial
            </span>
            <span className="text-primary text-[9px] font-bold uppercase">
              Contrato Ativo
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// --- COMPONENTE PRINCIPAL ---
interface ViewConfiguracaoProps {
  profissionaisIniciais: Profissional[]
  especialidadesIniciais: Especialidade[]
  // 🚨 NOVA PROP: As vagas ativas agora vêm do Servidor!
  vagasAtivas: VagaFixaComJoins[]
}

export function ViewConfiguracao({
  profissionaisIniciais,
  especialidadesIniciais,
  vagasAtivas,
}: ViewConfiguracaoProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // O profissional selecionado agora vive na URL (SSoT)
  const configProfId = searchParams.get('configProfId') || ''

  // Form State (Mantemos local porque é efémero)
  const [pacienteId, setPacienteId] = useState('')
  const [especialidadeId, setEspecialidadeId] = useState('')
  const [diaSemana, setDiaSemana] = useState('')
  const [horaInicio, setHoraInicio] = useState('08:00')
  const [horaFim, setHoraFim] = useState('09:00')

  // Confirm Delete State
  const [vagaToDelete, setVagaToDelete] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Correção de tipagem: O Select pode retornar null se for limpo
  const handleProfissionalChange = (val: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set('configProfId', val)
    else params.delete('configProfId')
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleSave = async () => {
    if (!pacienteId || !configProfId || !especialidadeId || !diaSemana) {
      toast.error('Preencha todos os campos obrigatórios.')
      return
    }

    startTransition(async () => {
      // Padroniza as horas no fuso UTC antes de enviar para o banco
      const buildUtcTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':')
        const d = new Date()
        d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0)
        return d.toISOString()
      }

      const res = await salvarVagaFixa({
        paciente_id: pacienteId,
        profissional_id: configProfId,
        especialidade_id: especialidadeId,
        dia_semana: parseInt(diaSemana),
        horario_inicio: buildUtcTime(horaInicio),
        horario_fim: buildUtcTime(horaFim),
        data_inicio_contrato: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }),
        status_vaga: 'Ativa',
      })

      if (res.success) {
        toast.success('Vaga fixa cadastrada com sucesso!')
        // Limpa apenas o form. A lista atualiza sozinha via Server Revalidate!
        setPacienteId('')
      } else {
        toast.error('Erro ao salvar: ' + res.error)
      }
    })
  }

  const handleRemoveVaga = (id: string) => {
    setVagaToDelete(id)
    setConfirmOpen(true)
  }

  const confirmRemoveVaga = async () => {
    if (!vagaToDelete) return

    startTransition(async () => {
      const res = await encerrarVagaFixa(vagaToDelete)
      if (res.success) {
        toast.success('Vaga encerrada com sucesso!')
      } else {
        toast.error('Erro ao encerrar vaga: ' + res.error)
      }
      setConfirmOpen(false)
      setVagaToDelete(null)
    })
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <Card className="border-border bg-card rounded-none shadow-none lg:col-span-1">
        <CardHeader className="border-border mx-6 border-b px-0 pb-6">
          <CardTitle className="text-foreground flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
            <Plus className="text-primary h-4 w-4" />
            Nova Vaga Fixa
          </CardTitle>
          <CardDescription className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            Configuração de recorrência
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
              Paciente
            </Label>
            <PacienteSelector value={pacienteId} onSelect={setPacienteId} />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
              Profissional Responsável
            </Label>
            <Select
              onValueChange={handleProfissionalChange}
              value={configProfId}
            >
              <SelectTrigger className="border-border focus:ring-primary bg-background h-12 rounded-none font-bold">
                <SelectValue placeholder="SELECIONE O PROFISSIONAL" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-none shadow-2xl">
                {profissionaisIniciais.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    className="text-[11px] font-bold uppercase"
                  >
                    {p.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
              Especialidade
            </Label>
            <Select
              onValueChange={(val) => val && setEspecialidadeId(val)}
              value={especialidadeId}
            >
              <SelectTrigger className="border-border focus:ring-primary bg-background h-12 rounded-none font-bold">
                <SelectValue placeholder="SELECIONE A ESPECIALIDADE" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-none shadow-2xl">
                {especialidadesIniciais.map((e) => (
                  <SelectItem
                    key={e.id}
                    value={e.id}
                    className="text-[11px] font-bold uppercase"
                  >
                    {e.nome_especialidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                Dia da Semana
              </Label>
              <Select
                onValueChange={(val) => val && setDiaSemana(val)}
                value={diaSemana}
              >
                <SelectTrigger className="border-border focus:ring-primary bg-background h-12 rounded-none font-bold">
                  <SelectValue placeholder="DIA DA SEMANA" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-none shadow-2xl">
                  {DIAS_SEMANA.map((d) => (
                    <SelectItem
                      key={d.value}
                      value={d.value}
                      className="text-[11px] font-bold uppercase"
                    >
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                Janela de Horário
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="border-border bg-card h-12 rounded-none font-bold"
                />
                <span className="text-muted-foreground font-bold">às</span>
                <Input
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  className="border-border bg-card h-12 rounded-none font-bold"
                />
              </div>
            </div>
          </div>

          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 mt-4 h-14 w-full rounded-none font-bold tracking-widest uppercase shadow-lg"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? 'PROCESSANDO...' : 'VINCULAR AGENDA FIXA'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card rounded-none shadow-none lg:col-span-2">
        <CardHeader className="border-border mx-6 border-b px-0 pb-6">
          <CardTitle className="text-foreground text-sm font-bold tracking-widest uppercase">
            Vagas Ativas na Unidade
          </CardTitle>
          <CardDescription className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            Contratos de recorrência vigentes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isPending ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-24">
              <p className="animate-pulse text-[10px] font-bold tracking-widest uppercase">
                Atualizando dados...
              </p>
            </div>
          ) : configProfId ? (
            <VagasAtivasList vagas={vagasAtivas} onRemove={handleRemoveVaga} />
          ) : (
            <div className="text-muted-foreground py-24 text-center">
              <Calendar className="mx-auto mb-6 h-16 w-16 opacity-50" />
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase">
                Selecione um profissional para carregar os dados
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-border bg-card rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold tracking-widest uppercase">
              Encerrar Vaga Fixa
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Tem certeza que deseja encerrar esta vaga fixa? Esta ação removerá
              o paciente da grade recorrente deste profissional.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none text-[10px] font-bold tracking-widest uppercase">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                confirmRemoveVaga()
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-none text-[10px] font-bold tracking-widest uppercase"
              disabled={isPending}
            >
              {isPending ? 'PROCESSANDO...' : 'ENCERRAR VAGA'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
