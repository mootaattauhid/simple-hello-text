
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X, Download } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { formatDate } from '@/utils/orderUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RecapV2Data {
  id: string;
  child_name: string;
  child_class: string;
  menu_name: string;
  quantity: number;
  payment_status: string;
  delivery_date: string;
  created_at: string;
}

interface OrderRecapV2Props {
  onExportData?: (data: RecapV2Data[]) => void;
}

export const OrderRecapV2 = ({ onExportData }: OrderRecapV2Props) => {
  const [data, setData] = useState<RecapV2Data[]>([]);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  
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
      let query = supabase
        .from('orders')
        .select(`
          id,
          child_name,
          child_class,
          payment_status,
          delivery_date,
          created_at,
          order_items (
            quantity,
            menu_items (
              name
            )
          )
        `)
        .not('child_name', 'is', null)
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

      // Apply delivery date filters
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

      // Transform data to flat structure
      const flatData: RecapV2Data[] = [];
      ordersData?.forEach(order => {
        order.order_items.forEach(item => {
          flatData.push({
            id: `${order.id}-${Math.random()}`,
            child_name: order.child_name || '',
            child_class: order.child_class || '',
            menu_name: item.menu_items?.name || 'Unknown Item',
            quantity: item.quantity,
            payment_status: order.payment_status || 'pending',
            delivery_date: order.delivery_date,
            created_at: order.created_at
          });
        });
      });

      setData(flatData);
      
      // Call export callback if provided
      if (onExportData) {
        onExportData(flatData);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Rekapitulasi v2 - Detail Per Siswa (Berdasarkan Tanggal Katering)
        </CardTitle>
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
              Menampilkan {data.length} item
              {selectedClass !== 'all' && ` untuk kelas ${selectedClass}`}
              {selectedPaymentStatus !== 'all' && ` dengan status ${getPaymentStatusLabel(selectedPaymentStatus)}`}
              {startDate && ` dari tanggal katering ${format(startDate, "dd/MM/yyyy")}`}
              {endDate && ` sampai ${format(endDate, "dd/MM/yyyy")}`}
            </p>
          </div>
        )}

        {/* Data Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">No</TableHead>
                <TableHead>Nama Siswa</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Nama Menu</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead>Status Bayar</TableHead>
                <TableHead>Tanggal Katering</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="animate-pulse">Memuat data...</div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-gray-500">
                      Tidak ada data yang sesuai dengan filter
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.child_name}</TableCell>
                    <TableCell>{item.child_class}</TableCell>
                    <TableCell>{item.menu_name}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        getPaymentStatusColor(item.payment_status)
                      )}>
                        {getPaymentStatusLabel(item.payment_status)}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(item.delivery_date)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.length}</div>
              <div className="text-sm text-blue-600">Total Item</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {data.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
              <div className="text-sm text-green-600">Total Quantity</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(data.map(item => item.child_name)).size}
              </div>
              <div className="text-sm text-purple-600">Jumlah Siswa</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
