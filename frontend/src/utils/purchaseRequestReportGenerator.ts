import { PurchaseRequest } from '@/services/purchaseRequestService';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

export interface PurchaseRequestReportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  minValue?: number;
  maxValue?: number;
}

class PurchaseRequestReportGenerator {
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
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Rascunho',
      SUBMITTED: 'Enviada',
      PENDING: 'Pendente',
      IN_PROCESS: 'Em Processo',
      APPROVED: 'Aprovada',
      REJECTED: 'Rejeitada',
      COMPLETED: 'Concluída',
      CANCELLED: 'Cancelada',
    };
    return labels[status] || status;
  }

  private getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      URGENT: 'Urgente',
      HIGH: 'Alta',
      MEDIUM: 'Média',
      LOW: 'Baixa',
    };
    return labels[priority] || priority;
  }

  private filterRequests(
    requests: PurchaseRequest[],
    filters: PurchaseRequestReportFilters
  ): PurchaseRequest[] {
    let filtered = [...requests];

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((req) => {
        const dateToCompare = req.requestDate || req.createdAt;
        if (!dateToCompare) return false;
        const reqDate = new Date(dateToCompare);
        reqDate.setHours(0, 0, 0, 0);
        return reqDate >= startDate;
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((req) => {
        const dateToCompare = req.requestDate || req.createdAt;
        if (!dateToCompare) return false;
        const reqDate = new Date(dateToCompare);
        reqDate.setHours(0, 0, 0, 0);
        return reqDate <= endDate;
      });
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter((req) => req.status === filters.status);
    }

    if (filters.minValue !== undefined && filters.minValue !== null && filters.minValue > 0) {
      filtered = filtered.filter((req) => {
        const value = req.totalValue || req.estimatedTotal || 0;
        return value >= filters.minValue!;
      });
    }

    if (filters.maxValue !== undefined && filters.maxValue !== null && filters.maxValue > 0) {
      filtered = filtered.filter((req) => {
        const value = req.totalValue || req.estimatedTotal || 0;
        return value <= filters.maxValue!;
      });
    }

    return filtered;
  }

  public async generatePDF(
    requests: PurchaseRequest[],
    filters: PurchaseRequestReportFilters
  ): Promise<Blob> {
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default;

      const filteredRequests = this.filterRequests(requests, filters);

      // Criar documento PDF em Landscape A4 (largura 297mm, altura 210mm)
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 10;
      const marginRight = 10;
      const contentWidth = pageWidth - marginLeft - marginRight; // 277mm

      let y = 10;

      // 1. CABEÇALHO INSTITUCIONAL (PADRÃO OS EXECUTIVO)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text('FLUXBUS - GESTÃO INTEGRADA DE FROTAS & SUPRIMENTOS', marginLeft, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text('CNPJ: 00.000.000/0001-00 • MÓDULO DE SOLICITAÇÕES DE COMPRA', marginLeft, y + 9.5);

      // Título do Documento à Direita
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // Dark Slate
      doc.text('RELATÓRIO DE SOLICITAÇÕES DE COMPRA', pageWidth - marginRight, y + 4, { align: 'right' });

      // Badge de Status / Filtro
      const statusBadgeText = filters.status && filters.status !== 'all' 
        ? `STATUS: ${this.getStatusLabel(filters.status).toUpperCase()}`
        : 'TODOS OS STATUS';

      const badgeWidth = Math.max(36, doc.getTextWidth(statusBadgeText) + 6);
      const badgeHeight = 5.5;
      const badgeX = pageWidth - marginRight - badgeWidth;
      const badgeY = y + 6;

      doc.setFillColor(241, 245, 249); // Slate-100
      doc.setDrawColor(203, 213, 225); // Slate-300
      doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);
      doc.text(statusBadgeText, badgeX + badgeWidth / 2, badgeY + 3.8, { align: 'center' });

      // Protocolo e Data de Emissão
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const protocol = `SOL-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Protocolo: ${protocol} • Emissão: ${dateStr}`, pageWidth - marginRight, y + 15.5, { align: 'right' });

      y += 18;

      // Linha divisória estilo OS
      doc.setDrawColor(30, 41, 59); // Dark Slate
      doc.setLineWidth(0.8);
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 4;

      // 2. QUADRO DE FILTROS APLICADOS
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginLeft, y, contentWidth, 8.5, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text('PARÂMETROS:', marginLeft + 3, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);

      const filterParts: string[] = [];
      if (filters.startDate || filters.endDate) {
        if (filters.startDate && filters.endDate) {
          filterParts.push(`Período: ${this.formatDate(filters.startDate)} a ${this.formatDate(filters.endDate)}`);
        } else if (filters.startDate) {
          filterParts.push(`A partir de: ${this.formatDate(filters.startDate)}`);
        } else {
          filterParts.push(`Até: ${this.formatDate(filters.endDate!)}`);
        }
      } else {
        filterParts.push('Período: Completo');
      }

      if (filters.minValue || filters.maxValue) {
        if (filters.minValue && filters.maxValue) {
          filterParts.push(`Faixa de Valor: ${this.formatCurrency(filters.minValue)} a ${this.formatCurrency(filters.maxValue)}`);
        } else if (filters.minValue) {
          filterParts.push(`Valor Mínimo: ${this.formatCurrency(filters.minValue)}`);
        } else {
          filterParts.push(`Valor Máximo: ${this.formatCurrency(filters.maxValue!)}`);
        }
      }

      doc.text(filterParts.join(' • '), marginLeft + 26, y + 5.5);

      y += 12.5;

      // 3. CARDS DE RESUMO (KPIS)
      const totalValue = filteredRequests.reduce(
        (sum, req) => sum + (req.totalValue || req.estimatedTotal || 0),
        0
      );
      const pendingCount = filteredRequests.filter((r) => r.status === 'PENDING' || r.status === 'SUBMITTED').length;
      const approvedCount = filteredRequests.filter((r) => r.status === 'APPROVED' || r.status === 'COMPLETED').length;

      const kpis = [
        { label: 'TOTAL DE SOLICITAÇÕES', val: filteredRequests.length.toString() },
        { label: 'VALOR TOTAL ESTIMADO', val: this.formatCurrency(totalValue) },
        { label: 'PENDENTES / EM ANÁLISE', val: pendingCount.toString() },
        { label: 'APROVADAS / CONCLUÍDAS', val: approvedCount.toString() },
      ];

      const cardGap = 3;
      const cardWidth = (contentWidth - (cardGap * (kpis.length - 1))) / kpis.length;
      const cardHeight = 11;

      kpis.forEach((kpi, idx) => {
        const cardX = marginLeft + idx * (cardWidth + cardGap);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(cardX, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label, cardX + 3, y + 4.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(kpi.val, cardX + 3, y + 9.5);
      });

      y += cardHeight + 4;

      // 4. CONFIGURAÇÃO DA TABELA (EQUILIBRADA PARA EXACT 277MM DE LARGURA)
      const headers = [
        'Número',
        'Título / Aplicação',
        'Solicitante',
        'Depto',
        'Status',
        'Prioridade',
        'Urgência',
        'Data Sol.',
        'Data Nec.',
        'Aprovador',
        'Data Apr.',
        'Fornecedor',
        'Valor (R$)',
      ];

      const rows = filteredRequests.map((req) => [
        req.requestNumber || '-',
        req.title || '-',
        req.requesterName || '-',
        req.department || '-',
        this.getStatusLabel(req.status),
        this.getPriorityLabel(req.priority),
        req.urgency || '-',
        req.requestDate ? this.formatDate(req.requestDate) : '-',
        req.requiredDate ? this.formatDate(req.requiredDate) : '-',
        req.approverName || req.approvedBy || '-',
        req.approvalDate ? this.formatDate(req.approvalDate) : '-',
        req.supplier || '-',
        this.formatCurrency(req.totalValue || req.estimatedTotal || 0),
      ]);

      // Total width: 26+38+26+18+18+16+16+18+18+24+18+22+20 = 278mm (se encaixa perfeitamente em 277mm com margem 10mm!)
      autoTable(doc, {
        startY: y,
        head: [headers],
        body: rows,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59], // Dark Slate (#1e293b)
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          cellPadding: 2,
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [51, 65, 85],
          cellPadding: 1.8
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { top: 15, left: marginLeft, right: marginRight, bottom: 15 },
        styles: {
          overflow: 'linebreak',
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 26, halign: 'center' }, // Número
          1: { cellWidth: 38, halign: 'left' },   // Título / Aplicação
          2: { cellWidth: 26, halign: 'left' },   // Solicitante
          3: { cellWidth: 18, halign: 'left' },   // Depto
          4: { cellWidth: 18, halign: 'center' }, // Status
          5: { cellWidth: 16, halign: 'center' }, // Prioridade
          6: { cellWidth: 16, halign: 'center' }, // Urgência
          7: { cellWidth: 18, halign: 'center' }, // Data Sol.
          8: { cellWidth: 18, halign: 'center' }, // Data Nec.
          9: { cellWidth: 24, halign: 'left' },   // Aprovador
          10: { cellWidth: 18, halign: 'center' },// Data Apr.
          11: { cellWidth: 22, halign: 'left' },  // Fornecedor
          12: { cellWidth: 20, halign: 'right' }, // Valor
        },
      });

      // 5. RODAPÉ PAGINADO
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const footerY = pageHeight - 7;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(marginLeft, footerY - 2.5, pageWidth - marginRight, footerY - 2.5);

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('FluxBus FleetManager • Sistema de Gestão Integrada de Frotas & Suprimentos', marginLeft, footerY);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - marginRight, footerY, { align: 'right' });
      }

      return doc.output('blob');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Erro ao gerar relatório PDF');
    }
  }
}

export const purchaseRequestReportGenerator = new PurchaseRequestReportGenerator();

