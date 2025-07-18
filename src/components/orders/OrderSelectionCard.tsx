
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Calendar, MapPin, Clock } from 'lucide-react';
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

interface OrderSelectionCardProps {
  order: Order;
  isSelected: boolean;
  onSelectionChange: (orderId: string, selected: boolean) => void;
  isDisabled?: boolean;
}

export const OrderSelectionCard = ({ 
  order, 
  isSelected, 
  onSelectionChange,
  isDisabled = false 
}: OrderSelectionCardProps) => {
  const orderExpired = isOrderExpired(order.delivery_date);
  const canPay = canPayOrder(order);
  const canSelect = canPay && !isDisabled;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-orange-500' : ''} ${!canSelect ? 'opacity-50' : ''} ${orderExpired ? 'border-red-200' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelectionChange(order.id, !!checked)}
              disabled={!canSelect}
              className="mt-1"
            />
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
          {/* Order Items Summary */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Detail Pesanan:</h4>
            {order.order_items.slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <img
                    src={item.menu_items?.image_url || '/placeholder.svg'}
                    alt={item.menu_items?.name || 'Unknown Item'}
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.menu_items?.name || 'Unknown Item'}</p>
                    <p className="text-xs text-gray-600">
                      {item.quantity}x @ {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
            {order.order_items.length > 2 && (
              <p className="text-xs text-gray-500 text-center">
                +{order.order_items.length - 2} item lainnya
              </p>
            )}
          </div>

          {/* Total */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total:</span>
              <span className="text-orange-600">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>

          {/* Status Messages */}
          {orderExpired && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-800 text-center">
                Pesanan kadaluarsa - tidak dapat dibayar
              </p>
            </div>
          )}
          
          {!canSelect && !orderExpired && order.payment_status !== 'pending' && (
            <p className="text-xs text-gray-500 text-center">
              Pesanan ini sudah dibayar atau tidak dapat dipilih untuk pembayaran batch
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
