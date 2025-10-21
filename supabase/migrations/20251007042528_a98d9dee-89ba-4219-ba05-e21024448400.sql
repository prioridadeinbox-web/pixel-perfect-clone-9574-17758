-- Recriar função has_role com search_path correto (sem dropar)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Adicionar índices para melhorar performance e segurança
CREATE INDEX IF NOT EXISTS idx_solicitacoes_user_id ON public.solicitacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON public.solicitacoes(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_created_at ON public.solicitacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_planos_adquiridos_cliente_id ON public.planos_adquiridos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Adicionar constraint para limitar tamanho de descrição (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_descricao_length'
  ) THEN
    ALTER TABLE public.solicitacoes 
    ADD CONSTRAINT check_descricao_length 
    CHECK (char_length(descricao) <= 1000);
  END IF;
END $$;

-- Adicionar constraint para validar tipos de solicitação (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_tipo_solicitacao'
  ) THEN
    ALTER TABLE public.solicitacoes
    ADD CONSTRAINT check_tipo_solicitacao
    CHECK (tipo_solicitacao IN ('saque', 'saque_quinzenal', 'segunda_chance', 'outro'));
  END IF;
END $$;

-- Comentários para documentação
COMMENT ON TABLE public.solicitacoes IS 'Tabela de solicitações dos traders - auditada e protegida por RLS';
COMMENT ON COLUMN public.solicitacoes.tipo_solicitacao IS 'Tipos válidos: saque, saque_quinzenal, segunda_chance, outro';
COMMENT ON COLUMN public.solicitacoes.descricao IS 'Descrição da solicitação - máximo 1000 caracteres';