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
  TableEmpty,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PacienteSheet, PacienteFila } from "./paciente-sheet"
import { alterarStatusFila } from "@/actions"
import { useTransition, useMemo, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

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

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [selectedPaciente, setSelectedPaciente] = useState<PacienteFila | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [, startTransition] = useTransition()

  // Filtros via URL
  const statusFilter = searchParams.get("status") || "ativos"
  const especialidadeFilter = searchParams.get("esp") || "todas"
  const onlyMandados = searchParams.get("judicial") === "true"
  const searchTerm = searchParams.get("q") || ""

  const setUrlParams = (paramsToUpdate: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    router.replace(`${pathname}?${params.toString()}`)
  }

  // Obter lista única de especialidades para o filtro
  const especialidadesUnicas = useMemo(() => {
    const list = Array.from(new Set(data.map((d: any) => d.especialidade as string)))
    return list.sort()
  }, [data])

  // Aplica os filtros customizados nas linhas
  const filteredRows = useMemo(() => {
    let rows = data as PacienteFila[]

    // Filtro de Texto (Nome ou CNS)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      rows = rows.filter(row => 
        row.nome.toLowerCase().includes(lowerSearch) || 
        row.cns.toLowerCase().includes(lowerSearch)
      )
    }

    if (statusFilter !== "todos") {
      if (statusFilter === "ativos") {
        rows = rows.filter(val => val.status === "Aguardando" || val.status === "Em Atendimento" || val.status === "Em Risco")
      } else {
        rows = rows.filter(val => val.status === statusFilter)
      }
    }

    if (especialidadeFilter !== "todas") {
      rows = rows.filter(row => row.especialidade === especialidadeFilter)
    }

    if (onlyMandados) {
      rows = rows.filter(row => row.prioridade === "Mandado Judicial")
    }

    return rows
  }, [data, statusFilter, especialidadeFilter, onlyMandados, searchTerm])

  const handleRowClick = (rowData: unknown) => {
    setSelectedPaciente(rowData as PacienteFila)
    setSheetOpen(true)
  }

  const table = useReactTable({
    data: filteredRows as any,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
    meta: {
      onOpenSheet: (paciente: PacienteFila) => handleRowClick(paciente),
      onAlterarStatus: (filaId: string, novoStatus: "Aguardando" | "Em Atendimento" | "Em Risco" | "Desistencia" | "Alta") => {
        startTransition(async () => {
          const res = await alterarStatusFila({ fila_id: filaId, novo_status: novoStatus })
          if (!res.success) {
            alert(`Erro: ${res.error}`)
          }
        })
      }
    },
  })

  return (
    <div className="space-y-4">
      
      {/* Barra de Ferramentas / Filtros */}
      <div className="flex flex-col gap-4 bg-card p-4 rounded-none border border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Tabs defaultValue="ativos" value={statusFilter} onValueChange={(val) => setUrlParams({ status: val })} className="w-full sm:w-auto">
            <TabsList variant="segmented">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="ativos">Pacientes Ativos</TabsTrigger>
              <TabsTrigger value="Aguardando">Na Fila</TabsTrigger>
              <TabsTrigger value="Em Risco">Em Risco</TabsTrigger>
              <TabsTrigger value="Em Atendimento">Atendendo</TabsTrigger>
              <TabsTrigger value="Alta">Altas</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Switch id="only-mandados" checked={onlyMandados} onCheckedChange={(val) => setUrlParams({ judicial: val ? "true" : "false" })} />
            <Label htmlFor="only-mandados" className="text-sm text-muted-foreground font-medium whitespace-nowrap cursor-pointer">
              Somente Judiciais
            </Label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Buscar paciente (Nome ou CNS)..."
            value={searchTerm}
            onChange={(event) => setUrlParams({ q: event.target.value })}
            className="flex-1 min-w-[200px]"
          />
          <Select value={especialidadeFilter} onValueChange={(val) => setUrlParams({ esp: val })}>
            <SelectTrigger className="w-full sm:w-[250px] bg-white">
              <SelectValue placeholder="Todas Especialidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas Especialidades</SelectItem>
              {especialidadesUnicas.map(esp => (
                <SelectItem key={esp} value={esp}>{esp}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-none border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="bg-white border-[0.5px] border-[#C8D9EE] text-[#0F2D52] rounded-none px-[14px] py-[6px] h-auto hover:bg-[#E8F1FB] hover:text-[#0F2D52] disabled:text-[#C8D9EE] disabled:opacity-100 disabled:bg-white"
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="bg-white border-[0.5px] border-[#C8D9EE] text-[#0F2D52] rounded-none px-[14px] py-[6px] h-auto hover:bg-[#E8F1FB] hover:text-[#0F2D52] disabled:text-[#C8D9EE] disabled:opacity-100 disabled:bg-white"
        >
          Próxima
        </Button>
      </div>

      <PacienteSheet 
        paciente={selectedPaciente} 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
      />
    </div>
  )
}
