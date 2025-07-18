
import React from 'react';

interface RecapData {
  date: string;
  total_orders: number;
  total_amount: number;
  paid_orders: number;
  pending_orders: number;
  total_items: number;
}

interface RecapPrintProps {
  data: RecapData[];
  printerType?: string;
}

export const RecapPrint: React.FC<RecapPrintProps> = ({ data, printerType = 'standard' }) => {
  const printStyles = {
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
      fontFamily: 'Arial, sans-serif'
    },
    dotmatrix: {
      fontSize: '9px',
      pageWidth: '216mm',
      margin: '10mm',
      fontFamily: 'Courier, monospace'
    }
  };

  const currentStyle = printStyles[printerType as keyof typeof printStyles] || printStyles.standard;

  React.useEffect(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalOrders = data.reduce((sum, item) => sum + item.total_orders, 0);
    const totalAmount = data.reduce((sum, item) => sum + item.total_amount, 0);
    const totalPaid = data.reduce((sum, item) => sum + item.paid_orders, 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rekapitulasi Pesanan</title>
          <style>
            @page {
              size: ${currentStyle.pageWidth};
              margin: ${currentStyle.margin};
            }
            body {
              font-family: ${currentStyle.fontFamily};
              font-size: ${currentStyle.fontSize};
              line-height: 1.4;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 4px; 
              text-align: left; 
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold; 
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .summary { 
              margin-top: 20px; 
              padding: 10px; 
              border: 1px solid #000; 
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>REKAPITULASI PESANAN</h2>
            <p>Berdasarkan Tanggal Katering</p>
            <p>Dicetak: ${new Date().toLocaleString('id-ID')}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Tanggal Katering</th>
                <th class="text-center">Total Pesanan</th>
                <th class="text-center">Total Item</th>
                <th class="text-center">Lunas</th>
                <th class="text-center">Belum Bayar</th>
                <th class="text-right">Total Pendapatan</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td>${new Date(item.date).toLocaleDateString('id-ID')}</td>
                  <td class="text-center">${item.total_orders}</td>
                  <td class="text-center">${item.total_items}</td>
                  <td class="text-center">${item.paid_orders}</td>
                  <td class="text-center">${item.pending_orders}</td>
                  <td class="text-right">Rp ${item.total_amount.toLocaleString('id-ID')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <h3>RINGKASAN</h3>
            <p>Total Pesanan: ${totalOrders}</p>
            <p>Total Pesanan Lunas: ${totalPaid}</p>
            <p>Total Pendapatan: Rp ${totalAmount.toLocaleString('id-ID')}</p>
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
