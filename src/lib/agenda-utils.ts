import { addDays, isSameDay, parseISO, startOfDay, format } from "date-fns"
import type { AgendaSession } from "@/types"

/**
 * Motor Dinâmico de Projeção de Agenda
 * Gera sessões baseadas em regras de vagas fixas para um período determinado,
 * mesclando com o histórico de materializações reais do banco.
 */
export function projectAgendaSessions(
  vagasFixas: any[], // TODO: Tipar conforme joins do Supabase
  historico: any[], 
  startDate: Date, 
  endDate: Date
): AgendaSession[] {
  const sessions: AgendaSession[] = []
  
  // Normalizar datas para início do dia para comparação
  let current = startOfDay(startDate)
  const last = startOfDay(endDate)

  while (current <= last) {
    const diaSemana = current.getDay()

    // 1. Buscar vagas fixas para este dia da semana
    const regrasDoDia = vagasFixas.filter(v => v.dia_semana === diaSemana)

    for (const regra of regrasDoDia) {
      // Verificar se a data está dentro da vigência do "contrato" da vaga
      const vigenciaInicio = startOfDay(parseISO(regra.data_inicio_contrato))
      const vigenciaFim = regra.data_fim_contrato ? startOfDay(parseISO(regra.data_fim_contrato)) : null

      if (current < vigenciaInicio) continue
      if (vigenciaFim && current > vigenciaFim) continue

      // Tentar encontrar uma materialização para este exato slot
      const materializacao = historico.find(h => 
        h.vaga_fixa_id === regra.id && 
        isSameDay(parseISO(h.data_hora_inicio), current)
      )

      if (materializacao) {
        sessions.push({
          id: materializacao.id,
          paciente_id: materializacao.pacientes.id,
          paciente_nome: materializacao.pacientes.nome_completo,
          profissional_id: materializacao.profissionais.id,
          profissional_nome: materializacao.profissionais.nome_completo,
          especialidade_id: materializacao.linhas_cuidado_especialidades.id,
          especialidade_nome: materializacao.linhas_cuidado_especialidades.nome_especialidade,
          data_hora_inicio: parseISO(materializacao.data_hora_inicio),
          data_hora_fim: parseISO(materializacao.data_hora_fim),
          status: materializacao.status_comparecimento,
          tipo_vaga: materializacao.tipo_vaga,
          vaga_fixa_id: regra.id,
          laudo_vencido: checkLaudoVencido(materializacao.pacientes.data_ultimo_laudo),
          criado_em: materializacao.criado_em,
          paciente_logradouro: materializacao.pacientes.logradouro,
          paciente_numero: materializacao.pacientes.numero,
          paciente_bairro: materializacao.pacientes.bairro,
          paciente_cidade: materializacao.pacientes.cidade,
          tags_acessibilidade: materializacao.pacientes.tags_acessibilidade
        })
      } else {
        // Sessão Projetada (Virtual)
        const [hStart, mStart] = regra.horario_inicio.split(":").map(Number)
        const [hEnd, mEnd] = regra.horario_fim.split(":").map(Number)
        
        const dStart = new Date(current)
        dStart.setHours(hStart, mStart, 0, 0)
        
        const dEnd = new Date(current)
        dEnd.setHours(hEnd, mEnd, 0, 0)

        sessions.push({
          id: `proj_${regra.id}_${format(current, 'yyyyMMdd')}`,
          paciente_id: regra.pacientes.id,
          paciente_nome: regra.pacientes.nome_completo,
          profissional_id: regra.profissionais.id,
          profissional_nome: regra.profissionais.nome_completo,
          especialidade_id: regra.linhas_cuidado_especialidades.id,
          especialidade_nome: regra.linhas_cuidado_especialidades.nome_especialidade,
          data_hora_inicio: dStart,
          data_hora_fim: dEnd,
          status: "Projetado",
          tipo_vaga: "Regular",
          vaga_fixa_id: regra.id,
          laudo_vencido: checkLaudoVencido(regra.pacientes.data_ultimo_laudo),
          paciente_logradouro: regra.pacientes.logradouro,
          paciente_numero: regra.pacientes.numero,
          paciente_bairro: regra.pacientes.bairro,
          paciente_cidade: regra.pacientes.cidade,
          tags_acessibilidade: regra.pacientes.tags_acessibilidade
        })
      }
    }

    current = addDays(current, 1)
  }

  // 2. Adicionar agendamentos históricos "avulsos" (sem vaga fixa vinculada)
  const avulsos = historico.filter(h => !h.vaga_fixa_id)
  for (const a of avulsos) {
    sessions.push({
      id: a.id,
      paciente_id: a.pacientes.id,
      paciente_nome: a.pacientes.nome_completo,
      profissional_id: a.profissionais.id,
      profissional_nome: a.profissionais.nome_completo,
      especialidade_id: a.linhas_cuidado_especialidades.id,
      especialidade_nome: a.linhas_cuidado_especialidades.nome_especialidade,
      data_hora_inicio: parseISO(a.data_hora_inicio),
      data_hora_fim: parseISO(a.data_hora_fim),
      status: a.status_comparecimento,
      tipo_vaga: a.tipo_vaga,
      laudo_vencido: checkLaudoVencido(a.pacientes.criado_em),
      criado_em: a.criado_em,
      paciente_logradouro: a.pacientes.logradouro,
      paciente_numero: a.pacientes.numero,
      paciente_bairro: a.pacientes.bairro,
      paciente_cidade: a.pacientes.cidade,
      tags_acessibilidade: a.pacientes.tags_acessibilidade
    })
  }

  // 3. Marcar conflitos de atendimento compartilhado (intensivo)
  markIntensiveConflicts(sessions)

  return sessions.sort((a, b) => {
    const diff = a.data_hora_inicio.getTime() - b.data_hora_inicio.getTime()
    if (diff !== 0) return diff
    
    // Se no mesmo horário, ordena por ordem de chegada (criado_em)
    if (a.criado_em && b.criado_em) {
      return a.criado_em.localeCompare(b.criado_em)
    }
    return 0
  })
}

/**
 * Verifica se o laudo tem mais de 6 meses
 */
function checkLaudoVencido(lastLaudoDate: string | null): boolean {
  if (!lastLaudoDate) return true
  const sixMonthsAgo = addDays(new Date(), -180)
  return parseISO(lastLaudoDate) < sixMonthsAgo
}

/**
 * Marca sessões onde o paciente está em dois lugares ao mesmo tempo
 */
function markIntensiveConflicts(sessions: AgendaSession[]) {
  // Agrupar por paciente e horário
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const s1 = sessions[i]
      const s2 = sessions[j]
      
      if (s1.paciente_id === s2.paciente_id && s1.data_hora_inicio.getTime() === s2.data_hora_inicio.getTime()) {
        s1.conflito_intensivo = true
        s2.conflito_intensivo = true
      }
    }
  }
}
