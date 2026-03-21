"use client"

import * as React from "react"
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
  TableEmpty,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PacienteSheet } from "./paciente-sheet"
import { PacienteFila } from "@/types"
import { alterarStatusFila } from "@/actions"
import { useTransition, useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { toast } from "sonner"

import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  rowCount?: number
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

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [selectedPaciente, setSelectedPaciente] = useState<PacienteFila | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [, startTransition] = useTransition()

  // Filtros via URL (Conformidade v7.4)
  const statusFilter = searchParams.get("status") || "ativos"
  const onlyMandados = searchParams.get("judicial") === "true"
  const searchTerm = searchParams.get("q") || ""
  const currentPage = Number(searchParams.get("page")) || 1
  const pageSize = 20
  
  const [inputValue, setInputValue] = useState(searchTerm)

  // 1. Sincronização externa
  useEffect(() => {
    setInputValue(searchTerm)
  }, [searchTerm])

  const setUrlParams = useCallback((paramsToUpdate: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    router.replace(`${pathname}?${params.toString()}`)
  }, [searchParams, router, pathname])

  // 2. Debounce para URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== searchTerm) {
        setUrlParams({ q: inputValue || null, page: "1" })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [inputValue, searchTerm, setUrlParams])

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
      onOpenSheet: (paciente: PacienteFila) => handleRowClick(paciente),
      onAlterarStatus: (filaId: string, novoStatus: "Aguardando" | "Em Atendimento" | "Em Risco" | "Desistencia" | "Alta") => {
        startTransition(async () => {
          const res = await alterarStatusFila({ fila_id: filaId, novo_status: novoStatus })
          if (!res.success) {
            toast.error(`Erro ao alterar status: ${res.error}`)
          }
        })
      }
    },
  })

  const handleRowClick = (rowData: unknown) => {
    if (onRowClick) {
      onRowClick(rowData as TData)
    } else {
      setSelectedPaciente(rowData as PacienteFila)
      setSheetOpen(true)
    }
  }

  const goToPage = (page: number) => {
    setUrlParams({ page: page.toString() })
  }

  const totalPages = Math.ceil(rowCount / pageSize)

  return (
    <div className="space-y-4">
      
      {/* Barra de Ferramentas / Filtros */}
      <div className="flex flex-col gap-4 bg-card p-4 rounded-none border border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Tabs defaultValue="ativos" value={statusFilter} onValueChange={(val) => setUrlParams({ status: val, page: "1" })} className="w-full sm:w-auto">
            <TabsList variant="agenda">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="ativos">Pacientes Ativos</TabsTrigger>
              <TabsTrigger value="Aguardando">Na Fila</TabsTrigger>
              <TabsTrigger value="Em Risco">Em Risco</TabsTrigger>
              <TabsTrigger value="Em Atendimento">Atendendo</TabsTrigger>
              <TabsTrigger value="Alta">Altas</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Switch id="only-mandados" checked={onlyMandados} onCheckedChange={(val) => setUrlParams({ judicial: val ? "true" : "false", page: "1" })} />
            <Label htmlFor="only-mandados" className="text-sm text-muted-foreground font-medium whitespace-nowrap cursor-pointer">
              Somente Judiciais
            </Label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 min-w-[200px] group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Buscar paciente (Nome ou CNS)..."
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              className="pl-9 w-full rounded-none"
            />
          </div>
          {/* Nota: As especialidades agora devem vir de uma lista centralizada se possível, 
              mas para manter compatibilidade, o Select pode ser preenchido pela página pai 
              ou derivado de uma action. Por enquanto, mantemos a lógica simplificada. */}
        </div>
      </div>

      <div className="rounded-none border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="bg-muted/30">
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
                <TableCell colSpan={columns.length} className="p-0">
                  <TableEmpty 
                    title="Nenhum registro encontrado"
                    description="Tente ajustar seus filtros ou termos de busca para encontrar o que procura."
                  />
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
             Total: <span className="font-medium text-foreground">{rowCount}</span> registros
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

      {/* O Sheet agora é controlado pelo Wrapper se onRowClick for fornecido */}
      {!onRowClick && (
        <PacienteSheet 
          paciente={selectedPaciente} 
          open={sheetOpen} 
          onOpenChange={setSheetOpen} 
        />
      )}
    </div>
  )
}
