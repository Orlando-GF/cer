import { validarAcessoRota } from '@/lib/access-control'
import { buscarFaltasRecentes, buscarAlertasAbsenteismo } from '@/actions/absenteismo-actions'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { PainelAbsenteismo } from '@/components/absenteismo/painel-absenteismo'

export default async function AbsenteismoPage() {
  await validarAcessoRota('/absenteismo')

  const [resFaltas, resAlertas] = await Promise.all([
    buscarFaltasRecentes(),
    buscarAlertasAbsenteismo(),
  ])

  const faltasRecentes = resFaltas.success ? (resFaltas.data ?? []) : []
  const alertasCriticos = resAlertas.success ? (resAlertas.data ?? []) : []

  const naoJustificadas = faltasRecentes.filter(
    (f) => f.status_comparecimento === 'Falta Nao Justificada',
  )

  return (
    <div className="space-y-8 p-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="uppercase tracking-widest font-black text-2xl text-foreground">
            Controlo de Absenteísmo
          </h1>
          <p className="mt-1 uppercase tracking-wider font-bold text-[10px] text-muted-foreground">
            Monitoramento e gestão de faltas para prevenção de abandono de tratamento.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {alertasCriticos.length > 0 && (
            <Badge
              variant="outline"
              className="rounded-none border-alert-danger-text/30 bg-alert-danger-bg text-alert-danger-text text-[10px] font-bold tracking-widest px-3 py-1.5 gap-1.5"
            >
              <AlertTriangle className="h-3 w-3" />
              {alertasCriticos.length} CRÍT{alertasCriticos.length !== 1 ? 'ICOS' : 'ICO'}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="rounded-none border-border text-[10px] font-bold tracking-widest px-3 py-1.5"
          >
            {naoJustificadas.length} S/ JUST. (30D)
          </Badge>
        </div>
      </div>

      {/* PAINEL PRINCIPAL */}
      <PainelAbsenteismo
        faltasRecentes={faltasRecentes}
        alertasCriticos={alertasCriticos}
      />

      {/* AVISO REGULATÓRIO */}
      <Card className="rounded-none border-2 border-alert-warning-text bg-alert-warning-bg/20 shadow-sm">
        <CardHeader className="py-3 px-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-alert-warning-text mt-0.5" />
            <div className="space-y-1">
              <CardTitle className="text-xs font-bold tracking-widest uppercase text-alert-warning-text">
                Protocolo de Desligamento
              </CardTitle>
              <CardDescription className="uppercase text-[10px] font-bold text-foreground leading-relaxed">
                O acúmulo de 3 faltas consecutivas sem justificativa autoriza a coordenação
                a processar o desligamento para liberação da vaga à fila externa. É{' '}
                <strong>obrigatório</strong> tentar contato com o paciente antes de confirmar
                o desligamento definitivo.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
