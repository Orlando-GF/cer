"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
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
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

import { PacienteSheetMaster } from "./paciente-sheet-master"
import { Paciente } from "./columns"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  rowCount?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  rowCount = 0,
}: DataTableProps<TData, TValue>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [selectedPaciente, setSelectedPaciente] = React.useState<Paciente | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  // Sincronizar Termo de Busca e Página com URL
  const searchTerm = searchParams.get("q") || ""
  const currentPage = Number(searchParams.get("page")) || 1
  const pageSize = 20
  const [inputValue, setInputValue] = useState(searchTerm)

  // 1. Sincronização externa (se a URL mudar por outro motivo)
  useEffect(() => {
    setInputValue(searchTerm)
  }, [searchTerm])

  // 2. Debounce para atualizar a URL (Busca)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== searchTerm) {
        setUrlParams({ q: inputValue || null, page: "1" }) // Volta para página 1 ao buscar
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [inputValue, searchTerm])

  const setUrlParams = (paramsToUpdate: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    router.replace(`${pathname}?${params.toString()}`)
  }

  const paginationState: PaginationState = {
    pageIndex: currentPage - 1,
    pageSize: pageSize,
  }

  const table = useReactTable({
    data: data as TData[],
    columns,
    rowCount: rowCount,
    state: {
      columnFilters,
      pagination: paginationState,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // CARA DA CONFORMIDADE v7.4
    meta: {
      onOpenPacienteSheet: (paciente: Paciente) => handleRowClick(paciente),
    },
  })

  const handleRowClick = (rowData: unknown) => {
    setSelectedPaciente(rowData as Paciente)
    setSheetOpen(true)
  }

  const goToPage = (page: number) => {
    setUrlParams({ page: page.toString() })
  }

  const totalPages = Math.ceil(rowCount / pageSize)

  return (
    <div className="space-y-4">
      {/* Barra de Busca - Visual Minimalista */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-3 rounded-none border border-border">
        <div className="relative w-full sm:w-[350px] group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
          <Input
            placeholder="Buscar por Nome ou Prontuário (CNS)..."
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            className="pl-9 h-10 w-full bg-card border-border border-opacity-50 focus-visible:border-primary transition-all rounded-none"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Mostrando <span className="font-medium text-foreground">{data.length}</span> de <span className="font-medium text-foreground">{rowCount}</span> registros
        </div>
      </div>

      <div className="rounded-none border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-muted-foreground font-semibold uppercase text-[10px] tracking-widest bg-muted/30">
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
            {data.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted transition-colors border-b border-border/50"
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
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* CONTROLE DE PAGINAÇÃO SERVER-SIDE */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-2 px-2">
          <div className="flex-1 text-sm text-muted-foreground">
             Filtro ativo: <span className="italic">{searchTerm || "Todos"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-none h-8 w-8 p-0"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-center min-w-[100px] text-sm font-medium">
              Página {currentPage} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-none h-8 w-8 p-0"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
