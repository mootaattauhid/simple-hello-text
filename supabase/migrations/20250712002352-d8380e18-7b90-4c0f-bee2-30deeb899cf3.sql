
-- Create batch_orders table to store batch payment mappings
CREATE TABLE public.batch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for better query performance
CREATE INDEX idx_batch_orders_batch_id ON public.batch_orders(batch_id);
CREATE INDEX idx_batch_orders_order_id ON public.batch_orders(order_id);

-- Enable Row Level Security
ALTER TABLE public.batch_orders ENABLE ROW LEVEL SECURITY;

-- Create policy for batch_orders
CREATE POLICY "Users can view their own batch orders" ON public.batch_orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = batch_orders.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage batch orders" ON public.batch_orders
FOR ALL USING (true);
