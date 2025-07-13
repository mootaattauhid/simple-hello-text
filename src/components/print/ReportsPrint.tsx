
import React from 'react';
import { formatPrice, formatDate } from '@/utils/orderUtils';

interface ReportData {
  id: string;
  child_name: string;
  child_class: string;
  total_amount: number;
  created_at: string;
  delivery_date: string;
  payment_status: string;
}

interface ReportsPrintProps {
  orders: ReportData[];
  totalRevenue: number;
}

export const ReportsPrint: React.FC<ReportsPrintProps> = ({ orders, totalRevenue }) => {
  const paidOrders = orders.filter(order => order.payment_status === 'paid');
  
  return (
    <div className="print-content bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">LAPORAN PENJUALAN</h1>
        <p className="text-gray-600">Periode: {formatDate(new Date().toISOString())}</p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="border border-gray-300 p-4 text-center">
          <h3 className="font-bold text-lg mb-2">Total Pesanan</h3>
          <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
        </div>
        <div className="border border-gray-300 p-4 text-center">
          <h3 className="font-bold text-lg mb-2">Total Pendapatan</h3>
          <p className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="border border-gray-300 p-4 text-center">
          <h3 className="font-bold text-lg mb-2">Pesanan Lunas</h3>
          <p className="text-2xl font-bold text-purple-600">{paidOrders.length}</p>
        </div>
      </div>

      {/* Detailed Orders Table */}
      <div>
        <h2 className="text-xl font-bold mb-4">Detail Pesanan</h2>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left">No</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Nama Anak</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Kelas</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Tanggal</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Total</th>
              <th className="border border-gray-300 px-3 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={order.id}>
                <td className="border border-gray-300 px-3 py-2">{index + 1}</td>
                <td className="border border-gray-300 px-3 py-2">{order.child_name}</td>
                <td className="border border-gray-300 px-3 py-2">{order.child_class}</td>
                <td className="border border-gray-300 px-3 py-2">{formatDate(order.created_at)}</td>
                <td className="border border-gray-300 px-3 py-2 text-right">{formatPrice(order.total_amount)}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${
                    order.payment_status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : order.payment_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {order.payment_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-bold">
              <td colSpan={4} className="border border-gray-300 px-3 py-2 text-right">
                Total Keseluruhan:
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right">
                {formatPrice(orders.reduce((sum, order) => sum + order.total_amount, 0))}
              </td>
              <td className="border border-gray-300 px-3 py-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>
    </div>
  );
};
