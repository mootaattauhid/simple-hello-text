
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CashPayment } from '@/components/cashier/CashPayment';
import { formatPrice, formatDate } from '@/utils/orderUtils';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Search, DollarSign, Receipt, TrendingUp } from 'lucide-react';

interface Order {
  id: string;
  child_name: string;
  child_class: string;
  total_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
  order_items: {
    quantity: number;
    price: number;
    menu_items: {
      name: string;
    } | null;
  }[];
}

interface DailyStats {
  totalOrders: number;
  totalRevenue: number;
  cashPayments: number;
}

const CashierDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    totalOrders: 0,
    totalRevenue: 0,
    cashPayments: 0
  });
  const [loading, setLoading] = useState(true);

  // Pagination untuk filtered orders
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedOrders,
    goToPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
    startIndex,
    endIndex,
    totalItems
  } = usePagination({
    data: filteredOrders,
    itemsPerPage: 15
  });

  useEffect(() => {
    fetchOrders();
    fetchDailyStats();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price,
            menu_items (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedOrders = (data || []).map(order => ({
        ...order,
        order_items: order.order_items.map(item => ({
          ...item,
          menu_items: item.menu_items || { name: 'Unknown Item' }
        }))
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pesanan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's orders
      const { data: todayOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', today + 'T00:00:00')
        .lt('created_at', today + 'T23:59:59');

      if (ordersError) throw ordersError;

      // Get today's cash payments
      const { data: cashPayments, error: cashError } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_method', 'cash')
        .gte('created_at', today + 'T00:00:00')
        .lt('created_at', today + 'T23:59:59');

      if (cashError) throw cashError;

      setDailyStats({
        totalOrders: todayOrders?.length || 0,
        totalRevenue: todayOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0,
        cashPayments: cashPayments?.length || 0
      });
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.child_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.child_class?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter === 'pending') {
      filtered = filtered.filter(order => order.payment_status === 'pending');
    } else if (statusFilter === 'paid') {
      filtered = filtered.filter(order => order.payment_status === 'paid');
    }

    setFilteredOrders(filtered);
  };

  const handlePaymentComplete = () => {
    setSelectedOrder(null);
    fetchOrders();
    fetchDailyStats();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <Button 
            onClick={() => setSelectedOrder(null)}
            variant="outline"
          >
            ← Kembali ke Daftar Pesanan
          </Button>
        </div>
        <CashPayment 
          order={selectedOrder} 
          onPaymentComplete={handlePaymentComplete} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Dashboard Kasir
        </h1>
        <p className="text-gray-600">Kelola pembayaran tunai dan transaksi</p>
      </div>

      {/* Daily Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan Hari Ini</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyStats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Hari Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(dailyStats.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pembayaran Tunai</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyStats.cashPayments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari nama anak/kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status Pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Belum Bayar</SelectItem>
                <SelectItem value="paid">Sudah Bayar</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={() => {
              setSearchTerm('');
              setStatusFilter('pending');
            }} variant="outline">
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {paginatedOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                <div>
                  <h3 className="font-semibold text-lg">{order.child_name}</h3>
                  <p className="text-sm text-gray-600">Kelas: {order.child_class}</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Items:</p>
                  <div className="space-y-1">
                    {order.order_items.slice(0, 2).map((item, index) => (
                      <div key={index} className="text-sm">
                        {item.quantity}x {item.menu_items?.name}
                      </div>
                    ))}
                    {order.order_items.length > 2 && (
                      <div className="text-sm text-gray-500">
                        +{order.order_items.length - 2} item lainnya
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(order.total_amount)}
                  </p>
                  <Badge 
                    className={
                      order.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {order.payment_status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                  </Badge>
                </div>

                <div>
                  {order.payment_status === 'pending' ? (
                    <Button
                      onClick={() => setSelectedOrder(order)}
                      className="w-full"
                      size="lg"
                    >
                      Proses Pembayaran
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      Sudah Dibayar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        canGoNext={canGoNext}
        canGoPrev={canGoPrev}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        itemLabel="pesanan"
      />

      {filteredOrders.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium mb-2">Tidak Ada Pesanan</h3>
            <p className="text-gray-600">
              {statusFilter === 'pending' 
                ? 'Tidak ada pesanan yang menunggu pembayaran'
                : 'Tidak ada pesanan yang sesuai dengan filter'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CashierDashboard;
