
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface OrderSummaryProps {
  totalPrice: number;
  formatPrice: (price: number) => string;
  onCheckout: () => void;
  loading: boolean;
  canCheckout: boolean;
}

const OrderSummary = ({ totalPrice, formatPrice, onCheckout, loading, canCheckout }: OrderSummaryProps) => {
  return (
    <div className="space-y-4">
      {/* Total */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Pembayaran:</span>
            <span className="text-orange-600">{formatPrice(totalPrice)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Button */}
      <Button
        onClick={onCheckout}
        disabled={loading || !canCheckout}
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        size="lg"
      >
        {loading ? 'Memproses...' : 'Buat Pesanan'}
      </Button>
    </div>
  );
};

export default OrderSummary;
