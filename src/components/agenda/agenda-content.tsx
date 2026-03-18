"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Users, Truck, Settings } from "lucide-react"
import { ViewRecepcao } from "@/components/agenda/view-recepcao"
import { ViewProfissional } from "@/components/agenda/view-profissional"
import { ViewLogistica } from "@/components/agenda/view-logistica"
import { ViewCoordenacao } from "@/components/agenda/view-coordenacao"
import { ViewConfiguracao } from "@/components/agenda/view-configuracao"

// 3. Tipos
import type { Profissional, Especialidade } from "@/types"

interface AgendaContentProps {
  perfil: string | null
  profissionaisIniciais: Profissional[]
  especialidadesIniciais: Especialidade[]
}

export function AgendaContent({ perfil, profissionaisIniciais, especialidadesIniciais }: AgendaContentProps): React.ReactNode {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  const activeTab = searchParams.get("view") || "recepcao"

  const handleTabChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", val)
    router.replace(`${pathname}?${params.toString()}`)
  }

  // Filtragem de abas por perfil (RBAC na UI)
  const canSeeRecepcao = ["Administracao", "Recepcao", "Enfermagem"].includes(perfil || "")
  const canSeeProfissional = ["Administracao", "Medico_Terapeuta", "Enfermagem"].includes(perfil || "")
  const canSeeLogistica = ["Administracao", "Motorista"].includes(perfil || "")
  const canSeeCoordenacao = ["Administracao", "Recepcao"].includes(perfil || "")
  const canSeeConfig = ["Administracao"].includes(perfil || "")

  return (
    <Tabs 
      value={activeTab} 
      className="space-y-6 w-full" 
      onValueChange={handleTabChange}
    >
      <TabsList variant="agenda">
        {canSeeRecepcao && (
          <TabsTrigger value="recepcao" icon={<Users />}>
            Recepção
          </TabsTrigger>
        )}
        {canSeeProfissional && (
          <TabsTrigger value="profissional" icon={<CalendarDays />}>
            Profissional
          </TabsTrigger>
        )}
        {canSeeLogistica && (
          <TabsTrigger value="logistica" icon={<Truck />}>
            Logística
          </TabsTrigger>
        )}
        {canSeeCoordenacao && (
          <TabsTrigger value="coordenacao" icon={<CalendarDays />}>
            Coordenação
          </TabsTrigger>
        )}
        {canSeeConfig && (
          <TabsTrigger value="configuracao" icon={<Settings />}>
            Configuração
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="recepcao" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        {activeTab === "recepcao" && <ViewRecepcao profissionaisIniciais={profissionaisIniciais} />}
      </TabsContent>
      
      <TabsContent value="profissional" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        {activeTab === "profissional" && <ViewProfissional profissionaisIniciais={profissionaisIniciais} />}
      </TabsContent>
      
      <TabsContent value="logistica" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        {activeTab === "logistica" && <ViewLogistica />}
      </TabsContent>
      
      <TabsContent value="coordenacao" className="mt-0 focus-visible:outline-none focus-visible:ring-0 w-full max-w-full overflow-hidden">
        {activeTab === "coordenacao" && <ViewCoordenacao profissionaisIniciais={profissionaisIniciais} />}
      </TabsContent>
      
      <TabsContent value="configuracao" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        {activeTab === "configuracao" && (
          <ViewConfiguracao 
            profissionaisIniciais={profissionaisIniciais} 
            especialidadesIniciais={especialidadesIniciais} 
          />
        )}
      </TabsContent>
    </Tabs>
  )
}
