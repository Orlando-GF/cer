"use client"

import { RowData, ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    onOpenSheet?: (paciente: PacienteFila) => void
    onAlterarStatus?: (filaId: string, novoStatus: "Aguardando" | "Em Atendimento" | "Em Risco" | "Desistencia" | "Alta") => void
  }
}
import { PacienteFila } from "./paciente-sheet"
import { MoreHorizontal, Copy, Eye, CalendarPlus, CheckCircle2, XOctagon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const columns: ColumnDef<PacienteFila>[] = [
  {
    accessorKey: "nome",
    header: "Paciente",
    cell: ({ row }) => (
      <div className="font-medium text-foreground">{row.getValue("nome")}</div>
    ),
  },
  {
    accessorKey: "cns",
    header: "CNS",
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground tabular-nums">{row.getValue("cns")}</span>
    ),
  },
  {
    accessorKey: "especialidade",
    header: "Especialidade",
  },
  {
    accessorKey: "prioridade",
    header: "Prioridade",
    cell: ({ row }) => {
      const v = row.getValue("prioridade") as string
      if (v === "Mandado Judicial")
        return <Badge className="bg-red-100 text-red-800 border-none whitespace-nowrap">Mandado Judicial</Badge>
      if (v === "Urgencia Clinica")
        return <Badge className="bg-orange-100 text-orange-800 border-none whitespace-nowrap">Urgência Clínica</Badge>
      return <Badge variant="secondary">Rotina</Badge>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const v = row.getValue("status") as string
      const map: Record<string, string> = {
        "Aguardando": "bg-blue-50 text-blue-600 border-blue-100",
        "Em Atendimento": "bg-emerald-100 text-emerald-800 border-none",
        "Desistencia": "bg-slate-100 text-slate-500 border-none",
        "Alta": "bg-purple-100 text-purple-700 border-none",
      }
      return (
        <Badge variant="outline" className={`font-normal ${map[v] ?? ""}`}>
          {v === "Desistencia" ? "Desistência" : v}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const paciente = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-8 w-8 items-center justify-center rounded-none border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none"
            title="Opções do paciente"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">Opções</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                navigator.clipboard.writeText(paciente.cns)
              }}
            >
              <Copy className="h-4 w-4" />
              Copiar CNS
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                table.options.meta?.onOpenSheet?.(paciente)
              }}
            >
              <Eye className="h-4 w-4" />
              Ver prontuário
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                // Futura implementação de agendamento que muda status para Em Atendimento
                alert("Em breve: Abre modal de agendamento e move para Em Atendimento.")
              }}
            >
              <CalendarPlus className="h-4 w-4" />
              Agendar
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
              onClick={(e) => {
                e.stopPropagation()
                if(confirm("Deseja dar ALTA para este paciente? Ele sairá da fila ativa.")) {
                  table.options.meta?.onAlterarStatus?.(paciente.id, "Alta")
                }
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Concluir alta
            </DropdownMenuItem>

            <DropdownMenuItem
              className="gap-2 cursor-pointer text-slate-500 focus:text-slate-700 focus:bg-slate-50"
              onClick={(e) => {
                e.stopPropagation()
                if(confirm("Registrar DESISTÊNCIA? O paciente sairá da fila ativa.")) {
                  table.options.meta?.onAlterarStatus?.(paciente.id, "Desistencia")
                }
              }}
            >
              <XOctagon className="h-4 w-4" />
              Registrar desistência
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
