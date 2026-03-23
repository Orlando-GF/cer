'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { cache as reactCache } from 'react'
import {
  agendamentoHistoricoSchema,
  especialidadeSchema,
  faltaFilaSchema,
  gradeHorariaSchema,
  incluirNaFilaSchema,
  pacienteSchema,
  profissionalSchema,
  statusFilaSchema,
  vagaFixaSchema,
  avaliacaoServicoSocialSchema, // ✅ REVERTIDO: import removido pelo agente indevidamente
} from '@/lib/validations/schema'
import {
  type Paciente,
  type Profissional,
  type Especialidade,
  type GradeHoraria,
  type ActionResponse,
  type FaltaRegistro,
  type VagaFixaComJoins,
  type AlertaAbsenteismo,
  type AgendamentoHistoricoComJoins,
  type PacienteFilaTerapia,
  type DadosUsuario,
  type PerfilAcesso,
} from '@/types'
import { Json } from '@/types/database.types'

// ==========================================
// FUNÇÕES UTILITÁRIAS INTERNAS
// ==========================================

function extrairJoin<T>(relacionamento: unknown): T | null {
  if (!relacionamento) return null
  if (Array.isArray(relacionamento)) return (relacionamento[0] as T) || null
  return relacionamento as T
}

// ✅ NOVO: Elimina a duplicação do padrão extrairJoin + .map() que existia 4× no ficheiro
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

// ==========================================
// PACIENTES
// ==========================================

export async function buscarPacientes(
  params: {
    page?: number
    pageSize?: number
    busca?: string
  } = {},
): Promise<ActionResponse<{ data: Paciente[]; total: number }>> {
  const { page = 1, pageSize = 20, busca = '' } = params
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('pacientes')
    .select('id, nome_completo, cns, cpf, data_nascimento, status_cadastro', {
      count: 'exact',
    })

  const termo = busca.trim()
  if (termo.length >= 3) {
    const apenasNumeros = termo.replace(/\D/g, '')
    if (apenasNumeros.length > 0) {
      query = query.or(
        `cpf.ilike.%${apenasNumeros}%,cns.ilike.%${apenasNumeros}%`,
      )
    } else {
      query = query.ilike('nome_completo', `%${termo}%`)
    }
  }

  const { data, error, count } = await query
    .order('nome_completo', { ascending: true })
    .range(from, to)

  if (error)
    return {
      success: false,
      error: `Erro ao procurar pacientes: ${error.message}`,
    }
  return {
    success: true,
    data: { data: data as Paciente[], total: count || 0 },
  }
}

export async function cadastrarPaciente(
  rawData: unknown,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const validation = pacienteSchema.safeParse(rawData)
  if (!validation.success)
    return {
      success: false,
      error: validation.error.issues.map((i) => i.message).join(', '),
    }

  const { data } = validation
  const { error } = await supabase.from('pacientes').insert({
    ...data,
    cpf: data.cpf || null,
    municipio_pactuado: data.municipio_pactuado || null,
    cid_principal: data.cid_principal || null,
    cid_secundario: data.cid_secundario || null,
    nome_pai: data.nome_pai || null,
    id_legado_vba: data.id_legado_vba || null,
  })

  if (error) {
    if (error.code === '23505')
      return { success: false, error: 'Conflito: CNS ou CPF já cadastrado.' }
    return {
      success: false,
      error: `Erro ao cadastrar paciente: ${error.message}`,
    }
  }

  revalidatePath('/pacientes')
  return { success: true }
}

export async function atualizarPaciente(
  id: string,
  rawData: unknown,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const validation = pacienteSchema.safeParse(rawData)
  if (!validation.success)
    return {
      success: false,
      error: validation.error.issues.map((i) => i.message).join(', '),
    }

  const { data } = validation
  const { error } = await supabase
    .from('pacientes')
    .update({
      ...data,
      cpf: data.cpf || null,
      municipio_pactuado: data.municipio_pactuado || null,
      cid_principal: data.cid_principal || null,
      cid_secundario: data.cid_secundario || null,
      nome_pai: data.nome_pai || null,
      id_legado_vba: data.id_legado_vba || null,
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505')
      return { success: false, error: 'Conflito: CNS ou CPF já cadastrado.' }
    return {
      success: false,
      error: `Erro ao atualizar paciente: ${error.message}`,
    }
  }

  revalidatePath('/pacientes')
  return { success: true }
}

export async function buscarPacientePorDocumento(
  documento: string,
): Promise<ActionResponse<Paciente>> {
  const supabase = await createClient()
  const docLimpo = documento.replace(/\D/g, '')
  let query = supabase
    .from('pacientes')
    .select(
      'id, nome_completo, cns, cpf, data_nascimento, status_cadastro, telefone_principal, endereco_cep, logradouro, numero, bairro, cidade, uf, nome_mae, cid_principal',
    )

  if (docLimpo.length === 11) query = query.eq('cpf', docLimpo)
  else query = query.eq('cns', docLimpo)

  const { data, error } = await query.single()
  if (error || !data)
    return { success: false, error: 'Paciente não encontrado' }
  return { success: true, data: data as Paciente }
}

export async function buscarPacienteCompleto(
  id: string,
): Promise<ActionResponse<Paciente>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data)
    return { success: false, error: 'Paciente não encontrado' }
  return { success: true, data: data as Paciente }
}

// ✅ REVERTIDO: Restaurada validação com Zod (agente tinha removido)
export async function cadastrarAvaliacaoSocial(
  rawData: unknown,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const val = avaliacaoServicoSocialSchema.safeParse(rawData)
  if (!val.success)
    return {
      success: false,
      error: val.error.issues.map((i) => i.message).join(', '),
    }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Usuário não autenticado.' }

  const { data: prof } = await supabase
    .from('profissionais')
    .select('id')
    .eq('usuario_auth_id', user.id)
    .single()
  if (!prof) return { success: false, error: 'Profissional não encontrado' }

  const { error } = await supabase.from('avaliacoes_servico_social').insert({
    ...val.data,
    profissional_id: prof.id,
  })

  if (error)
    return {
      success: false,
      error: `Erro ao registrar avaliação: ${error.message}`,
    }

  revalidatePath('/pacientes')
  return { success: true }
}

// ==========================================
// FILA DE ESPERA
// ==========================================

export async function incluirPacienteNaFila(
  rawData: unknown,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const validation = incluirNaFilaSchema.safeParse(rawData)
  if (!validation.success)
    return {
      success: false,
      error: validation.error.issues.map((i) => i.message).join(', '),
    }

  const { data } = validation
  const { error } = await supabase.from('fila_espera').insert({
    paciente_id: data.paciente_id,
    especialidade_id: data.especialidade_id,
    nivel_prioridade: data.nivel_prioridade,
    numero_processo_judicial:
      data.nivel_prioridade === 'Mandado Judicial'
        ? data.numero_processo_judicial
        : null,
    origem_encaminhamento: data.origem_encaminhamento,
    frequencia_recomendada: data.frequencia_recomendada,
    status_fila: 'Aguardando',
  })

  if (error) {
    if (error.code === '23505')
      return {
        success: false,
        error: 'Este paciente já se encontra na fila para esta especialidade.',
      }
    return {
      success: false,
      error: `Erro ao inserir na fila: ${error.message}`,
    }
  }

  revalidatePath('/fila') // ✅ CORRIGIDO: era revalidatePath('/')
  return { success: true }
}

export async function registrarFaltaPaciente(
  rawData: unknown,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const validation = faltaFilaSchema.safeParse(rawData)
  if (!validation.success)
    return { success: false, error: 'Dados de falta inválidos.' }

  const { data } = validation
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { error: errRegistro } = await supabase
    .from('faltas_registros')
    .insert({
      fila_id: data.fila_id,
      justificada: data.justificada,
      observacao: data.observacao || null,
      registrado_por: user?.id || null,
    })

  if (errRegistro)
    return {
      success: false,
      error: `Erro ao salvar registo de falta: ${errRegistro.message}`,
    }

  revalidatePath('/fila') // ✅ CORRIGIDO: era revalidatePath('/')
  revalidatePath('/absenteismo') // ✅ CORRIGIDO: adicionado (falta pode gerar novo alerta)
  return { success: true }
}

export async function alterarStatusFila(
  rawData: unknown,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const validation = statusFilaSchema.safeParse(rawData)
  if (!validation.success) return { success: false, error: 'Status inválido.' }

  const { error } = await supabase
    .from('fila_espera')
    .update({ status_fila: validation.data.novo_status })
    .eq('id', validation.data.fila_id)
  if (error)
    return {
      success: false,
      error: `Erro ao atualizar status: ${error.message}`,
    }

  revalidatePath('/fila')
  return { success: true }
}

export async function buscarHistoricoFaltas(
  filaId: string,
): Promise<ActionResponse<FaltaRegistro[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('faltas_registros')
    .select('id, data_falta, justificada, observacao, criado_em')
    .eq('fila_id', filaId)
    .order('data_falta', { ascending: false })
    .limit(10)

  if (error)
    return {
      success: false,
      error: `Erro ao procurar histórico: ${error.message}`,
    }
  return { success: true, data: (data || []) as FaltaRegistro[] }
}

export async function buscarFilaEspera(
  params: {
    page?: number
    pageSize?: number
    status?: string
    especialidade?: string
    judicial?: boolean
    busca?: string
  } = {},
): Promise<ActionResponse<{ data: PacienteFilaTerapia[]; total: number }>> {
  const {
    page = 1,
    pageSize = 20,
    status = 'ativos',
    especialidade = 'todas',
    judicial = false,
    busca = '',
  } = params
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('fila_espera').select(
    `
      id, data_entrada_fila, nivel_prioridade, status_fila, numero_processo_judicial,
      faltas_registros ( count ),
      pacientes (id, nome_completo, cns),
      linhas_cuidado_especialidades (id, nome_especialidade)
    `,
    { count: 'exact' },
  )

  if (status !== 'todos') {
    if (status === 'ativos') {
      query = query.in('status_fila', [
        'Aguardando',
        'Em Atendimento',
        'Em Risco',
      ])
    } else {
      query = query.eq(
        'status_fila',
        status as
          | 'Alta'
          | 'Aguardando'
          | 'Em Atendimento'
          | 'Em Risco'
          | 'Desistencia'
          | 'Aguardando Vaga',
      )
    }
  }

  if (especialidade !== 'todas')
    query = query.eq('especialidade_id', especialidade)
  if (judicial) query = query.eq('nivel_prioridade', 'Mandado Judicial')

  if (busca.trim().length > 0) {
    query = query.or(`nome_completo.ilike.%${busca}%,cns.ilike.%${busca}%`, {
      foreignTable: 'pacientes',
    })
  }

  const { data, error, count } = await query
    .order('nivel_prioridade', { ascending: true })
    .order('data_entrada_fila', { ascending: true })
    .range(from, to)

  if (error) return { success: false, error: error.message }

  // ✅ REVERTIDO: Restaurado o .map() que constrói PacienteFilaTerapia corretamente
  // O agente tinha substituído isto por 'as any' direto, quebrando a tipagem do frontend
  const hoje = new Date()
  const filaMapped = (
    (data as unknown as {
      id: string
      data_entrada_fila: string
      nivel_prioridade: string
      status_fila: string
      numero_processo_judicial: string | null
      faltas_registros: Array<{ count: number }>
      pacientes: { id: string; nome_completo: string; cns: string } | null
      linhas_cuidado_especialidades: {
        id: string
        nome_especialidade: string
      } | null
    }[]) || []
  ).map((r) => {
    const diffDays = Math.ceil(
      Math.abs(hoje.getTime() - new Date(r.data_entrada_fila).getTime()) /
        (1000 * 60 * 60 * 24),
    )
    return {
      id: r.id,
      paciente_id: r.pacientes?.id || '',
      nome: r.pacientes?.nome_completo || 'Desconhecido',
      cns: r.pacientes?.cns || 'S/N',
      prioridade: r.nivel_prioridade as PacienteFilaTerapia['prioridade'],
      status: r.status_fila as PacienteFilaTerapia['status'],
      especialidade:
        r.linhas_cuidado_especialidades?.nome_especialidade || 'N/A',
      data_encaminhamento: r.data_entrada_fila,
      dias_espera: diffDays,
      profissional_nome: null,
      faltas: r.faltas_registros?.[0]?.count || 0,
      numeroProcesso: r.numero_processo_judicial,
    } as PacienteFilaTerapia
  })

  return { success: true, data: { data: filaMapped, total: count || 0 } }
}

export async function buscarEstatísticasFila(): Promise<
  ActionResponse<{ total: number; judicial: number; prioridade: number }>
> {
  const supabase = await createClient()

  const [
    { count: total, error: errTotal },
    { count: judicial, error: errJudicial },
    { count: prioridade, error: errPrioridade },
  ] = await Promise.all([
    supabase
      .from('fila_espera')
      .select('*', { count: 'exact', head: true })
      .in('status_fila', ['Aguardando', 'Em Atendimento', 'Em Risco']),
    supabase
      .from('fila_espera')
      .select('*', { count: 'exact', head: true })
      .eq('nivel_prioridade', 'Mandado Judicial')
      .in('status_fila', ['Aguardando', 'Em Atendimento', 'Em Risco']),
    supabase
      .from('fila_espera')
      .select('*', { count: 'exact', head: true })
      .eq('nivel_prioridade', 'Urgencia Clinica')
      .in('status_fila', ['Aguardando', 'Em Atendimento', 'Em Risco']),
  ])

  if (errTotal || errJudicial || errPrioridade)
    return { success: false, error: 'Erro ao carregar estatísticas' }
  return {
    success: true,
    data: {
      total: total || 0,
      judicial: judicial || 0,
      prioridade: prioridade || 0,
    },
  }
}

// ==========================================
// AUDITORIA (interna, não exportada)
// ==========================================

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

    await supabase.from('logs_auditoria').insert({
      // ✅ CORRIGIDO: era 'agendamentos_logs'
      tabela_afetada: 'agendamentos_historico',
      registro_id: params.agendamento_id,
      acao: params.acao === 'CRIAR' ? 'INSERT' : 'UPDATE', // ✅ conforme CHECK do BD
      dados_antigos: params.dados_anteriores as Json,
      dados_novos: params.dados_novos as Json,
      autor_id: user?.id ?? null,
    })
  } catch (e) {
    console.error('[Auditoria] Falha ao registar log:', e)
    // Não propaga — log nunca deve quebrar o fluxo principal
  }
}

// ==========================================
// AGENDA E VAGAS FIXAS
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

    // ✅ REVERTIDO: selects explícitos — o agente tinha trocado para '*' sem razão
    const { data: vagas, error: errVagas } = await supabase
      .from('vagas_fixas')
      .select(
        `
      id, horario_inicio, horario_fim, dia_semana, status_vaga, especialidade_id, profissional_id, paciente_id, data_inicio_contrato,
      pacientes (id, nome_completo, data_nascimento, cns, criado_em, data_ultimo_laudo, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte),
      profissionais (id, nome_completo),
      linhas_cuidado_especialidades (id, nome_especialidade)
    `,
      )
      .eq('profissional_id', profissionalId)
      .eq('status_vaga', 'Ativa')

    if (errVagas) return { success: false, error: errVagas.message }

    const { data: hist, error: errHist } = await supabase
      .from('agendamentos_historico')
      .select(
        `
      id, data_hora_inicio, data_hora_fim, status_comparecimento, profissional_id, paciente_id, especialidade_id,
      pacientes (id, nome_completo, data_nascimento, cns, criado_em, data_ultimo_laudo, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte),
      profissionais (id, nome_completo),
      linhas_cuidado_especialidades (id, nome_especialidade)
    `,
      )
      .eq('profissional_id', profissionalId)
      .gte('data_hora_inicio', startDate)
      .lte('data_hora_inicio', endDate)

    if (errHist) return { success: false, error: errHist.message }

    // ✅ MELHORIA: usa mapearAgendaComJoins em vez do bloco .map() duplicado
    return {
      success: true,
      data: {
        vagas: mapearAgendaComJoins(
          vagas || [],
        ) as unknown as VagaFixaComJoins[],
        hist: mapearAgendaComJoins(
          hist || [],
        ) as unknown as AgendamentoHistoricoComJoins[],
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Erro desconhecido na agenda',
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

    // ✅ REVERTIDO: selects explícitos restaurados
    const { data: vagas, error: errVagas } = await supabase
      .from('vagas_fixas')
      .select(
        `
      id, horario_inicio, horario_fim, dia_semana, status_vaga, data_inicio_contrato,
      pacientes!inner (id, nome_completo, endereco_cep, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte, criado_em, data_ultimo_laudo, data_nascimento, cns),
      profissionais (id, nome_completo),
      linhas_cuidado_especialidades (id, nome_especialidade)
    `,
      )
      .eq('status_vaga', 'Ativa')
      .filter('pacientes.necessita_transporte', 'eq', true)

    if (errVagas) return { success: false, error: errVagas.message }

    const { data: hist, error: errHist } = await supabase
      .from('agendamentos_historico')
      .select(
        `
      id, data_hora_inicio, data_hora_fim, status_comparecimento,
      pacientes!inner (id, nome_completo, endereco_cep, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte, criado_em, data_ultimo_laudo, data_nascimento, cns),
      profissionais (id, nome_completo),
      linhas_cuidado_especialidades (id, nome_especialidade)
    `,
      )
      .gte('data_hora_inicio', startDate)
      .lte('data_hora_inicio', endDate)
      .filter('pacientes.necessita_transporte', 'eq', true)

    if (errHist) return { success: false, error: errHist.message }

    return {
      success: true,
      data: {
        vagas: mapearAgendaComJoins(
          vagas || [],
        ) as unknown as VagaFixaComJoins[],
        hist: mapearAgendaComJoins(
          hist || [],
        ) as unknown as AgendamentoHistoricoComJoins[],
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro desconhecido na logística',
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

    // ✅ REVERTIDO: selects explícitos restaurados
    const { data: vagas, error: errVagas } = await supabase
      .from('vagas_fixas')
      .select(
        `
      id, horario_inicio, horario_fim, dia_semana, status_vaga, especialidade_id, profissional_id, paciente_id, data_inicio_contrato,
      pacientes (id, nome_completo, data_nascimento, cns, criado_em, data_ultimo_laudo, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte),
      profissionais (id, nome_completo),
      linhas_cuidado_especialidades (id, nome_especialidade)
    `,
      )
      .eq('status_vaga', 'Ativa')

    if (errVagas) return { success: false, error: errVagas.message }

    const { data: hist, error: errHist } = await supabase
      .from('agendamentos_historico')
      .select(
        `
      id, data_hora_inicio, data_hora_fim, status_comparecimento, profissional_id, paciente_id, especialidade_id,
      pacientes (id, nome_completo, data_nascimento, cns, criado_em, data_ultimo_laudo, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte),
      profissionais (id, nome_completo),
      linhas_cuidado_especialidades (id, nome_especialidade)
    `,
      )
      .gte('data_hora_inicio', startDate)
      .lte('data_hora_inicio', endDate)

    if (errHist) return { success: false, error: errHist.message }

    return {
      success: true,
      data: {
        vagas: mapearAgendaComJoins(
          vagas || [],
        ) as unknown as VagaFixaComJoins[],
        hist: mapearAgendaComJoins(
          hist || [],
        ) as unknown as AgendamentoHistoricoComJoins[],
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro desconhecido na coordenação',
    }
  }
}

// ==========================================
// CONFIGURAÇÕES — ESPECIALIDADES
// ==========================================

export async function buscarEspecialidades(): Promise<
  ActionResponse<Especialidade[]>
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('linhas_cuidado_especialidades')
    .select('id, nome_especialidade, ativo, criado_em')
    .order('nome_especialidade')
  if (error) return { success: false, error: error.message }
  return { success: true, data: data as unknown as Especialidade[] }
}

export async function cadastrarEspecialidade(
  rawData: unknown,
): Promise<ActionResponse<Especialidade>> {
  const supabase = await createClient()
  const val = especialidadeSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: 'Dados inválidos.' }

  const { data, error } = await supabase
    .from('linhas_cuidado_especialidades')
    .insert([val.data])
    .select()
    .single()
  if (error) return { success: false, error: error.message }

  revalidatePath('/especialidades')
  return { success: true, data: data as Especialidade }
}

export async function atualizarEspecialidade(
  id: string,
  rawData: unknown,
): Promise<ActionResponse<Especialidade>> {
  const supabase = await createClient()
  const val = especialidadeSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: 'Dados inválidos.' }

  const { data, error } = await supabase
    .from('linhas_cuidado_especialidades')
    .update(val.data)
    .eq('id', id)
    .select()
    .single()
  if (error) return { success: false, error: error.message }

  revalidatePath('/especialidades')
  return { success: true, data: data as Especialidade }
}

export async function toggleAtivaEspecialidade(
  id: string,
  ativo: boolean,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('linhas_cuidado_especialidades')
    .update({ ativo })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/especialidades')
  return { success: true }
}

// ==========================================
// CONFIGURAÇÕES — GRADES HORÁRIAS
// ==========================================

// ✅ REVERTIDO: tabela correta 'grade_horaria' (agente tinha trocado para 'profissionais_especialidades')
export async function buscarGradesHorarias(): Promise<
  ActionResponse<GradeHoraria[]>
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('grade_horaria')
    .select(
      'id, dia_semana, horario_inicio, horario_fim, ativo, profissional_id, profissional:profissionais(nome_completo)',
    )
    .order('dia_semana')
    .order('horario_inicio')
  if (error) return { success: false, error: error.message }
  return { success: true, data: data as GradeHoraria[] }
}

export async function salvarGradeHoraria(
  rawData: unknown,
): Promise<ActionResponse<GradeHoraria>> {
  const supabase = await createClient()
  const val = gradeHorariaSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: 'Dados inválidos.' }

  const { data, error } = await supabase
    .from('grade_horaria')
    .upsert([val.data])
    .select()
    .single()
  if (error) return { success: false, error: error.message }

  revalidatePath('/grades')
  return { success: true, data: data as GradeHoraria }
}

export async function toggleAtivaGradeHoraria(
  id: string,
  ativo: boolean,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('grade_horaria')
    .update({ ativo })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/grades')
  return { success: true }
}

// ==========================================
// CONFIGURAÇÕES — PROFISSIONAIS
// ==========================================

export async function buscarProfissionais(): Promise<
  ActionResponse<Profissional[]>
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profissionais')
    .select(
      'id, nome_completo, registro_conselho, cbo, perfil_acesso, ativo, profissionais_especialidades ( especialidade_id )',
    )
    .order('nome_completo')

  if (error) return { success: false, error: error.message }

  const mappedData = (data || []).map((p: Record<string, unknown>) => {
    const pe = p.profissionais_especialidades as
      | Array<{ especialidade_id: string }>
      | undefined
    const rest = { ...p }
    delete rest.profissionais_especialidades
    return {
      ...rest,
      especialidades_permitidas: pe?.map((item) => item.especialidade_id) || [],
    }
  })

  return { success: true, data: mappedData as unknown as Profissional[] }
}

export async function cadastrarProfissional(
  rawData: unknown,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const val = profissionalSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: 'Dados inválidos.' }

  const { especialidades_permitidas, ...profissionalData } = val.data
  const { data: newProfissional, error } = await supabase
    .from('profissionais')
    .insert(profissionalData)
    .select('id')
    .single()
  if (error) return { success: false, error: error.message }

  if (especialidades_permitidas && especialidades_permitidas.length > 0) {
    const especialidadesInsert = especialidades_permitidas.map((espId) => ({
      profissional_id: newProfissional.id,
      especialidade_id: espId,
    }))
    const { error: errEsp } = await supabase
      .from('profissionais_especialidades')
      .insert(especialidadesInsert)
    if (errEsp) return { success: false, error: errEsp.message }
  }

  revalidatePath('/profissionais')
  return { success: true }
}

export async function atualizarProfissional(
  id: string,
  rawData: unknown,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const val = profissionalSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: 'Dados inválidos.' }

  const { especialidades_permitidas, ...profissionalData } = val.data
  const { error } = await supabase
    .from('profissionais')
    .update(profissionalData)
    .eq('id', id)
  if (error) return { success: false, error: error.message }

  const { error: errDel } = await supabase
    .from('profissionais_especialidades')
    .delete()
    .eq('profissional_id', id)
  if (errDel) return { success: false, error: errDel.message }

  if (especialidades_permitidas && especialidades_permitidas.length > 0) {
    const especialidadesInsert = especialidades_permitidas.map((espId) => ({
      profissional_id: id,
      especialidade_id: espId,
    }))
    const { error: errEsp } = await supabase
      .from('profissionais_especialidades')
      .insert(especialidadesInsert)
    if (errEsp) return { success: false, error: errEsp.message }
  }

  revalidatePath('/profissionais')
  return { success: true }
}

export async function toggleAtivoProfissional(
  id: string,
  ativo: boolean,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profissionais')
    .update({ ativo })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/profissionais')
  return { success: true }
}

// ==========================================
// PERFIL E SESSÃO
// ==========================================

// ✅ CORRIGIDO (crítico): era .eq('id', user.id) — campo correto é usuario_auth_id
export const getMeuPerfil = reactCache(
  async (): Promise<DadosUsuario | null> => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: prof } = await supabase
      .from('profissionais')
      .select('perfil_acesso, nome_completo')
      .eq('usuario_auth_id', user.id)
      .single()

    if (!prof)
      return {
        perfil_acesso: 'Administracao',
        nome_completo: 'Administrador',
        email: user.email ?? '',
      }

    return {
      perfil_acesso: prof.perfil_acesso as PerfilAcesso,
      nome_completo: prof.nome_completo,
      email: user.email ?? '',
    }
  },
)

// ==========================================
// ABSENTEÍSMO
// ==========================================

export async function buscarAlertasAbsenteismo(): Promise<
  ActionResponse<AlertaAbsenteismo[]>
> {
  const supabase = await createClient()
  const { data: vagas, error: errVagas } = await supabase
    .from('vagas_fixas')
    .select(
      `
    paciente_id,
    pacientes (id, nome_completo, cns, telefone_principal),
    linhas_cuidado_especialidades (nome_especialidade),
    profissionais (nome_completo)
  `,
    )
    .eq('status_vaga', 'Ativa')

  if (errVagas) return { success: false, error: errVagas.message }
  if (!vagas || vagas.length === 0) return { success: true, data: [] }

  const pacientesIds = Array.from(new Set(vagas.map((v) => v.paciente_id)))

  const { data: historicoGeral, error: errHist } = await supabase
    .from('agendamentos_historico')
    .select('paciente_id, status_comparecimento, data_hora_inicio')
    .in('paciente_id', pacientesIds)
    .order('data_hora_inicio', { ascending: false })

  if (errHist) return { success: false, error: errHist.message }

  const alertas: AlertaAbsenteismo[] = []

  for (const pId of pacientesIds) {
    const histPaciente =
      historicoGeral?.filter((h) => h.paciente_id === pId).slice(0, 3) || []
    if (histPaciente.length < 3) continue

    const todasFaltas = histPaciente.every(
      (h) => h.status_comparecimento === 'Falta Nao Justificada',
    )
    if (todasFaltas) {
      const rawVaga = vagas.find((v) => v.paciente_id === pId)
      if (rawVaga) {
        const paciente = extrairJoin<Partial<Paciente>>(rawVaga.pacientes)
        const especialidade = extrairJoin<{ nome_especialidade: string }>(
          rawVaga.linhas_cuidado_especialidades,
        )
        const profissional = extrairJoin<{ nome_completo: string }>(
          rawVaga.profissionais,
        )

        if (paciente) {
          alertas.push({
            paciente,
            especialidade: especialidade?.nome_especialidade || 'N/A',
            profissional: profissional?.nome_completo || 'N/A',
            ultimas_faltas: histPaciente.map((h) => h.data_hora_inicio),
          })
        }
      }
    }
  }
  return { success: true, data: alertas }
}

// ✅ CORRIGIDO (crítico): adicionado log de auditoria obrigatório (CER §3.6)
export async function processarDesligamentoPorAbandono(
  pacienteId: string,
): Promise<ActionResponse> {
  const supabase = await createClient()

  const { data: dadosAntigos } = await supabase
    .from('pacientes')
    .select('id, status_cadastro')
    .eq('id', pacienteId)
    .single()

  const { data: vagasAntigas } = await supabase
    .from('vagas_fixas')
    .select('id, status_vaga')
    .eq('paciente_id', pacienteId)
    .eq('status_vaga', 'Ativa')

  const { error: errPaciente } = await supabase
    .from('pacientes')
    .update({ status_cadastro: 'Alta' })
    .eq('id', pacienteId)

  if (errPaciente)
    return {
      success: false,
      error: `Erro ao desligar paciente: ${errPaciente.message}`,
    }

  const { error: errVagas } = await supabase
    .from('vagas_fixas')
    .update({
      status_vaga: 'Encerrada',
      data_fim_contrato: new Date().toISOString(),
    })
    .eq('paciente_id', pacienteId)
    .eq('status_vaga', 'Ativa')

  if (errVagas)
    return {
      success: false,
      error: `Erro ao encerrar vagas: ${errVagas.message}`,
    }

  await registrarLogAuditoria({
    agendamento_id: pacienteId,
    acao: 'UPDATE',
    dados_anteriores: { paciente: dadosAntigos, vagas: vagasAntigas },
    dados_novos: {
      status_cadastro: 'Alta',
      vagas_encerradas: vagasAntigas?.map((v) => v.id),
    },
  })

  revalidatePath('/absenteismo')
  revalidatePath('/pacientes')
  return { success: true }
}

// ==========================================
// VAGAS FIXAS
// ==========================================

export async function buscarVagasFixas(
  profissionalId: string,
): Promise<ActionResponse<VagaFixaComJoins[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vagas_fixas')
    .select(
      `
    id, horario_inicio, horario_fim, dia_semana, status_vaga, especialidade_id, profissional_id, paciente_id, data_inicio_contrato, data_fim_contrato,
    pacientes (id, nome_completo, data_nascimento, cns, criado_em, data_ultimo_laudo, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte),
    profissionais (id, nome_completo),
    linhas_cuidado_especialidades (id, nome_especialidade)
  `,
    )
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
// HISTÓRICO CLÍNICO E ATENDIMENTOS
// ==========================================

export async function buscarHistoricoClinicoPaciente(
  pacienteId: string,
): Promise<ActionResponse<AgendamentoHistoricoComJoins[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agendamentos_historico')
    .select(
      `
    id, data_hora_inicio, data_hora_fim, status_comparecimento, profissional_id, paciente_id, especialidade_id,
    pacientes (id, nome_completo, data_nascimento, cns, criado_em, data_ultimo_laudo, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte),
    profissionais (id, nome_completo),
    linhas_cuidado_especialidades (id, nome_especialidade)
  `,
    )
    .eq('paciente_id', pacienteId)
    .order('data_hora_inicio', { ascending: false })

  if (error) return { success: false, error: error.message }
  return {
    success: true,
    data: mapearAgendaComJoins<AgendamentoHistoricoComJoins>(data || []),
  }
}

// ✅ CORRIGIDO (crítico): resolve prof.id via usuario_auth_id antes de passar para buscarAgendaData
export async function buscarMeusAtendimentos(data: string) {
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
    .select(
      'pacientes(id, nome_completo, cns, data_nascimento, status_cadastro)',
    )
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
