'use client'

import { MapPin, Clock, User, Tag, Bus, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { GrupoBairro, PacienteRota } from '@/actions/logistica-actions'

// ==========================================
// UTILITÁRIO DE HORA
// ==========================================

function formatarHorario(valor: string): string {
  // Horário de vaga fixa vem como "HH:MM:SS", histórico vem como ISO
  if (valor.includes('T')) {
    const d = parseISO(valor)
    return isValid(d) ? format(d, 'HH:mm', { locale: ptBR }) : valor
  }
  // "HH:MM:SS" → "HH:MM"
  return valor.slice(0, 5)
}

// ==========================================
// TAG DE ACESSIBILIDADE
// ==========================================

const TAG_CONFIG: Record<string, { label: string; color: string }> = {
  'Cadeira de Rodas': {
    label: 'CADEIRA DE RODAS',
    color: 'bg-alert-warning-bg text-alert-warning-text border-alert-warning-text/30',
  },
  'Maca': {
    label: 'MACA',
    color: 'bg-alert-danger-bg text-alert-danger-text border-alert-danger-text/30',
  },
  'Oxigênio': {
    label: 'OXIGÊNIO',
    color: 'bg-alert-danger-bg text-alert-danger-text border-alert-danger-text/30',
  },
  'Acompanhante': {
    label: 'ACOMPANHANTE',
    color: 'bg-alert-info-bg text-alert-info-text border-alert-info-text/30',
  },
}

function TagAcessibilidade({ tag }: { tag: string }) {
  const cfg = TAG_CONFIG[tag] ?? {
    label: tag.toUpperCase(),
    color: 'bg-muted text-muted-foreground border-border',
  }
  return (
    <Badge
      variant="outline"
      className={`rounded-none text-[9px] font-bold tracking-widest px-2 py-0.5 ${cfg.color}`}
    >
      {cfg.label}
    </Badge>
  )
}

// ==========================================
// CARD DE PACIENTE
// ==========================================

function CardPaciente({ paciente }: { paciente: PacienteRota }) {
  const enderecoCompleto = [
    paciente.logradouro,
    paciente.numero,
    paciente.bairro,
    paciente.cidade,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <Card className="rounded-none border-border bg-card shadow-none hover:bg-muted/20 transition-colors">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          {/* COLUNA ESQUERDA: Paciente + Endereço */}
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-base font-bold tracking-tight text-foreground leading-tight">
                {paciente.pacienteNome}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
              <span className="text-sm text-muted-foreground leading-snug">
                {enderecoCompleto || (
                  <span className="italic text-muted-foreground/60">
                    Endereço não informado
                  </span>
                )}
              </span>
            </div>

            {/* Tags de acessibilidade */}
            {paciente.tagsAcessibilidade.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pl-5">
                <Tag className="h-3 w-3 text-muted-foreground self-center" />
                {paciente.tagsAcessibilidade.map((tag) => (
                  <TagAcessibilidade key={tag} tag={tag} />
                ))}
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: Horário + Especialidade */}
          <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-lg font-bold tabular-nums text-primary tracking-tight">
                {formatarHorario(paciente.horarioInicio)}
              </span>
            </div>
            <div className="flex flex-col items-start md:items-end gap-0.5">
              <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                {paciente.especialidadeNome}
              </span>
              <span className="text-[10px] italic text-muted-foreground/70">
                {paciente.profissionalNome}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==========================================
// GRUPO DE BAIRRO
// ==========================================

function GrupoBairroSection({ grupo }: { grupo: GrupoBairro }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Linha separadora com label do bairro */}
        <div className="flex items-center gap-2 shrink-0">
          <MapPin className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-bold tracking-widest uppercase text-foreground">
            {grupo.bairro}
          </h2>
        </div>
        <div className="flex-1 border-t border-border" />
        <Badge
          variant="outline"
          className="rounded-none border-border text-[9px] font-bold tracking-widest px-2 shrink-0"
        >
          {grupo.pacientes.length} PAX
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {grupo.pacientes.map((p) => (
          <CardPaciente key={p.agendamentoId} paciente={p} />
        ))}
      </div>
    </section>
  )
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

interface PainelLogisticaProps {
  grupos: GrupoBairro[]
  dataFormatada: string
}

export function PainelLogistica({ grupos, dataFormatada }: PainelLogisticaProps) {
  const totalPacientes = grupos.reduce((acc, g) => acc + g.pacientes.length, 0)

  // Estado vazio
  if (grupos.length === 0) {
    return (
      <Card className="rounded-none border-border bg-card shadow-none">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Bus className="h-12 w-12 text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-muted-foreground">
              Nenhum paciente com transporte agendado para {dataFormatada}.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Pacientes com <strong>necessita_transporte = true</strong> aparecerão aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* RESUMO OPERACIONAL */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="rounded-none border-border bg-card shadow-none">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              Total de Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-3xl font-bold tabular-nums text-foreground">
              {totalPacientes}
            </span>
          </CardContent>
        </Card>
        <Card className="rounded-none border-border bg-card shadow-none">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              Bairros / Rotas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-3xl font-bold tabular-nums text-foreground">
              {grupos.length}
            </span>
          </CardContent>
        </Card>
        <Card className="rounded-none border-border bg-card shadow-none">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              Necessidades Especiais
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-3xl font-bold tabular-nums text-foreground">
              {grupos
                .flatMap((g) => g.pacientes)
                .filter((p) => p.tagsAcessibilidade.length > 0).length}
            </span>
          </CardContent>
        </Card>
        <Card className="rounded-none border-border bg-card shadow-none">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              Data
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-base font-bold text-foreground tabular-nums">
              {dataFormatada}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* AVISO DE ACESSIBILIDADE */}
      {grupos.flatMap((g) => g.pacientes).some((p) => p.tagsAcessibilidade.length > 0) && (
        <div className="flex items-start gap-3 border border-alert-warning-text/20 bg-alert-warning-bg px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-alert-warning-text mt-0.5" />
          <p className="text-xs text-foreground/80 leading-relaxed">
            <strong className="font-bold text-alert-warning-text">Atenção ao Motorista:</strong>{' '}
            Pacientes com tags de acessibilidade requerem equipamento específico na carrinha.
            Verifique a disponibilidade de rampa/cadeira antes de partir.
          </p>
        </div>
      )}

      {/* LISTA DE ROTAS AGRUPADAS POR BAIRRO */}
      {grupos.map((grupo) => (
        <GrupoBairroSection key={grupo.bairro} grupo={grupo} />
      ))}
    </div>
  )
}
