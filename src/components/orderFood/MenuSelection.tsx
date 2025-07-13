
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface DailyMenu {
  id: string;
  date: string;
  food_item_id: string;
  price: number;
  is_available: boolean;
  max_quantity: number | null;
  current_quantity: number;
  food_items: {
    name: string;
    description: string;
    image_url: string;
    category: string;
  };
}

interface MenuSelectionProps {
  selectedDate: Date;
  dailyMenus: DailyMenu[];
  getCartQuantity: (menu: DailyMenu) => number;
  isDateDisabled: (date: Date) => boolean;
  addToCart: (menu: DailyMenu) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  formatPrice: (price: number) => string;
  selectedChild: string;
}

const MenuSelection = ({
  selectedDate,
  dailyMenus,
  getCartQuantity,
  isDateDisabled,
  addToCart,
  updateQuantity,
  formatPrice,
  selectedChild
}: MenuSelectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2 text-orange-600" />
          Menu {format(selectedDate, 'dd MMMM yyyy', { locale: idLocale })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dailyMenus.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Belum ada menu untuk tanggal ini</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dailyMenus.map((menu) => {
              const quantity = getCartQuantity(menu);
              const dateDisabled = isDateDisabled(selectedDate);
              
              return (
                <div key={menu.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                  <img
                    src={menu.food_items.image_url}
                    alt={menu.food_items.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{menu.food_items.name}</h3>
                    <p className="text-sm text-gray-600">{menu.food_items.description}</p>
                    <p className="font-semibold text-orange-600">{formatPrice(menu.price)}</p>
                    <Badge variant="outline" className="text-xs">
                      {menu.food_items.category}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {dateDisabled ? (
                      <Badge variant="destructive" className="text-xs">
                        Tidak tersedia
                      </Badge>
                    ) : quantity > 0 ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(`${menu.food_item_id}-${format(selectedDate, 'yyyy-MM-dd')}-${selectedChild}`, quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="mx-2 font-semibold w-8 text-center">{quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(`${menu.food_item_id}-${format(selectedDate, 'yyyy-MM-dd')}-${selectedChild}`, quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm"
                        onClick={() => addToCart(menu)}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Tambah
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MenuSelection;
