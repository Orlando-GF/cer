import { buscarAlertasAbsenteismo } from "@/actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import type { AlertaAbsenteismo } from "@/types"
import { AbsenteismoClient } from "./absenteismo-client"
import { validarAcessoRota } from "@/lib/access-control"

export default async function AbsenteismoPage() {
  await validarAcessoRota("/absenteismo")
  const res = await buscarAlertasAbsenteismo()
  const alertas: AlertaAbsenteismo[] = res.success ? (res.data ?? []) as AlertaAbsenteismo[] : []

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestão de Absenteísmo</h1>
        <p className="text-muted-foreground">Pacientes com 3 ou mais faltas consecutivas (Regra de Desligamento).</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border border-border shadow-none rounded-none bg-card">
          <CardHeader className="bg-muted/30 border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" /> Alertas de Desligamento
                </CardTitle>
                <CardDescription>Estes pacientes perderam o vínculo de 3 sessões consecutivas.</CardDescription>
              </div>
              <Badge variant="outline" className="bg-alert-danger-bg text-alert-danger-text border-alert-danger-text/20 px-3 py-1 rounded-none">
                {alertas.length} Pacientes Críticos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {alertas.length === 0 ? (
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
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-alert-success-text" />
                      Nenhum alerta de absenteísmo crítico no momento. 🙌
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <AbsenteismoClient alertas={alertas} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="border border-alert-warning-text/20 bg-alert-warning-bg p-4 flex gap-4 rounded-none">
        <AlertTriangle className="w-6 h-6 text-alert-warning-text shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground underline">Importante:</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            De acordo com a regra de negócio Item 8, o acúmulo de 3 faltas consecutivas sem justificativa plausível
            permite à coordenação o desligamento do paciente para liberação da vaga à fila de espera externa.
            Sempre tente contato antes de processar o desligamento definitivo.
          </p>
        </div>
      </div>
    </div>
  )
}
