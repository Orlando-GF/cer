'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

// 🚨 REMOVIDOS: PacienteSheetMaster e Paciente. A tabela agora é 100% genérica.

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  rowCount?: number
  // Nova propriedade: O pai decide o que acontece ao clicar na linha
  onRowClick?: (row: TData) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  rowCount = 0,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )

  // Sincronizar Termo de Busca e Página com URL
  const searchTerm = searchParams.get('q') || ''
  const currentPage = Number(searchParams.get('page')) || 1
  const pageSize = 20
  const [inputValue, setInputValue] = useState(searchTerm)

  useEffect(() => {
    setInputValue(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== searchTerm) {
        setUrlParams({ q: inputValue || null, page: '1' })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [inputValue, searchTerm])

  const setUrlParams = (
    paramsToUpdate: Record<string, string | null | undefined>,
  ) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    // Para navegação com input text, replace é bom.
    // Para paginação rigorosa, push manteria o histórico, mas o replace atende ao MVP.
    router.replace(`${pathname}?${params.toString()}`)
  }

  const paginationState: PaginationState = {
    pageIndex: currentPage - 1,
    pageSize: pageSize,
  }

  const handleRowClick = (rowData: unknown) => {
    if (onRowClick) {
      onRowClick(rowData as TData)
    }
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
    meta: {
      onOpenPacienteSheet: (paciente: unknown) => handleRowClick(paciente),
    },
  })

  const goToPage = (page: number) => {
    setUrlParams({ page: page.toString() })
  }

  const totalPages = Math.ceil(rowCount / pageSize)

  return (
    <div className="space-y-4">
      {/* Barra de Busca Minimalista */}
      <div className="bg-card border-border flex flex-col items-center justify-between gap-4 rounded-none border p-3 sm:flex-row">
        <div className="group relative w-full sm:w-[350px]">
          <Search className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors duration-200" />
          <Input
            placeholder="Buscar por Nome ou Prontuário (CNS)..."
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            className="bg-card border-border border-opacity-50 focus-visible:border-primary h-10 w-full rounded-none pl-9 transition-all"
          />
        </div>
        <div className="text-muted-foreground text-xs">
          Mostrando{' '}
          <span className="text-foreground font-medium">{data.length}</span> de{' '}
          <span className="text-foreground font-medium">{rowCount}</span>{' '}
          registros
        </div>
      </div>

      <div className="border-border bg-card overflow-hidden rounded-none border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-muted-foreground bg-muted/30 text-[10px] font-semibold tracking-widest uppercase"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
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
                  data-state={row.getIsSelected() && 'selected'}
                  className={`border-border/50 border-b transition-colors ${onRowClick ? 'hover:bg-muted cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-32 text-center"
                >
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* CONTROLE DE PAGINAÇÃO SERVER-SIDE */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-2">
          <div className="text-muted-foreground flex-1 text-sm">
            Filtro ativo:{' '}
            <span className="italic">{searchTerm || 'Todos'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-none p-0"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex min-w-[100px] items-center justify-center text-sm font-medium">
              Página {currentPage} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-none p-0"
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
