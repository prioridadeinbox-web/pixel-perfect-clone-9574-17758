-- Change default value of pagamento_ativo to false for new users
ALTER TABLE profiles ALTER COLUMN pagamento_ativo SET DEFAULT false;
