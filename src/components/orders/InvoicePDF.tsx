
import React from 'react';
import { formatPrice, formatDate } from '@/utils/orderUtils';
import { Order } from '@/types/order';

interface InvoicePDFProps {
  order: Order;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ order }) => {
  const generateInvoiceHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order.child_name}</title>
          <meta charset="utf-8">
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              margin: 0;
              padding: 0;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #ff6b35;
              padding-bottom: 20px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #ff6b35;
              margin-bottom: 5px;
            }
            .company-subtitle {
              font-size: 14px;
              color: #666;
            }
            .invoice-title {
              font-size: 18px;
              font-weight: bold;
              margin: 20px 0;
              color: #333;
            }
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .info-block {
              flex: 1;
            }
            .info-block h3 {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #ff6b35;
            }
            .info-row {
              margin-bottom: 5px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .items-table th,
            .items-table td {
              border: 1px solid #ddd;
              padding: 12px 8px;
              text-align: left;
            }
            .items-table th {
              background-color: #ff6b35;
              color: white;
              font-weight: bold;
            }
            .items-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .items-table td:last-child,
            .items-table th:last-child {
              text-align: right;
            }
            .total-section {
              margin-top: 30px;
              text-align: right;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              padding: 5px 0;
            }
            .total-final {
              border-top: 2px solid #ff6b35;
              padding-top: 10px;
              font-weight: bold;
              font-size: 16px;
              color: #ff6b35;
            }
            .status-badge {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 15px;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-paid {
              background-color: #d4edda;
              color: #155724;
              border: 1px solid #c3e6cb;
            }
            .status-pending {
              background-color: #fff3cd;
              color: #856404;
              border: 1px solid #ffeaa7;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            .notes {
              margin-top: 20px;
              padding: 15px;
              background-color: #f8f9fa;
              border-left: 4px solid #ff6b35;
            }
            .notes h4 {
              margin: 0 0 10px 0;
              color: #ff6b35;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Katering Sekolah</div>
            <div class="company-subtitle">Sistem Pemesanan Makanan Anak</div>
            <div class="invoice-title">INVOICE</div>
          </div>

          <div class="info-section">
            <div class="info-block">
              <h3>Informasi Pesanan</h3>
              <div class="info-row"><strong>No. Invoice:</strong> INV-${order.id.substring(0, 8).toUpperCase()}</div>
              <div class="info-row"><strong>Tanggal Pesanan:</strong> ${formatDate(order.created_at)}</div>
              <div class="info-row"><strong>Tanggal Katering:</strong> ${formatDate(order.delivery_date || '')}</div>
              <div class="info-row">
                <strong>Status Pembayaran:</strong> 
                <span class="status-badge ${order.payment_status === 'paid' ? 'status-paid' : 'status-pending'}">
                  ${order.payment_status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                </span>
              </div>
            </div>
            <div class="info-block">
              <h3>Informasi Siswa</h3>
              <div class="info-row"><strong>Nama:</strong> ${order.child_name}</div>
              <div class="info-row"><strong>Kelas:</strong> ${order.child_class}</div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Item</th>
                <th>Qty</th>
                <th>Harga Satuan</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.order_items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.menu_items?.name || 'Unknown Item'}</td>
                  <td>${item.quantity}</td>
                  <td>${formatPrice(item.price)}</td>
                  <td>${formatPrice(item.price * item.quantity)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatPrice(order.total_amount)}</span>
            </div>
            <div class="total-row total-final">
              <span>Total Pembayaran:</span>
              <span>${formatPrice(order.total_amount)}</span>
            </div>
          </div>

          ${order.notes ? `
            <div class="notes">
              <h4>Catatan:</h4>
              <p>${order.notes}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>Invoice ini dibuat secara otomatis oleh sistem</p>
            <p>Untuk pertanyaan lebih lanjut, silakan hubungi administrator sekolah</p>
            <p>Terima kasih atas kepercayaan Anda menggunakan layanan katering kami</p>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadPDF = () => {
    const htmlContent = generateInvoiceHTML();
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return { handleDownloadPDF };
};
