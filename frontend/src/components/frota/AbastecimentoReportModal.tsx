import React, { useState, useEffect } from 'react';
import { ResponsiveDrawer } from '@/components/ResponsiveDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { resolveCompanyLogoUrl } from '@/utils/logoUtils';
import { downloadFuelReportsPDF, computeFuelReportsKpis } from '@/utils/fuelReportsPDFGenerator';
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

const getVehiclePlate = (v: Veiculo | undefined | null): string =>
  (v as any)?.placa || (v as any)?.plate || '';

const getVehicleLabel = (v: Veiculo): string => {
  const plate = getVehiclePlate(v);
  const brand = (v as any).marca || (v as any).brand || '';
  const model = (v as any).modelo || (v as any).model || '';
  return [plate, brand, model].filter(Boolean).join(' - ').replace(/ - $/, '') || 'Sem identificação';
};

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
  const { user, empresa } = useAuth();
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

  // Filtrar veículos ativos (compatível com campos PT e EN da API)
  const activeVehicles = veiculos.filter(v => {
    const status = String((v as any).status || '').toLowerCase();
    return !status || status === 'ativo' || status === 'active';
  });

  const vehicleOptions = React.useMemo(() => {
    return [
      { label: 'Todos os veículos', value: 'all', search: 'todos veículos all' },
      ...activeVehicles.map((vehicle) => ({
        label: getVehicleLabel(vehicle),
        value: vehicle.id,
        search: `${getVehiclePlate(vehicle)} ${(vehicle as any).marca || (vehicle as any).brand || ''} ${(vehicle as any).modelo || (vehicle as any).model || ''}`.trim()
      }))
    ];
  }, [activeVehicles]);

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

  // Exportar relatório para PDF (padrão OS client-side, com logo da empresa)
  const exportToPDF = async () => {
    if (!reportData || reportData.records.length === 0) return;

    try {
      const selectedVehicle = veiculos.find((v) => v.id === filters.vehicleId);
      const selectedDriver = drivers.find((d) => d.id === filters.driverId);

      await downloadFuelReportsPDF({
        reportView: 'all',
        fuelRecords: reportData.records,
        vehicles: veiculos as any,
        kpis: computeFuelReportsKpis(reportData.records),
        filters: {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          vehicleId: filters.vehicleId && filters.vehicleId !== 'all' ? filters.vehicleId : undefined,
          vehiclePlate: getVehiclePlate(selectedVehicle) || undefined,
          driver: selectedDriver?.name,
        },
        company: {
          name: empresa?.nome || (user as any)?.companyName || undefined,
          tradeName: (empresa as any)?.sigla || empresa?.nome || undefined,
          cnpj: (empresa as any)?.cnpj || (user as any)?.companyCnpj || undefined,
          logoUrl: resolveCompanyLogoUrl(empresa?.logoUrl),
          phone: (empresa as any)?.telefone,
          email: (empresa as any)?.email,
          address: (empresa as any)?.endereco,
        },
        userName: (user as any)?.name || (user as any)?.username || undefined,
      });

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

  const footer = (
    <div className="flex justify-end gap-2 w-full">
      <Button
        onClick={onClose}
        variant="outline"
        className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700 h-10 sm:h-11 px-6"
      >
        Fechar
      </Button>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6 text-left">
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
            <Combobox
              options={vehicleOptions}
              value={filters.vehicleId || 'all'}
              onChange={(value) => setFilters({ ...filters, vehicleId: value })}
              placeholder="Todos os veículos"
              searchPlaceholder="Buscar por placa, marca ou modelo..."
              emptyPlaceholder="Nenhum veículo encontrado."
            />
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
              <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray max-h-60">
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
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            onClick={generateReport}
            disabled={isGenerating || fuelRecordsLoading}
            className="flex-1 bg-seguranca-yellow hover:bg-yellow-600 text-black font-semibold h-10 sm:h-11"
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
            className="flex-1 border-gray-600 text-seguranca-lightgray hover:bg-gray-700 h-10 sm:h-11"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-seguranca-graphite p-4 rounded-lg border border-gray-600">
              <div className="text-seguranca-yellow font-semibold truncate">Total Registros</div>
              <div className="text-2xl font-bold text-white">{reportData.totalRecords}</div>
            </div>
            <div className="bg-seguranca-graphite p-4 rounded-lg border border-gray-600">
              <div className="text-seguranca-yellow font-semibold truncate">Valor Total</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(reportData.totalCost)}</div>
            </div>
            <div className="bg-seguranca-graphite p-4 rounded-lg border border-gray-600">
              <div className="text-seguranca-yellow font-semibold truncate">Litros Total</div>
              <div className="text-2xl font-bold text-white">{reportData.totalQuantity.toFixed(2).replace('.', ',')}</div>
            </div>
            <div className="bg-seguranca-graphite p-4 rounded-lg border border-gray-600">
              <div className="text-seguranca-yellow font-semibold truncate">Valor Médio/L</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(reportData.averageCostPerLiter)}</div>
            </div>
          </div>

          {/* Tabela de Detalhes */}
          <div className="bg-seguranca-graphite rounded-lg border border-gray-600 overflow-hidden">
            <div className="p-4 border-b border-gray-600">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-seguranca-yellow font-semibold">Detalhes</h3>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button
                    onClick={exportToPDF}
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    onClick={exportToExcel}
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button
                    onClick={exportToCSV}
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
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
                    <TableHead className="text-seguranca-yellow whitespace-nowrap">Data</TableHead>
                    <TableHead className="text-seguranca-yellow whitespace-nowrap">Veículo</TableHead>
                    <TableHead className="text-seguranca-yellow whitespace-nowrap">Motorista</TableHead>
                    <TableHead className="text-seguranca-yellow whitespace-nowrap">Combustível</TableHead>
                    <TableHead className="text-seguranca-yellow whitespace-nowrap text-right">Litros</TableHead>
                    <TableHead className="text-seguranca-yellow whitespace-nowrap text-right">V/Litro</TableHead>
                    <TableHead className="text-seguranca-yellow whitespace-nowrap text-right">Total</TableHead>
                    <TableHead className="text-seguranca-yellow whitespace-nowrap text-right">KM</TableHead>
                    <TableHead className="text-seguranca-yellow">Posto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.records.map((record) => (
                    <TableRow key={record.id} className="border-gray-600 hover:bg-seguranca-black/30">
                      <TableCell className="text-seguranca-lightgray">
                        {new Date(record.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray font-medium">
                        {record.vehiclePlate}
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray">
                        {record.driver?.name || '-'}
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray">
                        {record.fuelType}
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray text-right">
                        {record.quantity?.toFixed(2).replace('.', ',') || '0,00'}
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray text-right">
                        {record.quantity > 0 ? formatCurrency(record.cost / record.quantity) : 'R$ 0,00'}
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray text-right font-semibold">
                        {formatCurrency(record.cost)}
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray text-right">
                        {record.mileage?.toLocaleString('pt-BR') || '0'}
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray">
                        {record.station || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ResponsiveDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Relatório de Abastecimentos"
      description="Gere relatórios detalhados de abastecimentos com filtros personalizados."
      footer={footer}
      className="max-w-6xl"
    >
      {renderContent()}
    </ResponsiveDrawer>
  );
};

export default AbastecimentoReportModal;
