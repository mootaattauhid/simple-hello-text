
import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { CartItem } from '@/types/cart';

declare global {
  interface Window {
    snap: any;
  }
}

interface Child {
  id: string;
  name: string;
  class_name: string;
}

export const useCartOperations = () => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [childrenFetched, setChildrenFetched] = useState(false);
  const { user } = useAuth();

  const fetchChildren = useCallback(async () => {
    if (!user || childrenFetched || loading) {
      console.log('Skipping fetchChildren - user:', !!user, 'fetched:', childrenFetched, 'loading:', loading);
      return;
    }
    
    setLoading(true);
    console.log('Fetching children for user:', user.id);
    
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      console.log('Children fetched:', data?.length || 0);
      setChildren(data || []);
      setChildrenFetched(true);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data anak",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, childrenFetched, loading]);

  // Reset children fetched state when user changes
  useMemo(() => {
    if (user) {
      setChildrenFetched(false);
    }
  }, [user?.id]);

  const handleCheckout = useCallback(async (
    cartItems: CartItem[],
    onSuccess?: () => void
  ) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Silakan login terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Error",
        description: "Keranjang belanja kosong",
        variant: "destructive",
      });
      return;
    }

    // Get the first child from cart items if no selectedChildId is set
    const childIdToUse = selectedChildId || cartItems[0]?.child_id;
    if (!childIdToUse) {
      toast({
        title: "Error",
        description: "Data anak tidak ditemukan",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingOut(true);

    try {
      console.log('Starting checkout process...');
      console.log('Cart items:', cartItems);
      console.log('Child ID to use:', childIdToUse);
      
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Generate order number
      const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Get selected child info from cart items or children array
      let selectedChild = children.find(child => child.id === childIdToUse);
      if (!selectedChild && cartItems.length > 0) {
        // Use child info from cart items if not found in children array
        const cartItem = cartItems.find(item => item.child_id === childIdToUse);
        if (cartItem) {
          selectedChild = {
            id: cartItem.child_id!,
            name: cartItem.child_name || 'Unknown',
            class_name: cartItem.child_class || ''
          };
        }
      }
      
      console.log('Selected child:', selectedChild);
      
      if (!selectedChild) {
        throw new Error('Data anak yang dipilih tidak ditemukan');
      }

      // Create main order first
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          total_amount: totalAmount,
          status: 'pending',
          payment_status: 'pending',
          parent_notes: notes || null,
          child_name: selectedChild.name,
          child_class: selectedChild.class_name
        })
        .select()
        .single();

      if (orderError || !orderData) {
        console.error('Error creating order:', orderError);
        throw new Error('Gagal membuat pesanan utama');
      }

      console.log('Main order created:', orderData);

      // Create order line items WITHOUT total_price (let database calculate it)
      const orderLineItems = cartItems.map(item => {
        const deliveryDate = item.delivery_date || item.date || new Date().toISOString().split('T')[0];
        const orderDate = new Date().toISOString().split('T')[0];
        
        return {
          order_id: orderData.id,
          child_id: item.child_id || childIdToUse,
          child_name: item.child_name || selectedChild!.name,
          child_class: item.child_class || selectedChild!.class_name,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: item.price,
          delivery_date: deliveryDate,
          order_date: orderDate,
          notes: null
        };
      });

      console.log('Order line items to insert:', orderLineItems);

      const { error: lineItemsError } = await supabase
        .from('order_line_items')
        .insert(orderLineItems);

      if (lineItemsError) {
        console.error('Error creating order line items:', lineItemsError);
        
        // Try to clean up the main order if line items failed
        await supabase
          .from('orders')
          .delete()
          .eq('id', orderData.id);
          
        throw new Error('Gagal menyimpan detail pesanan');
      }

      console.log('Order line items created successfully');

      // Generate Midtrans order ID
      const midtransOrderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Update order with Midtrans order ID
      const { error: updateError } = await supabase
        .from('orders')
        .update({ midtrans_order_id: midtransOrderId })
        .eq('id', orderData.id);
        
      if (updateError) {
        console.error('Error updating order with midtrans_order_id:', updateError);
        // Don't throw here as the order is already created
      }

      // Prepare customer details
      const customerDetails = {
        first_name: user.user_metadata?.full_name || 'Customer',
        email: user.email || 'parent@example.com',
        phone: user.user_metadata?.phone || '08123456789',
      };

      // Prepare item details for Midtrans
      const itemDetails = cartItems.map(item => ({
        id: item.menu_item_id,
        price: item.price,
        quantity: item.quantity,
        name: `${item.name} - ${selectedChild!.name}`,
      }));

      console.log('Calling create-payment with:', {
        orderId: midtransOrderId,
        amount: totalAmount,
        customerDetails,
        itemDetails
      });

      // Create payment via Supabase function
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-payment',
        {
          body: {
            orderId: midtransOrderId,
            amount: totalAmount,
            customerDetails,
            itemDetails,
          },
        }
      );

      if (paymentError) {
        console.error('Payment error:', paymentError);
        toast({
          title: "Error Pembayaran",
          description: paymentError.message || "Gagal membuat pembayaran",
          variant: "destructive",
        });
        return;
      }

      if (paymentData?.snap_token) {
        // Save snap_token to database
        await supabase
          .from('orders')
          .update({ snap_token: paymentData.snap_token })
          .eq('id', orderData.id);

        // Open Midtrans payment popup
        if (window.snap) {
          window.snap.pay(paymentData.snap_token, {
            onSuccess: () => {
              console.log('Payment successful');
              toast({
                title: "Pembayaran Berhasil!",
                description: "Pesanan Anda telah berhasil dibuat dan dibayar.",
              });
              onSuccess?.();
            },
            onPending: () => {
              console.log('Payment pending');
              toast({
                title: "Pembayaran Tertunda",
                description: "Pembayaran Anda sedang diproses.",
              });
              onSuccess?.();
            },
            onError: () => {
              console.log('Payment error');
              toast({
                title: "Pembayaran Gagal",
                description: "Terjadi kesalahan dalam pembayaran.",
                variant: "destructive",
              });
            },
            onClose: () => {
              console.log('Payment popup closed');
            }
          });
        } else {
          console.error('Midtrans Snap not loaded');
          toast({
            title: "Error",
            description: "Sistem pembayaran belum siap. Silakan refresh halaman.",
            variant: "destructive",
          });
        }
      } else {
        throw new Error('Token pembayaran tidak diterima');
      }

      return orderData;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memproses checkout",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsCheckingOut(false);
    }
  }, [user, selectedChildId, children, notes]);

  return {
    handleCheckout,
    isCheckingOut,
    children,
    selectedChildId,
    setSelectedChildId,
    notes,
    setNotes,
    loading,
    fetchChildren
  };
};
