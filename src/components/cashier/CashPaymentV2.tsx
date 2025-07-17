
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/utils/orderUtils';
import { Calculator, CreditCard, Search, User } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Student {
  id: string;
  nik: string;
  nis: string | null;
  name: string;
  class_name: string | null;
}

interface Order {
  id: string;
  child_name: string;
  child_class: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  order_items: {
    quantity: number;
    price: number;
    menu_items: {
      name: string;
    } | null;
  }[];
}

interface CashPaymentV2Props {
  onPaymentComplete: () => void;
  onBack: () => void;
}

export const CashPaymentV2: React.FC<CashPaymentV2Props> = ({ onPaymentComplete, onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const fetchStudents = async (search: string) => {
    if (search.length < 2) {
      setStudents([]);
      return;
    }

    setLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, nik, nis, name, class_name')
        .or(`name.ilike.%${search}%,nik.ilike.%${search}%,nis.ilike.%${search}%`)
        .limit(10);

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive",
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchOrdersForStudent = async (student: Student) => {
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
        .eq('child_name', student.name)
        .eq('payment_status', 'pending')
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
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm) {
        fetchStudents(searchTerm);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setSearchTerm(`${student.name} - ${student.nik}`);
    setIsSearchOpen(false);
    fetchOrdersForStudent(student);
    setSelectedOrder(null);
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
  };

  const changeAmount = selectedOrder ? parseFloat(receivedAmount) - selectedOrder.total_amount : 0;
  const isValidPayment = selectedOrder && parseFloat(receivedAmount) >= selectedOrder.total_amount;

  const handlePayment = async () => {
    if (!selectedOrder || !isValidPayment) {
      toast({
        title: "Error",
        description: "Jumlah uang yang diterima kurang dari total pembayaran",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Generate transaction ID for cash payment
      const transactionId = `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Update order payment status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          status: 'confirmed'
        })
        .eq('id', selectedOrder.id);

      if (orderError) throw orderError;

      // Record cash payment in payments table - using 'success' instead of 'completed'
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: selectedOrder.id,
          amount: selectedOrder.total_amount,
          payment_method: 'cash',
          status: 'success',
          transaction_id: transactionId
        });

      if (paymentError) throw paymentError;

      toast({
        title: "Pembayaran Berhasil",
        description: "Pembayaran tunai telah diproses",
      });

      onPaymentComplete();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "Gagal memproses pembayaran",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pembayaran Tunai V2</h2>
        <Button onClick={onBack} variant="outline">
          ← Kembali
        </Button>
      </div>

      {/* Student Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Cari Siswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan nama, NIK, atau NIS..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  className="pl-10"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-0" side="bottom" align="start">
              <Command>
                <CommandList>
                  {loadingStudents ? (
                    <CommandEmpty>Mencari...</CommandEmpty>
                  ) : students.length === 0 ? (
                    <CommandEmpty>Tidak ada siswa ditemukan</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {students.map((student) => (
                        <CommandItem
                          key={student.id}
                          onSelect={() => handleStudentSelect(student)}
                          className="cursor-pointer"
                        >
                          <User className="h-4 w-4 mr-2" />
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-gray-500">
                              NIK: {student.nik} | NIS: {student.nis || 'N/A'} | Kelas: {student.class_name || 'N/A'}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {selectedStudent && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900">Siswa Terpilih:</h3>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div><strong>Nama:</strong> {selectedStudent.name}</div>
                <div><strong>Kelas:</strong> {selectedStudent.class_name || 'N/A'}</div>
                <div><strong>NIK:</strong> {selectedStudent.nik}</div>
                <div><strong>NIS:</strong> {selectedStudent.nis || 'N/A'}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders List */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle>Pesanan Belum Bayar</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Tidak ada pesanan yang belum dibayar untuk siswa ini
              </p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleOrderSelect(order)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedOrder?.id === order.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">
                          {order.order_items.map((item, index) => (
                            <span key={index}>
                              {item.quantity}x {item.menu_items?.name}
                              {index < order.order_items.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                        <div className="text-sm text-gray-500">
                          Tanggal: {new Date(order.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {formatPrice(order.total_amount)}
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Belum Bayar
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Section */}
      {selectedOrder && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Proses Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Pembayaran:</span>
                <span>{formatPrice(selectedOrder.total_amount)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Jumlah Uang Diterima
              </label>
              <Input
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder="Masukkan jumlah uang"
                min={selectedOrder.total_amount}
                step="0.01"
              />
            </div>

            {receivedAmount && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Kembalian:</span>
                  <span className={`text-lg font-bold ${changeAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPrice(Math.max(0, changeAmount))}
                  </span>
                </div>
                {changeAmount < 0 && (
                  <p className="text-red-600 text-sm mt-1">
                    Kurang: {formatPrice(Math.abs(changeAmount))}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Catatan (Opsional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan..."
                rows={2}
              />
            </div>

            <Button
              onClick={handlePayment}
              disabled={!isValidPayment || loading}
              className="w-full"
              size="lg"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {loading ? 'Memproses...' : 'Proses Pembayaran'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
