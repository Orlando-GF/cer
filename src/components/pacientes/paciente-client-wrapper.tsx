"use client"

import { useState } from "react"
// IMPORTAÇÃO CORRETA: Aponta para a tabela mestra da UI
import { DataTable } from "@/components/ui/data-table"
import { PacienteSheetMaster } from "./paciente-sheet-master"
// IMPORTAÇÃO MOVIDA PARA AQUI: O Cliente importa o que é do Cliente
import { columns } from "./columns" 
import { type Paciente } from "@/types"

// A interface fica totalmente limpa, sem conflitos com o TanStack Table
interface PacienteClientWrapperProps {
  data: Paciente[]
  total: number
}

export function PacienteClientWrapper({ data, total }: PacienteClientWrapperProps) {
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
        columns={columns} // Injeta diretamente aqui
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
