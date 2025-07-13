
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { Order } from '@/types/order';
import { useBatchPayment } from '@/hooks/useBatchPayment';

interface BatchPaymentButtonProps {
  selectedOrders: Order[];
  onSuccess?: () => void;
  disabled?: boolean;
}

export const BatchPaymentButton = ({ selectedOrders, onSuccess, disabled }: BatchPaymentButtonProps) => {
  const { loading, processBatchPayment } = useBatchPayment();

  const pendingOrders = selectedOrders.filter(order => order.payment_status === 'pending');
  const totalAmount = pendingOrders.reduce((sum, order) => sum + order.total_amount, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (pendingOrders.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-orange-800">Pembayaran Batch</h3>
          <p className="text-sm text-orange-600">
            {pendingOrders.length} pesanan akan digabung menjadi satu invoice
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Sistem akan membuat satu transaksi Midtrans untuk semua pesanan terpilih
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Pembayaran:</p>
          <p className="text-lg font-bold text-orange-600">
            {formatPrice(totalAmount)}
          </p>
        </div>
      </div>
      
      <Button
        onClick={() => processBatchPayment(pendingOrders, onSuccess)}
        disabled={loading || disabled}
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Memproses Batch Payment...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Bayar Batch ({pendingOrders.length} pesanan)
          </>
        )}
      </Button>
    </div>
  );
};
