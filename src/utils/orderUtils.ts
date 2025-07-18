
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'preparing':
      return 'bg-orange-100 text-orange-800';
    case 'ready':
      return 'bg-green-100 text-green-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'refunded':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Menunggu';
    case 'confirmed':
      return 'Dikonfirmasi';
    case 'preparing':
      return 'Disiapkan';
    case 'ready':
      return 'Siap';
    case 'delivered':
      return 'Terkirim';
    case 'cancelled':
      return 'Dibatalkan';
    default:
      return status;
  }
};

export const getPaymentStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Belum Bayar';
    case 'paid':
      return 'Lunas';
    case 'failed':
      return 'Gagal';
    case 'refunded':
      return 'Dikembalikan';
    default:
      return status;
  }
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const filterOrdersByStatus = (orders: any[], status: string) => {
  if (status === 'all') return orders;
  return orders.filter(order => order.status === status);
};

export const isOrderExpired = (deliveryDate: string | null): boolean => {
  if (!deliveryDate) return false;
  
  const delivery = new Date(deliveryDate);
  const today = new Date();
  
  // Set time to start of day for accurate comparison
  delivery.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  return delivery < today;
};

export const canPayOrder = (order: { payment_status: string; delivery_date: string | null }): boolean => {
  // Can't pay if already paid
  if (order.payment_status === 'paid') return false;
  
  // Can't pay if order is expired (delivery date has passed)
  if (isOrderExpired(order.delivery_date)) return false;
  
  return true;
};
