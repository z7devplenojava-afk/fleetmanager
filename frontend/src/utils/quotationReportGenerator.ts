import { Quotation } from '@/services/quotationService';

export interface QuotationReportFilters {
  quoteNumber?: string;
  title?: string;
  supplierId?: string;
  status?: string;
  startValidUntil?: string;
  endValidUntil?: string;
  assignedToId?: string;
  minValue?: number;
  maxValue?: number;
}

class QuotationReportGenerator {
  private formatCurrency(value: number | string): string {
    const numericValue =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? parseFloat(value.replace(/\./g, '').replace(',', '.'))
          : 0;
    const numeric = Number.isFinite(numericValue) ? numericValue : 0;
    const rounded = Math.round(numeric * 100) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rounded);
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Rascunho',
      SENT: 'Enviada',
      APPROVED: 'Aprovada',
      REJECTED: 'Rejeitada',
      EXPIRED: 'Expirada',
    };
    return labels[status] || status;
  }

  private filterQuotations(
    quotations: Quotation[],
    filters: QuotationReportFilters
  ): Quotation[] {
    let filtered = [...quotations];

    // Filtro por número
    if (filters.quoteNumber) {
      const searchTerm = filters.quoteNumber.toLowerCase().trim();
      filtered = filtered.filter((q) =>
        q.quoteNumber.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por título
    if (filters.title) {
      const searchTerm = filters.title.toLowerCase().trim();
      filtered = filtered.filter((q) =>
        q.title.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por fornecedor
    if (filters.supplierId) {
      filtered = filtered.filter((q) => q.supplierId === filters.supplierId);
    }

    // Filtro por status
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter((q) => q.status === filters.status);
    }

    // Filtro por validade (data)
    if (filters.startValidUntil) {
      const startDate = new Date(filters.startValidUntil);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((q) => {
        if (!q.validUntil) return false;
        const validDate = new Date(q.validUntil);
        validDate.setHours(0, 0, 0, 0);
        return validDate >= startDate;
      });
    }

    if (filters.endValidUntil) {
      const endDate = new Date(filters.endValidUntil);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((q) => {
        if (!q.validUntil) return false;
        const validDate = new Date(q.validUntil);
        validDate.setHours(0, 0, 0, 0);
        return validDate <= endDate;
      });
    }

    // Filtro por responsável
    if (filters.assignedToId) {
      filtered = filtered.filter((q) => q.assignedToId === filters.assignedToId);
    }

    // Filtro por valor mínimo
    if (filters.minValue && filters.minValue > 0) {
      filtered = filtered.filter((q) => q.totalValue >= filters.minValue!);
    }

    // Filtro por valor máximo
    if (filters.maxValue && filters.maxValue > 0) {
      filtered = filtered.filter((q) => q.totalValue <= filters.maxValue!);
    }

    return filtered;
  }

  async generatePDF(
    quotations: Quotation[],
    filters: QuotationReportFilters
  ): Promise<Blob> {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = await import('jspdf-autotable');

    const filtered = this.filterQuotations(quotations, filters);

    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape para mais espaço
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = 15;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Cotações de Compra', margin, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
      pageWidth - margin - 60,
      15
    );

    yPos += 5;
    doc.setFontSize(9);
    doc.text(`Total de cotações: ${filtered.length}`, margin, yPos);

    // Informações dos filtros aplicados
    const activeFilters: string[] = [];
    if (filters.quoteNumber) activeFilters.push(`Número: ${filters.quoteNumber}`);
    if (filters.title) activeFilters.push(`Título: ${filters.title}`);
    if (filters.status && filters.status !== 'all')
      activeFilters.push(`Status: ${this.getStatusLabel(filters.status)}`);
    if (filters.startValidUntil || filters.endValidUntil) {
      const dateRange = `${filters.startValidUntil || 'Início'} até ${filters.endValidUntil || 'Fim'}`;
      activeFilters.push(`Validade: ${dateRange}`);
    }
    if (filters.minValue && filters.minValue > 0)
      activeFilters.push(`Valor mínimo: ${this.formatCurrency(filters.minValue)}`);
    if (filters.maxValue && filters.maxValue > 0)
      activeFilters.push(`Valor máximo: ${this.formatCurrency(filters.maxValue)}`);

    if (activeFilters.length > 0) {
      yPos += 5;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Filtros aplicados: ${activeFilters.join(' | ')}`, margin, yPos);
    }

    // Tabela
    yPos += 10;
    const tableData = filtered.map((q) => [
      q.quoteNumber || '-',
      q.title || '-',
      q.supplierName || 'Não informado',
      this.getStatusLabel(q.status),
      this.formatDate(q.validUntil),
      q.assignedToName || 'Não atribuído',
      this.formatCurrency(q.totalValue),
    ]);

    autoTable.default(doc, {
      startY: yPos,
      head: [
        [
          'Número',
          'Título',
          'Fornecedor',
          'Status',
          'Válida Até',
          'Responsável',
          'Valor Total',
        ],
      ],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [220, 38, 38], // Vermelho do sistema
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [0, 0, 0],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Número
        1: { cellWidth: 50 }, // Título
        2: { cellWidth: 40 }, // Fornecedor
        3: { cellWidth: 25 }, // Status
        4: { cellWidth: 25 }, // Válida Até
        5: { cellWidth: 35 }, // Responsável
        6: { cellWidth: 30 }, // Valor
      },
      margin: { left: margin, right: margin },
      styles: {
        overflow: 'linebreak',
        cellPadding: 2,
      },
    });

    // Gerar blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }
}

export const quotationReportGenerator = new QuotationReportGenerator();
















