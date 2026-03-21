import { addDays, isSameDay, parseISO, startOfDay, format } from "date-fns"
import type { AgendaSession, VagaFixaComJoins, AgendamentoHistoricoComJoins } from "@/types"

/**
 * Motor Dinâmico de Projeção de Agenda
 * Gera sessões baseadas em regras de vagas fixas para um período determinado,
 * mesclando com o histórico de materializações reais do banco.
 */
export function projectAgendaSessions(
  vagasFixas: VagaFixaComJoins[],
  historico: AgendamentoHistoricoComJoins[], 
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
          paciente_id: materializacao.pacientes!.id,
          paciente_nome: materializacao.pacientes!.nome_completo,
          profissional_id: materializacao.profissionais!.id,
          profissional_nome: materializacao.profissionais!.nome_completo,
          especialidade_id: materializacao.linhas_cuidado_especialidades!.id,
          especialidade_nome: materializacao.linhas_cuidado_especialidades!.nome_especialidade,
          data_hora_inicio: parseISO(materializacao.data_hora_inicio),
          data_hora_fim: parseISO(materializacao.data_hora_fim),
          status: materializacao.status_comparecimento as AgendaSession["status"],
          tipo_vaga: materializacao.tipo_vaga || "Regular",
          vaga_fixa_id: regra.id,
          laudo_vencido: checkLaudoVencido(materializacao.pacientes!.data_ultimo_laudo || null),
          criado_em: materializacao.criado_em,
          paciente_logradouro: materializacao.pacientes!.logradouro || undefined,
          paciente_numero: materializacao.pacientes!.numero || undefined,
          paciente_bairro: materializacao.pacientes!.bairro || undefined,
          paciente_cidade: materializacao.pacientes!.cidade || undefined,
          tags_acessibilidade: materializacao.pacientes!.tags_acessibilidade
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
          paciente_id: regra.pacientes!.id,
          paciente_nome: regra.pacientes!.nome_completo,
          profissional_id: regra.profissionais!.id,
          profissional_nome: regra.profissionais!.nome_completo,
          especialidade_id: regra.linhas_cuidado_especialidades!.id,
          especialidade_nome: regra.linhas_cuidado_especialidades!.nome_especialidade,
          data_hora_inicio: dStart,
          data_hora_fim: dEnd,
          status: "Projetado",
          tipo_vaga: "Regular",
          vaga_fixa_id: regra.id,
          laudo_vencido: checkLaudoVencido(regra.pacientes!.data_ultimo_laudo || null),
          paciente_logradouro: regra.pacientes!.logradouro || undefined,
          paciente_numero: regra.pacientes!.numero || undefined,
          paciente_bairro: regra.pacientes!.bairro || undefined,
          paciente_cidade: regra.pacientes!.cidade || undefined,
          tags_acessibilidade: regra.pacientes!.tags_acessibilidade
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
      paciente_id: a.pacientes!.id,
      paciente_nome: a.pacientes!.nome_completo,
      profissional_id: a.profissionais!.id,
      profissional_nome: a.profissionais!.nome_completo,
      especialidade_id: a.linhas_cuidado_especialidades!.id,
      especialidade_nome: a.linhas_cuidado_especialidades!.nome_especialidade,
      data_hora_inicio: parseISO(a.data_hora_inicio),
      data_hora_fim: parseISO(a.data_hora_fim),
      status: a.status_comparecimento as AgendaSession["status"],
      tipo_vaga: a.tipo_vaga || "Regular",
      laudo_vencido: checkLaudoVencido(a.pacientes!.data_ultimo_laudo || null),
      criado_em: a.criado_em,
      paciente_logradouro: a.pacientes!.logradouro || undefined,
      paciente_numero: a.pacientes!.numero || undefined,
      paciente_bairro: a.pacientes!.bairro || undefined,
      paciente_cidade: a.pacientes!.cidade || undefined,
      tags_acessibilidade: a.pacientes!.tags_acessibilidade
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
 * Otimizado para O(N) usando Hash Map para suportar milhares de sessões sem travar o Event Loop do Node.
 */
function markIntensiveConflicts(sessions: AgendaSession[]) {
  // Mapeia usando a combinação "PacienteID_HorarioTimestamp" como chave única
  const mapaConflitos = new Map<string, AgendaSession[]>()

  // Passo 1: Agrupa todos os agendamentos na memória (Passa pelo array apenas 1 vez)
  for (const session of sessions) {
    const chave = `${session.paciente_id}_${session.data_hora_inicio.getTime()}`
    
    if (!mapaConflitos.has(chave)) {
      mapaConflitos.set(chave, [])
    }
    mapaConflitos.get(chave)!.push(session)
  }

  // Passo 2: Marca as sessões que caíram no mesmo grupo (conflito)
  for (const grupo of mapaConflitos.values()) {
    if (grupo.length > 1) { // Paciente tem mais de 1 sessão no mesmo horário exato
      for (const session of grupo) {
        session.conflito_intensivo = true
      }
    }
  }
}
