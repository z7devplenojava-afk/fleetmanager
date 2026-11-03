import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RentalInvoice } from './rentalInvoiceService';

export interface RentalInvoiceCompany {
  name?: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
}

export interface RentalInvoicePdfOptions {
  company?: RentalInvoiceCompany;
}

const DEFAULT_COMPANY: Required<Pick<RentalInvoiceCompany, 'name' | 'cnpj' | 'address' | 'city' | 'state' | 'zipCode'>> = {
  name: 'VIAÇÃO SÃO SILVESTRE LTDA',
  cnpj: '71.055.644/0001-25',
  address: 'RUA DOS ESPORTES, 45, CENTRO',
  city: 'MOEDA',
  state: 'MG',
  zipCode: '35.470-000',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'PENDENTE',
  PAID: 'PAGA',
  OVERDUE: 'VENCIDA',
  CANCELLED: 'CANCELADA',
  PARTIAL: 'PARCIAL',
};

export class RentalInvoicePdfService {
  private static formatCurrency(value?: number): string {
    if (value == null) return 'R$ 0,00';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private static formatDate(date?: string): string {
    if (!date) return '-';
    const clean = date.substring(0, 10);
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return date;
  }

  public static generatePDF(invoice: RentalInvoice, options: RentalInvoicePdfOptions = {}): void {
    const company = {
      name: options.company?.name || DEFAULT_COMPANY.name,
      cnpj: options.company?.cnpj || DEFAULT_COMPANY.cnpj,
      address: options.company?.address || DEFAULT_COMPANY.address,
      city: options.company?.city || DEFAULT_COMPANY.city,
      state: options.company?.state || DEFAULT_COMPANY.state,
      zipCode: options.company?.zipCode || DEFAULT_COMPANY.zipCode,
      phone: options.company?.phone,
    };

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;

    // Cabeçalho
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.6);
    doc.rect(margin, 10, contentWidth, 24);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(company.name, margin + 3, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`CNPJ: ${company.cnpj}`, margin + 3, 23);
    doc.text(`${company.address} - ${company.city}/${company.state} - CEP: ${company.zipCode}`, margin + 3, 28);
    if (company.phone) {
      doc.text(`Telefone: ${company.phone}`, margin + 3, 32);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('FATURA DE LOCAÇÃO', pageWidth - margin - 3, 17, { align: 'right' });
    doc.setFontSize(11);
    doc.text(`Nº ${invoice.number}`, pageWidth - margin - 3, 23, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Emissão: ${this.formatDate(invoice.issueDate)}`, pageWidth - margin - 3, 28, { align: 'right' });
    doc.text(`Status: ${STATUS_LABELS[invoice.status] || invoice.status}`, pageWidth - margin - 3, 32, { align: 'right' });

    let currentY = 40;

    // Destinatário
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, currentY, contentWidth, 24, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('DESTINATÁRIO', margin + 3, currentY + 5);

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text((invoice.clientName || '-').toUpperCase(), margin + 3, currentY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`CNPJ/CPF: ${invoice.clientCnpj || '-'}`, margin + 3, currentY + 16);
    if (invoice.clientIe) {
      doc.text(`Inscrição Estadual: ${invoice.clientIe}`, margin + 78, currentY + 16);
    }
    const addressLine = [
      invoice.clientAddress,
      invoice.clientCity && `${invoice.clientCity}/${invoice.clientState || ''}`,
      invoice.clientZipCode && `CEP: ${invoice.clientZipCode}`,
    ].filter(Boolean).join(' - ');
    doc.text(addressLine || '-', margin + 3, currentY + 21);

    currentY += 30;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      'RECEBI(EMOS) DE EMPRESA VIAÇÃO SÃO SILVESTRE LTDA. AS LOCAÇÕES CONSTANTES NESSA FATURA INDICADAS AO LADO.',
      margin,
      currentY
    );
    currentY += 6;

    // Itens: apenas veículos
    const rows = (invoice.items || []).map((item, index) => [
      String(index + 1),
      `${item.description || 'LOCAÇÃO DE VEÍCULO SEM CESSÃO DE MÃO DE OBRA'}${item.plate ? `\nPLACA: ${item.plate}` : ''}${item.model ? ` - ${item.model}` : ''}`,
      this.formatCurrency(item.amount),
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Item', 'Descrição / Veículo', 'Valor']],
      body: rows.length > 0 ? rows : [['1', 'Nenhum veículo vinculado à fatura.', 'R$ 0,00']],
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
        valign: 'top',
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 14, halign: 'center' },
        1: { cellWidth: contentWidth - 14 - 38 },
        2: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
      },
    });

    currentY = (doc as any).lastAutoTable?.finalY ?? currentY + 20;
    currentY += 6;

    // Resumo de valores
    const summaryWidth = 82;
    const summaryX = pageWidth - margin - summaryWidth;
    doc.setDrawColor(203, 213, 225);
    doc.rect(summaryX, currentY, summaryWidth, 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Valor Total da Fatura:', summaryX + 3, currentY + 6);
    doc.text('Desconto:', summaryX + 3, currentY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(this.formatCurrency(invoice.totalAmount), summaryX + summaryWidth - 3, currentY + 6, { align: 'right' });
    doc.text(invoice.discount ? `- ${this.formatCurrency(invoice.discount)}` : 'R$ 0,00', summaryX + summaryWidth - 3, currentY + 12, { align: 'right' });

    doc.setDrawColor(203, 213, 225);
    doc.line(summaryX, currentY + 15, summaryX + summaryWidth, currentY + 15);
    doc.setFontSize(9);
    doc.setTextColor(22, 101, 52);
    doc.text('Valor a receber:', summaryX + 3, currentY + 21);
    doc.text(this.formatCurrency(invoice.netAmount), summaryX + summaryWidth - 3, currentY + 21, { align: 'right' });

    // Dados bancários / informações adicionais
    const infoWidth = contentWidth - summaryWidth - 6;
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, currentY, infoWidth, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('DADOS BANCÁRIOS', margin + 3, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const bankLines = [
      invoice.bankName || 'BANCO DO BRASIL',
      invoice.bankAgency ? `AG: ${invoice.bankAgency}` : null,
      invoice.bankAccount ? `C/C: ${invoice.bankAccount}` : null,
    ].filter(Boolean).join('   ');
    doc.text(bankLines, margin + 3, currentY + 11);
    doc.text(`Forma de pagamento: ${invoice.paymentMethod || 'TRANSFERÊNCIA BANCÁRIA'}`, margin + 3, currentY + 17);
    doc.text(`Vencimento: ${this.formatDate(invoice.dueDate)}`, margin + 3, currentY + 22);

    currentY += 30;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('INFORMAÇÕES ADICIONAIS', margin, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`PERÍODO: ${this.formatDate(invoice.periodStart)} A ${this.formatDate(invoice.periodEnd)}`, margin, currentY);
    doc.text(`PEDIDO / CONTRATO: ${invoice.contractNumber || '-'}`, margin + 90, currentY);
    currentY += 5;

    if (invoice.notes) {
      const lines = doc.splitTextToSize(invoice.notes, contentWidth);
      doc.text(lines, margin, currentY);
      currentY += lines.length * 4.5;
    }

    currentY = Math.max(currentY + 10, 245);

    doc.setFontSize(7);
    doc.setTextColor(120, 113, 108);
    doc.text(
      'OBS: OPERAÇÃO SUJEITA A INCIDÊNCIA DE ISSQN CONFORME DISPOSTO NA LEI COMPLEMENTAR 15.',
      margin,
      currentY
    );

    currentY += 16;
    doc.setDrawColor(120, 113, 108);
    doc.line(margin, currentY, margin + 80, currentY);
    doc.line(pageWidth - margin - 80, currentY, pageWidth - margin, currentY);
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('DATA DO RECEBIMENTO', margin + 22, currentY + 4);
    doc.text('IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR', pageWidth - margin - 80 + 6, currentY + 4);

    doc.save(`fatura-locacao-${invoice.number}.pdf`);
  }
}
