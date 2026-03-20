"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toggleAtivaEspecialidade } from "@/actions"
import { Button } from "@/components/ui/button"
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
import { Power, PowerOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ToggleEspecialidadeButtonProps {
  id: string
  nome: string
  ativo: boolean
}

export function ToggleEspecialidadeButton({ id, nome, ativo }: ToggleEspecialidadeButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleAtivaEspecialidade(id, !ativo)
      if (res.success) {
        toast.success(`Especialidade ${!ativo ? "ativada" : "desativada"} com sucesso!`)
        router.refresh()
      } else {
        toast.error(res.error || "Erro ao alterar status da especialidade")
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={
        <Button 
          variant="ghost" 
          size="sm" 
          disabled={isPending}
          className={`h-8 w-8 p-0 rounded-none ${
            ativo 
              ? "text-muted-foreground hover:text-alert-danger-text hover:bg-alert-danger-bg/10" 
              : "text-muted-foreground hover:text-alert-success-text hover:bg-alert-success-bg/20"
          }`}
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
             ativo ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />
          )}
        </Button>
      } />
      <AlertDialogContent className="rounded-none border-border shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {ativo ? "Desativar Especialidade?" : "Ativar Especialidade?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {ativo 
              ? `Isso impedirá novos encaminhamentos para ${nome}.` 
              : `Isso permitirá que pacientes voltem a ser encaminhados para ${nome}.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-none border-border font-bold uppercase tracking-widest text-[10px]">CANCELAR</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleToggle}
            className={`rounded-none font-bold uppercase tracking-widest text-[10px] ${
              ativo ? "bg-alert-danger-text text-white hover:bg-alert-danger-text/90" : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {ativo ? "DESATIVAR" : "ATIVAR"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
