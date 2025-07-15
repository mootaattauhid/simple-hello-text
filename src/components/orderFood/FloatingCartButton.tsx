
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  date: string;
  child_id: string;
  food_item_id: string;
  image_url?: string;
}

interface FloatingCartButtonProps {
  cart: CartItem[];
  getTotalCartItems: () => number;
  getTotalCartPrice: () => number;
  formatPrice: (price: number) => string;
  createOrder: () => void;
}

const FloatingCartButton = ({
  cart,
  getTotalCartItems,
  getTotalCartPrice,
  formatPrice,
  createOrder
}: FloatingCartButtonProps) => {
  if (cart.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={createOrder}
        size="lg"
        className="rounded-full shadow-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
      >
        <ShoppingCart className="h-5 w-5 mr-2" />
        {getTotalCartItems()} item • {formatPrice(getTotalCartPrice())}
      </Button>
    </div>
  );
};

export default FloatingCartButton;
