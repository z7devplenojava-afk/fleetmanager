import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { EPIControlRecord } from '@/types/epiControl';

class EPIControlReportGenerator {
  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  private createHTMLContent(record: EPIControlRecord): string {
    const equipmentRows = record.equipmentItems.map((item, index) => `
      <tr>
        <td style="border: 1px solid #000; padding: 8px; text-align: left;">${item.equipmentName}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.equipmentNumber}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.ca}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.quantity}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${this.formatDate(item.deliveryDate)}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.replacedDate ? this.formatDate(item.replacedDate) : ''}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: left;">${item.replacementReason || ''}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.signature}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #000;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #000;
            margin-bottom: 10px;
          }
          .company-info {
            font-size: 14px;
            color: #333;
            margin-bottom: 5px;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            background-color: #f0f0f0;
            border: 1px solid #000;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #000;
          }
          .employee-info {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
          }
          .info-value {
            font-size: 12px;
            padding: 5px;
            border: 1px solid #000;
            background-color: white;
            min-height: 20px;
          }
          .commitment-text {
            font-size: 11px;
            line-height: 1.4;
            margin: 20px 0;
            padding: 15px;
            background-color: #f9f9f9;
            border: 1px solid #000;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
          }
          .signature-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 200px;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            width: 100%;
            height: 30px;
            margin-bottom: 5px;
          }
          .signature-label {
            font-size: 11px;
            text-align: center;
          }
          .equipment-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .equipment-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            font-size: 11px;
            text-align: center;
            border: 1px solid #000;
            padding: 8px;
          }
          .equipment-table td {
            font-size: 10px;
            border: 1px solid #000;
            padding: 6px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #000;
            font-size: 10px;
            text-align: center;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">PROMOVER TERCEIRIZAÇÃO E SERVIÇOS LTDA</div>
            <div class="company-info">CNPJ: 36.698.521/0001-01</div>
            <div class="company-info">Endereço: Rua das Flores, 123 - Centro - São Paulo/SP</div>
            <div class="company-info">Telefone: (11) 1234-5678 | WhatsApp: (11) 98765-4321</div>
          </div>

          <div class="title">CONTROLE DE EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL (EPI)</div>

          <div class="section">
            <div class="section-title">INFORMAÇÕES DO FUNCIONÁRIO</div>
            <div class="employee-info">
              <div class="info-item">
                <div class="info-label">NOME DO EMPREGADO:</div>
                <div class="info-value">${record.employeeName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">FUNÇÃO:</div>
                <div class="info-value">${record.employeeFunction}</div>
              </div>
              <div class="info-item">
                <div class="info-label">CPF:</div>
                <div class="info-value">${record.employeeCpf}</div>
              </div>
              <div class="info-item">
                <div class="info-label">RG:</div>
                <div class="info-value">${record.employeeRg}</div>
              </div>
              <div class="info-item">
                <div class="info-label">DATA DE ADMISSÃO:</div>
                <div class="info-value">${this.formatDate(record.admissionDate)}</div>
              </div>
              <div class="info-item">
                <div class="info-label">DATA DE DEMISSÃO:</div>
                <div class="info-value">${record.dismissalDate ? this.formatDate(record.dismissalDate) : ''}</div>
              </div>
            </div>
          </div>

          <div class="title">RECIBO DE EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL (EPI)</div>

          <div class="commitment-text">
            Recebi da Promover Terceirização & Serviços Ltda., Os EPI's abaixo especificados a serem usados no desempenho de minhas tarefas. 
            Assumo o compromisso de usá-los durante a jornada de trabalho, zelar pela sua conservação, quando necessário solicitar a substituição 
            ou reposição e devolvê-los à Empresa em caso de demissão. Estou ciente também que o uso desses EPI's implicará em insubordinação, 
            sujeito a sansões disciplinares previstas no art. 158 CLT.
          </div>

          <div class="signature-section">
            <div class="signature-item">
              <div class="signature-line"></div>
              <div class="signature-label">Contagem: ____/____/____</div>
            </div>
            <div class="signature-item">
              <div class="signature-line"></div>
              <div class="signature-label">Assinatura: ${record.signature}</div>
            </div>
          </div>

          <table class="equipment-table">
            <thead>
              <tr>
                <th>EQUIPAMENTO</th>
                <th>Nº</th>
                <th>CA</th>
                <th>QUANTIDADE</th>
                <th>ENTREGA</th>
                <th>SUBSTITUIDO</th>
                <th>MOTIVO DA SUBST.</th>
                <th>ASSINATURA</th>
              </tr>
            </thead>
            <tbody>
              ${equipmentRows}
              ${Array.from({ length: Math.max(0, 25 - record.equipmentItems.length) }, () => `
                <tr>
                  <td style="border: 1px solid #000; padding: 8px;">&nbsp;</td>
                  <td style="border: 1px solid #000; padding: 8px;">&nbsp;</td>
                  <td style="border: 1px solid #000; padding: 8px;">&nbsp;</td>
                  <td style="border: 1px solid #000; padding: 8px;">&nbsp;</td>
                  <td style="border: 1px solid #000; padding: 8px;">&nbsp;</td>
                  <td style="border: 1px solid #000; padding: 8px;">&nbsp;</td>
                  <td style="border: 1px solid #000; padding: 8px;">&nbsp;</td>
                  <td style="border: 1px solid #000; padding: 8px;">&nbsp;</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${record.observations ? `
            <div class="section">
              <div class="section-title">OBSERVAÇÕES</div>
              <div style="padding: 10px; border: 1px solid #000; background-color: #f9f9f9; font-size: 11px;">
                ${record.observations}
              </div>
            </div>
          ` : ''}

          <div class="footer">
            <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            <p>Promover Terceirização e Serviços Ltda. - CNPJ: 36.698.521/0001-01</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async generatePDF(record: EPIControlRecord): Promise<void> {
    try {
      // Criar elemento HTML temporário
      const htmlContent = this.createHTMLContent(record);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      document.body.appendChild(tempDiv);

      // Converter para canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remover elemento temporário
      document.body.removeChild(tempDiv);

      // Criar PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Adicionar primeira página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Adicionar páginas adicionais se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download do PDF
      const fileName = `controle-epi-${record.employeeName.replace(/\s+/g, '-').toLowerCase()}-${this.formatDate(record.deliveryDate).replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Erro ao gerar relatório PDF');
    }
  }
}

export const epiControlReportGenerator = new EPIControlReportGenerator();
export default epiControlReportGenerator;
