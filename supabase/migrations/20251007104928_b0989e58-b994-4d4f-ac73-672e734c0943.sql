-- Add additional RESTRICTIVE policies for defense-in-depth on profiles table
-- This ensures authenticated users can ONLY access their own profile or must be an admin

-- Drop the existing anonymous deny policy to recreate it properly
DROP POLICY IF EXISTS "Deny all anonymous access to profiles" ON public.profiles;

-- RESTRICTIVE policy: Authenticated users can ONLY access profiles where they are the owner OR they are an admin
-- This prevents any edge cases where someone might try to access other profiles
CREATE POLICY "Restrict authenticated users to own profile or admin access"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- RESTRICTIVE policy: Completely block all anonymous access
CREATE POLICY "Block all anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- Add audit logging trigger for sensitive profile access
CREATE OR REPLACE FUNCTION public.audit_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log profile updates to detect unauthorized access attempts
  IF (TG_OP = 'UPDATE' AND OLD.* IS DISTINCT FROM NEW.*) THEN
    RAISE LOG '[SECURITY_AUDIT] Profile updated: user_id=%, updated_by=%, columns_changed=%',
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