import { describe, it, expect } from "vitest"
import { projectAgendaSessions } from "./agenda-utils"
import { VagaFixaComJoins, AgendamentoHistoricoComJoins } from "@/types"
import { Database } from "@/types/database.types"

// Helpers para criar objetos tipados sem 'any'
type StatusPresenca = Database["public"]["Enums"]["status_presenca_enum"]

const mockPaciente = {
  id: "p1",
  nome_completo: "Paciente Teste",
  data_nascimento: "2000-01-01",
  cns: "123",
  criado_em: "2024-01-01T00:00:00Z",
  data_ultimo_laudo: "2024-01-01",
  logradouro: "Rua A",
  numero: "10",
  bairro: "Centro",
  cidade: "Cidade",
  tags_acessibilidade: [],
  necessita_transporte: false
}

const mockProfissional = {
  id: "pr1",
  nome_completo: "Profissional Teste"
}

const mockEspecialidade = {
  id: "e1",
  nome_especialidade: "Fisioterapia"
}

describe("projectAgendaSessions", () => {
  it("Cenário 1: Projeção Limpa - Deve projetar corretamente 4 sessões semanais em um mês", () => {
    // 04 de Março de 2024 é uma Segunda-feira (day 1)
    const vaga: VagaFixaComJoins = {
      id: "v1",
      paciente_id: "p1",
      profissional_id: "pr1",
      especialidade_id: "e1",
      dia_semana: 1, // Segunda
      horario_inicio: "08:00",
      horario_fim: "09:00",
      data_inicio_contrato: "2024-03-01",
      data_fim_contrato: null,
      status_vaga: "Ativa",
      criado_em: "2024-03-01T00:00:00Z",
      atualizado_em: null,
      deleted_at: null,
      pacientes: mockPaciente,
      profissionais: mockProfissional,
      linhas_cuidado_especialidades: mockEspecialidade
    }

    const startDate = new Date(2024, 2, 1) // 01/Mar/2024
    const endDate = new Date(2024, 2, 31)  // 31/Mar/2024

    const result = projectAgendaSessions([vaga], [], startDate, endDate)

    // Março 2024 tem segundas nos dias: 4, 11, 18, 25 (4 sessões)
    expect(result).toHaveLength(4)
    expect(result[0].data_hora_inicio.getDate()).toBe(4)
    expect(result[0].data_hora_inicio.getHours()).toBe(8)
    expect(result[3].data_hora_inicio.getDate()).toBe(25)
    expect(result.every(s => s.status === "Projetado")).toBe(true)
  })

  it("Cenário 2: Resolução de Conflitos - Deve refletir o status de falta do histórico e não duplicar", () => {
    const vaga: VagaFixaComJoins = {
      id: "v1",
      paciente_id: "p1",
      profissional_id: "pr1",
      especialidade_id: "e1",
      dia_semana: 1,
      horario_inicio: "08:00",
      horario_fim: "09:00",
      data_inicio_contrato: "2024-03-01",
      data_fim_contrato: null,
      status_vaga: "Ativa",
      criado_em: "2024-03-01T00:00:00Z",
      atualizado_em: null,
      deleted_at: null,
      pacientes: mockPaciente,
      profissionais: mockProfissional,
      linhas_cuidado_especialidades: mockEspecialidade
    }

    // Criar data localmente para garantir consistência com o motor
    const historicoDate = new Date(2024, 2, 11, 8, 0, 0)
    const historicoFim = new Date(2024, 2, 11, 9, 0, 0)

    const historico: AgendamentoHistoricoComJoins = {
      id: "h1",
      paciente_id: "p1",
      profissional_id: "pr1",
      especialidade_id: "e1",
      vaga_fixa_id: "v1",
      data_hora_inicio: historicoDate.toISOString(),
      data_hora_fim: historicoFim.toISOString(),
      status_comparecimento: "Falta Injustificada" as StatusPresenca,
      tipo_agendamento: "Regular",
      tipo_vaga: "Regular",
      criado_em: "2024-03-11T00:00:00.000Z",
      atualizado_em: null,
      deleted_at: null,
      conduta: null,
      confirmado_pelo_paciente: null,
      evolucao_clinica: null,
      ordem_chegada: null,
      pacientes: mockPaciente,
      profissionais: mockProfissional,
      linhas_cuidado_especialidades: mockEspecialidade
    }

    const startDate = new Date(2024, 2, 1)
    const endDate = new Date(2024, 2, 31)

    const result = projectAgendaSessions([vaga], [historico], startDate, endDate)

    expect(result).toHaveLength(4)
    const sessaoComHistorico = result.find(s => s.data_hora_inicio.getDate() === 11)
    expect(sessaoComHistorico?.status).toBe("Falta Injustificada")
    expect(sessaoComHistorico?.id).toBe("h1")
  })

  it("Cenário 3: Prevenção de Sobreposição - Deve marcar conflito intensivo para atendimento avulso no mesmo horário", () => {
    const vaga: VagaFixaComJoins = {
      id: "v1",
      paciente_id: "p1",
      profissional_id: "pr1",
      especialidade_id: "e1",
      dia_semana: 1,
      horario_inicio: "08:00",
      horario_fim: "09:00",
      data_inicio_contrato: "2024-03-01",
      data_fim_contrato: null,
      status_vaga: "Ativa",
      criado_em: "2024-03-01T00:00:00Z",
      atualizado_em: null,
      deleted_at: null,
      pacientes: mockPaciente,
      profissionais: mockProfissional,
      linhas_cuidado_especialidades: mockEspecialidade
    }

    const collisionDate = new Date(2024, 2, 4, 8, 0, 0)
    const collisionEnd = new Date(2024, 2, 4, 9, 0, 0)

    const avulso: AgendamentoHistoricoComJoins = {
      id: "h2",
      paciente_id: "p1",
      profissional_id: "pr2",
      especialidade_id: "e2",
      vaga_fixa_id: null,
      data_hora_inicio: collisionDate.toISOString(),
      data_hora_fim: collisionEnd.toISOString(),
      status_comparecimento: "Agendado" as StatusPresenca,
      tipo_agendamento: "Avulso",
      tipo_vaga: "Regular",
      criado_em: "2024-03-01T10:00:00Z",
      atualizado_em: null,
      deleted_at: null,
      conduta: null,
      confirmado_pelo_paciente: null,
      evolucao_clinica: null,
      ordem_chegada: null,
      pacientes: mockPaciente,
      profissionais: { id: "pr2", nome_completo: "Outro Profissional" },
      linhas_cuidado_especialidades: { id: "e2", nome_especialidade: "TO" }
    }

    const startDate = new Date(2024, 2, 1)
    const endDate = new Date(2024, 2, 31)

    const result = projectAgendaSessions([vaga], [avulso], startDate, endDate)

    // 4 sessões projetadas + 1 avulso = 5 sessões
    expect(result).toHaveLength(5)
    
    const sessoesNoMesmoHorario = result.filter(s => 
      s.data_hora_inicio.getDate() === 4 && s.data_hora_inicio.getHours() === 8
    )
    
    expect(sessoesNoMesmoHorario).toHaveLength(2)
    expect(sessoesNoMesmoHorario.every(s => s.conflito_intensivo === true)).toBe(true)
  })

  it("Cenário 4: Limites de Mês - Deve projetar corretamente em anos bissextos (29 de Fevereiro)", () => {
    const vaga: VagaFixaComJoins = {
      id: "v-leap",
      paciente_id: "p1",
      profissional_id: "pr1",
      especialidade_id: "e1",
      dia_semana: 4, // Quinta
      horario_inicio: "10:00",
      horario_fim: "11:00",
      data_inicio_contrato: "2024-02-01",
      data_fim_contrato: null,
      status_vaga: "Ativa",
      criado_em: "2024-02-01T00:00:00Z",
      atualizado_em: null,
      deleted_at: null,
      pacientes: mockPaciente,
      profissionais: mockProfissional,
      linhas_cuidado_especialidades: mockEspecialidade
    }

    const startDate = new Date(2024, 1, 28)
    const endDate = new Date(2024, 2, 1)

    const result = projectAgendaSessions([vaga], [], startDate, endDate)

    expect(result).toHaveLength(1)
    expect(result[0].data_hora_inicio.getDate()).toBe(29)
    expect(result[0].data_hora_inicio.getMonth()).toBe(1) // Fevereiro
    expect(result[0].data_hora_inicio.getHours()).toBe(10)
  })
})
