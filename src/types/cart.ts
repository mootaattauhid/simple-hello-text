
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  menu_item_id: string; // Standardize to menu_item_id instead of food_item_id
  date?: string;
  child_id?: string;
}
