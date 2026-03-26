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
    <Select value={defaultValue || undefined} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[240px] md:w-[320px] h-12 rounded-none border-2 border-border bg-card shadow-sm font-bold text-xs uppercase tracking-wider focus:ring-2 focus:ring-primary focus:border-primary">
        <SelectValue placeholder="SELECIONE O PROFISSIONAL">
          {defaultValue ? profissionais.find(p => p.id === defaultValue)?.nome_completo : "SELECIONE O PROFISSIONAL"}
        </SelectValue>
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
