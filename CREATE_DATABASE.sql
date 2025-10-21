-- =====================================================
-- CREATE DATABASE FROM SCRATCH
-- =====================================================
-- Este script cria toda a estrutura do banco de dados
-- Executar em um banco de dados VAZIO
-- =====================================================

-- TIPOS ENUMERADOS
CREATE TYPE public.app_role AS ENUM ('admin', 'cliente', 'superadmin');
CREATE TYPE public.plan_status AS ENUM ('ativo', 'pausado', 'concluido', 'cancelado');
CREATE TYPE public.withdrawal_type AS ENUM ('mensal', 'quinzenal');

-- TABELAS
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  data_nascimento DATE,
  rua_bairro TEXT,
  numero_residencial TEXT,
  cep TEXT,
  cidade TEXT,
  estado TEXT,
  foto_perfil TEXT,
  informacoes_personalizadas TEXT,
  pagamento_ativo BOOLEAN DEFAULT true,
  status_plataforma TEXT DEFAULT 'Inativa',
  documentos_completos BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE TABLE public.planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_plano TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.planos_adquiridos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plano_id UUID NOT NULL REFERENCES public.planos(id) ON DELETE CASCADE,
  id_carteira TEXT NOT NULL,
  tipo_saque public.withdrawal_type NOT NULL,
  status_plano public.plan_status DEFAULT 'ativo',
  data_aquisicao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plano_adquirido_id UUID REFERENCES public.planos_adquiridos(id) ON DELETE SET NULL,
  tipo_solicitacao TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  resposta_admin TEXT,
  atendida_por UUID REFERENCES auth.users(id),
  atendida_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.historico_observacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_adquirido_id UUID NOT NULL REFERENCES public.planos_adquiridos(id) ON DELETE CASCADE,
  solicitacao_id UUID REFERENCES public.solicitacoes(id) ON DELETE SET NULL,
  tipo_evento TEXT,
  valor_solicitado NUMERIC,
  valor_final NUMERIC,
  status_evento TEXT,
  observacao TEXT NOT NULL,
  comprovante_url TEXT,
  origem TEXT DEFAULT 'usuario',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL,
  arquivo_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ÍNDICES
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_planos_adquiridos_cliente_id ON public.planos_adquiridos(cliente_id);
CREATE INDEX idx_solicitacoes_user_id ON public.solicitacoes(user_id);
CREATE INDEX idx_solicitacoes_status ON public.solicitacoes(status);
CREATE INDEX idx_historico_plano_adquirido_id ON public.historico_observacoes(plano_adquirido_id);
CREATE INDEX idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX idx_system_logs_expires_at ON public.system_logs(expires_at);

-- FUNÇÕES
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente');
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_platform_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pagamento_ativo = true THEN
    NEW.status_plataforma := 'Ativa';
  ELSE
    NEW.status_plataforma := 'Inativa';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_timeline_entry_on_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.historico_observacoes (
    plano_adquirido_id,
    solicitacao_id,
    tipo_evento,
    valor_solicitado,
    status_evento,
    observacao
  )
  VALUES (
    NEW.plano_adquirido_id,
    NEW.id,
    NEW.tipo_solicitacao,
    CASE 
      WHEN NEW.descricao ~ '^[0-9]+\.?[0-9]*$' THEN NEW.descricao::numeric
      ELSE NULL
    END,
    NEW.status,
    NEW.descricao
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_timeline_entry_on_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.historico_observacoes (
    plano_adquirido_id,
    solicitacao_id,
    tipo_evento,
    status_evento,
    observacao,
    origem
  )
  VALUES (
    NEW.plano_adquirido_id,
    NEW.id,
    NEW.tipo_solicitacao,
    NEW.status,
    COALESCE(NEW.resposta_admin, 'Status atualizado'),
    'admin'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.* IS DISTINCT FROM NEW.*) THEN
    RAISE LOG '[SECURITY_AUDIT] Profile updated: user_id=%, updated_by=%, sensitive_fields=%',
      NEW.id,
      auth.uid(),
      CASE 
        WHEN OLD.cpf IS DISTINCT FROM NEW.cpf THEN 'cpf '
        ELSE ''
      END ||
      CASE 
        WHEN OLD.email IS DISTINCT FROM NEW.email THEN 'email '
        ELSE ''
      END ||
      CASE 
        WHEN OLD.telefone IS DISTINCT FROM NEW.telefone THEN 'telefone '
        ELSE ''
      END ||
      CASE 
        WHEN OLD.data_nascimento IS DISTINCT FROM NEW.data_nascimento THEN 'data_nascimento '
        ELSE ''
      END;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE WARNING '[SECURITY_AUDIT] Role change: user_id=%, old_role=%, new_role=%, changed_by=%',
    COALESCE(NEW.user_id, OLD.user_id),
    OLD.role,
    NEW.role,
    auth.uid();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_expired_logs()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.system_logs WHERE expires_at < now();
END;
$$;

-- TRIGGERS
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planos_updated_at
  BEFORE UPDATE ON public.planos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planos_adquiridos_updated_at
  BEFORE UPDATE ON public.planos_adquiridos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_solicitacoes_updated_at
  BEFORE UPDATE ON public.solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_documents_updated_at
  BEFORE UPDATE ON public.user_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER sync_platform_status_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_platform_status();

CREATE TRIGGER create_timeline_on_request
  AFTER INSERT ON public.solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_timeline_entry_on_request();

CREATE TRIGGER update_timeline_on_request
  AFTER UPDATE ON public.solicitacoes
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.resposta_admin IS DISTINCT FROM NEW.resposta_admin)
  EXECUTE FUNCTION public.update_timeline_entry_on_request();

CREATE TRIGGER audit_profile_updates
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_access();

CREATE TRIGGER log_role_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_changes();

-- ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_adquiridos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_observacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES - PROFILES
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- POLICIES - USER_ROLES
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert roles" ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() <> user_id);

CREATE POLICY "Only admins can update OTHER users roles" ON public.user_roles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') AND auth.uid() <> user_id);

CREATE POLICY "Only admins can delete roles" ON public.user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') AND auth.uid() <> user_id);

-- POLICIES - PLANOS
CREATE POLICY "Authenticated users can view planos" ON public.planos
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage planos" ON public.planos
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- POLICIES - PLANOS_ADQUIRIDOS
CREATE POLICY "Users can view their own planos" ON public.planos_adquiridos
  FOR SELECT
  USING (auth.uid() = cliente_id);

CREATE POLICY "Admins can view all planos_adquiridos" ON public.planos_adquiridos
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert planos_adquiridos" ON public.planos_adquiridos
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update planos_adquiridos" ON public.planos_adquiridos
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete planos_adquiridos" ON public.planos_adquiridos
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- POLICIES - SOLICITACOES
CREATE POLICY "Users can view their own requests" ON public.solicitacoes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests" ON public.solicitacoes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests" ON public.solicitacoes
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all requests" ON public.solicitacoes
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- POLICIES - HISTORICO_OBSERVACOES
CREATE POLICY "Users can view their plan history" ON public.historico_observacoes
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.planos_adquiridos
    WHERE planos_adquiridos.id = historico_observacoes.plano_adquirido_id
    AND planos_adquiridos.cliente_id = auth.uid()
  ));

CREATE POLICY "Users can create history for their plans" ON public.historico_observacoes
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.planos_adquiridos
    WHERE planos_adquiridos.id = historico_observacoes.plano_adquirido_id
    AND planos_adquiridos.cliente_id = auth.uid()
  ));

CREATE POLICY "Admins can view all history" ON public.historico_observacoes
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all history" ON public.historico_observacoes
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- POLICIES - USER_DOCUMENTS
CREATE POLICY "Users can view their own documents" ON public.user_documents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own documents" ON public.user_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON public.user_documents
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON public.user_documents
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents" ON public.user_documents
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all documents" ON public.user_documents
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- POLICIES - SYSTEM_LOGS
CREATE POLICY "Admins can view all logs" ON public.system_logs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ));

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public_access)
VALUES
  ('documentos', 'documentos', false),
  ('fotos-perfil', 'fotos-perfil', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public_access = EXCLUDED.public_access;

-- STORAGE POLICIES - DOCUMENTOS
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documentos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documentos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'documentos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'documentos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all documents" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documentos'
    AND public.has_role(auth.uid(), 'admin')
  );

-- STORAGE POLICIES - FOTOS-PERFIL
CREATE POLICY "Anyone can view profile photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'fotos-perfil');

CREATE POLICY "Users can upload their own profile photo" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'fotos-perfil'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own profile photo" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'fotos-perfil'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile photo" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'fotos-perfil'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
