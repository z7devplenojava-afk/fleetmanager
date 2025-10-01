import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FuelRecord } from '@/types/fleet';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

class ExportService {
  async exportToPDF(abastecimentos: FuelRecord[], filters?: any) {
    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.text('Relatório de Abastecimentos', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 30);
    
    if (filters) {
      let filterText = 'Filtros aplicados: ';
      if (filters.dataInicio) filterText += `Data início: ${format(filters.dataInicio, 'dd/MM/yyyy')} `;
      if (filters.dataFim) filterText += `Data fim: ${format(filters.dataFim, 'dd/MM/yyyy')} `;
      if (filters.veiculoId) filterText += `Veículo específico `;
      if (filters.posto) filterText += `Posto: ${filters.posto} `;
      
      doc.text(filterText, 20, 40);
    }
    
    // Estatísticas
    const totalCost = abastecimentos.reduce((sum, record) => sum + record.cost, 0);
    const totalLiters = abastecimentos.reduce((sum, record) => sum + record.quantity, 0);
    const avgPrice = totalLiters > 0 ? totalCost / totalLiters : 0;
    
    doc.text(`Total de registros: ${abastecimentos.length}`, 20, 55);
    doc.text(`Custo total: R$ ${totalCost.toFixed(2)}`, 20, 65);
    doc.text(`Total de litros: ${totalLiters.toFixed(2)}L`, 20, 75);
    doc.text(`Preço médio por litro: R$ ${avgPrice.toFixed(3)}`, 20, 85);
    
    // Tabela
    const tableData = abastecimentos.map(record => [
      format(parseISO(record.date), 'dd/MM/yyyy'),
      record.vehiclePlate,
      `${record.mileage.toLocaleString()} km`,
      `${record.quantity.toFixed(2)}L`,
      `R$ ${(record.cost / record.quantity).toFixed(3)}`,
      `R$ ${record.cost.toFixed(2)}`,
      record.station || '-'
    ]);
    
    (doc as any).autoTable({
      head: [['Data', 'Veículo', 'Km', 'Litros', 'Preço/L', 'Total', 'Posto']],
      body: tableData,
      startY: 95,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] }
    });
    
    doc.save(`abastecimentos_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
  }
  
  async exportToExcel(abastecimentos: FuelRecord[], filters?: any) {
    const workbook = XLSX.utils.book_new();
    
    // Dados principais
    const mainData = abastecimentos.map(record => ({
      'Data': format(parseISO(record.date), 'dd/MM/yyyy'),
      'Veículo': record.vehiclePlate,
      'Quilometragem': record.mileage,
      'Litros': record.quantity,
      'Preço por Litro': record.cost / record.quantity,
      'Valor Total': record.cost,
      'Posto': record.station || '',
      'Tipo Combustível': record.fuelType,
      'Observações': record.notes || ''
    }));
    
    const mainSheet = XLSX.utils.json_to_sheet(mainData);
    XLSX.utils.book_append_sheet(workbook, mainSheet, 'Abastecimentos');
    
    // Estatísticas
    const totalCost = abastecimentos.reduce((sum, record) => sum + record.cost, 0);
    const totalLiters = abastecimentos.reduce((sum, record) => sum + record.quantity, 0);
    const avgPrice = totalLiters > 0 ? totalCost / totalLiters : 0;
    
    const statsData = [
      { 'Estatística': 'Total de Registros', 'Valor': abastecimentos.length },
      { 'Estatística': 'Custo Total', 'Valor': `R$ ${totalCost.toFixed(2)}` },
      { 'Estatística': 'Total de Litros', 'Valor': `${totalLiters.toFixed(2)}L` },
      { 'Estatística': 'Preço Médio por Litro', 'Valor': `R$ ${avgPrice.toFixed(3)}` }
    ];
    
    const statsSheet = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estatísticas');
    
    // Resumo por posto
    const postoStats = abastecimentos.reduce((acc, record) => {
      const posto = record.station || 'Não informado';
      if (!acc[posto]) {
        acc[posto] = { custo: 0, litros: 0, count: 0 };
      }
      acc[posto].custo += record.cost;
      acc[posto].litros += record.quantity;
      acc[posto].count += 1;
      return acc;
    }, {} as Record<string, any>);
    
    const postoData = Object.entries(postoStats).map(([posto, stats]) => ({
      'Posto': posto,
      'Abastecimentos': stats.count,
      'Total Litros': stats.litros.toFixed(2),
      'Custo Total': `R$ ${stats.custo.toFixed(2)}`,
      'Preço Médio': `R$ ${(stats.custo / stats.litros).toFixed(3)}`
    }));
    
    const postoSheet = XLSX.utils.json_to_sheet(postoData);
    XLSX.utils.book_append_sheet(workbook, postoSheet, 'Resumo por Posto');
    
    XLSX.writeFile(workbook, `abastecimentos_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`);
  }
}

export default new ExportService();