-- Allow users to delete their own documents (DB table)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_documents' AND policyname = 'Users can delete their own documents'
  ) THEN
    CREATE POLICY "Users can delete their own documents"
    ON public.user_documents
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Storage policies for 'documentos' bucket (delete own files)
DO $$ BEGIN
  -- DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete own documentos files'
  ) THEN
    CREATE POLICY "Users can delete own documentos files"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'documentos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- SELECT policy (defensive: ensure read access for own files)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can read own documentos files'
  ) THEN
    CREATE POLICY "Users can read own documentos files"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'documentos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- INSERT policy (defensive: ensure upload to own folder)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload to documentos folder'
  ) THEN
    CREATE POLICY "Users can upload to documentos folder"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'documentos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;