"use client"

import { useState, useTransition } from "react"
import { buscarAlertasAbsenteismo, processarDesligamentoPorAbandono } from "@/actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User, Phone, Calendar, AlertTriangle, MessageSquare, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useEffect } from "react"

export default function AbsenteismoPage() {
  const [alertas, setAlertas] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  async function loadData() {
    const res = await buscarAlertasAbsenteismo()
    if (res.success) setAlertas(res.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const abrirWhatsApp = (telefone: string, nome: string) => {
    const limpo = telefone.replace(/\D/g, "")
    const msg = encodeURIComponent(`Olá, sou da coordenação do CER 2. Notamos que ${nome} faltou às últimas 3 sessões consecutivas. Gostaria de entender o motivo e confirmar se haverá continuidade no tratamento.`)
    window.open(`https://wa.me/55${limpo}?text=${msg}`, "_blank")
  }

  const handleDesligamento = async (id: string, nome: string) => {
    if (!confirm(`Deseja realmente processar o desligamento de ${nome}? Esta ação encerrará todas as vagas fixas.`)) return

    startTransition(async () => {
      const res = await processarDesligamentoPorAbandono(id)
      if (res.success) {
        alert("Desligamento processado com sucesso.")
        loadData()
      } else {
        alert("Erro ao processar: " + res.error)
      }
    })
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestão de Absenteísmo</h1>
        <p className="text-muted-foreground">Pacientes com 3 ou mais faltas consecutivas (Regra de Desligamento).</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" /> Alertas de Desligamento
                </CardTitle>
                <CardDescription>Estes pacientes perderam o vínculo de 3 sessões consecutivas.</CardDescription>
              </div>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 px-3 py-1">
                {alertas ? alertas.length : 0} Pacientes Críticos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Especialidade / Profissional</TableHead>
                  <TableHead>Datas das Faltas</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-slate-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                      Carregando alertas...
                    </TableCell>
                  </TableRow>
                ) : !alertas || alertas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-slate-500">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                      Nenhum alerta de absenteísmo crítico no momento. 🙌
                    </TableCell>
                  </TableRow>
                ) : (
                  alertas.map((alerta: any, idx: number) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{alerta.paciente.nome_completo}</span>
                          <span className="text-xs text-slate-500 font-mono">CNS: {alerta.paciente.cns}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">{alerta.especialidade}</span>
                          <span className="text-xs text-slate-500 italic">{alerta.profissional}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {alerta.ultimas_faltas.map((data: string, i: number) => (
                            <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-600 font-normal tabular-nums">
                              {format(parseISO(data), 'dd/MM')}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-3 h-3" />
                          <span className="text-sm tabular-nums">{alerta.paciente.telefone_principal || "Sem tel"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="gap-2 h-8 text-xs hover:bg-emerald-50 hover:text-emerald-700 border-slate-200"
                            onClick={() => abrirWhatsApp(alerta.paciente.telefone_principal || "", alerta.paciente.nome_completo)}
                          >
                            <MessageSquare className="w-3 h-3" /> Contatar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="gap-2 h-8 text-xs bg-red-600 hover:bg-red-700"
                            disabled={isPending}
                            onClick={() => handleDesligamento(alerta.paciente.id, alerta.paciente.nome_completo)}
                          >
                            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Processar Desligamento"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-4">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-900 underline">Importante:</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            De acordo com a regra de negócio Item 8, o acúmulo de 3 faltas consecutivas sem justificativa plausível permite à coordenação o desligamento do paciente para liberação da vaga à fila de espera externa. Sempre tente contato antes de processar o desligamento definitivo.
          </p>
        </div>
      </div>
    </div>
  )
}
