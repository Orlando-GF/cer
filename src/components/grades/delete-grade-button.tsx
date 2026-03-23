"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { toggleAtivaGradeHoraria } from "@/actions"
import { toast } from "sonner"

interface DeleteGradeButtonProps {
  id: string
}

export function DeleteGradeButton({ id }: DeleteGradeButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      // Passamos false para inativar (excluir logicamente) a grade
      const res = await toggleAtivaGradeHoraria(id, false)
      if (res.success) {
        toast.success("Horário removido com sucesso!")
      } else {
        toast.error(res.error || "Erro ao remover horário.")
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className="h-8 w-8 p-0 rounded-none text-muted-foreground hover:text-alert-danger-text hover:bg-alert-danger-bg/10"
      title="Remover horário"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-alert-danger-text" />
      ) : (
        <Plus className="h-3.5 w-3.5 rotate-45" />
      )}
    </Button>
  )
}
