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
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedAlerta, setSelectedAlerta] = useState<{ id: string, nome: string } | null>(null)

  const handleDesligamento = () => {
    if (!selectedAlerta) return
    
    startTransition(async () => {
      const res = await processarDesligamentoPorAbandono(selectedAlerta.id)
      if (res.success) {
        toast.success("Desligamento processado com sucesso.", {
          description: `${selectedAlerta.nome} foi removido(a) de todas as vagas fixas.`,
        })
      } else {
        toast.error("Erro ao processar desligamento.", { description: res.error })
      }
      setConfirmOpen(false)
      setSelectedAlerta(null)
    })
  }

  return (
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
        {alertas.map((alerta, idx) => (
          <TableRow key={idx} className="hover:bg-muted transition-colors">
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
                  <Badge key={i} variant="secondary" className="font-normal tabular-nums rounded-none border-transparent bg-muted/50 text-foreground">
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
                  className="gap-2 h-8 text-xs hover:bg-alert-success-bg hover:text-alert-success-text border-border rounded-none"
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
                  className="gap-2 h-8 text-xs rounded-none"
                  disabled={isPending}
                  onClick={() => {
                    setSelectedAlerta({ id: alerta.paciente.id ?? "", nome: alerta.paciente.nome_completo ?? "Paciente" })
                    setConfirmOpen(true)
                  }}
                >
                  {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Processar Desligamento"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-none border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase tracking-widest text-sm font-bold">Confirmar Desligamento</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Deseja realmente processar o desligamento de <strong>{selectedAlerta?.nome}</strong>? 
              <br />Esta ação encerrará todas as vagas fixas e marcará o cadastro como Inativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none uppercase text-[10px] font-bold tracking-widest">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                handleDesligamento()
              }}
              className="rounded-none bg-destructive hover:bg-destructive/90 text-destructive-foreground uppercase text-[10px] font-bold tracking-widest"
              disabled={isPending}
            >
              {isPending ? "PROCESSANDO..." : "CONFIRMAR DESLIGAMENTO"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Table>
  )
}
