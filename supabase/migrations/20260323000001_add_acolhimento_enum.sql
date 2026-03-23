-- Migration para adicionar 'Acolhimento' ao enum tipo_atendimento_enum

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumtypid = 'public.tipo_atendimento_enum'::regtype 
        AND enumlabel = 'Acolhimento'
    ) THEN
        ALTER TYPE public.tipo_atendimento_enum ADD VALUE 'Acolhimento';
    END IF;
END $$;
