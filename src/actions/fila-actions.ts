'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  faltaFilaSchema,
  incluirNaFilaSchema,
  statusFilaSchema,
} from '@/lib/validations/schema'
import {
  type ActionResponse,
  type FaltaRegistro,
  type PacienteFilaTerapia,
} from '@/types'

// ==========================================
// FILA DE ESPERA
// ==========================================

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

export async function adicionarPacienteFila(
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

  revalidatePath('/fila')
  return { success: true }
}

// Mantido como alias para retrocompatibilidade interna
export const incluirPacienteNaFila = adicionarPacienteFila

export async function atualizarStatusFila(
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

// Mantido como alias para retrocompatibilidade interna
export const alterarStatusFila = atualizarStatusFila

export async function registrarFaltaFila(
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

  revalidatePath('/fila')
  revalidatePath('/absenteismo')
  return { success: true }
}

// Mantido como alias para retrocompatibilidade interna
export const registrarFaltaPaciente = registrarFaltaFila

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
