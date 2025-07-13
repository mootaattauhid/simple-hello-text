
import React from 'react';
import { formatPrice, formatDate } from '@/utils/orderUtils';

interface OrderRecapData {
  id: string;
  child_name: string;
  child_class: string;
  total_amount: number;
  created_at: string;
  order_items: {
    id: string;
    quantity: number;
    price: number;
    menu_items: {
      name: string;
    };
  }[];
}

interface OrderRecapPrintProps {
  orders: OrderRecapData[];
}

export const OrderRecapPrint: React.FC<OrderRecapPrintProps> = ({ orders }) => {
  // Combine all menu items without class separation
  const allMenuItems = orders.flatMap(order => 
    order.order_items.map(item => ({
      name: item.menu_items.name,
      quantity: item.quantity,
      price: item.price
    }))
  );

  // Group by menu name and sum quantities
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

  // Group by class
  const ordersByClass = orders.reduce((acc, order) => {
    if (!acc[order.child_class]) {
      acc[order.child_class] = [];
    }
    acc[order.child_class].push(order);
    return acc;
  }, {} as Record<string, OrderRecapData[]>);

  return (
    <div className="print-content bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">REKAPITULASI PESANAN</h1>
        <p className="text-gray-600">Tanggal: {formatDate(new Date().toISOString())}</p>
      </div>

      {/* Table 1: All Menu Items Combined */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Rekapitulasi Menu (Gabungan Semua Kelas)</h2>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">No</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Nama Menu</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Jumlah</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Total Harga</th>
            </tr>
          </thead>
          <tbody>
            {groupedMenuItems.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">{formatPrice(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-bold">
              <td colSpan={2} className="border border-gray-300 px-4 py-2 text-right">Total:</td>
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

      {/* Table 2: Menu by Class */}
      <div>
        <h2 className="text-xl font-bold mb-4">Rekapitulasi Menu per Kelas</h2>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">No</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Kelas</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Nama Menu</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(ordersByClass).flatMap(([className, classOrders], classIndex) => {
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

              return groupedClassItems.map((item, itemIndex) => (
                <tr key={`${classIndex}-${itemIndex}`}>
                  <td className="border border-gray-300 px-4 py-2">
                    {Object.keys(ordersByClass).slice(0, classIndex).reduce((sum, key) => {
                      const prevClassItems = ordersByClass[key].flatMap(order => 
                        order.order_items.map(item => item.menu_items.name)
                      );
                      const uniquePrevItems = [...new Set(prevClassItems)];
                      return sum + uniquePrevItems.length;
                    }, 0) + itemIndex + 1}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{className}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>
    </div>
  );
};
