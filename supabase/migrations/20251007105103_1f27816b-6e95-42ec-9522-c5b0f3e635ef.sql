-- First, drop all existing policies to rebuild them correctly
DROP POLICY IF EXISTS "Restrict authenticated users to own profile or admin access" ON public.profiles;
DROP POLICY IF EXISTS "Block all anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny all anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;

-- CRITICAL RESTRICTIVE POLICY: Authenticated users can ONLY access their own profile OR be admin
-- This is the master defense that prevents all edge cases
CREATE POLICY "Restrict authenticated users to own profile or admin access"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- CRITICAL RESTRICTIVE POLICY: Completely block all anonymous access
CREATE POLICY "Block all anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- PERMISSIVE SELECT policies (work together with RESTRICTIVE policies above)
CREATE POLICY "Users can view only their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- PERMISSIVE INSERT policy
CREATE POLICY "Only admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- PERMISSIVE UPDATE policies
CREATE POLICY "Users can update only their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- PERMISSIVE DELETE policy
CREATE POLICY "Only admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add audit logging for sensitive profile changes
CREATE OR REPLACE FUNCTION public.audit_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log profile updates to detect unauthorized access attempts
  IF (TG_OP = 'UPDATE' AND OLD.* IS DISTINCT FROM NEW.*) THEN
    RAISE LOG '[SECURITY_AUDIT] Profile updated: user_id=%, updated_by=%, sensitive_fields=%',
      NEW.id,
      auth.uid(),
      CASE 
        WHEN OLD.cpf IS DISTINCT FROM NEW.cpf THEN 'cpf '
        ELSE ''
      END ||
      CASE 
        WHEN OLD.email IS DISTINCT FROM NEW.email THEN 'email '
        ELSE ''
      END ||
      CASE 
        WHEN OLD.telefone IS DISTINCT FROM NEW.telefone THEN 'telefone '
        ELSE ''
      END ||
      CASE 
        WHEN OLD.data_nascimento IS DISTINCT FROM NEW.data_nascimento THEN 'data_nascimento '
        ELSE ''
      END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for audit logging
DROP TRIGGER IF EXISTS audit_profile_changes ON public.profiles;
CREATE TRIGGER audit_profile_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_access();