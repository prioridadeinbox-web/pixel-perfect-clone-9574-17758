-- Adicionar campo para identificar quem criou a entrada (usuário ou admin)
ALTER TABLE public.historico_observacoes 
ADD COLUMN origem text DEFAULT 'usuario' CHECK (origem IN ('usuario', 'admin'));

-- Atualizar entradas existentes como sendo do usuário
UPDATE public.historico_observacoes SET origem = 'usuario';

-- Recriar função para INSERIR nova entrada quando admin atualiza (não mais UPDATE)
CREATE OR REPLACE FUNCTION public.update_timeline_entry_on_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir NOVA entrada na linha do tempo com resposta do admin
  -- (não atualizar a entrada existente)
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