import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { EPIControlRecord } from '@/types/epiControl';

class EPIReceiptGenerator {
  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  private createHTMLContent(record: EPIControlRecord): string {
    const equipmentRows = record.equipmentItems.map((item, index) => `
      <tr>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${index + 1}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: left; font-size: 11px;">${item.equipmentName}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${item.ca}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${item.quantity}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${this.formatDate(item.deliveryDate)}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${item.replacedDate ? this.formatDate(item.replacedDate) : ''}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">&nbsp;</td>
      </tr>
    `).join('');

    // Adicionar linhas vazias para completar 10 linhas (reduzido para caber em uma página)
    const emptyRows = Array.from({ length: Math.max(0, Math.min(10 - record.equipmentItems.length, 10)) }, (_, index) => `
      <tr>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 8px;">${record.equipmentItems.length + index + 1}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: left; font-size: 8px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 8px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 8px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 8px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 8px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 8px;">&nbsp;</td>
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
            padding: 0;
            background-color: #ffffff;
            color: #000;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            position: relative;
          }
          .header-gradient {
            height: 4px;
            background: linear-gradient(to right, #ff6b35, #e74c3c);
            margin-bottom: 0;
          }
          .header {
            background-color: #2c3e50;
            color: white;
            padding: 20px;
            text-align: left;
            position: relative;
          }
          .logo {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #f39c12, #e74c3c);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: white;
          }
          .logo-text {
            display: flex;
            flex-direction: column;
          }
          .logo-main {
            font-size: 18px;
            font-weight: bold;
            color: #f39c12;
          }
          .logo-sub {
            font-size: 12px;
            color: #ecf0f1;
          }
          .title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin: 15px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .employee-info {
            margin: 10px 0;
            padding: 12px;
            border: 1px solid #000;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 10px;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 3px;
            color: #2c3e50;
          }
          .info-value {
            font-size: 10px;
            padding: 5px;
            border: 1px solid #000;
            background-color: white;
            min-height: 15px;
          }
          .equipment-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          .equipment-table th {
            background-color: #34495e;
            color: white;
            font-weight: bold;
            font-size: 9px;
            text-align: center;
            border: 1px solid #000;
            padding: 5px 3px;
          }
          .equipment-table td {
            font-size: 8px;
            border: 1px solid #000;
            padding: 4px;
          }
          .commitment-text {
            font-size: 9px;
            line-height: 1.3;
            margin: 10px 0;
            padding: 10px;
            background-color: #f8f9fa;
            border: 1px solid #000;
            text-align: justify;
          }
          .date-section {
            margin: 20px 0;
            text-align: center;
          }
          .date-text {
            font-size: 12px;
            margin-bottom: 20px;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
            gap: 30px;
          }
          .signature-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            width: 100%;
            height: 30px;
            margin-bottom: 5px;
          }
          .signature-label {
            font-size: 9px;
            text-align: center;
            font-weight: bold;
          }
          .footer {
            background-color: #2c3e50;
            color: white;
            padding: 20px;
            text-align: center;
            margin-top: 30px;
          }
          .footer-info {
            font-size: 11px;
            line-height: 1.4;
            margin-bottom: 10px;
          }
          .footer-website {
            font-size: 12px;
            font-weight: bold;
            color: #f39c12;
          }
          .footer-gradient {
            height: 4px;
            background: linear-gradient(to right, #f39c12, #e74c3c);
            margin-top: 0;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 200px;
            color: rgba(0, 0, 0, 0.03);
            font-weight: bold;
            z-index: -1;
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="watermark">P</div>
          
          <div class="header-gradient"></div>
          
          <div class="header">
            <div class="logo">
              <div class="logo-icon">P</div>
              <div class="logo-text">
                <div class="logo-main">Promover</div>
                <div class="logo-sub">Vigilância & Serviços</div>
              </div>
            </div>
          </div>

          <div class="title">RECIBO DE EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL (EPI)</div>

          <div class="employee-info">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Nome Completo:</div>
                <div class="info-value">${record.employeeName}</div>
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
                <div class="info-label">Função:</div>
                <div class="info-value">${record.employeeFunction}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Setor:</div>
                <div class="info-value">${record.deliveryResponsible || 'Não informado'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Data de Admissão:</div>
                <div class="info-value">${this.formatDate(record.admissionDate)}</div>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Unidade:</div>
              <div class="info-value">Promover Vigilância Patrimonial Ltda</div>
            </div>
          </div>

          <table class="equipment-table">
            <thead>
              <tr>
                <th>ITEM</th>
                <th>DESCRIÇÃO DO EPI</th>
                <th>CA</th>
                <th>QUANTIDADE</th>
                <th>DATA DE ENTREGA</th>
                <th>DATA DE DEVOLUÇÃO</th>
                <th>ASSINATURA</th>
              </tr>
            </thead>
            <tbody>
              ${equipmentRows}
              ${emptyRows}
            </tbody>
          </table>

          <div class="commitment-text">
            Declaro para os devidos fins que recebi da empresa <strong>PROMOVER VIGILÂNCIA PATRIMONIAL LTDA</strong>, 
            os Equipamentos de Proteção Individual (EPI) acima relacionados, em perfeito estado de conservação e uso, 
            e me comprometo a utilizá-los corretamente, zelando pela sua guarda e conservação, conforme as normas de 
            segurança e saúde no trabalho. Estou ciente da obrigatoriedade do uso e da responsabilidade pela devolução 
            dos mesmos ao término do contrato de trabalho ou quando solicitado pela empresa.
          </div>

          <div class="date-section">
            <div class="date-text">
              Contagem/MG, ______ de ________________ de ________.
            </div>
          </div>

          <div class="signature-section">
            <div class="signature-item">
              <div class="signature-line"></div>
              <div class="signature-label">Assinatura do Funcionário</div>
            </div>
            <div class="signature-item">
              <div class="signature-line"></div>
              <div class="signature-label">Assinatura do Representante da Empresa</div>
            </div>
          </div>

          <div class="footer-gradient"></div>
          
          <div class="footer">
            <div class="footer-info">
              <strong>Promover Vigilância Patrimonial Ltda</strong><br>
              R. Coronel João Camargos, n° 267 - Centro - Contagem/MG<br>
              (31) 2559-1245<br>
              comercial@promovervigilancia.com.br
            </div>
            <div class="footer-website">www.promovervigilancia.com.br</div>
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
      const fileName = `recibo-epi-${record.employeeName.replace(/\s+/g, '-').toLowerCase()}-${this.formatDate(record.deliveryDate).replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Erro ao gerar recibo:', error);
      throw new Error('Erro ao gerar recibo de EPI');
    }
  }
}

export const epiReceiptGenerator = new EPIReceiptGenerator();
export default epiReceiptGenerator;
