
-- Final fix for infinite recursion in RLS policies
-- Drop ALL existing policies to start fresh
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

-- Temporarily disable RLS to avoid recursion
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Clean up and ensure data exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users 
WHERE email = 'admin@admin.com'
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'cashier'
FROM auth.users 
WHERE email = 'kasir@kasir.com'
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'cashier',
  updated_at = NOW();

-- Ensure profiles exist
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

-- Create extremely simple policies that avoid recursion
CREATE POLICY "user_roles_select_own"
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Admin access based on direct email check (no table lookup)
CREATE POLICY "user_roles_select_admin"
  ON public.user_roles 
  FOR SELECT 
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@admin.com'
  );

CREATE POLICY "user_roles_all_admin"
  ON public.user_roles 
  FOR ALL 
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@admin.com'
  );

-- Simple profiles policies
CREATE POLICY "profiles_select_own"
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin"
  ON public.profiles 
  FOR SELECT 
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@admin.com'
  );

CREATE POLICY "profiles_update_admin"
  ON public.profiles 
  FOR UPDATE 
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@admin.com'
  );
