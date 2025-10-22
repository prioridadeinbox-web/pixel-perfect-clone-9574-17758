-- Grant authenticated users read access to timeline attachments in 'documentos/comprovantes/*'
-- This fixes traders not being able to view admin-uploaded attachments due to RLS

-- Ensure Row Level Security is enabled on storage.objects (it is by default)
-- Add SELECT policy restricted to the 'documentos' bucket and 'comprovantes/' prefix
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'timeline_comprovantes_select'
  ) THEN
    CREATE POLICY "timeline_comprovantes_select"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'documentos'
      AND (left(name, 12) = 'comprovantes/')
    );
  END IF;
END $$;
