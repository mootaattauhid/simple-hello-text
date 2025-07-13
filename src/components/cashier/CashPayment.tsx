
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/utils/orderUtils';
import { Calculator, CreditCard } from 'lucide-react';

interface Order {
  id: string;
  child_name: string;
  child_class: string;
  total_amount: number;
  payment_status: string;
  order_items: {
    quantity: number;
    price: number;
    menu_items: {
      name: string;
    } | null;
  }[];
}

interface CashPaymentProps {
  order: Order;
  onPaymentComplete: () => void;
}

export const CashPayment: React.FC<CashPaymentProps> = ({ order, onPaymentComplete }) => {
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const changeAmount = parseFloat(receivedAmount) - order.total_amount;
  const isValidPayment = parseFloat(receivedAmount) >= order.total_amount;

  const handlePayment = async () => {
    if (!isValidPayment) {
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
        .eq('id', order.id);

      if (orderError) throw orderError;

      // Record cash payment in payments table
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          amount: order.total_amount,
          payment_method: 'cash',
          status: 'completed',
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Pembayaran Tunai
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Nama Anak:</p>
            <p className="font-medium">{order.child_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Kelas:</p>
            <p className="font-medium">{order.child_class}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">Item Pesanan:</p>
          <div className="space-y-1">
            {order.order_items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.menu_items?.name || 'Unknown Item'}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total:</span>
            <span>{formatPrice(order.total_amount)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Jumlah Uang Diterima
            </label>
            <Input
              type="number"
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(e.target.value)}
              placeholder="Masukkan jumlah uang"
              min={order.total_amount}
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
        </div>
      </CardContent>
    </Card>
  );
};
