
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, User, CreditCard, FileText, Clock, MapPin } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Navbar } from '@/components/Navbar';
import type { Order } from '@/types/order';

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId && user) {
      fetchOrderDetail();
    }
  }, [orderId, user]);

  const fetchOrderDetail = async () => {
    if (!orderId || !user) return;

    try {
      console.log('Fetching order detail for orderId:', orderId);
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_line_items (
            id,
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
              description,
              image_url
            )
          )
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      console.log('Order query result:', { orderData, orderError });

      if (orderError) {
        if (orderError.code === 'PGRST116') {
          console.log('Order not found, redirecting to orders page');
          toast({
            title: "Pesanan tidak ditemukan",
            description: "Pesanan yang Anda cari tidak ditemukan atau tidak dapat diakses",
            variant: "destructive",
          });
          navigate('/orders');
          return;
        }
        throw orderError;
      }

      if (!orderData) {
        console.log('No order data returned');
        toast({
          title: "Pesanan tidak ditemukan",
          description: "Pesanan yang Anda cari tidak ditemukan",
          variant: "destructive",
        });
        navigate('/orders');
        return;
      }

      // Get payment information
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('Payment data:', { paymentData, paymentError });

      // Transform the data to match our interface
      const transformedOrder = {
        ...orderData,
        order_line_items: (orderData.order_line_items || []).map((item: any) => ({
          ...item,
          order_id: orderData.id,
          menu_items: item.menu_items || { name: 'Unknown Item', image_url: '', description: '' }
        })),
        payments: paymentData || []
      };

      console.log('Transformed order:', transformedOrder);
      setOrder(transformedOrder);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      toast({
        title: "Error",
        description: "Gagal memuat detail pesanan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const },
      confirmed: { label: 'Dikonfirmasi', variant: 'default' as const },
      preparing: { label: 'Disiapkan', variant: 'default' as const },
      ready: { label: 'Siap', variant: 'default' as const },
      delivered: { label: 'Dikirim', variant: 'default' as const },
      completed: { label: 'Selesai', variant: 'default' as const },
      cancelled: { label: 'Dibatalkan', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: 'secondary' as const
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Belum Bayar', variant: 'secondary' as const },
      paid: { label: 'Sudah Bayar', variant: 'default' as const },
      failed: { label: 'Gagal', variant: 'destructive' as const },
      cancelled: { label: 'Dibatalkan', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: 'secondary' as const
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Group items by child and date
  const groupedItems = React.useMemo(() => {
    if (!order?.order_line_items) return {};

    const groups: { [key: string]: { [date: string]: any[] } } = {};

    order.order_line_items.forEach(item => {
      const childKey = `${item.child_name} (${item.child_class || 'No Class'})`;
      if (!groups[childKey]) {
        groups[childKey] = {};
      }
      if (!groups[childKey][item.delivery_date]) {
        groups[childKey][item.delivery_date] = [];
      }
      groups[childKey][item.delivery_date].push(item);
    });

    return groups;
  }, [order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <CardTitle className="text-xl mb-2">Pesanan Tidak Ditemukan</CardTitle>
              <CardDescription className="mb-4">
                Pesanan yang Anda cari tidak ditemukan atau tidak dapat diakses
              </CardDescription>
              <Button onClick={() => navigate('/orders')}>
                Kembali ke Riwayat Pesanan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const latestPayment = order.payments?.[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/orders')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Riwayat Pesanan
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Pesanan #{order.order_number}
              </h1>
              <p className="text-gray-600">
                Dibuat pada {new Date(order.created_at).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              {getStatusBadge(order.status || 'pending')}
              {getPaymentStatusBadge(order.payment_status || 'pending')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Ringkasan Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nomor Pesanan:</span>
                    <span className="font-medium">#{order.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Pembayaran:</span>
                    <span className="font-bold text-lg text-green-600">
                      Rp {order.total_amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {order.parent_notes && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-gray-600 block mb-2">Catatan:</span>
                        <p className="text-gray-800 bg-gray-50 p-3 rounded-md">
                          {order.parent_notes}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Items by Child and Date */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Detail Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(groupedItems).map(([childKey, dateGroups]) => (
                    <div key={childKey} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-4 text-blue-600">
                        👤 {childKey}
                      </h3>
                      
                      <div className="space-y-4">
                        {Object.entries(dateGroups).map(([date, items]) => (
                          <div key={date} className="bg-gray-50 rounded-md p-3">
                            <div className="flex items-center mb-3">
                              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                              <span className="font-medium text-gray-700">
                                📅 {new Date(date).toLocaleDateString('id-ID', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              {items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center bg-white p-3 rounded border">
                                  <div className="flex-1">
                                    <h4 className="font-medium">{item.menu_items?.name}</h4>
                                    {item.menu_items?.description && (
                                      <p className="text-sm text-gray-600">
                                        {item.menu_items.description}
                                      </p>
                                    )}
                                    <div className="flex items-center mt-1 text-sm text-gray-500">
                                      <span>Qty: {item.quantity}</span>
                                      <span className="mx-2">•</span>
                                      <span>Rp {item.unit_price.toLocaleString('id-ID')}/item</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-bold text-green-600">
                                      Rp {(item.total_price || (item.unit_price * item.quantity)).toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Informasi Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    {getPaymentStatusBadge(order.payment_status || 'pending')}
                  </div>
                  
                  {order.payment_method && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Metode:</span>
                      <span className="font-medium capitalize">{order.payment_method}</span>
                    </div>
                  )}
                  
                  {latestPayment && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID Transaksi:</span>
                        <span className="font-mono text-sm">{latestPayment.transaction_id}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Waktu Bayar:</span>
                        <span className="text-sm">
                          {new Date(latestPayment.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Dibayar:</span>
                    <span className="text-green-600">
                      Rp {order.total_amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Timeline Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Pesanan Dibuat</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {order.payment_status === 'paid' && latestPayment && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Pembayaran Berhasil</p>
                        <p className="text-sm text-gray-600">
                          {new Date(latestPayment.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {order.status === 'completed' && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Pesanan Selesai</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.updated_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
