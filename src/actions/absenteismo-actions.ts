'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  type ActionResponse,
  type AlertaAbsenteismo,
  type Paciente,
} from '@/types'

// ==========================================
// UTILITÁRIOS INTERNOS
// ==========================================

function extrairJoin<T>(relacionamento: unknown): T | null {
  if (!relacionamento) return null
  if (Array.isArray(relacionamento)) return (relacionamento[0] as T) || null
  return relacionamento as T
}

// ==========================================
// SCHEMAS DE VALIDAÇÃO LOCAIS
// ==========================================

const justificarFaltaSchema = z.object({
  agendamentoId: z.string().uuid('ID do agendamento inválido.'),
  motivo: z.string().min(5, 'O motivo deve ter no mínimo 5 caracteres.').max(500),
})

const registrarContatoSchema = z.object({
  agendamentoId: z.string().uuid('ID do agendamento inválido.'),
  tipoContato: z.enum(['Ligação', 'WhatsApp', 'Presencial']),
  observacao: z.string().max(500).optional().nullable(),
})

// ==========================================
// TIPOS ESPECÍFICOS DO MÓDULO
// ==========================================

export interface FaltaRecente {
  id: string
  data_hora_inicio: string
  data_hora_fim: string | null
  status_comparecimento: string
  paciente: Partial<Paciente> & { telefone_principal?: string | null }
  especialidade: string
  profissional: string
}

// ==========================================
// QUERIES
// ==========================================

/**
 * Busca faltas (justificadas e não justificadas) dos últimos 30 dias.
 * Retorna dados enriquecidos com joins de paciente, especialidade e profissional.
 */
export async function buscarFaltasRecentes(): Promise<
  ActionResponse<FaltaRecente[]>
> {
  try {
    const supabase = await createClient()

    const trintaDiasAtras = new Date()
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)

    const { data, error } = await supabase
      .from('agendamentos_historico')
      .select(
        `
        id, data_hora_inicio, data_hora_fim, status_comparecimento,
        pacientes (id, nome_completo, cns, data_nascimento, telefone_principal),
        profissionais (id, nome_completo),
        linhas_cuidado_especialidades (id, nome_especialidade)
      `,
      )
      .in('status_comparecimento', ['Falta Nao Justificada', 'Falta Justificada'])
      .gte('data_hora_inicio', trintaDiasAtras.toISOString())
      .order('data_hora_inicio', { ascending: false })

    if (error) return { success: false, error: error.message }

    const faltas: FaltaRecente[] = (data || []).map(
      (item: Record<string, unknown>) => {
        const paciente = extrairJoin<Partial<Paciente> & { telefone_principal?: string | null }>(
          item.pacientes,
        )
        const profissionalJoin = extrairJoin<{ nome_completo: string }>(
          item.profissionais,
        )
        const especialidadeJoin = extrairJoin<{ nome_especialidade: string }>(
          item.linhas_cuidado_especialidades,
        )
        return {
          id: item.id as string,
          data_hora_inicio: item.data_hora_inicio as string,
          data_hora_fim: item.data_hora_fim as string | null,
          status_comparecimento: item.status_comparecimento as string,
          paciente: paciente ?? {},
          especialidade: especialidadeJoin?.nome_especialidade ?? 'N/A',
          profissional: profissionalJoin?.nome_completo ?? 'N/A',
        }
      },
    )

    return { success: true, data: faltas }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar faltas recentes',
    }
  }
}

/**
 * Busca alertas de 3 faltas consecutivas — regra de desligamento por abandono.
 * Mantida em paralelo a buscarFaltasRecentes para o painel de alertas críticos.
 */
export async function buscarAlertasAbsenteismo(): Promise<
  ActionResponse<AlertaAbsenteismo[]>
> {
  try {
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
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar alertas',
    }
  }
}

// ==========================================
// MUTAÇÕES
// ==========================================

/**
 * Justifica uma falta: atualiza o status para "Falta Justificada" e
 * registra o motivo no campo evolucao_clinica.
 */
export async function justificarFalta(rawData: unknown): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const val = justificarFaltaSchema.safeParse(rawData)
    if (!val.success)
      return {
        success: false,
        error: val.error.issues.map((i) => i.message).join(', '),
      }

    const { agendamentoId, motivo } = val.data

    const { error } = await supabase
      .from('agendamentos_historico')
      .update({
        status_comparecimento: 'Falta Justificada',
        evolucao_clinica: `Justificativa: ${motivo}`,
      })
      .eq('id', agendamentoId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/absenteismo')
    return { success: true }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao justificar falta',
    }
  }
}

/**
 * Regista que a receção entrou em contato com o paciente para repescagem.
 * Recebe o agendamento_id da sessão com falta e extrai paciente_id e
 * especialidade_id diretamente desse registo — sem dependência de vaga ativa.
 */
export async function registrarContatoRepescagem(
  rawData: unknown,
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const val = registrarContatoSchema.safeParse(rawData)
    if (!val.success)
      return {
        success: false,
        error: val.error.issues.map((i) => i.message).join(', '),
      }

    const { agendamentoId, tipoContato, observacao } = val.data
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Extrai paciente_id e especialidade_id diretamente da sessão com falta
    const { data: sessao, error: errSessao } = await supabase
      .from('agendamentos_historico')
      .select('paciente_id, especialidade_id')
      .eq('id', agendamentoId)
      .single()

    if (errSessao || !sessao)
      return {
        success: false,
        error: 'Sessão não encontrada para registar o contato.',
      }

    // Busca o profissional autenticado (opcional — fallback para null)
    const { data: prof } = await supabase
      .from('profissionais')
      .select('id')
      .eq('usuario_auth_id', user?.id ?? '')
      .maybeSingle()

    const agora = new Date().toISOString()

    const { error } = await supabase.from('agendamentos_historico').insert({
      paciente_id: sessao.paciente_id,
      profissional_id: prof?.id ?? null,
      especialidade_id: sessao.especialidade_id,
      data_hora_inicio: agora,
      data_hora_fim: agora,
      status_comparecimento: 'Cancelado',
      tipo_vaga: 'Regular',
      evolucao_clinica: `Contato de repescagem (${tipoContato}): ${observacao ?? 'Sem observações.'}`,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/absenteismo')
    return { success: true }
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao registrar contato',
    }
  }
}

/**
 * Processa o desligamento por abandono: marca o paciente como Alta
 * e encerra todas as vagas fixas ativas.
 */
export async function processarDesligamentoPorAbandono(
  pacienteId: string,
): Promise<ActionResponse> {
  try {
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

    // Log de auditoria
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('logs_auditoria') as any).insert({
        tabela_afetada: 'pacientes',
        registro_id: pacienteId,
        acao: 'UPDATE',
        dados_antigos: { paciente: dadosAntigos, vagas: vagasAntigas },
        dados_novos: {
          status_cadastro: 'Alta',
          vagas_encerradas: vagasAntigas?.map((v) => v.id),
        },
        autor_id: user?.id ?? null,
      })
    } catch (e) {
      console.error('[Auditoria] Falha ao registar log de abandono:', e)
    }

    revalidatePath('/absenteismo')
    revalidatePath('/pacientes')
    return { success: true }
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao processar desligamento',
    }
  }
}
