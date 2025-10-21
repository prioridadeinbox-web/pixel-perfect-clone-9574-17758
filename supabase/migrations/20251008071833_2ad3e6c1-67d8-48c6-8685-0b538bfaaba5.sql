-- Atualizar a constraint de status para incluir os novos status
ALTER TABLE public.solicitacoes
DROP CONSTRAINT IF EXISTS solicitacoes_status_check;

ALTER TABLE public.solicitacoes
ADD CONSTRAINT solicitacoes_status_check 
CHECK (status IN ('pendente', 'atendida', 'rejeitada', 'aprovado', 'efetuado', 'recusado'));