import { z } from "zod"

export interface Profissional {
  id: string
  nome_completo: string
  registro_conselho?: string
  cbo?: string
  perfil_acesso: PerfilAcesso
  especialidades_permitidas?: string[]
  ativo?: boolean
}

export type PerfilAcesso = "Medico_Terapeuta" | "Enfermagem" | "Recepcao" | "Administracao"

export interface Paciente {
  id: string
  cns: string
  cpf: string | null
  nome_completo: string
  data_nascimento: string
  sexo: string
  nome_mae: string
  nome_pai?: string | null
  pactuado: boolean
  municipio_pactuado?: string | null
  cidade: string
  uf: string
  cid_principal?: string | null
  cid_secundario?: string | null
  necessita_transporte: boolean
  tags_acessibilidade: string[]
  data_ultimo_laudo?: string | null
  telefone_principal: string | null
  telefone_secundario?: string | null
  nome_responsavel?: string | null
  telefone_responsavel?: string | null
  status_cadastro?: string
  // Endereço e Logística
  endereco_cep?: string | null
  logradouro?: string | null
  numero?: string | null
  bairro?: string | null
  criado_em?: string
}

export interface Especialidade {
  id: string
  nome_especialidade: string
  descricao?: string | null
  equipe_responsavel?: string | null
  linha_reabilitacao?: string | null
  tipo_atendimento?: TipoAtendimento | null
  ativo?: boolean
}

export type TipoAtendimento = "Consulta Medica" | "Terapia Continua" | "Dispensacao_OPM" | "Avaliacao_Diagnostica"

export interface GradeHoraria {
  id: string
  profissional_id: string
  dia_semana: number
  horario_inicio: string
  horario_fim: string
  ativo: boolean
  profissional?: {
    nome_completo: string
  }
}

export interface FaltaRegistro {
  id: string
  data_falta: string
  justificada: boolean
  observacao?: string | null
  criado_em?: string
}

export interface VagaFixa {
  id: string
  paciente_id: string
  profissional_id: string
  especialidade_id: string
  dia_semana: number
  horario_inicio: string
  horario_fim: string
  status_vaga: "Ativa" | "Suspensa" | "Encerrada"
  data_inicio_contrato: string
  data_fim_contrato?: string | null
  criado_em?: string
  // Joins
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

export interface AgendamentoHistorico {
  id: string
  paciente_id: string
  profissional_id: string
  especialidade_id: string
  data_hora_inicio: string
  data_hora_fim: string
  status_comparecimento: "Agendado" | "Presente" | "Falta Justificada" | "Falta Nao Justificada" | "Cancelado"
  evolucao_clinica?: string | null
  conduta?: string | null
  tipo_vaga?: string | null
  vaga_fixa_id?: string | null
  criado_em?: string
  // Joins
  pacientes?: Paciente
  profissionais?: Profissional
  linhas_cuidado_especialidades?: Especialidade
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
  status_comparecimento: z.enum(["Agendado", "Presente", "Falta Justificada", "Falta Nao Justificada", "Cancelado"]),
  evolucao_clinica: z.string().optional(),
  conduta: z.string().optional(),
  tipo_vaga: z.string().optional(),
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
  status: "Agendado" | "Presente" | "Falta Justificada" | "Falta Nao Justificada" | "Cancelado" | "Projetado"

  tipo_vaga: string
  vaga_fixa_id?: string
  conflito_intensivo?: boolean
  laudo_vencido?: boolean
  criado_em?: string
  // Campos de Logística
  paciente_logradouro?: string
  paciente_numero?: string
  paciente_bairro?: string
  paciente_cidade?: string
  tags_acessibilidade?: string[]
}

export interface VagaFixaComJoins extends Omit<VagaFixa, 'pacientes' | 'profissionais' | 'linhas_cuidado_especialidades'> {
  pacientes: Pick<Paciente, 'id' | 'nome_completo' | 'data_nascimento' | 'cns' | 'criado_em' | 'data_ultimo_laudo' | 'logradouro' | 'numero' | 'bairro' | 'cidade' | 'tags_acessibilidade' | 'necessita_transporte'>
  profissionais: Pick<Profissional, 'id' | 'nome_completo'>
  linhas_cuidado_especialidades: Pick<Especialidade, 'id' | 'nome_especialidade'>
}

export interface AgendamentoHistoricoComJoins extends Omit<AgendamentoHistorico, 'pacientes' | 'profissionais' | 'linhas_cuidado_especialidades'> {
  pacientes: Pick<Paciente, 'id' | 'nome_completo' | 'data_nascimento' | 'cns' | 'criado_em' | 'data_ultimo_laudo' | 'logradouro' | 'numero' | 'bairro' | 'cidade' | 'tags_acessibilidade' | 'necessita_transporte'>
  profissionais: Pick<Profissional, 'id' | 'nome_completo'>
  linhas_cuidado_especialidades: Pick<Especialidade, 'id' | 'nome_especialidade'>
}
