import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface QuotationPhotoItem {
  id: string;
  name: string;
  url: string; // base64 ou URL da imagem
  size?: string;
  caption?: string;
}

export interface QuotationSupplierAttachment {
  id: string;
  name: string;
  type: string; // 'pdf' | 'excel' | 'image' | 'other'
  url: string; // base64 data url or storage url
  size?: string;
  uploadedAt?: string;
}

export interface QuotationPartItem {
  itemName: string;
  itemCode?: string; // Código Original / OEM / Part Number
  brand?: string; // Fabricante ou Marca de Referência
  quantity: number;
  unit: string;
  specification?: string;
  estimatedPrice?: number;
}

export interface QuotationRfpData {
  quoteNumber?: string;
  title: string;
  description?: string;
  supplierName?: string;
  totalValue?: number;
  validUntil?: string;
  createdAt?: string;
  companyName?: string;
  companyContact?: string;

  // Veículo e Destino
  vehiclePlate?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  chassis?: string;
  workOrderNumber?: string;
  requesterName?: string;
  justification?: string;
  urgency?: string;

  // Itens e Fotos da Peça
  items: QuotationPartItem[];
  photos: QuotationPhotoItem[];
  supplierAttachments?: QuotationSupplierAttachment[];

  // Condições Comerciais e Análise
  deliveryDays?: number;
  warrantyMonths?: number;
  freightType?: string;
  partQuality?: string;
  terms?: string;
  notes?: string;
  deliveryMethod?: string;
  paymentMethod?: string;
}

class QuotationRfpPdfGenerator {
  /**
   * Trunca o texto se ultrapassar a largura máxima em milímetros
   */
  private truncateText(doc: jsPDF, text: string, maxWidth: number): string {
    if (!text) return '';
    if (doc.getTextWidth(text) <= maxWidth) return text;

    let truncated = text;
    while (truncated.length > 0 && doc.getTextWidth(truncated + '...') > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated ? truncated + '...' : '';
  }

  public async generatePDF(data: QuotationRfpData): Promise<Blob> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const printableWidth = pageWidth - 2 * margin; // 182 mm
    let y = 14;

    // 1. CABEÇALHO CORPORATIVO
    doc.setFillColor(24, 24, 27); // Zinc 900
    doc.rect(margin, y, printableWidth, 24, 'F');

    doc.setFillColor(217, 119, 6); // Amber 600
    doc.rect(margin, y + 23, printableWidth, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.setTextColor(255, 255, 255);
    doc.text('SOLICITAÇÃO DE COTAÇÃO DE PEÇAS & SERVIÇOS', margin + 6, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(212, 212, 216);
    const quoteRef = data.quoteNumber ? `Nº Cotação: ${data.quoteNumber}` : `Ref: ${this.truncateText(doc, data.title, 35)}`;
    const issueDateStr = data.createdAt ? new Date(data.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    doc.text(`${quoteRef}  |  Emissão: ${issueDateStr}`, margin + 6, y + 16);

    if (data.validUntil) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(252, 211, 77); // Amber 300
      const limitStr = `Data Limite p/ Resposta: ${new Date(data.validUntil).toLocaleDateString('pt-BR')}`;
      doc.text(limitStr, pageWidth - margin - 6, y + 16, { align: 'right' });
    }

    y += 29;

    // 2. QUADRO DE IDENTIFICAÇÃO DO VEÍCULO & SOLICITAÇÃO (DADOS DA APLICAÇÃO & ORDEM DE SERVIÇO)
    const infoBoxHeight = 26;
    doc.setFillColor(244, 244, 245); // Zinc 100
    doc.rect(margin, y, printableWidth, infoBoxHeight, 'F');
    doc.setDrawColor(228, 228, 231);
    doc.rect(margin, y, printableWidth, infoBoxHeight, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(39, 39, 42);
    doc.text('DADOS DA APLICAÇÃO & ORDEM DE SERVIÇO', margin + 5, y + 6);

    doc.setFontSize(8);

    // Definição das Colunas com proteções de largura máxima
    const col1LabelX = margin + 5;
    const col1ValueX = margin + 22;
    const col1MaxValW = 66; // 88 - 22 = 66 mm

    const col2LabelX = margin + 94;
    const col2ValueX = margin + 128;
    const col2MaxValW = 50; // 182 - 128 - 4 = 50 mm

    // Linha 1 (Veículo & OS)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Veículo:', col1LabelX, y + 13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const vehicleFullStr = `${data.vehiclePlate || 'N/A'}${data.vehicleModel ? ` - ${data.vehicleModel}` : ''}${data.vehicleYear ? ` (${data.vehicleYear})` : ''}`;
    doc.text(this.truncateText(doc, vehicleFullStr, col1MaxValW), col1ValueX, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Ordem de Serviço (OS):', col2LabelX, y + 13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const osStr = data.workOrderNumber ? `OS #${data.workOrderNumber}` : 'Sem OS Vinculada';
    doc.text(this.truncateText(doc, osStr, col2MaxValW), col2ValueX, y + 13);

    // Linha 2 (Solicitante & Fornecedor Destino)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Solicitante:', col1LabelX, y + 20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const reqStr = data.requesterName || 'Departamento de Manutenção / Frota';
    doc.text(this.truncateText(doc, reqStr, col1MaxValW), col1ValueX, y + 20);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Fornecedor Destino:', col2LabelX, y + 20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const supplierStr = data.supplierName || 'Aos Cuidados do Depto Comercial / Vendas';
    doc.text(this.truncateText(doc, supplierStr, col2MaxValW), col2ValueX, y + 20);

    y += infoBoxHeight + 5;

    // 3. JUSTIFICATIVA / MOTIVO
    if (data.justification || data.description) {
      const justText = data.justification || data.description || '';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const splitJust = doc.splitTextToSize(justText, printableWidth - 10);
      const justBoxHeight = Math.max(13, 8 + splitJust.length * 3.8);

      doc.setFillColor(254, 243, 199); // Amber 100
      doc.rect(margin, y, printableWidth, justBoxHeight, 'F');
      doc.setDrawColor(251, 191, 36);
      doc.rect(margin, y, printableWidth, justBoxHeight, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(146, 64, 14);
      doc.text('Motivo / Justificativa Técnica da Troca:', margin + 5, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 53, 15);
      doc.text(splitJust, margin + 5, y + 9.5);

      y += justBoxHeight + 5;
    }

    // 4. TABELA DE ITENS / PEÇAS SOLICITADAS
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(24, 24, 27);
    doc.text('ITENS / PEÇAS SOLICITADAS PARA COTAÇÃO', margin, y);
    y += 3.5;

    const tableRows = (data.items && data.items.length > 0 ? data.items : [
      {
        itemName: data.title,
        itemCode: '-',
        brand: '-',
        quantity: 1,
        unit: 'UN',
        specification: data.description || '-'
      }
    ]).map((item, index) => [
      (index + 1).toString(),
      item.itemName + (item.specification ? `\nObs: ${item.specification}` : ''),
      item.itemCode || 'OEM / Original',
      item.brand || 'Original / 1ª Linha',
      `${item.quantity} ${item.unit || 'UN'}`,
      'R$ ________',
      'R$ ________'
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'Descrição da Peça / Item', 'Cód. OEM / Part Number', 'Marca Recomendada', 'Qtd', 'Preço Unit. (R$)', 'Preço Total (R$)']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [39, 39, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 2.5
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 58 },
        2: { cellWidth: 32 },
        3: { cellWidth: 28 },
        4: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 20, halign: 'right' }
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [24, 24, 27],
        overflow: 'linebreak'
      }
    });

    y = (doc as any).lastAutoTable.finalY + 7;

    // 5. SEÇÃO DE FOTOS DA PEÇA QUE SERÁ TROCADA
    if (data.photos && data.photos.length > 0) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 15;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(24, 24, 27);
      doc.text(`FOTOS DA PEÇA A SER SUBSTITUÍDA / DETALHES TÉCNICOS (${data.photos.length})`, margin, y);
      
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(113, 113, 122);
      doc.text('Verifique conexões, furações, modelo e estado físico da peça conforme registros fotográficos anexados.', margin, y + 4.5);

      y += 8;

      const photoWidth = 54;
      const photoHeight = 38;
      const spacing = 6;
      let col = 0;
      let photoY = y;

      for (let i = 0; i < data.photos.length; i++) {
        const photo = data.photos[i];
        const photoX = margin + col * (photoWidth + spacing);

        if (photoY + photoHeight + 10 > pageHeight - margin) {
          doc.addPage();
          photoY = 15;
          col = 0;
        }

        try {
          // Moldura Externa
          doc.setFillColor(244, 244, 245);
          doc.rect(photoX, photoY, photoWidth, photoHeight, 'F');
          doc.setDrawColor(212, 212, 216);
          doc.rect(photoX, photoY, photoWidth, photoHeight, 'D');

          // Imagem Base64
          if (photo.url && photo.url.startsWith('data:image')) {
            const format = photo.url.includes('png') ? 'PNG' : 'JPEG';
            doc.addImage(photo.url, format, photoX + 1, photoY + 1, photoWidth - 2, photoHeight - 7);
          }

          // Barra de Legenda Inferior
          const captionH = 5.5;
          const captionY = photoY + photoHeight - captionH;
          doc.setFillColor(24, 24, 27);
          doc.rect(photoX, captionY, photoWidth, captionH, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(255, 255, 255);
          const photoLabel = `Foto ${i + 1}: ${photo.name || 'Registro'}`;
          doc.text(this.truncateText(doc, photoLabel, photoWidth - 4), photoX + 2, captionY + 3.8);
        } catch (imgError) {
          console.error('Erro ao adicionar foto ao PDF:', imgError);
        }

        col++;
        if (col >= 3) {
          col = 0;
          photoY += photoHeight + spacing;
        }
      }

      if (col !== 0) {
        photoY += photoHeight + spacing;
      }
      y = photoY + 2;
    }

    // 6. QUADRO DE RESPOSTA DO FORNECEDOR (RETORNO DE COTAÇÃO)
    const supplierBoxH = 32;
    if (y > pageHeight - supplierBoxH - 12) {
      doc.addPage();
      y = 15;
    }

    doc.setFillColor(250, 250, 250);
    doc.rect(margin, y, printableWidth, supplierBoxH, 'F');
    doc.setDrawColor(212, 212, 216);
    doc.rect(margin, y, printableWidth, supplierBoxH, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(24, 24, 27);
    doc.text('CAMPOS PARA PREENCHIMENTO PELO FORNECEDOR (RETORNO DE COTAÇÃO)', margin + 5, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    const supCol1X = margin + 5;
    const supCol2X = margin + 114;

    doc.text('Razão Social / CNPJ: ____________________________________', supCol1X, y + 13);
    doc.text('Vendedor / Contato: ____________________________________', supCol1X, y + 19);
    doc.text('Condições de Pagamento: [  ] À Vista   [  ] 30 Dias   [  ] 30/60 Dias   [  ] 30/60/90 Dias', supCol1X, y + 25);

    doc.text('Prazo de Entrega: _________ Dias', supCol2X, y + 13);
    doc.text('Garantia Exigida: _________ Meses', supCol2X, y + 19);
    doc.text('Tipo de Frete: [  ] CIF (Incluso)   [  ] FOB', supCol2X, y + 25);

    // 7. RODAPÉ E NUMERAÇÃO DE PÁGINAS
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(161, 161, 170);

      const footerText = 'Este documento é uma Solicitação Formal de Cotação de Preços. Propostas enviadas serão submetidas à análise comparativa de preços e prazos.';
      doc.text(footerText, margin, pageHeight - 6);

      doc.setFont('helvetica', 'normal');
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    }

    return doc.output('blob');
  }
}

export const quotationRfpPdfGenerator = new QuotationRfpPdfGenerator();
export default quotationRfpPdfGenerator;
