
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Order } from '@/types/order';
import { OrderCard } from './OrderCard';

interface OrderFiltersProps {
  orders: Order[];
  onRetryPayment: (order: Order) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const OrderFilters = ({ orders, onRetryPayment, activeTab, onTabChange }: OrderFiltersProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-4 md:mb-6 h-8 md:h-10">
        <TabsTrigger value="all" className="text-xs md:text-sm px-1 md:px-3">Semua</TabsTrigger>
        <TabsTrigger value="pending" className="text-xs md:text-sm px-1 md:px-3">Tunggu</TabsTrigger>
        <TabsTrigger value="confirmed" className="text-xs md:text-sm px-1 md:px-3">Konfirm</TabsTrigger>
        <TabsTrigger value="preparing" className="text-xs md:text-sm px-1 md:px-3">Siap</TabsTrigger>
        <TabsTrigger value="delivered" className="text-xs md:text-sm px-1 md:px-3">Selesai</TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onRetryPayment={onRetryPayment} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
};
