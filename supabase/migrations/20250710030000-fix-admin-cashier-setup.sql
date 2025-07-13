
-- First, ensure we have the correct users and roles set up
-- This migration will properly set up admin and cashier accounts

-- Enable RLS on both tables (in case previous migration didn't apply)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Insert admin role if the user exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users 
WHERE email = 'admin@admin.com'
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- Insert cashier role if the user exists  
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'cashier'
FROM auth.users 
WHERE email = 'kasir@kasir.com'
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'cashier',
  updated_at = NOW();

-- Ensure profiles exist for these users
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

-- Create a simpler policy structure to avoid recursion issues
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Simple policy: users can see their own role
CREATE POLICY "Enable read access for own role"
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow admins to see all roles (using a direct check instead of recursive)
CREATE POLICY "Enable read access for admins"
  ON public.user_roles 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT au.id 
      FROM auth.users au 
      WHERE au.email IN ('admin@admin.com')
    )
  );

-- Allow admins to manage all roles
CREATE POLICY "Enable full access for admins"
  ON public.user_roles 
  FOR ALL 
  USING (
    auth.uid() IN (
      SELECT au.id 
      FROM auth.users au 
      WHERE au.email IN ('admin@admin.com')
    )
  );

-- Similar simple policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Enable read access for own profile"
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Enable update access for own profile"
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Enable read access for admins on profiles"
  ON public.profiles 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT au.id 
      FROM auth.users au 
      WHERE au.email IN ('admin@admin.com')
    )
  );

CREATE POLICY "Enable update access for admins on profiles"
  ON public.profiles 
  FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT au.id 
      FROM auth.users au 
      WHERE au.email IN ('admin@admin.com')
    )
  );

-- Verify the setup
SELECT 'Admin user check:' as info, au.email, ur.role, p.role as profile_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'admin@admin.com';

SELECT 'Cashier user check:' as info, au.email, ur.role, p.role as profile_role  
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'kasir@kasir.com';
