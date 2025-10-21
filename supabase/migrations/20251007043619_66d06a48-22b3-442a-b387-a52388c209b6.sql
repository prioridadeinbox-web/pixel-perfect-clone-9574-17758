-- ==========================================
-- PHASE 1: CRITICAL SECURITY FIXES
-- ==========================================

-- 1. FIX PRIVILEGE ESCALATION: Prevent users from modifying their own roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- New secure policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() != user_id);

CREATE POLICY "Only admins can update OTHER users roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin') AND auth.uid() != user_id);

CREATE POLICY "Only admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin') AND auth.uid() != user_id);

-- 2. FIX FUNCTION SEARCH PATHS: Add SET search_path to prevent SQL injection
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3. RESTRICT PLANS TABLE ACCESS: Require authentication
DROP POLICY IF EXISTS "Everyone can view planos" ON public.planos;
CREATE POLICY "Authenticated users can view planos" 
ON public.planos 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 4. ADD ROLE CHANGE AUDIT TRIGGER
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log to postgres logs for internal audit
  RAISE WARNING '[SECURITY_AUDIT] Role change: user_id=%, old_role=%, new_role=%, changed_by=%', 
    COALESCE(NEW.user_id, OLD.user_id),
    OLD.role,
    NEW.role,
    auth.uid();
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_role_changes ON public.user_roles;
CREATE TRIGGER audit_role_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_role_changes();

-- 5. ADD CONSTRAINTS FOR DATA INTEGRITY (drop first to avoid conflicts)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_nome_length;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_email_format;

ALTER TABLE public.profiles 
ADD CONSTRAINT check_nome_length 
CHECK (char_length(nome) <= 100 AND char_length(nome) > 0);

ALTER TABLE public.profiles 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');