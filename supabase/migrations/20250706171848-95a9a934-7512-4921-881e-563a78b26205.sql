
-- Add missing columns to orders table
ALTER TABLE public.orders 
ADD COLUMN child_name text,
ADD COLUMN child_class text,
ADD COLUMN midtrans_order_id text;

-- Create children table
CREATE TABLE public.children (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  class_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on children table
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for children table
CREATE POLICY "Users can view their own children" 
  ON public.children 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own children" 
  ON public.children 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own children" 
  ON public.children 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own children" 
  ON public.children 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create order_schedules table
CREATE TABLE public.order_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  cutoff_date date,
  cutoff_time time DEFAULT '15:00:00',
  max_orders integer,
  current_orders integer DEFAULT 0,
  is_blocked boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on order_schedules table
ALTER TABLE public.order_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for order_schedules table
CREATE POLICY "Anyone can view order schedules" 
  ON public.order_schedules 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage order schedules" 
  ON public.order_schedules 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

-- Create user_roles table (since useUserRole.ts references it)
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'parent',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
  ON public.user_roles 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));
