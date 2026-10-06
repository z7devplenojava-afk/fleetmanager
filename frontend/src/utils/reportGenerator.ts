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
    }).format(value || 0);
  }

  static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  }

  static formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  }

  static async generatePDF(data: ReportData): Promise<void> {
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default;

      const totalCols = data.headers ? data.headers.length : 0;
      // Para relatórios com mais de 6 colunas, usar orientação Landscape para evitar quebra de texto
      const isLandscape = totalCols > 6;
      const orientation = isLandscape ? 'landscape' : 'portrait';

      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 12;
      const marginRight = 12;
      const contentWidth = pageWidth - marginLeft - marginRight;

      let y = 10;

      // 1. CABEÇALHO INSTITUCIONAL (PADRÃO EXECUTIVO OS)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text('FLUXBUS - GESTÃO INTEGRADA DE FROTAS & ALMOXARIFADO', marginLeft, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text('CNPJ: 00.000.000/0001-00 • SISTEMA DE CONTROLE DE ESTOQUE & OPERAÇÕES', marginLeft, y + 9.5);

      // Título do Documento à Direita
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // Dark Slate
      doc.text(data.title.toUpperCase(), pageWidth - marginRight, y + 4, { align: 'right' });

      // Badge de Subtítulo / Período
      const badgeText = data.period ? data.period.toUpperCase() : 'ESTOQUE & ALMOXARIFADO';
      const badgeWidth = Math.max(38, doc.getTextWidth(badgeText) + 6);
      const badgeHeight = 5.5;
      const badgeX = pageWidth - marginRight - badgeWidth;
      const badgeY = y + 6;

      doc.setFillColor(241, 245, 249); // Slate-100
      doc.setDrawColor(203, 213, 225); // Slate-300
      doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85); // Slate-700
      doc.text(badgeText, badgeX + badgeWidth / 2, badgeY + 3.8, { align: 'center' });

      // Protocolo e Data de Emissão
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const protocol = `EST-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Protocolo: ${protocol} • Emissão: ${dateStr}`, pageWidth - marginRight, y + 15.5, { align: 'right' });

      y += 18;

      // Linha divisória estilo OS
      doc.setDrawColor(30, 41, 59); // Slate-800
      doc.setLineWidth(0.8);
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 4;

      // 2. PARÂMETROS DO RELATÓRIO
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setLineWidth(0.3);
      doc.roundedRect(marginLeft, y, contentWidth, 8.5, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text('PARÂMETROS:', marginLeft + 3, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const subtitleInfo = data.subtitle || 'Análise detalhada do relatório';
      const periodInfo = data.period ? ` • Período: ${data.period}` : '';
      doc.text(`${subtitleInfo}${periodInfo}`, marginLeft + 26, y + 5.5);

      y += 12.5;

      // 3. CARDS DE RESUMO (KPIS SE FORNECIDO)
      if (data.summary && data.summary.length > 0) {
        const kpiCount = Math.min(data.summary.length, 4);
        const cardGap = 3;
        const cardWidth = (contentWidth - (cardGap * (kpiCount - 1))) / kpiCount;
        const cardHeight = 11;

        data.summary.slice(0, kpiCount).forEach((item, index) => {
          const cardX = marginLeft + index * (cardWidth + cardGap);
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(cardX, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          doc.text(item.label.toUpperCase(), cardX + 3, y + 4.5);

          let valStr = item.value.toString();
          if (item.format === 'currency') {
            valStr = this.formatCurrency(item.value);
          } else if (item.format === 'number') {
            valStr = this.formatNumber(item.value);
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42);
          doc.text(valStr, cardX + 3, y + 9.5);
        });

        y += cardHeight + 4;
      }

      // 4. CONFIGURAÇÃO DAS COLUNAS DA TABELA
      let columnStylesConfig: Record<number, any> = {};

      if (isLandscape && totalCols === 10) {
        // Layout otimizado para o Relatório de Estoque com 10 colunas (Largura total = 273mm)
        columnStylesConfig = {
          0: { cellWidth: 55, halign: 'left' },   // Produto
          1: { cellWidth: 32, halign: 'left' },   // Categoria
          2: { cellWidth: 20, halign: 'center' }, // Estoque Atual
          3: { cellWidth: 20, halign: 'center' }, // Estoque Mínimo
          4: { cellWidth: 20, halign: 'center' }, // Estoque Máximo
          5: { cellWidth: 22, halign: 'center' }, // Consumo Médio
          6: { cellWidth: 18, halign: 'center' }, // Giro
          7: { cellWidth: 26, halign: 'center' }, // Última Movimentação
          8: { cellWidth: 28, halign: 'right' },  // Valor
          9: { cellWidth: 32, halign: 'center' }  // Status
        };
      } else {
        columnStylesConfig = Object.fromEntries(
          data.headers.map((header, index) => {
            const h = header.toLowerCase();
            if (h.includes('valor') || h.includes('total') || h.includes('saldo') || h.includes('preço')) {
              return [index, { halign: 'right' }];
            }
            if (h.includes('estoque') || h.includes('quantidade') || h.includes('giro') || h.includes('data') || h.includes('status') || h.includes('movimentação')) {
              return [index, { halign: 'center' }];
            }
            return [index, { halign: 'left' }];
          })
        );
      }

      // 5. RENDERIZAÇÃO DA TABELA AUTO-TABLE (ESTILO OS)
      autoTable(doc, {
        startY: y,
        head: [data.headers],
        body: data.rows,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59], // Dark Slate estilo OS (#1e293b)
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 2.5
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [51, 65, 85], // Slate-700
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Slate-50
        },
        margin: { top: 15, left: marginLeft, right: marginRight, bottom: 15 },
        styles: {
          overflow: 'linebreak',
          valign: 'middle'
        },
        columnStyles: columnStylesConfig
      });

      // 6. RODAPÉ PAGINADO (PADRÃO OS)
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        const footerY = pageHeight - 8;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(marginLeft, footerY - 3, pageWidth - marginRight, footerY - 3);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text('FluxBus FleetManager • Sistema de Gestão Integrada de Frotas & Almoxarifado', marginLeft, footerY);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - marginRight, footerY, { align: 'right' });
      }

      // 7. DOWNLOAD DO ARQUIVO
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
