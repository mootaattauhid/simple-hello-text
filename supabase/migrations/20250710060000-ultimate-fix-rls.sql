
-- Ultimate fix for RLS infinite recursion
-- This will completely rebuild the policies with the simplest possible approach

-- First, drop ALL policies completely
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_all_admin" ON public.user_roles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

-- Also drop any remaining old policies
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Known admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Known admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for own role" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for admins" ON public.user_roles;
DROP POLICY IF EXISTS "Enable full access for admins" ON public.user_roles;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Known admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Known admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for admins on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable update access for admins on profiles" ON public.profiles;

-- Temporarily disable RLS to clean up data
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Clean up and ensure correct data exists
DELETE FROM public.user_roles WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Ensure admin role exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users 
WHERE email = 'admin@admin.com'
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- Ensure cashier role exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'cashier'
FROM auth.users 
WHERE email = 'kasir@kasir.com'
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'cashier',
  updated_at = NOW();

-- Clean up profiles
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);

-- Ensure admin profile exists
INSERT INTO public.profiles (id, full_name, role, created_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data ->> 'full_name', 'Admin User'),
  'admin',
  COALESCE(au.created_at, NOW())
FROM auth.users au
WHERE au.email = 'admin@admin.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  updated_at = NOW();

-- Ensure cashier profile exists
INSERT INTO public.profiles (id, full_name, role, created_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data ->> 'full_name', 'Kasir User'),
  'cashier',
  COALESCE(au.created_at, NOW())
FROM auth.users au
WHERE au.email = 'kasir@kasir.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'cashier',
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  updated_at = NOW();

-- Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create the most basic policies possible - no subqueries, no joins
-- User roles policies
CREATE POLICY "allow_own_user_role_read"
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Special admin access - check email directly from JWT
CREATE POLICY "allow_admin_user_role_read"
  ON public.user_roles 
  FOR SELECT 
  USING (auth.jwt() ->> 'email' = 'admin@admin.com');

CREATE POLICY "allow_admin_user_role_write"
  ON public.user_roles 
  FOR ALL 
  USING (auth.jwt() ->> 'email' = 'admin@admin.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@admin.com');

-- Profiles policies
CREATE POLICY "allow_own_profile_read"
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "allow_own_profile_update"
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_admin_profile_read"
  ON public.profiles 
  FOR SELECT 
  USING (auth.jwt() ->> 'email' = 'admin@admin.com');

CREATE POLICY "allow_admin_profile_write"
  ON public.profiles 
  FOR ALL 
  USING (auth.jwt() ->> 'email' = 'admin@admin.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@admin.com');

-- Verify setup with a simple query log
DO $$
BEGIN
  RAISE NOTICE 'RLS policies recreated successfully';
  RAISE NOTICE 'Admin users count: %', (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin');
  RAISE NOTICE 'Cashier users count: %', (SELECT COUNT(*) FROM public.user_roles WHERE role = 'cashier');
END $$;
