
-- Create the missing children table
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the missing daily_menus table
CREATE TABLE public.daily_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  food_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE NOT NULL,
  price NUMERIC NOT NULL,
  is_available BOOLEAN DEFAULT true,
  max_quantity INTEGER,
  current_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to orders table
ALTER TABLE public.orders 
ADD COLUMN child_id UUID,
ADD COLUMN child_name TEXT,
ADD COLUMN child_class TEXT,
ADD COLUMN midtrans_order_id TEXT;

-- Add missing columns to order_items table to support the new structure
ALTER TABLE public.order_items 
ADD COLUMN food_item_id UUID REFERENCES public.menu_items(id);

-- Update existing menu_items references to use the new food_item_id column
UPDATE public.order_items 
SET food_item_id = menu_item_id 
WHERE menu_item_id IS NOT NULL;

-- Enable RLS on new tables
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_menus ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for children table
CREATE POLICY "Users can view their own children" 
  ON public.children 
  FOR SELECT 
  USING (auth.uid() = parent_id);

CREATE POLICY "Users can create their own children" 
  ON public.children 
  FOR INSERT 
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Users can update their own children" 
  ON public.children 
  FOR UPDATE 
  USING (auth.uid() = parent_id);

CREATE POLICY "Users can delete their own children" 
  ON public.children 
  FOR DELETE 
  USING (auth.uid() = parent_id);

-- Create RLS policies for daily_menus table
CREATE POLICY "Anyone can view daily menus" 
  ON public.daily_menus 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage daily menus" 
  ON public.daily_menus 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );
