
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

interface FloatingCartButtonProps {
  itemCount: number;
  onClick: () => void;
}

const FloatingCartButton = ({ itemCount, onClick }: FloatingCartButtonProps) => {
  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={onClick}
        size="lg"
        className="rounded-full shadow-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
      >
        <ShoppingCart className="h-5 w-5 mr-2" />
        {itemCount} item
      </Button>
    </div>
  );
};

export default FloatingCartButton;
