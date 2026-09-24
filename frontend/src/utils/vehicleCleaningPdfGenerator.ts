import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  VehicleCleaningOrder,
  parseChecklist,
  parseQualityChecklist,
  parseSupplies,
  CLEANING_TYPE_LABELS,
  PHASE_LABELS,
  SECTOR_LABELS,
  PRIORITY_LABELS,
  CleaningSupplyItem,
} from '@/services/vehicleCleaningService';
import { getActiveCompanyInfo } from '@/utils/exportUtils';

export function generateCleaningReleasePDF(order: VehicleCleaningOrder, suppliesList?: CleaningSupplyItem[]): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const company = getActiveCompanyInfo();
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;

  // 1. Cabeçalho Corporativo
  doc.setFillColor(24, 24, 27); // #18181b
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Linha de Destaque Vermelho/Amarelo
  doc.setFillColor(220, 38, 38); // Red
  doc.rect(0, 26, pageWidth * 0.7, 2.5, 'F');
  doc.setFillColor(234, 179, 8); // Yellow
  doc.rect(pageWidth * 0.7, 26, pageWidth * 0.3, 2.5, 'F');

  // Título e Empresa
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(company.nome || 'VIAÇÃO SÃO SILVESTRE LTDA', margin, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  const companySub = `${company.cnpj ? `CNPJ: ${company.cnpj}  |  ` : ''}SISTEMA DE GESTÃO DE FROTA & HIGIENIZAÇÃO`;
  doc.text(companySub, margin, 17);

  // Título do Documento à direita
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(250, 204, 21); // Yellow
  doc.text('COMPROVANTE DE HIGIENIZAÇÃO', pageWidth - margin, 11, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(220, 220, 220);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ordem Nº: ${order.id.substring(0, 8).toUpperCase()}`, pageWidth - margin, 17, { align: 'right' });

  let currentY = 34;

  // 2. Banner de Status e Liberação
  const isLiberado = order.status === 'COMPLETED' || order.phase === 'LIBERADO';
  if (isLiberado) {
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(16, 185, 129); // emerald-500
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 12, 2, 2, 'FD');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text('VEÍCULO HIGIENIZADO, INSPECIONADO E LIBERADO PARA VIAGEM', margin + 6, currentY + 7.5);

    if (order.releaseSpot) {
      doc.setFontSize(9);
      doc.setTextColor(4, 120, 87);
      doc.text(`Vaga no Pátio: ${order.releaseSpot}`, pageWidth - margin - 6, currentY + 7.5, { align: 'right' });
    }
  } else {
    doc.setFillColor(254, 243, 199); // amber-50
    doc.setDrawColor(245, 158, 11); // amber-500
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 12, 2, 2, 'FD');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text(`EM ANDAMENTO: ${PHASE_LABELS[order.phase || 'AGUARDANDO']}`, margin + 6, currentY + 7.5);
  }

  currentY += 16;

  // 3. Bloco de Dados do Veículo e da Solicitação (Duas Colunas)
  const colWidth = (pageWidth - margin * 2 - 6) / 2;

  // Coluna 1: Veículo
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, currentY, colWidth, 42, 2, 2, 'FD');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('DADOS DO VEÍCULO', margin + 5, currentY + 7);

  doc.setDrawColor(203, 213, 225);
  doc.line(margin + 5, currentY + 9, margin + colWidth - 5, currentY + 9);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Placa / Prefixo:', margin + 5, currentY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${order.vehiclePlate}${order.vehicleModel ? ` (${order.vehicleModel})` : ''}`, margin + 35, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Garagem / Base:', margin + 5, currentY + 23);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(order.vehicleGarageName || 'Garagem Central', margin + 35, currentY + 23);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Motorista:', margin + 5, currentY + 30);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(order.driverName || 'Não especificado', margin + 35, currentY + 30);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('WhatsApp Contato:', margin + 5, currentY + 37);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(order.driverPhone || 'Não informado', margin + 35, currentY + 37);

  // Coluna 2: Informações do Serviço
  const col2X = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2X, currentY, colWidth, 42, 2, 2, 'FD');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('DETALHES DO ATENDIMENTO', col2X + 5, currentY + 7);

  doc.setDrawColor(203, 213, 225);
  doc.line(col2X + 5, currentY + 9, col2X + colWidth - 5, currentY + 9);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Tipo de Limpeza:', col2X + 5, currentY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(CLEANING_TYPE_LABELS[order.cleaningType] || order.cleaningType, col2X + 38, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Setor Solicitante:', col2X + 5, currentY + 23);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(order.requesterSector ? SECTOR_LABELS[order.requesterSector] : 'Operacional', col2X + 38, currentY + 23);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Prioridade:', col2X + 5, currentY + 30);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(order.priority === 'URGENTE' || order.priority === 'ALTA' ? 220 : 15, 38, 38);
  doc.text(order.priority ? PRIORITY_LABELS[order.priority] : 'Normal', col2X + 38, currentY + 30);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Horário de Entrada:', col2X + 5, currentY + 37);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const dataEntrada = order.createdAt ? new Date(order.createdAt).toLocaleString('pt-BR') : '-';
  doc.text(dataEntrada, col2X + 38, currentY + 37);

  currentY += 47;

  // 4. Tabela de Checklist de Higienização Executado
  const checklist = parseChecklist(order.checklistData);
  const checklistRows = checklist.map((item, idx) => [
    (idx + 1).toString(),
    item.category === 'INTERNAL' ? 'Interna' : 'Externa',
    item.title,
    item.checked ? 'CONCLUÍDO' : 'PENDENTE',
    item.photoUrl ? 'Foto anexada' : 'Sem foto',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Setor', 'Item de Higienização', 'Status', 'Evidência Fotográfica']],
    body: checklistRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 28, fontStyle: 'bold' },
      4: { cellWidth: 32, fontStyle: 'italic', textColor: [100, 116, 139] },
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    didParseCell: (data) => {
      if (data.column.index === 3 && data.section === 'body') {
        if (data.cell.raw === 'CONCLUÍDO') {
          data.cell.styles.textColor = [16, 185, 129];
        } else {
          data.cell.styles.textColor = [239, 68, 68];
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 5. Inspeção de Qualidade
  const qualityItems = parseQualityChecklist(order.qualityChecklist);
  const qualityRows = qualityItems.map((q, idx) => [
    (idx + 1).toString(),
    q.title,
    q.checked ? 'APROVADO' : 'NÃO CONFORME',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Critério de Inspeção de Qualidade (Auditoria)', 'Resultado']],
    body: qualityRows,
    theme: 'grid',
    headStyles: {
      fillColor: [14, 116, 144], // cyan-700
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, fontStyle: 'bold', halign: 'center' },
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    didParseCell: (data) => {
      if (data.column.index === 2 && data.section === 'body') {
        if (data.cell.raw === 'APROVADO') {
          data.cell.styles.textColor = [16, 185, 129];
        } else {
          data.cell.styles.textColor = [239, 68, 68];
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 6. Insumos / Produtos Químicos Utilizados
  const supplies = suppliesList || parseSupplies(order.checklistData);
  if (supplies && supplies.length > 0) {
    const suppliesRows = supplies.map((s, idx) => [
      (idx + 1).toString(),
      s.name,
      `${s.quantity} ${s.unit}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Produto Químico / Insumo Aplicado', 'Quantidade Consumida']],
      body: suppliesRows,
      theme: 'grid',
      headStyles: {
        fillColor: [71, 85, 105], // slate-600
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 45, halign: 'center', fontStyle: 'bold' },
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // 7. Observações Gerais
  if (order.observations) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 1.5, 1.5, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('OBSERVAÇÕES OPERACIONAIS:', margin + 4, currentY + 5);

    doc.setFont('helvetica', 'italic');
    doc.setTextColor(30, 41, 59);
    doc.text(order.observations.substring(0, 160), margin + 4, currentY + 10);

    currentY += 18;
  }

  // 8. Assinaturas e Rodapé
  // Garantir espaço antes do final da folha
  if (currentY > pageHeight - 38) {
    doc.addPage();
    currentY = 25;
  }

  const signWidth = (pageWidth - margin * 2 - 20) / 3;
  const signY = pageHeight - 24;

  doc.setDrawColor(148, 163, 184); // slate-400
  doc.line(margin, signY, margin + signWidth, signY);
  doc.line(margin + signWidth + 10, signY, margin + signWidth * 2 + 10, signY);
  doc.line(margin + (signWidth + 10) * 2, signY, pageWidth - margin, signY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);

  doc.text('Operador de Limpeza', margin + signWidth / 2, signY + 4, { align: 'center' });
  doc.text('Inspetor de Qualidade / CCO', margin + signWidth + 10 + signWidth / 2, signY + 4, { align: 'center' });
  doc.text('Motorista / Recebedor', margin + (signWidth + 10) * 2 + signWidth / 2, signY + 4, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  const footerText = `Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} - FlexBus Fleet Management`;
  doc.text(footerText, pageWidth / 2, pageHeight - 6, { align: 'center' });

  return doc;
}

export function downloadCleaningReleasePDF(order: VehicleCleaningOrder, suppliesList?: CleaningSupplyItem[]): void {
  const doc = generateCleaningReleasePDF(order, suppliesList);
  const safePlate = (order.vehiclePlate || 'veiculo').replace(/[^a-zA-Z0-9]/g, '');
  doc.save(`higienizacao-${safePlate}-${order.id.substring(0, 8)}.pdf`);
}

export function openCleaningReleasePDFPreview(order: VehicleCleaningOrder, suppliesList?: CleaningSupplyItem[]): void {
  const doc = generateCleaningReleasePDF(order, suppliesList);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
