import { buscarAlertasAbsenteismo } from '@/actions'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import type { AlertaAbsenteismo } from '@/types'
import { AbsenteismoClient } from '@/components/absenteismo/absenteismo-client'
import { validarAcessoRota } from '@/lib/access-control'

export default async function AbsenteismoPage() {
  await validarAcessoRota('/absenteismo')
  const res = await buscarAlertasAbsenteismo()
  const alertas: AlertaAbsenteismo[] = res.success
    ? ((res.data ?? []) as AlertaAbsenteismo[])
    : []

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          Gestão de Absenteísmo
        </h1>
        <p className="text-muted-foreground">
          Pacientes com 3 ou mais faltas consecutivas (Regra de Desligamento).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-border bg-card rounded-none border shadow-none">
          <CardHeader className="bg-muted/30 border-border border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-destructive flex items-center gap-2 text-lg font-semibold">
                  <AlertTriangle className="h-5 w-5" /> Alertas de Desligamento
                </CardTitle>
                <CardDescription>
                  Estes pacientes perderam o vínculo de 3 sessões consecutivas.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-alert-danger-bg text-alert-danger-text border-alert-danger-text/20 rounded-none px-3 py-1"
              >
                {alertas.length} Pacientes Críticos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Delegação SSoT: O componente Cliente gere o estado de lista vazia agora */}
            <AbsenteismoClient alertas={alertas} />
          </CardContent>
        </Card>
      </div>

      <div className="border-alert-warning-text/20 bg-alert-warning-bg flex gap-4 rounded-none border p-4">
        <AlertTriangle className="text-alert-warning-text h-6 w-6 shrink-0" />
        <div className="space-y-1">
          <p className="text-foreground text-sm font-semibold underline">
            Importante:
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            De acordo com a regra de negócio Item 8, o acúmulo de 3 faltas
            consecutivas sem justificativa plausível permite à coordenação o
            desligamento do paciente para liberação da vaga à fila de espera
            externa. Sempre tente contato antes de processar o desligamento
            definitivo.
          </p>
        </div>
      </div>
    </div>
  )
}
