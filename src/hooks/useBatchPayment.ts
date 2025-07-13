
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { Order } from '@/types/order';

export const useBatchPayment = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const processBatchPayment = async (orders: Order[], onSuccess?: () => void) => {
    if (!orders || orders.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada pesanan yang dipilih untuk dibayar",
        variant: "destructive",
      });
      return;
    }

    // Filter only pending payment orders
    const pendingOrders = orders.filter(order => order.payment_status === 'pending');
    
    if (pendingOrders.length === 0) {
      toast({
        title: "Info",
        description: "Tidak ada pesanan yang perlu dibayar",
      });
      return;
    }

    setLoading(true);

    try {
      const totalAmount = pendingOrders.reduce((sum, order) => sum + order.total_amount, 0);
      
      // Generate batch order ID following Midtrans single-order requirement
      const batchOrderId = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const customerDetails = {
        first_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Customer',
        email: user?.email || 'parent@example.com',
        phone: user?.user_metadata?.phone || '08123456789',
      };

      // Create combined item details from all orders for the invoice
      const itemDetails = [];
      for (const order of pendingOrders) {
        for (const item of order.order_line_items) {
          itemDetails.push({
            id: `${order.id}-${item.id}`,
            price: item.unit_price,
            quantity: item.quantity,
            name: `${item.menu_items?.name || 'Item'} - ${order.child_name}`,
          });
        }
      }

      console.log('Creating batch payment with single order ID:', batchOrderId);
      console.log('Original orders to be batched:', pendingOrders.map(o => o.id));
      console.log('Total amount:', totalAmount);
      console.log('Customer details:', customerDetails);
      console.log('Item details:', itemDetails);

      // Create the batch payment with Midtrans
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-payment',
        {
          body: {
            orderId: batchOrderId, // Single batch order ID for Midtrans
            amount: totalAmount,
            customerDetails,
            itemDetails,
            batchOrderIds: pendingOrders.map(order => order.id), // Original order IDs for mapping
          },
        }
      );

      if (paymentError) {
        console.error('Batch payment error:', paymentError);
        throw new Error(paymentError.message || 'Failed to create batch payment');
      }

      if (!paymentData) {
        throw new Error('No payment data received from server');
      }

      if (paymentData.error) {
        throw new Error(paymentData.error);
      }

      if (paymentData.snap_token) {
        console.log('Received snap token:', paymentData.snap_token);
        
        // Update all original orders with the batch information
        for (const order of pendingOrders) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({ 
              snap_token: paymentData.snap_token,
              midtrans_order_id: batchOrderId // All orders reference the same batch ID
            })
            .eq('id', order.id);
            
          if (updateError) {
            console.error('Error updating order:', order.id, updateError);
          }
        }

        if (window.snap) {
          window.snap.pay(paymentData.snap_token, {
            onSuccess: (result) => {
              console.log('Batch payment success:', result);
              toast({
                title: "Pembayaran Batch Berhasil!",
                description: `Berhasil membayar ${pendingOrders.length} pesanan sekaligus dengan ID: ${batchOrderId}`,
              });
              onSuccess?.();
            },
            onPending: (result) => {
              console.log('Batch payment pending:', result);
              toast({
                title: "Menunggu Pembayaran Batch",
                description: `Pembayaran batch dengan ID ${batchOrderId} sedang diproses.`,
              });
              onSuccess?.();
            },
            onError: (result) => {
              console.error('Batch payment error:', result);
              toast({
                title: "Pembayaran Batch Gagal",
                description: "Terjadi kesalahan dalam pembayaran batch.",
                variant: "destructive",
              });
            },
            onClose: () => {
              console.log('Batch payment popup closed');
            }
          });
        } else {
          throw new Error('Midtrans Snap belum loaded');
        }
      } else {
        throw new Error('Snap token tidak diterima untuk batch payment');
      }
    } catch (error: any) {
      console.error('Batch payment error:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memproses pembayaran batch",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    processBatchPayment
  };
};
