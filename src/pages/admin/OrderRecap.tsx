
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PrintButton } from '@/components/ui/print-button';
import { OrderRecapPrint } from '@/components/print/OrderRecapPrint';
import { OrderRecapV2 } from '@/components/admin/OrderRecapV2';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { formatPrice, formatDate } from '@/utils/orderUtils';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OrderRecapData {
  id: string;
  child_name: string;
  child_class: string;
  total_amount: number;
  created_at: string;
  delivery_date: string;
  order_items: {
    id: string;
    quantity: number;
    price: number;
    menu_items: {
      name: string;
    };
  }[];
}

const OrderRecap = () => {
  const [orders, setOrders] = useState<OrderRecapData[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderRecapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupedMenuItems, setGroupedMenuItems] = useState<{ name: string; quantity: number; totalPrice: number }[]>([]);
  const [ordersByDate, setOrdersByDate] = useState<Record<string, OrderRecapData[]>>({});
  const [ordersByClass, setOrdersByClass] = useState<Record<string, OrderRecapData[]>>({});
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [recapV2Data, setRecapV2Data] = useState<any[]>([]);

  const pagination = usePagination({
    data: filteredOrders,
    itemsPerPage: 10
  });

  useEffect(() => {
    fetchOrderRecap();
  }, []);

  useEffect(() => {
    applyDateFilter();
  }, [orders, startDate, endDate]);

  const applyDateFilter = () => {
    let filtered = [...orders];
    
    if (startDate) {
      filtered = filtered.filter(order => {
        if (!order.delivery_date) return false;
        const deliveryDate = new Date(order.delivery_date);
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        return deliveryDate >= startOfDay;
      });
    }
    
    if (endDate) {
      filtered = filtered.filter(order => {
        if (!order.delivery_date) return false;
        const deliveryDate = new Date(order.delivery_date);
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        return deliveryDate <= endOfDay;
      });
    }
    
    setFilteredOrders(filtered);
    processOrderData(filtered);
  };

  const clearDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const fetchOrderRecap = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          child_name,
          child_class,
          total_amount,
          created_at,
          delivery_date,
          order_items (
            id,
            quantity,
            price,
            menu_items (
              name
            )
          )
        `)
        .not('delivery_date', 'is', null)
        .order('delivery_date', { ascending: false });

      if (error) throw error;
      
      setOrders(data || []);
      processOrderData(data || []);
    } catch (error) {
      console.error('Error fetching order recap:', error);
      toast({
        title: "Error",
        description: "Gagal memuat rekap pesanan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processOrderData = (orderData: OrderRecapData[]) => {
    // Process grouped menu items
    const allMenuItems = orderData.flatMap(order => 
      order.order_items.map(item => ({
        name: item.menu_items.name,
        quantity: item.quantity,
        price: item.price
      }))
    );

    const grouped = allMenuItems.reduce((acc, item) => {
      const existing = acc.find(i => i.name === item.name);
      if (existing) {
        existing.quantity += item.quantity;
        existing.totalPrice += item.price * item.quantity;
      } else {
        acc.push({
          name: item.name,
          quantity: item.quantity,
          totalPrice: item.price * item.quantity
        });
      }
      return acc;
    }, [] as { name: string; quantity: number; totalPrice: number }[]);

    setGroupedMenuItems(grouped);

    // Process orders by delivery date
    const byDate = orderData.reduce((acc, order) => {
      const date = order.delivery_date ? formatDate(order.delivery_date) : 'Tanpa Tanggal';
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(order);
      return acc;
    }, {} as Record<string, OrderRecapData[]>);

    setOrdersByDate(byDate);

    // Process orders by class
    const byClass = orderData.reduce((acc, order) => {
      if (!acc[order.child_class]) {
        acc[order.child_class] = [];
      }
      acc[order.child_class].push(order);
      return acc;
    }, {} as Record<string, OrderRecapData[]>);

    setOrdersByClass(byClass);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatePrintHTML());
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const generatePrintHTML = () => {
    // Use filtered orders for print
    const dataToUse = filteredOrders.length > 0 ? filteredOrders : orders;
    
    // Combine all menu items without class separation
    const allMenuItems = dataToUse.flatMap(order => 
      order.order_items.map(item => ({
        name: item.menu_items.name,
        quantity: item.quantity,
        price: item.price
      }))
    );

    const groupedMenuItems = allMenuItems.reduce((acc, item) => {
      const existing = acc.find(i => i.name === item.name);
      if (existing) {
        existing.quantity += item.quantity;
        existing.totalPrice += item.price * item.quantity;
      } else {
        acc.push({
          name: item.name,
          quantity: item.quantity,
          totalPrice: item.price * item.quantity
        });
      }
      return acc;
    }, [] as { name: string; quantity: number; totalPrice: number }[]);

    const ordersByClass = dataToUse.reduce((acc, order) => {
      if (!acc[order.child_class]) {
        acc[order.child_class] = [];
      }
      acc[order.child_class].push(order);
      return acc;
    }, {} as Record<string, OrderRecapData[]>);

    const filterInfo = (startDate || endDate) ? 
      `<p style="color: #666;">Filter Tanggal Katering: ${startDate ? format(startDate, "dd/MM/yyyy") : 'Semua'} - ${endDate ? format(endDate, "dd/MM/yyyy") : 'Semua'}</p>` : 
      '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rekapitulasi Pesanan</title>
          <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            .print-content { padding: 20px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bg-gray-50 { background-color: #f9f9f9; }
            @media print {
              body { print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="print-content">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">REKAPITULASI PESANAN</h1>
              <p style="color: #666;">Tanggal: ${formatDate(new Date().toISOString())}</p>
              ${filterInfo}
            </div>

            <div style="margin-bottom: 30px;">
              <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">Rekapitulasi Menu (Gabungan Semua Kelas)</h2>
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Menu</th>
                    <th style="text-align: center;">Jumlah</th>
                    <th style="text-align: right;">Total Harga</th>
                  </tr>
                </thead>
                <tbody>
                  ${groupedMenuItems.map((item, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${item.name}</td>
                      <td style="text-align: center;">${item.quantity}</td>
                      <td style="text-align: right;">${formatPrice(item.totalPrice)}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr class="bg-gray-50" style="font-weight: bold;">
                    <td colspan="2" style="text-align: right;">Total:</td>
                    <td style="text-align: center;">${groupedMenuItems.reduce((sum, item) => sum + item.quantity, 0)}</td>
                    <td style="text-align: right;">${formatPrice(groupedMenuItems.reduce((sum, item) => sum + item.totalPrice, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div>
              <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">Rekapitulasi Menu per Kelas</h2>
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Kelas</th>
                    <th>Nama Menu</th>
                    <th style="text-align: center;">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(ordersByClass).flatMap(([className, classOrders], classIndex) => {
                    const classMenuItems = classOrders.flatMap(order => 
                      order.order_items.map(item => ({
                        name: item.menu_items.name,
                        quantity: item.quantity
                      }))
                    );

                    const groupedClassItems = classMenuItems.reduce((acc, item) => {
                      const existing = acc.find(i => i.name === item.name);
                      if (existing) {
                        existing.quantity += item.quantity;
                      } else {
                        acc.push({ name: item.name, quantity: item.quantity });
                      }
                      return acc;
                    }, [] as { name: string; quantity: number }[]);

                    return groupedClassItems.map((item, itemIndex) => `
                      <tr>
                        <td>${Object.keys(ordersByClass).slice(0, classIndex).reduce((sum, key) => {
                          const prevClassItems = ordersByClass[key].flatMap(order => 
                            order.order_items.map(item => item.menu_items.name)
                          );
                          const uniquePrevItems = [...new Set(prevClassItems)];
                          return sum + uniquePrevItems.length;
                        }, 0) + itemIndex + 1}</td>
                        <td>${className}</td>
                        <td>${item.name}</td>
                        <td style="text-align: center;">${item.quantity}</td>
                      </tr>
                    `).join('');
                  }).join('')}
                </tbody>
              </table>
            </div>

            <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
              <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleRecapV2Export = (data: any[]) => {
    setRecapV2Data(data);
  };

  const generateRecapV2PrintHTML = () => {
    if (recapV2Data.length === 0) return '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rekapitulasi Pesanan v2</title>
          <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            .print-content { padding: 20px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bg-gray-50 { background-color: #f9f9f9; }
            @media print {
              body { print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="print-content">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">REKAPITULASI PESANAN v2</h1>
              <p style="color: #666;">Detail Per Siswa</p>
              <p style="color: #666;">Tanggal: ${formatDate(new Date().toISOString())}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Siswa</th>
                  <th>Kelas</th>
                  <th>Nama Menu</th>
                  <th style="text-align: center;">Quantity</th>
                  <th>Status Bayar</th>
                  <th>Tanggal Katering</th>
                </tr>
              </thead>
              <tbody>
                ${recapV2Data.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.child_name}</td>
                    <td>${item.child_class}</td>
                    <td>${item.menu_name}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td>${item.payment_status === 'paid' ? 'Lunas' : item.payment_status === 'pending' ? 'Belum Bayar' : item.payment_status}</td>
                    <td>${item.delivery_date ? formatDate(item.delivery_date) : 'Tidak ada'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div style="margin-top: 30px;">
              <h3>Ringkasan:</h3>
              <p>Total Item: ${recapV2Data.length}</p>
              <p>Total Quantity: ${recapV2Data.reduce((sum, item) => sum + item.quantity, 0)}</p>
              <p>Jumlah Siswa: ${new Set(recapV2Data.map(item => item.child_name)).size}</p>
            </div>

            <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
              <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleRecapV2Print = () => {
    const printHTML = generateRecapV2PrintHTML();
    if (!printHTML) {
      toast({
        title: "Error",
        description: "Tidak ada data untuk dicetak",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHTML);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
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
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Rekap Pesanan
          </h1>
          <p className="text-gray-600">Ringkasan pesanan berdasarkan tanggal katering</p>
        </div>
        <div className="flex gap-4 items-center">
          <PrintButton onPrint={handlePrint} />
        </div>
      </div>

      <Tabs defaultValue="recap-v1" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recap-v1" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Rekapitulasi v1 (Ringkasan)
          </TabsTrigger>
          <TabsTrigger value="recap-v2" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Rekapitulasi v2 (Detail Per Siswa)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recap-v1" className="space-y-6">
          {/* Date Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Tanggal Katering
              </CardTitle>
              <CardDescription>
                Filter berdasarkan tanggal pengantaran katering
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Tanggal Katering Mulai</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
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
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Tanggal Katering Akhir</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
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
                
                {(startDate || endDate) && (
                  <Button
                    variant="outline"
                    onClick={clearDateFilter}
                    className="flex items-center gap-2 mt-6"
                  >
                    <X className="h-4 w-4" />
                    Hapus Filter
                  </Button>
                )}
              </div>
              
              {(startDate || endDate) && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Menampilkan {filteredOrders.length} pesanan dengan tanggal katering
                    {startDate && ` dari ${format(startDate, "dd/MM/yyyy")}`}
                    {endDate && ` sampai ${format(endDate, "dd/MM/yyyy")}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rekapitulasi Menu (Gabungan) */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Rekapitulasi Menu (Gabungan Semua Kelas)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">No</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Nama Menu</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Jumlah</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Total Harga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedMenuItems.map((item, index) => (
                      <tr key={item.name}>
                        <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                        <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{formatPrice(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td className="border border-gray-300 px-4 py-2" colSpan={2}>Total:</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {groupedMenuItems.reduce((sum, item) => sum + item.quantity, 0)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {formatPrice(groupedMenuItems.reduce((sum, item) => sum + item.totalPrice, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Rekapitulasi per Tanggal Katering */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Rekapitulasi per Tanggal Katering</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(ordersByDate).map(([date, dateOrders]) => {
                  const dateMenuItems = dateOrders.flatMap(order => 
                    order.order_items.map(item => ({
                      name: item.menu_items.name,
                      quantity: item.quantity,
                      price: item.price
                    }))
                  );

                  const groupedDateItems = dateMenuItems.reduce((acc, item) => {
                    const existing = acc.find(i => i.name === item.name);
                    if (existing) {
                      existing.quantity += item.quantity;
                      existing.totalPrice += item.price * item.quantity;
                    } else {
                      acc.push({
                        name: item.name,
                        quantity: item.quantity,
                        totalPrice: item.price * item.quantity
                      });
                    }
                    return acc;
                  }, [] as { name: string; quantity: number; totalPrice: number }[]);

                  return (
                    <div key={date} className="border rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-3">Tanggal Katering: {date}</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left">Nama Menu</th>
                              <th className="border border-gray-300 px-4 py-2 text-center">Jumlah</th>
                              <th className="border border-gray-300 px-4 py-2 text-right">Total Harga</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedDateItems.map((item) => (
                              <tr key={item.name}>
                                <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                                <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                                <td className="border border-gray-300 px-4 py-2 text-right">{formatPrice(item.totalPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-100 font-bold">
                              <td className="border border-gray-300 px-4 py-2">Total:</td>
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                {groupedDateItems.reduce((sum, item) => sum + item.quantity, 0)}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-right">
                                {formatPrice(groupedDateItems.reduce((sum, item) => sum + item.totalPrice, 0))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Rekapitulasi per Kelas */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Rekapitulasi per Kelas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(ordersByClass).map(([className, classOrders]) => {
                  const classMenuItems = classOrders.flatMap(order => 
                    order.order_items.map(item => ({
                      name: item.menu_items.name,
                      quantity: item.quantity,
                      price: item.price
                    }))
                  );

                  const groupedClassItems = classMenuItems.reduce((acc, item) => {
                    const existing = acc.find(i => i.name === item.name);
                    if (existing) {
                      existing.quantity += item.quantity;
                      existing.totalPrice += item.price * item.quantity;
                    } else {
                      acc.push({
                        name: item.name,
                        quantity: item.quantity,
                        totalPrice: item.price * item.quantity
                      });
                    }
                    return acc;
                  }, [] as { name: string; quantity: number; totalPrice: number }[]);

                  return (
                    <div key={className} className="border rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-3">Kelas {className}</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left">Nama Menu</th>
                              <th className="border border-gray-300 px-4 py-2 text-center">Jumlah</th>
                              <th className="border border-gray-300 px-4 py-2 text-right">Total Harga</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedClassItems.map((item) => (
                              <tr key={item.name}>
                                <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                                <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                                <td className="border border-gray-300 px-4 py-2 text-right">{formatPrice(item.totalPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-100 font-bold">
                              <td className="border border-gray-300 px-4 py-2">Total:</td>
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                {groupedClassItems.reduce((sum, item) => sum + item.quantity, 0)}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-right">
                                {formatPrice(groupedClassItems.reduce((sum, item) => sum + item.totalPrice, 0))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detail Pesanan Individual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pagination.paginatedData.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <CardTitle>{order.child_name}</CardTitle>
                      <CardDescription>
                        Kelas {order.child_class} • Katering: {order.delivery_date ? formatDate(order.delivery_date) : 'Belum dijadwalkan'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span>{item.menu_items.name} x{item.quantity}</span>
                            <span>{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 font-bold">
                          Total: {formatPrice(order.total_amount)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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

          {orders.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <h3 className="text-lg font-medium mb-2">Belum Ada Pesanan</h3>
                <p className="text-gray-600">Belum ada pesanan yang masuk</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recap-v2" className="space-y-6">
          <div className="flex justify-end">
            <Button
              onClick={handleRecapV2Print}
              variant="outline"
              className="flex items-center gap-2"
              disabled={recapV2Data.length === 0}
            >
              <CalendarIcon className="h-4 w-4" />
              Print Rekapitulasi v2
            </Button>
          </div>
          
          <OrderRecapV2 onExportData={handleRecapV2Export} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderRecap;
