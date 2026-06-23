import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ServiceOrder, ServiceOrderItem } from '@/types/inventory';

interface ServiceOrderPDFData {
  order: ServiceOrder;
  company: {
    name: string;
    document: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  generatedBy: string;
  generatedAt: string;
}

class ServiceOrderPDFGenerator {
  private formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  }

  private formatDateTime(dateString: string): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString('pt-BR');
    } catch {
      return dateString;
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      IN_PROGRESS: 'Em Andamento',
      COMPLETED: 'Concluída',
      CANCELLED: 'Cancelada',
      ON_HOLD: 'Em Espera',
    };
    return labels[status] || status;
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      IN_PROGRESS: '#3b82f6',
      COMPLETED: '#10b981',
      CANCELLED: '#ef4444',
      ON_HOLD: '#6b7280',
    };
    return colors[status] || '#000000';
  }

  private createHTML(data: ServiceOrderPDFData): string {
    const { order, company, generatedBy, generatedAt } = data;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            color: #000000;
            line-height: 1.4;
            font-size: 12px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border: 1px solid #e5e7eb;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          .company-info {
            margin-bottom: 20px;
          }
          .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .company-details {
            font-size: 10px;
            color: #6b7280;
          }
          .order-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
          }
          .order-number {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
          }
          .order-status {
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
          }
          .info-section {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
          }
          .info-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #1f2937;
            font-size: 14px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 11px;
          }
          .info-label {
            font-weight: 600;
            color: #6b7280;
          }
          .info-value {
            color: #1f2937;
          }
          .items-section {
            margin-bottom: 25px;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 15px;
            color: #1f2937;
            font-size: 14px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
          }
          .items-table th {
            background-color: #f3f4f6;
            padding: 10px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #e5e7eb;
          }
          .items-table td {
            padding: 10px;
            border: 1px solid #e5e7eb;
          }
          .items-table .type-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 600;
          }
          .type-part {
            background-color: #dbeafe;
            color: #1e40af;
          }
          .type-labor {
            background-color: #f3e8ff;
            color: #7c3aed;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .costs-section {
            margin-top: 25px;
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
          }
          .costs-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
          }
          .cost-item {
            text-align: center;
          }
          .cost-label {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 5px;
          }
          .cost-value {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
          }
          .total-cost {
            background-color: #1f2937;
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }
          .total-cost .cost-label {
            color: #d1d5db;
          }
          .total-cost .cost-value {
            color: white;
            font-size: 22px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 10px;
            color: #6b7280;
            text-align: center;
          }
          .notes-section {
            margin-top: 20px;
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
          }
          .notes-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #92400e;
          }
          .notes-content {
            font-size: 11px;
            color: #78350f;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="company-info">
              <div class="company-name">${company.name}</div>
              <div class="company-details">
                ${company.document ? `CNPJ: ${company.document}<br>` : ''}
                ${company.address ? `${company.address}<br>` : ''}
                ${company.phone ? `Telefone: ${company.phone}<br>` : ''}
                ${company.email ? `E-mail: ${company.email}` : ''}
              </div>
            </div>
          </div>

          <!-- Order Header -->
          <div class="order-header">
            <div>
              <div class="order-number">Ordem de Serviço</div>
              <div style="font-size: 24px; font-weight: bold; margin-top: 5px;">${order.orderNumber}</div>
            </div>
            <div class="order-status" style="background-color: ${this.getStatusColor(order.status)}; color: white;">
              ${this.getStatusLabel(order.status)}
            </div>
          </div>

          <!-- Information Grid -->
          <div class="info-grid">
            <div class="info-section">
              <div class="info-title">Informações do Cliente</div>
              <div class="info-row">
                <span class="info-label">Nome:</span>
                <span class="info-value">${order.clientName || 'Não informado'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Veículo:</span>
                <span class="info-value">${order.vehiclePlate || 'Não informado'}</span>
              </div>
            </div>
            
            <div class="info-section">
              <div class="info-title">Informações da Ordem</div>
              <div class="info-row">
                <span class="info-label">Data de Criação:</span>
                <span class="info-value">${this.formatDateTime(order.createdAt)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Previsão:</span>
                <span class="info-value">${this.formatDate(order.estimatedCompletionDate || '')}</span>
              </div>
              ${order.completedAt ? `
              <div class="info-row">
                <span class="info-label">Conclusão:</span>
                <span class="info-value">${this.formatDateTime(order.completedAt)}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">Criado por:</span>
                <span class="info-value">${order.createdBy || 'Sistema'}</span>
              </div>
            </div>
          </div>

          <!-- Items Section -->
          <div class="items-section">
            <div class="section-title">Itens da Ordem de Serviço</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th class="text-center">Quantidade</th>
                  <th class="text-center">Aplicado</th>
                  <th class="text-center">Devolvido</th>
                  <th class="text-right">Valor Unit.</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>
                      <span class="type-badge ${item.type === 'PART' ? 'type-part' : 'type-labor'}">
                        ${item.type === 'PART' ? 'Peça' : 'Mão de Obra'}
                      </span>
                    </td>
                    <td>
                      <div>${item.description}</div>
                      ${item.partNumber ? `<div style="font-size: 10px; color: #6b7280;">Código: ${item.partNumber}</div>` : ''}
                    </td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-center">${item.appliedQuantity || 0}</td>
                    <td class="text-center">${item.returnedQuantity || 0}</td>
                    <td class="text-right">${this.formatCurrency(item.unitPrice || 0)}</td>
                    <td class="text-right">${this.formatCurrency(item.totalPrice || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Costs Section -->
          <div class="costs-section">
            <div class="section-title">Resumo de Custos</div>
            <div class="costs-grid">
              <div class="cost-item">
                <div class="cost-label">Custo das Peças</div>
                <div class="cost-value">${this.formatCurrency(order.partsCost || 0)}</div>
              </div>
              <div class="cost-item">
                <div class="cost-label">Custo de Mão de Obra</div>
                <div class="cost-value">${this.formatCurrency(order.laborCost || 0)}</div>
              </div>
              <div class="cost-item total-cost">
                <div class="cost-label">Custo Total</div>
                <div class="cost-value">${this.formatCurrency(order.totalCost || 0)}</div>
              </div>
            </div>
          </div>

          <!-- Notes Section -->
          ${order.observations ? `
          <div class="notes-section">
            <div class="notes-title">Observações</div>
            <div class="notes-content">${order.observations}</div>
          </div>
          ` : ''}

          <!-- Footer -->
          <div class="footer">
            <div>Documento gerado em ${this.formatDateTime(generatedAt)}</div>
            <div>Gerado por: ${generatedBy}</div>
            <div style="margin-top: 10px;">Este é um documento gerado automaticamente pelo sistema Fleet Manager</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async generatePDF(data: ServiceOrderPDFData): Promise<Blob> {
    try {
      // Criar o HTML
      const html = this.createHTML(data);
      
      // Criar um elemento temporário para renderizar o HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);

      // Gerar o canvas a partir do HTML
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempDiv.scrollHeight
      });

      // Remover o elemento temporário
      document.body.removeChild(tempDiv);

      // Criar o PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;

      // Adicionar a primeira página
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      // Adicionar páginas adicionais se necessário
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('Erro ao gerar PDF da Ordem de Serviço:', error);
      throw new Error('Não foi possível gerar o PDF da Ordem de Serviço');
    }
  }

  async generateAndDownloadPDF(data: ServiceOrderPDFData): Promise<void> {
    try {
      const blob = await this.generatePDF(data);
      const fileName = `ordem-servico-${data.order.orderNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao fazer download do PDF:', error);
      throw error;
    }
  }

  async generateAndOpenPDF(data: ServiceOrderPDFData): Promise<string> {
    try {
      const blob = await this.generatePDF(data);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      return url;
    } catch (error) {
      console.error('Erro ao abrir PDF:', error);
      throw error;
    }
  }
}

export const serviceOrderPDFGenerator = new ServiceOrderPDFGenerator();
