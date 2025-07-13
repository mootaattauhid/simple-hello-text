
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  menu_item_id: string;
  date?: string;
  child_id?: string;
  child_name?: string;
  child_class?: string;
  delivery_date?: string;
  menu_item_name?: string;
}

export interface CartItemWithChild extends CartItem {
  child_id: string;
  child_name: string;
  child_class: string;
}
