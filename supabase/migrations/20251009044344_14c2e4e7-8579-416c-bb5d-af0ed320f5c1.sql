-- Create super_admin role in the enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'cliente');
  END IF;
END $$;

-- Add super_admin to the existing enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';