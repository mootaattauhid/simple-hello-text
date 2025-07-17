
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CreditCard, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types/order';
import { formatPrice, formatDate } from '@/utils/orderUtils';

interface BatchOrderState {
  selectedOrderIds: string[];
  orders: Order[];
}

export default function BatchOrders() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [batchId, setBatchId] = useState<string>('');

  // Get orders from navigation state
  const batchState = location.state as BatchOrderState;

  useEffect(() => {
    if (!batchState?.orders || batchState.orders.length === 0) {
      console.error('BatchOrders: No orders in state:', batchState);
      toast({
        title: "Error",
        description: "Tidak ada pesanan yang dipilih untuk batch payment",
        variant: "destructive",
      });
      navigate('/orders');
      return;
    }

    console.log('BatchOrders: Received orders:', batchState.orders);
    setOrders(batchState.orders);
    // Generate batch ID
    const newBatchId = `BATCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setBatchId(newBatchId);
    console.log('BatchOrders: Generated batch ID:', newBatchId);
  }, [batchState, navigate, toast]);

  const totalAmount = orders.reduce((sum, order) => sum + order.total_amount, 0);

  const handleBatchPayment = async () => {
    if (orders.length === 0) {
      console.error('BatchOrders: No orders to process');
      return;
    }

    console.log('BatchOrders: Starting batch payment process');
    console.log('BatchOrders: Orders to process:', orders.map(o => ({ id: o.id, payment_status: o.payment_status, total_amount: o.total_amount })));

    setLoading(true);
    try {
      // Get current session to ensure we have proper auth
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('BatchOrders: No valid session:', sessionError);
        throw new Error('Tidak ada sesi yang valid. Silakan login kembali.');
      }

      console.log('BatchOrders: Session valid, user:', session.user.email);

      const orderIds = orders.map(order => order.id);
      const requestBody = {
        orderIds: orderIds,
        batchId: batchId,
        totalAmount: totalAmount
      };

      console.log('BatchOrders: Calling create-batch-payment with:', requestBody);

      // Create batch payment using edge function with proper auth header
      const { data, error } = await supabase.functions.invoke('create-batch-payment', {
        body: requestBody,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      console.log('BatchOrders: Edge function response:', { data, error });

      if (error) {
        console.error('BatchOrders: Edge function error:', error);
        throw new Error(error.message || 'Error calling batch payment function');
      }

      if (!data) {
        console.error('BatchOrders: No response data from edge function');
        throw new Error('Tidak ada respons dari server');
      }

      if (data.error) {
        console.error('BatchOrders: Server returned error:', data.error);
        throw new Error(data.error);
      }

      if (data?.snap_token) {
        console.log('BatchOrders: Received snap_token, initializing Midtrans payment');
        // Use Midtrans Snap
        if (window.snap) {
          window.snap.pay(data.snap_token, {
            onSuccess: function(result: any) {
              console.log('Batch payment success:', result);
              toast({
                title: "Pembayaran Berhasil",
                description: "Pembayaran batch berhasil diproses",
              });
              navigate('/orders');
            },
            onPending: function(result: any) {
              console.log('Batch payment pending:', result);
              toast({
                title: "Pembayaran Pending",
                description: "Pembayaran sedang diproses",
              });
              navigate('/orders');
            },
            onError: function(result: any) {
              console.log('Batch payment error:', result);
              toast({
                title: "Pembayaran Gagal",
                description: "Terjadi kesalahan dalam proses pembayaran",
                variant: "destructive",
              });
            },
            onClose: function() {
              console.log('Customer closed the popup without finishing the payment');
            }
          });
        } else {
          console.error('BatchOrders: Midtrans Snap not loaded');
          throw new Error('Midtrans Snap not loaded');
        }
      } else {
        console.error('BatchOrders: No snap token in response:', data);
        throw new Error('No snap token received from server');
      }
    } catch (error: any) {
      console.error('BatchOrders: Batch payment error:', error);
      console.error('BatchOrders: Error stack:', error.stack);
      
      let errorMessage = 'Gagal memproses pembayaran batch';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/orders')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Pesanan
        </Button>
        <div>
          <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Pembayaran Batch
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Bayar {orders.length} pesanan sekaligus
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Order List */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Daftar Pesanan ({orders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{order.child_name}</h4>
                      <p className="text-sm text-gray-600">Kelas {order.child_class}</p>
                      {order.delivery_date && (
                        <p className="text-sm text-gray-600">
                          Pengiriman: {formatDate(order.delivery_date)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Status: {order.payment_status} | ID: {order.id.substring(0, 8)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orange-600">
                        {formatPrice(order.total_amount)}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {order.order_items.length} item
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Order Items Summary */}
                  <div className="mt-3 space-y-1">
                    {order.order_items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm text-gray-600">
                        <span>{item.quantity}x {item.menu_items?.name || 'Unknown Item'}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    {order.order_items.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{order.order_items.length - 3} item lainnya
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Payment Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Jumlah Pesanan:</span>
                  <span>{orders.length} pesanan</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Pembayaran:</span>
                  <span className="text-orange-600">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Informasi Batch Payment:</p>
                    <ul className="text-xs space-y-1">
                      <li>• Batch ID: {batchId}</li>
                      <li>• Semua pesanan akan dibayar sekaligus</li>
                      <li>• Status pembayaran akan diupdate otomatis</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleBatchPayment}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </div>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Bayar Semua ({formatPrice(totalAmount)})
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
