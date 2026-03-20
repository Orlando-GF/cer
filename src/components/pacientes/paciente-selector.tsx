"use client"

import * as React from "react"
import { Search, Loader2, User } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { buscarPacientes } from "@/actions"
import { type Paciente } from "@/types"

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface PacienteSelectorProps {
  onSelect: (pacienteId: string) => void
  value?: string
}

export function PacienteSelector({ onSelect, value }: PacienteSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [pacientes, setPacientes] = React.useState<Paciente[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedPaciente, setSelectedPaciente] = React.useState<Paciente | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  
  const debouncedSearchTerm = useDebounce(searchTerm, 400)

  React.useEffect(() => {
    async function load() {
      if (debouncedSearchTerm.length < 3) {
        if (!value) setPacientes([]); // Limpa se não tiver valor selecionado e pouca digitação
        return;
      }

      setLoading(true)
      const res = await buscarPacientes({ busca: debouncedSearchTerm })
      if (res.success && res.data) {
        setPacientes(res.data.data)
      }
      setLoading(false)
    }
    load()
  }, [debouncedSearchTerm, value])

  // Tratar preservação do paciente selecionado, se vier via a prop 'value'
  React.useEffect(() => {
    async function fetchInitialValue() {
      if (!value) return;
      // Para não fazer select extra, verificamos se ele já tá na lista local
      const found = pacientes.find(p => p.id === value)
      if (found) {
        setSelectedPaciente(found)
      } else {
        // Se precisarmos exibir o paciente selecionado que veio de fora (e.g. initialData)
        // teremos de buscar ele especificamente. 
        // Idealmente a responsabilidade seria do componente pai enviar o {id, nome}
      }
    }
    fetchInitialValue()
  }, [value, pacientes])

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between rounded-none border-border h-12 font-bold bg-card uppercase text-xs focus:ring-primary"
            >
              {selectedPaciente ? (
                <div className="flex items-center gap-2 truncate">
                  <User className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{selectedPaciente.nome_completo}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">PESQUISAR PACIENTE...</span>
              )}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          }
        />
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-none border-border shadow-2xl">
          <Command className="rounded-none bg-card">
            <CommandInput 
              placeholder="NOME, CPF OU CNS (MÍNIMO 3 LETRAS)..." 
              className="h-12 font-bold uppercase text-[10px]" 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="py-6 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Nenhum paciente encontrado."}
              </CommandEmpty>
              <CommandGroup>
                {pacientes.map((paciente) => (
                  <CommandItem
                    key={paciente.id}
                    value={paciente.id} // Valor único para controle interno do radix
                    onSelect={() => {
                      setSelectedPaciente(paciente)
                      onSelect(paciente.id)
                      setOpen(false)
                    }}
                    className="font-bold uppercase text-[11px] py-3 cursor-pointer aria-selected:bg-primary-50"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-foreground">{paciente.nome_completo}</span>
                      <div className="flex gap-3 text-[9px] text-muted-foreground">
                        {paciente.cpf && <span>CPF: {paciente.cpf}</span>}
                        {paciente.cns && <span>CNS: {paciente.cns}</span>}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
