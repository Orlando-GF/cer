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
    accessorKey: "numero_prontuario",
    header: "PRONTUÁRIO",
    cell: ({ row }) => {
      const valor = row.getValue("numero_prontuario") as string | null
      return valor ? (
        <span className="font-mono text-sm font-medium text-foreground tabular-nums">{valor}</span>
      ) : (
        <span className="text-muted-foreground/50 text-[10px] uppercase font-bold tracking-widest">NÃO GERADO</span>
      )
    },
  },
  {
    accessorKey: "nome_completo",
    header: "Nome do Paciente",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-bold text-xs uppercase text-foreground">{row.getValue("nome_completo")}</span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CNS: {row.original.cns}</span>
      </div>
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
        <Badge variant="outline" className="rounded-none border-2 border-border bg-muted/10 text-[10px] font-black tracking-widest uppercase px-2 py-0.5 tabular-nums">
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
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-none border-2 border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors focus:outline-none"
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
                navigator.clipboard.writeText(paciente.numero_prontuario || "")
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
