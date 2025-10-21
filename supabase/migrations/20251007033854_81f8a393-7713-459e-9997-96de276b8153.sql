-- Fix CRITICAL security issue: Convert all RESTRICTIVE policies to PERMISSIVE policies
-- This prevents unauthorized access by using OR logic instead of AND logic

-- ============================================
-- FIX 1: profiles table - Customer Personal Data Protection
-- ============================================

-- Drop existing RESTRICTIVE policies
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create PERMISSIVE policies for profiles table
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- FIX 2: planos_adquiridos table - Financial Data Protection
-- ============================================

-- Drop existing RESTRICTIVE policies
DROP POLICY IF EXISTS "Admins can manage planos_adquiridos" ON public.planos_adquiridos;
DROP POLICY IF EXISTS "Admins can view all planos_adquiridos" ON public.planos_adquiridos;
DROP POLICY IF EXISTS "Users can view their own planos" ON public.planos_adquiridos;

-- Create PERMISSIVE policies for planos_adquiridos table
CREATE POLICY "Admins can view all planos_adquiridos"
  ON public.planos_adquiridos
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own planos"
  ON public.planos_adquiridos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = cliente_id);

CREATE POLICY "Admins can insert planos_adquiridos"
  ON public.planos_adquiridos
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update planos_adquiridos"
  ON public.planos_adquiridos
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete planos_adquiridos"
  ON public.planos_adquiridos
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- FIX 3: user_roles table - Authorization System Protection
-- ============================================

-- Drop existing RESTRICTIVE policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create PERMISSIVE policies for user_roles table
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));