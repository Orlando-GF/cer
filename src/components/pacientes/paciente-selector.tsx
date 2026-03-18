"use client"

import * as React from "react"
import { Search, Loader2, User } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { buscarPacientes } from "@/actions"
import { type Paciente } from "@/types"

interface PacienteSelectorProps {
  onSelect: (pacienteId: string) => void
  value?: string
}

export function PacienteSelector({ onSelect, value }: PacienteSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [pacientes, setPacientes] = React.useState<Paciente[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedPaciente, setSelectedPaciente] = React.useState<Paciente | null>(null)

  React.useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await buscarPacientes()
      if (res.success && res.data) {
        setPacientes(res.data)
        if (value) {
          const found = res.data.find(p => p.id === value)
          if (found) setSelectedPaciente(found)
        }
      }
      setLoading(false)
    }
    load()
  }, [value])

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between rounded-none border-slate-200 h-12 font-bold bg-slate-50 uppercase text-xs focus:ring-primary"
            >
              {selectedPaciente ? (
                <div className="flex items-center gap-2 truncate">
                  <User className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{selectedPaciente.nome_completo}</span>
                </div>
              ) : (
                <span className="text-slate-400">PESQUISAR PACIENTE...</span>
              )}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          }
        />
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-none border-slate-200 shadow-2xl">
          <Command className="rounded-none">
            <CommandInput placeholder="BUSCAR POR NOME, CPF OU CNS..." className="h-12 font-bold uppercase text-[10px]" />
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="py-6 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Nenhum paciente encontrado."}
              </CommandEmpty>
              <CommandGroup>
                {pacientes.map((paciente) => (
                  <CommandItem
                    key={paciente.id}
                    value={paciente.nome_completo + " " + (paciente.cpf || "") + " " + (paciente.cns || "")}
                    onSelect={() => {
                      setSelectedPaciente(paciente)
                      onSelect(paciente.id)
                      setOpen(false)
                    }}
                    className="font-bold uppercase text-[11px] py-3 cursor-pointer"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-900">{paciente.nome_completo}</span>
                      <div className="flex gap-3 text-[9px] text-slate-400">
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
