-- Fix the profiles table RLS policy to properly block anonymous access
-- The current policy uses 'false' for all operations which is too restrictive
-- We need to explicitly scope it to the 'anon' role only

DROP POLICY IF EXISTS "Block all anonymous access to profiles" ON public.profiles;

CREATE POLICY "Block all anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);