"use client"

import { useState } from "react"
// IMPORTAÇÃO PADRONIZADA: Usando a tabela centralizada da UI
import { DataTable } from "@/components/ui/data-table"
import { PacienteSheetMaster } from "../pacientes/paciente-sheet-master"
// ✅ ISOLAMENTO CLIENT-SIDE: O Cliente importa suas próprias colunas para garantir serialização
import { columns as standardColumns } from "./columns" 
import { judicialColumns } from "./judicial-columns"
import { type PacienteFilaTerapia } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"

// Interface 100% limpa: aceita apenas dados puros e primitivos de controle
interface FilaClientWrapperProps {
  data: PacienteFilaTerapia[]
  total: number
  variant?: "standard" | "judicial"
}

export function FilaClientWrapper({ data, total, variant = "standard" }: FilaClientWrapperProps) {
  const [selectedRow, setSelectedRow] = useState<PacienteFilaTerapia | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleRowClick = (row: PacienteFilaTerapia) => {
    setSelectedRow(row)
    setSheetOpen(true)
  }

  // Seleção dinâmica baseada no contexto (Fila de Espera vs Mandados Judiciais)
  const activeColumns = variant === "judicial" ? judicialColumns : standardColumns

  return (
    <>
      <DataTable
        // 🚨 SOLUÇÃO SÊNIOR: Double casting com 'unknown' em vez do proibido 'any'.
        // Isso resolve a incompatibilidade do TValue do TanStack de forma estritamente tipada.
        columns={activeColumns as unknown as ColumnDef<PacienteFilaTerapia, unknown>[]} 
        data={data}
        rowCount={total}
        onRowClick={handleRowClick}
        searchPlaceholder="Buscar na fila por Nome ou Prontuário..."
        searchParamName="qFila" 
        pageParamName="pageFila"
        emptyStateText="NENHUM PACIENTE AGUARDANDO NA FILA DE ACOLHIMENTO."
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
