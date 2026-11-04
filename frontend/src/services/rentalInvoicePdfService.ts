import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { RentalInvoice } from './rentalInvoiceService';

export interface RentalInvoiceCompany {
  name?: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
}

export interface RentalInvoicePdfOptions {
  company?: RentalInvoiceCompany;
  generatedBy?: string;
}

const DEFAULT_COMPANY: Required<Pick<RentalInvoiceCompany, 'name' | 'cnpj' | 'address' | 'city' | 'state' | 'zipCode'>> = {
  name: 'VIAÇÃO SÃO SILVESTRE LTDA',
  cnpj: '71.055.644/0001-25',
  address: 'RUA DOS ESPORTES, 45, CENTRO',
  city: 'MOEDA',
  state: 'MG',
  zipCode: '35.470-000',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendente', color: '#ffffff', bg: '#f59e0b' },
  PAID: { label: 'Paga / Liquidada', color: '#ffffff', bg: '#10b981' },
  OVERDUE: { label: 'Vencida', color: '#ffffff', bg: '#ef4444' },
  CANCELLED: { label: 'Cancelada', color: '#ffffff', bg: '#6b7280' },
  PARTIAL: { label: 'Parcialmente Paga', color: '#ffffff', bg: '#3b82f6' },
};

export class RentalInvoicePdfService {
  private static formatCurrency(value?: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  }

  private static formatDate(dateString?: string): string {
    if (!dateString) return '-';
    try {
      const clean = dateString.substring(0, 10);
      const parts = clean.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  }

  private static createHTML(invoice: RentalInvoice, options: RentalInvoicePdfOptions): string {
    const company = {
      name: options.company?.name || DEFAULT_COMPANY.name,
      cnpj: options.company?.cnpj || DEFAULT_COMPANY.cnpj,
      address: options.company?.address || DEFAULT_COMPANY.address,
      city: options.company?.city || DEFAULT_COMPANY.city,
      state: options.company?.state || DEFAULT_COMPANY.state,
      zipCode: options.company?.zipCode || DEFAULT_COMPANY.zipCode,
      phone: options.company?.phone || '(31) 3574-1234',
      email: options.company?.email || 'contato@viacaosaosilvestre.com.br',
    };

    const statusInfo = STATUS_CONFIG[invoice.status] || {
      label: invoice.status || 'PENDENTE',
      color: '#ffffff',
      bg: '#f59e0b',
    };

    const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
      {
        plate: '',
        model: 'Veículo da Frota',
        description: 'LOCAÇÃO DE VEÍCULO SEM CESSÃO DE MÃO DE OBRA',
        amount: invoice.netAmount || invoice.totalAmount || 0,
      }
    ];

    const generatedAt = new Date().toLocaleString('pt-BR');
    const generatedBy = options.generatedBy || 'FluxBus Sistema Integrado';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            color: #111827;
            line-height: 1.4;
            font-size: 12px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 24px;
            border: 1px solid #e5e7eb;
          }
          /* Header da Empresa */
          .header {
            text-align: center;
            margin-bottom: 24px;
            border-bottom: 2px solid #111827;
            padding-bottom: 16px;
          }
          .company-name {
            font-size: 19px;
            font-weight: 800;
            color: #111827;
            letter-spacing: -0.5px;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          .company-details {
            font-size: 10.5px;
            color: #4b5563;
            line-height: 1.4;
          }

          /* Header do Documento / Fatura */
          .order-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            background-color: #f9fafb;
            padding: 16px 20px;
            border-radius: 8px;
            border: 1px solid #f3f4f6;
          }
          .order-title {
            font-size: 12px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .order-number {
            font-size: 22px;
            font-weight: 800;
            color: #111827;
            margin-top: 2px;
          }
          .order-subtitle {
            font-size: 10px;
            color: #9ca3af;
          }
          .order-status {
            padding: 8px 18px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }

          /* Grid de Informações */
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
          }
          .info-section {
            background-color: #f9fafb;
            padding: 14px 16px;
            border-radius: 8px;
            border: 1px solid #f3f4f6;
          }
          .client-section {
            border-left: 4px solid #2563eb;
          }
          .invoice-section {
            border-left: 4px solid #f59e0b;
          }
          .bank-section {
            border-left: 4px solid #10b981;
          }
          .info-title {
            font-weight: 700;
            margin-bottom: 10px;
            color: #111827;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 11px;
            border-bottom: 1px dashed #f3f4f6;
            padding-bottom: 3px;
          }
          .info-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
          }
          .info-label {
            font-weight: 600;
            color: #6b7280;
          }
          .info-value {
            color: #111827;
            font-weight: 500;
            text-align: right;
            max-width: 65%;
            word-break: break-word;
          }

          /* Tabela de Itens */
          .items-section {
            margin-bottom: 20px;
          }
          .section-title {
            font-weight: 700;
            margin-bottom: 10px;
            color: #111827;
            font-size: 13px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .section-subtitle {
            font-size: 10px;
            font-weight: 400;
            color: #6b7280;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 11px;
          }
          .items-table th {
            background-color: #f3f4f6;
            padding: 9px 12px;
            text-align: left;
            font-weight: 700;
            border: 1px solid #e5e7eb;
            color: #374151;
            font-size: 10.5px;
            text-transform: uppercase;
          }
          .items-table td {
            padding: 10px 12px;
            border: 1px solid #e5e7eb;
            vertical-align: middle;
          }
          .plate-badge {
            display: inline-block;
            background-color: #eff6ff;
            color: #1d4ed8;
            font-family: 'Courier New', monospace;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 4px;
            border: 1px solid #bfdbfe;
            margin-right: 6px;
            font-size: 11px;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }

          /* Seção de Resumo Financeiro */
          .costs-section {
            margin-bottom: 20px;
            background-color: #f9fafb;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #f3f4f6;
          }
          .costs-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1.3fr;
            gap: 14px;
            align-items: center;
          }
          .cost-item {
            text-align: center;
            padding: 8px;
          }
          .cost-label {
            font-size: 10.5px;
            color: #6b7280;
            font-weight: 600;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          .cost-value {
            font-size: 16px;
            font-weight: 700;
            color: #111827;
            font-family: 'Courier New', monospace;
          }
          .total-cost {
            background-color: #1f2937;
            color: white;
            padding: 14px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .total-cost .cost-label {
            color: #d1d5db;
            font-size: 10px;
            letter-spacing: 0.5px;
          }
          .total-cost .cost-value {
            color: #34d399;
            font-size: 20px;
            font-weight: 800;
          }

          /* Observações */
          .notes-section {
            margin-bottom: 20px;
            background-color: #fffbeb;
            padding: 12px 14px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
            border-top: 1px solid #fef3c7;
            border-right: 1px solid #fef3c7;
            border-bottom: 1px solid #fef3c7;
          }
          .notes-title {
            font-weight: 700;
            margin-bottom: 4px;
            color: #92400e;
            font-size: 11px;
            text-transform: uppercase;
          }
          .notes-content {
            font-size: 10.5px;
            color: #78350f;
            line-height: 1.4;
          }

          /* Canhoto / Recibo */
          .receipt-declaration {
            margin-top: 30px;
            font-size: 9.5px;
            color: #4b5563;
            text-align: center;
            border-top: 1px dashed #d1d5db;
            padding-top: 12px;
            margin-bottom: 30px;
            text-transform: uppercase;
            letter-spacing: 0.2px;
          }
          .signatures-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 20px;
          }
          .signature-box {
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #6b7280;
            margin-bottom: 5px;
          }
          .signature-label {
            font-size: 10px;
            font-weight: 700;
            color: #374151;
            text-transform: uppercase;
          }

          /* Rodapé */
          .footer {
            margin-top: 20px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
            font-size: 9.5px;
            color: #9ca3af;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Cabeçalho da Empresa -->
          <div class="header">
            <div class="company-name">${company.name}</div>
            <div class="company-details">
              CNPJ: ${company.cnpj} · ${company.address} - ${company.city}/${company.state} - CEP: ${company.zipCode}<br>
              Telefone: ${company.phone} · E-mail: ${company.email}
            </div>
          </div>

          <!-- Cabeçalho da Fatura -->
          <div class="order-header">
            <div>
              <div class="order-title">Fatura de Locação de Veículos</div>
              <div class="order-number">Nº ${invoice.number}</div>
              <div class="order-subtitle">Locação de veículos sem cessão de mão de obra</div>
            </div>
            <div class="order-status" style="background-color: ${statusInfo.bg}; color: ${statusInfo.color};">
              ${statusInfo.label}
            </div>
          </div>

          <!-- Informações em Grid (Mesmo layout e faixas da OS) -->
          <div class="info-grid">
            <!-- Informações do Cliente -->
            <div class="info-section client-section">
              <div class="info-title">Destinatário / Cliente</div>
              <div class="info-row">
                <span class="info-label">Razão Social:</span>
                <span class="info-value"><strong>${invoice.clientName || 'Não informado'}</strong></span>
              </div>
              <div class="info-row">
                <span class="info-label">CNPJ / CPF:</span>
                <span class="info-value font-mono">${invoice.clientCnpj || '-'}</span>
              </div>
              ${invoice.clientIe ? `
              <div class="info-row">
                <span class="info-label">Inscrição Estadual:</span>
                <span class="info-value font-mono">${invoice.clientIe}</span>
              </div>` : ''}
              <div class="info-row">
                <span class="info-label">Endereço:</span>
                <span class="info-value">${invoice.clientAddress || '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Município / UF:</span>
                <span class="info-value">${invoice.clientCity ? `${invoice.clientCity}/${invoice.clientState || ''}` : '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">CEP:</span>
                <span class="info-value">${invoice.clientZipCode || '-'}</span>
              </div>
            </div>

            <!-- Informações da Fatura & Contrato -->
            <div class="info-section invoice-section">
              <div class="info-title">Dados da Fatura & Contrato</div>
              <div class="info-row">
                <span class="info-label">Data de Emissão:</span>
                <span class="info-value"><strong>${this.formatDate(invoice.issueDate)}</strong></span>
              </div>
              <div class="info-row">
                <span class="info-label">Período da Locação:</span>
                <span class="info-value">${this.formatDate(invoice.periodStart)} a ${this.formatDate(invoice.periodEnd)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Data de Vencimento:</span>
                <span class="info-value" style="color: #b91c1c; font-weight: 700;">${this.formatDate(invoice.dueDate)}</span>
              </div>
              ${invoice.receiptDate ? `
              <div class="info-row">
                <span class="info-label">Data de Liquidação:</span>
                <span class="info-value" style="color: #15803d; font-weight: 700;">${this.formatDate(invoice.receiptDate)}</span>
              </div>` : ''}
              <div class="info-row">
                <span class="info-label">Contrato / Pedido:</span>
                <span class="info-value"><strong>${invoice.contractNumber || 'Contrato Padrão'}</strong></span>
              </div>
              <div class="info-row">
                <span class="info-label">Nota Fiscal Vinculada:</span>
                <span class="info-value">${invoice.nfseNumber ? `NFS-e Nº ${invoice.nfseNumber}` : 'Não vinculada'}</span>
              </div>
            </div>
          </div>

          <!-- Tabela de Itens / Veículos Locados -->
          <div class="items-section">
            <div class="section-title">
              <span>Veículos e Serviços de Locação (${items.length} ${items.length === 1 ? 'item' : 'itens'})</span>
              <span class="section-subtitle">Locação operacional sem condutor</span>
            </div>
            <table class="items-table">
              <thead>
                <tr>
                  <th class="text-center" style="width: 45px;">Item</th>
                  <th>Descrição dos Serviços / Veículos</th>
                  <th class="text-right" style="width: 140px;">Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item, idx) => `
                  <tr>
                    <td class="text-center" style="font-weight: 700; color: #6b7280;">${idx + 1}</td>
                    <td>
                      <div>
                        ${item.plate ? `<span class="plate-badge">${item.plate}</span>` : ''}
                        <strong>${item.model || 'Veículo Operacional'}</strong>
                      </div>
                      <div style="font-size: 10px; color: #6b7280; margin-top: 3px;">
                        ${item.description || 'LOCAÇÃO DE VEÍCULO SEM CESSÃO DE MÃO DE OBRA'}
                      </div>
                    </td>
                    <td class="text-right" style="font-family: 'Courier New', monospace; font-weight: 700; font-size: 12px;">
                      ${this.formatCurrency(item.amount)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Resumo de Valores (Mesmo card escuro em destaque da OS) -->
          <div class="costs-section">
            <div class="costs-grid">
              <div class="cost-item">
                <div class="cost-label">Subtotal da Locação</div>
                <div class="cost-value">${this.formatCurrency(invoice.totalAmount)}</div>
              </div>
              <div class="cost-item">
                <div class="cost-label">Descontos / Retenções</div>
                <div class="cost-value" style="color: ${invoice.discount ? '#dc2626' : '#111827'};">
                  ${invoice.discount ? `- ${this.formatCurrency(invoice.discount)}` : 'R$ 0,00'}
                </div>
              </div>
              <div class="cost-item total-cost">
                <div class="cost-label">Total Líquido a Receber</div>
                <div class="cost-value">${this.formatCurrency(invoice.netAmount)}</div>
              </div>
            </div>
          </div>

          <!-- Dados Bancários -->
          <div class="info-section bank-section" style="margin-bottom: 18px;">
            <div class="info-title">Dados Bancários para Liquidação</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px;">
              <div>
                <span class="info-label">Instituição:</span> <strong>${invoice.bankName || 'BANCO DO BRASIL S.A.'}</strong><br>
                <span class="info-label">Agência:</span> ${invoice.bankAgency || '—'} · <span class="info-label">Conta Corrente:</span> ${invoice.bankAccount || '—'}
              </div>
              <div>
                <span class="info-label">Forma de Pagamento:</span> <strong>${invoice.paymentMethod || 'TRANSFERÊNCIA BANCÁRIA'}</strong><br>
                <span class="info-label">Vencimento Impreterível:</span> <span style="color: #b91c1c; font-weight: 700;">${this.formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          </div>

          <!-- Observações & Legislação -->
          <div class="notes-section">
            <div class="notes-title">Observações e Fundamentação Legal</div>
            <div class="notes-content">
              Operação de locação de bens móveis sem condutor, tributada nos termos da <strong>Lei Complementar nº 116/2003</strong> e em estrita consonância com a <strong>Súmula Vinculante nº 31 do STF</strong> (Não incidência de ISS sobre locação pura de bens móveis).
              ${invoice.notes ? `<br><br><strong>Instruções do Faturamento:</strong> ${invoice.notes}` : ''}
            </div>
          </div>

          <!-- Canhoto / Recibo de Entrega -->
          <div class="receipt-declaration">
            RECEBI(EMOS) DE <strong>${company.name}</strong> AS LOCAÇÕES CONSTANTES DESTA FATURA INDICADAS ACIMA, EM PERFEITAS CONDIÇÕES.
          </div>

          <!-- Assinaturas (Mesmo padrão da OS) -->
          <div class="signatures-grid">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Data do Recebimento</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Identificação e Assinatura do Recebedor</div>
            </div>
          </div>

          <!-- Rodapé -->
          <div class="footer">
            <span>FluxBus Gestão Integrada de Frotas · Locação Operacional</span>
            <span>Documento emitido em: ${generatedAt} · Operador: ${generatedBy}</span>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Gera o PDF com o mesmo motor (html2canvas + jsPDF) e layout visual da Ordem de Serviço (OS).
   */
  public static async generatePDF(invoice: RentalInvoice, options: RentalInvoicePdfOptions = {}): Promise<void> {
    try {
      const html = this.createHTML(invoice, options);

      // Elemento temporário para renderizar o HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);

      // Renderizar o canvas a partir do HTML com escala de alta definição
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempDiv.scrollHeight,
      });

      document.body.removeChild(tempDiv);

      // Criar o documento PDF A4 em retrato
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;

      // Primeira página
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      // Páginas adicionais se houver transbordo
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`fatura-locacao-${invoice.number || 'nova'}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF da Fatura de Locação no layout da OS:', error);
      throw error;
    }
  }
}
