
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { canPayOrder } from '@/utils/orderUtils';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menu_items: {
    name: string;
    image_url: string;
  } | null;
}

interface Order {
  id: string;
  child_name: string | null;
  child_class: string | null;
  total_amount: number;
  status: string | null;
  payment_status: string | null;
  created_at: string;
  delivery_date: string | null;
  notes: string | null;
  midtrans_order_id: string | null;
  snap_token: string | null;
  order_items: OrderItem[];
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      console.log('useOrders: Fetching orders for user:', user?.id);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            menu_items (
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('useOrders: Supabase error:', error);
        throw error;
      }
      
      console.log('useOrders: Fetched orders:', data?.length || 0);
      
      // Transform the data to match our interface
      const transformedOrders = (data || []).map(order => ({
        ...order,
        order_items: order.order_items.map(item => ({
          ...item,
          menu_items: item.menu_items || { name: 'Unknown Item', image_url: '' }
        }))
      }));
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('useOrders: Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pesanan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const retryPayment = async (order: Order) => {
    try {
      console.log('useOrders: Retry payment for order:', order.id, 'midtrans_order_id:', order.midtrans_order_id);
      
      // Check if order can be paid before proceeding
      if (!canPayOrder(order)) {
        toast({
          title: "Tidak Dapat Dibayar",
          description: "Pesanan ini sudah kadaluarsa atau sudah dibayar",
          variant: "destructive",
        });
        return;
      }
      
      // If snap_token exists, use it directly
      if (order.snap_token) {
        console.log('useOrders: Using existing snap_token:', order.snap_token);
        
        if (window.snap) {
          window.snap.pay(order.snap_token, {
            onSuccess: () => {
              console.log('useOrders: Payment success');
              toast({
                title: "Pembayaran Berhasil!",
                description: "Pembayaran berhasil diproses.",
              });
              fetchOrders();
            },
            onPending: () => {
              console.log('useOrders: Payment pending');
              toast({
                title: "Menunggu Pembayaran",
                description: "Pembayaran sedang diproses.",
              });
              fetchOrders();
            },
            onError: () => {
              console.log('useOrders: Payment error');
              toast({
                title: "Pembayaran Gagal",
                description: "Terjadi kesalahan dalam pembayaran.",
                variant: "destructive",
              });
            },
            onClose: () => {
              console.log('useOrders: Payment popup closed');
            }
          });
        } else {
          throw new Error('Midtrans Snap belum loaded');
        }
        return;
      }

      // If no snap_token, create new payment
      let orderId = order.midtrans_order_id;
      
      if (!orderId) {
        // Generate new order ID only if doesn't exist
        orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('useOrders: Generated new midtrans_order_id:', orderId);
        
        // Update order with new midtrans_order_id
        const { error: updateError } = await supabase
          .from('orders')
          .update({ midtrans_order_id: orderId })
          .eq('id', order.id);
          
        if (updateError) {
          console.error('useOrders: Error updating order:', updateError);
          throw updateError;
        }
      }

      const customerDetails = {
        first_name: order.child_name || 'Customer',
        email: user?.email || 'parent@example.com',
        phone: user?.user_metadata?.phone || '08123456789',
      };

      const itemDetails = order.order_items.map(item => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.menu_items?.name || 'Unknown Item',
      }));

      console.log('useOrders: Calling create-payment with:', {
        orderId,
        amount: order.total_amount,
        customerDetails,
        itemDetails
      });

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-payment',
        {
          body: {
            orderId,
            amount: order.total_amount,
            customerDetails,
            itemDetails,
          },
        }
      );

      if (paymentError) {
        console.error('useOrders: Payment creation error:', paymentError);
        throw paymentError;
      }

      console.log('useOrders: Payment response:', paymentData);

      if (paymentData.snap_token) {
        // Save snap_token to database for future use
        const { error: saveTokenError } = await supabase
          .from('orders')
          .update({ snap_token: paymentData.snap_token })
          .eq('id', order.id);

        if (saveTokenError) {
          console.error('useOrders: Error saving snap_token:', saveTokenError);
        }

        if (window.snap) {
          window.snap.pay(paymentData.snap_token, {
            onSuccess: () => {
              console.log('useOrders: Payment success');
              toast({
                title: "Pembayaran Berhasil!",
                description: "Pembayaran berhasil diproses.",
              });
              fetchOrders();
            },
            onPending: () => {
              console.log('useOrders: Payment pending');
              toast({
                title: "Menunggu Pembayaran",
                description: "Pembayaran sedang diproses.",
              });
              fetchOrders();
            },
            onError: () => {
              console.log('useOrders: Payment error');
              toast({
                title: "Pembayaran Gagal",
                description: "Terjadi kesalahan dalam pembayaran.",
                variant: "destructive",
              });
            },
            onClose: () => {
              console.log('useOrders: Payment popup closed');
            }
          });
        } else {
          throw new Error('Midtrans Snap belum loaded');
        }
      } else {
        throw new Error('Snap token tidak diterima');
      }
    } catch (error: any) {
      console.error('useOrders: Retry payment error:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memproses pembayaran",
        variant: "destructive",
      });
    }
  };

  return {
    orders,
    loading,
    retryPayment,
    fetchOrders
  };
};
