-- 1. Atualização de Enums existentes
ALTER TYPE tipo_atendimento_enum ADD VALUE IF NOT EXISTS 'Avaliacao_Diagnostica';

-- 2. Novos Enums
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_vaga_enum') THEN
        CREATE TYPE status_vaga_enum AS ENUM ('Ativa', 'Suspensa', 'Encerrada');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conduta_evolucao_enum') THEN
        CREATE TYPE conduta_evolucao_enum AS ENUM (
            'Retorno', 
            'Alta por Melhoria', 
            'Alta por Abandono', 
            'Alta a Pedido', 
            'Obito/Transferencia', 
            'Encaminhamento Externo', 
            'Inserir em Fila de Terapia'
        );
    END IF;
END $$;

-- 3. Modificações em Tabelas Existentes
ALTER TABLE pacientes 
  ADD COLUMN IF NOT EXISTS tags_acessibilidade VARCHAR[] DEFAULT '{}';

ALTER TABLE profissionais 
  ADD COLUMN IF NOT EXISTS especialidades_permitidas UUID[] DEFAULT '{}';

-- 4. Nova Tabela: vagas_fixas (O Contrato Dinâmico)
CREATE TABLE IF NOT EXISTS vagas_fixas (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id          UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    profissional_id      UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
    especialidade_id     UUID NOT NULL REFERENCES linhas_cuidado_especialidades(id) ON DELETE CASCADE,
    dia_semana           INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    horario_inicio       TIME NOT NULL,
    horario_fim          TIME NOT NULL,
    data_inicio_contrato DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim_contrato    DATE,
    status_vaga          status_vaga_enum DEFAULT 'Ativa',
    criado_em            TIMESTAMPTZ DEFAULT now(),
    atualizado_em        TIMESTAMPTZ DEFAULT now()
);

-- 5. Refatoração da Tabela: agendamentos -> agendamentos_historico (Materialização)
-- Se a tabela agendamentos já existe, vamos renomeá-la e ajustar as colunas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agendamentos' AND table_schema = 'public') THEN
        ALTER TABLE agendamentos RENAME TO agendamentos_historico;
    END IF;
END $$;

-- Ajustando colunas da agendamentos_historico
ALTER TABLE agendamentos_historico 
  RENAME COLUMN data_hora TO data_hora_inicio;

ALTER TABLE agendamentos_historico
  ADD COLUMN IF NOT EXISTS data_hora_fim TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vaga_fixa_id UUID REFERENCES vagas_fixas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tipo_vaga VARCHAR DEFAULT 'Regular',
  ADD COLUMN IF NOT EXISTS tipo_agendamento VARCHAR DEFAULT 'Individual',
  ADD COLUMN IF NOT EXISTS ordem_chegada INTEGER,
  ADD COLUMN IF NOT EXISTS evolucao_clinica TEXT,
  ADD COLUMN IF NOT EXISTS conduta conduta_evolucao_enum;

-- 6. Habilitar RLS nas novas tabelas (seguindo política de LGPD do contexto)
ALTER TABLE vagas_fixas ENABLE ROW LEVEL SECURITY;
-- (As políticas específicas virão no módulo de segurança, por enquanto apenas habilitamos)

-- 7. Comentários para ajudar a IA e Desenvolvedores
COMMENT ON TABLE vagas_fixas IS 'Armazena a regra de recorrência das terapias. Não polui o calendário com registros físicos.';
COMMENT ON TABLE agendamentos_historico IS 'Materialização das sessões. Registros físicos criados apenas em Presença, Falta ou Evolução.';
