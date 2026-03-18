"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Phone, MessageSquare, Loader2 } from "lucide-react"
import { processarDesligamentoPorAbandono } from "@/actions"
import { format, parseISO } from "date-fns"
import type { AlertaAbsenteismo } from "@/types"

interface AbsenteismoClientProps {
  alertas: AlertaAbsenteismo[]
}

export function AbsenteismoClient({ alertas }: AbsenteismoClientProps) {
  const [isPending, startTransition] = useTransition()

  const abrirWhatsApp = (telefone: string, nome: string) => {
    const limpo = telefone.replace(/\D/g, "")
    const msg = encodeURIComponent(
      `Olá, sou da coordenação do CER 2. Notamos que ${nome} faltou às últimas 3 sessões consecutivas. Gostaria de entender o motivo e confirmar se haverá continuidade no tratamento.`
    )
    window.open(`https://wa.me/55${limpo}?text=${msg}`, "_blank")
  }

  const handleDesligamento = (id: string, nome: string) => {
    if (!confirm(`Deseja realmente processar o desligamento de ${nome}? Esta ação encerrará todas as vagas fixas.`))
      return
    startTransition(async () => {
      const res = await processarDesligamentoPorAbandono(id)
      if (res.success) {
        toast.success("Desligamento processado com sucesso.", {
          description: `${nome} foi removido(a) de todas as vagas fixas.`,
        })
      } else {
        toast.error("Erro ao processar desligamento.", { description: res.error })
      }
    })
  }

  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead>Paciente</TableHead>
          <TableHead>Especialidade / Profissional</TableHead>
          <TableHead>Datas das Faltas</TableHead>
          <TableHead>Contato</TableHead>
          <TableHead className="text-right">Ação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alertas.map((alerta, idx) => (
          <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
            <TableCell>
              <div className="flex flex-col">
                <span className="font-bold text-foreground">{alerta.paciente.nome_completo}</span>
                <span className="text-xs text-muted-foreground font-mono">CNS: {alerta.paciente.cns}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{alerta.especialidade}</span>
                <span className="text-xs text-muted-foreground italic">{alerta.profissional}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                {alerta.ultimas_faltas.map((data: string, i: number) => (
                  <Badge key={i} variant="secondary" className="font-normal tabular-nums">
                    {format(parseISO(data), "dd/MM")}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-3 h-3" />
                <span className="text-sm tabular-nums">
                  {alerta.paciente.telefone_principal || "Sem tel"}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 h-8 text-xs hover:bg-[var(--color-alert-success-bg)] hover:text-[var(--color-alert-success-text)] border-border"
                  onClick={() =>
                    abrirWhatsApp(
                      alerta.paciente.telefone_principal || "",
                      alerta.paciente.nome_completo || ""
                    )
                  }
                >
                  <MessageSquare className="w-3 h-3" /> Contatar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-2 h-8 text-xs"
                  disabled={isPending}
                  onClick={() =>
                    handleDesligamento(
                      alerta.paciente.id ?? "",
                      alerta.paciente.nome_completo ?? "Paciente"
                    )
                  }
                >
                  {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Processar Desligamento"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
