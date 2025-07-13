
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, isBefore, isToday, isWeekend } from 'date-fns';

interface OrderSchedule {
  date: string;
  is_blocked: boolean;
  cutoff_time: string;
  cutoff_date: string | null;
  max_orders: number | null;
  current_orders: number;
  notes: string | null;
}

export const useOrderSchedules = () => {
  const [orderSchedules, setOrderSchedules] = useState<OrderSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderSchedules();
  }, []);

  const fetchOrderSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('order_schedules')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0]);

      if (error) throw error;
      setOrderSchedules(data || []);
    } catch (error) {
      console.error('Error fetching order schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    // Disable weekends first
    if (isWeekend(date)) return true;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const schedule = orderSchedules.find(s => s.date === dateStr);
    
    // Disable if date is blocked
    if (schedule?.is_blocked) return true;
    
    // Disable if max orders reached
    if (schedule?.max_orders && schedule.current_orders >= schedule.max_orders) return true;
    
    // Check cutoff time
    if (schedule) {
      const cutoffDate = schedule.cutoff_date ? new Date(schedule.cutoff_date) : new Date(date);
      // H+1 (day after delivery date)
      cutoffDate.setDate(cutoffDate.getDate());
      
      const [hours, minutes] = schedule.cutoff_time.split(':');
      cutoffDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      if (new Date() > cutoffDate) return true;
    } else {
      // Default: disable if it's past 10:00 on H+1
      const cutoffDate = new Date(date);
      cutoffDate.setDate(cutoffDate.getDate());
      cutoffDate.setHours(5, 0, 0, 0);
      
      if (new Date() > cutoffDate) return true;
    }
    
    // Disable past dates
    if (isBefore(date, new Date()) && !isToday(date)) return true;
    
    return false;
  };

  const getDateStatus = (date: Date) => {
    // Check weekend first
    if (isWeekend(date)) {
      return { status: 'closed', message: 'Tutup di hari Sabtu & Minggu' };
    }
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const schedule = orderSchedules.find(s => s.date === dateStr);
    
    if (schedule?.is_blocked) {
      return { status: 'blocked', message: schedule.notes || 'Tanggal diblokir' };
    }
    
    if (schedule?.max_orders && schedule.current_orders >= schedule.max_orders) {
      return { status: 'full', message: 'Kuota penuh' };
    }
    
    // Check cutoff time
    if (schedule) {
      const cutoffDate = schedule.cutoff_date ? new Date(schedule.cutoff_date) : new Date(date);
      // H+1 (day after delivery date)
      cutoffDate.setDate(cutoffDate.getDate());
      
      const [hours, minutes] = schedule.cutoff_time.split(':');
      cutoffDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      if (new Date() > cutoffDate) {
        return { status: 'expired', message: 'Batas waktu pesan sudah lewat' };
      }
    }
    
    return { status: 'available', message: 'Tersedia' };
  };

  return {
    orderSchedules,
    loading,
    isDateDisabled,
    getDateStatus
  };
};
