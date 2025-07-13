
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface PopularItem {
  name: string;
  total_quantity: number;
  total_revenue: number;
}

export const PopularItems = () => {
  const [items, setItems] = useState<PopularItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopularItems();
  }, []);

  const fetchPopularItems = async () => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          price,
          menu_items!order_items_menu_item_id_fkey (
            name
          )
        `);

      if (error) throw error;

      // Group by menu item and calculate totals
      const itemMap = new Map<string, { quantity: number; revenue: number }>();
      
      data?.forEach((item) => {
        const name = item.menu_items?.name || 'Unknown';
        const existing = itemMap.get(name) || { quantity: 0, revenue: 0 };
        itemMap.set(name, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + (item.quantity * item.price)
        });
      });

      // Convert to array and sort by quantity
      const popularItems = Array.from(itemMap.entries())
        .map(([name, data]) => ({
          name,
          total_quantity: data.quantity,
          total_revenue: data.revenue
        }))
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 5);

      setItems(popularItems);
    } catch (error) {
      console.error('Error fetching popular items:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Menu Terpopuler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu Terpopuler</CardTitle>
        <CardDescription>Berdasarkan jumlah pesanan</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-orange-600">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {item.total_quantity} porsi terjual
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  Rp {item.total_revenue.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
