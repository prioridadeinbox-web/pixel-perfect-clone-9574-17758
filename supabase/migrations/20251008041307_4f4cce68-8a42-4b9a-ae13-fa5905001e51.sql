-- Adicionar campo statusPlataforma à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status_plataforma text DEFAULT 'Inativa';

-- Atualizar registros existentes baseado no pagamento_ativo
UPDATE public.profiles 
SET status_plataforma = CASE 
  WHEN pagamento_ativo = true THEN 'Ativa'
  ELSE 'Inativa'
END;

-- Criar função para sincronizar status_plataforma quando pagamento_ativo mudar
CREATE OR REPLACE FUNCTION public.sync_platform_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Atualizar status_plataforma baseado em pagamento_ativo
  IF NEW.pagamento_ativo = true THEN
    NEW.status_plataforma := 'Ativa';
  ELSE
    NEW.status_plataforma := 'Inativa';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função antes de UPDATE
CREATE TRIGGER sync_platform_status_on_payment_change
  BEFORE UPDATE OF pagamento_ativo ON public.profiles
  FOR EACH ROW
  WHEN (OLD.pagamento_ativo IS DISTINCT FROM NEW.pagamento_ativo)
  EXECUTE FUNCTION public.sync_platform_status();