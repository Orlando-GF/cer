"use client"

import { type Paciente } from "@/types"

import { RowData, ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Copy, Eye } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    onOpenPacienteSheet?: (paciente: Paciente) => void
  }
}

function calcularIdade(dataNascimento: string) {
  if (!dataNascimento) return "-"
  const nasci = new Date(dataNascimento.split('T')[0].replace(/-/g, '/'))
  const hoje = new Date()
  let idade = hoje.getFullYear() - nasci.getFullYear()
  const m = hoje.getMonth() - nasci.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasci.getDate())) {
    idade--
  }
  return idade
}

export const columns: ColumnDef<Paciente>[] = [
  {
    accessorKey: "cns",
    header: "Prontuário (CNS)",
    cell: ({ row }) => (
      <span className="font-mono text-sm font-medium text-foreground tabular-nums">{row.getValue("cns")}</span>
    ),
  },
  {
    accessorKey: "nome_completo",
    header: "Nome do Paciente",
    cell: ({ row }) => (
      <div className="font-medium text-foreground">{row.getValue("nome_completo")}</div>
    ),
  },
  {
    accessorKey: "cpf",
    header: "CPF",
    cell: ({ row }) => {
      const cpf = row.getValue("cpf") as string | null
      return <span className="text-muted-foreground text-sm tabular-nums">{cpf ? cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "Não informado"}</span>
    },
  },
  {
    accessorKey: "data_nascimento",
    header: "Idade",
    cell: ({ row }) => {
      const dataStr = row.getValue("data_nascimento") as string
      return (
        <Badge variant="outline" className="font-normal bg-muted/40 border-border tabular-nums">
          {calcularIdade(dataStr)} anos
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
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-none border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none"
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
              Copiar Prontuário
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                table.options.meta?.onOpenPacienteSheet?.(paciente)
              }}
            >
              <Eye className="h-4 w-4" />
              Ver Ficha Completa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
