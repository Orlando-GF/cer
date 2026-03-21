"use client"

import { useState } from "react"
// IMPORTAÇÃO CORRETA: Aponta para a tabela mestra da UI
import { DataTable } from "@/components/ui/data-table"
import { PacienteSheetMaster } from "../pacientes/paciente-sheet-master"
// IMPORTAÇÃO MOVIDA: O Wrapper agora é auto-suficiente
import { columns } from "./columns"
import { PacienteFila } from "@/types"

interface FilaClientWrapperProps {
  data: PacienteFila[]
  total: number
}

export function FilaClientWrapper({ data, total }: FilaClientWrapperProps) {
  const [selectedRow, setSelectedRow] = useState<PacienteFila | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleRowClick = (row: PacienteFila) => {
    setSelectedRow(row)
    setSheetOpen(true)
  }

  return (
    <>
      <DataTable
        columns={columns} // Injeta diretamente aqui
        data={data}
        rowCount={total}
        onRowClick={handleRowClick}
        searchPlaceholder="Buscar na fila por Nome ou Prontuário..."
        searchParamName="q"
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
