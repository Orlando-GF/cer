"use client"

import { useState } from "react"
import { DataTable } from "./data-table"
import { PacienteSheetMaster } from "../pacientes/paciente-sheet-master"
import { PacienteFila } from "@/types"
import { ColumnDef } from "@tanstack/react-table"

interface FilaClientWrapperProps {
  data: PacienteFila[]
  total: number
  // Correção SSoT: Substituição do 'any' proibido pelo 'unknown' seguro
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
      {/* Tabela Genérica agora recebe a ação de clique do pai */}
      <DataTable
        columns={columns}
        data={data}
        rowCount={total}
        onRowClick={handleRowClick}
      />

      {/* Smart Sheet: 
        Agora passamos APENAS o ID. O próprio Sheet é responsável 
        por ir ao banco buscar a ficha completa do paciente. 
      */}
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
