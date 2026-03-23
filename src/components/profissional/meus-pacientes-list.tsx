"use client"

import { useState } from "react"
import { Paciente } from "@/types"
import { Users, Search, ChevronRight, UserCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { PacienteSheetMaster } from "@/components/pacientes/paciente-sheet-master"

interface MeusPacientesListProps {
  pacientesIniciais: Paciente[]
}

export function MeusPacientesList({ pacientesIniciais }: MeusPacientesListProps) {
  const [search, setSearch] = useState("")
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const filtrados = pacientesIniciais.filter(p => 
    p.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
    p.cns.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase">Meus Pacientes</h2>
          <p className="text-muted-foreground text-sm uppercase tracking-wider font-medium">
            Pacientes vinculados à sua agenda fixa
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="BUSCAR NOME OU CNS..." 
            className="pl-9 rounded-none border-primary/20 uppercase text-xs font-bold tracking-widest h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map((paciente) => (
          <Card 
            key={paciente.id} 
            className="rounded-none border-border hover:border-primary/50 transition-all shadow-sm cursor-pointer group"
            onClick={() => {
              setSelectedPaciente(paciente)
              setSheetOpen(true)
            }}
          >
            <CardContent className="p-4 flex items-center gap-4">
               <div className="w-12 h-12 bg-primary/10 flex items-center justify-center rounded-none border border-primary/20">
                  <UserCircle className="w-6 h-6 text-primary" />
               </div>
               <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm uppercase truncate group-hover:text-primary transition-colors">
                    {paciente.nome_completo}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mt-0.5">
                    CNS: {paciente.cns}
                  </p>
               </div>
               <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
            </CardContent>
          </Card>
        ))}
      </div>

      {filtrados.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[40vh] border border-dashed border-border bg-muted/5 text-center px-6">
          <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground/70 uppercase">Nenhum paciente encontrado</h3>
          <p className="text-muted-foreground text-sm max-w-[280px] mt-2 leading-relaxed">
            {search ? "Tente outro termo na busca." : "Você ainda não possui pacientes vinculados com vaga fixa."}
          </p>
        </div>
      )}

      {selectedPaciente && (
        <PacienteSheetMaster 
          pacienteId={selectedPaciente.id} 
          open={sheetOpen} 
          onOpenChange={setSheetOpen} 
        />
      )}
    </div>
  )
}
