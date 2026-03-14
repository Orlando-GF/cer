"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { 
  cadastroFilaSchema, 
  faltaFilaSchema,
  statusFilaSchema,
  incluirNaFilaSchema,
  type CadastroFilaInput,
  type FaltaFilaInput,
  type StatusFilaInput,
  type IncluirNaFilaInput,
  type VagaFixaInput,
  type AgendamentoHistoricoInput,
  type ProfissionalInput,
  type EspecialidadeInput,
  type GradeHorariaInput,
  pacienteSchema,
  vagaFixaSchema,
  agendamentoHistoricoSchema,
  profissionalSchema
} from "@/lib/validations/schema"

export type ActionResponse = {
  success: boolean
  error?: string
}

export async function buscarPacientes() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .order("id", { ascending: false }) // Fallback seguro se criado_em não existir, ou usar id

  if (error) {
    return { success: false, error: `Erro ao buscar pacientes: ${error.message}` }
  }

  return { success: true, data }
}

export async function cadastrarPaciente(rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()

  // Validação Guard: Dados inválidos interrompem o fluxo imediatamente
  const validation = pacienteSchema.safeParse(rawData)
  if (!validation.success) {
    const errorMsg = validation.error.issues.map((i) => i.message).join(", ")
    return { success: false, error: errorMsg }
  }

  const { data } = validation
  const { error } = await supabase.from("pacientes").insert({
    cns: data.cns,
    cpf: data.cpf || null,
    nome_completo: data.nome_completo,
    data_nascimento: data.data_nascimento,
    sexo: data.sexo,
    nome_mae: data.nome_mae,
    nome_pai: data.nome_pai || null,
    pactuado: data.pactuado,
    municipio_pactuado: data.municipio_pactuado || null,
    cidade: data.cidade,
    uf: data.uf,
    cid_principal: data.cid_principal || null,
    cid_secundario: data.cid_secundario || null,
    necessita_transporte: data.necessita_transporte,
    tags_acessibilidade: data.tags_acessibilidade,
  })

  // Tratamento de erros Guard
  if (error) {
    // Erro de tupla duplicada (CNS/CPF)
    if (error.code === "23505") return { success: false, error: "Conflito: CNS ou CPF já cadastrado." }
    return { success: false, error: `Erro ao cadastrar paciente: ${error.message}` }
  }

  revalidatePath("/pacientes")
  return { success: true }
}

export async function atualizarPaciente(id: string, rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()

  const validation = pacienteSchema.safeParse(rawData)
  if (!validation.success) {
    const errorMsg = validation.error.issues.map((i) => i.message).join(", ")
    return { success: false, error: errorMsg }
  }

  const { data } = validation
  const { error } = await supabase
    .from("pacientes")
    .update({
      cns: data.cns,
      cpf: data.cpf || null,
      nome_completo: data.nome_completo,
      data_nascimento: data.data_nascimento,
      sexo: data.sexo,
      nome_mae: data.nome_mae,
      nome_pai: data.nome_pai || null,
      pactuado: data.pactuado,
      municipio_pactuado: data.municipio_pactuado || null,
      cidade: data.cidade,
      uf: data.uf,
      cid_principal: data.cid_principal || null,
      cid_secundario: data.cid_secundario || null,
      necessita_transporte: data.necessita_transporte,
      tags_acessibilidade: data.tags_acessibilidade,
    })
    .eq("id", id)

  if (error) {
    if (error.code === "23505") return { success: false, error: "Conflito: CNS ou CPF já cadastrado num outro paciente." }
    return { success: false, error: `Erro ao atualizar paciente: ${error.message}` }
  }

  revalidatePath("/pacientes")
  return { success: true }
}

export async function buscarPacientePorDocumento(documento: string) {
  const supabase = await createClient()
  const docLimpo = documento.replace(/\D/g, "")
  
  const query = supabase.from("pacientes").select("*")
  
  if (docLimpo.length === 11) {
    query.eq("cpf", docLimpo)
  } else {
    query.eq("cns", docLimpo)
  }

  const { data, error } = await query.single()

  if (error || !data) {
    return { success: false, data: null }
  }

  return { success: true, data }
}

export async function incluirPacienteNaFila(rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()

  const validation = incluirNaFilaSchema.safeParse(rawData)
  if (!validation.success) {
    const errorMsg = validation.error.issues.map((i) => i.message).join(", ")
    return { success: false, error: errorMsg }
  }

  const { data } = validation
  const { error } = await supabase.from("fila_espera").insert({
    paciente_id: data.paciente_id,
    especialidade_id: data.especialidade_id,
    nivel_prioridade: data.nivel_prioridade,
    numero_processo_judicial: data.nivel_prioridade === "Mandado Judicial" ? data.numero_processo_judicial : null,
    origem_encaminhamento: data.origem_encaminhamento,
    frequencia_recomendada: data.frequencia_recomendada,
    status_fila: "Aguardando",
  })

  if (error) {
    if (error.code === "23505") return { success: false, error: "Este paciente já se encontra aguardando fila para esta especialidade." }
    return { success: false, error: `Erro ao inserir na fila: ${error.message}` }
  }

  revalidatePath("/")
  return { success: true }
}

export async function registrarFaltaPaciente(rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()

  const validation = faltaFilaSchema.safeParse(rawData)
  if (!validation.success) return { success: false, error: "Dados de falta inválidos." }

  const { data } = validation
  const authUser = await supabase.auth.getUser()
  const usuarioId = authUser.data.user?.id || null

  // Guard: Verificar existência do registro na fila
  const { data: filaAtual, error: errFila } = await supabase
    .from("fila_espera")
    .select("faltas_consecutivas")
    .eq("id", data.fila_id)
    .single()

  if (errFila) return { success: false, error: "Paciente não encontrado na fila." }

  const novasFaltas = (filaAtual.faltas_consecutivas || 0) + 1

  // Guard: Falha no registro de auditoria
  const { error: errRegistro } = await supabase
    .from("faltas_registros")
    .insert({
      fila_id: data.fila_id,
      justificada: data.justificada,
      observacao: data.observacao || null,
      registrado_por: usuarioId
    })

  if (errRegistro) return { success: false, error: `Erro ao salvar registro de falta: ${errRegistro.message}` }

  // Atualização final (O Trigger no Postgres mudará para "Em Risco" se >= 3)
  const { error: errUpdate } = await supabase
    .from("fila_espera")
    .update({ faltas_consecutivas: novasFaltas })
    .eq("id", data.fila_id)

  if (errUpdate) return { success: false, error: `Erro ao atualizar contagem de faltas: ${errUpdate.message}` }

  revalidatePath("/")
  return { success: true }
}

export async function alterarStatusFila(rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()

  const validation = statusFilaSchema.safeParse(rawData)
  if (!validation.success) return { success: false, error: "Status inválido." }

  const { data } = validation
  const { error } = await supabase
    .from("fila_espera")
    .update({ status_fila: data.novo_status })
    .eq("id", data.fila_id)

  if (error) return { success: false, error: `Erro ao atualizar status: ${error.message}` }

  revalidatePath("/")
  return { success: true }
}

export async function buscarHistoricoFaltas(filaId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("faltas_registros")
    .select("id, data_falta, justificada, observacao, criado_em")
    .eq("fila_id", filaId)
    .order("data_falta", { ascending: false })
    .limit(10)

  if (error) {
    return { success: false, error: `Erro ao buscar histórico: ${error.message}` }
  }

  return { success: true, data }
}

// ─── AGENDA E EVOLUÇÃO ───────────────────────────────────────────────────────

export async function salvarVagaFixa(rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()
  const val = vagaFixaSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: "Dados inválidos para Vaga Fixa." }

  const { error } = await supabase.from("vagas_fixas").upsert(val.data)
  if (error) return { success: false, error: `Erro ao salvar vaga: ${error.message}` }

  revalidatePath("/agenda")
  return { success: true }
}

export async function registrarSessaoHistorico(rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()
  const val = agendamentoHistoricoSchema.safeParse(rawData)
  if (!val.success) {
    const msg = val.error.issues.map(i => i.message).join(", ")
    return { success: false, error: `Dados inválidos: ${msg}` }
  }

  // Auditoria: Buscar estado anterior se for um update
  let dadosAnteriores = null
  const { data: id } = val.data as any
  if (id) {
    const { data: existing } = await supabase.from("agendamentos_historico").select("*").eq("id", id).single()
    dadosAnteriores = existing
  }

  const { data: novo, error } = await supabase.from("agendamentos_historico").upsert(val.data).select().single()
  
  if (error) return { success: false, error: `Erro ao materializar sessão: ${error.message}` }

  // Registrar Log de Auditoria (Item 8)
  await registrarLogAuditoria({
    agendamento_id: novo.id,
    acao: id ? 'EDITAR' : 'CRIAR',
    dados_anteriores: dadosAnteriores,
    dados_novos: novo
  })

  revalidatePath("/agenda")
  return { success: true }
}

async function registrarLogAuditoria(params: {
  agendamento_id: string,
  acao: string,
  dados_anteriores: any,
  dados_novos: any
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  await supabase.from("agendamentos_logs").insert({
    agendamento_id: params.agendamento_id,
    usuario_id: user?.id || null,
    acao: params.acao,
    dados_anteriores: params.dados_anteriores,
    dados_novos: params.dados_novos
  })
}

export async function buscarAgendaData(profissionalId: string, startDate: string, endDate: string) {
  const supabase = await createClient()

  // 1. Buscar Regras (Vagas Fixas)
  const { data: vagas, error: errVagas } = await supabase
    .from("vagas_fixas")
    .select(`
      *,
      pacientes (id, nome_completo, data_nascimento, cns, criado_em),
      profissionais (id, nome_completo),
      linhas_cuidado_especialidades (id, nome_especialidade)
    `)
    .eq("profissional_id", profissionalId)
    .eq("status_vaga", "Ativa")

  if (errVagas) return { success: false, error: errVagas.message }

  // 2. Buscar Materializações (Histórico)
  const { data: hist, error: errHist } = await supabase
    .from("agendamentos_historico")
    .select(`
      *,
      pacientes (id, nome_completo, data_nascimento, cns, criado_em),
      profissionais (id, nome_completo),
      linhas_cuidado_especialidades (id, nome_especialidade)
    `)
    .eq("profissional_id", profissionalId)
    .gte("data_hora_inicio", startDate)
    .lte("data_hora_inicio", endDate)

  if (errHist) return { success: false, error: errHist.message }

  return { success: true, data: { vagas, hist } }
}

export async function buscarAgendaLogistica(startDate: string, endDate: string) {
  const supabase = await createClient()

  // 1. Vagas Fixas globais (regra)
  const { data: vagas, error: errVagas } = await supabase
    .from("vagas_fixas")
    .select(`
      *,
      pacientes (id, nome_completo, endereco_cep, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte, criado_em),
      profissionais (id, nome_completo),
      linhas_cuidado_especialidades (id, nome_especialidade)
    `)
    .eq("status_vaga", "Ativa")
    .filter("pacientes.necessita_transporte", "eq", true)

  if (errVagas) return { success: false, error: errVagas.message }

  // 2. Histórico global (materializado)
  const { data: hist, error: errHist } = await supabase
    .from("agendamentos_historico")
    .select(`
      *,
      pacientes (id, nome_completo, endereco_cep, logradouro, numero, bairro, cidade, tags_acessibilidade, necessita_transporte, criado_em),
      profissionais (id, nome_completo),
      linhas_cuidado_especialidades (id, nome_especialidade)
    `)
    .gte("data_hora_inicio", startDate)
    .lte("data_hora_inicio", endDate)
    .filter("pacientes.necessita_transporte", "eq", true)

  if (errHist) return { success: false, error: errHist.message }

  return { success: true, data: { vagas, hist } }
}


export async function buscarProfissionais() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profissionais")
    .select("*, especialidades_permitidas")
    .eq("ativo", true)
    .order("nome_completo")
  
  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function buscarEspecialidades() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("linhas_cuidado_especialidades")
    .select("*")
    .order("nome_especialidade")

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function cadastrarEspecialidade(dados: EspecialidadeInput) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("linhas_cuidado_especialidades")
    .insert([dados])
    .select()

  if (error) return { success: false, error: `Erro ao cadastrar especialidade: ${error.message}` }
  
  revalidatePath("/especialidades")
  return { success: true, data }
}

// ─── grades horárias ────────────────────────────────────────────────────────

export async function buscarGradesHorarias() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("grade_horaria")
    .select(`
      *,
      profissional:profissionais(nome_completo)
    `)
    .order("dia_semana")
    .order("horario_inicio")

  if (error) return { success: false, error: `Erro ao buscar grades horárias: ${error.message}` }
  return { success: true, data }
}

export async function salvarGradeHoraria(dados: GradeHorariaInput) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("grade_horaria")
    .upsert([dados])
    .select()

  if (error) return { success: false, error: `Erro ao salvar grade horária: ${error.message}` }
  
  revalidatePath("/grades")
  return { success: true, data }
}

export async function cadastrarProfissional(rawData: unknown): Promise<ActionResponse> {
  const supabase = await createClient()
  const validation = profissionalSchema.safeParse(rawData)

  if (!validation.success) {
    const errorMsg = validation.error.issues.map((i) => i.message).join(", ")
    return { success: false, error: errorMsg }
  }

  const { error } = await supabase.from("profissionais").insert(validation.data)
  if (error) return { success: false, error: `Erro ao cadastrar profissional: ${error.message}` }

  revalidatePath("/configuracoes")
  return { success: true }
}

export async function getMeuPerfil() {
  const supabase = await createClient()
  const authUser = await supabase.auth.getUser()
  const user = authUser.data.user
  
  // Guard: Se em desenvolvimento e não houver usuário logado, permite auditoria como Administracao
  if (process.env.NODE_ENV === 'development' && !user) return "Administracao"
  
  if (!user) return null

  const { data, error } = await supabase
    .from("profissionais")
    .select("perfil_acesso")
    .eq("id", user.id)
    .single()

  if (error || !data) return "Administracao"
  
  return data.perfil_acesso
}

export async function buscarAgendaCoordenação(startDate: string, endDate: string) {
  const supabase = await createClient()

  // 1. Vagas Fixas globais (regra)
  const { data: vagas, error: errVagas } = await supabase
    .from("vagas_fixas")
    .select(`
      *,
      pacientes (id, nome_completo, data_nascimento, cns, criado_em),
      profissionais (id, nome_completo),
      linhas_cuidado_especialidades (id, nome_especialidade)
    `)
    .eq("status_vaga", "Ativa")

  if (errVagas) return { success: false, error: errVagas.message }

  // 2. Histórico global (materializado)
  const { data: hist, error: errHist } = await supabase
    .from("agendamentos_historico")
    .select(`
      *,
      pacientes (id, nome_completo, data_nascimento, cns, criado_em),
      profissionais (id, nome_completo),
      linhas_cuidado_especialidades (id, nome_especialidade)
    `)
    .gte("data_hora_inicio", startDate)
    .lte("data_hora_inicio", endDate)

  if (errHist) return { success: false, error: errHist.message }

  return { success: true, data: { vagas, hist } }
}

export async function buscarAlertasAbsenteismo() {
  const supabase = await createClient()
  
  // Guard: Buscar vagas ativas para análise de absenteísmo
  const { data: vagas, error: errVagas } = await supabase
    .from("vagas_fixas")
    .select(`
      paciente_id,
      pacientes (id, nome_completo, cns, telefone_principal),
      linhas_cuidado_especialidades (nome_especialidade),
      profissionais (nome_completo)
    `)
    .eq("status_vaga", "Ativa")

  if (errVagas) return { success: false, error: errVagas.message }

  // Remover duplicatas de paciente (um paciente pode ter várias especialidades)
  const pacientesUnicos = Array.from(new Set(vagas.map(v => v.paciente_id)))
  const alertas = []

  for (const pId of pacientesUnicos) {
    const { data: hist } = await supabase
      .from("agendamentos_historico")
      .select("status_comparecimento, data_hora_inicio")
      .eq("paciente_id", pId)
      .order("data_hora_inicio", { ascending: false })
      .limit(3)

    // Logica Guard: Apenas pacientes com pelo menos 3 registros
    if (!hist || hist.length < 3) continue

    const todasFaltas = hist.every(h => 
      h.status_comparecimento === "Falta Nao Justificada"
    )
    
    if (todasFaltas) {
      const infoVaga: any = vagas.find(v => v.paciente_id === pId)
      if (infoVaga?.pacientes) {
        alertas.push({
          paciente: infoVaga.pacientes,
          especialidade: infoVaga.linhas_cuidado_especialidades?.nome_especialidade || "N/A",
          profissional: infoVaga.profissionais?.nome_completo || "N/A",
          ultimas_faltas: hist.map(h => h.data_hora_inicio)
        })
      }
    }
  }

  return { success: true, data: alertas }
}

export async function processarDesligamentoPorAbandono(pacienteId: string) {
  const supabase = await createClient()
  
  // 1. Atualizar status do paciente para 'Alta'
  const { error: errPac } = await supabase
    .from("pacientes")
    .update({ status_cadastro: "Alta" })
    .eq("id", pacienteId)

  if (errPac) return { success: false, error: errPac.message }

  // 2. Encerrar todas as vagas fixas ativas do paciente
  const { error: errVagas } = await supabase
    .from("vagas_fixas")
    .update({ status_vaga: "Encerrada", data_fim_contrato: new Date().toISOString() })
    .eq("paciente_id", pacienteId)
    .eq("status_vaga", "Ativa")

  if (errVagas) return { success: false, error: errVagas.message }

  // 3. Registrar log de auditoria simplificado (Poderia ser expandido)
  // await registrarSessaoHistorico(...) // Aqui caberia um log de sistema

  revalidatePath("/absenteismo")
  revalidatePath("/pacientes")
  
  return { success: true }
}


