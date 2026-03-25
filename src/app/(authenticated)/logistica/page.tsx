import { validarAcessoRota } from '@/lib/access-control'
import { buscarRotasDoDia } from '@/actions/logistica-actions'
import { Bus, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PainelLogistica } from '@/components/logistica/painel-logistica'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function LogisticaPage() {
  await validarAcessoRota('/logistica')

  // Data de hoje no fuso de Brasília
  const hoje = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Sao_Paulo',
  })
  const dataFormatada = format(
    new Date(hoje + 'T12:00:00'),
    "EEEE, dd 'de' MMMM 'de' yyyy",
    { locale: ptBR },
  )

  const res = await buscarRotasDoDia(hoje)
  const grupos = res.success ? (res.data ?? []) : []
  const totalPacientes = grupos.reduce((acc, g) => acc + g.pacientes.length, 0)

  return (
    <div className="space-y-8 p-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-muted">
            <Bus className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Gestão de Frota e Roteirização
            </h1>
            <div className="mt-1 flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <p className="text-sm capitalize">{dataFormatada}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!res.success && (
            <Badge
              variant="outline"
              className="rounded-none border-alert-danger-text/30 bg-alert-danger-bg text-alert-danger-text text-[10px] font-bold tracking-widest px-3 py-1.5"
            >
              ERRO AO CARREGAR DADOS
            </Badge>
          )}
          <Badge
            variant="outline"
            className="rounded-none border-border text-[10px] font-bold tracking-widest px-3 py-1.5"
          >
            {totalPacientes} PACIENTE{totalPacientes !== 1 ? 'S' : ''} EM ROTA
          </Badge>
          <Badge
            variant="outline"
            className="rounded-none border-border text-[10px] font-bold tracking-widest px-3 py-1.5"
          >
            {grupos.length} BAIRRO{grupos.length !== 1 ? 'S' : ''}
          </Badge>
        </div>
      </div>

      {/* PAINEL PRINCIPAL */}
      <PainelLogistica grupos={grupos} dataFormatada={dataFormatada} />
    </div>
  )
}
