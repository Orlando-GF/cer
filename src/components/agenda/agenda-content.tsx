'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, Users, Truck, Settings } from 'lucide-react'
import { ViewRecepcao } from '@/components/agenda/view-recepcao'
import { ViewProfissional } from '@/components/agenda/view-profissional'
import { ViewLogistica } from '@/components/agenda/view-logistica'
import { ViewCoordenacao } from '@/components/agenda/view-coordenacao'
import { ViewConfiguracao } from '@/components/agenda/view-configuracao'

// 3. Tipos
import type { Profissional, Especialidade, AgendaSession, VagaFixaComJoins } from '@/types'

interface AgendaContentProps {
  perfil: string | null
  profissionaisIniciais: Profissional[]
  especialidadesIniciais: Especialidade[]
  // 🚨 NOVA PROP: Agora recebemos objetos Date nativos
  sessoesIniciais: AgendaSession[]
  vagasConfiguracao: VagaFixaComJoins[]
}

export function AgendaContent({
  perfil,
  profissionaisIniciais,
  especialidadesIniciais,
  sessoesIniciais,
  vagasConfiguracao,
}: AgendaContentProps): React.ReactNode {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const activeTab = searchParams.get('view') || 'recepcao'

  const handleTabChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', val)
    router.replace(`${pathname}?${params.toString()}`)
  }

  // Filtragem de abas por perfil (RBAC na UI)
  const canSeeRecepcao = ['Administracao', 'Recepcao', 'Enfermagem'].includes(
    perfil || '',
  )
  const canSeeProfissional = [
    'Administracao',
    'Medico_Terapeuta',
    'Enfermagem',
  ].includes(perfil || '')
  const canSeeLogistica = ['Administracao', 'Motorista'].includes(perfil || '')
  const canSeeCoordenacao = ['Administracao', 'Recepcao'].includes(perfil || '')
  const canSeeConfig = ['Administracao'].includes(perfil || '')

  return (
    <Tabs
      value={activeTab}
      className="w-full space-y-6"
      onValueChange={handleTabChange}
    >
      <TabsList variant="agenda">
        {canSeeRecepcao && (
          <TabsTrigger value="recepcao" icon={<Users />} className="uppercase font-bold tracking-widest text-[10px]">
            Recepção
          </TabsTrigger>
        )}
        {canSeeProfissional && (
          <TabsTrigger value="profissional" icon={<CalendarDays />} className="uppercase font-bold tracking-widest text-[10px]">
            Profissional
          </TabsTrigger>
        )}
        {canSeeLogistica && (
          <TabsTrigger value="logistica" icon={<Truck />} className="uppercase font-bold tracking-widest text-[10px]">
            Logística
          </TabsTrigger>
        )}
        {canSeeCoordenacao && (
          <TabsTrigger value="coordenacao" icon={<CalendarDays />} className="uppercase font-bold tracking-widest text-[10px]">
            Coordenação
          </TabsTrigger>
        )}
        {canSeeConfig && (
          <TabsTrigger value="configuracao" icon={<Settings />} className="uppercase font-bold tracking-widest text-[10px]">
            Configuração
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent
        value="recepcao"
        className="mt-0 focus-visible:ring-0 focus-visible:outline-none"
      >
        {activeTab === 'recepcao' && (
          <ViewRecepcao
            profissionaisIniciais={profissionaisIniciais}
            sessoes={sessoesIniciais} // <-- Dados injetados!
          />
        )}
      </TabsContent>

      <TabsContent
        value="profissional"
        className="mt-0 focus-visible:ring-0 focus-visible:outline-none"
      >
        {activeTab === 'profissional' && (
          <ViewProfissional
            profissionaisIniciais={profissionaisIniciais}
            sessoes={sessoesIniciais} // <-- Dados injetados!
          />
        )}
      </TabsContent>

      {/* ATENÇÃO: Se a ViewLogistica e ViewCoordenacao ainda usarem useEffect, 
          você deve refatorá-las exatamente como fizemos na ViewRecepcao */}
      <TabsContent
        value="logistica"
        className="mt-0 focus-visible:ring-0 focus-visible:outline-none"
      >
        {activeTab === 'logistica' && (
          <ViewLogistica sessoes={sessoesIniciais} />
        )}
      </TabsContent>

      <TabsContent
        value="coordenacao"
        className="mt-0 w-full max-w-full overflow-hidden focus-visible:ring-0 focus-visible:outline-none"
      >
        {activeTab === 'coordenacao' && (
          <ViewCoordenacao
            sessoes={sessoesIniciais}
            profissionaisIniciais={profissionaisIniciais}
          />
        )}
      </TabsContent>

      <TabsContent
        value="configuracao"
        className="mt-0 focus-visible:ring-0 focus-visible:outline-none"
      >
        {activeTab === 'configuracao' && (
          <ViewConfiguracao
            profissionaisIniciais={profissionaisIniciais}
            especialidadesIniciais={especialidadesIniciais}
            vagasAtivas={vagasConfiguracao} // <-- Injected!
          />
        )}
      </TabsContent>
    </Tabs>
  )
}
