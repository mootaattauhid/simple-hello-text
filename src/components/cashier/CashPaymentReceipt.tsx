
import React from 'react';
import { formatPrice, formatDate } from '@/utils/orderUtils';

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

interface CashPaymentReceiptProps {
  order: Order;
  receivedAmount: number;
  changeAmount: number;
  printerType?: string;
}

export const CashPaymentReceipt: React.FC<CashPaymentReceiptProps> = ({ 
  order, 
  receivedAmount, 
  changeAmount,
  printerType = 'standard'
}) => {
  const printerStyles = {
    standard: {
      fontSize: '12px',
      pageWidth: '210mm',
      margin: '20mm',
      fontFamily: 'Arial, sans-serif'
    },
    thermal: {
      fontSize: '10px',
      pageWidth: '80mm',
      margin: '5mm',
      fontFamily: 'monospace'
    },
    dotmatrix: {
      fontSize: '9px',
      pageWidth: '210mm',
      margin: '15mm',
      fontFamily: 'Courier, monospace'
    }
  };

  const currentStyle = printerStyles[printerType as keyof typeof printerStyles] || printerStyles.standard;

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Kwitansi Pembayaran - ${order.child_name}</title>
        <style>
          @page {
            size: ${currentStyle.pageWidth};
            margin: ${currentStyle.margin};
          }
          body {
            font-family: ${currentStyle.fontFamily};
            font-size: ${currentStyle.fontSize};
            line-height: 1.4;
            margin: 0;
            padding: 0;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 12px;
          }
          .section {
            margin-bottom: 15px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #000;
            padding: 5px;
            text-align: left;
          }
          .items-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .total-section {
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 15px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 14px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">KWITANSI PEMBAYARAN</div>
          <div class="subtitle">Katering Sekolah</div>
        </div>

        <div class="section">
          <div class="row">
            <span>No. Pesanan:</span>
            <span>${order.id.substring(0, 8).toUpperCase()}</span>
          </div>
          <div class="row">
            <span>Nama Siswa:</span>
            <span>${order.child_name}</span>
          </div>
          <div class="row">
            <span>Kelas:</span>
            <span>${order.child_class}</span>
          </div>
          <div class="row">
            <span>Tanggal Katering:</span>
            <span>${formatDate(order.delivery_date)}</span>
          </div>
          <div class="row">
            <span>Tanggal Bayar:</span>
            <span>${formatDate(new Date().toISOString())}</span>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Harga</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.order_items.map(item => `
              <tr>
                <td>${item.menu_items?.name || 'Unknown Item'}</td>
                <td>${item.quantity}</td>
                <td>${formatPrice(item.price)}</td>
                <td>${formatPrice(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="row">
            <span>Total Pembayaran:</span>
            <span>${formatPrice(order.total_amount)}</span>
          </div>
          <div class="row">
            <span>Uang Diterima:</span>
            <span>${formatPrice(receivedAmount)}</span>
          </div>
          <div class="row">
            <span>Kembalian:</span>
            <span>${formatPrice(changeAmount)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Terima kasih atas pembayaran Anda</p>
          <p>Kwitansi ini adalah bukti pembayaran yang sah</p>
        </div>
      </body>
    </html>
  `;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  return { handlePrint };
};
