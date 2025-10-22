-- Adicionar novos status ao enum plan_status
ALTER TYPE plan_status ADD VALUE IF NOT EXISTS 'teste_1_sc';
ALTER TYPE plan_status ADD VALUE IF NOT EXISTS 'teste_2_sc';

-- Criar tabela para configurações dos links de ativação
CREATE TABLE IF NOT EXISTS public.platform_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- Admins podem visualizar configurações
CREATE POLICY "Admins can view platform_config"
ON public.platform_config
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Admins podem gerenciar configurações
CREATE POLICY "Admins can manage platform_config"
ON public.platform_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Usuários autenticados podem visualizar para usar os links
CREATE POLICY "Users can view platform_config"
ON public.platform_config
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Inserir valores padrão para os links
INSERT INTO public.platform_config (config_key, config_value)
VALUES 
  ('profit_one_link', 'https://exemplo.com/profit-one'),
  ('profit_pro_link', 'https://exemplo.com/profit-pro')
ON CONFLICT (config_key) DO NOTHING;