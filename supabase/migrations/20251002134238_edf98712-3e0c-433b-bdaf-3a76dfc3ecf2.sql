-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'cliente');

-- Create enum for plan status
CREATE TYPE public.plan_status AS ENUM (
  'eliminado',
  'segunda_chance',
  'teste_1',
  'teste_2',
  'sim_rem',
  'ativo',
  'pausado'
);

-- Create enum for withdrawal type
CREATE TYPE public.withdrawal_type AS ENUM ('mensal', 'quinzenal');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  foto_perfil TEXT,
  informacoes_personalizadas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
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

-- Create planos table
CREATE TABLE public.planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_plano TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on planos
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

-- Create planos_adquiridos table
CREATE TABLE public.planos_adquiridos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plano_id UUID REFERENCES public.planos(id) ON DELETE CASCADE NOT NULL,
  status_plano plan_status DEFAULT 'ativo',
  tipo_saque withdrawal_type NOT NULL,
  id_carteira TEXT NOT NULL,
  data_aquisicao TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on planos_adquiridos
ALTER TABLE public.planos_adquiridos ENABLE ROW LEVEL SECURITY;

-- Create historico_observacoes table (timeline)
CREATE TABLE public.historico_observacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_adquirido_id UUID REFERENCES public.planos_adquiridos(id) ON DELETE CASCADE NOT NULL,
  observacao TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on historico_observacoes
ALTER TABLE public.historico_observacoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for planos
CREATE POLICY "Everyone can view planos"
  ON public.planos FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage planos"
  ON public.planos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for planos_adquiridos
CREATE POLICY "Users can view their own planos"
  ON public.planos_adquiridos FOR SELECT
  USING (auth.uid() = cliente_id);

CREATE POLICY "Admins can view all planos_adquiridos"
  ON public.planos_adquiridos FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage planos_adquiridos"
  ON public.planos_adquiridos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for historico_observacoes
CREATE POLICY "Users can view their plan history"
  ON public.historico_observacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.planos_adquiridos
      WHERE planos_adquiridos.id = historico_observacoes.plano_adquirido_id
      AND planos_adquiridos.cliente_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all history"
  ON public.historico_observacoes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all history"
  ON public.historico_observacoes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email
  );
  
  -- Assign default role (cliente)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
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