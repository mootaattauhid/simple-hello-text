import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice, formatDate, getStatusColor, getStatusText, getPaymentStatusColor, getPaymentStatusText } from '@/utils/orderUtils';
import { 
  Search, 
  CreditCard,
  User,
  Calendar,
  Package,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface OrderLineItem {
  id: string;
  child_name: string;
  child_class: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  delivery_date: string;
  menu_items: {
    name: string;
  } | null;
}

interface Order {
  id: string;
  order_number: string;
  child_name: string;
  child_class: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  user_id: string;
  order_line_items: OrderLineItem[];
  profiles: {
    full_name: string;
    phone: string;
  } | null;
}

const CashierPaymentV2 = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const searchOrders = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Error",
        description: "Masukkan nama orang tua untuk pencarian",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First get orders with pending payment status
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_line_items (
            id,
            child_name,
            child_class,
            quantity,
            unit_price,
            total_price,
            delivery_date,
            menu_items (
              name
            )
          )
        `)
        .not('user_id', 'is', null)
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setSearchResults([]);
        toast({
          title: "Tidak Ditemukan",
          description: "Tidak ada pesanan yang ditemukan",
        });
        return;
      }

      // Get user IDs from orders
      const userIds = [...new Set(ordersData.map(order => order.user_id))];

      // Get profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles by user ID
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Combine orders with profiles and filter by parent name
      const ordersWithProfiles = ordersData.map(order => ({
        ...order,
        profiles: profilesMap.get(order.user_id) || null
      }));

      // Filter by parent name
      const filteredOrders = ordersWithProfiles.filter(order => 
        order.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setSearchResults(filteredOrders);

      if (filteredOrders.length === 0) {
        toast({
          title: "Tidak Ditemukan",
          description: "Tidak ada pesanan yang ditemukan dengan nama tersebut",
        });
      }

    } catch (error) {
      console.error('Error searching orders:', error);
      toast({
        title: "Error",
        description: "Gagal mencari pesanan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setPaymentAmount(order.total_amount);
    setReceivedAmount(0);
    setPaymentNotes('');
    setShowDetailDialog(true);
  };

  const processPayment = async () => {
    if (!selectedOrder) return;

    if (receivedAmount < paymentAmount) {
      toast({
        title: "Error",
        description: "Jumlah uang yang diterima kurang dari total pembayaran",
        variant: "destructive",
      });
      return;
    }

    setProcessingPayment(true);
    try {
      // Create cash payment record
      const { error: paymentError } = await supabase
        .from('cash_payments')
        .insert({
          order_id: selectedOrder.id,
          amount: paymentAmount,
          received_amount: receivedAmount,
          change_amount: receivedAmount - paymentAmount,
          cashier_id: (await supabase.auth.getUser()).data.user?.id || '',
          notes: paymentNotes
        });

      if (paymentError) throw paymentError;

      // Update order payment status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          payment_method: 'cash'
        })
        .eq('id', selectedOrder.id);

      if (orderError) throw orderError;

      toast({
        title: "Berhasil",
        description: `Pembayaran berhasil diproses. Kembalian: ${formatPrice(receivedAmount - paymentAmount)}`,
      });

      setShowDetailDialog(false);
      setSelectedOrder(null);
      
      // Refresh search results
      searchOrders();

    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "Gagal memproses pembayaran",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const calculateChange = () => {
    return Math.max(0, receivedAmount - paymentAmount);
  };

  const groupOrderLineItemsByChild = (items: OrderLineItem[]) => {
    const grouped = items.reduce((acc: any, item) => {
      const key = `${item.child_name}_${item.child_class}`;
      if (!acc[key]) {
        acc[key] = {
          child_name: item.child_name,
          child_class: item.child_class,
          items: []
        };
      }
      acc[key].items.push(item);
      return acc;
    }, {});
    
    return Object.values(grouped);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
          Pembayaran Kasir V2
        </h1>
        <p className="text-gray-600">Cari dan proses pembayaran pesanan orang tua</p>
      </div>

      {/* Search Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Pencarian Pesanan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Masukkan nama orang tua..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && searchOrders()}
              />
            </div>
            <Button 
              onClick={searchOrders} 
              disabled={loading || !searchTerm.trim()}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Mencari...' : 'Cari'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Pencarian ({searchResults.length} pesanan)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Pesanan</TableHead>
                  <TableHead>Nama Orang Tua</TableHead>
                  <TableHead>No. Telepon</TableHead>
                  <TableHead>Total Bayar</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pembayaran</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.profiles?.full_name || 'Tidak Diketahui'}</TableCell>
                    <TableCell>{order.profiles?.phone || '-'}</TableCell>
                    <TableCell className="font-bold text-green-600">
                      {formatPrice(order.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPaymentStatusColor(order.payment_status)}>
                        {getPaymentStatusText(order.payment_status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(order)}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Bayar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payment Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Detail Pembayaran - {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Pelanggan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nama Orang Tua</p>
                      <p className="font-medium">{selectedOrder.profiles?.full_name || 'Tidak Diketahui'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">No. Telepon</p>
                      <p className="font-medium">{selectedOrder.profiles?.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nomor Pesanan</p>
                      <p className="font-medium">{selectedOrder.order_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tanggal Pesanan</p>
                      <p className="font-medium">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detail Pesanan</CardTitle>
                </CardHeader>
                <CardContent>
                  {groupOrderLineItemsByChild(selectedOrder.order_line_items).map((childGroup: any, index) => (
                    <div key={index} className="mb-6 last:mb-0">
                      <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{childGroup.child_name}</span>
                        <span className="text-sm text-gray-600">({childGroup.child_class})</span>
                      </div>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Menu</TableHead>
                            <TableHead>Tanggal Antar</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Harga</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {childGroup.items.map((item: OrderLineItem) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.menu_items?.name || 'Menu Tidak Diketahui'}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(item.delivery_date)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">{formatPrice(item.unit_price)}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatPrice(item.total_price)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Payment Processing */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Proses Pembayaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Total Pembayaran</label>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">
                            {formatPrice(paymentAmount)}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Uang Diterima</label>
                        <Input
                          type="number"
                          value={receivedAmount || ''}
                          onChange={(e) => setReceivedAmount(Number(e.target.value) || 0)}
                          placeholder="Masukkan jumlah uang"
                          className="text-lg"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Kembalian</label>
                        <div className={`p-3 rounded-lg ${calculateChange() >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                          <p className={`text-2xl font-bold ${calculateChange() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPrice(calculateChange())}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Catatan (Opsional)</label>
                      <Input
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="Catatan pembayaran..."
                      />
                    </div>

                    {receivedAmount < paymentAmount && receivedAmount > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Uang yang diterima kurang dari total pembayaran</span>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={processPayment}
                        disabled={processingPayment || receivedAmount < paymentAmount}
                        className="flex-1"
                      >
                        {processingPayment ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        {processingPayment ? 'Memproses...' : 'Proses Pembayaran'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => setShowDetailDialog(false)}
                        disabled={processingPayment}
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashierPaymentV2;
