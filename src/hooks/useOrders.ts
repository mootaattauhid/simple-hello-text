
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { Order, OrderLineItem } from '@/types/order';

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
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_line_items (
            id,
            order_id,
            child_id,
            child_name,
            child_class,
            menu_item_id,
            quantity,
            unit_price,
            total_price,
            delivery_date,
            order_date,
            notes,
            created_at,
            updated_at,
            menu_items (
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedOrders = (data || []).map(order => ({
        ...order,
        order_line_items: order.order_line_items.map((item: any) => ({
          ...item,
          menu_items: item.menu_items || { name: 'Unknown Item', image_url: '' }
        }))
      }));
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
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
      // If snap_token exists, use it directly
      if (order.snap_token) {
        console.log('Using existing snap_token:', order.snap_token);
        
        if (window.snap) {
          window.snap.pay(order.snap_token, {
            onSuccess: () => {
              toast({
                title: "Pembayaran Berhasil!",
                description: "Pembayaran berhasil diproses.",
              });
              fetchOrders();
            },
            onPending: () => {
              toast({
                title: "Menunggu Pembayaran",
                description: "Pembayaran sedang diproses.",
              });
              fetchOrders();
            },
            onError: () => {
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
          throw new Error('Midtrans Snap belum loaded');
        }
        return;
      }

      // If no snap_token, create new payment
      let orderId = order.midtrans_order_id;
      
      if (!orderId) {
        // Generate new order ID only if doesn't exist
        orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Update order with new midtrans_order_id
        const { error: updateError } = await supabase
          .from('orders')
          .update({ midtrans_order_id: orderId })
          .eq('id', order.id);
          
        if (updateError) {
          console.error('Error updating order:', updateError);
          throw updateError;
        }
      }

      const customerDetails = {
        first_name: order.child_name || 'Customer',
        email: user?.email || 'parent@example.com',
        phone: user?.user_metadata?.phone || '08123456789',
      };

      const itemDetails = order.order_line_items.map(item => ({
        id: item.id,
        price: item.unit_price,
        quantity: item.quantity,
        name: item.menu_items?.name || 'Unknown Item',
      }));

      console.log('Calling create-payment for new snap_token:', {
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
        console.error('Payment error:', paymentError);
        throw paymentError;
      }

      if (paymentData.snap_token) {
        // Save snap_token to database for future use
        const { error: saveTokenError } = await supabase
          .from('orders')
          .update({ snap_token: paymentData.snap_token })
          .eq('id', order.id);

        if (saveTokenError) {
          console.error('Error saving snap_token:', saveTokenError);
        }

        if (window.snap) {
          window.snap.pay(paymentData.snap_token, {
            onSuccess: () => {
              toast({
                title: "Pembayaran Berhasil!",
                description: "Pembayaran berhasil diproses.",
              });
              fetchOrders();
            },
            onPending: () => {
              toast({
                title: "Menunggu Pembayaran",
                description: "Pembayaran sedang diproses.",
              });
              fetchOrders();
            },
            onError: () => {
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
          throw new Error('Midtrans Snap belum loaded');
        }
      } else {
        throw new Error('Snap token tidak diterima');
      }
    } catch (error: any) {
      console.error('Retry payment error:', error);
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
