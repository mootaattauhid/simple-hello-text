
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

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

export const useDailyMenus = () => {
  const [dailyMenus, setDailyMenus] = useState<DailyMenu[]>([]);

  const fetchDailyMenus = async (date: Date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Check if date is available in order_schedules
      const { data: schedule } = await supabase
        .from('order_schedules')
        .select('*')
        .eq('date', dateStr)
        .single();

      // If date is blocked, return empty menus
      if (schedule?.is_blocked) {
        setDailyMenus([]);
        return;
      }
      
      // Get all available menu items with category information
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          id,
          name,
          description,
          image_url,
          price,
          category_id,
          is_available,
          categories (
            name
          )
        `)
        .eq('is_available', true);

      if (error) throw error;
      
      // Transform menu_items data to match DailyMenu interface
      const transformedData: DailyMenu[] = (data || []).map(item => ({
        id: item.id,
        date: dateStr,
        food_item_id: item.id,
        price: item.price,
        is_available: item.is_available || true,
        max_quantity: null,
        current_quantity: 0,
        food_items: {
          name: item.name,
          description: item.description || '',
          image_url: item.image_url || '',
          category: item.categories?.name || 'Uncategorized'
        }
      }));

      setDailyMenus(transformedData);
    } catch (error) {
      console.error('Error fetching daily menus:', error);
      toast({
        title: "Error",
        description: "Gagal memuat menu harian",
        variant: "destructive",
      });
    }
  };

  return { dailyMenus, fetchDailyMenus };
};
