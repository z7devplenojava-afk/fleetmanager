import jsPDF from 'jspdf';
import { StockItem, StockCategoryLabels } from '@/types/stock';
import { stockService } from './stockService';

export interface LabelPrintConfig {
  item: StockItem;
  quantity: number;
  qrDataUrl?: string;
}

export interface PimacoTemplate {
  name: string;
  columns: number;
  rows: number;
  labelWidth: number;
  labelHeight: number;
  marginTop: number;
  marginLeft: number;
  gapX: number;
  gapY: number;
}

// Configuração Padrão: Pimaco 14 etiquetas (2 colunas x 7 linhas em folha A4)
export const PIMACO_14_TEMPLATE: PimacoTemplate = {
  name: 'Pimaco 14 Etiquetas (101.6 x 38.1 mm)',
  columns: 2,
  rows: 7,
  labelWidth: 101.6,
  labelHeight: 38.1,
  marginTop: 15.1,
  marginLeft: 3.4,
  gapX: 0,
  gapY: 0
};

export const stockLabelService = {
  /**
   * Obtém a imagem do QR Code em Base64 para um item
   */
  async getQrDataUrl(item: StockItem): Promise<string> {
    if (!item.id || item.id.startsWith('preview-')) {
      return '';
    }
    try {
      return await stockService.getItemQrCodeDataUrl(item.id, 250, 250);
    } catch (err) {
      return '';
    }
  },

  /**
   * Desenha uma etiqueta individual na página do PDF
   */
  drawLabel(
    doc: jsPDF,
    item: StockItem,
    x: number,
    y: number,
    w: number,
    h: number,
    qrDataUrl?: string
  ) {
    // 1. Borda sutil de corte
    doc.setDrawColor(203, 213, 225); // #cbd5e1
    doc.setLineWidth(0.2);
    doc.rect(x, y, w, h);

    // 2. Faixa colorida lateral esquerda (identidade visual vermelha)
    doc.setFillColor(220, 38, 38); // #dc2626
    doc.rect(x + 0.2, y + 0.2, 2.2, h - 0.4, 'F');

    const contentX = x + 4;
    let currentY = y + 4.5;

    // 3. Cabeçalho da Empresa
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59); // #1e293b
    doc.text('VIAÇÃO SÃO SILVESTRE', contentX, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139); // #64748b
    doc.text('ALMOXARIFADO & FROTA', contentX + 44, currentY);

    currentY += 4.5;

    // 4. Código do Item em Destaque
    doc.setFont('courier', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42); // #0f172a
    doc.text(item.code || 'SEM CÓDIGO', contentX, currentY);

    currentY += 4;

    // 5. Nome do Item (com quebra de linha inteligente)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);

    const displayName = item.fullName || item.name;
    const nameLines = doc.splitTextToSize(displayName, 64);
    const visibleLines = nameLines.slice(0, 2);
    visibleLines.forEach((line: string) => {
      doc.text(line, contentX, currentY);
      currentY += 3.5;
    });

    // 6. Categoria
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    const catLabel = StockCategoryLabels[item.category] || item.category || 'Geral';
    doc.text(`Cat: ${catLabel}`, contentX, currentY);
    currentY += 3.2;

    // 7. Dados de EPI (se houver CA)
    if (item.caNumber) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(185, 28, 28); // vermelho escuro
      const caText = `CA: ${item.caNumber}${item.caValidity ? ` (Val: ${item.caValidity})` : ''}`;
      doc.text(caText, contentX, currentY);
      currentY += 3.2;
    }

    // 8. Saldo e Fornecedor / NF
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(`Estoque: ${item.currentQuantity ?? 0} un`, contentX, currentY);

    if (item.supplier || item.invoiceNumber) {
      currentY += 3.2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      const docInfo = [
        item.supplier ? `Forn: ${item.supplier.slice(0, 25)}` : '',
        item.invoiceNumber ? `NF: ${item.invoiceNumber}` : ''
      ].filter(Boolean).join(' | ');
      doc.text(docInfo, contentX, currentY);
    }

    // 9. QR Code no lado direito da etiqueta
    const qrSize = 27;
    const qrX = x + w - qrSize - 3.5;
    const qrY = y + 4;

    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      } catch (err) {
        console.warn('Erro ao inserir imagem QR Code no PDF:', err);
      }
    } else {
      // Fallback visual de QR Code
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);
      doc.rect(qrX, qrY, qrSize, qrSize);
      doc.setFontSize(5);
      doc.setTextColor(148, 163, 184);
      doc.text('QR CODE', qrX + qrSize / 2, qrY + qrSize / 2, { align: 'center' });
    }

    // Subtítulo do QR Code
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.5);
    doc.setTextColor(148, 163, 184);
    doc.text('LEITURA RÁPIDA', qrX + qrSize / 2, qrY + qrSize + 2.5, { align: 'center' });
  },

  /**
   * Gera documento PDF no formato Pimaco A4 pronto para impressão
   */
  async generateLabelsPdf(
    labels: LabelPrintConfig[],
    template: PimacoTemplate = PIMACO_14_TEMPLATE
  ): Promise<jsPDF> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const labelsPerPage = template.columns * template.rows;
    let labelIndex = 0;

    // Expandir a lista de etiquetas conforme a quantidade solicitada
    const expandedList: { item: StockItem; qrDataUrl?: string }[] = [];
    for (const label of labels) {
      let qrUrl = label.qrDataUrl;
      if (!qrUrl) {
        qrUrl = await this.getQrDataUrl(label.item);
      }
      for (let i = 0; i < label.quantity; i++) {
        expandedList.push({ item: label.item, qrDataUrl: qrUrl });
      }
    }

    if (expandedList.length === 0) {
      throw new Error('Nenhuma etiqueta para imprimir.');
    }

    expandedList.forEach((entry, idx) => {
      const pageIndex = Math.floor(idx / labelsPerPage);
      const posOnPage = idx % labelsPerPage;

      if (posOnPage === 0 && idx > 0) {
        doc.addPage();
      }

      const col = posOnPage % template.columns;
      const row = Math.floor(posOnPage / template.columns);

      const x = template.marginLeft + col * (template.labelWidth + template.gapX);
      const y = template.marginTop + row * (template.labelHeight + template.gapY);

      this.drawLabel(doc, entry.item, x, y, template.labelWidth, template.labelHeight, entry.qrDataUrl);
    });

    return doc;
  },

  /**
   * Gera e faz o download direto do PDF de etiquetas Pimaco
   */
  async downloadLabelsPdf(
    labels: LabelPrintConfig[],
    filename = 'etiquetas_pimaco_estoque.pdf'
  ): Promise<void> {
    const doc = await this.generateLabelsPdf(labels);
    doc.save(filename);
  }
};
