import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PrintButton } from '@/components/ui/print-button';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { formatPrice, formatDate } from '@/utils/orderUtils';
import { usePagination } from '@/hooks/usePagination';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReportData {
  id: string;
  child_name: string;
  child_class: string;
  total_amount: number;
  created_at: string;
  delivery_date: string;
  payment_status: string;
}

const Reports = () => {
  const [orders, setOrders] = useState<ReportData[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');

  const pagination = usePagination({
    data: filteredOrders,
    itemsPerPage: 10
  });

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, startDate, endDate, paymentStatusFilter, classFilter]);

  const applyFilters = () => {
    let filtered = [...orders];
    
    // Date filtering
    if (startDate) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        return orderDate >= startOfDay;
      });
    }
    
    if (endDate) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        return orderDate <= endOfDay;
      });
    }

    // Payment status filtering
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_status === paymentStatusFilter);
    }

    // Class filtering
    if (classFilter !== 'all') {
      filtered = filtered.filter(order => order.child_class === classFilter);
    }
    
    setFilteredOrders(filtered);
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setPaymentStatusFilter('all');
    setClassFilter('all');
  };

  const uniqueClasses = [...new Set(orders.map(order => order.child_class))].sort();

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Gagal memuat laporan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = orders
    .filter(order => order.payment_status === 'paid')
    .reduce((sum, order) => sum + order.total_amount, 0);

  const dailyData = orders.reduce((acc: any[], order) => {
    const date = formatDate(order.created_at);
    const existing = acc.find(item => item.date === date);
    
    if (existing) {
      existing.amount += order.total_amount;
      existing.orders += 1;
    } else {
      acc.push({
        date,
        amount: order.total_amount,
        orders: 1
      });
    }
    
    return acc;
  }, []).slice(0, 7);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = generateReportsPrintHTML();
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Laporan Penjualan</title>
            <style>
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
              .print-content { padding: 20px; }
              table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
              th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .bg-gray-50 { background-color: #f9f9f9; }
              .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; }
              .stat-box { border: 1px solid #ccc; padding: 15px; text-align: center; }
              .stat-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
              .stat-value { font-size: 24px; font-weight: bold; }
              .text-blue-600 { color: #2563eb; }
              .text-green-600 { color: #16a34a; }
              .text-purple-600 { color: #9333ea; }
              .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
              .status-paid { background-color: #dcfce7; color: #166534; }
              .status-pending { background-color: #fef3c7; color: #92400e; }
              .status-failed { background-color: #fecaca; color: #991b1b; }
              @media print {
                body { print-color-adjust: exact; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 100);
    }
  };

  const generateReportsPrintHTML = () => {
    const paidOrders = orders.filter(order => order.payment_status === 'paid');
    
    return `
      <div class="print-content">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">LAPORAN PENJUALAN</h1>
          <p style="color: #666;">Periode: ${formatDate(new Date().toISOString())}</p>
        </div>

        <div class="grid">
          <div class="stat-box">
            <div class="stat-title">Total Pesanan</div>
            <div class="stat-value text-blue-600">${orders.length}</div>
          </div>
          <div class="stat-box">
            <div class="stat-title">Total Pendapatan</div>
            <div class="stat-value text-green-600">${formatPrice(totalRevenue)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-title">Pesanan Lunas</div>
            <div class="stat-value text-purple-600">${paidOrders.length}</div>
          </div>
        </div>

        <div>
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">Detail Pesanan</h2>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Anak</th>
                <th>Kelas</th>
                <th>Tanggal</th>
                <th style="text-align: right;">Total</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map((order, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${order.child_name}</td>
                  <td>${order.child_class}</td>
                  <td>${formatDate(order.created_at)}</td>
                  <td style="text-align: right;">${formatPrice(order.total_amount)}</td>
                  <td style="text-align: center;">
                    <span class="status-badge ${
                      order.payment_status === 'paid' 
                        ? 'status-paid' 
                        : order.payment_status === 'pending'
                        ? 'status-pending'
                        : 'status-failed'
                    }">
                      ${order.payment_status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="bg-gray-50" style="font-weight: bold;">
                <td colspan="4" style="text-align: right;">Total Keseluruhan:</td>
                <td style="text-align: right;">${formatPrice(orders.reduce((sum, order) => sum + order.total_amount, 0))}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
          <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
        </div>
      </div>
    `;
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Laporan
          </h1>
          <p className="text-gray-600">Analisis penjualan dan pesanan</p>
        </div>
        <PrintButton onPrint={handlePrint} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Pendapatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pesanan Lunas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(order => order.payment_status === 'paid').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Mulai</label>
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
                    {startDate ? format(startDate, "PPP") : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Akhir</label>
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
                    {endDate ? format(endDate, "PPP") : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Payment Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Pembayaran</label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="paid">Lunas</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="failed">Gagal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Class Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Kelas</label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {uniqueClasses.map((className) => (
                    <SelectItem key={className} value={className}>
                      Kelas {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Hapus Filter
            </Button>
            
            {(startDate || endDate || paymentStatusFilter !== 'all' || classFilter !== 'all') && (
              <div className="text-sm text-gray-600">
                Menampilkan {filteredOrders.length} dari {orders.length} pesanan
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Grafik Harian</CardTitle>
          <CardDescription>Pendapatan per hari</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#ea580c" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detail Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pagination.paginatedData.map((order) => (
              <div key={order.id} className="flex justify-between items-center p-4 border rounded">
                <div>
                  <p className="font-medium">{order.child_name}</p>
                  <p className="text-sm text-gray-600">
                    Kelas {order.child_class} • {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatPrice(order.total_amount)}</p>
                  <p className={`text-sm ${
                    order.payment_status === 'paid' 
                      ? 'text-green-600' 
                      : order.payment_status === 'pending'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                    {order.payment_status}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.goToPage}
            canGoNext={pagination.canGoNext}
            canGoPrev={pagination.canGoPrev}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            totalItems={pagination.totalItems}
            itemLabel="pesanan"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
