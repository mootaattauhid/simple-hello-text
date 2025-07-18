
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
import { PrintButton } from '@/components/ui/print-button';
import { CashPaymentReceipt } from './CashPaymentReceipt';

interface Order {
  id: string;
  child_name: string;
  child_class: string;
  total_amount: number;
  payment_status: string;
  delivery_date: string;
  created_at: string;
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
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const receivedAmountNumber = parseFloat(receivedAmount) || 0;
  const changeAmount = receivedAmountNumber - order.total_amount;
  const isValidPayment = receivedAmountNumber >= order.total_amount;

  const { handlePrint } = CashPaymentReceipt({ 
    order, 
    receivedAmount: receivedAmountNumber, 
    changeAmount: Math.max(0, changeAmount) 
  });

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

      console.log('CashPayment: Processing payment for order:', order.id);

      // Update order payment status and status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          status: 'confirmed',
          payment_method: 'cash'
        })
        .eq('id', order.id);

      if (orderError) {
        console.error('CashPayment: Error updating order:', orderError);
        throw orderError;
      }

      console.log('CashPayment: Order updated successfully');

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

      if (paymentError) {
        console.error('CashPayment: Error recording payment:', paymentError);
        throw paymentError;
      }

      console.log('CashPayment: Payment recorded successfully');

      // Record cash payment details in cash_payments table
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error: cashPaymentError } = await supabase
          .from('cash_payments')
          .insert({
            order_id: order.id,
            amount: order.total_amount,
            received_amount: receivedAmountNumber,
            change_amount: Math.max(0, changeAmount),
            cashier_id: user.id,
            notes: notes || null
          });

        if (cashPaymentError) {
          console.error('CashPayment: Error recording cash payment details:', cashPaymentError);
          // Don't throw error here as the main payment is already completed
        } else {
          console.log('CashPayment: Cash payment details recorded successfully');
        }
      }

      setPaymentCompleted(true);

      toast({
        title: "Pembayaran Berhasil",
        description: `Pembayaran tunai telah diproses. Kembalian: ${formatPrice(Math.max(0, changeAmount))}`,
      });

      // Don't call onPaymentComplete immediately to allow printing
    } catch (error) {
      console.error('CashPayment: Error processing payment:', error);
      toast({
        title: "Error",
        description: "Gagal memproses pembayaran",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = (printerType?: string) => {
    if (paymentCompleted) {
      const receiptHandler = CashPaymentReceipt({ 
        order, 
        receivedAmount: receivedAmountNumber, 
        changeAmount: Math.max(0, changeAmount),
        printerType 
      });
      receiptHandler.handlePrint();
    }
  };

  const handleFinish = () => {
    onPaymentComplete();
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

        {!paymentCompleted ? (
          <>
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
                  step="1000"
                />
              </div>

              {receivedAmount && receivedAmountNumber > 0 && (
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
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-green-800">Pembayaran Berhasil!</span>
                <Badge className="bg-green-100 text-green-800">Lunas</Badge>
              </div>
              <div className="text-sm text-green-700">
                <div className="flex justify-between">
                  <span>Uang Diterima:</span>
                  <span>{formatPrice(receivedAmountNumber)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kembalian:</span>
                  <span>{formatPrice(Math.max(0, changeAmount))}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <PrintButton
                onPrint={handlePrintReceipt}
                label="Cetak Kwitansi"
                showPrinterOptions={true}
                className="w-full"
              />
              
              <Button
                onClick={handleFinish}
                variant="outline"
                className="w-full"
              >
                Selesai
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
