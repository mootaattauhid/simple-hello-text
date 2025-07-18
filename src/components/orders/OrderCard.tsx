
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Calendar, MapPin, Clock, Download } from 'lucide-react';
import { Order } from '@/types/order';
import { 
  getStatusColor, 
  getPaymentStatusColor, 
  getStatusText, 
  getPaymentStatusText,
  formatPrice,
  formatDate,
  isOrderExpired,
  canPayOrder
} from '@/utils/orderUtils';
import { InvoicePDF } from './InvoicePDF';

interface OrderCardProps {
  order: Order;
  onRetryPayment: (order: Order) => void;
}

export const OrderCard = ({ order, onRetryPayment }: OrderCardProps) => {
  const orderExpired = isOrderExpired(order.delivery_date);
  const canPay = canPayOrder(order);
  const { handleDownloadPDF } = InvoicePDF({ order });

  return (
    <Card className={`hover:shadow-lg transition-shadow ${orderExpired ? 'opacity-75 border-red-200' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="text-lg flex items-center">
              <User className="h-5 w-5 mr-2 text-orange-600" />
              {order.child_name}
            </CardTitle>
            <CardDescription className="space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <span>Kelas {order.child_class}</span>
              </div>
              {order.delivery_date && (
                <div className={`flex items-center text-sm ${orderExpired ? 'text-red-600' : 'text-gray-600'}`}>
                  <Calendar className="h-4 w-4 mr-1" />
                  Tanggal Pengiriman: {formatDate(order.delivery_date)}
                  {orderExpired && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Kadaluarsa
                    </Badge>
                  )}
                </div>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                Dipesan: {formatDate(order.created_at)}
              </div>
            </CardDescription>
          </div>
          <div className="text-right space-y-1">
            <Badge className={getStatusColor(order.status)}>
              {getStatusText(order.status)}
            </Badge>
            <Badge className={getPaymentStatusColor(order.payment_status)}>
              {getPaymentStatusText(order.payment_status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Order Items */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Detail Pesanan:</h4>
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img
                    src={item.menu_items?.image_url || '/placeholder.svg'}
                    alt={item.menu_items?.name || 'Unknown Item'}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.menu_items?.name || 'Unknown Item'}</p>
                    <p className="text-xs text-gray-600">
                      {formatPrice(item.price)} per item
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{item.quantity}x</p>
                  <p className="text-xs text-gray-600">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Catatan:</strong> {order.notes}
              </p>
            </div>
          )}

          {/* Order Summary */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total Pembayaran:</span>
              <span className="text-orange-600">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>

          {/* Payment Information */}
          {order.midtrans_order_id && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Order ID:</strong> {order.midtrans_order_id}
              </p>
            </div>
          )}

          {/* Expired Order Warning */}
          {orderExpired && order.payment_status === 'pending' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Pesanan Kadaluarsa:</strong> Tanggal katering sudah terlewat. Pembayaran tidak dapat dilakukan.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Payment Button */}
            {order.payment_status === 'pending' && (
              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                onClick={() => onRetryPayment(order)}
                disabled={!canPay}
              >
                {orderExpired 
                  ? 'Tidak Dapat Dibayar (Kadaluarsa)' 
                  : order.midtrans_order_id 
                    ? 'Lanjutkan Pembayaran' 
                    : 'Bayar Sekarang'
                }
              </Button>
            )}

            {/* Download Invoice Button */}
            <Button 
              variant="outline"
              className="w-full"
              onClick={handleDownloadPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Invoice PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
