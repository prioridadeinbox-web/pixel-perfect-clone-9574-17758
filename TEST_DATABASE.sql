-- =====================================================
-- SCRIPT DE TESTE - INSERIR DADOS DE EXEMPLO
-- Execute após rodar o COMPLETE_DATABASE_SETUP.sql
-- =====================================================

-- ⚠️ IMPORTANTE: ORDEM DE EXECUÇÃO
-- 1. Execute o COMPLETE_DATABASE_SETUP.sql primeiro
-- 2. Crie o admin chamando a Edge Function:
--    curl -X POST https://zelqxxlqptmapkuaseix.supabase.co/functions/v1/setup-admin
-- 3. Execute este script (TEST_DATABASE.sql)
-- 4. Faça login com: admin@sistema.com / Admin@123456

-- =====================================================
-- DADOS DE TESTE
-- =====================================================

-- 1. CRIAR PLANOS DE EXEMPLO
INSERT INTO planos (nome_plano, descricao, preco) VALUES
  ('Plano Básico', 'Plano inicial para traders iniciantes', 1000.00),
  ('Plano Pro', 'Plano intermediário com mais recursos', 5000.00),
  ('Plano Premium', 'Plano completo para traders profissionais', 10000.00)
ON CONFLICT DO NOTHING;

-- 2. CRIAR UM USUÁRIO CLIENTE DE TESTE (opcional)
-- Este bloco criará dados de teste para o primeiro usuário encontrado
DO $$
DECLARE
  test_user_id UUID;
  test_plano_id UUID;
  test_plano_adquirido_id UUID;
BEGIN
  -- Pegar qualquer usuário que não seja admin
  SELECT p.id INTO test_user_id
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'admin'
  WHERE ur.role IS NULL
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Atribuir plano Pro ao usuário de teste
    SELECT id INTO test_plano_id FROM planos WHERE nome_plano = 'Plano Pro' LIMIT 1;
    
    INSERT INTO planos_adquiridos (
      cliente_id, 
      plano_id, 
      id_carteira, 
      tipo_saque, 
      status_plano
    ) VALUES (
      test_user_id,
      test_plano_id,
      'CARTEIRA-TESTE-001',
      'mensal',
      'ativo'
    )
    RETURNING id INTO test_plano_adquirido_id;
    
    -- Criar solicitação de saque
    INSERT INTO solicitacoes (
      user_id,
      plano_adquirido_id,
      tipo_solicitacao,
      descricao,
      status
    ) VALUES (
      test_user_id,
      test_plano_adquirido_id,
      'saque',
      '500.00',
      'pendente'
    );
    
    -- Criar entrada no histórico
    INSERT INTO historico_observacoes (
      plano_adquirido_id,
      tipo_evento,
      observacao,
      origem
    ) VALUES (
      test_plano_adquirido_id,
      'inicio',
      'Plano iniciado com sucesso',
      'admin'
    );
    
    RAISE NOTICE 'Dados de teste criados para usuário: %', test_user_id;
  END IF;
END $$;

-- 3. CONFIGURAR LINKS DA PLATAFORMA
INSERT INTO platform_config (config_key, config_value) VALUES
  ('profit_one_link', 'https://exemplo.com/profit-one'),
  ('profit_pro_link', 'https://exemplo.com/profit-pro')
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value;

-- =====================================================
-- VERIFICAÇÕES FINAIS
-- =====================================================

-- Ver todos os usuários e suas roles
SELECT 
  p.nome,
  p.email,
  COALESCE(STRING_AGG(ur.role::text, ', '), 'sem role') as roles,
  p.status_plataforma,
  p.pagamento_ativo
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
GROUP BY p.id, p.nome, p.email, p.status_plataforma, p.pagamento_ativo;

-- Ver planos disponíveis
SELECT 
  nome_plano,
  preco,
  descricao
FROM planos
ORDER BY preco;

-- Ver planos adquiridos
SELECT 
  p.nome as cliente,
  p.email,
  pl.nome_plano,
  pa.id_carteira,
  pa.status_plano,
  pa.tipo_saque,
  pa.data_aquisicao
FROM planos_adquiridos pa
JOIN profiles p ON p.id = pa.cliente_id
JOIN planos pl ON pl.id = pa.plano_id
ORDER BY pa.created_at DESC;

-- Ver solicitações
SELECT 
  p.nome as cliente,
  s.tipo_solicitacao,
  s.descricao,
  s.status,
  s.created_at
FROM solicitacoes s
JOIN profiles p ON p.id = s.user_id
ORDER BY s.created_at DESC;

-- =====================================================
-- 🔑 CREDENCIAIS DE ACESSO:
-- Email: admin@sistema.com
-- Senha: Admin@123456
--
-- 📍 URLs:
-- Login: /
-- Dashboard Admin: /admin
-- Dashboard Cliente: /dashboard
-- =====================================================
