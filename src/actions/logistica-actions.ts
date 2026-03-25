'use server'

import { createClient } from '@/utils/supabase/server'
import { type ActionResponse } from '@/types'
import { startOfDay, endOfDay, parseISO } from 'date-fns'

// ==========================================
// TIPOS DO MÓDULO
// ==========================================

export interface PacienteRota {
  /** ID do registo de agendamento/histórico */
  agendamentoId: string
  /** ID da vaga fixa (pode ser undefined para sessões avulsas) */
  vagaFixaId?: string
  pacienteId: string
  pacienteNome: string
  profissionalNome: string
  especialidadeNome: string
  horarioInicio: string
  horarioFim: string | null
  logradouro: string | null
  numero: string | null
  bairro: string | null
  cidade: string | null
  tagsAcessibilidade: string[]
}

export interface GrupoBairro {
  bairro: string
  pacientes: PacienteRota[]
}

// ==========================================
// UTILITÁRIO INTERNO
// ==========================================

function extrairJoin<T>(relacionamento: unknown): T | null {
  if (!relacionamento) return null
  if (Array.isArray(relacionamento)) return (relacionamento[0] as T) || null
  return relacionamento as T
}

// ==========================================
// QUERY PRINCIPAL
// ==========================================

const SELECT_ROTA = `
  id, horario_inicio, horario_fim, dia_semana, data_inicio_contrato,
  pacientes!inner (
    id, nome_completo, logradouro, numero, bairro, cidade,
    tags_acessibilidade, necessita_transporte
  ),
  profissionais (id, nome_completo),
  linhas_cuidado_especialidades (id, nome_especialidade)
`

const SELECT_HIST_ROTA = `
  id, data_hora_inicio, data_hora_fim,
  pacientes!inner (
    id, nome_completo, logradouro, numero, bairro, cidade,
    tags_acessibilidade, necessita_transporte
  ),
  profissionais (id, nome_completo),
  linhas_cuidado_especialidades (id, nome_especialidade)
`

/**
 * Busca todas as rotas do dia (vagas fixas projetadas + histórico registado)
 * filtradas apenas por pacientes que necessitam de transporte.
 * Agrupa o resultado por bairro para facilitar a roteirização.
 */
export async function buscarRotasDoDia(
  dataIso: string,
): Promise<ActionResponse<GrupoBairro[]>> {
  try {
    const supabase = await createClient()
    const dia = parseISO(dataIso)
    const inicioUTC = startOfDay(dia).toISOString()
    const fimUTC = endOfDay(dia).toISOString()

    // Dia da semana em português para comparar com vagas fixas
    const diaSemanaMap: Record<number, string> = {
      0: 'Domingo',
      1: 'Segunda',
      2: 'Terca',
      3: 'Quarta',
      4: 'Quinta',
      5: 'Sexta',
      6: 'Sabado',
    }
    const diaSemana = diaSemanaMap[dia.getDay()] ?? 'Segunda'

    // 1. Vagas fixas do dia — com inner join em pacientes.necessita_transporte
    const { data: vagas, error: errVagas } = await supabase
      .from('vagas_fixas')
      .select(SELECT_ROTA)
      .eq('status_vaga', 'Ativa')
      // dia_semana armazenado como texto no banco
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('dia_semana', diaSemana as any)
      .filter('pacientes.necessita_transporte', 'eq', true)

    if (errVagas) return { success: false, error: errVagas.message }

    // 2. Sessões já materializadas no histórico do dia
    const { data: hist, error: errHist } = await supabase
      .from('agendamentos_historico')
      .select(SELECT_HIST_ROTA)
      .gte('data_hora_inicio', inicioUTC)
      .lte('data_hora_inicio', fimUTC)
      .not('status_comparecimento', 'in', '("Falta Nao Justificada","Falta Justificada","Cancelado")')
      .filter('pacientes.necessita_transporte', 'eq', true)

    if (errHist) return { success: false, error: errHist.message }

    // ── Mapear vagas fixas ────────────────────────────────────────────────────
    const pacientesDeVagaFixa = new Set<string>()
    const rotas: PacienteRota[] = []

    for (const v of vagas ?? []) {
      const pac = extrairJoin<{
        id: string
        nome_completo: string
        logradouro: string | null
        numero: string | null
        bairro: string | null
        cidade: string | null
        tags_acessibilidade: string[] | null
        necessita_transporte: boolean | null
      }>(v.pacientes)

      if (!pac?.necessita_transporte) continue

      const prof = extrairJoin<{ nome_completo: string }>(v.profissionais)
      const esp = extrairJoin<{ nome_especialidade: string }>(
        v.linhas_cuidado_especialidades,
      )

      pacientesDeVagaFixa.add(pac.id)
      rotas.push({
        agendamentoId: v.id,
        vagaFixaId: v.id,
        pacienteId: pac.id,
        pacienteNome: pac.nome_completo,
        profissionalNome: prof?.nome_completo ?? 'N/A',
        especialidadeNome: esp?.nome_especialidade ?? 'N/A',
        horarioInicio: v.horario_inicio,
        horarioFim: v.horario_fim,
        logradouro: pac.logradouro,
        numero: pac.numero,
        bairro: pac.bairro,
        cidade: pac.cidade,
        tagsAcessibilidade: pac.tags_acessibilidade ?? [],
      })
    }

    // ── Mapear histórico (evita duplicar com vagas fixas) ─────────────────────
    for (const h of hist ?? []) {
      const pac = extrairJoin<{
        id: string
        nome_completo: string
        logradouro: string | null
        numero: string | null
        bairro: string | null
        cidade: string | null
        tags_acessibilidade: string[] | null
        necessita_transporte: boolean | null
      }>(h.pacientes)

      if (!pac?.necessita_transporte) continue
      // Evitar duplicação caso o histórico já tenha sido gerado de uma vaga fixa
      if (pacientesDeVagaFixa.has(pac.id)) continue

      const prof = extrairJoin<{ nome_completo: string }>(h.profissionais)
      const esp = extrairJoin<{ nome_especialidade: string }>(
        h.linhas_cuidado_especialidades,
      )

      rotas.push({
        agendamentoId: h.id,
        pacienteId: pac.id,
        pacienteNome: pac.nome_completo,
        profissionalNome: prof?.nome_completo ?? 'N/A',
        especialidadeNome: esp?.nome_especialidade ?? 'N/A',
        horarioInicio: h.data_hora_inicio,
        horarioFim: h.data_hora_fim,
        logradouro: pac.logradouro,
        numero: pac.numero,
        bairro: pac.bairro,
        cidade: pac.cidade,
        tagsAcessibilidade: pac.tags_acessibilidade ?? [],
      })
    }

    // ── Agrupar por bairro ────────────────────────────────────────────────────
    const mapa = new Map<string, PacienteRota[]>()
    for (const r of rotas) {
      const chave = r.bairro?.trim() || 'Sem Bairro Informado'
      const grupo = mapa.get(chave) ?? []
      grupo.push(r)
      mapa.set(chave, grupo)
    }

    // Ordenar grupos por bairro (A–Z) e pacientes por horário
    const grupos: GrupoBairro[] = Array.from(mapa.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
      .map(([bairro, pacientes]) => ({
        bairro,
        pacientes: pacientes.sort((a, b) =>
          a.horarioInicio.localeCompare(b.horarioInicio),
        ),
      }))

    return { success: true, data: grupos }
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao buscar rotas do dia',
    }
  }
}
