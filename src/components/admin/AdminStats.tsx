
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, ShoppingBag, Users, Calendar } from 'lucide-react';
import { formatPrice } from '@/utils/orderUtils';

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  ordersToday: number;
}

export const AdminStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    ordersToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total revenue and orders
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at');

      // Get total customers
      const { data: customers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'parent');

      // Calculate stats
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const totalOrders = orders?.length || 0;
      const totalCustomers = customers?.length || 0;
      
      // Orders today
      const today = new Date().toISOString().split('T')[0];
      const ordersToday = orders?.filter(order => 
        order.created_at?.startsWith(today)
      ).length || 0;

      setStats({
        totalRevenue,
        totalOrders,
        totalCustomers,
        ordersToday
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Pendapatan",
      value: formatPrice(stats.totalRevenue),
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Total Pesanan",
      value: stats.totalOrders.toString(),
      icon: ShoppingBag,
      color: "text-blue-600"
    },
    {
      title: "Total Customer",
      value: stats.totalCustomers.toString(),
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Pesanan Hari Ini",
      value: stats.ordersToday.toString(),
      icon: Calendar,
      color: "text-orange-600"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
