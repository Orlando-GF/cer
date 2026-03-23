"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProfissionalSelectFilterProps {
  profissionais: { id: string; nome_completo: string }[]
  defaultValue?: string
}

export function ProfissionalSelectFilter({ profissionais, defaultValue }: ProfissionalSelectFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleValueChange = (value: string | null) => {
    if (!value) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("profId", value)
    // router.push altera a URL sem recarregar a página (Soft Navigation)
    router.push(`?${params.toString()}`)
  }

  return (
    <Select defaultValue={defaultValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[200px] md:w-[280px] h-8 border-none shadow-none font-bold text-[11px] uppercase tracking-wider focus:ring-0">
        <SelectValue placeholder="SELECIONE O PROFISSIONAL" />
      </SelectTrigger>
      <SelectContent className="rounded-none border-border shadow-2xl">
        {profissionais.map((p) => (
          <SelectItem key={p.id} value={p.id} className="font-bold uppercase text-[10px]">
            {p.nome_completo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
