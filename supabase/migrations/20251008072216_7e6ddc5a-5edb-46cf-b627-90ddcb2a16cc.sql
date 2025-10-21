-- Adicionar políticas para admins fazerem upload de comprovantes
CREATE POLICY "Admins can upload payment receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos' 
  AND (storage.foldername(name))[1] = 'comprovantes'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Política para admins atualizarem comprovantes
CREATE POLICY "Admins can update payment receipts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documentos' 
  AND (storage.foldername(name))[1] = 'comprovantes'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Política para admins visualizarem comprovantes
CREATE POLICY "Admins can view payment receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos' 
  AND (storage.foldername(name))[1] = 'comprovantes'
  AND has_role(auth.uid(), 'admin'::app_role)
);