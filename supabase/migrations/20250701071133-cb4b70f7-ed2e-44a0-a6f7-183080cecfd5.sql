
-- Create user roles table to manage admin/parent permissions
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'parent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own role
CREATE POLICY "Users can view their own role" 
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for admins to manage all roles
CREATE POLICY "Admins can manage all roles" 
  ON public.user_roles 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Create function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;

-- Add RLS policies for existing tables to allow admin access

-- Orders table - admins can see all orders
CREATE POLICY "Admins can view all orders" 
  ON public.orders 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all orders" 
  ON public.orders 
  FOR UPDATE 
  USING (public.has_role(auth.uid(), 'admin'));

-- Food items - admins can manage all food items
CREATE POLICY "Admins can manage food items" 
  ON public.food_items 
  FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- Daily menus - admins can manage daily menus
CREATE POLICY "Admins can manage daily menus" 
  ON public.daily_menus 
  FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- Order schedules - admins can manage order schedules
CREATE POLICY "Admins can manage order schedules" 
  ON public.order_schedules 
  FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- Children - admins can view all children data
CREATE POLICY "Admins can view all children" 
  ON public.children 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Order items - admins can view all order items
CREATE POLICY "Admins can view all order items" 
  ON public.order_items 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Update the handle_new_user function to set default role as 'parent'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, address, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'phone', ''),
    COALESCE(new.raw_user_meta_data ->> 'address', ''),
    COALESCE(new.raw_user_meta_data ->> 'role', 'parent')
  );
  
  -- Also insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'role', 'parent')
  );
  
  RETURN new;
END;
$$;

-- Create sales summary view for analytics
CREATE VIEW public.sales_summary AS
SELECT 
  DATE(created_at) as order_date,
  COUNT(*) as total_orders,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
FROM public.orders
GROUP BY DATE(created_at)
ORDER BY order_date DESC;

-- Grant access to the view
GRANT SELECT ON public.sales_summary TO authenticated;
