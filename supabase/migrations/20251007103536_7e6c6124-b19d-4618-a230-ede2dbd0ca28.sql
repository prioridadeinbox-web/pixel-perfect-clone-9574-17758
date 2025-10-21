-- Expandir a tabela historico_observacoes para suportar linha do tempo completa
ALTER TABLE public.historico_observacoes
ADD COLUMN tipo_evento text,
ADD COLUMN valor_solicitado numeric,
ADD COLUMN valor_final numeric,
ADD COLUMN status_evento text,
ADD COLUMN comprovante_url text,
ADD COLUMN solicitacao_id uuid REFERENCES public.solicitacoes(id);

-- Criar índice para melhor performance
CREATE INDEX idx_historico_plano_adquirido ON public.historico_observacoes(plano_adquirido_id);
CREATE INDEX idx_historico_solicitacao ON public.historico_observacoes(solicitacao_id);

-- Criar função para inserir automaticamente no histórico quando uma solicitação é criada
CREATE OR REPLACE FUNCTION public.create_timeline_entry_on_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir entrada na linha do tempo
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

-- Criar trigger para executar a função quando uma solicitação é criada
CREATE TRIGGER on_solicitacao_created
  AFTER INSERT ON public.solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_timeline_entry_on_request();

-- Criar função para atualizar a linha do tempo quando uma solicitação é atualizada
CREATE OR REPLACE FUNCTION public.update_timeline_entry_on_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar entrada existente na linha do tempo
  UPDATE public.historico_observacoes
  SET 
    status_evento = NEW.status,
    observacao = COALESCE(NEW.resposta_admin, observacao)
  WHERE solicitacao_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função quando uma solicitação é atualizada
CREATE TRIGGER on_solicitacao_updated
  AFTER UPDATE ON public.solicitacoes
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.resposta_admin IS DISTINCT FROM NEW.resposta_admin)
  EXECUTE FUNCTION public.update_timeline_entry_on_request();