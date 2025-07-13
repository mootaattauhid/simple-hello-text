
-- Insert admin role for the existing user (replace with actual user email/id)
-- First, let's create a way to make any existing user an admin
-- You can replace 'admin@admin.com' with your actual admin email

-- Option 1: If you know the user's email, use this:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users 
WHERE email = 'admin@admin.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Option 2: If you want to make the first registered user an admin:
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'
-- FROM auth.users 
-- ORDER BY created_at ASC
-- LIMIT 1
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Also update the profiles table to reflect the admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'admin'
);
