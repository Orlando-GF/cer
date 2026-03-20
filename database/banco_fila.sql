-- 1. Adicionando a coluna de faltas consecutivas na fila de espera
ALTER TABLE public.fila_espera
  ADD COLUMN IF NOT EXISTS faltas_consecutivas INTEGER DEFAULT 0;

-- 2. Garantir que frequencia_recomendada_enum aceita "A definir"
DO $$
BEGIN
  ALTER TYPE frequencia_recomendada_enum ADD VALUE 'A definir' BEFORE 'Semanal';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Adicionar o status "Em Risco" ao status_fila_enum
DO $$
BEGIN
  ALTER TYPE status_fila_enum ADD VALUE 'Em Risco' AFTER 'Em Atendimento';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Criando tabela de registro de faltas (auditoria)
CREATE TABLE IF NOT EXISTS public.faltas_registros (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fila_id        UUID NOT NULL REFERENCES public.fila_espera(id) ON DELETE CASCADE,
  data_falta     DATE NOT NULL DEFAULT CURRENT_DATE,
  justificada    BOOLEAN DEFAULT false,
  observacao     TEXT,
  registrado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em      TIMESTAMPTZ DEFAULT now()
);

-- Ativar RLS na tabela nova (opcional, mas boa prática)
ALTER TABLE public.faltas_registros ENABLE ROW LEVEL SECURITY;

-- 5. Função e Trigger para regra "3 faltas -> Em Risco"
CREATE OR REPLACE FUNCTION verificar_absenteismo()
RETURNS TRIGGER AS $$
BEGIN
  -- Se as faltas chegaram a 3 (ou mais) e o paciente ainda estiver "Aguardando"
  IF NEW.faltas_consecutivas >= 3 AND NEW.status_fila = 'Aguardando' THEN
    NEW.status_fila := 'Em Risco';
  END IF;
  
  -- Se o status for alterado manualmente para 'Em Atendimento', zera as faltas
  IF NEW.status_fila = 'Em Atendimento' AND OLD.status_fila != 'Em Atendimento' THEN
    NEW.faltas_consecutivas := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_absenteismo ON public.fila_espera;

CREATE TRIGGER trg_absenteismo
  BEFORE UPDATE OF faltas_consecutivas, status_fila ON public.fila_espera
  FOR EACH ROW EXECUTE FUNCTION verificar_absenteismo();

-- FIM.
