"use client"

import { useState } from "react"
// IMPORTAÇÃO CORRETA: Aponta para a tabela mestra da UI
import { DataTable } from "@/components/ui/data-table"
import { PacienteSheetMaster } from "../pacientes/paciente-sheet-master"
import { PacienteFila } from "@/types"
import { ColumnDef } from "@tanstack/react-table"

interface FilaClientWrapperProps {
  data: PacienteFila[]
  total: number
  columns: ColumnDef<PacienteFila, unknown>[]
}

export function FilaClientWrapper({ data, total, columns }: FilaClientWrapperProps) {
  const [selectedRow, setSelectedRow] = useState<PacienteFila | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleRowClick = (row: PacienteFila) => {
    setSelectedRow(row)
    setSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        rowCount={total}
        onRowClick={handleRowClick}
        searchPlaceholder="Buscar na fila por Nome ou Prontuário..."
        searchParamName="q" // Exemplo: Se houvesse 2 tabelas, poderíamos usar "qFila"
        pageParamName="page"
      />

      {selectedRow && (
        <PacienteSheetMaster
          pacienteId={selectedRow.paciente_id}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </>
  )
}
