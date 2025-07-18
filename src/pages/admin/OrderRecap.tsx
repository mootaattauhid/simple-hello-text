import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { formatPrice, formatDate } from '@/utils/orderUtils';
import { PrintButton } from '@/components/ui/print-button';
import { RecapPrint } from '@/components/print/RecapPrint';
import { DetailOrdersPrint } from '@/components/print/DetailOrdersPrint';

interface RecapData {
  date: string;
  total_orders: number;
  total_amount: number;
  paid_orders: number;
  pending_orders: number;
  total_items: number;
}

interface DetailedOrder {
  id: string;
  child_name: string;
  child_class: string;
  total_amount: number;
  payment_status: string;
  delivery_date: string;
  order_items: {
    quantity: number;
    menu_items: { name: string } | null;
  }[];
}

interface OrderRecapProps {
  onExportData?: (data: any[]) => void;
}

export const OrderRecap = ({ onExportData }: OrderRecapProps) => {
  const [recapData, setRecapData] = useState<RecapData[]>([]);
  const [detailedOrders, setDetailedOrders] = useState<DetailedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [showRecapPrint, setShowRecapPrint] = useState(false);
  const [showDetailPrint, setShowDetailPrint] = useState(false);
  const [printType, setPrintType] = useState<string>('standard');
  
  // Filter states
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  useEffect(() => {
    fetchClasses();
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedClass, selectedPaymentStatus, startDate, endDate]);

  const fetchClasses = async () => {
    try {
      const { data: classesData, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClasses(classesData || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data kelas",
        variant: "destructive",
      });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build query with delivery_date filters
      let query = supabase
        .from('orders')
        .select(`
          id,
          child_name,
          child_class,
          total_amount,
          payment_status,
          delivery_date,
          order_items (
            quantity,
            menu_items (
              name
            )
          )
        `)
        .not('delivery_date', 'is', null)
        .order('delivery_date', { ascending: false });

      // Apply class filter
      if (selectedClass !== 'all') {
        query = query.eq('child_class', selectedClass);
      }

      // Apply payment status filter
      if (selectedPaymentStatus !== 'all') {
        query = query.eq('payment_status', selectedPaymentStatus);
      }

      // Apply delivery date filters (using delivery_date, not created_at)
      if (startDate) {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        query = query.gte('delivery_date', startOfDay.toISOString().split('T')[0]);
      }

      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('delivery_date', endOfDay.toISOString().split('T')[0]);
      }

      const { data: ordersData, error } = await query;

      if (error) throw error;

      setDetailedOrders(ordersData || []);

      // Group by delivery_date for recap
      const recapMap = new Map<string, RecapData>();
      
      ordersData?.forEach(order => {
        const date = order.delivery_date;
        const totalItems = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
        
        if (!recapMap.has(date)) {
          recapMap.set(date, {
            date,
            total_orders: 0,
            total_amount: 0,
            paid_orders: 0,
            pending_orders: 0,
            total_items: 0,
          });
        }
        
        const recap = recapMap.get(date)!;
        recap.total_orders += 1;
        recap.total_amount += order.total_amount;
        recap.total_items += totalItems;
        
        if (order.payment_status === 'paid') {
          recap.paid_orders += 1;
        } else {
          recap.pending_orders += 1;
        }
      });

      const recapArray = Array.from(recapMap.values()).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setRecapData(recapArray);
      
      // Call export callback if provided
      if (onExportData) {
        onExportData(recapArray);
      }
    } catch (error) {
      console.error('Error fetching recap data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data rekapitulasi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedClass('all');
    setSelectedPaymentStatus('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const hasActiveFilters = selectedClass !== 'all' || selectedPaymentStatus !== 'all' || startDate || endDate;

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Lunas';
      case 'pending': return 'Belum Bayar';
      case 'failed': return 'Gagal';
      case 'refunded': return 'Refund';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'refunded': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleRecapPrint = (printerType = 'standard') => {
    if (recapData.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data rekapitulasi untuk dicetak",
        variant: "destructive",
      });
      return;
    }
    setPrintType(printerType);
    setShowRecapPrint(true);
  };

  const handleDetailPrint = (printerType = 'standard') => {
    if (detailedOrders.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data detail pesanan untuk dicetak",
        variant: "destructive",
      });
      return;
    }
    setPrintType(printerType);
    setShowDetailPrint(true);
  };

  React.useEffect(() => {
    if (showRecapPrint) {
      setShowRecapPrint(false);
    }
  }, [showRecapPrint]);

  React.useEffect(() => {
    if (showDetailPrint) {
      setShowDetailPrint(false);
    }
  }, [showDetailPrint]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Rekapitulasi Pesanan (Berdasarkan Tanggal Katering)
            </CardTitle>
            <div className="flex items-center gap-2">
              <PrintButton
                onPrint={handleRecapPrint}
                label="Print Rekapitulasi"
                showPrinterOptions={true}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            {/* Class Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Kelas</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.name}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Pembayaran</label>
              <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="paid">Lunas</SelectItem>
                  <SelectItem value="pending">Belum Bayar</SelectItem>
                  <SelectItem value="failed">Gagal</SelectItem>
                  <SelectItem value="refunded">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Katering Mulai</label>
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
                    {startDate ? format(startDate, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
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

            {/* End Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Katering Akhir</label>
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
                    {endDate ? format(endDate, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
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
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Hapus Semua Filter
              </Button>
            </div>
          )}

          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Menampilkan data
                {selectedClass !== 'all' && ` untuk kelas ${selectedClass}`}
                {selectedPaymentStatus !== 'all' && ` dengan status ${getPaymentStatusLabel(selectedPaymentStatus)}`}
                {startDate && ` dari tanggal katering ${format(startDate, "dd/MM/yyyy")}`}
                {endDate && ` sampai ${format(endDate, "dd/MM/yyyy")}`}
              </p>
            </div>
          )}

          {/* Recap Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Tanggal Katering</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Total Pesanan</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Total Item</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Lunas</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Belum Bayar</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Total Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="border border-gray-300 px-4 py-8 text-center">
                      <div className="animate-pulse">Memuat data...</div>
                    </td>
                  </tr>
                ) : recapData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-gray-300 px-4 py-8 text-center">
                      <div className="text-gray-500">
                        Tidak ada data yang sesuai dengan filter
                      </div>
                    </td>
                  </tr>
                ) : (
                  recapData.map((item) => (
                    <tr key={item.date} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-medium">
                        {format(new Date(item.date), "dd MMMM yyyy")}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {item.total_orders}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {item.total_items}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-green-600">
                        {item.paid_orders}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-yellow-600">
                        {item.pending_orders}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                        {formatPrice(item.total_amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Cards */}
          {recapData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {recapData.reduce((sum, item) => sum + item.total_orders, 0)}
                </div>
                <div className="text-sm text-blue-600">Total Pesanan</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {recapData.reduce((sum, item) => sum + item.paid_orders, 0)}
                </div>
                <div className="text-sm text-green-600">Pesanan Lunas</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatPrice(recapData.reduce((sum, item) => sum + item.total_amount, 0))}
                </div>
                <div className="text-sm text-purple-600">Total Pendapatan</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Orders */}
      {detailedOrders.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detail Pesanan</CardTitle>
              <PrintButton
                onPrint={handleDetailPrint}
                label="Print Detail Pesanan"
                showPrinterOptions={true}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Nama Siswa</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Kelas</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Tanggal Katering</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Detail Pesanan</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Status Bayar</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-medium">
                        {order.child_name}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {order.child_class}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {format(new Date(order.delivery_date), "dd/MM/yyyy")}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="space-y-1">
                          {order.order_items.map((item, index) => (
                            <div key={index} className="text-sm">
                              {item.quantity}x {item.menu_items?.name || 'Unknown Item'}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          getPaymentStatusColor(order.payment_status)
                        )}>
                          {getPaymentStatusLabel(order.payment_status)}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                        {formatPrice(order.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print Components */}
      {showRecapPrint && (
        <RecapPrint data={recapData} printerType={printType} />
      )}
      
      {showDetailPrint && (
        <DetailOrdersPrint data={detailedOrders} printerType={printType} />
      )}
    </div>
  );
};
