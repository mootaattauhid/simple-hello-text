
-- Migrate existing order_items data to order_line_items
INSERT INTO order_line_items (
  order_id,
  child_name,
  child_class,
  child_id,
  menu_item_id,
  quantity,
  unit_price,
  total_price,
  delivery_date,
  order_date,
  created_at,
  updated_at
)
SELECT 
  oi.order_id,
  o.child_name,
  o.child_class,
  NULL as child_id, -- Will be populated later when we have proper child references
  oi.menu_item_id,
  oi.quantity,
  oi.price as unit_price,
  (oi.price * oi.quantity) as total_price,
  COALESCE(o.delivery_date, CURRENT_DATE) as delivery_date,
  COALESCE(o.order_date, o.created_at::date) as order_date,
  oi.created_at,
  now() as updated_at
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE NOT EXISTS (
  -- Only migrate if not already migrated
  SELECT 1 FROM order_line_items oli 
  WHERE oli.order_id = oi.order_id 
  AND oli.menu_item_id = oi.menu_item_id
);

-- Update child_id in order_line_items where we can match by name and class
UPDATE order_line_items 
SET child_id = c.id
FROM children c, orders o
WHERE order_line_items.order_id = o.id
AND order_line_items.child_id IS NULL
AND c.name = order_line_items.child_name
AND c.class_name = order_line_items.child_class
AND c.user_id = o.user_id;

-- Create function to calculate order total from line items
CREATE OR REPLACE FUNCTION calculate_order_total(order_uuid UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(total_price), 0)
    FROM order_line_items
    WHERE order_id = order_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Update existing orders total_amount based on order_line_items
UPDATE orders 
SET total_amount = calculate_order_total(id)
WHERE EXISTS (
  SELECT 1 FROM order_line_items oli 
  WHERE oli.order_id = orders.id
);

-- Add trigger to automatically update order total when line items change
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the order total whenever line items are inserted, updated, or deleted
  IF TG_OP = 'DELETE' THEN
    UPDATE orders 
    SET total_amount = calculate_order_total(OLD.order_id),
        updated_at = now()
    WHERE id = OLD.order_id;
    RETURN OLD;
  ELSE
    UPDATE orders 
    SET total_amount = calculate_order_total(NEW.order_id),
        updated_at = now()
    WHERE id = NEW.order_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic total calculation
DROP TRIGGER IF EXISTS trigger_update_order_total_insert ON order_line_items;
DROP TRIGGER IF EXISTS trigger_update_order_total_update ON order_line_items;
DROP TRIGGER IF EXISTS trigger_update_order_total_delete ON order_line_items;

CREATE TRIGGER trigger_update_order_total_insert
  AFTER INSERT ON order_line_items
  FOR EACH ROW EXECUTE FUNCTION update_order_total();

CREATE TRIGGER trigger_update_order_total_update
  AFTER UPDATE ON order_line_items
  FOR EACH ROW EXECUTE FUNCTION update_order_total();

CREATE TRIGGER trigger_update_order_total_delete
  AFTER DELETE ON order_line_items
  FOR EACH ROW EXECUTE FUNCTION update_order_total();

-- Add RLS policies for order_line_items if not already exists
DO $$
BEGIN
  -- Policy for users to update their own order line items
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_line_items' 
    AND policyname = 'Users can update their own order line items'
  ) THEN
    CREATE POLICY "Users can update their own order line items" ON order_line_items
    FOR UPDATE
    USING (EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_line_items.order_id 
      AND orders.user_id = auth.uid()
    ));
  END IF;

  -- Policy for users to delete their own order line items
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_line_items' 
    AND policyname = 'Users can delete their own order line items'
  ) THEN
    CREATE POLICY "Users can delete their own order line items" ON order_line_items
    FOR DELETE
    USING (EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_line_items.order_id 
      AND orders.user_id = auth.uid()
    ));
  END IF;
END $$;
