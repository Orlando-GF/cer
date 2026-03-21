"use client"

import { useState } from "react"
import { DataTable } from "./data-table"
import { PacienteSheetMaster } from "./paciente-sheet-master"
import { Paciente } from "./columns"
import { ColumnDef } from "@tanstack/react-table"

interface PacienteClientWrapperProps {
  data: Paciente[]
  total: number
  // Correção SSoT: Substituição do 'any' proibido pelo 'unknown' seguro
  columns: ColumnDef<Paciente, unknown>[]
}

export function PacienteClientWrapper({ data, total, columns }: PacienteClientWrapperProps) {
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleRowClick = (paciente: Paciente) => {
    setSelectedPaciente(paciente)
    setSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        rowCount={total}
        onRowClick={handleRowClick}
      />

      {selectedPaciente && (
        <PacienteSheetMaster
          pacienteId={selectedPaciente.id}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </>
  )
}
