import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { getActiveCompanyInfo } from '@/utils/exportUtils';
import {
  VehicleRentalExpense,
  RENTAL_EXPENSE_CATEGORY_LABELS,
  RENTAL_EXPENSE_RESPONSIBILITY_LABELS,
  RENTAL_EXPENSE_STATUS_CONFIG,
} from './vehicleRentalExpenseService';
import { RentalInvoice } from './rentalInvoiceService';

export interface VehicleRentalReportData {
  vehicle: {
    id?: string;
    placa: string;
    marca: string;
    modelo: string;
    ano?: number;
    cor?: string;
    combustivel?: string;
    quilometragem?: number;
    status?: string;
    vehicleType?: string;
    chassi?: string;
    renavan?: string;
  };
  rental: {
    clientId?: string;
    clientName: string;
    clientCnpj?: string;
    workPostName?: string;
    contractNumber?: string;
    startDate?: string;
    endDate?: string;
    monthlyRate?: number;
    garageName?: string;
    departmentName?: string;
    responsibleName?: string;
  };
  expenses: VehicleRentalExpense[];
  invoices?: RentalInvoice[];
}

export class VehicleRentalReportService {
  private static formatCurrency(value?: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value) || 0);
  }

  private static formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    const clean = dateStr.substring(0, 10);
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  /**
   * Gera Relatório Executivo em PDF (jsPDF vetorial A4) da Locação do Veículo e Despesas de Responsabilidade do Cliente
   */
  public static generatePDF(data: VehicleRentalReportData): void {
    const activeCompany = getActiveCompanyInfo();
    const companyName = (activeCompany.nome || 'VIAÇÃO SÃO SILVESTRE LTDA').toUpperCase();
    const companyCnpj = activeCompany.cnpj || '71.055.644/0001-25';
    const companyAddr1 = `CNPJ: ${companyCnpj} • Rua Pelegrino de Paula Ferreira, 77 - CENTRO`;
    const companyAddr2 = 'MOEDA/MG - CEP: 35.470-000 • Tel: (31) 3574-1234';

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageW = 210;
    const pageH = 297;
    const marginX = 10;
    const contentW = pageW - marginX * 2; // 190mm
    const rightX = pageW - marginX;

    let y = 10;

    // ── 1. CABEÇALHO SUPERIOR ──
    pdf.setDrawColor(211, 47, 47);
    pdf.setLineWidth(0.45);
    pdf.roundedRect(marginX, y, 52, 7.5, 1.2, 1.2, 'S');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(211, 47, 47);
    pdf.text('VIAÇÃO SÃO SILVESTRE', marginX + 26, y + 5.1, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(31, 41, 55);
    pdf.text(companyName, marginX, y + 13);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(85, 85, 85);
    pdf.text(companyAddr1, marginX, y + 17.2);
    pdf.text(companyAddr2, marginX, y + 20.8);

    // Coluna Direita do Cabeçalho
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(211, 47, 47);
    pdf.text('RELATÓRIO DE LOCAÇÃO DE VEÍCULO', rightX, y + 4.2, { align: 'right' });

    const subBadge = 'ALOCAÇÃO EM CLIENTE & DESPESAS DA LOCAÇÃO';
    pdf.setFontSize(6.6);
    const subBadgeW = pdf.getTextWidth(subBadge) + 6;
    pdf.setFillColor(211, 47, 47);
    pdf.roundedRect(rightX - subBadgeW, y + 6.2, subBadgeW, 4.8, 1, 1, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text(subBadge, rightX - 3, y + 9.55, { align: 'right' });

    const plateBadgeText = `VEÍCULO: ${(data.vehicle.placa || '—').toUpperCase()}`;
    pdf.setFontSize(8.5);
    const plateBadgeW = Math.max(pdf.getTextWidth(plateBadgeText) + 7, 32);
    pdf.setFillColor(253, 242, 242);
    pdf.setDrawColor(211, 47, 47);
    pdf.setLineWidth(0.35);
    pdf.roundedRect(rightX - plateBadgeW, y + 12.2, plateBadgeW, 5.4, 1, 1, 'FD');
    pdf.setTextColor(211, 47, 47);
    pdf.text(plateBadgeText, rightX - plateBadgeW / 2, y + 16, { align: 'center' });

    const nowDate = new Date().toLocaleDateString('pt-BR');
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.2);
    pdf.setTextColor(85, 85, 85);
    pdf.text(`Emissão: ${nowDate} às ${nowTime}`, rightX, y + 21.2, { align: 'right' });

    y += 24;
    pdf.setDrawColor(211, 47, 47);
    pdf.setLineWidth(0.6);
    pdf.line(marginX, y, rightX, y);

    // ── 2. SUB-BARRA VERDE DE ALOCAÇÃO ATUAL ──
    y += 3;
    const greenBarH = 6.5;
    pdf.setFillColor(241, 248, 233);
    pdf.setDrawColor(200, 230, 201);
    pdf.setLineWidth(0.25);
    pdf.rect(marginX, y, contentW, greenBarH, 'FD');
    pdf.setFillColor(46, 125, 50);
    pdf.rect(marginX, y, 1.5, greenBarH, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.3);
    pdf.setTextColor(27, 94, 32);
    const clientUpper = (data.rental.clientName || 'NÃO INFORMADO').toUpperCase();
    const obraUpper = (data.rental.workPostName || 'GERAL / SEDE').toUpperCase();
    const barText = `CLIENTE ALOCADO: ${clientUpper} • OBRA / SETOR DE TRABALHO: ${obraUpper}`;
    pdf.text(barText, marginX + 3.5, y + 4.3, { maxWidth: contentW - 5 });

    y += greenBarH + 3.5;

    const drawSectionHeader = (title: string, topY: number): number => {
      const h = 5.5;
      pdf.setFillColor(245, 245, 245);
      pdf.rect(marginX, topY, contentW, h, 'F');
      pdf.setFillColor(211, 47, 47);
      pdf.rect(marginX, topY, 1.2, h, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.8);
      pdf.setTextColor(211, 47, 47);
      pdf.text(title, marginX + 3.2, topY + 3.8);
      return topY + h + 1.5;
    };

    const drawInfoRow = (
      topY: number,
      label1: string,
      val1: string,
      label2: string,
      val2: string,
      opts?: { boldVal1?: boolean; boldVal2?: boolean; val2Color?: [number, number, number] }
    ): number => {
      const rowH = 6.2;
      const wLabel1 = 42;
      const wVal1 = 53;
      const wLabel2 = 42;
      const wVal2 = contentW - wLabel1 - wVal1 - wLabel2;

      const x1 = marginX;
      const x2 = x1 + wLabel1;
      const x3 = x2 + wVal1;
      const x4 = x3 + wLabel2;

      pdf.setDrawColor(215, 218, 222);
      pdf.setLineWidth(0.2);

      pdf.setFillColor(242, 243, 245);
      pdf.rect(x1, topY, wLabel1, rowH, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.8);
      pdf.setTextColor(80, 85, 95);
      pdf.text(label1, x1 + 2, topY + 4.1);

      pdf.setFillColor(250, 250, 250);
      pdf.rect(x2, topY, wVal1, rowH, 'FD');
      pdf.setFont('helvetica', opts?.boldVal1 ? 'bold' : 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(20, 24, 31);
      const v1 = pdf.splitTextToSize(val1 || '—', wVal1 - 4)[0] || '—';
      pdf.text(v1, x2 + 2, topY + 4.1);

      pdf.setFillColor(242, 243, 245);
      pdf.rect(x3, topY, wLabel2, rowH, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.8);
      pdf.setTextColor(80, 85, 95);
      pdf.text(label2, x3 + 2, topY + 4.1);

      pdf.setFillColor(250, 250, 250);
      pdf.rect(x4, topY, wVal2, rowH, 'FD');
      pdf.setFont('helvetica', opts?.boldVal2 ? 'bold' : 'normal');
      pdf.setFontSize(7.5);
      if (opts?.val2Color) {
        pdf.setTextColor(...opts.val2Color);
      } else {
        pdf.setTextColor(20, 24, 31);
      }
      const v2 = pdf.splitTextToSize(val2 || '—', wVal2 - 4)[0] || '—';
      pdf.text(v2, x4 + 2, topY + 4.1);

      return topY + rowH;
    };

    // ── 3. SEÇÃO 1: DADOS DO VEÍCULO & ALOCAÇÃO EM CLIENTE ──
    y = drawSectionHeader('1. IDENTIFICAÇÃO DO VEÍCULO & DADOS DA LOCAÇÃO NO CLIENTE', y);
    y = drawInfoRow(
      y,
      'PLACA / VEÍCULO:',
      `${data.vehicle.placa || '—'} — ${[data.vehicle.marca, data.vehicle.modelo].filter(Boolean).join(' ')}`,
      'ANO / QUILOMETRAGEM:',
      `${data.vehicle.ano || '—'} • ${(data.vehicle.quilometragem || 0).toLocaleString('pt-BR')} km`,
      { boldVal1: true }
    );
    y = drawInfoRow(
      y,
      'CLIENTE ALOCADO:',
      data.rental.clientName || 'Não alocado',
      'CNPJ DO CLIENTE:',
      data.rental.clientCnpj || '—',
      { boldVal1: true, boldVal2: true }
    );
    y = drawInfoRow(
      y,
      'OBRA / SETOR DE TRABALHO:',
      data.rental.workPostName || 'Não informado',
      'CONTRATO DE LOCAÇÃO:',
      data.rental.contractNumber || 'Contrato Padrão',
      { boldVal1: true, boldVal2: true }
    );
    y = drawInfoRow(
      y,
      'DATA INICIAL DA LOCAÇÃO:',
      this.formatDate(data.rental.startDate),
      'DATA FINAL DA LOCAÇÃO:',
      data.rental.endDate ? this.formatDate(data.rental.endDate) : 'EM ABERTO (VIGENTE)',
      { boldVal1: true, boldVal2: true, val2Color: data.rental.endDate ? [211, 47, 47] : [21, 128, 61] }
    );
    y = drawInfoRow(
      y,
      'VALOR MENSAL LOCAÇÃO:',
      data.rental.monthlyRate ? this.formatCurrency(data.rental.monthlyRate) : 'Conforme Contrato / Fatura',
      'GARAGEM / DEPARTAMENTO:',
      [data.rental.garageName, data.rental.departmentName].filter(Boolean).join(' • ') || '—',
      { boldVal1: true }
    );

    y += 4;

    // ── 4. SEÇÃO 2: DESPESAS DA LOCAÇÃO (RESPONSABILIDADE DO CLIENTE) ──
    y = drawSectionHeader(
      `2. DESPESAS DA LOCAÇÃO — RESPONSABILIDADE DO CLIENTE (${data.expenses.length} ${data.expenses.length === 1 ? 'LANÇAMENTO' : 'LANÇAMENTOS'})`,
      y
    );

    const wIdx = 8;
    const wData = 18;
    const wCat = 34;
    const wDesc = 52;
    const wObra = 26;
    const wStatus = 26;
    const wVal = contentW - wIdx - wData - wCat - wDesc - wObra - wStatus; // 26mm

    const cx1 = marginX;
    const cx2 = cx1 + wIdx;
    const cx3 = cx2 + wData;
    const cx4 = cx3 + wCat;
    const cx5 = cx4 + wDesc;
    const cx6 = cx5 + wObra;
    const cx7 = cx6 + wStatus;

    const drawExpenseTableHeader = (topY: number): number => {
      const thH = 6;
      pdf.setFillColor(39, 39, 42);
      pdf.rect(marginX, topY, contentW, thH, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.6);
      pdf.setTextColor(255, 255, 255);
      pdf.text('#', cx1 + wIdx / 2, topY + 4, { align: 'center' });
      pdf.text('DATA', cx2 + 1.5, topY + 4);
      pdf.text('CATEGORIA', cx3 + 1.5, topY + 4);
      pdf.text('DESCRIÇÃO / DOC', cx4 + 1.5, topY + 4);
      pdf.text('OBRA / SETOR', cx5 + 1.5, topY + 4);
      pdf.text('STATUS / RESP.', cx6 + 1.5, topY + 4);
      pdf.text('VALOR (R$)', marginX + contentW - 1.5, topY + 4, { align: 'right' });
      return topY + thH;
    };

    y = drawExpenseTableHeader(y);

    if (data.expenses.length === 0) {
      const emptyH = 10;
      pdf.setFillColor(250, 250, 250);
      pdf.setDrawColor(225, 228, 232);
      pdf.rect(marginX, y, contentW, emptyH, 'FD');
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(7.5);
      pdf.setTextColor(120, 120, 120);
      pdf.text(
        'Nenhuma despesa de responsabilidade do cliente registrada para este veículo no período.',
        marginX + contentW / 2,
        y + 6,
        { align: 'center' }
      );
      y += emptyH;
    } else {
      const rowH = 6.6;
      data.expenses.forEach((exp, idx) => {
        if (y + rowH > pageH - 45) {
          pdf.addPage();
          y = 14;
          y = drawExpenseTableHeader(y);
        }

        if (idx % 2 === 1) {
          pdf.setFillColor(248, 249, 250);
          pdf.rect(marginX, y, contentW, rowH, 'F');
        }
        pdf.setDrawColor(225, 228, 232);
        pdf.setLineWidth(0.2);
        pdf.line(marginX, y + rowH, marginX + contentW, y + rowH);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(40, 40, 40);
        pdf.text(String(idx + 1), cx1 + wIdx / 2, y + 4.3, { align: 'center' });

        pdf.text(this.formatDate(exp.expenseDate), cx2 + 1.5, y + 4.3);

        const catLabel = RENTAL_EXPENSE_CATEGORY_LABELS[exp.category] || exp.category || 'Despesa';
        const catClipped = pdf.splitTextToSize(catLabel, wCat - 2.5)[0] || '';
        pdf.setFont('helvetica', 'bold');
        pdf.text(catClipped, cx3 + 1.5, y + 4.3);

        pdf.setFont('helvetica', 'normal');
        const descWithDoc = exp.documentNumber ? `${exp.description} (${exp.documentNumber})` : exp.description;
        const descClipped = pdf.splitTextToSize(descWithDoc || '—', wDesc - 2.5)[0] || '';
        pdf.text(descClipped, cx4 + 1.5, y + 4.3);

        const obraStr = exp.workPostName || data.rental.workPostName || '—';
        const obraClipped = pdf.splitTextToSize(obraStr, wObra - 2.5)[0] || '';
        pdf.text(obraClipped, cx5 + 1.5, y + 4.3);

        const statusLabel = RENTAL_EXPENSE_STATUS_CONFIG[exp.reimbursementStatus]?.label || exp.reimbursementStatus || 'Pendente';
        const statusClipped = pdf.splitTextToSize(statusLabel, wStatus - 2.5)[0] || '';
        pdf.text(statusClipped, cx6 + 1.5, y + 4.3);

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(185, 28, 28);
        pdf.text(this.formatCurrency(exp.amount), cx7 + wVal - 1.5, y + 4.3, { align: 'right' });

        y += rowH;
      });
    }

    // ── 5. RESUMO FINANCEIRO DAS DESPESAS E LOCAÇÃO ──
    const clientExpenses = data.expenses.filter(e => (e.responsibility || 'CLIENTE') !== 'LOCADORA');
    const totalClientExpenses = clientExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const pendingClientExpenses = clientExpenses
      .filter(e => e.reimbursementStatus === 'PENDENTE' || e.reimbursementStatus === 'FATURADO')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const paidClientExpenses = clientExpenses
      .filter(e => e.reimbursementStatus === 'PAGO_PELO_CLIENTE' || e.reimbursementStatus === 'REEMBOLSADO')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const rentalBase = Number(data.rental.monthlyRate) || 0;
    const grandTotal = rentalBase + totalClientExpenses;

    if (y + 58 > pageH - 15) {
      pdf.addPage();
      y = 14;
    }

    y += 4;
    const summaryLeftX = pageW - marginX - 95;
    const summaryLabelRightX = pageW - marginX - 34;
    const summaryValRightX = pageW - marginX - 2;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.6);
    pdf.setTextColor(80, 80, 80);
    pdf.text('DESPESAS PENDENTES DE REEMBOLSO / COBRANÇA:', summaryLabelRightX, y + 3.5, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(180, 83, 9);
    pdf.text(this.formatCurrency(pendingClientExpenses), summaryValRightX, y + 3.5, { align: 'right' });

    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    pdf.text('DESPESAS PAGAS / REEMBOLSADAS PELO CLIENTE:', summaryLabelRightX, y + 3.5, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(21, 128, 61);
    pdf.text(this.formatCurrency(paidClientExpenses), summaryValRightX, y + 3.5, { align: 'right' });

    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    pdf.text('TOTAL DE DESPESAS (RESP. DO CLIENTE):', summaryLabelRightX, y + 3.5, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(20, 20, 20);
    pdf.text(this.formatCurrency(totalClientExpenses), summaryValRightX, y + 3.5, { align: 'right' });

    if (rentalBase > 0) {
      y += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.text('VALOR MENSAL DE REFERÊNCIA DA LOCAÇÃO:', summaryLabelRightX, y + 3.5, { align: 'right' });
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(20, 20, 20);
      pdf.text(this.formatCurrency(rentalBase), summaryValRightX, y + 3.5, { align: 'right' });
    }

    y += 5.5;
    pdf.setDrawColor(45, 45, 48);
    pdf.setLineWidth(0.45);
    pdf.line(summaryLeftX, y, rightX, y);

    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(211, 47, 47);
    pdf.text(
      rentalBase > 0 ? 'TOTAL GERAL (LOCAÇÃO + DESPESAS DO CLIENTE):' : 'TOTAL DE DESPESAS DO CLIENTE:',
      summaryLabelRightX,
      y,
      { align: 'right' }
    );
    pdf.text(this.formatCurrency(rentalBase > 0 ? grandTotal : totalClientExpenses), summaryValRightX, y, { align: 'right' });

    y += 6;

    // ── 6. QUADRO DE ASSINATURAS E CONFERÊNCIA ──
    const sigBoxH = 21;
    const halfW = contentW / 2;
    pdf.setDrawColor(51, 51, 51);
    pdf.setLineWidth(0.3);
    pdf.rect(marginX, y, contentW, sigBoxH, 'S');
    pdf.line(marginX + halfW, y, marginX + halfW, y + sigBoxH);

    const sigLineY = y + 9.5;
    pdf.setLineWidth(0.35);
    pdf.line(marginX + 8, sigLineY, marginX + halfW - 8, sigLineY);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(34, 34, 34);
    pdf.text(companyName, marginX + halfW / 2, sigLineY + 3.8, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.6);
    pdf.setTextColor(100, 100, 100);
    pdf.text('LOCADOR / GESTÃO DE FROTA E LOCAÇÃO', marginX + halfW / 2, sigLineY + 7, { align: 'center' });
    pdf.text('DATA: _____ / _____ / _________', marginX + halfW / 2, sigLineY + 10.2, { align: 'center' });

    pdf.line(marginX + halfW + 8, sigLineY, rightX - 8, sigLineY);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(34, 34, 34);
    pdf.text((data.rental.clientName || 'CLIENTE LOCATÁRIO').toUpperCase(), marginX + halfW + halfW / 2, sigLineY + 3.8, {
      align: 'center',
    });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.6);
    pdf.setTextColor(100, 100, 100);
    pdf.text('CLIENTE / CONFERÊNCIA DE DESPESAS DE LOCAÇÃO', marginX + halfW + halfW / 2, sigLineY + 7, { align: 'center' });
    pdf.text('DATA: _____ / _____ / _________', marginX + halfW + halfW / 2, sigLineY + 10.2, { align: 'center' });

    y += sigBoxH + 4;

    // ── 7. RODAPÉ ──
    const footerY = Math.min(y, pageH - 11);
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.25);
    pdf.line(marginX, footerY, rightX, footerY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(140, 140, 140);
    pdf.text(
      `Relatório de Locação e Despesas do Veículo ${data.vehicle.placa} • Emitido pelo sistema FluxBus em ${nowDate} às ${nowTime}`,
      pageW / 2,
      footerY + 3.5,
      { align: 'center' }
    );
    pdf.text(
      'As despesas listadas referem-se à utilização operacional do veículo durante o período de alocação no cliente.',
      pageW / 2,
      footerY + 6.8,
      { align: 'center' }
    );

    const cleanPlate = (data.vehicle.placa || 'veiculo').replace(/[^a-zA-Z0-9]/g, '');
    pdf.save(`relatorio-locacao-despesas-${cleanPlate}.pdf`);
  }

  /**
   * Gera Relatório Completo em Excel (.xlsx) da Locação do Veículo e Despesas de Responsabilidade do Cliente
   */
  public static generateExcel(data: VehicleRentalReportData): void {
    const wb = XLSX.utils.book_new();

    const clientExpenses = data.expenses.filter(e => (e.responsibility || 'CLIENTE') !== 'LOCADORA');
    const totalClientExpenses = clientExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const pendingClientExpenses = clientExpenses
      .filter(e => e.reimbursementStatus === 'PENDENTE' || e.reimbursementStatus === 'FATURADO')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const paidClientExpenses = clientExpenses
      .filter(e => e.reimbursementStatus === 'PAGO_PELO_CLIENTE' || e.reimbursementStatus === 'REEMBOLSADO')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const summaryRows: any[][] = [
      ['RELATÓRIO DE LOCAÇÃO DE VEÍCULO E DESPESAS DE RESPONSABILIDADE DO CLIENTE'],
      [],
      ['DADOS DO VEÍCULO', '', 'DADOS DA LOCAÇÃO / ALOCAÇÃO NO CLIENTE', ''],
      ['Placa:', data.vehicle.placa || '—', 'Cliente Alocado:', data.rental.clientName || 'Não alocado'],
      [
        'Marca / Modelo:',
        `${data.vehicle.marca || ''} ${data.vehicle.modelo || ''}`.trim() || '—',
        'CNPJ do Cliente:',
        data.rental.clientCnpj || '—',
      ],
      ['Ano:', data.vehicle.ano || '—', 'Obra / Setor de Trabalho:', data.rental.workPostName || '—'],
      ['Quilometragem Atual:', data.vehicle.quilometragem ?? 0, 'Nº do Contrato:', data.rental.contractNumber || '—'],
      ['Chassi / Renavam:', `${data.vehicle.chassi || '—'} / ${data.vehicle.renavan || '—'}`, 'Data Inicial da Locação:', this.formatDate(data.rental.startDate)],
      [
        'Garagem / Departamento:',
        [data.rental.garageName, data.rental.departmentName].filter(Boolean).join(' / ') || '—',
        'Data Final da Locação:',
        data.rental.endDate ? this.formatDate(data.rental.endDate) : 'Em Aberto (Vigente)',
      ],
      ['Valor Mensal Locação (R$):', Number(data.rental.monthlyRate) || 0, 'Total Despesas do Cliente (R$):', totalClientExpenses],
      [],
      ['RELAÇÃO DE DESPESAS DA LOCAÇÃO (RESPONSABILIDADE DO CLIENTE)'],
      [
        '#',
        'Data',
        'Categoria',
        'Descrição da Despesa',
        'Obra / Setor de Trabalho',
        'Nº Documento / NF / OS',
        'Responsabilidade',
        'Status de Cobrança / Reembolso',
        'Valor (R$)',
        'Observações',
      ],
    ];

    if (data.expenses.length === 0) {
      summaryRows.push(['-', '-', '-', 'Nenhuma despesa registrada no período', '-', '-', '-', '-', 0, '']);
    } else {
      data.expenses.forEach((exp, index) => {
        summaryRows.push([
          index + 1,
          this.formatDate(exp.expenseDate),
          RENTAL_EXPENSE_CATEGORY_LABELS[exp.category] || exp.category || 'Despesa',
          exp.description || '—',
          exp.workPostName || data.rental.workPostName || '—',
          exp.documentNumber || '—',
          RENTAL_EXPENSE_RESPONSIBILITY_LABELS[exp.responsibility] || exp.responsibility || 'Responsabilidade do Cliente',
          RENTAL_EXPENSE_STATUS_CONFIG[exp.reimbursementStatus]?.label || exp.reimbursementStatus || 'Pendente',
          Number(exp.amount) || 0,
          exp.notes || '',
        ]);
      });
    }

    summaryRows.push([]);
    summaryRows.push(['', '', '', '', '', '', '', 'DESPESAS PENDENTES (R$):', pendingClientExpenses]);
    summaryRows.push(['', '', '', '', '', '', '', 'DESPESAS PAGAS / REEMBOLSADAS (R$):', paidClientExpenses]);
    summaryRows.push(['', '', '', '', '', '', '', 'TOTAL DE DESPESAS DO CLIENTE (R$):', totalClientExpenses]);
    if (Number(data.rental.monthlyRate) > 0) {
      summaryRows.push(['', '', '', '', '', '', '', 'VALOR DE LOCAÇÃO (R$):', Number(data.rental.monthlyRate)]);
      summaryRows.push(['', '', '', '', '', '', '', 'TOTAL GERAL (LOCAÇÃO + DESPESAS) (R$):', Number(data.rental.monthlyRate) + totalClientExpenses]);
    }

    const ws = XLSX.utils.aoa_to_sheet(summaryRows);
    ws['!cols'] = [
      { wch: 18 },
      { wch: 24 },
      { wch: 30 },
      { wch: 42 },
      { wch: 26 },
      { wch: 22 },
      { wch: 26 },
      { wch: 30 },
      { wch: 18 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Locação e Despesas');

    if (data.invoices && data.invoices.length > 0) {
      const invRows: any[][] = [
        ['FATURAS DE LOCAÇÃO VINCULADAS AO VEÍCULO'],
        ['Nº Fatura', 'Cliente', 'Contrato', 'Início Período', 'Fim Período', 'Vencimento', 'Status', 'Valor Fatura (R$)'],
        ...data.invoices.map(inv => [
          inv.number,
          inv.clientName || '—',
          inv.contractNumber || '—',
          this.formatDate(inv.periodStart),
          this.formatDate(inv.periodEnd),
          this.formatDate(inv.dueDate),
          inv.status,
          Number(inv.netAmount || inv.totalAmount) || 0,
        ]),
      ];
      const wsInv = XLSX.utils.aoa_to_sheet(invRows);
      wsInv['!cols'] = [
        { wch: 14 },
        { wch: 32 },
        { wch: 20 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, wsInv, 'Faturas de Locação');
    }

    const cleanPlate = (data.vehicle.placa || 'veiculo').replace(/[^a-zA-Z0-9]/g, '');
    XLSX.writeFile(wb, `relatorio-locacao-despesas-${cleanPlate}.xlsx`);
  }
}

