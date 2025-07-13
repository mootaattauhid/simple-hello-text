import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getStatusColor, getStatusText, getPaymentStatusColor, getPaymentStatusText, formatPrice, formatDate } from '@/utils/orderUtils';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Search, Filter, Calendar as CalendarIcon, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menu_items: {
    name: string;
    image_url: string;
  } | null;
}

interface Order {
  id: string;
  child_name: string;
  child_class: string;
  total_amount: number;
  status: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  midtrans_order_id: string | null;
  order_items: OrderItem[];
}

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>('confirmed');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedOrders,
    goToPage,
    canGoNext,
    canGoPrev,
    startIndex,
    endIndex,
    totalItems
  } = usePagination({
    data: filteredOrders,
    itemsPerPage: 10
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, paymentFilter, startDate, endDate]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            menu_items (
              name,
              image_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to handle potential null menu_items
      const transformedOrders = (data || []).map(order => ({
        ...order,
        order_items: order.order_items.map(item => ({
          ...item,
          menu_items: item.menu_items || { name: 'Unknown Item', image_url: '' }
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

  const filterOrders = () => {
    let filtered = orders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.child_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.child_class?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by payment status
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_status === paymentFilter);
    }

    // Filter by date range
    if (startDate) {
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      filtered = filtered.filter(order => new Date(order.created_at) >= startOfDay);
    }
    
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => new Date(order.created_at) <= endOfDay);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Status pesanan berhasil diperbarui",
      });

      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui status pesanan",
        variant: "destructive",
      });
    }
  };

  const updateBulkOrderStatus = async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "Error",
        description: "Pilih pesanan yang ingin diupdate",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: bulkStatus })
        .in('id', selectedOrders);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `${selectedOrders.length} pesanan berhasil diperbarui ke status ${getStatusText(bulkStatus)}`,
      });

      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      console.error('Error updating bulk order status:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui status pesanan",
        variant: "destructive",
      });
    }
  };

  const selectAllFilteredOrders = () => {
    setSelectedOrders(filteredOrders.map(order => order.id));
  };

  const selectOrdersByDateRange = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Pilih rentang tanggal terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const ordersInDateRange = filteredOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return orderDate >= start && orderDate <= end;
    });

    setSelectedOrders(ordersInDateRange.map(order => order.id));
    
    toast({
      title: "Berhasil",
      description: `${ordersInDateRange.length} pesanan dipilih berdasarkan rentang tanggal`,
    });
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
          Manajemen Pesanan
        </h1>
        <p className="text-gray-600">Kelola dan update status pesanan</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter Pesanan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari nama/kelas/ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status Pesanan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                <SelectItem value="preparing">Disiapkan</SelectItem>
                <SelectItem value="ready">Siap</SelectItem>
                <SelectItem value="delivered">Terkirim</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status Pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pembayaran</SelectItem>
                <SelectItem value="pending">Belum Bayar</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
                <SelectItem value="failed">Gagal</SelectItem>
                <SelectItem value="refunded">Dikembalikan</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setPaymentFilter('all');
              setStartDate(undefined);
              setEndDate(undefined);
            }} variant="outline">
              Reset Filter
            </Button>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tanggal Mulai:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy') : "Pilih tanggal mulai"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tanggal Akhir:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy') : "Pilih tanggal akhir"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Aksi Massal ({selectedOrders.length} pesanan dipilih)</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedOrders([])}
              >
                Batal Pilih
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status Baru:</label>
                <Select value={bulkStatus} onValueChange={(value: OrderStatus) => setBulkStatus(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                    <SelectItem value="preparing">Disiapkan</SelectItem>
                    <SelectItem value="ready">Siap</SelectItem>
                    <SelectItem value="delivered">Terkirim</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={updateBulkOrderStatus} className="bg-primary">
                Update Status
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pilih Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={selectAllFilteredOrders}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Pilih Semua ({filteredOrders.length})
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={selectOrdersByDateRange}
              disabled={!startDate || !endDate}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Pilih Berdasarkan Tanggal
            </Button>
            
            {selectedOrders.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedOrders([])}
              >
                <Square className="h-4 w-4 mr-2" />
                Batal Pilih Semua
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {paginatedOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Info */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Checkbox
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={() => toggleOrderSelection(order.id)}
                    />
                    <h3 className="font-semibold text-lg">{order.child_name}</h3>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Kelas: {order.child_class}</p>
                    <p>ID: {order.id.slice(0, 8)}...</p>
                    <p>Tanggal: {formatDate(order.created_at)}</p>
                    <p>Total: {formatPrice(order.total_amount)}</p>
                  </div>
                  {order.notes && (
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Catatan:</strong> {order.notes}
                    </p>
                  )}
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-medium mb-2">Items:</h4>
                  <div className="space-y-1">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="text-sm">
                        {item.quantity}x {item.menu_items?.name || 'Unknown Item'} - {formatPrice(item.price)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium">Status Pesanan:</label>
                      <Badge className={`ml-2 ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status Pembayaran:</label>
                      <Badge className={`ml-2 ${getPaymentStatusColor(order.payment_status)}`}>
                        {getPaymentStatusText(order.payment_status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Update Status:</label>
                    <Select
                      value={order.status}
                      onValueChange={(value: OrderStatus) => updateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Menunggu</SelectItem>
                        <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                        <SelectItem value="preparing">Disiapkan</SelectItem>
                        <SelectItem value="ready">Siap</SelectItem>
                        <SelectItem value="delivered">Terkirim</SelectItem>
                        <SelectItem value="cancelled">Dibatalkan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
              {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' 
                ? 'Tidak ada pesanan yang sesuai dengan filter'
                : 'Belum ada pesanan masuk'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderManagement;
