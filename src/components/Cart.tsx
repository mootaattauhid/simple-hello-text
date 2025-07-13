
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ShoppingCart, X } from 'lucide-react';
import { CartItem } from '@/types/cart';
import { useCartOperations } from '@/hooks/useCartOperations';
import CartItemList from '@/components/cart/CartItemList';
import OrderSummary from '@/components/cart/OrderSummary';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
  cartOperations: ReturnType<typeof useCartOperations>;
}

const Cart = ({ isOpen, onClose, cartItems, onRemoveItem, onCheckout, cartOperations }: CartProps) => {
  const {
    children,
    notes,
    setNotes,
    loading: childrenLoading,
    fetchChildren,
    handleCheckout,
    isCheckingOut
  } = cartOperations;

  useEffect(() => {
    if (isOpen && children.length === 0) {
      console.log('Cart opened - fetching children');
      fetchChildren();
    }
  }, [isOpen, fetchChildren, children.length]);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      onRemoveItem(itemId);
    } else {
      // Handle quantity update - this would need to be passed as a prop or handled differently
      console.log('Update quantity not implemented in this interface');
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get unique children from cart items
  const childrenInCart = cartItems.reduce((acc, item) => {
    if (item.child_id && !acc.find(child => child.id === item.child_id)) {
      acc.push({
        id: item.child_id,
        name: item.child_name || 'Unknown',
        class_name: item.child_class || ''
      });
    }
    return acc;
  }, [] as Array<{id: string; name: string; class_name: string}>);

  const handleCheckoutClick = async () => {
    // Use the first child from cart items as selectedChildId for the checkout process
    const firstChildId = childrenInCart[0]?.id;
    if (!firstChildId) {
      console.log('No child found in cart items');
      return;
    }

    // Temporarily set the selectedChildId for the checkout process
    cartOperations.setSelectedChildId(firstChildId);
    
    await handleCheckout(cartItems, () => {
      onCheckout();
      onClose();
      cartOperations.setSelectedChildId('');
      setNotes('');
    });
  };

  const canCheckout = cartItems.length > 0 && !isCheckingOut && childrenInCart.length > 0;

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Keranjang Belanja</SheetTitle>
          <SheetDescription>
            Review pesanan Anda sebelum checkout
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Cart Items */}
          <CartItemList
            items={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={onRemoveItem}
            formatPrice={formatPrice}
          />

          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan untuk Pesanan (Opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Tambahkan catatan khusus untuk pesanan Anda..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Order Summary */}
          <OrderSummary
            totalPrice={getTotalPrice()}
            formatPrice={formatPrice}
            onCheckout={handleCheckoutClick}
            loading={isCheckingOut}
            canCheckout={canCheckout}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Cart;
