-- Add new registration fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS rua_bairro TEXT,
ADD COLUMN IF NOT EXISTS numero_residencial TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT;

-- Add constraints for data validation
ALTER TABLE public.profiles
ADD CONSTRAINT check_telefone_length CHECK (telefone IS NULL OR length(telefone) >= 10),
ADD CONSTRAINT check_cpf_format CHECK (cpf IS NULL OR length(cpf) = 11),
ADD CONSTRAINT check_cep_format CHECK (cep IS NULL OR length(cep) = 8),
ADD CONSTRAINT check_estado_format CHECK (estado IS NULL OR length(estado) = 2);