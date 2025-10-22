-- Fix storage policy so traders (authenticated) can view admin-uploaded receipts under documentos/comprovantes/
-- Drop previous policy if it exists
DROP POLICY IF EXISTS "timeline_comprovantes_select" ON storage.objects;

-- Create precise SELECT policy for authenticated users on the documentos bucket, comprovantes prefix
CREATE POLICY "timeline_comprovantes_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos'
  AND (
    name LIKE 'comprovantes/%'
  )
);

-- Note: createSignedUrl requires SELECT on storage.objects entries.
-- This policy intentionally scopes to the comprovantes/ prefix only.
