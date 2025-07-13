
export interface OrderLineItem {
  id: string;
  order_id: string;
  child_id: string | null;
  child_name: string;
  child_class: string | null;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number | null;
  delivery_date: string;
  order_date: string;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  menu_items: {
    name: string;
    image_url: string;
    description?: string;
  } | null;
}

export interface Order {
  id: string;
  child_name: string;
  child_class: string;
  total_amount: number;
  status: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  delivery_date: string | null;
  midtrans_order_id: string | null;
  snap_token: string | null;
  order_line_items: OrderLineItem[];
  order_number: string;
  parent_notes: string | null;
  payment_method: string | null;
  payments?: {
    id: string;
    amount: number;
    payment_method: string;
    status: string | null;
    transaction_id: string;
    created_at: string;
  }[];
}
