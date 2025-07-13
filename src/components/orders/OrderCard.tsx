
import { Order } from '@/types/order';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, Users, Eye } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';

interface OrderCardProps {
  order: Order;
  onRetryPayment?: (order: Order) => void;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (orderId: string, selected: boolean) => void;
}

export const OrderCard = ({
  order,
  onRetryPayment,
  showCheckbox = false,
  isSelected = false,
  onSelectionChange
}: OrderCardProps) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'success':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Group order line items by child
  const groupedItems = order.order_line_items?.reduce((acc: any, item) => {
    const childKey = `${item.child_name}_${item.child_class}`;
    if (!acc[childKey]) {
      acc[childKey] = {
        child_name: item.child_name,
        child_class: item.child_class,
        items: []
      };
    }
    acc[childKey].items.push(item);
    return acc;
  }, {}) || {};

  const uniqueDeliveryDates = [...new Set(
    order.order_line_items?.map(item => item.delivery_date) || []
  )].sort();

  const totalChildren = Object.keys(groupedItems).length;
  
  const handleViewDetail = () => {
    navigate(`/orders/${order.id}`);
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {showCheckbox && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => {
                  onSelectionChange?.(order.id, checked as boolean);
                }}
              />
            )}
            <div>
              <h3 className="font-semibold text-sm md:text-base">
                #{order.order_number}
              </h3>
              <p className="text-xs md:text-sm text-gray-600">
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getStatusColor(order.payment_status || '')}>
              {order.payment_status?.toUpperCase() || 'PENDING'}
            </Badge>
            <p className="font-bold text-sm md:text-lg text-orange-600">
              {formatCurrency(order.total_amount)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Order Summary */}
        <div className="flex items-center gap-4 text-xs md:text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 md:h-4 md:w-4" />
            <span>{totalChildren} anak</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 md:h-4 md:w-4" />
            <span>{uniqueDeliveryDates.length} hari</span>
          </div>
        </div>

        {/* Children Details */}
        <div className="space-y-2 mb-4">
          {Object.entries(groupedItems).slice(0, 2).map(([childKey, childData]: [string, any]) => (
            <div key={childKey} className="bg-gray-50 rounded-lg p-2 md:p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">{childData.child_name}</p>
                  <p className="text-xs text-gray-600">{childData.child_class}</p>
                </div>
                <p className="text-xs text-gray-600">
                  {childData.items.length} item
                </p>
              </div>
              
              {/* Show delivery dates for this child */}
              <div className="flex flex-wrap gap-1">
                {[...new Set(childData.items.map((item: any) => item.delivery_date))]
                  .sort()
                  .slice(0, 3)
                  .map((date: string) => (
                    <span key={date} className="text-xs bg-white px-2 py-1 rounded">
                      📅 {formatDate(date)}
                    </span>
                  ))}
              </div>
            </div>
          ))}
          
          {Object.keys(groupedItems).length > 2 && (
            <p className="text-xs text-gray-500 text-center">
              +{Object.keys(groupedItems).length - 2} anak lainnya
            </p>
          )}
        </div>

        {/* Delivery Dates Summary */}
        {uniqueDeliveryDates.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-600 mb-2">Tanggal Pengantaran:</p>
            <div className="flex flex-wrap gap-1">
              {uniqueDeliveryDates.slice(0, 3).map(date => (
                <span key={date} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {formatDate(date)}
                </span>
              ))}
              {uniqueDeliveryDates.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{uniqueDeliveryDates.length - 3} hari lagi
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewDetail}
            className="flex-1"
          >
            <Eye className="mr-2 h-4 w-4" />
            Lihat Detail
          </Button>
          
          {order.payment_status === 'pending' && onRetryPayment && (
            <Button 
              size="sm" 
              onClick={() => onRetryPayment(order)}
              className="flex-1"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Bayar Sekarang
            </Button>
          )}
        </div>

        {order.parent_notes && (
          <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
            <p className="text-gray-600 mb-1">Catatan:</p>
            <p className="text-gray-800">{order.parent_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
