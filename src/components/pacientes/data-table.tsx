"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

// Importaremos a folha de mestre que será construída no próximo passo.
import { PacienteSheetMaster } from "./paciente-sheet-master"
import { Paciente } from "./columns"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [selectedPaciente, setSelectedPaciente] = React.useState<Paciente | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  // Sincronizar Termo de Busca com URL
  const searchTerm = searchParams.get("q") || ""

  const setUrlParams = (paramsToUpdate: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    router.replace(`${pathname}?${params.toString()}`)
  }

  // Filtro de Dados manual (como no outro DataTable) para ser reativo à URL
  const filteredRows = React.useMemo(() => {
    if (!searchTerm) return data as Paciente[]
    const lowerSearch = searchTerm.toLowerCase()
    return (data as Paciente[]).filter(row => 
      row.nome_completo.toLowerCase().includes(lowerSearch) || 
      row.cns.toLowerCase().includes(lowerSearch)
    )
  }, [data, searchTerm])

  const table = useReactTable({
    data: filteredRows as TData[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
    meta: {
      onOpenPacienteSheet: (paciente: Paciente) => handleRowClick(paciente),
    },
  })

  const handleRowClick = (rowData: unknown) => {
    setSelectedPaciente(rowData as Paciente)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Barra de Busca - Visual Minimalista */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-3 rounded-none border border-border">
        <div className="relative w-full sm:w-[350px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por Nome ou Prontuário (CNS)..."
            value={searchTerm}
            onChange={(event) => setUrlParams({ q: event.target.value })}
            className="pl-9 h-10 w-full bg-card border-transparent focus-visible:bg-card transition-colors"
          />
        </div>
      </div>

      <div className="rounded-none border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-muted-foreground font-semibold uppercase text-[10px] tracking-widest">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  Nenhum registro encontrado. Comece cadastrando um novo paciente.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-end space-x-2 py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground mx-2">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próxima
          </Button>
        </div>
      )}

      {selectedPaciente && (
         <PacienteSheetMaster 
            paciente={selectedPaciente} 
            open={sheetOpen} 
            onOpenChange={setSheetOpen} 
         />
      )}
    </div>
  )
}
