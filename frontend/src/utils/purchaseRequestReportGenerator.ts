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
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Rascunho',
      SUBMITTED: 'Enviada',
      PENDING: 'Pendente',
      IN_PROCESS: 'Em Processo',
      APPROVED: 'Aprovada',
      REJECTED: 'Rejeitada',
      COMPLETED: 'Completada',
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

    // Filtro por data - usar requestDate ou createdAt como fallback
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((req) => {
        // Usar requestDate se disponível, senão usar createdAt
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
        // Usar requestDate se disponível, senão usar createdAt
        const dateToCompare = req.requestDate || req.createdAt;
        if (!dateToCompare) return false;
        const reqDate = new Date(dateToCompare);
        reqDate.setHours(0, 0, 0, 0);
        return reqDate <= endDate;
      });
    }

    // Filtro por status
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter((req) => req.status === filters.status);
    }

    // Filtro por valor - só aplicar se o valor for maior que 0
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
      // Importação dinâmica para garantir que os módulos sejam carregados
      const jsPDF = (await import('jspdf')).default;
      const autoTable = await import('jspdf-autotable');
      
      console.log('Total de solicitações recebidas:', requests.length);
      console.log('Filtros aplicados:', filters);
      console.log('Primeira solicitação (exemplo):', requests[0]);
      
      // Filtrar solicitações
      const filteredRequests = this.filterRequests(requests, filters);
      
      console.log('Solicitações após filtro:', filteredRequests.length);
      if (filteredRequests.length > 0) {
        console.log('Primeira solicitação filtrada (exemplo):', filteredRequests[0]);
      }

      // Criar documento PDF
      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape para mais espaço
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;

      // Cabeçalho
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Solicitações de Compra', margin, 20);

      // Informações do relatório
      let yPos = 30;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Período
      if (filters.startDate || filters.endDate) {
        const periodText = filters.startDate && filters.endDate
          ? `Período: ${this.formatDate(filters.startDate)} a ${this.formatDate(filters.endDate)}`
          : filters.startDate
            ? `A partir de: ${this.formatDate(filters.startDate)}`
            : `Até: ${this.formatDate(filters.endDate!)}`;
        doc.text(periodText, margin, yPos);
        yPos += 6;
      }

      // Status
      if (filters.status && filters.status !== 'all') {
        doc.text(`Status: ${this.getStatusLabel(filters.status)}`, margin, yPos);
        yPos += 6;
      }

      // Valor
      if (filters.minValue || filters.maxValue) {
        let valueText = 'Valor: ';
        if (filters.minValue && filters.maxValue) {
          valueText += `${this.formatCurrency(filters.minValue)} a ${this.formatCurrency(filters.maxValue)}`;
        } else if (filters.minValue) {
          valueText += `a partir de ${this.formatCurrency(filters.minValue)}`;
        } else if (filters.maxValue) {
          valueText += `até ${this.formatCurrency(filters.maxValue)}`;
        }
        doc.text(valueText, margin, yPos);
        yPos += 6;
      }

      // Data de geração
      doc.setFontSize(9);
      doc.text(
        `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        pageWidth - margin - 60,
        20
      );

      // Total de registros
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total de solicitações: ${filteredRequests.length}`, margin, yPos + 2);

      // Preparar dados da tabela com todos os campos
      const headers = [
        'Número',
        'Título',
        'Solicitante',
        'Departamento',
        'Status',
        'Prioridade',
        'Urgência',
        'Data Solicitação',
        'Data Necessária',
        'Aprovador por',
        'Data Aprovação',
        'Fornecedor',
        'Valor',
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

      // Calcular totais
      const totalValue = filteredRequests.reduce(
        (sum, req) => sum + (req.totalValue || req.estimatedTotal || 0),
        0
      );

      // Adicionar tabela usando autoTable
      autoTable.default(doc, {
        startY: yPos + 8,
        head: [headers],
        body: rows,
        theme: 'grid',
        headStyles: {
          fillColor: [220, 53, 69], // seguranca-red
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [50, 50, 50],
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: margin, right: margin },
        styles: {
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap',
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Número
          1: { cellWidth: 40 }, // Título
          2: { cellWidth: 30 }, // Solicitante
          3: { cellWidth: 25 }, // Departamento
          4: { cellWidth: 20 }, // Status
          5: { cellWidth: 20 }, // Prioridade
          6: { cellWidth: 20 }, // Urgência
          7: { cellWidth: 25 }, // Data Solicitação
          8: { cellWidth: 25 }, // Data Necessária
          9: { cellWidth: 30 }, // Aprovador por
          10: { cellWidth: 25 }, // Data Aprovação
          11: { cellWidth: 30 }, // Fornecedor
          12: { cellWidth: 25, halign: 'right' }, // Valor
        },
      });

      // Adicionar resumo no final
      const finalY = (doc as any).lastAutoTable?.finalY || yPos + 50;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Valor Total: ${this.formatCurrency(totalValue)}`,
        pageWidth - margin - 50,
        finalY + 10
      );

      // Retornar PDF como blob ao invés de fazer download direto
      const pdfBlob = doc.output('blob');
      return pdfBlob;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Erro ao gerar relatório PDF');
    }
  }
}

export const purchaseRequestReportGenerator = new PurchaseRequestReportGenerator();

