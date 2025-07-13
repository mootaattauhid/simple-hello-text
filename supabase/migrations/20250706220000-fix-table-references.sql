
-- Fix table references and add performance indexes
-- Remove duplicate food_item_id column and standardize to menu_item_id
ALTER TABLE public.order_items DROP COLUMN IF EXISTS food_item_id;

-- Ensure menu_item_id column exists and has proper constraint
ALTER TABLE public.order_items 
ALTER COLUMN menu_item_id SET NOT NULL;

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON public.order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children(parent_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON public.menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Add constraints for data validation
ALTER TABLE public.orders 
ADD CONSTRAINT check_total_amount_positive CHECK (total_amount > 0);

ALTER TABLE public.order_items 
ADD CONSTRAINT check_quantity_positive CHECK (quantity > 0),
ADD CONSTRAINT check_price_positive CHECK (price > 0);

ALTER TABLE public.menu_items 
ADD CONSTRAINT check_price_positive CHECK (price > 0);

-- Clean up inconsistent column references in orders table
ALTER TABLE public.orders DROP COLUMN IF EXISTS child_id;

-- Update children table to match the expected parent_id reference
ALTER TABLE public.children 
DROP CONSTRAINT IF EXISTS children_user_id_fkey,
ADD CONSTRAINT children_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix children table structure to match types
ALTER TABLE public.children 
RENAME COLUMN user_id TO parent_id;
