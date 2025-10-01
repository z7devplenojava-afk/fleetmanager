import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import fleetService from '@/services/fleetService';
import driverService from '@/services/driverService';
import { costCenterService, CostCenterDTO } from '@/services/costCenterService';
import { Driver } from '@/types/driver';
import { FuelRecord } from '@/types/fleet';
import { Calendar, Download, Filter, X, Car, User, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Veiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  status: string;
}

interface AbastecimentoReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  veiculos: Veiculo[];
}

interface ReportFilters {
  vehicleId: string;
  driverId: string;
  startDate: string;
  endDate: string;
}

interface ReportData {
  totalRecords: number;
  totalCost: number;
  totalQuantity: number;
  averageCostPerLiter: number;
  records: FuelRecord[];
}

const AbastecimentoReportModal: React.FC<AbastecimentoReportModalProps> = ({
  isOpen,
  onClose,
  veiculos
}) => {
  const { toast } = useToast();
  const [filters, setFilters] = useState<ReportFilters>({
    vehicleId: 'all',
    driverId: 'all',
    startDate: '',
    endDate: ''
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Query para buscar motoristas
  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: async () => {
      try {
        const response = await driverService.getDrivers();
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      } catch (error) {
        console.error('Erro ao buscar motoristas:', error);
        return [];
      }
    },
    enabled: isOpen,
  });

  // Query para buscar centros de custo
  const { data: costCenters = [], isLoading: costCentersLoading } = useQuery<CostCenterDTO[]>({
    queryKey: ['costCenters'],
    queryFn: async () => {
      try {
        const response = await costCenterService.listActive();
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      } catch (error) {
        console.error('Erro ao buscar centros de custo:', error);
        return [];
      }
    },
    enabled: isOpen,
  });

  // Query para buscar todos os abastecimentos (para filtro no frontend)
  const { data: allFuelRecords = [], isLoading: fuelRecordsLoading } = useQuery<FuelRecord[]>({
    queryKey: ['fuelRecords'],
    queryFn: async () => {
      try {
        const response = await fleetService.getFuelRecords();
        return response || [];
      } catch (error) {
        console.error('Erro ao buscar abastecimentos:', error);
        return [];
      }
    },
    enabled: isOpen,
  });

  // Filtrar motoristas ativos
  const activeDrivers = drivers.filter(d => d?.status === 'ATIVO');

  // Filtrar veículos ativos
  const activeVehicles = veiculos.filter(v => 
    v.status.toLowerCase() === 'ativo' || 
    v.status.toLowerCase() === 'active'
  );

  // Gerar relatório
  const generateReport = () => {
    setIsGenerating(true);
    
    try {
      let filteredRecords = [...allFuelRecords];

      // Aplicar filtros
      if (filters.vehicleId && filters.vehicleId !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.vehicleId === filters.vehicleId);
      }

      if (filters.driverId && filters.driverId !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.driver?.id === filters.driverId);
      }

      if (filters.startDate) {
        filteredRecords = filteredRecords.filter(record => record.date >= filters.startDate);
      }

      if (filters.endDate) {
        filteredRecords = filteredRecords.filter(record => record.date <= filters.endDate);
      }

      // Calcular estatísticas
      const totalCost = filteredRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
      const totalQuantity = filteredRecords.reduce((sum, record) => sum + (record.quantity || 0), 0);
      const averageCostPerLiter = totalQuantity > 0 ? totalCost / totalQuantity : 0;

      const report: ReportData = {
        totalRecords: filteredRecords.length,
        totalCost,
        totalQuantity,
        averageCostPerLiter,
        records: filteredRecords
      };

      setReportData(report);
      
      toast({
        title: "Relatório gerado",
        description: `${report.totalRecords} registros encontrados`,
        variant: "default"
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      vehicleId: 'all',
      driverId: 'all',
      startDate: '',
      endDate: ''
    });
    setReportData(null);
  };

  // Exportar relatório para PDF
  const exportToPDF = async () => {
    if (!reportData) return;

    try {
      const blob = await fleetService.exportFuelRecordsPDF({
        vehicleId: filters.vehicleId && filters.vehicleId !== 'all' ? filters.vehicleId : undefined,
        driverId: filters.driverId && filters.driverId !== 'all' ? filters.driverId : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_abastecimentos_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Relatório PDF exportado",
        description: "Arquivo PDF baixado com sucesso",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar PDF",
        variant: "destructive"
      });
    }
  };

  // Exportar relatório para Excel
  const exportToExcel = async () => {
    if (!reportData) return;

    try {
      const blob = await fleetService.exportFuelRecordsExcel({
        vehicleId: filters.vehicleId && filters.vehicleId !== 'all' ? filters.vehicleId : undefined,
        driverId: filters.driverId && filters.driverId !== 'all' ? filters.driverId : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_abastecimentos_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Relatório Excel exportado",
        description: "Arquivo Excel baixado com sucesso",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar Excel",
        variant: "destructive"
      });
    }
  };

  // Exportar relatório para CSV
  const exportToCSV = () => {
    if (!reportData) return;

    const headers = [
      'Data',
      'Veículo',
      'Motorista',
      'Tipo Combustível',
      'Litros',
      'Valor/Litro',
      'Valor Total',
      'Quilometragem',
      'Posto',
      'Centro de Custo',
      'Observações'
    ];

    const csvContent = [
      headers.join(','),
      ...reportData.records.map(record => [
        record.date,
        record.vehiclePlate || '',
        record.driver?.name || '',
        record.fuelType || '',
        record.quantity || 0,
        record.quantity > 0 ? (record.cost / record.quantity).toFixed(2) : '0.00',
        record.cost || 0,
        record.mileage || 0,
        record.station || '',
        getCostCenterName(record.costCenter),
        record.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_abastecimentos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório CSV exportado",
      description: "Arquivo CSV baixado com sucesso",
      variant: "default"
    });
  };

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  // Converter ID do centro de custo para nome
  const getCostCenterName = (costCenterId: string | undefined) => {
    if (!costCenterId) return '-';
    const costCenter = costCenters.find(cc => cc.id === costCenterId);
    return costCenter ? costCenter.name : costCenterId;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-seguranca-black border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-yellow text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatório de Abastecimentos
          </DialogTitle>
          <DialogDescription className="text-seguranca-lightgray">
            Gere relatórios detalhados de abastecimentos com filtros personalizados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-seguranca-graphite p-4 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-seguranca-yellow" />
              <h3 className="text-seguranca-yellow font-semibold">Filtros</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro por Veículo */}
              <div className="flex flex-col">
                <Label htmlFor="vehicle" className="text-sm text-seguranca-lightgray mb-2">
                  <Car className="h-4 w-4 inline mr-1" />
                  Veículo
                </Label>
                <Select 
                  value={filters.vehicleId} 
                  onValueChange={(value) => setFilters({ ...filters, vehicleId: value })}
                >
                  <SelectTrigger className="h-10 border-2 border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow transition-colors">
                    <SelectValue placeholder="Todos os veículos" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                    <SelectItem value="all">Todos os veículos</SelectItem>
                    {activeVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.placa} - {vehicle.marca} {vehicle.modelo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Motorista */}
              <div className="flex flex-col">
                <Label htmlFor="driver" className="text-sm text-seguranca-lightgray mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Motorista
                </Label>
                <Select 
                  value={filters.driverId} 
                  onValueChange={(value) => setFilters({ ...filters, driverId: value })}
                >
                  <SelectTrigger className="h-10 border-2 border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow transition-colors">
                    <SelectValue placeholder="Todos os motoristas" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                    <SelectItem value="all">Todos os motoristas</SelectItem>
                    {activeDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Data Inicial */}
              <div className="flex flex-col">
                <Label htmlFor="startDate" className="text-sm text-seguranca-lightgray mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Data Inicial
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="h-10 border-2 border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow transition-colors"
                />
              </div>

              {/* Filtro por Data Final */}
              <div className="flex flex-col">
                <Label htmlFor="endDate" className="text-sm text-seguranca-lightgray mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Data Final
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="h-10 border-2 border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow transition-colors"
                />
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2 mt-4">
              <Button
                onClick={generateReport}
                disabled={isGenerating || fuelRecordsLoading}
                className="bg-seguranca-yellow hover:bg-yellow-600 text-black font-semibold"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <Filter className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </>
                )}
              </Button>
              
              <Button
                onClick={clearFilters}
                variant="outline"
                className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>

          {/* Resultados do Relatório */}
          {reportData && (
            <div className="space-y-4">
              {/* Estatísticas Resumidas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-seguranca-graphite p-4 rounded-lg border border-gray-600">
                  <div className="text-seguranca-yellow font-semibold">Total de Registros</div>
                  <div className="text-2xl font-bold text-white">{reportData.totalRecords}</div>
                </div>
                <div className="bg-seguranca-graphite p-4 rounded-lg border border-gray-600">
                  <div className="text-seguranca-yellow font-semibold">Valor Total</div>
                  <div className="text-2xl font-bold text-white">{formatCurrency(reportData.totalCost)}</div>
                </div>
                <div className="bg-seguranca-graphite p-4 rounded-lg border border-gray-600">
                  <div className="text-seguranca-yellow font-semibold">Litros Total</div>
                  <div className="text-2xl font-bold text-white">{reportData.totalQuantity.toFixed(2).replace('.', ',')}</div>
                </div>
                <div className="bg-seguranca-graphite p-4 rounded-lg border border-gray-600">
                  <div className="text-seguranca-yellow font-semibold">Valor Médio/Litro</div>
                  <div className="text-2xl font-bold text-white">{formatCurrency(reportData.averageCostPerLiter)}</div>
                </div>
              </div>

              {/* Tabela de Detalhes */}
              <div className="bg-seguranca-graphite rounded-lg border border-gray-600">
                <div className="p-4 border-b border-gray-600">
                  <div className="flex justify-between items-center">
                    <h3 className="text-seguranca-yellow font-semibold">Detalhes dos Abastecimentos</h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={exportToPDF}
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button
                        onClick={exportToExcel}
                        variant="outline"
                        size="sm"
                        className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button
                        onClick={exportToCSV}
                        variant="outline"
                        size="sm"
                        className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        CSV
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-600">
                        <TableHead className="text-seguranca-yellow">Data</TableHead>
                        <TableHead className="text-seguranca-yellow">Veículo</TableHead>
                        <TableHead className="text-seguranca-yellow">Motorista</TableHead>
                        <TableHead className="text-seguranca-yellow">Combustível</TableHead>
                        <TableHead className="text-seguranca-yellow">Litros</TableHead>
                        <TableHead className="text-seguranca-yellow">Valor/Litro</TableHead>
                        <TableHead className="text-seguranca-yellow">Valor Total</TableHead>
                        <TableHead className="text-seguranca-yellow">Quilometragem</TableHead>
                        <TableHead className="text-seguranca-yellow">Posto</TableHead>
                        <TableHead className="text-seguranca-yellow">Centro de Custo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.records.map((record) => (
                        <TableRow key={record.id} className="border-gray-600">
                          <TableCell className="text-seguranca-lightgray">
                            {new Date(record.date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-seguranca-lightgray">
                            {record.vehiclePlate}
                          </TableCell>
                          <TableCell className="text-seguranca-lightgray">
                            {record.driver?.name || '-'}
                          </TableCell>
                          <TableCell className="text-seguranca-lightgray">
                            {record.fuelType}
                          </TableCell>
                          <TableCell className="text-seguranca-lightgray">
                            {record.quantity?.toFixed(2).replace('.', ',') || '0,00'}
                          </TableCell>
                          <TableCell className="text-seguranca-lightgray">
                            {record.quantity > 0 ? formatCurrency(record.cost / record.quantity) : 'R$ 0,00'}
                          </TableCell>
                          <TableCell className="text-seguranca-lightgray">
                            {formatCurrency(record.cost)}
                          </TableCell>
                          <TableCell className="text-seguranca-lightgray">
                            {record.mileage?.toLocaleString('pt-BR') || '0'}
                          </TableCell>
                          <TableCell className="text-seguranca-lightgray">
                            {record.station || '-'}
                          </TableCell>
                          <TableCell className="text-seguranca-lightgray">
                            {getCostCenterName(record.costCenter)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* Botões de Fechar */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-600">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AbastecimentoReportModal;
