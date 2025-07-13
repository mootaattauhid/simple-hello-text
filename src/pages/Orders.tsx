
import React, { useState, useMemo } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Calendar, User, CreditCard, AlertCircle } from 'lucide-react';
import { OrderFilters } from '@/components/orders/OrderFilters';
import { OrderCard } from '@/components/orders/OrderCard';
import { EmptyOrdersState } from '@/components/orders/EmptyOrdersState';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { usePagination } from '@/hooks/usePagination';
import { Order } from '@/types/order';
import { Navbar } from '@/components/Navbar';

const Orders = () => {
  const { user } = useAuth();
  const { orders, loading, retryPayment, fetchOrders } = useOrders();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Filter orders based on selected filters
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const statusMatch = statusFilter === 'all' || order.status === statusFilter;
      const paymentMatch = paymentFilter === 'all' || order.payment_status === paymentFilter;
      return statusMatch && paymentMatch;
    });
  }, [orders, statusFilter, paymentFilter]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedOrders,
    goToPage,
    canGoNext,
    canGoPrev,
    startIndex,
    endIndex,
    totalItems
  } = usePagination({
    data: filteredOrders,
    itemsPerPage: 10
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Riwayat Pesanan
          </h1>
          <p className="text-gray-600">
            Lihat dan kelola semua pesanan makanan Anda
          </p>
        </div>

        {orders.length === 0 ? (
          <EmptyOrdersState />
        ) : (
          <>
            <div className="mb-6">
              <OrderFilters
                statusFilter={statusFilter}
                paymentFilter={paymentFilter}
                onStatusFilterChange={setStatusFilter}
                onPaymentFilterChange={setPaymentFilter}
                totalOrders={orders.length}
                filteredCount={filteredOrders.length}
              />
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {paginatedOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onRetryPayment={retryPayment}
                />
              ))}
            </div>

            {/* Pagination */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              canGoNext={canGoNext}
              canGoPrev={canGoPrev}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={totalItems}
              itemLabel="pesanan"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;
