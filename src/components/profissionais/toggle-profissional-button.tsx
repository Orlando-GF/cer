"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Power, PowerOff, Loader2 } from "lucide-react"
import { toggleAtivoProfissional } from "@/actions"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ToggleProfissionalButtonProps {
  id: string
  nome: string
  ativo: boolean
}

export function ToggleProfissionalButton({ id, nome, ativo }: ToggleProfissionalButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await toggleAtivoProfissional(id, !ativo)
      if (res.success) {
        toast.success(`Profissional ${ativo ? "desativado" : "ativado"} com sucesso.`)
        setOpen(false)
      } else {
        toast.error(res.error || "Erro ao alterar status do profissional.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 rounded-none ${
            ativo
              ? "text-muted-foreground hover:text-alert-danger-text hover:bg-alert-danger-bg/10"
              : "text-muted-foreground hover:text-alert-success-text hover:bg-alert-success-bg/20"
          }`}
          title={ativo ? "Desativar profissional" : "Ativar profissional"}
        >
          {ativo ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
        </Button>
      } />
      <AlertDialogContent className="rounded-none border-border shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {ativo ? "Desativar Profissional?" : "Ativar Profissional?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {ativo
              ? `Isso impedirá novos agendamentos para ${nome}. Agendamentos existentes não serão afetados.`
              : `Isso permitirá que ${nome} volte a receber novos agendamentos na agenda.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="rounded-none border-border font-bold uppercase tracking-widest text-[10px]">CANCELAR</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleToggle}
            disabled={isPending}
            className={`rounded-none font-bold uppercase tracking-widest text-[10px] ${
              ativo ? "bg-alert-danger-text text-white hover:bg-alert-danger-text/90" : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (ativo ? "DESATIVAR" : "ATIVAR")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
