"use client"

import { useState } from "react"
// IMPORTAÇÃO CORRETA: Aponta para a tabela mestra da UI
import { DataTable } from "@/components/ui/data-table"
import { PacienteSheetMaster } from "./paciente-sheet-master"
import { type Paciente } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"

interface PacienteClientWrapperProps {
  data: Paciente[]
  total: number
  columns: ColumnDef<Paciente, unknown>[]
}

export function PacienteClientWrapper({ data, total, columns }: PacienteClientWrapperProps) {
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleRowClick = (row: Paciente) => {
    setSelectedPacienteId(row.id)
    setSheetOpen(true)
  }

  const handleOpenChange = (open: boolean) => {
    setSheetOpen(open)
    if (!open) {
      setTimeout(() => setSelectedPacienteId(null), 300) 
    }
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        rowCount={total}
        onRowClick={handleRowClick}
        searchPlaceholder="Buscar na base geral por Nome ou CNS..."
      />

      <PacienteSheetMaster
        pacienteId={selectedPacienteId}
        open={sheetOpen}
        onOpenChange={handleOpenChange}
      />
    </>
  )
}
