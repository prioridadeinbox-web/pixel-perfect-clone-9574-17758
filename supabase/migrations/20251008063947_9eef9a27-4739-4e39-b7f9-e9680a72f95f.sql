-- =====================================================
-- SECURITY FIX: Clean up conflicting RLS policies on profiles table
-- Remove redundant and conflicting policies, keep only essential ones
-- =====================================================

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block all anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Restrict authenticated users to own profile or admin access" ON public.profiles;
DROP POLICY IF EXISTS "Users can update only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view only their own profile" ON public.profiles;

-- =====================================================
-- CREATE CLEAN, NON-CONFLICTING POLICIES
-- =====================================================

-- SELECT: Users can view their own profile, Admins can view all
CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- INSERT: Only admins can create profiles (normal users created via trigger)
CREATE POLICY "profiles_insert_policy"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- UPDATE: Users can update their own profile, Admins can update any
CREATE POLICY "profiles_update_policy"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- DELETE: Only admins can delete profiles
CREATE POLICY "profiles_delete_policy"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- =====================================================
-- SECURITY NOTES:
-- 1. All policies require authentication (TO authenticated)
-- 2. Anonymous access is implicitly blocked (no policies for anon role)
-- 3. Each operation (SELECT, INSERT, UPDATE, DELETE) has ONE clear policy
-- 4. No conflicting or redundant policies
-- 5. Users can only access their own data unless they're admins
-- =====================================================