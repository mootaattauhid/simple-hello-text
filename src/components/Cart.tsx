
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingCart } from 'lucide-react';
import { CartItem } from '@/types/cart';
import { useCartOperations } from '@/hooks/useCartOperations';
import CartItemList from '@/components/cart/CartItemList';
import CheckoutForm from '@/components/cart/CheckoutForm';
import OrderSummary from '@/components/cart/OrderSummary';

declare global {
  interface Window {
    snap: {
      pay: (token: string, options?: {
        onSuccess?: (result: any) => void;
        onPending?: (result: any) => void;
        onError?: (result: any) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

interface CartProps {
  items: CartItem[];
  onUpdateCart: (items: CartItem[]) => void;
}

const Cart = ({ items, onUpdateCart }: CartProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    children,
    selectedChildId,
    setSelectedChildId,
    notes,
    setNotes,
    loading,
    fetchChildren,
    handleCheckout
  } = useCartOperations();

  useEffect(() => {
    if (isOpen) {
      fetchChildren();
    }
  }, [isOpen]);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      onUpdateCart(items.filter(item => item.id !== itemId));
    } else {
      onUpdateCart(items.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeItem = (itemId: string) => {
    onUpdateCart(items.filter(item => item.id !== itemId));
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const onCheckout = async () => {
    await handleCheckout(items, () => {
      // Clear cart and close dialog
      onUpdateCart([]);
      setIsOpen(false);
      setSelectedChildId('');
      setNotes('');
    });
  };

  if (items.length === 0) {
    return null;
  }

  const canCheckout = selectedChildId && children.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-4 right-4 rounded-full shadow-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 z-50"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          {getTotalItems()} item • {formatPrice(getTotalPrice())}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keranjang Belanja</DialogTitle>
          <DialogDescription>
            Review pesanan Anda dan pilih anak untuk pengiriman
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cart Items */}
          <CartItemList
            items={items}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            formatPrice={formatPrice}
          />

          {/* Checkout Form */}
          <CheckoutForm
            children={children}
            selectedChildId={selectedChildId}
            onChildSelect={setSelectedChildId}
            notes={notes}
            onNotesChange={setNotes}
          />

          {/* Order Summary */}
          <OrderSummary
            totalPrice={getTotalPrice()}
            formatPrice={formatPrice}
            onCheckout={onCheckout}
            loading={loading}
            canCheckout={canCheckout}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Cart;
