import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Vehicle } from '@/types/fleet';

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  BUS_ROAD: 'Ônibus Rodoviário',
  BUS_LUXURY_TOURISM: 'Luxo Turismo',
  BUS_URBAN: 'Ônibus Urbano',
  MINIBUS: 'Micro-ônibus',
  VAN: 'Van',
  CAR_UTILITY: 'Utilitário',
  CAR: 'Carro',
  TRUCK: 'Caminhão',
  MOTORCYCLE: 'Moto',
  PICKUP: 'Pickup',
  SUV: 'SUV',
  OTHER: 'Outro',
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  DAILY: 'Diário',
  MONTHLY: 'Mensal',
  PER_TRIP: 'Por Viagem',
  PERCENTAGE: 'Percentual',
};

function getContractStatus(veiculo: Vehicle): string {
  if (!veiculo.aggregatedContractEndDate) return 'Sem contrato';
  const endDate = new Date(veiculo.aggregatedContractEndDate);
  const today = new Date();
  const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Vencido';
  if (diffDays <= 30) return `Vence em ${diffDays} dias`;
  return 'Ativo';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatCurrency(value?: number): string {
  if (value == null || value === 0) return '—';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

class AgregadosExportService {
  async exportToPDF(veiculos: Vehicle[], filename?: string) {
    const aggregated = veiculos.filter((v) => v.isAggregated === true);
    const doc = new jsPDF('landscape', 'mm', 'a4');

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Veículos Agregados', 15, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
      15,
      26
    );
    doc.text(`Total de agregados: ${aggregated.length}`, 15, 32);

    // Summary stats
    const totalDaily = aggregated.reduce((s, v) => s + (v.aggregatedDailyRate || 0), 0);
    const totalMonthly = aggregated.reduce((s, v) => s + (v.aggregatedMonthlyRate || 0), 0);
    const expired = aggregated.filter(
      (v) => v.aggregatedContractEndDate && new Date(v.aggregatedContractEndDate) < new Date()
    ).length;

    doc.setFontSize(9);
    doc.text(`Receita diária total: ${formatCurrency(totalDaily)}`, 15, 39);
    doc.text(`Receita mensal total: ${formatCurrency(totalMonthly)}`, 100, 39);
    doc.text(`Contratos vencidos: ${expired}`, 200, 39);

    // Table
    const tableData = aggregated.map((v) => [
      v.plate,
      VEHICLE_TYPE_LABELS[v.vehicleType || 'OTHER'] || v.vehicleType || '—',
      `${v.brand} ${v.model} ${v.year}`,
      v.aggregatedOwnerName || '—',
      v.aggregatedOwnerCpfCnpj || '—',
      v.aggregatedOwnerPhone || '—',
      PAYMENT_TYPE_LABELS[v.aggregatedPaymentType || ''] || '—',
      formatCurrency(v.aggregatedDailyRate),
      formatCurrency(v.aggregatedMonthlyRate),
      formatDate(v.aggregatedContractStartDate),
      formatDate(v.aggregatedContractEndDate),
      getContractStatus(v),
    ]);

    (doc as any).autoTable({
      head: [
        [
          'Placa',
          'Tipo',
          'Veículo',
          'Proprietário',
          'CPF/CNPJ',
          'Telefone',
          'Pagamento',
          'Diária',
          'Mensal',
          'Início',
          'Término',
          'Status',
        ],
      ],
      body: tableData,
      startY: 44,
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [45, 45, 45],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        7: { halign: 'right' },
        8: { halign: 'right' },
      },
      didParseCell: (data: any) => {
        // Color code contract status
        if (data.section === 'body' && data.column.index === 11) {
          const val = data.cell.raw;
          if (val === 'Vencido') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          } else if (val?.includes('Vence em')) {
            data.cell.styles.textColor = [234, 88, 12];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'Ativo') {
            data.cell.styles.textColor = [22, 163, 74];
          }
        }
      },
    });

    const outputFilename =
      filename || `agregados_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pdf`;
    doc.save(outputFilename);
  }

  async exportToExcel(veiculos: Vehicle[], filename?: string) {
    const aggregated = veiculos.filter((v) => v.isAggregated === true);
    const workbook = XLSX.utils.book_new();

    // Main sheet
    const mainData = aggregated.map((v) => ({
      Placa: v.plate,
      Tipo: VEHICLE_TYPE_LABELS[v.vehicleType || 'OTHER'] || v.vehicleType || '',
      Marca: v.brand,
      Modelo: v.model,
      Ano: v.year,
      Cor: v.color,
      Status: v.status,
      Proprietário: v.aggregatedOwnerName || '',
      'CPF/CNPJ': v.aggregatedOwnerCpfCnpj || '',
      Telefone: v.aggregatedOwnerPhone || '',
      'E-mail': v.aggregatedOwnerEmail || '',
      'Tipo Pagamento': PAYMENT_TYPE_LABELS[v.aggregatedPaymentType || ''] || '',
      'Valor Diário (R$)': v.aggregatedDailyRate || 0,
      'Valor Mensal (R$)': v.aggregatedMonthlyRate || 0,
      'Data Início Contrato': formatDate(v.aggregatedContractStartDate),
      'Data Término Contrato': formatDate(v.aggregatedContractEndDate),
      'Status Contrato': getContractStatus(v),
      Observações: v.aggregatedNotes || '',
    }));

    const mainSheet = XLSX.utils.json_to_sheet(mainData);

    // Column widths
    mainSheet['!cols'] = [
      { wch: 10 }, // Placa
      { wch: 18 }, // Tipo
      { wch: 12 }, // Marca
      { wch: 15 }, // Modelo
      { wch: 6 },  // Ano
      { wch: 10 }, // Cor
      { wch: 12 }, // Status
      { wch: 22 }, // Proprietário
      { wch: 18 }, // CPF/CNPJ
      { wch: 16 }, // Telefone
      { wch: 22 }, // E-mail
      { wch: 16 }, // Tipo Pagamento
      { wch: 14 }, // Valor Diário
      { wch: 14 }, // Valor Mensal
      { wch: 16 }, // Data Início
      { wch: 16 }, // Data Término
      { wch: 16 }, // Status Contrato
      { wch: 30 }, // Observações
    ];

    XLSX.utils.book_append_sheet(workbook, mainSheet, 'Agregados');

    // Summary sheet
    const totalDaily = aggregated.reduce((s, v) => s + (v.aggregatedDailyRate || 0), 0);
    const totalMonthly = aggregated.reduce((s, v) => s + (v.aggregatedMonthlyRate || 0), 0);
    const totalAnnual = totalMonthly * 12;

    const byPaymentType = aggregated.reduce(
      (acc, v) => {
        const type = v.aggregatedPaymentType || 'Não informado';
        if (!acc[type]) acc[type] = { count: 0, daily: 0, monthly: 0 };
        acc[type].count++;
        acc[type].daily += v.aggregatedDailyRate || 0;
        acc[type].monthly += v.aggregatedMonthlyRate || 0;
        return acc;
      },
      {} as Record<string, { count: number; daily: number; monthly: number }>
    );

    const byVehicleType = aggregated.reduce(
      (acc, v) => {
        const type = VEHICLE_TYPE_LABELS[v.vehicleType || 'OTHER'] || 'Outro';
        if (!acc[type]) acc[type] = 0;
        acc[type]++;
        return acc;
      },
      {} as Record<string, number>
    );

    const contractStatuses = aggregated.reduce(
      (acc, v) => {
        const status = getContractStatus(v);
        if (!acc[status]) acc[status] = 0;
        acc[status]++;
        return acc;
      },
      {} as Record<string, number>
    );

    const summaryData = [
      { 'Resumo': 'Total de Agregados', 'Valor': aggregated.length },
      { 'Resumo': 'Receita Diária Total', 'Valor': formatCurrency(totalDaily) },
      { 'Resumo': 'Receita Mensal Total', 'Valor': formatCurrency(totalMonthly) },
      { 'Resumo': 'Receita Anual Estimada', 'Valor': formatCurrency(totalAnnual) },
      { 'Resumo': '', 'Valor': '' },
      { 'Resumo': '--- Por Tipo de Pagamento ---', 'Valor': '' },
      ...Object.entries(byPaymentType).map(([type, stats]) => ({
        Resumo: `${type} (${stats.count} veículos)`,
        Valor: `Diária: ${formatCurrency(stats.daily)} | Mensal: ${formatCurrency(stats.monthly)}`,
      })),
      { 'Resumo': '', 'Valor': '' },
      { 'Resumo': '--- Por Tipo de Veículo ---', 'Valor': '' },
      ...Object.entries(byVehicleType).map(([type, count]) => ({
        Resumo: type,
        Valor: `${count} veículo(s)`,
      })),
      { 'Resumo': '', 'Valor': '' },
      { 'Resumo': '--- Status dos Contratos ---', 'Valor': '' },
      ...Object.entries(contractStatuses).map(([status, count]) => ({
        Resumo: status,
        Valor: `${count} contrato(s)`,
      })),
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 40 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

    const outputFilename =
      filename || `agregados_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
    XLSX.writeFile(workbook, outputFilename);
  }
}

export const agregadosExportService = new AgregadosExportService();
export default agregadosExportService;
