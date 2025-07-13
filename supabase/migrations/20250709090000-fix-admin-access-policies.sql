
-- Drop existing problematic policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create new simple policies for profiles table
CREATE POLICY "Users can view own profile"
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Drop and recreate user_roles policies
DROP POLICY IF EXISTS "Enable read access for users to their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for admins to all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable insert/update/delete for admins" ON public.user_roles;

CREATE POLICY "Users can view own role"
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Ensure all users from user_roles also exist in profiles
-- This will create missing profile entries for users that only exist in user_roles
INSERT INTO public.profiles (id, full_name, role, created_at)
SELECT 
  ur.user_id,
  COALESCE(au.email, 'User ' || LEFT(ur.user_id::text, 8)),
  ur.role,
  COALESCE(au.created_at, NOW())
FROM public.user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
LEFT JOIN public.profiles p ON p.id = ur.user_id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();
