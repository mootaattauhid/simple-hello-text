
import React from 'react';

interface DetailOrder {
  id: string;
  child_name: string;
  child_class: string;
  total_amount: number;
  payment_status: string;
  delivery_date: string;
  order_items: {
    quantity: number;
    menu_items: { name: string } | null;
  }[];
}

interface DetailOrdersPrintProps {
  data: DetailOrder[];
  printerType?: string;
}

export const DetailOrdersPrint: React.FC<DetailOrdersPrintProps> = ({ 
  data, 
  printerType = 'standard' 
}) => {
  const printStyles = {
    standard: {
      fontSize: '12px',
      pageWidth: '210mm',
      margin: '20mm',
      fontFamily: 'Arial, sans-serif'
    },
    thermal: {
      fontSize: '9px',
      pageWidth: '80mm',
      margin: '3mm',
      fontFamily: 'Arial, sans-serif'
    },
    dotmatrix: {
      fontSize: '8px',
      pageWidth: '216mm',
      margin: '10mm',
      fontFamily: 'Courier, monospace'
    }
  };

  const currentStyle = printStyles[printerType as keyof typeof printStyles] || printStyles.standard;

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Lunas';
      case 'pending': return 'Belum Bayar';
      case 'failed': return 'Gagal';
      case 'refunded': return 'Refund';
      default: return status;
    }
  };

  React.useEffect(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalAmount = data.reduce((sum, order) => sum + order.total_amount, 0);
    const paidOrders = data.filter(order => order.payment_status === 'paid').length;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Detail Pesanan</title>
          <style>
            @page {
              size: ${currentStyle.pageWidth};
              margin: ${currentStyle.margin};
            }
            body {
              font-family: ${currentStyle.fontFamily};
              font-size: ${currentStyle.fontSize};
              line-height: 1.3;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 15px;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 3px; 
              text-align: left; 
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold; 
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .order-item { 
              font-size: 90%; 
              margin: 2px 0; 
            }
            .status-paid { color: green; }
            .status-pending { color: orange; }
            .summary { 
              margin-top: 15px; 
              padding: 8px; 
              border: 1px solid #000; 
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>DETAIL PESANAN</h2>
            <p>Berdasarkan Tanggal Katering</p>
            <p>Dicetak: ${new Date().toLocaleString('id-ID')}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Nama Siswa</th>
                <th>Kelas</th>
                <th>Tanggal Katering</th>
                <th>Detail Pesanan</th>
                <th class="text-center">Status</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(order => `
                <tr>
                  <td>${order.child_name}</td>
                  <td>${order.child_class}</td>
                  <td>${new Date(order.delivery_date).toLocaleDateString('id-ID')}</td>
                  <td>
                    ${order.order_items.map(item => 
                      `<div class="order-item">${item.quantity}x ${item.menu_items?.name || 'Unknown Item'}</div>`
                    ).join('')}
                  </td>
                  <td class="text-center status-${order.payment_status}">
                    ${getPaymentStatusText(order.payment_status)}
                  </td>
                  <td class="text-right">Rp ${order.total_amount.toLocaleString('id-ID')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <h3>RINGKASAN</h3>
            <p>Total Pesanan: ${data.length}</p>
            <p>Pesanan Lunas: ${paidOrders}</p>
            <p>Total Nilai: Rp ${totalAmount.toLocaleString('id-ID')}</p>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              }
            }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  }, [data, printerType]);

  return null;
};
