
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Trash2, User, Calendar } from 'lucide-react';
import { CartItem } from '@/types/cart';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface CartItemListProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  formatPrice: (price: number) => string;
}

const CartItemList = ({ items, onUpdateQuantity, onRemoveItem, formatPrice }: CartItemListProps) => {
  // Group items by child and date for better display
  const groupedItems = items.reduce((groups, item) => {
    const childName = item.child_name || 'Tidak diketahui';
    const date = item.date || new Date().toISOString().split('T')[0];
    const key = `${childName}-${date}`;
    
    if (!groups[key]) {
      groups[key] = {
        child_name: childName,
        child_class: item.child_class,
        date: date,
        items: []
      };
    }
    
    groups[key].items.push(item);
    return groups;
  }, {} as Record<string, { child_name: string; child_class?: string; date: string; items: CartItem[] }>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedItems).map(([key, group]) => (
        <Card key={key} className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            {/* Child and Date Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-orange-600" />
                <span className="font-semibold text-gray-700">
                  {group.child_name}
                  {group.child_class && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {group.child_class}
                    </Badge>
                  )}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(group.date), 'dd MMMM yyyy', { locale: idLocale })}</span>
              </div>
            </div>

            {/* Items for this child and date */}
            <div className="space-y-3">
              {group.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 bg-gray-50 p-3 rounded-lg">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-sm text-gray-600">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="h-7 w-7 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="mx-2 font-semibold w-6 text-center text-sm">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRemoveItem(item.id)}
                      className="h-7 w-7 p-0 ml-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CartItemList;
