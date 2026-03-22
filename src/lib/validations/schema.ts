import { z } from "zod"
import { formatarNomeClinico } from "@/lib/utils/string-utils"

// ─── enums ────────────────────────────────────────────────────────────────────

export const SexoEnum = z.enum(["M", "F", "Outro"])
export const NivelPrioridadeEnum = z.enum(["Rotina", "Urgencia Clinica", "Mandado Judicial"])
export const StatusFilaEnum = z.enum(["Aguardando", "Em Atendimento", "Em Risco", "Desistencia", "Alta"])
export const FrequenciaRecomendadaEnum = z.enum(["A definir", "Semanal", "Quinzenal", "Mensal"])
export const PerfilAcessoEnum = z.enum(["Recepcao", "Enfermagem", "Medico_Terapeuta", "Administracao", "Motorista"])
export const StatusVagaEnum = z.enum(["Ativa", "Suspensa", "Encerrada"])
export const StatusCadastroEnum = z.enum(["Ativo", "Inativo", "Obito", "Alta"])
export const TipoAtendimentoEnum = z.enum(["Consulta Medica", "Terapia Continua", "Dispensacao_OPM", "Avaliacao_Diagnostica"])
export const StatusComparecimentoEnum = z.enum(["Agendado", "Presente", "Falta Nao Justificada", "Falta Justificada", "Cancelado"])
export const CondutaEvolucaoEnum = z.enum([
  "Retorno", 
  "Alta por Melhoria", 
  "Alta por Abandono", 
  "Alta a Pedido", 
  "Obito/Transferencia", 
  "Encaminhamento Externo", 
  "Inserir em Fila de Terapia"
])

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Remove tudo que não é algarismo. Usado para validar campos com máscara. */
const digitsOnly = (val: string) => val.replace(/\D/g, "")

/** Campo opcional que aceita string vazia ou null como "não informado". */
const optionalStr = z.string().optional().nullable().transform((v) => v || null)

/** Campo de telefone que limpa a formatação mantendo apenas os números */
const phoneStr = z.preprocess(
  (v) => (typeof v === "string" && v ? digitsOnly(v) : null),
  z.string().nullable().optional()
)

// ─── schema do paciente ───────────────────────────────────────────────────────

export const pacienteSchema = z.object({
  // Identificadores — CNS é o principal (obrigatório), CPF é opcional
  cns: z
    .string()
    .transform(digitsOnly)
    .pipe(z.string().length(15, "CNS deve ter exatamente 15 dígitos")),

  cpf: z.preprocess(
    (v) => (typeof v === "string" && v ? digitsOnly(v) : null),
    z.string().length(11, "CPF deve ter 11 dígitos").nullable().optional()
  ),

  id_legado_vba: optionalStr,

  // Dados pessoais obrigatórios
  nome_completo: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").transform(formatarNomeClinico),
  data_nascimento: z.string().length(10, "Data inválida — formato esperado: AAAA-MM-DD"),
  sexo: SexoEnum,
  nome_mae: z.string().min(3, "Nome da mãe é obrigatório").transform(formatarNomeClinico),

  // Dados pessoais opcionais
  nome_pai: z.string().optional().nullable().transform(v => v ? formatarNomeClinico(v) : null),
  rg: optionalStr,
  rg_orgao_exp: optionalStr,
  estado_civil: optionalStr,
  naturalidade: optionalStr,

  // Endereço — CEP aceita com ou sem hífen
  endereco_cep: z.preprocess(
    (v) => (typeof v === "string" && v ? digitsOnly(v) : null),
    z.string().length(8, "CEP deve ter 8 dígitos").nullable().optional()
  ),

  logradouro: optionalStr,
  numero: optionalStr,
  bairro: optionalStr,
  cidade: z.string().default("Barreiras"),
  uf: z.string().length(2).default("BA"),
  referencia: optionalStr,

  // Contatos — extrai apenas os números utilizando phoneStr
  telefone_principal: phoneStr,
  telefone_secundario: phoneStr,
  nome_responsavel: z.string().optional().nullable().transform(v => v ? formatarNomeClinico(v) : null),
  telefone_responsavel: phoneStr,

  // Pactuação
  pactuado: z.boolean().default(false),
  municipio_pactuado: optionalStr,

  // Clínica e Logística (Item 10.1)
  cid_principal: z.preprocess(
    (v) => (typeof v === "string" && v ? v.trim().toUpperCase() : null),
    z.string().max(10, "CID principal inválido").nullable().optional()
  ),
  cid_secundario: z.preprocess(
    (v) => (typeof v === "string" && v ? v.trim().toUpperCase() : null),
    z.string().max(10, "CID secundário inválido").nullable().optional()
  ),
  necessita_transporte: z.boolean().default(false),
  tags_acessibilidade: z.array(z.string()).default([]),

  status_cadastro: StatusCadastroEnum.default("Ativo"),
  data_ultimo_laudo: z.string().length(10, "Data inválida").nullable().optional(),
})

// ─── schema da fila de espera ─────────────────────────────────────────────────

export const filaEsperaSchema = z.object({
  especialidade_id: z.string().uuid("Selecione uma especialidade válida"),
  origem_encaminhamento: optionalStr,
  nivel_prioridade: NivelPrioridadeEnum.default("Rotina"),
  numero_processo_judicial: optionalStr,
  frequencia_recomendada: FrequenciaRecomendadaEnum.default("A definir"),
})

// ─── schema combinado ─────────────────────────────────────────────────────────

export const cadastroFilaSchema = pacienteSchema.merge(filaEsperaSchema)

export const incluirNaFilaSchema = filaEsperaSchema.extend({
  paciente_id: z.string().uuid("ID do paciente inválido ou não informado"),
})

export type PacienteInput = z.infer<typeof pacienteSchema>
export type FilaEsperaInput = z.infer<typeof filaEsperaSchema>
export type CadastroFilaInput = z.infer<typeof cadastroFilaSchema>
export type IncluirNaFilaInput = z.infer<typeof incluirNaFilaSchema>

// ─── schemas de ações da fila ──────────────────────────────────────────────────

export const faltaFilaSchema = z.object({
  fila_id: z.string().uuid("ID da fila inválido"),
  justificada: z.boolean().default(false),
  observacao: z.string().optional().nullable(),
})

export const statusFilaSchema = z.object({
  fila_id: z.string().uuid("ID da fila inválido"),
  novo_status: StatusFilaEnum,
})

export type FaltaFilaInput = z.infer<typeof faltaFilaSchema>
export type StatusFilaInput = z.infer<typeof statusFilaSchema>

// ─── schemas de agenda ────────────────────────────────────────────────────────

export const vagaFixaSchema = z.object({
  paciente_id: z.string().uuid("Paciente inválido"),
  profissional_id: z.string().uuid("Profissional inválido"),
  especialidade_id: z.string().uuid("Especialidade inválida"),
  dia_semana: z.number().min(0).max(6),
  horario_inicio: z.string().min(5, "Horário de início inválido"),
  horario_fim: z.string().min(5, "Horário de fim inválido"),
  data_inicio_contrato: z.string().length(10, "Data inválida"),
  data_fim_contrato: optionalStr,
  status_vaga: StatusVagaEnum.default("Ativa"),
})

export const agendamentoHistoricoSchema = z.object({
  id: z.string().uuid().optional(),
  paciente_id: z.string().uuid("Paciente inválido"),
  profissional_id: z.string().uuid("Profissional inválido"),
  especialidade_id: z.string().uuid("Especialidade inválida"),
  vaga_fixa_id: z.string().uuid().optional().nullable(),
  data_hora_inicio: z.string(), // ISO string
  data_hora_fim: z.string().optional().nullable(),
  status_comparecimento: StatusComparecimentoEnum.default("Agendado"),
  evolucao_clinica: optionalStr,
  conduta: CondutaEvolucaoEnum.optional().nullable(), // Alterado para texto livre conforme requisito de Textarea
  tipo_vaga: z.string().default("Regular"),
  tipo_agendamento: z.string().default("Individual"),
  ordem_chegada: z.number().int().optional().nullable(),
}).refine((data) => {
  if (data.status_comparecimento === "Presente" && (!data.evolucao_clinica || data.evolucao_clinica.trim().length === 0)) {
    return false
  }
  return true
}, {
  message: "A evolução clínica é obrigatória quando o paciente está Presente.",
  path: ["evolucao_clinica"],
})

export const profissionalSchema = z.object({
  nome_completo: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").transform(formatarNomeClinico),
  registro_conselho: optionalStr,
  cbo: z.string().optional().nullable(),
  perfil_acesso: PerfilAcessoEnum.default("Medico_Terapeuta"),
  especialidades_permitidas: z.array(z.string().uuid()).default([]),
  ativo: z.boolean().default(true),
})

export const especialidadeSchema = z.object({
  nome_especialidade: z.string().min(3, "Nome da especialidade é obrigatório"),
  equipe_responsavel: z.string().min(1, "Equipe responsável é obrigatória"),
  linha_reabilitacao: z.string().min(1, "Linha de reabilitação é obrigatória"),
  tipo_atendimento: TipoAtendimentoEnum.default("Terapia Continua"),
  ativo: z.boolean().default(true),
})

export const gradeHorariaSchema = z.object({
  profissional_id: z.string().uuid("Profissional inválido"),
  dia_semana: z.number().min(0).max(6),
  horario_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário de início inválido (HH:mm)"),
  horario_fim: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário de fim inválido (HH:mm)"),
  capacidade: z.number().int().min(1).default(1),
  ativo: z.boolean().default(true),
})

export const avaliacaoServicoSocialSchema = z.object({
  paciente_id: z.string().uuid("Paciente inválido"),
  profissional_id: z.string().uuid("Profissional inválido"),
  
  // Composição Familiar
  quantidade_membros_familia: z.number().int().min(1, "Quantidade de membros deve ser pelo menos 1"),
  renda_familiar_total: z.number().min(0, "Renda não pode ser negativa"),
  recebe_beneficio: z.boolean().default(false),
  tipo_beneficio: optionalStr,
  
  // Moradia e Saneamento
  tipo_moradia: z.enum(["Propria", "Alugada", "Cedida", "Financiada"]).default("Propria"),
  tem_saneamento_basico: z.boolean().default(true),
  tem_energia_eletrica: z.boolean().default(true),
  
  // Barreiras e Incapacidade
  descricao_barreiras_arquitetonicas: optionalStr,
  impacto_incapacidade_trabalho: optionalStr,
  
  // Relatório
  relatorio_social: z.string().min(10, "Relatório social deve ser mais detalhado (mínimo 10 caracteres)"),
  parecer_final: z.string().min(5, "Parecer final é obrigatório"),
  
  data_avaliacao: z.string().length(10, "Data inválida — formato esperado: AAAA-MM-DD")
})

export type VagaFixaInput = z.infer<typeof vagaFixaSchema>
export type AgendamentoHistoricoInput = z.infer<typeof agendamentoHistoricoSchema>
export type ProfissionalInput = z.infer<typeof profissionalSchema>
export type EspecialidadeInput = z.infer<typeof especialidadeSchema>
export type GradeHorariaInput = z.infer<typeof gradeHorariaSchema>
export type AvaliacaoServicoSocialInput = z.infer<typeof avaliacaoServicoSocialSchema>
