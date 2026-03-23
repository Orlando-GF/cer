-- Migration para documentar e criar tabelas faltantes
-- Timestamp: 20260323000000

-- 1. Renomear valor no enum
-- EXECUTADO MANUALMENTE VIA SQL EDITOR APOS VERIFICAR COUNT=0
-- ALTER TYPE public.status_presenca_enum RENAME VALUE 'Falta Injustificada' TO 'Falta Nao Justificada';

-- 2. Tabela logs_auditoria
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tabela_afetada varchar NOT NULL,
    registro_id uuid NOT NULL,
    acao varchar NOT NULL,
    dados_antigos jsonb,
    dados_novos jsonb,
    autor_id uuid REFERENCES public.profissionais(id),
    data_hora timestamptz DEFAULT now()
);

-- 3. Tabela grade_horaria
CREATE TABLE IF NOT EXISTS public.grade_horaria (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profissional_id uuid NOT NULL REFERENCES public.profissionais(id),
    dia_semana integer NOT NULL,
    horario_inicio time NOT NULL,
    horario_fim time NOT NULL,
    capacidade_atendimentos integer NOT NULL DEFAULT 1,
    ativo boolean DEFAULT true,
    data_inicio_vigencia date DEFAULT CURRENT_DATE,
    criado_em timestamptz DEFAULT now()
);

-- 4. Tabela avaliacoes_servico_social
CREATE TABLE IF NOT EXISTS public.avaliacoes_servico_social (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
    profissional_id uuid NOT NULL REFERENCES public.profissionais(id),
    quantidade_membros_familia integer NOT NULL,
    renda_familiar_total numeric NOT NULL,
    recebe_beneficio boolean DEFAULT false,
    tipo_beneficio text,
    tipo_moradia varchar CHECK (tipo_moradia IN ('Propria','Alugada','Cedida','Financiada')),
    tem_saneamento_basico boolean DEFAULT true,
    tem_energia_eletrica boolean DEFAULT true,
    descricao_barreiras_arquitetonicas text,
    impacto_incapacidade_trabalho text,
    relatorio_social text NOT NULL,
    parecer_final text NOT NULL,
    data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now()
);
