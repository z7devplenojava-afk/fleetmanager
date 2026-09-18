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
  public async generatePDF(data: QuotationRfpData): Promise<Blob> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = 14;

    // 1. CABEÇALHO CORPORATIVO
    doc.setFillColor(24, 24, 27); // Zinc 900
    doc.rect(margin, y, pageWidth - 2 * margin, 24, 'F');

    doc.setFillColor(217, 119, 6); // Amber 600
    doc.rect(margin, y + 23, pageWidth - 2 * margin, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('SOLICITAÇÃO DE COTAÇÃO DE PEÇAS & SERVIÇOS', margin + 6, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(212, 212, 216);
    const quoteRef = data.quoteNumber ? `Nº Cotação: ${data.quoteNumber}` : `Ref: ${data.title.substring(0, 35)}`;
    doc.text(`${quoteRef}  |  Emissão: ${data.createdAt ? new Date(data.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}`, margin + 6, y + 15);

    if (data.validUntil) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(252, 211, 77); // Amber 300
      doc.text(`Data Limite p/ Resposta: ${new Date(data.validUntil).toLocaleDateString('pt-BR')}`, pageWidth - margin - 6, y + 15, { align: 'right' });
    }

    y += 29;

    // 2. QUADRO DE IDENTIFICAÇÃO DO VEÍCULO & SOLICITAÇÃO
    doc.setFillColor(244, 244, 245); // Zinc 100
    doc.rect(margin, y, pageWidth - 2 * margin, 24, 'F');
    doc.setDrawColor(228, 228, 231);
    doc.rect(margin, y, pageWidth - 2 * margin, 24, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(39, 39, 42);

    doc.text('DADOS DA APLICAÇÃO & ORDEM DE SERVIÇO', margin + 4, y + 5.5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    // Linha 1
    doc.text('Veículo:', margin + 4, y + 11.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${data.vehiclePlate || 'N/A'} ${data.vehicleModel ? ` - ${data.vehicleModel}` : ''} ${data.vehicleYear ? `(${data.vehicleYear})` : ''}`, margin + 22, y + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Ordem de Serviço (OS):', margin + 110, y + 11.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(data.workOrderNumber ? `OS #${data.workOrderNumber}` : 'Sem OS Vinculada', margin + 148, y + 11.5);

    // Linha 2
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Solicitante:', margin + 4, y + 18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(data.requesterName || 'Departamento de Manutenção / Frota', margin + 22, y + 18);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Fornecedor Destino:', margin + 110, y + 18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(data.supplierName || 'Aos Cuidados do Departamento Comercial / Vendas', margin + 148, y + 18);

    y += 28;

    // 3. JUSTIFICATIVA / MOTIVO
    if (data.justification || data.description) {
      doc.setFillColor(254, 243, 199); // Amber 100
      doc.rect(margin, y, pageWidth - 2 * margin, 12, 'F');
      doc.setDrawColor(251, 191, 36);
      doc.rect(margin, y, pageWidth - 2 * margin, 12, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(146, 64, 14);
      doc.text('Motivo / Justificativa Técnica da Troca:', margin + 4, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 53, 15);
      const justText = data.justification || data.description || '';
      const splitJust = doc.splitTextToSize(justText, pageWidth - 2 * margin - 8);
      doc.text(splitJust.slice(0, 2), margin + 4, y + 8.5);

      y += 15;
    }

    // 4. TABELA DE ITENS / PEÇAS SOLICITADAS
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(24, 24, 27);
    doc.text('ITENS / PEÇAS SOLICITADAS PARA COTAÇÃO', margin, y);
    y += 3;

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
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 55 },
        2: { cellWidth: 32, font: 'courier' },
        3: { cellWidth: 28 },
        4: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 22, halign: 'right' }
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [24, 24, 27]
      }
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // 5. SEÇÃO DE FOTOS DA PEÇA QUE SERÁ TROCADA (ALTA PRECISÃO)
    if (data.photos && data.photos.length > 0) {
      // Se não houver espaço suficiente para as fotos na página atual, adiciona nova página
      if (y > pageHeight - 65) {
        doc.addPage();
        y = 15;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(24, 24, 27);
      doc.text(`📸 FOTOS DA PEÇA A SER SUBSTITUÍDA / DETALHES TÉCNICOS (${data.photos.length})`, margin, y);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(113, 113, 122);
      doc.text('Verifique conexões, furações, modelo e estado físico da peça conforme registros fotográficos anexados.', margin, y + 4);

      y += 7;

      const photoWidth = 54;
      const photoHeight = 40;
      const spacing = 5;
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
          // Moldura
          doc.setFillColor(244, 244, 245);
          doc.rect(photoX, photoY, photoWidth, photoHeight, 'F');
          doc.setDrawColor(212, 212, 216);
          doc.rect(photoX, photoY, photoWidth, photoHeight, 'D');

          // Imagem
          if (photo.url && photo.url.startsWith('data:image')) {
            const format = photo.url.includes('png') ? 'PNG' : 'JPEG';
            doc.addImage(photo.url, format, photoX + 1, photoY + 1, photoWidth - 2, photoHeight - 2);
          }

          // Legenda da Foto
          doc.setFillColor(24, 24, 27);
          doc.rect(photoX, photoY + photoHeight - 5, photoWidth, 5, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(255, 255, 255);
          doc.text(`Foto ${i + 1}: ${photo.name.substring(0, 24)}`, photoX + 2, photoY + photoHeight - 1.5);
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
      y = photoY + 4;
    }

    // 6. QUADRO DE PROPOSTA COMERCIAL & CONDIÇÕES (RESPOSTA DO FORNECEDOR)
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 15;
    }

    doc.setFillColor(250, 250, 250);
    doc.rect(margin, y, pageWidth - 2 * margin, 32, 'F');
    doc.setDrawColor(212, 212, 216);
    doc.rect(margin, y, pageWidth - 2 * margin, 32, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(24, 24, 27);
    doc.text('CAMPOS PARA PREENCHIMENTO PELO FORNECEDOR (RETORNO DE COTAÇÃO)', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    doc.text('Razão Social / CNPJ: ____________________________________________________', margin + 4, y + 12);
    doc.text('Vendedor / Contato: ____________________________________________________', margin + 4, y + 18);
    doc.text('Condições de Pagamento: [  ] À Vista   [  ] 30 Dias   [  ] 30/60 Dias   [  ] 30/60/90 Dias', margin + 4, y + 24);

    doc.text('Prazo de Entrega: ____ Dias', margin + 125, y + 12);
    doc.text('Garantia: ____ Meses', margin + 125, y + 18);
    doc.text('Frete: [  ] CIF (Incluso)  [  ] FOB', margin + 125, y + 24);

    y += 36;

    // 7. RODAPÉ DE VALIDAÇÃO
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(161, 161, 170);
    doc.text('Este documento é uma Solicitação Formal de Cotação de Preços. Propostas enviadas serão submetidas à análise comparativa de preços e prazos.', margin, pageHeight - 6);

    return doc.output('blob');
  }
}

export const quotationRfpPdfGenerator = new QuotationRfpPdfGenerator();
export default quotationRfpPdfGenerator;
