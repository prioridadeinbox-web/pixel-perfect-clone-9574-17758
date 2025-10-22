-- =====================================================
-- SCRIPT DE TESTE - INSERIR DADOS DE EXEMPLO
-- Execute este SQL após rodar o COMPLETE_DATABASE_SETUP.sql
-- =====================================================

-- 1. TORNAR EDUARDO ADMIN (já tem usuário no banco)
INSERT INTO user_roles (user_id, role)
VALUES ('8570bfa2-651c-4c66-aa7c-9d3b5c1d0565', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. CRIAR PLANOS DE EXEMPLO
INSERT INTO planos (nome_plano, descricao, preco) VALUES
  ('Plano Básico', 'Plano inicial para traders iniciantes', 1000.00),
  ('Plano Pro', 'Plano intermediário com mais recursos', 5000.00),
  ('Plano Premium', 'Plano completo para traders profissionais', 10000.00)
ON CONFLICT DO NOTHING;

-- 3. ATRIBUIR UM PLANO AO EDUARDO (para testar dashboard)
INSERT INTO planos_adquiridos (
  cliente_id, 
  plano_id, 
  id_carteira, 
  tipo_saque, 
  status_plano
)
SELECT 
  '8570bfa2-651c-4c66-aa7c-9d3b5c1d0565',
  id,
  'CARTEIRA-TESTE-001',
  'mensal',
  'ativo'
FROM planos 
WHERE nome_plano = 'Plano Pro'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 4. CRIAR ALGUMAS SOLICITAÇÕES DE TESTE
INSERT INTO solicitacoes (
  user_id,
  plano_adquirido_id,
  tipo_solicitacao,
  descricao,
  status
)
SELECT 
  '8570bfa2-651c-4c66-aa7c-9d3b5c1d0565',
  pa.id,
  'saque',
  '500.00',
  'pendente'
FROM planos_adquiridos pa
WHERE pa.cliente_id = '8570bfa2-651c-4c66-aa7c-9d3b5c1d0565'
LIMIT 1;

-- 5. CRIAR ENTRADA NO HISTÓRICO
INSERT INTO historico_observacoes (
  plano_adquirido_id,
  tipo_evento,
  observacao,
  origem
)
SELECT 
  pa.id,
  'inicio',
  'Plano iniciado com sucesso',
  'admin'
FROM planos_adquiridos pa
WHERE pa.cliente_id = '8570bfa2-651c-4c66-aa7c-9d3b5c1d0565'
LIMIT 1;

-- 6. CONFIGURAR LINKS DA PLATAFORMA
INSERT INTO platform_config (config_key, config_value) VALUES
  ('profit_one_link', 'https://exemplo.com/profit-one'),
  ('profit_pro_link', 'https://exemplo.com/profit-pro')
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value;

-- =====================================================
-- VERIFICAÇÕES
-- =====================================================

-- Ver todos os usuários e suas roles
SELECT 
  p.nome,
  p.email,
  ur.role,
  p.status_plataforma,
  p.pagamento_ativo
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id;

-- Ver planos disponíveis
SELECT * FROM planos;

-- Ver planos adquiridos
SELECT 
  p.nome as cliente,
  pl.nome_plano,
  pa.id_carteira,
  pa.status_plano,
  pa.tipo_saque
FROM planos_adquiridos pa
JOIN profiles p ON p.id = pa.cliente_id
JOIN planos pl ON pl.id = pa.plano_id;

-- Ver solicitações
SELECT 
  p.nome as cliente,
  s.tipo_solicitacao,
  s.descricao,
  s.status,
  s.created_at
FROM solicitacoes s
JOIN profiles p ON p.id = s.user_id;

-- Ver histórico
SELECT 
  p.nome as cliente,
  h.tipo_evento,
  h.observacao,
  h.origem,
  h.created_at
FROM historico_observacoes h
JOIN planos_adquiridos pa ON pa.id = h.plano_adquirido_id
JOIN profiles p ON p.id = pa.cliente_id;

-- =====================================================
-- RESULTADO ESPERADO:
-- - Eduardo agora é ADMIN
-- - 3 planos criados (Básico, Pro, Premium)
-- - Eduardo tem o Plano Pro ativo
-- - 1 solicitação de saque pendente
-- - 1 entrada no histórico
-- =====================================================
