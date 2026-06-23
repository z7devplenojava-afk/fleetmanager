import jsPDF from 'jspdf';
import type { FleetWorkOrder } from '@/services/fleetWorkOrderService';

function formatCurrency(value: number | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

export async function generateFleetWorkOrderPDFBlob(order: FleetWorkOrder): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  const title = 'ORDEM DE SERVIÇO - FROTA';
  const osNumber = `#${(order.id ?? '').split('-')[0] || order.id}`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Número: ${osNumber}`, margin, 30);
  doc.text(`Veículo: ${order.vehiclePlate || 'N/A'}`, margin, 36);
  doc.text(`Status: ${order.status}`, margin, 42);
  doc.text(`Mão de obra: ${order.laborType}`, margin, 48);
  doc.text(`Data planejada: ${formatDate(order.plannedDate)}`, margin, 54);

  doc.setDrawColor(180);
  doc.line(margin, 60, pageWidth - margin, 60);

  let y = 70;

  doc.setFont('helvetica', 'bold');
  doc.text('Custos', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Mão de obra: ${formatCurrency(order.laborCost)}`, margin, y);
  doc.text(`Peças: ${formatCurrency(order.partsCost)}`, margin + 80, y);
  y += 6;
  doc.text(`Total: ${formatCurrency(order.totalCost)}`, margin, y);
  y += 10;

  if (order.notes && order.notes.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.text('Observações', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(order.notes.trim(), contentWidth);
    for (const line of lines) {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 5;
    }
    y += 6;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Itens / Peças', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');

  const items = Array.isArray(order.items) ? order.items : [];
  if (items.length === 0) {
    doc.text('Nenhum item registrado.', margin, y);
    y += 6;
  } else {
    for (const it of items) {
      const qty = typeof it.quantity === 'number' ? it.quantity : 0;
      const unit = typeof it.unitPrice === 'number' ? it.unitPrice : 0;
      const total = typeof it.totalPrice === 'number' ? it.totalPrice : qty * unit;
      const line = `- ${it.description || '(sem descrição)'} | Qtd: ${qty} | Unit: ${formatCurrency(unit)} | Total: ${formatCurrency(total)}`;
      const lines = doc.splitTextToSize(line, contentWidth);
      for (const l of lines) {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        doc.text(l, margin, y);
        y += 5;
      }
    }
  }

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Gerado em ${new Date().toLocaleString('pt-BR')}`,
    pageWidth - margin,
    pageHeight - 10,
    { align: 'right' }
  );

  return doc.output('blob');
}

