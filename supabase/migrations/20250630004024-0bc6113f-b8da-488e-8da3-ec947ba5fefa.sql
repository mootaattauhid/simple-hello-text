
-- Create table for blocked dates and cutoff times
CREATE TABLE public.order_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  is_blocked BOOLEAN DEFAULT false,
  cutoff_time TIME DEFAULT '15:00:00',
  cutoff_date DATE, -- When null, cutoff is the day before (H-1)
  max_orders INTEGER, -- Maximum orders for this date (null = unlimited)
  current_orders INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- Create table for daily menus
CREATE TABLE public.daily_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  food_item_id UUID REFERENCES public.food_items(id) ON DELETE CASCADE,
  price DECIMAL(10,2), -- Override price for specific date (null = use default price)
  is_available BOOLEAN DEFAULT true,
  max_quantity INTEGER, -- Max quantity for this item on this date
  current_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, food_item_id)
);

-- Add order_date column to orders table
ALTER TABLE public.orders 
ADD COLUMN order_date DATE;

-- Create index for better performance
CREATE INDEX idx_order_schedules_date ON public.order_schedules(date);
CREATE INDEX idx_daily_menus_date ON public.daily_menus(date);
CREATE INDEX idx_orders_order_date ON public.orders(order_date);

-- Enable RLS
ALTER TABLE public.order_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_menus ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_schedules (read-only for parents, full access for admins)
CREATE POLICY "Anyone can view order schedules" ON public.order_schedules
  FOR SELECT USING (true);

-- RLS Policies for daily_menus (read-only for parents, full access for admins)
CREATE POLICY "Anyone can view daily menus" ON public.daily_menus
  FOR SELECT USING (true);

-- Insert some sample blocked dates and schedules
INSERT INTO public.order_schedules (date, is_blocked, cutoff_time, notes) VALUES
('2025-01-01', true, '15:00:00', 'Tahun Baru'),
('2025-01-17', true, '15:00:00', 'Hari Raya Nyepi'),
('2025-12-25', true, '15:00:00', 'Hari Natal');

-- Insert sample daily menus for next week
WITH dates AS (
  SELECT generate_series(
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '7 days',
    INTERVAL '1 day'
  )::date AS date
),
available_foods AS (
  SELECT id, price FROM public.food_items WHERE is_available = true LIMIT 5
)
INSERT INTO public.daily_menus (date, food_item_id, price, is_available)
SELECT d.date, f.id, f.price, true
FROM dates d
CROSS JOIN available_foods f;
