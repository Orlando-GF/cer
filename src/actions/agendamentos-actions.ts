'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  agendamentoHistoricoSchema,
  vagaFixaSchema,
} from '@/lib/validations/schema'
import {
  type ActionResponse,
  type VagaFixaComJoins,
  type AgendamentoHistoricoComJoins,
  type AgendaSession,
  type Paciente,
} from '@/types'

import { projectAgendaSessions } from '@/lib/agenda-utils'
import { parseISO, startOfDay, endOfDay } from 'date-fns'

// ==========================================
// UTILITÁRIOS INTERNOS DO MÓDULO
// ==========================================

function extrairJoin<T>(relacionamento: unknown): T | null {
  if (!relacionamento) return null
  if (Array.isArray(relacionamento)) return (relacionamento[0] as T) || null
  return relacionamento as T
}

function mapearAgendaComJoins<T>(dados: Record<string, unknown>[]): T[] {
  return dados.map((item) => {
    const {
      pacientes,
      profissionais,
      linhas_cuidado_especialidades,
      ...resto
    } = item
    return {
      ...resto,
      paciente: extrairJoin(pacientes),
      profissional: extrairJoin(profissionais),
      especialidade: extrairJoin(linhas_cuidado_especialidades),
    } as unknown as T
  })
}

function validarLimiteDias(
  startDate: string,
  endDate: string,
  limiteMaximoDias = 35,
) {
  const inicio = new Date(startDate).getTime()
  const fim = new Date(endDate).getTime()
  const diffDias = Math.ceil((fim - inicio) / (1000 * 3600 * 24))
  if (diffDias > limiteMaximoDias) {
    throw new Error(
      `Intervalo de datas demasiado longo (${diffDias} dias). O limite máximo é de ${limiteMaximoDias} dias.`,
    )
  }
}

async function registrarLogAuditoria(params: {
  agendamento_id: string
  acao: string
  dados_anteriores: unknown
  dados_novos: unknown
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // logs_auditoria não está nos tipos gerados — cast necessário
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('logs_auditoria') as any).insert({
      tabela_afetada: 'agendamentos_historico',
      registro_id: params.agendamento_id,
      acao: params.acao === 'CRIAR' ? 'INSERT' : 'UPDATE',
      dados_antigos: params.dados_anteriores,
      dados_novos: params.dados_novos,
      autor_id: user?.id ?? null,
    })
  } catch (e) {
    console.error('[Auditoria] Falha ao registar log:', e)
  }
}


// ==========================================
// SELECTS REUTILIZÁVEIS (DRY)
// ==========================================

const SELECT_VAGA_FIXA_JOINS = `
  *,
  pacientes (id, nome_completo, data_nascimento, cns, criado_em, data_ultimo_laudo, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte),
  profissionais (id, nome_completo),
  linhas_cuidado_especialidades (id, nome_especialidade)
`

const SELECT_HISTORICO_JOINS = `
  *,
  pacientes (id, nome_completo, data_nascimento, cns, criado_em, data_ultimo_laudo, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte),
  profissionais (id, nome_completo),
  linhas_cuidado_especialidades (id, nome_especialidade)
`

// ==========================================
// VAGAS FIXAS
// ==========================================

export async function salvarVagaFixa(
  rawData: unknown,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const val = vagaFixaSchema.safeParse(rawData)
  if (!val.success)
    return { success: false, error: 'Dados inválidos para Vaga Fixa.' }

  const { error } = await supabase.from('vagas_fixas').upsert(val.data)
  if (error)
    return { success: false, error: `Erro ao salvar vaga: ${error.message}` }

  revalidatePath('/agendamentos')
  return { success: true }
}

export async function buscarVagasFixas(
  profissionalId: string,
): Promise<ActionResponse<VagaFixaComJoins[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vagas_fixas')
    .select(SELECT_VAGA_FIXA_JOINS)
    .eq('profissional_id', profissionalId)
    .eq('status_vaga', 'Ativa')

  if (error) return { success: false, error: error.message }
  return {
    success: true,
    data: mapearAgendaComJoins<VagaFixaComJoins>(data || []),
  }
}

export async function encerrarVagaFixa(
  vagaId: string,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('vagas_fixas')
    .update({
      status_vaga: 'Encerrada',
      data_fim_contrato: new Date().toISOString(),
    })
    .eq('id', vagaId)
  if (error)
    return { success: false, error: `Erro ao encerrar vaga: ${error.message}` }
  revalidatePath('/agendamentos')
  revalidatePath('/configuracoes')
  return { success: true }
}

// ==========================================
// SESSÕES E HISTÓRICO
// ==========================================

export async function registrarSessaoHistorico(
  rawData: unknown,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const val = agendamentoHistoricoSchema.safeParse(rawData)
  if (!val.success)
    return {
      success: false,
      error: `Dados inválidos: ${val.error.issues.map((i) => i.message).join(', ')}`,
    }

  let dadosAnteriores = null
  const id = (val.data as { id?: string }).id
  if (id) {
    const { data: existing } = await supabase
      .from('agendamentos_historico')
      .select(
        'id, data_hora_inicio, data_hora_fim, status_comparecimento, profissional_id, paciente_id, especialidade_id',
      )
      .eq('id', id)
      .single()
    dadosAnteriores = existing
  }

  const { data: novo, error } = await supabase
    .from('agendamentos_historico')
    .upsert(val.data)
    .select()
    .single()
  if (error)
    return {
      success: false,
      error: `Erro ao materializar sessão: ${error.message}`,
    }

  await registrarLogAuditoria({
    agendamento_id: novo.id,
    acao: id ? 'EDITAR' : 'CRIAR',
    dados_anteriores: dadosAnteriores,
    dados_novos: novo,
  })

  revalidatePath('/agendamentos')
  return { success: true }
}

export async function buscarHistoricoClinicoPaciente(
  pacienteId: string,
): Promise<ActionResponse<AgendamentoHistoricoComJoins[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agendamentos_historico')
    .select(SELECT_HISTORICO_JOINS)
    .eq('paciente_id', pacienteId)
    .order('data_hora_inicio', { ascending: false })

  if (error) return { success: false, error: error.message }
  return {
    success: true,
    data: mapearAgendaComJoins<AgendamentoHistoricoComJoins>(data || []),
  }
}

// Alias semântico para retrocompatibilidade interna
export const buscarHistoricoPaciente = buscarHistoricoClinicoPaciente

// ==========================================
// MOTOR DE AGENDA — BUSCA + PROJEÇÃO
// ==========================================

export async function buscarAgendaData(
  profissionalId: string,
  startDate: string,
  endDate: string,
): Promise<
  ActionResponse<{
    vagas: VagaFixaComJoins[]
    hist: AgendamentoHistoricoComJoins[]
  }>
> {
  try {
    validarLimiteDias(startDate, endDate)
    const supabase = await createClient()

    const { data: vagas, error: errVagas } = await supabase
      .from('vagas_fixas')
      .select(SELECT_VAGA_FIXA_JOINS)
      .eq('profissional_id', profissionalId)
      .eq('status_vaga', 'Ativa')

    if (errVagas) return { success: false, error: errVagas.message }

    const { data: hist, error: errHist } = await supabase
      .from('agendamentos_historico')
      .select(SELECT_HISTORICO_JOINS)
      .eq('profissional_id', profissionalId)
      .gte('data_hora_inicio', startDate)
      .lte('data_hora_inicio', endDate)

    if (errHist) return { success: false, error: errHist.message }

    return {
      success: true,
      data: {
        vagas: mapearAgendaComJoins<VagaFixaComJoins>(vagas || []),
        hist: mapearAgendaComJoins<AgendamentoHistoricoComJoins>(hist || []),
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na agenda',
    }
  }
}

/** 
 * Busca os agendamentos de um dia específico já projetados via motor de agenda.
 * Obrigatório para a visão do médico e da recepção por paciente.
 */
export async function buscarAgendamentosDia(
  profissionalId: string,
  data: string,
): Promise<ActionResponse<AgendaSession[]>> {
  try {
    const dataSelecionada = startOfDay(parseISO(data))
    const start = dataSelecionada.toISOString()
    const end = endOfDay(dataSelecionada).toISOString()

    const resAgenda = await buscarAgendaData(profissionalId, start, end)
    if (!resAgenda.success || !resAgenda.data)
      return { success: false, error: resAgenda.error }

    const sessoes = projectAgendaSessions(
      resAgenda.data.vagas,
      resAgenda.data.hist,
      dataSelecionada,
      dataSelecionada,
    )

    return { success: true, data: sessoes }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar agenda do dia',
    }
  }
}

export async function buscarAgendaLogistica(
  startDate: string,
  endDate: string,
): Promise<
  ActionResponse<{
    vagas: VagaFixaComJoins[]
    hist: AgendamentoHistoricoComJoins[]
  }>
> {
  try {
    validarLimiteDias(startDate, endDate, 7)
    const supabase = await createClient()

    const SELECT_LOGISTICA = `
      id, horario_inicio, horario_fim, dia_semana, status_vaga, data_inicio_contrato,
      pacientes!inner (id, nome_completo, endereco_cep, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte, criado_em, data_ultimo_laudo, data_nascimento, cns),
      profissionais (id, nome_completo),
      linhas_cuidado_especialidades (id, nome_especialidade)
    `

    const { data: vagas, error: errVagas } = await supabase
      .from('vagas_fixas')
      .select(SELECT_LOGISTICA)
      .eq('status_vaga', 'Ativa')
      .filter('pacientes.necessita_transporte', 'eq', true)

    if (errVagas) return { success: false, error: errVagas.message }

    const { data: hist, error: errHist } = await supabase
      .from('agendamentos_historico')
      .select(`
        id, data_hora_inicio, data_hora_fim, status_comparecimento,
        pacientes!inner (id, nome_completo, endereco_cep, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte, criado_em, data_ultimo_laudo, data_nascimento, cns),
        profissionais (id, nome_completo),
        linhas_cuidado_especialidades (id, nome_especialidade)
      `)
      .gte('data_hora_inicio', startDate)
      .lte('data_hora_inicio', endDate)
      .filter('pacientes.necessita_transporte', 'eq', true)

    if (errHist) return { success: false, error: errHist.message }

    return {
      success: true,
      data: {
        vagas: mapearAgendaComJoins<VagaFixaComJoins>(vagas || []),
        hist: mapearAgendaComJoins<AgendamentoHistoricoComJoins>(hist || []),
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na logística',
    }
  }
}

export async function buscarAgendaCoordenacao(
  startDate: string,
  endDate: string,
): Promise<
  ActionResponse<{
    vagas: VagaFixaComJoins[]
    hist: AgendamentoHistoricoComJoins[]
  }>
> {
  try {
    validarLimiteDias(startDate, endDate, 14)
    const supabase = await createClient()

    const { data: vagas, error: errVagas } = await supabase
      .from('vagas_fixas')
      .select(SELECT_VAGA_FIXA_JOINS)
      .eq('status_vaga', 'Ativa')

    if (errVagas) return { success: false, error: errVagas.message }

    const { data: hist, error: errHist } = await supabase
      .from('agendamentos_historico')
      .select(SELECT_HISTORICO_JOINS)
      .gte('data_hora_inicio', startDate)
      .lte('data_hora_inicio', endDate)

    if (errHist) return { success: false, error: errHist.message }

    return {
      success: true,
      data: {
        vagas: mapearAgendaComJoins<VagaFixaComJoins>(vagas || []),
        hist: mapearAgendaComJoins<AgendamentoHistoricoComJoins>(hist || []),
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na coordenação',
    }
  }
}

// ==========================================
// VISÃO MÉDICO
// ==========================================

/** Busca e projeta os atendimentos do dia para o profissional autenticado. */
export async function buscarMeusAtendimentos(
  data: string,
): Promise<
  ActionResponse<{
    vagas: VagaFixaComJoins[]
    hist: AgendamentoHistoricoComJoins[]
  }>
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Utilizador não autenticado' }

  const { data: prof } = await supabase
    .from('profissionais')
    .select('id')
    .eq('usuario_auth_id', user.id)
    .single()

  if (!prof) return { success: false, error: 'Profissional não encontrado' }

  return buscarAgendaData(prof.id, `${data}T00:00:00Z`, `${data}T23:59:59Z`)
}

export async function buscarMeusPacientesVagaFixa(): Promise<
  ActionResponse<Paciente[]>
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Utilizador não autenticado' }

  const { data: prof } = await supabase
    .from('profissionais')
    .select('id')
    .eq('usuario_auth_id', user.id)
    .single()

  if (!prof) return { success: false, error: 'Profissional não encontrado' }

  const { data, error } = await supabase
    .from('vagas_fixas')
    .select('pacientes(id, nome_completo, cns, data_nascimento, status_cadastro)')
    .eq('profissional_id', prof.id)
    .eq('status_vaga', 'Ativa')

  if (error) return { success: false, error: error.message }

  const listaPacientes: Paciente[] = []
  const idsVistos = new Set<string>()
  if (data) {
    ;(data as { pacientes: unknown }[]).forEach((v) => {
      const p = extrairJoin<Paciente>(v.pacientes)
      if (p && !idsVistos.has(p.id)) {
        idsVistos.add(p.id)
        listaPacientes.push(p)
      }
    })
  }

  return { success: true, data: listaPacientes }
}
