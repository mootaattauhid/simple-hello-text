
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;

-- Create simpler, non-recursive policies
-- Users can view their own role (direct check, no recursion)
CREATE POLICY "Users can view own role" 
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Admins can manage roles (using the admin_users view to avoid recursion)
CREATE POLICY "Admins can manage roles" 
  ON public.user_roles 
  FOR ALL 
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_users
    )
  );

-- Insert current admin into admin_users view table if it exists
-- This ensures the admin can manage roles
INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'admin@admin.com'
ON CONFLICT DO NOTHING;
