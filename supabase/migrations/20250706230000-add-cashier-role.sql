
-- Add cashier role to user_roles check constraint
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN ('admin', 'parent', 'cashier'));

-- Update the handle_new_user function to support cashier role
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

-- Create policies for cashier access
CREATE POLICY "Cashiers can view all orders" 
  ON public.orders 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'cashier'));

CREATE POLICY "Cashiers can update payment status" 
  ON public.orders 
  FOR UPDATE 
  USING (public.has_role(auth.uid(), 'cashier'));

-- Create cash_payments table for tracking cash transactions
CREATE TABLE public.cash_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  received_amount DECIMAL(10,2) NOT NULL,
  change_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  cashier_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Enable RLS on cash_payments
ALTER TABLE public.cash_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for cash_payments
CREATE POLICY "Cashiers can manage cash payments" 
  ON public.cash_payments 
  FOR ALL 
  USING (public.has_role(auth.uid(), 'cashier'));

CREATE POLICY "Admins can view all cash payments" 
  ON public.cash_payments 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));
