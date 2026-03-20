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

export type PerfilAcesso =
  | "Medico_Terapeuta"
  | "Enfermagem"
  | "Recepcao"
  | "Administracao"
  | "Motorista"

export interface Paciente {
  id: string
  // Identificadores
  numero_prontuario?: string | null
  id_legado_vba?: string | null
  cns: string
  cpf: string | null
  // Identificação pessoal
  nome_completo: string
  data_nascimento: string
  sexo: string
  nome_mae: string
  nome_pai?: string | null
  rg?: string | null
  rg_orgao_exp?: string | null
  estado_civil?: string | null
  naturalidade?: string | null
  profissao?: string | null
  reside_com?: string | null
  // Endereço
  endereco_cep?: string | null
  logradouro?: string | null
  numero?: string | null
  bairro?: string | null
  cidade: string
  uf: string
  referencia?: string | null
  // Contatos
  telefone_principal: string | null
  telefone_secundario?: string | null
  telefone_responsavel?: string | null
  email?: string | null
  nome_responsavel?: string | null
  // Clínico
  cid_principal?: string | null
  cid_secundario?: string | null
  data_ultimo_laudo?: string | null
  tipo_reabilitacao?: "Fisica" | "Intelectual" | "Ambas" | null
  equipe_tecnica?: "Estimulacao_Precoce" | "Infanto_Juvenil" | "Adulta" | null
  eletivo?: boolean
  // Logística e Acessibilidade
  necessita_transporte: boolean
  pactuado: boolean
  municipio_pactuado?: string | null
  tags_acessibilidade: string[]
  opms_solicitadas?: string[]
  // Administrativo
  status_cadastro?: "Ativo" | "Inativo" | "Obito" | "Alta"
  observacao_acolhimento?: string | null
  criado_em?: string
  atualizado_em?: string
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

export type TipoAtendimento =
  | "Consulta Medica"
  | "Terapia Continua"
  | "Dispensacao_OPM"
  | "Avaliacao_Diagnostica"
  | "Acolhimento"
  | "Pedagogico"

export interface GradeHoraria {
  id: string
  profissional_id: string
  dia_semana: number
  horario_inicio: string
  horario_fim: string
  capacidade_atendimentos: number
  data_inicio_vigencia?: string | null
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
  vaga_fixa_id?: string | null
  data_hora_inicio: string
  data_hora_fim: string
  status_comparecimento: StatusComparecimento
  evolucao_clinica?: string | null
  conduta?: string | null
  tipo_vaga?: string | null
  // Individual | Compartilhado
  tipo_agendamento?: string | null
  // Para atendimentos em bloco
  ordem_chegada?: number | null
  // Substituto digital da assinatura do paciente
  confirmado_pelo_paciente?: boolean
  criado_em?: string
  atualizado_em?: string
  // Joins
  pacientes?: Paciente
  profissionais?: Profissional
  linhas_cuidado_especialidades?: Especialidade
}

// Enum canônico — usar SEMPRE esta forma, nunca 'Falta Injustificada'
export type StatusComparecimento =
  | "Agendado"
  | "Presente"
  | "Falta Justificada"
  | "Falta Nao Justificada"
  | "Cancelado"

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
    "Falta Justificada",
    "Falta Nao Justificada",
    "Cancelado",
  ]),
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

export interface VagaFixaComJoins
  extends Omit<
    VagaFixa,
    "pacientes" | "profissionais" | "linhas_cuidado_especialidades"
  > {
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

export interface AgendamentoHistoricoComJoins
  extends Omit<
    AgendamentoHistorico,
    "pacientes" | "profissionais" | "linhas_cuidado_especialidades"
  > {
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

export type PacienteFila = {
  id: string
  nome: string
  cns: string
  prioridade: "Rotina" | "Urgencia Clinica" | "Mandado Judicial"
  status: "Aguardando" | "Em Atendimento" | "Em Risco" | "Desistencia" | "Alta"
  especialidade: string
  data_encaminhamento: string
  dias_espera: number
  profissional_nome: string | null
  faltas: number
  numeroProcesso: string | null
}
