
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice, formatDate } from '@/utils/orderUtils';
import { 
  Calendar as CalendarIcon, 
  Download,
  RefreshCw,
  FileText,
  Users,
  ChefHat
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MenuRecap {
  menu_name: string;
  total_quantity: number;
  total_amount: number;
}

interface StudentRecap {
  child_class: string;
  child_name: string;
  menu_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  delivery_date: string;
}

const OrderRecapV2 = () => {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [menuRecap, setMenuRecap] = useState<MenuRecap[]>([]);
  const [studentRecap, setStudentRecap] = useState<StudentRecap[]>([]);

  const fetchRecapData = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Pilih tanggal mulai dan akhir terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Format dates for SQL query
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // Fetch menu recap data
      const { data: menuData, error: menuError } = await supabase
        .from('order_line_items')
        .select(`
          quantity,
          unit_price,
          total_price,
          menu_items (
            name
          )
        `)
        .gte('delivery_date', startDateStr)
        .lte('delivery_date', endDateStr);

      if (menuError) throw menuError;

      // Process menu recap data
      const menuRecapMap = new Map<string, { quantity: number; amount: number }>();
      
      menuData?.forEach(item => {
        const menuName = item.menu_items?.name || 'Menu Tidak Diketahui';
        const existing = menuRecapMap.get(menuName) || { quantity: 0, amount: 0 };
        menuRecapMap.set(menuName, {
          quantity: existing.quantity + item.quantity,
          amount: existing.amount + (item.total_price || item.unit_price * item.quantity)
        });
      });

      const processedMenuRecap = Array.from(menuRecapMap.entries()).map(([name, data]) => ({
        menu_name: name,
        total_quantity: data.quantity,
        total_amount: data.amount
      }));

      setMenuRecap(processedMenuRecap);

      // Fetch student recap data
      const { data: studentData, error: studentError } = await supabase
        .from('order_line_items')
        .select(`
          child_class,
          child_name,
          quantity,
          unit_price,
          total_price,
          delivery_date,
          menu_items (
            name
          )
        `)
        .gte('delivery_date', startDateStr)
        .lte('delivery_date', endDateStr)
        .order('child_class', { ascending: true })
        .order('child_name', { ascending: true });

      if (studentError) throw studentError;

      const processedStudentRecap = studentData?.map(item => ({
        child_class: item.child_class || '',
        child_name: item.child_name,
        menu_name: item.menu_items?.name || 'Menu Tidak Diketahui',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price || item.unit_price * item.quantity,
        delivery_date: item.delivery_date
      })) || [];

      setStudentRecap(processedStudentRecap);

      toast({
        title: "Berhasil",
        description: "Data rekap berhasil dimuat",
      });

    } catch (error) {
      console.error('Error fetching recap data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data rekap",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportMenuRecapToCSV = () => {
    if (menuRecap.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive",
      });
      return;
    }

    const csvData = menuRecap.map(item => ({
      'Nama Menu': item.menu_name,
      'Total Jumlah': item.total_quantity,
      'Total Nilai': item.total_amount
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-menu-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportStudentRecapToCSV = () => {
    if (studentRecap.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive",
      });
      return;
    }

    const csvData = studentRecap.map(item => ({
      'Kelas': item.child_class,
      'Nama Anak': item.child_name,
      'Menu Katering': item.menu_name,
      'Jumlah': item.quantity,
      'Harga Satuan': item.unit_price,
      'Total Harga': item.total_price,
      'Tanggal Pengantaran': formatDate(item.delivery_date)
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-siswa-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
              Rekap Pesanan V2
            </h1>
            <p className="text-gray-600">Rekap data berdasarkan filter tanggal pengantaran</p>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Filter Tanggal Pengantaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={fetchRecapData} 
                disabled={loading || !startDate || !endDate}
                className="w-full"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Memuat...' : 'Buat Rekap'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recap Data Tabs */}
      <Tabs defaultValue="menu" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Rekap Menu
          </TabsTrigger>
          <TabsTrigger value="student" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Rekap Siswa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="menu">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rekap Menu Katering</CardTitle>
                <Button 
                  onClick={exportMenuRecapToCSV} 
                  variant="outline" 
                  size="sm"
                  disabled={menuRecap.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {menuRecap.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Menu Katering</TableHead>
                      <TableHead className="text-right">Total Jumlah</TableHead>
                      <TableHead className="text-right">Total Nilai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menuRecap.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.menu_name}</TableCell>
                        <TableCell className="text-right">{item.total_quantity}</TableCell>
                        <TableCell className="text-right">{formatPrice(item.total_amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Pilih tanggal dan klik "Buat Rekap" untuk melihat data
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="student">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rekap Detail Siswa</CardTitle>
                <Button 
                  onClick={exportStudentRecapToCSV} 
                  variant="outline" 
                  size="sm"
                  disabled={studentRecap.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {studentRecap.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Nama Anak</TableHead>
                      <TableHead>Menu Katering</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead className="text-right">Harga Satuan</TableHead>
                      <TableHead className="text-right">Total Harga</TableHead>
                      <TableHead>Tanggal Antar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentRecap.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.child_class}</TableCell>
                        <TableCell className="font-medium">{item.child_name}</TableCell>
                        <TableCell>{item.menu_name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatPrice(item.unit_price)}</TableCell>
                        <TableCell className="text-right">{formatPrice(item.total_price)}</TableCell>
                        <TableCell>{formatDate(item.delivery_date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Pilih tanggal dan klik "Buat Rekap" untuk melihat data
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderRecapV2;
