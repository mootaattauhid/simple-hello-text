
-- Fix infinite recursion in user_roles policies
-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for own role" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for admins" ON public.user_roles;
DROP POLICY IF EXISTS "Enable full access for admins" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for users to their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for admins to all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable insert/update/delete for admins" ON public.user_roles;

-- Create simple, non-recursive policies using direct email checks
CREATE POLICY "Users can read own role"
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow specific admin emails to read all roles (no recursion)
CREATE POLICY "Known admins can read all roles"
  ON public.user_roles 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT au.id 
      FROM auth.users au 
      WHERE au.email IN ('admin@admin.com')
    )
  );

-- Allow specific admin emails to manage all roles (no recursion)
CREATE POLICY "Known admins can manage all roles"
  ON public.user_roles 
  FOR ALL 
  USING (
    auth.uid() IN (
      SELECT au.id 
      FROM auth.users au 
      WHERE au.email IN ('admin@admin.com')
    )
  );

-- Fix profiles policies as well
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for admins on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable update access for admins on profiles" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Known admins can read all profiles"
  ON public.profiles 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT au.id 
      FROM auth.users au 
      WHERE au.email IN ('admin@admin.com')
    )
  );

CREATE POLICY "Known admins can update all profiles"
  ON public.profiles 
  FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT au.id 
      FROM auth.users au 
      WHERE au.email IN ('admin@admin.com')
    )
  );

-- Ensure admin and cashier users have correct roles
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

-- Ensure profiles match
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
  updated_at = NOW();
