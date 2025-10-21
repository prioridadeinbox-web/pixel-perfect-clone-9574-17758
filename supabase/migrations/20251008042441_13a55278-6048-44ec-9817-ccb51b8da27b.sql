-- Remover o constraint conflitante antigo
ALTER TABLE public.solicitacoes 
DROP CONSTRAINT IF EXISTS solicitacoes_tipo_solicitacao_check;

-- Manter apenas o check constraint correto que permite 'saque_quinzenal'
-- O constraint 'check_tipo_solicitacao' já existe e permite os valores corretos