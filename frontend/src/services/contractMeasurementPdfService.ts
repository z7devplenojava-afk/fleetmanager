import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  LeasedVehicleItem,
  ExtraTripItem,
  ExcessKmItem,
  ContractDeductionItem,
  RevenueInvoiceData
} from '@/components/financeiro/ClientContractMeasurementManager';

export interface GenerateMeasurementPdfOptions {
  client: {
    id: string;
    clientName: string;
    clientCnpj: string;
    contractNumber: string;
    measurementNumber: string;
    periodStart: string;
    periodEnd: string;
    dueDate: string;
  };
  leasedVehicles: LeasedVehicleItem[];
  extraTrips: ExtraTripItem[];
  excessKmItems: ExcessKmItem[];
  deductions: ContractDeductionItem[];
  invoice: RevenueInvoiceData;
  companyName?: string;
  companyCnpj?: string;
}

export class ContractMeasurementPdfService {
  private static formatCurrency(value?: number): string {
    if (value == null) return 'R$ 0,00';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private static formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const clean = dateStr.substring(0, 10);
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  public static async generateMeasurementPDF(options: GenerateMeasurementPdfOptions): Promise<void> {
    const {
      client,
      leasedVehicles,
      extraTrips,
      excessKmItems,
      deductions,
      invoice,
      companyName = 'Viação São Silvestre LTDA / FluxBus',
      companyCnpj = '33.592.510/0001-54'
    } = options;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // Cabeçalho institucional superior
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setFillColor(234, 179, 8); // yellow-500
    doc.rect(0, 28, pageWidth, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(companyName.toUpperCase(), margin, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`CNPJ: ${companyCnpj}  |  Gestão Integrada de Frotas & Fretamento Corporativo`, margin, 18);
    doc.text('FOLHA OFICIAL DE MEDIÇÃO MENSAL DE SERVIÇOS DE TRANSPORTE', margin, 24);

    // Número da Medição à direita
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(253, 224, 71); // yellow-300
    doc.text(`MEDIÇÃO Nº ${client.measurementNumber}`, pageWidth - margin, 14, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(226, 232, 240);
    doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, 22, { align: 'right' });

    let currentY = 36;

    // Quadro de Identificação do Contrato / Cliente
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`CLIENTE / CONTRATANTE: ${client.clientName.toUpperCase()}`, margin + 4, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`CNPJ: ${client.clientCnpj}`, margin + 4, currentY + 12);
    doc.text(`Contrato Nº: ${client.contractNumber}`, margin + 70, currentY + 12);
    doc.text(
      `Período de Apuração: ${this.formatDate(client.periodStart)} até ${this.formatDate(client.periodEnd)}`,
      margin + 4,
      currentY + 18
    );
    doc.text(`Vencimento Fatura: ${this.formatDate(client.dueDate)}`, margin + 115, currentY + 18);

    currentY += 27;

    // Totais Consolidados da Medição
    const totalLeased = leasedVehicles.reduce((sum, i) => sum + i.totalPeriod, 0);
    const totalExtras = extraTrips.reduce((sum, i) => sum + i.total, 0);
    const totalExcessKm = excessKmItems.reduce((sum, i) => sum + i.totalExcessValue, 0);
    const totalDeductions = deductions.reduce(
      (sum, i) => sum + (i.type === 'DEBIT' ? i.value : -i.value),
      0
    );
    const totalLiquidoMedicao = totalLeased + totalExtras + totalExcessKm - totalDeductions;

    // Resumo dos Totais (Card em colunas)
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 16, 1.5, 1.5, 'FD');

    const colWidth = (pageWidth - margin * 2) / 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);

    doc.text('1. Veículos Locados', margin + 3, currentY + 5);
    doc.text('2. Viagens Extras', margin + colWidth + 3, currentY + 5);
    doc.text('3. KM Excedente', margin + colWidth * 2 + 3, currentY + 5);
    doc.text('4. Deduções / Débitos', margin + colWidth * 3 + 3, currentY + 5);
    doc.text('TOTAL LÍQUIDO MEDIÇÃO', margin + colWidth * 4 + 3, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    doc.text(this.formatCurrency(totalLeased), margin + 3, currentY + 12);
    doc.text(this.formatCurrency(totalExtras), margin + colWidth + 3, currentY + 12);
    doc.text(this.formatCurrency(totalExcessKm), margin + colWidth * 2 + 3, currentY + 12);
    doc.setTextColor(220, 38, 38);
    doc.text(totalDeductions > 0 ? `-${this.formatCurrency(totalDeductions)}` : 'R$ 0,00', margin + colWidth * 3 + 3, currentY + 12);

    doc.setTextColor(22, 101, 52); // green-800
    doc.setFontSize(9);
    doc.text(this.formatCurrency(totalLiquidoMedicao), margin + colWidth * 4 + 3, currentY + 12);

    currentY += 21;

    // Seção 1: Veículos Locados sob Contrato Fixo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`1. VEÍCULOS LOCADOS SOB CONTRATO FIXO (${leasedVehicles.length})`, margin, currentY);
    currentY += 3;

    if (leasedVehicles.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Nenhum veículo alocado para este cliente no período da medição.', margin, currentY + 4);
      currentY += 10;
    } else {
      const leasedRows = leasedVehicles.map((item, idx) => [
        String(idx + 1),
        `${item.description}\nTrajeto: ${item.route}${item.observations ? ` (${item.observations})` : ''}`,
        item.plate,
        this.formatCurrency(item.monthlyRate),
        `${item.workingDays} dias`,
        this.formatCurrency(item.dailyRate),
        this.formatCurrency(item.totalPeriod)
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Item', 'Descrição do Serviço / Trajeto', 'Placa', 'Valor Mensal', 'Dias', 'Valor Diário', 'Total Período']],
        body: leasedRows,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [51, 65, 85],
          valign: 'top',
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 70 },
          2: { cellWidth: 20, fontStyle: 'bold', textColor: [29, 78, 216] },
          3: { cellWidth: 22, halign: 'right' },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 22, halign: 'right' },
          6: { cellWidth: 23, halign: 'right', fontStyle: 'bold', textColor: [22, 101, 52] }
        }
      });

      // @ts-ignore
      currentY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY + 30) + 7;
    }

    // Seção 2: Viagens Extras (se houver)
    if (extraTrips.length > 0) {
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`2. VIAGENS EXTRAS & TURNOS ESPECIAIS (${extraTrips.length})`, margin, currentY);
      currentY += 3;

      const extraRows = extraTrips.map((et) => [
        this.formatDate(et.date),
        et.plate,
        et.route,
        et.vehicleType,
        this.formatCurrency(et.tripCost),
        this.formatCurrency(et.total)
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Data', 'Placa', 'Rota / Finalidade', 'Tipo Veículo', 'Custo Viagem', 'Total']],
        body: extraRows,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], fontSize: 7.5 },
        bodyStyles: { fontSize: 7, cellPadding: 1.8 },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 20 },
          2: { cellWidth: 78 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20, halign: 'right' },
          5: { cellWidth: 20, halign: 'right', fontStyle: 'bold' }
        }
      });

      // @ts-ignore
      currentY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY + 25) + 6;
    }

    // Seção 3: Deduções e Descontos (se houver)
    if (deductions.length > 0) {
      if (currentY > pageHeight - 45) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`3. DEDUÇÕES, SEGUROS & REPASSES CONTRATUAIS (${deductions.length})`, margin, currentY);
      currentY += 3;

      const deductionRows = deductions.map((d) => [
        this.formatDate(d.date),
        d.plate,
        d.description,
        d.type === 'CREDIT' ? 'CRÉDITO' : 'DÉBITO',
        d.type === 'CREDIT' ? `+${this.formatCurrency(d.value)}` : `-${this.formatCurrency(d.value)}`
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Data', 'Placa', 'Descrição do Lançamento', 'Tipo', 'Valor']],
        body: deductionRows,
        theme: 'grid',
        headStyles: { fillColor: [153, 27, 27], fontSize: 7.5 }, // red-800
        bodyStyles: { fontSize: 7, cellPadding: 1.8 },
        columnStyles: {
          0: { cellWidth: 24 },
          1: { cellWidth: 22 },
          2: { cellWidth: 95 },
          3: { cellWidth: 22, halign: 'center' },
          4: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }
        }
      });

      // @ts-ignore
      currentY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY + 20) + 6;
    }

    // Seção 4: Faturamento e Dados da NFS-e
    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 28, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('FATURAMENTO DA MEDIÇÃO & NOTA FISCAL DE SERVIÇO (NFS-e)', margin + 4, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    doc.text(`NFS-e Nº: ${invoice.invoiceNumber || 'A Emitir'}  |  Série: ${invoice.series || '1'}`, margin + 4, currentY + 12);
    doc.text(`Emissão NF: ${this.formatDate(invoice.issueDate)}`, margin + 65, currentY + 12);
    doc.text(`Vencimento: ${this.formatDate(invoice.dueDate)}`, margin + 120, currentY + 12);

    doc.text(`Retenções: PIS (0.65%): ${this.formatCurrency(invoice.pisRetention)}  |  COFINS (3.00%): ${this.formatCurrency(invoice.cofinsRetention)}  |  CSLL (1.00%): ${this.formatCurrency(invoice.csllRetention)}`, margin + 4, currentY + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(22, 101, 52);
    const valorLiquido = invoice.netReceivableValue > 0 ? invoice.netReceivableValue : totalLiquidoMedicao;
    doc.text(`VALOR LÍQUIDO A RECEBER: ${this.formatCurrency(valorLiquido)}`, margin + 4, currentY + 24);

    currentY += 34;

    // Seção de Assinaturas
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 25;
    }

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Atestamos que os serviços de transporte fretado constantes nesta medição foram prestados a contento e estão em conformidade com o contrato.',
      margin,
      currentY
    );
    currentY += 12;

    const signWidth = (pageWidth - margin * 2 - 20) / 2;

    // Assinatura Contratante
    doc.setDrawColor(148, 163, 184);
    doc.line(margin, currentY, margin + signWidth, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(client.clientName.toUpperCase(), margin, currentY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Fiscal do Contrato / Aprovador', margin, currentY + 8);

    // Assinatura Prestadora
    doc.line(margin + signWidth + 20, currentY, pageWidth - margin, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(companyName.toUpperCase(), margin + signWidth + 20, currentY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Gerência de Tráfego & Fretamento', margin + signWidth + 20, currentY + 8);

    // Rodapé em todas as páginas
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

      doc.text(
        'FluxBus • Módulo de Medição & Faturamento de Contratos',
        margin,
        pageHeight - 4
      );
      doc.text(
        `Página ${p} de ${totalPages}`,
        pageWidth - margin,
        pageHeight - 4,
        { align: 'right' }
      );
    }

    const clientSlug = client.clientName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
    const filename = `medicao-${client.measurementNumber}-${clientSlug}.pdf`;
    doc.save(filename);
  }
}

