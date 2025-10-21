-- Criar buckets de storage para documentos e fotos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documentos', 'documentos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('fotos-perfil', 'fotos-perfil', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Criar tabela para documentos dos usuários
CREATE TABLE public.user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo_documento text NOT NULL CHECK (tipo_documento IN ('cnh', 'rg', 'cpf', 'selfie_rg')),
  arquivo_url text NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tipo_documento)
);

-- Criar tabela para solicitações dos traders
CREATE TABLE public.solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plano_adquirido_id uuid REFERENCES planos_adquiridos(id) ON DELETE CASCADE,
  tipo_solicitacao text NOT NULL CHECK (tipo_solicitacao IN ('mudanca_saque', 'segunda_chance', 'aprovacao_teste', 'saque')),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'atendida', 'rejeitada')),
  descricao text,
  resposta_admin text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  atendida_em timestamptz,
  atendida_por uuid REFERENCES profiles(id)
);

-- Adicionar campos novos na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pagamento_ativo boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS documentos_completos boolean DEFAULT false;

-- Enable RLS nas novas tabelas
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies para user_documents
CREATE POLICY "Users can view their own documents"
  ON public.user_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own documents"
  ON public.user_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON public.user_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents"
  ON public.user_documents FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all documents"
  ON public.user_documents FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para solicitacoes
CREATE POLICY "Users can view their own requests"
  ON public.solicitacoes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
  ON public.solicitacoes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
  ON public.solicitacoes FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all requests"
  ON public.solicitacoes FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para Storage - documentos bucket
CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documentos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documentos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documentos' AND 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies para Storage - fotos-perfil bucket (público)
CREATE POLICY "Users can upload their own profile photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'fotos-perfil' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own profile photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'fotos-perfil' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view profile photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'fotos-perfil');

-- Trigger para updated_at
CREATE TRIGGER update_user_documents_updated_at
  BEFORE UPDATE ON public.user_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_solicitacoes_updated_at
  BEFORE UPDATE ON public.solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX idx_user_documents_status ON public.user_documents(status);
CREATE INDEX idx_solicitacoes_user_id ON public.solicitacoes(user_id);
CREATE INDEX idx_solicitacoes_tipo ON public.solicitacoes(tipo_solicitacao);
CREATE INDEX idx_solicitacoes_status ON public.solicitacoes(status);
CREATE INDEX idx_solicitacoes_created_at ON public.solicitacoes(created_at DESC);