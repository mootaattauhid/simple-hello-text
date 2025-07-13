
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';

export const populateDailyMenus = async () => {
  try {
    // Get all available menu items
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true);

    if (menuError) throw menuError;

    if (!menuItems || menuItems.length === 0) {
      console.log('No menu items found');
      return;
    }

    console.log('Found menu items:', menuItems.length);
    
    // Since daily_menus table doesn't exist in types, we'll work directly with menu_items
    // and use order_schedules to manage availability by date
    
    const schedulePromises = [];
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Create or update order schedule for this date
      schedulePromises.push(
        supabase
          .from('order_schedules')
          .upsert({
            date: dateStr,
            is_blocked: false,
            max_orders: 100, // Default max orders per day
            current_orders: 0,
            cutoff_date: dateStr,
            cutoff_time: '05:00:00',
            notes: 'Auto-generated schedule'
          }, {
            onConflict: 'date'
          })
      );
    }

    const results = await Promise.all(schedulePromises);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Some schedules failed to populate:', errors);
    } else {
      console.log('Order schedules populated successfully for next 7 days');
    }

  } catch (error) {
    console.error('Error in populateDailyMenus:', error);
    throw error;
  }
};
