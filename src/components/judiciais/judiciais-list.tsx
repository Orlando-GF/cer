"use client"

import { PacienteFila } from "@/types"
import { DataTable } from "@/components/fila/data-table"
import { judicialColumns } from "@/components/fila/judicial-columns"
import { Scale, AlertCircle } from "lucide-react"

interface JudiciaisListProps {
  initialData: PacienteFila[]
}

export function JudiciaisList({ initialData }: JudiciaisListProps) {
  const data = initialData

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-destructive">
          <Scale className="w-5 h-5" />
          <h2 className="text-xl font-bold tracking-tight uppercase">Mandados Judiciais</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Listagem prioritária de pacientes com determinação judicial para atendimento imediato ou em prazo legal.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="bg-card border border-border border-dashed p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 bg-muted/30 rounded-none">
            <AlertCircle className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold uppercase tracking-wide">Nenhum mandado pendente</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              Não há registros de pacientes com prioridade &apos;Mandado Judicial&apos; na fila de espera no momento.
            </p>
          </div>
        </div>
      ) : (
        <DataTable columns={judicialColumns} data={data} />
      )}
    </div>
  )
}
