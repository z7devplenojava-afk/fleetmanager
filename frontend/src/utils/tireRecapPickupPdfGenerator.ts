import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface TireRecapPickupItem {
  fireNumber?: string;
  serialNumber: string;
  dot?: string;
  brand: string;
  model: string;
  size: string;
  locationLabel: string;
  treadDepthMm?: number | null;
  currentLifeLabel: string;
  targetServiceLabel: string;
  currentTotalKm: number;
  reasonLabel: string;
}

export interface TireRecapPickupPdfData {
  companyName?: string;
  companyDocument?: string;
  supplierName?: string;
  pickupLocation?: string;
  serviceType?: string;
  notes?: string;
  responsibleName?: string;
  items: TireRecapPickupItem[];
}

function buildPickupDocumentNumber(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `COL-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

export async function generateTireRecapPickupPDFBlob(
  data: TireRecapPickupPdfData
): Promise<{ blob: Blob; filename: string }> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const docCode = buildPickupDocumentNumber();
  const emissionStr = new Date().toLocaleString('pt-BR');

  // Cabeçalho executivo
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 26, pageWidth, 1.5, 'F');

  doc.setTextColor(250, 204, 21);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('LISTA DE COLETA — RECAPAGEM DE PNEUS', margin, 11);

  doc.setTextColor(229, 231, 235);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const companyLine = [
    data.companyName || 'Gestão de Frotas FluxBus',
    data.companyDocument ? `CNPJ/Doc: ${data.companyDocument}` : '',
  ]
    .filter(Boolean)
    .join('  •  ');
  doc.text(companyLine, margin, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Romaneio: ${docCode}`, pageWidth - margin, 11, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(209, 213, 219);
  doc.text(`Emissão: ${emissionStr}`, pageWidth - margin, 18, { align: 'right' });

  // Bloco Fornecedor / Dados da Coleta
  let y = 32;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Fornecedor / Recapadora:', margin + 3, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(data.supplierName?.trim() || 'A definir na coleta', margin + 45, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Serviço Solicitado:', pageWidth / 2, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(data.serviceType?.trim() || 'Recapagem / Reforma de Carcaça', pageWidth / 2 + 32, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Local de Retirada:', margin + 3, y + 12.5);
  doc.setFont('helvetica', 'normal');
  doc.text(data.pickupLocation?.trim() || 'Almoxarifado / Garagem da Frota', margin + 35, y + 12.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Total de Pneus p/ Coleta:', pageWidth / 2, y + 12.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(`${data.items.length} carcaça(s)`, pageWidth / 2 + 42, y + 12.5);

  // Resumo por medida
  const sizeCounts = new Map<string, number>();
  data.items.forEach((item) => {
    const key = item.size || 'Sem medida';
    sizeCounts.set(key, (sizeCounts.get(key) || 0) + 1);
  });
  const sizeSummary = Array.from(sizeCounts.entries())
    .map(([sz, count]) => `${sz}: ${count} un.`)
    .join('  |  ');

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo por Medida:', margin + 3, y + 19);
  doc.setFont('helvetica', 'normal');
  doc.text(sizeSummary || '-', margin + 38, y + 19, { maxWidth: pageWidth - margin * 2 - 42 });

  y += 26;

  if (data.notes?.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('Observações:', margin, y + 3);
    doc.setFont('helvetica', 'normal');
    doc.text(data.notes.trim(), margin + 23, y + 3, { maxWidth: pageWidth - margin * 2 - 25 });
    y += 8;
  }

  // Tabela técnica de carcaças
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [[
      '#',
      'Nº Fogo',
      'Nº Série',
      'DOT',
      'Marca / Modelo',
      'Medida',
      'Local / Veículo Origem',
      'Sulco',
      'KM Total',
      'Ciclo -> Serviço',
      'Motivo / Status',
    ]],
    body: data.items.map((item, idx) => [
      String(idx + 1),
      item.fireNumber || '-',
      item.serialNumber || '-',
      item.dot || '-',
      `${item.brand} ${item.model}`.trim(),
      item.size || '-',
      item.locationLabel || '-',
      item.treadDepthMm != null ? `${Number(item.treadDepthMm).toFixed(1)} mm` : '-',
      `${(item.currentTotalKm || 0).toLocaleString('pt-BR')} km`,
      `${item.currentLifeLabel} -> ${item.targetServiceLabel}`,
      item.reasonLabel,
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2.3,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 20 },
      2: { cellWidth: 25 },
      3: { halign: 'center', cellWidth: 13 },
      5: { cellWidth: 24 },
      7: { halign: 'right', cellWidth: 16 },
      8: { halign: 'right', cellWidth: 22 },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : pageHeight - 40;
  const sigY = finalY > pageHeight - 36 ? (() => { doc.addPage(); return 25; })() : finalY;

  doc.setDrawColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const boxW = (pageWidth - margin * 2 - 10) / 2;
  doc.roundedRect(margin, sigY, boxW, 24, 1.5, 1.5);
  doc.line(margin + 6, sigY + 15, margin + boxW - 6, sigY + 15);
  doc.setFont('helvetica', 'bold');
  doc.text('Conferência / Liberação da Frota', margin + boxW / 2, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(data.responsibleName || 'Responsável Almoxarifado / Manutenção', margin + boxW / 2, sigY + 20, { align: 'center' });

  const rightBoxX = margin + boxW + 10;
  doc.roundedRect(rightBoxX, sigY, boxW, 24, 1.5, 1.5);
  doc.line(rightBoxX + 6, sigY + 15, rightBoxX + boxW - 6, sigY + 15);
  doc.setFont('helvetica', 'bold');
  doc.text('Recebimento / Coleta do Fornecedor', rightBoxX + boxW / 2, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Nome, CPF/RG, Placa do Veículo e Data da Coleta', rightBoxX + boxW / 2, sigY + 20, { align: 'center' });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Documento gerado pelo módulo de Gestão de Pneus • ${docCode} • Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const blob = doc.output('blob');
  const filename = `coleta-recapagem-pneus-${docCode.toLowerCase()}.pdf`;
  return { blob, filename };
}

