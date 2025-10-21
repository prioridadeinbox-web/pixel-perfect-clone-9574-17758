-- Adicionar política RLS para permitir INSERT em historico_observacoes
-- quando o plano pertence ao usuário que está criando a solicitação
CREATE POLICY "Users can create history for their plans"
ON public.historico_observacoes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.planos_adquiridos
    WHERE id = plano_adquirido_id
    AND cliente_id = auth.uid()
  )
);