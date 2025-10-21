-- Remover "segunda_chance" do enum plan_status
-- Primeiro criar o novo enum sem segunda_chance
CREATE TYPE plan_status_new AS ENUM ('eliminado', 'teste_1', 'teste_2', 'sim_rem', 'ativo', 'pausado');

-- Atualizar qualquer registro que tenha segunda_chance para ativo
UPDATE planos_adquiridos 
SET status_plano = 'ativo' 
WHERE status_plano = 'segunda_chance';

-- Remover o default temporariamente
ALTER TABLE planos_adquiridos 
ALTER COLUMN status_plano DROP DEFAULT;

-- Alterar a coluna para usar o novo tipo
ALTER TABLE planos_adquiridos 
ALTER COLUMN status_plano TYPE plan_status_new 
USING status_plano::text::plan_status_new;

-- Remover o tipo antigo e renomear o novo
DROP TYPE plan_status;
ALTER TYPE plan_status_new RENAME TO plan_status;

-- Restaurar o default
ALTER TABLE planos_adquiridos 
ALTER COLUMN status_plano SET DEFAULT 'ativo'::plan_status;