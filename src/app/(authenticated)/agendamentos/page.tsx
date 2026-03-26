import React from 'react'
import { validarAcessoRota } from '@/lib/access-control'
import { AgendaContent } from '@/components/agenda/agenda-content'
import {
  buscarProfissionais,
  buscarEspecialidades,
} from '@/actions/index'
import {
  buscarAgendaData,
  buscarAgendaLogistica,
  buscarAgendaCoordenacao,
  buscarVagasFixas
} from '@/actions/agendamentos-actions'
import { projectAgendaSessions } from '@/lib/agenda-utils'
import { startOfDay, endOfDay, parseISO, isValid } from 'date-fns'
import type { AgendaSession, VagaFixaComJoins } from '@/types'

export default async function AgendamentosPage({
  searchParams,
}: {
  // Obrigatório no Next.js 15: searchParams é uma Promise
  searchParams: Promise<{ 
    view?: string; 
    date?: string; 
    profId?: string;
    configProfId?: string;
  }>
}): Promise<React.ReactNode> {
  const params = await searchParams
  const view = params?.view || 'recepcao'
  const dateParam = params?.date
  const profId = params?.profId

  // 1. Resolução segura da Data via URL (SSoT)
  let dataSelecionada = startOfDay(new Date())
  if (dateParam && isValid(parseISO(dateParam))) {
    dataSelecionada = startOfDay(parseISO(dateParam))
  }

  const start = dataSelecionada.toISOString()
  const end = endOfDay(dataSelecionada).toISOString()

  // 2. Busca paralela de dados base
  const [perfil, resProf, resEsp] = await Promise.all([
    validarAcessoRota('/agendamentos'),
    buscarProfissionais(),
    buscarEspecialidades(),
  ])

  const profissionais = resProf.success && resProf.data ? resProf.data : []
  const especialidades = resEsp.success && resEsp.data ? resEsp.data : []

  // 3. O SEGREDO DA PERFORMANCE: Fetch Condicional Baseado na Aba Ativa
  // Em vez do navegador sofrer, o Servidor faz a query exata e projeta as sessões.
  let sessoes: AgendaSession[] = []

  if ((view === 'recepcao' || view === 'profissional') && profId) {
    const resAgenda = await buscarAgendaData(profId, start, end)
    if (resAgenda.success && resAgenda.data) {
      sessoes = projectAgendaSessions(
        resAgenda.data.vagas,
        resAgenda.data.hist,
        dataSelecionada,
        dataSelecionada,
      )
    }
  } else if (view === 'logistica') {
    const resLog = await buscarAgendaLogistica(start, end)
    if (resLog.success && resLog.data) {
      sessoes = projectAgendaSessions(
        resLog.data.vagas,
        resLog.data.hist,
        dataSelecionada,
        dataSelecionada,
      )
    }
  } else if (view === 'coordenacao') {
    const resCoord = await buscarAgendaCoordenacao(start, end)
    if (resCoord.success && resCoord.data) {
      sessoes = projectAgendaSessions(
        resCoord.data.vagas,
        resCoord.data.hist,
        dataSelecionada,
        dataSelecionada,
      )
    }
  }

  // 4. Busca de Vagas Fixas (Configuração)
  let vagasConfiguracao: VagaFixaComJoins[] = []
  const configProfId = params?.configProfId
  if (view === 'configuracao' && configProfId) {
    const resVagas = await buscarVagasFixas(configProfId)
    if (resVagas.success && resVagas.data) {
      vagasConfiguracao = resVagas.data
    }
  }

  return (
    <div className="max-w-full space-y-8 overflow-hidden p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-foreground">
            Agenda CER II
          </h1>
          <p className="text-muted-foreground mt-1 text-[10px] font-bold uppercase tracking-wider">
            Gestão inteligente de vagas fixas e evoluções clínicas.
          </p>
        </div>
      </div>

      <AgendaContent
        perfil={perfil}
        profissionaisIniciais={profissionais}
        especialidadesIniciais={especialidades}
        sessoesIniciais={sessoes}
        vagasConfiguracao={vagasConfiguracao}
      />
    </div>
  )
}
