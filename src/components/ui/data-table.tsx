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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  rowCount?: number
  onRowClick?: (row: TData) => void
  // Props de Genericidade SSoT
  searchPlaceholder?: string
  searchParamName?: string
  pageParamName?: string
  emptyStateText?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  rowCount = 0,
  onRowClick,
  searchPlaceholder = "Buscar...",
  searchParamName = "q",
  pageParamName = "page",
  emptyStateText = "NENHUM REGISTRO ENCONTRADO.",
}: DataTableProps<TData, TValue>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  // Sincronizar Termo de Busca e Página com URL de forma dinâmica
  const searchTerm = searchParams.get(searchParamName) || ""
  const currentPage = Number(searchParams.get(pageParamName)) || 1
  const pageSize = 20
  const [inputValue, setInputValue] = useState(searchTerm)

  useEffect(() => {
    setInputValue(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== searchTerm) {
        setUrlParams({ [searchParamName]: inputValue || null, [pageParamName]: "1" }) 
      }
    }, 400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, searchTerm, searchParamName, pageParamName])

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
    data,
    columns,
    rowCount,
    state: {
      columnFilters,
      pagination: paginationState,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  })

  const goToPage = (page: number) => {
    setUrlParams({ [pageParamName]: page.toString() })
  }

  const totalPages = Math.ceil(rowCount / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-3 rounded-none border border-border">
        <div className="relative w-full sm:max-w-xl group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
          <Input
            placeholder={searchPlaceholder}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            className="pl-9 h-12 w-full bg-card border-2 border-border uppercase text-xs font-bold tracking-widest focus-visible:ring-primary shadow-sm rounded-none"
          />
        </div>
        <div className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">
          Mostrando <span className="font-black text-foreground">{data.length}</span> de <span className="font-black text-foreground">{rowCount}</span> registros
        </div>
      </div>

      <div className="rounded-none border-2 border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/30 border-b-2 border-border">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-12 text-[10px] font-black tracking-widest uppercase text-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {data.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`border-b border-border/50 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-muted' : ''}`}
                  onClick={() => onRowClick && onRowClick(row.original)}
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
                <TableCell colSpan={columns.length} className="h-32 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] bg-muted/5">
                  {emptyStateText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
    </div>
  )
}
