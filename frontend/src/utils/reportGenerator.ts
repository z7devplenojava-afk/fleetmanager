import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ReportData {
  title: string;
  subtitle?: string;
  period?: string;
  headers: string[];
  rows: any[][];
  summary?: {
    label: string;
    value: number;
    format?: 'currency' | 'number' | 'text';
  }[];
}

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  tipo?: string;
  cliente?: string;
  fornecedor?: string;
  categoria?: string;
  centroCusto?: string;
}

export class ReportGenerator {
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  }

  static formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value);
  }

  static async generatePDF(data: ReportData): Promise<void> {
    try {
      // Importação dinâmica para garantir que os módulos sejam carregados
      const jsPDF = (await import('jspdf')).default;
      const autoTable = await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Configurações do documento
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      
      // Cabeçalho
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(data.title, margin, 30);
      
      if (data.subtitle) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(data.subtitle, margin, 40);
      }
      
      if (data.period) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.text(`Período: ${data.period}`, margin, 50);
      }
      
      // Data de geração
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${this.formatDate(new Date())}`, pageWidth - 60, 30);
      
      // Tabela de dados
      const tableStartY = data.subtitle ? 60 : 50;
      
      // Usar autoTable.default() como nos outros arquivos
      autoTable.default(doc, {
        startY: tableStartY,
        head: [data.headers],
        body: data.rows,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: tableStartY, left: margin, right: margin },
        styles: {
          cellPadding: 3,
          overflow: 'linebreak',
          halign: 'left'
        },
        columnStyles: {
          // Estilização específica para colunas de valores
          ...Object.fromEntries(
            data.headers.map((header, index) => {
              if (header.toLowerCase().includes('valor') || 
                  header.toLowerCase().includes('total') ||
                  header.toLowerCase().includes('saldo')) {
                return [index, { halign: 'right' }];
              }
              return [index, { halign: 'left' }];
            })
          )
        }
      });
      
      // Resumo (se fornecido)
      if (data.summary && data.summary.length > 0) {
        const finalY = (doc as any).lastAutoTable?.finalY || 100;
        let currentY = finalY + 20;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumo', margin, currentY);
        currentY += 10;
        
        data.summary.forEach((item) => {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          
          let formattedValue = item.value.toString();
          if (item.format === 'currency') {
            formattedValue = this.formatCurrency(item.value);
          } else if (item.format === 'number') {
            formattedValue = this.formatNumber(item.value);
          }
          
          doc.text(`${item.label}:`, margin, currentY);
          doc.setFont('helvetica', 'bold');
          doc.text(formattedValue, margin + 80, currentY);
          currentY += 8;
        });
      }
      
      // Rodapé
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
      }
      
      // Salvar arquivo
      const fileName = `${data.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Erro ao gerar relatório PDF');
    }
  }

  static generateExcel(data: ReportData): void {
    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // Preparar dados da planilha
    const wsData = [
      // Cabeçalho do relatório
      [data.title],
      data.subtitle ? [data.subtitle] : [],
      data.period ? [`Período: ${data.period}`] : [],
      [`Gerado em: ${this.formatDate(new Date())}`],
      [], // Linha em branco
      // Cabeçalhos da tabela
      data.headers,
      // Dados
      ...data.rows
    ];
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Configurar larguras das colunas
    const colWidths = data.headers.map((header, index) => {
      const maxLength = Math.max(
        header.length,
        ...data.rows.map(row => String(row[index] || '').length)
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    ws['!cols'] = colWidths;
    
    // Estilização (básica - Excel não suporta estilos complexos via XLSX)
    // Mesclar células do cabeçalho
    if (wsData.length > 0) {
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: data.headers.length - 1 } },
        ...(data.subtitle ? [{ s: { r: 1, c: 0 }, e: { r: 1, c: data.headers.length - 1 } }] : []),
        ...(data.period ? [{ s: { r: 2, c: 0 }, e: { r: 2, c: data.headers.length - 1 } }] : [])
      ];
    }
    
    // Adicionar resumo se fornecido
    if (data.summary && data.summary.length > 0) {
      const summaryStartRow = wsData.length;
      const summaryData = [
        ['Resumo'],
        ...data.summary.map(item => {
          let formattedValue = item.value.toString();
          if (item.format === 'currency') {
            formattedValue = this.formatCurrency(item.value);
          } else if (item.format === 'number') {
            formattedValue = this.formatNumber(item.value);
          }
          return [item.label, formattedValue];
        })
      ];
      
      XLSX.utils.sheet_add_aoa(ws, summaryData, { origin: -1 });
    }
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    
    // Salvar arquivo
    const fileName = `${data.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  static generateCSV(data: ReportData): void {
    const csvContent = [
      // Cabeçalho do relatório
      data.title,
      data.subtitle || '',
      data.period ? `Período: ${data.period}` : '',
      `Gerado em: ${this.formatDate(new Date())}`,
      '', // Linha em branco
      // Cabeçalhos da tabela
      data.headers.join(','),
      // Dados
      ...data.rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `${data.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);
  }
}

// Tipos de relatórios disponíveis
export enum ReportType {
  CONTAS_PAGAR = 'contas_pagar',
  CONTAS_RECEBER = 'contas_receber',
  FLUXO_CAIXA = 'fluxo_caixa',
  PAGAMENTOS = 'pagamentos',
  RESUMO_FINANCEIRO = 'resumo_financeiro',
  CONCILIACAO_BANCARIA = 'conciliacao_bancaria'
}

// Configurações de relatórios
export const REPORT_CONFIGS = {
  [ReportType.CONTAS_PAGAR]: {
    title: 'Relatório de Contas a Pagar',
    headers: ['Empresa', 'Descrição', 'Fornecedor', 'Valor', 'Vencimento', 'Status', 'Tipo']
  },
  [ReportType.CONTAS_RECEBER]: {
    title: 'Relatório de Contas a Receber',
    headers: ['ID', 'Descrição', 'Cliente', 'Valor', 'Vencimento', 'Status', 'Categoria', 'Centro de Custo']
  },
  [ReportType.FLUXO_CAIXA]: {
    title: 'Relatório de Fluxo de Caixa',
    headers: ['Data', 'Entradas', 'Saídas', 'Saldo', 'Saldo Acumulado']
  },
  [ReportType.PAGAMENTOS]: {
    title: 'Relatório de Pagamentos',
    headers: ['ID', 'Tipo', 'Valor', 'Data', 'Método', 'Status', 'Banco', 'Observações']
  },
  [ReportType.RESUMO_FINANCEIRO]: {
    title: 'Resumo Financeiro',
    headers: ['Período', 'Receitas', 'Despesas', 'Saldo', 'Margem']
  },
  [ReportType.CONCILIACAO_BANCARIA]: {
    title: 'Conciliação Bancária',
    headers: ['Data', 'Descrição', 'Valor', 'Saldo', 'Status', 'Banco']
  }
};
