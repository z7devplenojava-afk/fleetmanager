import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Vehicle } from '@/types/fleet';

const PAYMENT_LABELS: Record<string, string> = {
  DAILY: 'Diário',
  MONTHLY: 'Mensal',
  PER_TRIP: 'Por Viagem',
  PERCENTAGE: 'Percentual',
};

function calculateMonthlyRevenue(vehicle: Vehicle): number {
  const dailyRate = vehicle.aggregatedDailyRate || 0;
  const monthlyRate = vehicle.aggregatedMonthlyRate || 0;

  switch (vehicle.aggregatedPaymentType) {
    case 'DAILY':
      return dailyRate * 30;
    case 'MONTHLY':
      return monthlyRate;
    case 'PER_TRIP':
      return dailyRate * 22;
    case 'PERCENTAGE':
      return monthlyRate;
    default:
      return 0;
  }
}

function calculatePeriodRevenue(vehicle: Vehicle, months: number): number {
  return calculateMonthlyRevenue(vehicle) * months;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isContractActiveInPeriod(vehicle: Vehicle, periodStart: Date, periodEnd: Date): boolean {
  const contractStart = vehicle.aggregatedContractStartDate
    ? new Date(vehicle.aggregatedContractStartDate)
    : null;
  const contractEnd = vehicle.aggregatedContractEndDate
    ? new Date(vehicle.aggregatedContractEndDate)
    : null;

  if (!contractStart && !contractEnd) return true;
  if (contractStart && !contractEnd) return contractStart <= periodEnd;
  if (!contractStart && contractEnd) return contractEnd >= periodStart;
  return contractStart! <= periodEnd && contractEnd! >= periodStart;
}

export interface DashboardPDFData {
  periodLabel: string;
  periodStart: Date;
  periodEnd: Date;
  periodMonths: number;
  vehicles: Vehicle[];
}

class AgregadosDashboardPDFService {
  /**
   * Captura o elemento HTML do dashboard e gera um PDF
   */
  async generatePDFFromElement(
    element: HTMLElement,
    data: DashboardPDFData,
    filename?: string
  ): Promise<void> {
    const {
      periodLabel,
      periodStart,
      periodEnd,
      periodMonths,
      vehicles,
    } = data;

    const aggregatedVehicles = vehicles.filter((v) => v.isAggregated);
    const activeVehicles = aggregatedVehicles.filter((v) =>
      isContractActiveInPeriod(v, periodStart, periodEnd)
    );

    // Capturar o dashboard como imagem
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#1a1a2e',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');

    // Criar PDF paisagem A4
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // ===== PÁGINA 1: Dashboard Visual =====
    // Cabeçalho
    pdf.setFillColor(26, 26, 46);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Dashboard Financeiro — Agregados', 15, 18);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(180, 180, 180);
    pdf.text(`Período: ${periodLabel}`, 15, 26);
    pdf.text(
      `Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
      15,
      33
    );

    // Adicionar imagem do dashboard
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Limitar à altura da página disponível
    const maxImgHeight = pageHeight - 42;
    const finalImgHeight = Math.min(imgHeight, maxImgHeight);
    const finalImgWidth = (finalImgHeight / imgHeight) * imgWidth;

    pdf.addImage(imgData, 'PNG', 10, 40, finalImgWidth, finalImgHeight);

    // ===== PÁGINA 2: Dados Tabulares =====
    pdf.addPage();

    pdf.setFillColor(26, 26, 46);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Dados Detalhados — Veículos Agregados', 15, 18);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(180, 180, 180);
    pdf.text(`Período: ${periodLabel} | Veículos ativos: ${activeVehicles.length}`, 15, 26);

    // Resumo executivo
    const totalPeriodRevenue = activeVehicles.reduce(
      (sum, v) => sum + calculatePeriodRevenue(v, periodMonths),
      0
    );
    const totalMonthlyRevenue = activeVehicles.reduce(
      (sum, v) => sum + calculateMonthlyRevenue(v),
      0
    );
    const totalDailyRevenue = activeVehicles.reduce((sum, v) => {
      if (v.aggregatedPaymentType === 'DAILY' || v.aggregatedPaymentType === 'PER_TRIP') {
        return sum + (v.aggregatedDailyRate || 0);
      }
      return sum;
    }, 0);

    pdf.setFontSize(9);
    pdf.setTextColor(100, 200, 100);
    pdf.text(`Receita no período: ${formatCurrency(totalPeriodRevenue)}`, 15, 34);
    pdf.setTextColor(100, 150, 255);
    pdf.text(`Receita mensal: ${formatCurrency(totalMonthlyRevenue)}`, 110, 34);
    pdf.setTextColor(255, 180, 50);
    pdf.text(`Receita diária: ${formatCurrency(totalDailyRevenue)}`, 200, 34);

    // Tabela de veículos
    const tableStartY = 42;
    const colWidths = [25, 30, 35, 30, 35, 30, 30, 30, 35];
    const headers = [
      'Placa',
      'Tipo',
      'Proprietário',
      'Pagamento',
      'Valor Diário',
      'Valor Mensal',
      'Receita Período',
      'Início',
      'Fim',
    ];

    // Cabeçalho da tabela
    let x = 15;
    pdf.setFillColor(45, 45, 65);
    pdf.rect(15, tableStartY - 1, pageWidth - 30, 8, 'F');

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);

    headers.forEach((header, i) => {
      pdf.text(header, x + 2, tableStartY + 5);
      x += colWidths[i];
    });

    // Linhas da tabela
    pdf.setFont('helvetica', 'normal');
    let currentY = tableStartY + 10;

    activeVehicles.forEach((vehicle, index) => {
      if (currentY > pageHeight - 20) {
        pdf.addPage();
        pdf.setFillColor(26, 26, 46);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        currentY = 20;
      }

      // Cor alternada
      if (index % 2 === 0) {
        pdf.setFillColor(35, 35, 55);
        pdf.rect(15, currentY - 4, pageWidth - 30, 7, 'F');
      }

      const paymentType = vehicle.aggregatedPaymentType || 'DAILY';
      const row = [
        vehicle.plate || '—',
        PAYMENT_LABELS[paymentType] || paymentType,
        (vehicle.aggregatedOwnerName || '—').substring(0, 20),
        PAYMENT_LABELS[paymentType] || '—',
        formatCurrency(vehicle.aggregatedDailyRate || 0),
        formatCurrency(vehicle.aggregatedMonthlyRate || 0),
        formatCurrency(calculatePeriodRevenue(vehicle, periodMonths)),
        vehicle.aggregatedContractStartDate
          ? new Date(vehicle.aggregatedContractStartDate).toLocaleDateString('pt-BR')
          : '—',
        vehicle.aggregatedContractEndDate
          ? new Date(vehicle.aggregatedContractEndDate).toLocaleDateString('pt-BR')
          : '—',
      ];

      pdf.setFontSize(7);
      pdf.setTextColor(200, 200, 200);
      x = 15;
      row.forEach((cell, i) => {
        pdf.text(cell, x + 2, currentY + 2);
        x += colWidths[i];
      });

      currentY += 7;
    });

    // ===== PÁGINA 3: Resumo por Tipo de Pagamento =====
    pdf.addPage();
    pdf.setFillColor(26, 26, 46);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Resumo por Tipo de Pagamento', 15, 18);

    const grouped: Record<string, { count: number; daily: number; monthly: number }> = {};
    activeVehicles.forEach((v) => {
      const type = v.aggregatedPaymentType || 'DAILY';
      if (!grouped[type]) grouped[type] = { count: 0, daily: 0, monthly: 0 };
      grouped[type].count += 1;
      if (type === 'DAILY' || type === 'PER_TRIP') {
        grouped[type].daily += v.aggregatedDailyRate || 0;
      } else {
        grouped[type].monthly += v.aggregatedMonthlyRate || 0;
      }
    });

    let summaryY = 32;
    Object.entries(grouped).forEach(([type, data]) => {
      const totalMonthly =
        type === 'DAILY' || type === 'PER_TRIP' ? data.daily * 30 : data.monthly;
      const totalPeriod = totalMonthly * periodMonths;

      pdf.setFillColor(45, 45, 65);
      pdf.roundedRect(15, summaryY, pageWidth - 30, 22, 3, 3, 'F');

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 180, 50);
      pdf.text(`Pagamento ${PAYMENT_LABELS[type] || type}`, 20, summaryY + 8);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');

      pdf.setTextColor(100, 200, 100);
      pdf.text(`Veículos: ${data.count}`, 20, summaryY + 15);
      pdf.text(`Receita Mensal: ${formatCurrency(totalMonthly)}`, 80, summaryY + 15);
      pdf.text(`Receita no Período: ${formatCurrency(totalPeriod)}`, 180, summaryY + 15);

      if (type === 'DAILY' || type === 'PER_TRIP') {
        pdf.setTextColor(180, 180, 180);
        pdf.text(`Valor Diário Total: ${formatCurrency(data.daily)}`, 20, summaryY + 20);
      } else {
        pdf.setTextColor(180, 180, 180);
        pdf.text(`Valor Mensal Total: ${formatCurrency(data.monthly)}`, 20, summaryY + 20);
      }

      summaryY += 28;
    });

    // Total geral
    summaryY += 5;
    pdf.setFillColor(30, 60, 30);
    pdf.roundedRect(15, summaryY, pageWidth - 30, 12, 3, 3, 'F');

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 255, 100);
    pdf.text(`TOTAL GERAL — Receita no Período: ${formatCurrency(totalPeriodRevenue)}`, 20, summaryY + 8);

    // Rodapé
    const footerY = pageHeight - 10;
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      `Fleet Manager — Dashboard de Agregados | Período: ${periodLabel} | Gerado automaticamente`,
      15,
      footerY
    );

    // Salvar
    const defaultFilename = `dashboard-agregados-${periodLabel.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    pdf.save(filename || defaultFilename);
  }

  /**
   * Gera PDF apenas com dados (sem captura visual)
   */
  async generateDataPDF(data: DashboardPDFData, filename?: string): Promise<void> {
    const {
      periodLabel,
      periodStart,
      periodEnd,
      periodMonths,
      vehicles,
    } = data;

    const aggregatedVehicles = vehicles.filter((v) => v.isAggregated);
    const activeVehicles = aggregatedVehicles.filter((v) =>
      isContractActiveInPeriod(v, periodStart, periodEnd)
    );

    const pdf = new jsPDF('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Header
    pdf.setFillColor(26, 26, 46);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Dashboard Financeiro — Agregados', 15, 18);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(180, 180, 180);
    pdf.text(`Período: ${periodLabel}`, 15, 26);
    pdf.text(
      `Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
      15,
      33
    );

    const totalPeriodRevenue = activeVehicles.reduce(
      (sum, v) => sum + calculatePeriodRevenue(v, periodMonths),
      0
    );
    const totalMonthlyRevenue = activeVehicles.reduce(
      (sum, v) => sum + calculateMonthlyRevenue(v),
      0
    );

    pdf.setFontSize(9);
    pdf.setTextColor(100, 200, 100);
    pdf.text(`Receita no período: ${formatCurrency(totalPeriodRevenue)}`, 15, 41);
    pdf.setTextColor(100, 150, 255);
    pdf.text(`Receita mensal: ${formatCurrency(totalMonthlyRevenue)}`, 110, 41);
    pdf.setTextColor(255, 180, 50);
    pdf.text(`Veículos ativos: ${activeVehicles.length}`, 200, 41);

    // Tabela
    const tableStartY = 50;
    const colWidths = [25, 30, 35, 30, 35, 30, 30, 30, 35];
    const headers = [
      'Placa',
      'Tipo',
      'Proprietário',
      'Pagamento',
      'Valor Diário',
      'Valor Mensal',
      'Receita Período',
      'Início',
      'Fim',
    ];

    let x = 15;
    pdf.setFillColor(45, 45, 65);
    pdf.rect(15, tableStartY - 1, pageWidth - 30, 8, 'F');

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    headers.forEach((header, i) => {
      pdf.text(header, x + 2, tableStartY + 5);
      x += colWidths[i];
    });

    pdf.setFont('helvetica', 'normal');
    let currentY = tableStartY + 10;

    activeVehicles.forEach((vehicle, index) => {
      if (currentY > pageHeight - 20) {
        pdf.addPage();
        pdf.setFillColor(26, 26, 46);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        currentY = 20;
      }

      if (index % 2 === 0) {
        pdf.setFillColor(35, 35, 55);
        pdf.rect(15, currentY - 4, pageWidth - 30, 7, 'F');
      }

      const paymentType = vehicle.aggregatedPaymentType || 'DAILY';
      const row = [
        vehicle.plate || '—',
        PAYMENT_LABELS[paymentType] || paymentType,
        (vehicle.aggregatedOwnerName || '—').substring(0, 20),
        PAYMENT_LABELS[paymentType] || '—',
        formatCurrency(vehicle.aggregatedDailyRate || 0),
        formatCurrency(vehicle.aggregatedMonthlyRate || 0),
        formatCurrency(calculatePeriodRevenue(vehicle, periodMonths)),
        vehicle.aggregatedContractStartDate
          ? new Date(vehicle.aggregatedContractStartDate).toLocaleDateString('pt-BR')
          : '—',
        vehicle.aggregatedContractEndDate
          ? new Date(vehicle.aggregatedContractEndDate).toLocaleDateString('pt-BR')
          : '—',
      ];

      pdf.setFontSize(7);
      pdf.setTextColor(200, 200, 200);
      x = 15;
      row.forEach((cell, i) => {
        pdf.text(cell, x + 2, currentY + 2);
        x += colWidths[i];
      });

      currentY += 7;
    });

    // Rodapé
    const footerY = pageHeight - 10;
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      `Fleet Manager — Dashboard de Agregados | Período: ${periodLabel} | Gerado automaticamente`,
      15,
      footerY
    );

    const defaultFilename = `dashboard-agregados-${periodLabel.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    pdf.save(filename || defaultFilename);
  }
}

export const agregadosDashboardPDFService = new AgregadosDashboardPDFService();
