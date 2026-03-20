"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
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
  avaliacaoServicoSocialSchema,
} from "@/lib/validations/schema"
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
  type PacienteFila,
  type DadosUsuario
} from "@/types"

// --- PACIENTES ---

export async function buscarPacientes(page: number = 1, pageSize: number = 20): Promise<ActionResponse<{ data: Paciente[], total: number }>> {
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('pacientes')
    .select('id, nome_completo, cns, data_nascimento, status_cadastro', { count: 'exact' })
    .order('nome_completo', { ascending: true })
    .range(from, to)

  if (error) return { success: false, error: `Erro ao buscar pacientes: ${error.message}` }
  return { success: true, data: { data: data as unknown as Paciente[], total: count || 0 } }
}

export async function buscarPacientesPorBusca(termo: string): Promise<ActionResponse<Paciente[]>> {
  const supabase = await createClient()
  if (!termo || termo.trim().length < 3) return { success: true, data: [] }

  const apenasNumeros = termo.replace(/\D/g, '')
  let query = supabase.from('pacientes')
    .select('id, nome_completo, cns, cpf, data_nascimento, status_cadastro')
    .limit(30)

  if (apenasNumeros.length > 0) {
    query = query.or(`cpf.ilike.%${apenasNumeros}%,cns.ilike.%${apenasNumeros}%`)
  } else {
    query = query.ilike('nome_completo', `%${termo}%`)
  }

  const { data, error } = await query
  if (error) return { success: false, error: `Erro ao buscar pacientes: ${error.message}` }
  return { success: true, data: data as unknown as Paciente[] }
}

export async function cadastrarPaciente(rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()
  const validation = pacienteSchema.safeParse(rawData)
  if (!validation.success) {
    return { success: false, error: validation.error.issues.map(i => i.message).join(', ') }
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
    if (error.code === '23505') return { success: false, error: 'Conflito: CNS ou CPF ja cadastrado.' }
    return { success: false, error: `Erro ao cadastrar paciente: ${error.message}` }
  }

  revalidatePath('/pacientes')
  return { success: true }
}

export async function atualizarPaciente(id: string, rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()
  const validation = pacienteSchema.safeParse(rawData)
  if (!validation.success) {
    return { success: false, error: validation.error.issues.map(i => i.message).join(', ') }
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
    if (error.code === '23505') return { success: false, error: 'Conflito: CNS ou CPF ja cadastrado.' }
    return { success: false, error: `Erro ao atualizar paciente: ${error.message}` }
  }

  revalidatePath('/pacientes')
  return { success: true }
}

export async function buscarPacientePorDocumento(documento: string): Promise<ActionResponse<Paciente>> {
  const supabase = await createClient()
  const docLimpo = documento.replace(/\D/g, '')
  const query = supabase.from('pacientes')
    .select('id, nome_completo, cns, cpf, data_nascimento, status_cadastro, telefone_principal, endereco_cep, logradouro, numero, bairro, cidade, uf, nome_mae, cid_principal')

  if (docLimpo.length === 11) query.eq('cpf', docLimpo)
  else query.eq('cns', docLimpo)

  const { data, error } = await query.single()
  if (error || !data) return { success: false, error: 'Paciente nao encontrado' }
  return { success: true, data: data as unknown as Paciente }
}

// --- FILA DE ESPERA ---

export async function incluirPacienteNaFila(rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()
  const validation = incluirNaFilaSchema.safeParse(rawData)
  if (!validation.success) {
    return { success: false, error: validation.error.issues.map(i => i.message).join(', ') }
  }

  const { data } = validation
  const { error } = await supabase.from('fila_espera').insert({
    paciente_id: data.paciente_id,
    especialidade_id: data.especialidade_id,
    nivel_prioridade: data.nivel_prioridade,
    numero_processo_judicial: data.nivel_prioridade === 'Mandado Judicial' ? data.numero_processo_judicial : null,
    origem_encaminhamento: data.origem_encaminhamento,
    frequencia_recomendada: data.frequencia_recomendada,
    status_fila: 'Aguardando',
  })

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Este paciente ja se encontra aguardando fila para esta especialidade.' }
    return { success: false, error: `Erro ao inserir na fila: ${error.message}` }
  }

  revalidatePath('/')
  return { success: true }
}

export async function registrarFaltaPaciente(rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()
  const validation = faltaFilaSchema.safeParse(rawData)
  if (!validation.success) return { success: false, error: 'Dados de falta invalidos.' }

  const { data } = validation
  const { data: { user } } = await supabase.auth.getUser()
  const usuarioId = user?.id || null

  const { data: filaAtual, error: errFila } = await supabase
    .from('fila_espera')
    .select('faltas_consecutivas')
    .eq('id', data.fila_id)
    .single()

  if (errFila) return { success: false, error: 'Paciente nao encontrado na fila.' }

  const novasFaltas = (filaAtual.faltas_consecutivas || 0) + 1

  const { error: errRegistro } = await supabase.from('faltas_registros').insert({
    fila_id: data.fila_id,
    justificada: data.justificada,
    observacao: data.observacao || null,
    registrado_por: usuarioId,
  })

  if (errRegistro) return { success: false, error: `Erro ao salvar registro de falta: ${errRegistro.message}` }

  await supabase.from('fila_espera').update({ faltas_consecutivas: novasFaltas }).eq('id', data.fila_id)

  revalidatePath('/')
  return { success: true }
}

export async function alterarStatusFila(rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()
  const validation = statusFilaSchema.safeParse(rawData)
  if (!validation.success) return { success: false, error: 'Status invalido.' }

  const { data } = validation
  const { error } = await supabase.from('fila_espera').update({ status_fila: data.novo_status }).eq('id', data.fila_id)
  if (error) return { success: false, error: `Erro ao atualizar status: ${error.message}` }

  revalidatePath('/')
  return { success: true }
}

export async function buscarHistoricoFaltas(filaId: string): Promise<ActionResponse<FaltaRegistro[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('faltas_registros')
    .select('id, data_falta, justificada, observacao, criado_em')
    .eq('fila_id', filaId)
    .order('data_falta', { ascending: false })
    .limit(10)

  if (error) return { success: false, error: `Erro ao buscar historico: ${error.message}` }
  return { success: true, data }
}

// --- AGENDA E VAGAS FIXAS ---

export async function salvarVagaFixa(rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()
  const val = vagaFixaSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: 'Dados invalidos para Vaga Fixa.' }

  const { error } = await supabase.from('vagas_fixas').upsert(val.data)
  if (error) return { success: false, error: `Erro ao salvar vaga: ${error.message}` }

  revalidatePath('/agenda')
  return { success: true }
}

export async function registrarSessaoHistorico(rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()
  const val = agendamentoHistoricoSchema.safeParse(rawData)
  if (!val.success) {
    return { success: false, error: `Dados invalidos: ${val.error.issues.map(i => i.message).join(', ')}` }
  }

  let dadosAnteriores = null
  const id = (val.data as any).id
  if (id) {
    const { data: existing } = await supabase.from('agendamentos_historico')
      .select('id, data_hora_inicio, data_hora_fim, status_comparecimento, observacao, profissional_id, paciente_id, especialidade_id')
      .eq('id', id).single()
    dadosAnteriores = existing
  }

  const { data: novo, error } = await supabase.from('agendamentos_historico').upsert(val.data).select().single()
  if (error) return { success: false, error: `Erro ao materializar sessao: ${error.message}` }

  await registrarLogAuditoria({
    agendamento_id: novo.id,
    acao: id ? 'EDITAR' : 'CRIAR',
    dados_anteriores: dadosAnteriores,
    dados_novos: novo,
  })

  revalidatePath('/agenda')
  return { success: true }
}

async function registrarLogAuditoria(params: {
  agendamento_id: string
  acao: string
  dados_anteriores: unknown
  dados_novos: unknown
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('agendamentos_logs').insert({
    agendamento_id: params.agendamento_id,
    usuario_id: user?.id || null,
    acao: params.acao,
    dados_anteriores: params.dados_anteriores,
    dados_novos: params.dados_novos,
  })
}

export async function buscarAgendaData(profissionalId: string, startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: vagas, error: errVagas } = await supabase.from('vagas_fixas').select(`
    id, horario_inicio, horario_fim, dia_semana, status_vaga, especialidade_id, profissional_id, paciente_id, data_inicio_contrato,
    pacientes (id, nome_completo, data_nascimento, cns, criado_em, data_ultimo_laudo, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte),
    profissionais (id, nome_completo),
    linhas_cuidado_especialidades (id, nome_especialidade)
  `).eq('profissional_id', profissionalId).eq('status_vaga', 'Ativa')

  if (errVagas) return { success: false, error: errVagas.message }

  const { data: hist, error: errHist } = await supabase.from('agendamentos_historico').select(`
    id, data_hora_inicio, data_hora_fim, status_comparecimento, observacao, profissional_id, paciente_id, especialidade_id,
    pacientes (id, nome_completo, data_nascimento, cns, criado_em, data_ultimo_laudo, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte),
    profissionais (id, nome_completo),
    linhas_cuidado_especialidades (id, nome_especialidade)
  `).eq('profissional_id', profissionalId).gte('data_hora_inicio', startDate).lte('data_hora_inicio', endDate)

  if (errHist) return { success: false, error: errHist.message }
  return { success: true, data: { vagas: (vagas as any) || [], hist: (hist as any) || [] } }
}

export async function buscarAgendaLogistica(startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: vagas, error: errVagas } = await supabase.from('vagas_fixas').select(`
    id, horario_inicio, horario_fim, dia_semana, status_vaga, data_inicio_contrato,
    pacientes (id, nome_completo, endereco_cep, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte, criado_em, data_ultimo_laudo, data_nascimento, cns),
    profissionais (id, nome_completo),
    linhas_cuidado_especialidades (id, nome_especialidade)
  `).eq('status_vaga', 'Ativa').filter('pacientes.necessita_transporte', 'eq', true)

  if (errVagas) return { success: false, error: errVagas.message }

  const { data: hist, error: errHist } = await supabase.from('agendamentos_historico').select(`
    id, data_hora_inicio, data_hora_fim, status_comparecimento,
    pacientes (id, nome_completo, endereco_cep, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte, criado_em, data_ultimo_laudo, data_nascimento, cns),
    profissionais (id, nome_completo),
    linhas_cuidado_especialidades (id, nome_especialidade)
  `).gte('data_hora_inicio', startDate).lte('data_hora_inicio', endDate).filter('pacientes.necessita_transporte', 'eq', true)

  if (errHist) return { success: false, error: errHist.message }
  return { success: true, data: { vagas: (vagas as any) || [], hist: (hist as any) || [] } }
}

// --- CONFIGURACOES: ESPECIALIDADES ---

export async function buscarEspecialidades(): Promise<ActionResponse<Especialidade[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('linhas_cuidado_especialidades')
    .select('id, nome_especialidade, ativo, cor_hex, descricao, criado_em')
    .order('nome_especialidade')
  if (error) return { success: false, error: error.message }
  return { success: true, data: data as unknown as Especialidade[] }
}

export async function cadastrarEspecialidade(rawData: unknown): Promise<ActionResponse<Especialidade>> {
  const supabase = await createClient()
  const val = especialidadeSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: 'Dados invalidos.' }

  const { data, error } = await supabase.from('linhas_cuidado_especialidades').insert([val.data]).select().single()
  if (error) return { success: false, error: error.message }

  revalidatePath('/especialidades')
  return { success: true, data }
}

export async function atualizarEspecialidade(id: string, rawData: unknown): Promise<ActionResponse<Especialidade>> {
  const supabase = await createClient()
  const val = especialidadeSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: "Dados inválidos." }

  const { data, error } = await supabase.from("linhas_cuidado_especialidades").update(val.data).eq("id", id).select().single()
  if (error) return { success: false, error: error.message }

  revalidatePath("/especialidades")
  return { success: true, data }
}

export async function toggleAtivaEspecialidade(id: string, ativo: boolean): Promise<ActionResponse> {
  const supabase = await createClient()
  const { error } = await supabase.from("linhas_cuidado_especialidades").update({ ativo }).eq("id", id)
  if (error) return { success: false, error: error.message }
  revalidatePath("/especialidades")
  return { success: true }
}

// --- CONFIGURACOES: GRADES HORARIAS ---

export async function buscarGradesHorarias(): Promise<ActionResponse<GradeHoraria[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('grade_horaria')
    .select('id, dia_semana, horario_inicio, horario_fim, ativo, profissional_id, especialidade_id, profissional:profissionais(nome_completo)')
    .order('dia_semana').order('horario_inicio')
  if (error) return { success: false, error: error.message }
  return { success: true, data: data as unknown as GradeHoraria[] }
}

export async function salvarGradeHoraria(rawData: unknown): Promise<ActionResponse<GradeHoraria>> {
  const supabase = await createClient()
  const val = gradeHorariaSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: 'Dados invalidos.' }

  const { data, error } = await supabase.from('grade_horaria').upsert([val.data]).select().single()
  if (error) return { success: false, error: error.message }

  revalidatePath('/grades')
  return { success: true, data: data as unknown as GradeHoraria }
}

export async function toggleAtivaGradeHoraria(id: string, ativo: boolean): Promise<ActionResponse> {
  const supabase = await createClient()
  const { error } = await supabase.from('grade_horaria').update({ ativo }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/grades')
  return { success: true }
}

// --- CONFIGURACOES: PROFISSIONAIS ---

export async function buscarProfissionais(): Promise<ActionResponse<Profissional[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('profissionais')
    .select('id, nome_completo, nome_clinico, conselho_tipo, conselho_numero, perfil_acesso, ativo, cor_agenda, especialidades_permitidas')
    .order('nome_completo')
  if (error) return { success: false, error: error.message }
  return { success: true, data: data as unknown as Profissional[] }
}

export async function cadastrarProfissional(rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()
  const val = profissionalSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: 'Dados invalidos.' }

  const { error } = await supabase.from('profissionais').insert(val.data)
  if (error) return { success: false, error: error.message }
  revalidatePath('/profissionais')
  return { success: true }
}

export async function atualizarProfissional(id: string, rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()
  const val = profissionalSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: 'Dados invalidos.' }

  const { error } = await supabase.from('profissionais').update(val.data).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/profissionais')
  return { success: true }
}

export async function toggleAtivoProfissional(id: string, ativo: boolean): Promise<ActionResponse> {
  const supabase = await createClient()
  const { error } = await supabase.from('profissionais').update({ ativo }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/profissionais')
  return { success: true }
}

// --- PERFIL E SESSAO ---

export const getMeuPerfil = reactCache(async (): Promise<DadosUsuario | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    if (process.env.NODE_ENV === 'development') {
      return { perfil_acesso: 'Administracao', nome_completo: 'Dev Local', email: 'dev@cer2.local' }
    }
    return null
  }

  const { data: prof } = await supabase.from('profissionais').select('perfil_acesso, nome_completo').eq('id', user.id).single()
  if (!prof) return { perfil_acesso: 'Administracao', nome_completo: 'Administrador', email: user.email ?? '' }

  return { perfil_acesso: prof.perfil_acesso, nome_completo: prof.nome_completo, email: user.email ?? '' }
})

// --- COORDENACAO E ANALISES ---

export async function buscarAgendaCoordenacao(startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: vagas, error: errVagas } = await supabase.from('vagas_fixas').select(`
    id, horario_inicio, horario_fim, dia_semana, status_vaga, especialidade_id, profissional_id, paciente_id, data_inicio_contrato,
    pacientes (id, nome_completo, data_nascimento, cns, criado_em, data_ultimo_laudo, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte),
    profissionais (id, nome_completo),
    linhas_cuidado_especialidades (id, nome_especialidade)
  `).eq('status_vaga', 'Ativa')

  if (errVagas) return { success: false, error: errVagas.message }

  const { data: hist, error: errHist } = await supabase.from('agendamentos_historico').select(`
    id, data_hora_inicio, data_hora_fim, status_comparecimento, observacao, profissional_id, paciente_id, especialidade_id,
    pacientes (id, nome_completo, data_nascimento, cns, criado_em, data_ultimo_laudo, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte),
    profissionais (id, nome_completo),
    linhas_cuidado_especialidades (id, nome_especialidade)
  `).gte('data_hora_inicio', startDate).lte('data_hora_inicio', endDate)

  if (errHist) return { success: false, error: errHist.message }
  return { success: true, data: { vagas: (vagas as any) || [], hist: (hist as any) || [] } }
}

export async function buscarAlertasAbsenteismo(): Promise<ActionResponse<AlertaAbsenteismo[]>> {
  const supabase = await createClient()
  const { data: vagas, error: errVagas } = await supabase.from('vagas_fixas').select(`
    paciente_id,
    pacientes (id, nome_completo, cns, telefone_principal),
    linhas_cuidado_especialidades (nome_especialidade),
    profissionais (nome_completo)
  `).eq('status_vaga', 'Ativa')

  if (errVagas) return { success: false, error: errVagas.message }

  const pacientesUnicos = Array.from(new Set(vagas.map(v => v.paciente_id)))
  const alertas = []

  for (const pId of pacientesUnicos) {
    const { data: hist } = await supabase.from('agendamentos_historico').select('status_comparecimento, data_hora_inicio').eq('paciente_id', pId).order('data_hora_inicio', { ascending: false }).limit(3)
    if (!hist || hist.length < 3) continue

    const todasFaltas = hist.every(h => h.status_comparecimento === 'Falta Nao Justificada')
    if (todasFaltas) {
      const rawVaga = vagas.find(v => v.paciente_id === pId)
      if (rawVaga) {
        const paciente = Array.isArray(rawVaga.pacientes) ? rawVaga.pacientes[0] : rawVaga.pacientes
        const especialidade = (Array.isArray(rawVaga.linhas_cuidado_especialidades) ? rawVaga.linhas_cuidado_especialidades?.[0] : rawVaga.linhas_cuidado_especialidades) as any
        const profissional = (Array.isArray(rawVaga.profissionais) ? rawVaga.profissionais?.[0] : rawVaga.profissionais) as any

        if (paciente) {
          alertas.push({
            paciente: paciente as any,
            especialidade: especialidade?.nome_especialidade || 'N/A',
            profissional: profissional?.nome_completo || 'N/A',
            ultimas_faltas: hist.map(h => h.data_hora_inicio),
          })
        }
      }
    }
  }
  return { success: true, data: alertas }
}

export async function processarDesligamentoPorAbandono(pacienteId: string): Promise<ActionResponse> {
  const supabase = await createClient()
  await supabase.from('pacientes').update({ status_cadastro: 'Alta' }).eq('id', pacienteId)
  await supabase.from('vagas_fixas').update({ status_vaga: 'Encerrada', data_fim_contrato: new Date().toISOString() }).eq('paciente_id', pacienteId).eq('status_vaga', 'Ativa')
  revalidatePath('/absenteismo')
  revalidatePath('/pacientes')
  return { success: true }
}

export async function buscarVagasFixas(profissionalId: string): Promise<ActionResponse<VagaFixaComJoins[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('vagas_fixas').select(`
    id, horario_inicio, horario_fim, dia_semana, status_vaga, especialidade_id, profissional_id, paciente_id, data_inicio_contrato, data_fim_contrato,
    pacientes (id, nome_completo, data_nascimento, cns, criado_em, data_ultimo_laudo, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte),
    profissionais (id, nome_completo),
    linhas_cuidado_especialidades (id, nome_especialidade)
  `).eq('profissional_id', profissionalId).eq('status_vaga', 'Ativa')

  if (error) return { success: false, error: error.message }
  return { success: true, data: (data as unknown as VagaFixaComJoins[]) || [] }
}

export async function encerrarVagaFixa(vagaId: string): Promise<ActionResponse> {
  const supabase = await createClient()
  await supabase.from('vagas_fixas').update({ status_vaga: 'Encerrada', data_fim_contrato: new Date().toISOString() }).eq('id', vagaId)
  revalidatePath('/configuracoes')
  revalidatePath('/agenda')
  return { success: true }
}

export async function buscarHistoricoClinicoPaciente(pacienteId: string): Promise<ActionResponse<AgendamentoHistoricoComJoins[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('agendamentos_historico').select(`
    id, data_hora_inicio, data_hora_fim, status_comparecimento, observacao, profissional_id, paciente_id, especialidade_id,
    pacientes (id, nome_completo, data_nascimento, cns, criado_em, data_ultimo_laudo, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte),
    profissionais (id, nome_completo),
    linhas_cuidado_especialidades (id, nome_especialidade)
  `).eq('paciente_id', pacienteId).order('data_hora_inicio', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data: (data as unknown as AgendamentoHistoricoComJoins[]) || [] }
}

export async function buscarMeusAtendimentos(data: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Usuario nao autenticado' }
  return buscarAgendaData(user.id, `${data}T00:00:00Z`, `${data}T23:59:59Z`)
}

export async function buscarMeusPacientesVagaFixa(): Promise<ActionResponse<Paciente[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Usuario nao autenticado' }

  const { data, error } = await supabase.from('vagas_fixas')
    .select('pacientes(id, nome_completo, cns, data_nascimento, status_cadastro)')
    .eq('profissional_id', user.id)
    .eq('status_vaga', 'Ativa')

  if (error) return { success: false, error: error.message }

  const listaPacientes: Paciente[] = []
  const idsVistos = new Set<string>()
  if (data) {
    data.forEach((v: any) => {
      const p = v.pacientes
      if (p && !idsVistos.has(p.id)) {
        idsVistos.add(p.id)
        listaPacientes.push(p)
      }
    })
  }

  return { success: true, data: listaPacientes }
}

// --- FILA DE ESPERA ---

export async function buscarFilaEspera(params: {
  page?: number,
  pageSize?: number,
  status?: string,
  especialidade?: string,
  judicial?: boolean,
  busca?: string
} = {}): Promise<ActionResponse<{ data: PacienteFila[], total: number }>> {
  const { page = 1, pageSize = 20, status = 'ativos', especialidade = 'todas', judicial = false, busca = '' } = params
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('fila_espera')
    .select(`
      id, data_entrada_fila, nivel_prioridade, status_fila, numero_processo_judicial, faltas_consecutivas,
      pacientes (id, nome_completo, cns),
      linhas_cuidado_especialidades (id, nome_especialidade)
    `, { count: 'exact' })

  // Filtros Server-side (Escalabilidade v7.4)
  if (status !== 'todos') {
    if (status === 'ativos') {
      query = query.in('status_fila', ['Aguardando', 'Em Atendimento', 'Em Risco'])
    } else {
      query = query.eq('status_fila', status)
    }
  }

  if (especialidade !== 'todas') {
    query = query.eq('especialidade_id', especialidade)
  }

  if (judicial) {
    query = query.eq('nivel_prioridade', 'Mandado Judicial')
  }

  if (busca.trim().length > 0) {
    // Busca no join pacientes (PostgREST suporta filtro em join via dot notation)
    query = query.or(`nome_completo.ilike.%${busca}%,cns.ilike.%${busca}%`, { foreignTable: 'pacientes' })
  }

  const { data, error, count } = await query
    .order('nivel_prioridade', { ascending: true })
    .order('data_entrada_fila', { ascending: true })
    .range(from, to)

  if (error) return { success: false, error: error.message }

  const hoje = new Date()
  const filaMapped = (data as any[] || []).map(r => {
    const diffDays = Math.ceil(Math.abs(hoje.getTime() - new Date(r.data_entrada_fila).getTime()) / (1000 * 60 * 60 * 24))
    return {
      id: r.id,
      nome: r.pacientes?.nome_completo || 'Desconhecido',
      cns: r.pacientes?.cns || 'S/N',
      prioridade: r.nivel_prioridade,
      status: r.status_fila,
      especialidade: r.linhas_cuidado_especialidades?.nome_especialidade || 'N/A',
      data_encaminhamento: r.data_entrada_fila,
      dias_espera: diffDays,
      profissional_nome: null,
      faltas: r.faltas_consecutivas || 0,
      numeroProcesso: r.numero_processo_judicial,
    }
  })

  return { success: true, data: { data: filaMapped, total: count || 0 } }
}

export async function buscarFilaJudicial(): Promise<ActionResponse<PacienteFila[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('fila_espera').select(`
    id, data_entrada_fila, nivel_prioridade, status_fila, numero_processo_judicial, faltas_consecutivas,
    pacientes (nome_completo, cns),
    linhas_cuidado_especialidades (nome_especialidade)
  `).eq('nivel_prioridade', 'Mandado Judicial')
    .in('status_fila', ['Aguardando', 'Em Atendimento', 'Em Risco'])
    .order('data_entrada_fila', { ascending: true })

  if (error) return { success: false, error: error.message }

  const hoje = new Date()
  const filaMapped = (data as any[] || []).map(r => {
    const diffDays = Math.ceil(Math.abs(hoje.getTime() - new Date(r.data_entrada_fila).getTime()) / (1000 * 60 * 60 * 24))
    return {
      id: r.id,
      nome: r.pacientes?.nome_completo || 'Desconhecido',
      cns: r.pacientes?.cns || 'S/N',
      prioridade: r.nivel_prioridade,
      status: r.status_fila,
      especialidade: r.linhas_cuidado_especialidades?.nome_especialidade || 'N/A',
      data_encaminhamento: r.data_entrada_fila,
      dias_espera: diffDays,
      profissional_nome: null,
      faltas: r.faltas_consecutivas || 0,
      numeroProcesso: r.numero_processo_judicial,
    }
  })
  return { success: true, data: filaMapped }
}

// --- SOCIAL ---

export async function cadastrarAvaliacaoSocial(rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()
  const val = avaliacaoServicoSocialSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: val.error.issues.map(i => i.message).join(', ') }

  const { error } = await supabase.from('avaliacoes_servico_social').insert(val.data)
  if (error) return { success: false, error: error.message }

  revalidatePath('/pacientes')
  return { success: true }
}
