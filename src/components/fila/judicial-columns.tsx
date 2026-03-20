"use client"

import { ColumnDef } from "@tanstack/react-table"
import { PacienteFila } from "@/types"
import { columns } from "./columns"

/**
 * Colunas específicas para a listagem de Mandados Judiciais.
 * Reutiliza as colunas de Status e Ações do arquivo base para manter consistência.
 */
export const judicialColumns: ColumnDef<PacienteFila>[] = [
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
      <span className="font-mono text-sm text-muted-foreground tabular-nums">
        {row.getValue("cns")}
      </span>
    ),
  },
  {
    accessorKey: "especialidade",
    header: "Especialidade",
  },
  {
    accessorKey: "numeroProcesso",
    header: "Nº Processo Judicial",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-primary font-bold tabular-nums">
        {row.getValue("numeroProcesso") || "NÃO INFORMADO"}
      </span>
    ),
  },
  // Reutilizamos Status (index 4) e Actions (index 5) de columns.tsx
  columns[4] as ColumnDef<PacienteFila>,
  columns[5] as ColumnDef<PacienteFila>,
]
