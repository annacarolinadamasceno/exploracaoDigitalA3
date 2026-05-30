/**
 * Utility to generate and download beautifully formatted reports for Fome Zero.
 * Constructs a premium, print-friendly report sheet and triggers the browser's native print-to-PDF flow.
 */

export interface ReportData {
  title: string;
  userName: string;
  userRole: 'ong' | 'supermercado';
  userEmail: string;
  stats: { label: string; value: string }[];
  history: {
    date: string;
    item: string;
    quantity: string;
    partner: string;
    status: string;
  }[];
}

export function downloadReportPDF(data: ReportData) {
  // Create a hidden print container or window
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita pop-ups para visualizar o relatório.');
    return;
  }

  const statsHTML = data.stats
    .map(
      (st) => `
      <div style="background-color: #fff9e6; border: 1px solid #ffd633; padding: 15px; border-radius: 12px; min-width: 140px; text-align: center;">
        <span style="font-size: 10px; font-weight: bold; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">${st.label}</span>
        <h2 style="margin: 5px 0 0 0; color: #b38600; font-size: 20px; font-weight: 800;">${st.value}</h2>
      </div>
    `
    )
    .join('');

  const historyRows = data.history
    .map(
      (row) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 8px; font-size: 11px; font-weight: 600; color: #333;">${row.date}</td>
        <td style="padding: 12px 8px; font-size: 11px; font-weight: bold; color: #17181c;">${row.item}</td>
        <td style="padding: 12px 8px; font-size: 11px; font-weight: bold; color: #e5af00;">${row.quantity}</td>
        <td style="padding: 12px 8px; font-size: 11px; color: #555;">${row.partner}</td>
        <td style="padding: 12px 8px; font-size: 10px; font-weight: bold; text-align: right;">
          <span style="background-color: ${row.status === 'Coletado' || row.status === 'Concluída' ? '#e6f7ed' : '#fff9e6'}; color: ${row.status === 'Coletado' || row.status === 'Concluída' ? '#10b981' : '#b38600'}; padding: 4px 8px; border-radius: 9999px; text-transform: uppercase;">
            ${row.status}
          </span>
        </td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${data.title}</title>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 40px;
            color: #17181c;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e5af00;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo-container {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo {
            width: 40px;
            height: 40px;
            background-color: #fff5cc;
            border: 2px solid #e5af00;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
          }
          .title {
            margin: 0;
            font-size: 22px;
            font-weight: 800;
            color: #17181c;
          }
          .subtitle {
            margin: 2px 0 0 0;
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
          }
          .meta-info {
            text-align: right;
            font-size: 11px;
            color: #555;
            line-height: 1.5;
          }
          .stats-container {
            display: flex;
            gap: 20px;
            margin-bottom: 45px;
          }
          .section-title {
            font-size: 13px;
            font-weight: 800;
            color: #17181c;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
            margin-bottom: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #fafafa;
            color: #666;
            text-transform: uppercase;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.5px;
            padding: 10px 8px;
            text-align: left;
            border-bottom: 2px solid #eee;
          }
          .footer {
            margin-top: 60px;
            border-top: 1px solid #eee;
            padding-top: 15px;
            text-align: center;
            font-size: 10px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            <div class="logo">❤️</div>
            <div>
              <h1 class="title">Fome Zero</h1>
              <div class="subtitle">Relatório Oficial de Impacto</div>
            </div>
          </div>
          <div class="meta-info">
            <strong>Entidade:</strong> ${data.userName}<br/>
            <strong>Perfil:</strong> ${data.userRole === 'ong' ? 'ONG (Voluntariado)' : 'Supermercado (Doador)'}<br/>
            <strong>Gerado em:</strong> ${new Date().toLocaleDateString('pt-BR')}<br/>
            <strong>Contato:</strong> ${data.userEmail}
          </div>
        </div>

        <div class="section-title">Indicadores de Impacto Acumulado</div>
        <div class="stats-container">
          ${statsHTML}
        </div>

        <div class="section-title">Histórico de Movimentações</div>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Alimento / Item</th>
              <th>Quantidade</th>
              <th>${data.userRole === 'ong' ? 'Supermercado Doador' : 'ONG Beneficiada'}</th>
              <th style="text-align: right;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${historyRows}
          </tbody>
        </table>

        <div class="footer">
          Fome Zero Ecossistema Inteligente • Relatório gerado digitalmente • Página 1 de 1
        </div>

        <script>
          // Automatically trigger the print dialog (Save as PDF)
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
