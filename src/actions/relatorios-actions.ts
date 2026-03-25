'use server'

import { createClient } from '@/utils/supabase/server'
import { type ActionResponse } from '@/types'
import { startOfMonth, endOfMonth } from 'date-fns'

export interface FilaPorEspecialidade {
  especialidadeId: string
  especialidadeNome: string
  quantidade: number
}

export interface IndicadoresGerais {
  atendimentosMes: number
  pacientesNaFila: number
  totalFaltas: number
  filaEspecialidade: FilaPorEspecialidade[]
}

/**
 * Busca indicadores gerais de produtividade e regulação.
 * Aplica contagem nativa no Supabase para performance (Rules 1, 2, 3).
 */
export async function buscarIndicadoresGerais(): Promise<ActionResponse<IndicadoresGerais>> {
  try {
    const supabase = await createClient()
    const hoje = new Date()
    const inicioMes = startOfMonth(hoje).toISOString()
    const fimMes = endOfMonth(hoje).toISOString()

    // 1. Atendimentos realizados no mês atual (Regra 1 e 2)
    const { count: countAtendimentos, error: errAtendimentos } = await supabase
      .from('agendamentos_historico')
      .select('*', { count: 'exact', head: true })
      .eq('status_comparecimento', 'Presente')
      .gte('data_hora_inicio', inicioMes)
      .lte('data_hora_inicio', fimMes)

    if (errAtendimentos) throw new Error(errAtendimentos.message)

    // 2. Pacientes aguardando na fila (Regra 1)
    const { count: countFila, error: errFila } = await supabase
      .from('fila_espera')
      .select('*', { count: 'exact', head: true })
      .in('status_fila', ['Aguardando', 'Aguardando Vaga'])

    if (errFila) throw new Error(errFila.message)

    // 3. Total de faltas registadas (Regra 1 e 3)
    const { count: countFaltas, error: errFaltas } = await supabase
      .from('agendamentos_historico')
      .select('*', { count: 'exact', head: true })
      .in('status_comparecimento', ['Falta Justificada', 'Falta Nao Justificada', 'Falta Injustificada'])

    if (errFaltas) throw new Error(errFaltas.message)

    // 4. Distribuição da fila por especialidade (Regra 4)
    const { data: itensFila, error: errItensFila } = await supabase
      .from('fila_espera')
      .select(`
        especialidade_id,
        linhas_cuidado_especialidades (
          nome_especialidade
        )
      `)
      .in('status_fila', ['Aguardando', 'Aguardando Vaga'])

    if (errItensFila) throw new Error(errItensFila.message)

    // Agrupamento no JavaScript para a tabela
    const mapaEspecialidades = new Map<string, { nome: string; qtd: number }>()

    for (const item of itensFila ?? []) {
      const espId = item.especialidade_id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const espNome = (item.linhas_cuidado_especialidades as any)?.nome_especialidade ?? 'N/A'
      
      const atual = mapaEspecialidades.get(espId) ?? { nome: espNome, qtd: 0 }
      atual.qtd++
      mapaEspecialidades.set(espId, atual)
    }

    const filaEspecialidade: FilaPorEspecialidade[] = Array.from(mapaEspecialidades.entries())
      .map(([id, info]) => ({
        especialidadeId: id,
        especialidadeNome: info.nome,
        quantidade: info.qtd,
      }))
      .sort((a, b) => b.quantidade - a.quantidade)

    return {
      success: true,
      data: {
        atendimentosMes: countAtendimentos ?? 0,
        pacientesNaFila: countFila ?? 0,
        totalFaltas: countFaltas ?? 0,
        filaEspecialidade,
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar indicadores',
    }
  }
}
