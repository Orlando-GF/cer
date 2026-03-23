import { z } from "zod"
import { Database } from "./database.types"

export type PerfilAcesso = Database["public"]["Enums"]["perfil_acesso_enum"]
export type StatusCadastro = Database["public"]["Enums"]["status_cadastro_enum"]
export type TipoReabilitacao = Database["public"]["Enums"]["tipo_reabilitacao_enum"]
export type EquipeTecnica = Database["public"]["Enums"]["equipe_tecnica_enum"]
export type TipoAtendimento = Database["public"]["Enums"]["tipo_atendimento_enum"]
export type StatusVaga = Database["public"]["Enums"]["status_vaga_enum"]
export type StatusComparecimento = Database["public"]["Enums"]["status_presenca_enum"]
export type PrioridadeFila = Database["public"]["Enums"]["nivel_prioridade_enum"]
export type StatusFila = Database["public"]["Enums"]["status_fila_enum"]

export type Profissional = Database["public"]["Tables"]["profissionais"]["Row"] & {
  especialidades_permitidas?: string[]
}

export type GradeHoraria = Database["public"]["Tables"]["grade_horaria"]["Row"] & {
  profissional?: {
    nome_completo: string
  }
}

export type Paciente = Database["public"]["Tables"]["pacientes"]["Row"]

export type Especialidade = Database["public"]["Tables"]["linhas_cuidado_especialidades"]["Row"]

export type FaltaRegistro = Database["public"]["Tables"]["faltas_registros"]["Row"]

export type VagaFixa = Database["public"]["Tables"]["vagas_fixas"]["Row"] & {
  pacientes?: Paciente
  profissionais?: Profissional
  linhas_cuidado_especialidades?: Especialidade
}

export type AgendamentoHistorico = Database["public"]["Tables"]["agendamentos_historico"]["Row"] & {
  pacientes?: Paciente
  profissionais?: Profissional
  linhas_cuidado_especialidades?: Especialidade
}

export interface AlertaAbsenteismo {
  paciente: Partial<Paciente>
  especialidade: string
  profissional: string
  ultimas_faltas: string[]
}

export interface DadosUsuario {
  perfil_acesso: PerfilAcesso
  nome_completo: string
  email: string
}

export type ActionResponse<T = undefined> = {
  success: boolean
  data?: T
  error?: string
}

export const CriarAgendamentoSchema = z.object({
  paciente_id: z.string().uuid(),
  profissional_id: z.string().uuid(),
  especialidade_id: z.string().uuid(),
  vaga_fixa_id: z.string().uuid().optional().nullable(),
  data_hora_inicio: z.string().datetime(),
  data_hora_fim: z.string().datetime(),
  status_comparecimento: z.enum([
    "Agendado",
    "Presente",
    "Falta Nao Justificada",
    "Falta Justificada",
    "Cancelado"
  ]),
})

export type CriarAgendamentoInput = z.infer<typeof CriarAgendamentoSchema>

export interface AgendaSession {
  id: string
  paciente_id: string
  paciente_nome: string
  profissional_id: string
  profissional_nome: string
  especialidade_id: string
  especialidade_nome: string
  data_hora_inicio: Date
  data_hora_fim: Date
  status: StatusComparecimento | "Projetado"
  tipo_vaga: string
  vaga_fixa_id?: string
  conflito_intensivo?: boolean
  laudo_vencido?: boolean
  criado_em?: string
  // Logística
  paciente_logradouro?: string
  paciente_numero?: string
  paciente_bairro?: string
  paciente_cidade?: string
  tags_acessibilidade?: string[]
}

export interface SerializedAgendaSession extends Omit<AgendaSession, 'data_hora_inicio' | 'data_hora_fim'> {
  data_hora_inicio: string
  data_hora_fim: string
}

export type VagaFixaComJoins = Omit<
    VagaFixa,
    "pacientes" | "profissionais" | "linhas_cuidado_especialidades"
  > & {
  pacientes: Pick<
    Paciente,
    | "id"
    | "nome_completo"
    | "data_nascimento"
    | "cns"
    | "criado_em"
    | "data_ultimo_laudo"
    | "logradouro"
    | "numero"
    | "bairro"
    | "cidade"
    | "tags_acessibilidade"
    | "necessita_transporte"
  >
  profissionais: Pick<Profissional, "id" | "nome_completo">
  linhas_cuidado_especialidades: Pick<
    Especialidade,
    "id" | "nome_especialidade"
  >
}

export type AgendamentoHistoricoComJoins = Omit<
    AgendamentoHistorico,
    "pacientes" | "profissionais" | "linhas_cuidado_especialidades"
  > & {
  pacientes: Pick<
    Paciente,
    | "id"
    | "nome_completo"
    | "data_nascimento"
    | "cns"
    | "criado_em"
    | "data_ultimo_laudo"
    | "logradouro"
    | "numero"
    | "bairro"
    | "cidade"
    | "tags_acessibilidade"
    | "necessita_transporte"
  >
  profissionais: Pick<Profissional, "id" | "nome_completo">
  linhas_cuidado_especialidades: Pick<
    Especialidade,
    "id" | "nome_especialidade"
  >
}

export type PacienteFilaTerapia = {
  id: string
  paciente_id: string 
  nome: string
  cns: string
  prioridade: PrioridadeFila
  status: StatusFila
  especialidade: string
  data_encaminhamento: string
  dias_espera: number
  profissional_nome: string | null
  faltas: number
  numeroProcesso: string | null
}
