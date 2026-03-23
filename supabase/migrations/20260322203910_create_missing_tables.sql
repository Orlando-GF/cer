-- 1. logs_auditoria (Documentação)
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tabela_afetada character varying NOT NULL,
    registro_id uuid NOT NULL,
    acao character varying NOT NULL,
    dados_antigos jsonb,
    dados_novos jsonb,
    autor_id uuid REFERENCES auth.users(id),
    data_hora timestamp with time zone DEFAULT now()
);

-- 2. avaliacoes_servico_social (Criação)
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
    data_avaliacao date NOT NULL,
    criado_em timestamptz DEFAULT now()
);

-- 3. grade_horaria (Criação)
CREATE TABLE IF NOT EXISTS public.grade_horaria (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profissional_id uuid NOT NULL REFERENCES public.profissionais(id),
    dia_semana integer NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
    horario_inicio time NOT NULL,
    horario_fim time NOT NULL,
    capacidade integer NOT NULL DEFAULT 1,
    ativo boolean DEFAULT true,
    criado_em timestamptz DEFAULT now()
);
