import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { EPI, EPIType } from '@/types/epi';
import { EPIControlRecord, EPIControlStats } from '@/types/epiControl';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

class EPIStockReportGenerator {
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  private getTypeLabel(type: EPIType): string {
    const labels: Record<EPIType, string> = {
      'HELMET': 'Capacete',
      'GLOVES': 'Luvas',
      'SAFETY_GLASSES': 'Óculos',
      'SAFETY_SHOES': 'Calçados',
      'UNIFORM': 'Uniforme',
      'RESPIRATOR': 'Respirador',
      'OTHER': 'Outro'
    };
    return labels[type] || 'Outro';
  }

  /**
   * Gera relatório em lote de controle de EPI
   */
  async generateBatchReport(records: EPIControlRecord[]): Promise<void> {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPosition = 20;

      // Cabeçalho
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório em Lote - Controle de EPI', margin, yPosition);
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPosition);
      doc.text(`Total de Registros: ${records.length}`, pageWidth - 60, yPosition);
      
      yPosition += 15;

      // Tabela resumida
      const summaryData = records.map(record => [
        record.employeeName,
        record.employeeFunction,
        record.employeeCpf,
        this.formatDate(record.deliveryDate),
        record.equipmentItems.length.toString(),
        record.equipmentItems.reduce((sum, item) => sum + item.quantity, 0).toString()
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Funcionário', 'Função', 'CPF', 'Data Entrega', 'Qtd EPIs', 'Total Itens']],
        body: summaryData,
        theme: 'grid',
        headStyles: {
          fillColor: [220, 38, 38], // seguranca-red
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: margin, right: margin },
        styles: {
          cellPadding: 3
        }
      });

      // Adicionar detalhes de cada registro em páginas subsequentes
      let currentPage = 1;
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        
        if (i > 0) {
          doc.addPage();
          currentPage++;
        }

        let pageY = 20;

        // Título do registro
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Registro ${i + 1} de ${records.length}`, margin, pageY);
        
        pageY += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Funcionário: ${record.employeeName}`, margin, pageY);
        pageY += 6;
        doc.text(`Função: ${record.employeeFunction} | CPF: ${record.employeeCpf}`, margin, pageY);
        pageY += 6;
        doc.text(`Data de Admissão: ${this.formatDate(record.admissionDate)}`, margin, pageY);
        pageY += 6;
        doc.text(`Data de Entrega: ${this.formatDate(record.deliveryDate)}`, margin, pageY);
        pageY += 6;
        doc.text(`Responsável pela Entrega: ${record.responsibleDelivery}`, margin, pageY);
        
        pageY += 10;

        // Tabela de equipamentos
        const equipmentData = record.equipmentItems.map(item => [
          item.equipmentName,
          item.equipmentNumber,
          item.ca,
          item.quantity.toString(),
          this.formatDate(item.deliveryDate),
          item.replacedDate ? this.formatDate(item.replacedDate) : '-',
          item.replacementReason || '-'
        ]);

        (doc as any).autoTable({
          startY: pageY,
          head: [['EPI', 'Número', 'CA', 'Qtd', 'Data Entrega', 'Data Reposição', 'Motivo Reposição']],
          body: equipmentData,
          theme: 'grid',
          headStyles: {
            fillColor: [60, 60, 60],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8
          },
          bodyStyles: {
            fontSize: 7,
            textColor: [50, 50, 50]
          },
          margin: { left: margin, right: margin },
          styles: {
            cellPadding: 2
          }
        });

        // Observações se houver
        if (record.observations) {
          const finalY = (doc as any).lastAutoTable.finalY || pageY + 50;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Observações:', margin, finalY + 10);
          doc.setFont('helvetica', 'normal');
          const splitObservations = doc.splitTextToSize(record.observations, pageWidth - 2 * margin);
          doc.text(splitObservations, margin, finalY + 16);
        }
      }

      // Download
      const fileName = `relatorio-lote-controle-epi-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Erro ao gerar relatório em lote:', error);
      throw new Error('Erro ao gerar relatório em lote');
    }
  }

  /**
   * Gera relatório de estatísticas de EPI
   */
  async generateStatisticsReport(
    epis: EPI[],
    stats: {
      total: number;
      active: number;
      inactive: number;
      maintenance: number;
      expired: number;
      totalValue: number;
      assigned: number;
      available: number;
      byType: Record<EPIType, number>;
    },
    controlStats?: EPIControlStats
  ): Promise<void> {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPosition = 20;

      // Cabeçalho
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Estatísticas - EPIs', margin, yPosition);
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPosition);
      
      yPosition += 15;

      // Estatísticas Gerais
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Estatísticas Gerais de Estoque', margin, yPosition);
      yPosition += 10;

      const generalStats = [
        ['Total de EPIs', stats.total.toString()],
        ['EPIs Ativos', stats.active.toString()],
        ['EPIs Inativos', stats.inactive.toString()],
        ['EPIs em Manutenção', stats.maintenance.toString()],
        ['EPIs Expirados', stats.expired.toString()],
        ['Valor Total do Estoque', this.formatCurrency(stats.totalValue)],
        ['Itens Atribuídos', stats.assigned.toString()],
        ['Itens Disponíveis', stats.available.toString()]
      ];

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Métrica', 'Valor']],
        body: generalStats,
        theme: 'striped',
        headStyles: {
          fillColor: [220, 38, 38],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [50, 50, 50]
        },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 60, halign: 'right' }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Estatísticas por Tipo
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Distribuição por Tipo', margin, yPosition);
      yPosition += 10;

      const typeStats = Object.entries(stats.byType).map(([type, count]) => [
        this.getTypeLabel(type as EPIType),
        count.toString()
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Tipo de EPI', 'Quantidade']],
        body: typeStats,
        theme: 'striped',
        headStyles: {
          fillColor: [60, 60, 60],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [50, 50, 50]
        },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 60, halign: 'right' }
        }
      });

      // Se houver estatísticas de controle, adicionar em nova página
      if (controlStats) {
        doc.addPage();
        yPosition = 20;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Estatísticas de Controle de EPI', margin, yPosition);
        yPosition += 10;

        const controlStatsData = [
          ['Total de Registros', controlStats.totalRecords.toString()],
          ['Funcionários Ativos', controlStats.activeEmployees.toString()],
          ['Funcionários Demitidos', controlStats.dismissedEmployees.toString()],
          ['Total de Itens de Equipamento', controlStats.totalEquipmentItems.toString()],
          ['Reposições Pendentes', controlStats.pendingReplacements.toString()],
          ['Equipamentos Expirados', controlStats.expiredEquipment.toString()]
        ];

        (doc as any).autoTable({
          startY: yPosition,
          head: [['Métrica', 'Valor']],
          body: controlStatsData,
          theme: 'striped',
          headStyles: {
            fillColor: [60, 60, 60],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10
          },
          bodyStyles: {
            fontSize: 9,
            textColor: [50, 50, 50]
          },
          margin: { left: margin, right: margin },
          columnStyles: {
            0: { cellWidth: 120 },
            1: { cellWidth: 60, halign: 'right' }
          }
        });
      }

      // Tabela de EPIs (resumo)
      doc.addPage();
      yPosition = 20;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo de EPIs no Estoque', margin, yPosition);
      yPosition += 10;

      const epiSummary = epis.map(epi => [
        epi.name,
        this.getTypeLabel(epi.type),
        epi.quantity.toString(),
        epi.availableQuantity.toString(),
        (epi.quantity - epi.availableQuantity).toString(),
        this.formatCurrency(epi.unitPrice),
        this.formatCurrency(epi.unitPrice * epi.quantity)
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Nome', 'Tipo', 'Total', 'Disponível', 'Atribuído', 'Preço Unit.', 'Valor Total']],
        body: epiSummary,
        theme: 'grid',
        headStyles: {
          fillColor: [60, 60, 60],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [50, 50, 50]
        },
        margin: { left: margin, right: margin },
        styles: {
          cellPadding: 2,
          overflow: 'linebreak'
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 25 },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 25, halign: 'right' },
          6: { cellWidth: 25, halign: 'right' }
        }
      });

      // Download
      const fileName = `relatorio-estatisticas-epi-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Erro ao gerar relatório de estatísticas:', error);
      throw new Error('Erro ao gerar relatório de estatísticas');
    }
  }
}

export const epiStockReportGenerator = new EPIStockReportGenerator();
export default epiStockReportGenerator;
