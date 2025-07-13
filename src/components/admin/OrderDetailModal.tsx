
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, CreditCard, FileText, MapPin, Phone } from 'lucide-react';
import { getStatusColor, getStatusText, getPaymentStatusColor, getPaymentStatusText, formatPrice, formatDate } from '@/utils/orderUtils';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  delivery_date: string;
  child_name: string;
  child_class: string;
  menu_items: {
    name: string;
    image_url: string;
    description?: string;
  } | null;
}

interface OrderDetailData {
  id: string;
  order_number: string;
  child_name: string;
  child_class: string;
  total_amount: number;
  status: string;
  payment_status: string;
  notes: string | null;
  parent_notes: string | null;
  created_at: string;
  delivery_date: string | null;
  payment_method: string | null;
  user_id: string;
  order_line_items: OrderItem[];
  profiles?: {
    full_name: string;
    phone: string;
    address: string;
  } | null;
}

interface OrderDetailModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailModal = ({ orderId, isOpen, onClose }: OrderDetailModalProps) => {
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderId && isOpen) {
      fetchOrderDetail();
    }
  }, [orderId, isOpen]);

  const fetchOrderDetail = async () => {
    if (!orderId) return;
    
    setLoading(true);
    try {
      // Fetch order with line items
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_line_items (
            id,
            quantity,
            unit_price,
            total_price,
            delivery_date,
            child_name,
            child_class,
            menu_items (
              name,
              image_url,
              description
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Fetch user profile
      if (orderData.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, phone, address')
          .eq('id', orderData.user_id)
          .single();

        orderData.profiles = profileData;
      }

      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order detail:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group items by child and date
  const groupedItems = React.useMemo(() => {
    if (!order?.order_line_items) return {};

    const groups: { [key: string]: { [date: string]: OrderItem[] } } = {};

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
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detail Pesanan #{order?.order_number}</span>
            <div className="flex gap-2">
              <Badge className={getStatusColor(order?.status || '')}>
                {getStatusText(order?.status || '')}
              </Badge>
              <Badge className={getPaymentStatusColor(order?.payment_status || '')}>
                {getPaymentStatusText(order?.payment_status || '')}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Dibuat pada {order ? formatDate(order.created_at) : ''}
          </DialogDescription>
        </DialogHeader>

        {order && (
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2" />
                  Informasi Pelanggan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nama Orang Tua:</p>
                    <p className="font-medium">{order.profiles?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">No. Telepon:</p>
                    <p className="font-medium">{order.profiles?.phone || 'N/A'}</p>
                  </div>
                </div>
                {order.profiles?.address && (
                  <div>
                    <p className="text-sm text-gray-600">Alamat:</p>
                    <p className="font-medium">{order.profiles.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="h-5 w-5 mr-2" />
                  Ringkasan Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nomor Pesanan:</p>
                    <p className="font-medium">#{order.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Pembayaran:</p>
                    <p className="font-bold text-lg text-green-600">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>
                </div>
                
                {order.payment_method && (
                  <div>
                    <p className="text-sm text-gray-600">Metode Pembayaran:</p>
                    <p className="font-medium capitalize">{order.payment_method}</p>
                  </div>
                )}

                {order.parent_notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Catatan Orang Tua:</p>
                      <p className="text-gray-800 bg-gray-50 p-3 rounded-md">
                        {order.parent_notes}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Order Items by Child */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="h-5 w-5 mr-2" />
                  Detail Pesanan Per Anak
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
                                📅 {formatDate(date)}
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
                                      <span>{formatPrice(item.unit_price)}/item</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-bold text-green-600">
                                      {formatPrice(item.total_price)}
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
        )}
      </DialogContent>
    </Dialog>
  );
};
