// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

import { companyConfigService } from '@/services/companyConfigService';

export interface EquipmentReportData {
  employeeId?: string;
  employeeName?: string;
  totalEquipment?: number;
  activeEquipment?: number;
  inactiveEquipment?: number;
  equipmentDetails?: Array<{
    equipmentId?: string;
    equipmentName?: string;
    serialNumber?: string;
    status?: string;
    assignedDate?: string;
    lastMovement?: string;
  }>;
  [key: string]: any;
}

export interface EquipmentReportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  equipmentType?: string;
}

class EquipmentReportGenerator {
  private formatDate(dateString?: string): string {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  }

  private formatDateTime(dateString?: string): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  }

  private getStatusLabel(status?: string): string {
    if (!status) return '-';
    const labels: Record<string, string> = {
      'ATIVO': 'Ativo',
      'INATIVO': 'Inativo',
      'EM_USO': 'Em Uso',
      'EM_MANUTENCAO': 'Em Manutenção',
      'AGUARDANDO_DESCARTE': 'Aguardando Descarte',
      'EM_ESTOQUE': 'Em Estoque',
      'BAIXADO': 'Baixado',
    };
    return labels[status.toUpperCase()] || status;
  }

  private async getCompanyName(): Promise<string> {
    try {
      const config = await companyConfigService.getActiveConfig();
      return config?.name || 'Secure Guard Segurança Ltda';
    } catch (error) {
      console.error('Erro ao buscar nome da empresa:', error);
      return 'Secure Guard Segurança Ltda';
    }
  }

  private async addFooter(doc: any, pageWidth: number, pageHeight: number, yPos: number): Promise<void> {
    const companyName = await this.getCompanyName();
    const systemName = 'Sistema Fleet Manager';
    
    if (yPos < pageHeight - 20) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(128, 128, 128);
      
      // Nome da empresa
      doc.text(
        companyName,
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
      );
      
      // Nome do sistema
      doc.text(
        `Relatório gerado automaticamente pelo ${systemName}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  }

  async generateEquipmentByEmployeePDF(
    reportData: EquipmentReportData[],
    filters?: EquipmentReportFilters
  ): Promise<Blob> {
    try {
      // Importação dinâmica
      const jsPDF = (await import('jspdf')).default;
      const autoTable = await import('jspdf-autotable');

      // Criar documento PDF
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = 20;

      // Cabeçalho
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 53, 69); // Vermelho do sistema
      doc.text('Relatório de Equipamentos por Funcionário', margin, yPos);

      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
        margin,
        yPos
      );

      // Informações do período
      if (filters?.startDate || filters?.endDate) {
        yPos += 6;
        doc.setFontSize(9);
        const periodText = filters.startDate && filters.endDate
          ? `Período: ${this.formatDate(filters.startDate)} a ${this.formatDate(filters.endDate)}`
          : filters.startDate
            ? `A partir de: ${this.formatDate(filters.startDate)}`
            : `Até: ${this.formatDate(filters.endDate!)}`;
        doc.text(periodText, margin, yPos);
      }

      yPos += 10;

      // Processar cada funcionário
      for (let i = 0; i < reportData.length; i++) {
        const employee = reportData[i];
        
        // Verificar se precisa de nova página
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
        }

        // Nome do funcionário
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(employee.employeeName || `Funcionário ${i + 1}`, margin, yPos);

        yPos += 8;

        // Cards de resumo
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        const cardWidth = 30;
        const cardHeight = 15;
        const cardSpacing = 5;
        const startX = margin;

        // Card Total
        doc.setFillColor(59, 130, 246); // Azul
        doc.roundedRect(startX, yPos - 5, cardWidth, cardHeight, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(`${employee.totalEquipment || 0}`, startX + 5, yPos + 2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('Total', startX + 5, yPos + 7);

        // Card Ativos
        doc.setFillColor(34, 197, 94); // Verde
        doc.roundedRect(startX + cardWidth + cardSpacing, yPos - 5, cardWidth, cardHeight, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`${employee.activeEquipment || 0}`, startX + cardWidth + cardSpacing + 5, yPos + 2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('Ativos', startX + cardWidth + cardSpacing + 5, yPos + 7);

        // Card Inativos
        doc.setFillColor(239, 68, 68); // Vermelho
        doc.roundedRect(startX + (cardWidth + cardSpacing) * 2, yPos - 5, cardWidth, cardHeight, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`${employee.inactiveEquipment || 0}`, startX + (cardWidth + cardSpacing) * 2 + 5, yPos + 2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('Inativos', startX + (cardWidth + cardSpacing) * 2 + 5, yPos + 7);

        doc.setTextColor(0, 0, 0);
        yPos += 20;

        // Tabela de equipamentos
        if (employee.equipmentDetails && employee.equipmentDetails.length > 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Equipamentos:', margin, yPos);

          yPos += 5;

          const equipmentRows = employee.equipmentDetails.map((eq) => [
            eq.equipmentName || '-',
            eq.serialNumber ? `S/N: ${eq.serialNumber}` : '-',
            this.getStatusLabel(eq.status),
          ]);

          autoTable.default(doc, {
            startY: yPos,
            head: [['Equipamento', 'Número de Série', 'Status']],
            body: equipmentRows,
            theme: 'striped',
            headStyles: {
              fillColor: [220, 53, 69], // Vermelho do sistema
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
              0: { cellWidth: 80 }, // Equipamento
              1: { cellWidth: 50 }, // Número de Série
              2: { cellWidth: 40 }, // Status
            },
            margin: { left: margin, right: margin },
            styles: {
              overflow: 'linebreak',
              cellPadding: 3,
            },
          });

          yPos = (doc as any).lastAutoTable?.finalY || yPos + 30;
        } else {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(128, 128, 128);
          doc.text('Nenhum equipamento encontrado.', margin, yPos);
          doc.setTextColor(0, 0, 0);
          yPos += 10;
        }

        // Espaço entre funcionários
        yPos += 10;

        // Linha separadora
        if (i < reportData.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 10;
        }
      }

      // Rodapé
      const finalY = (doc as any).lastAutoTable?.finalY || yPos;
      await this.addFooter(doc, pageWidth, pageHeight, finalY);

      // Retornar PDF como blob
      const pdfBlob = doc.output('blob');
      return pdfBlob;
    } catch (error) {
      console.error('Erro ao gerar PDF de equipamentos:', error);
      throw new Error('Erro ao gerar relatório PDF');
    }
  }

  async generateWeaponValidityPDF(
    reportData: any[],
    filters?: EquipmentReportFilters
  ): Promise<Blob> {
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = await import('jspdf-autotable');

      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = 20;

      // Cabeçalho
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 53, 69);
      doc.text('Relatório de Validade de Armas', margin, yPos);

      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
        margin,
        yPos
      );

      if (filters?.startDate || filters?.endDate) {
        yPos += 6;
        doc.setFontSize(9);
        const periodText = filters.startDate && filters.endDate
          ? `Período: ${this.formatDate(filters.startDate)} a ${this.formatDate(filters.endDate)}`
          : filters.startDate
            ? `A partir de: ${this.formatDate(filters.startDate)}`
            : `Até: ${this.formatDate(filters.endDate!)}`;
        doc.text(periodText, margin, yPos);
      }

      yPos += 10;

      // Tabela
      const tableData = reportData.map((weapon) => [
        weapon.weaponName || '-',
        weapon.serialNumber || '-',
        weapon.registrationNumber || '-',
        this.formatDate(weapon.validityDate),
        weapon.daysToExpire?.toString() || '-',
        this.getStatusLabel(weapon.status),
        weapon.owner || '-',
        this.formatDate(weapon.lastInspection),
      ]);

      autoTable.default(doc, {
        startY: yPos,
        head: [['Arma', 'Número de Série', 'Registro', 'Validade', 'Dias para Vencer', 'Status', 'Proprietário', 'Última Inspeção']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [220, 53, 69],
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
        margin: { left: margin, right: margin },
        styles: {
          overflow: 'linebreak',
          cellPadding: 3,
        },
      });

      // Rodapé
      const finalY = (doc as any).lastAutoTable?.finalY || yPos;
      await this.addFooter(doc, pageWidth, pageHeight, finalY);

      const pdfBlob = doc.output('blob');
      return pdfBlob;
    } catch (error) {
      console.error('Erro ao gerar PDF de validade de armas:', error);
      throw new Error('Erro ao gerar relatório PDF');
    }
  }

  async generateGeneralReportPDF(
    reportData: any[],
    filters?: EquipmentReportFilters
  ): Promise<Blob> {
    try {
      console.log('📄 Gerando PDF de relatório geral com dados:', reportData);
      
      const jsPDF = (await import('jspdf')).default;
      const autoTable = await import('jspdf-autotable');

      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = 20;

      // Cabeçalho
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 53, 69);
      doc.text('Relatório Geral de Equipamentos', margin, yPos);

      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
        margin,
        yPos
      );

      if (filters?.startDate || filters?.endDate) {
        yPos += 6;
        doc.setFontSize(9);
        const periodText = filters.startDate && filters.endDate
          ? `Período: ${this.formatDate(filters.startDate)} a ${this.formatDate(filters.endDate)}`
          : filters.startDate
            ? `A partir de: ${this.formatDate(filters.startDate)}`
            : `Até: ${this.formatDate(filters.endDate!)}`;
        doc.text(periodText, margin, yPos);
      }

      yPos += 15;

      // Encontrar o resumo
      const summaryItem = reportData.find((item: any) => item.summary);
      const summary = summaryItem?.summary;

      if (summary) {
        // Resumo Geral
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumo Geral', margin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total de Equipamentos: ${summary.totalEquipment || 0}`, margin, yPos);
        yPos += 6;
        doc.text(`Ativos: ${summary.activeEquipment || 0}`, margin, yPos);
        yPos += 6;
        doc.text(`Inativos: ${summary.inactiveEquipment || 0}`, margin, yPos);
        yPos += 6;
        doc.text(`Em Manutenção: ${summary.maintenanceEquipment || 0}`, margin, yPos);
        yPos += 6;
        doc.text(`Total de Funcionários: ${summary.totalEmployees || 0}`, margin, yPos);
        yPos += 10;

        // Tipos de Equipamentos
        if (summary.equipmentTypes) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Equipamentos por Tipo', margin, yPos);
          yPos += 8;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const types = summary.equipmentTypes;
          if (types.weapons) doc.text(`Armas: ${types.weapons}`, margin, yPos);
          yPos += 6;
          if (types.uniforms) doc.text(`Uniformes: ${types.uniforms}`, margin, yPos);
          yPos += 6;
          if (types.radios) doc.text(`Rádios: ${types.radios}`, margin, yPos);
          yPos += 6;
          if (types.other) doc.text(`Outros: ${types.other}`, margin, yPos);
          yPos += 10;
        }
      }

      // Detalhes por tipo
      const typeDetails = reportData.filter((item: any) => item.equipmentType && !item.summary);
      
      if (typeDetails.length > 0) {
        for (const typeDetail of typeDetails) {
          // Verificar se precisa de nova página
          if (yPos > pageHeight - 80) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(typeDetail.equipmentType || 'Tipo Desconhecido', margin, yPos);
          yPos += 8;

          // Estatísticas do tipo
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Total: ${typeDetail.total || 0}`, margin, yPos);
          yPos += 6;
          doc.text(`Ativos: ${typeDetail.active || 0}`, margin, yPos);
          yPos += 6;
          doc.text(`Inativos: ${typeDetail.inactive || 0}`, margin, yPos);
          yPos += 8;

          // Tabela de detalhes
          if (typeDetail.details && Array.isArray(typeDetail.details) && typeDetail.details.length > 0) {
            const detailsRows = typeDetail.details.map((detail: any) => [
              detail.name || '-',
              detail.assignedTo || 'Não atribuído',
              this.getStatusLabel(detail.status),
            ]);

            autoTable.default(doc, {
              startY: yPos,
              head: [['Equipamento', 'Atribuído a', 'Status']],
              body: detailsRows,
              theme: 'striped',
              headStyles: {
                fillColor: [220, 53, 69],
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
                0: { cellWidth: 80 },
                1: { cellWidth: 60 },
                2: { cellWidth: 40 },
              },
              margin: { left: margin, right: margin },
              styles: {
                overflow: 'linebreak',
                cellPadding: 3,
              },
            });

            yPos = (doc as any).lastAutoTable?.finalY || yPos + 30;
          }

          yPos += 10;
        }
      }

      // Rodapé
      const finalY = (doc as any).lastAutoTable?.finalY || yPos;
      await this.addFooter(doc, pageWidth, pageHeight, finalY);

      const pdfBlob = doc.output('blob');
      return pdfBlob;
    } catch (error) {
      console.error('Erro ao gerar PDF de relatório geral:', error);
      throw new Error('Erro ao gerar relatório PDF');
    }
  }

  async generatePDF(
    reportType: string,
    reportData: any[],
    filters?: EquipmentReportFilters
  ): Promise<Blob> {
    console.log('🔍 generatePDF chamado com:', { reportType, dataLength: reportData.length, filters });
    
    switch (reportType) {
      case 'equipment_by_employee':
        console.log('📄 Gerando PDF: equipment_by_employee');
        return this.generateEquipmentByEmployeePDF(reportData, filters);
      case 'weapon_validity':
        console.log('📄 Gerando PDF: weapon_validity');
        return this.generateWeaponValidityPDF(reportData, filters);
      case 'general_report':
        console.log('📄 Gerando PDF: general_report');
        return this.generateGeneralReportPDF(reportData, filters);
      default:
        console.log('📄 Gerando PDF genérico para:', reportType);
        // Para outros tipos, gerar um PDF genérico
        return this.generateGenericPDF(reportType, reportData, filters);
    }
  }

  private async generateGenericPDF(
    reportType: string,
    reportData: any[],
    filters?: EquipmentReportFilters
  ): Promise<Blob> {
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = await import('jspdf-autotable');

      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = 20;

      // Cabeçalho
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 53, 69);
      doc.text('Relatório de Equipamentos', margin, yPos);

      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
        margin,
        yPos
      );

      yPos += 10;

      if (reportData.length > 0) {
        // Obter cabeçalhos do primeiro item
        const headers = Object.keys(reportData[0]);
        const tableData = reportData.map((row) =>
          headers.map((header) => {
            const value = row[header];
            if (value === null || value === undefined) return '-';
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value);
          })
        );

        autoTable.default(doc, {
          startY: yPos,
          head: [headers],
          body: tableData,
          theme: 'striped',
          headStyles: {
            fillColor: [220, 53, 69],
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
          margin: { left: margin, right: margin },
          styles: {
            overflow: 'linebreak',
            cellPadding: 3,
          },
        });
      } else {
        doc.setFontSize(10);
        doc.text('Nenhum dado encontrado para o período especificado.', margin, yPos);
      }

      // Rodapé
      const finalY = (doc as any).lastAutoTable?.finalY || yPos;
      await this.addFooter(doc, pageWidth, pageHeight, finalY);

      const pdfBlob = doc.output('blob');
      return pdfBlob;
    } catch (error) {
      console.error('Erro ao gerar PDF genérico:', error);
      throw new Error('Erro ao gerar relatório PDF');
    }
  }
}

export const equipmentReportGenerator = new EquipmentReportGenerator();


