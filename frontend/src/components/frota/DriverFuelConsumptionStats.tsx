import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Car, 
  Fuel, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  BarChart3,
  Loader2,
  Filter,
  X,
  FileText,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import api from '@/lib/axios';
import { Driver } from '@/types/driver';
import { Vehicle } from '@/types/fleet';
import fleetService from '@/services/fleetService';

interface DriverFuelConsumptionStatsData {
  driverName: string;
  totalRecords: number;
  totalFuelConsumed: number;
  totalCost: number;
  averageFuelPerRefill: number;
  averagePricePerLiter: number;
  consumptionPerKm: number;
  costPerKm: number;
  totalDistance: number;
  lastRefillDate: string;
  lastRefillQuantity: number;
  lastRefillCost: number;
  vehiclesUsed: VehicleStats[];
}

interface VehicleStats {
  vehiclePlate: string;
  vehicleModel: string;
  recordsCount: number;
  totalFuel: number;
  totalCost: number;
  averageConsumption: number;
}

interface DriverFuelConsumptionStatsProps {
  drivers: Driver[];
}

export const DriverFuelConsumptionStats: React.FC<DriverFuelConsumptionStatsProps> = ({ drivers }) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [stats, setStats] = useState<DriverFuelConsumptionStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros de relatório
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [selectedPosto, setSelectedPosto] = useState<string>('all');
  const [selectedReportDriverId, setSelectedReportDriverId] = useState<string>('all');
  const [generatingReport, setGeneratingReport] = useState(false);
  
  // Estados para dados dos filtros
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelStations, setFuelStations] = useState<string[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  
  const { toast } = useToast();

  const driversArray = Array.isArray(drivers) ? drivers : [];

  // Carregar dados para os filtros
  const loadFilterData = async () => {
    setLoadingFilters(true);
    try {
      console.log('🔍 Carregando dados dos filtros...');
      
      // Carregar veículos
      const vehiclesData = await fleetService.getVehicles();
      console.log('🚗 Veículos carregados:', vehiclesData);
      setVehicles(vehiclesData);
      
      // Carregar postos de combustível únicos
      try {
        const stationsResponse = await api.get('/fuel-stations');
        console.log('⛽ Resposta do endpoint fuel-stations:', stationsResponse);
        
        if (stationsResponse.data && Array.isArray(stationsResponse.data)) {
          console.log('✅ Postos carregados via endpoint:', stationsResponse.data);
          // Extrair apenas os nomes dos postos
          const stationNames = stationsResponse.data.map((station: any) => station.name);
          setFuelStations(stationNames);
        } else {
          console.log('⚠️ Endpoint fuel-stations não retornou array válido, tentando fallback...');
          // Fallback: extrair postos dos registros de combustível
          const fuelRecordsResponse = await api.get('/fuel-records');
          console.log('📊 Registros de combustível para fallback:', fuelRecordsResponse.data);
          
          if (fuelRecordsResponse.data && Array.isArray(fuelRecordsResponse.data)) {
            const uniqueStations = [...new Set(fuelRecordsResponse.data.map((record: any) => record.station))];
            console.log('🔄 Postos extraídos dos registros:', uniqueStations);
            setFuelStations(uniqueStations.filter(station => station));
          }
        }
      } catch (stationsError) {
        console.error('❌ Erro ao carregar postos via endpoint fuel-stations, tentando fallback:', stationsError);
        // Fallback: extrair postos dos registros de combustível
        const fuelRecordsResponse = await api.get('/fuel-records');
        if (fuelRecordsResponse.data && Array.isArray(fuelRecordsResponse.data)) {
          const uniqueStations = [...new Set(fuelRecordsResponse.data.map((record: any) => record.station))];
          setFuelStations(uniqueStations.filter(station => station));
        }
      }
      
      console.log('✅ Dados dos filtros carregados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar dados dos filtros:', error);
      toast({
        title: "⚠️ Aviso",
        description: "Não foi possível carregar todos os dados dos filtros. Alguns podem estar vazios.",
        variant: "default"
      });
    } finally {
      setLoadingFilters(false);
    }
  };

  // Carregar dados dos filtros quando o componente montar
  useEffect(() => {
    loadFilterData();
  }, []);

  const loadStats = async () => {
    if (!selectedDriverId) return;

    setLoading(true);
    setError(null);

    try {
      let response;
      
      if (startDate && endDate) {
        response = await api.get(
          `/fuel-records/stats/driver/${selectedDriverId}/period?` +
          `startDate=${startDate}&endDate=${endDate}`
        );
      } else {
        response = await api.get(`/fuel-records/stats/driver/${selectedDriverId}`);
      }

      setStats(response.data);
    } catch (err: any) {
      console.error('Erro ao carregar estatísticas:', err);
      
      // Tratamento específico de erros
      let errorMessage = 'Erro ao carregar estatísticas';
      
      if (err.response) {
        const { status, data } = err.response;
        
        switch (status) {
          case 400:
            errorMessage = 'Dados de filtro inválidos. Verifique as datas selecionadas.';
            break;
          case 401:
            errorMessage = 'Acesso não autorizado. Faça login novamente.';
            break;
          case 403:
            errorMessage = 'Permissão negada para acessar estas estatísticas.';
            break;
          case 404:
            errorMessage = 'Motorista não encontrado ou sem registros de abastecimento.';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor. Tente novamente mais tarde ou entre em contato com o suporte.';
            break;
          default:
            if (data?.message) {
              errorMessage = data.message;
            } else {
              errorMessage = `Erro ${status}: ${data?.error || 'Erro desconhecido'}`;
            }
        }
      } else if (err.request) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast({
        title: "Erro ao Carregar Estatísticas",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDriverId) {
      loadStats();
    }
  }, [selectedDriverId, startDate, endDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
  };

  const getConsumptionEfficiency = (consumptionPerKm: number) => {
    // Caso especial: sem dados ou consumo zero
    if (consumptionPerKm <= 0 || isNaN(consumptionPerKm)) {
      return { label: 'Sem Dados', color: 'bg-gray-500' };
    }
    
    // Lógica normal para casos com dados
    if (consumptionPerKm <= 0.08) return { label: 'Excelente', color: 'bg-green-500' };
    if (consumptionPerKm <= 0.12) return { label: 'Bom', color: 'bg-blue-500' };
    if (consumptionPerKm <= 0.16) return { label: 'Regular', color: 'bg-yellow-500' };
    return { label: 'Alto', color: 'bg-red-500' };
  };

  const clearFilters = () => {
    setSelectedDriverId('');
    setStartDate('');
    setEndDate('');
    setStats(null);
  };

  const clearReportFilters = () => {
    setReportStartDate('');
    setReportEndDate('');
    setSelectedVehicleId('all');
    setSelectedPosto('all');
    setSelectedReportDriverId('all');
  };

  const generateReport = async (format: 'pdf' | 'excel') => {
    // Validações antes de gerar o relatório
    if (!reportStartDate || !reportEndDate) {
      toast({
        title: "Filtros Obrigatórios",
        description: "Por favor, selecione as datas de início e fim para gerar o relatório.",
        variant: "destructive"
      });
      return;
    }

    if (new Date(reportStartDate) > new Date(reportEndDate)) {
      toast({
        title: "Datas Inválidas",
        description: "A data de início não pode ser maior que a data de fim.",
        variant: "destructive"
      });
      return;
    }

    setGeneratingReport(true);
    
    try {
      // Construir parâmetros de filtro
      const params = new URLSearchParams();
      
      if (reportStartDate) params.append('startDate', reportStartDate);
      if (reportEndDate) params.append('endDate', reportEndDate);
      if (selectedVehicleId && selectedVehicleId !== 'all') params.append('vehicleId', selectedVehicleId);
      if (selectedPosto && selectedPosto !== 'all') params.append('posto', selectedPosto);
      if (selectedReportDriverId && selectedReportDriverId !== 'all') params.append('driverId', selectedReportDriverId);
      
      console.log(`📊 Gerando relatório ${format.toUpperCase()} com parâmetros:`, params.toString());
      
      const response = await api.get(`/fuel-records/report/${format}?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Verificar se a resposta é um erro (JSON) ou um arquivo válido
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Erro desconhecido');
      }
      
      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-abastecimentos-${format}-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "✅ Relatório Gerado",
        description: `Relatório em ${format.toUpperCase()} foi baixado com sucesso!`,
        variant: "default"
      });
      
    } catch (error: any) {
      console.error('❌ Erro ao gerar relatório:', error);
      
      let errorMessage = `Erro ao gerar relatório em ${format.toUpperCase()}. Tente novamente.`;
      
      if (error.response?.status === 501) {
        errorMessage = format === 'pdf' 
          ? 'Relatórios em PDF ainda não estão disponíveis. Use o formato Excel.'
          : 'Funcionalidade de relatório ainda não implementada.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Parâmetros de filtro inválidos. Verifique as datas selecionadas.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Nenhum dado encontrado para os filtros selecionados.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <Card className="bg-seguranca-graphite border-gray-600">
      <CardHeader>
        <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
          <User className="text-seguranca-yellow" size={20} />
          Estatísticas de Consumo por Motorista
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {driversArray.length === 0 ? (
          <div className="text-center py-8">
            <User className="mx-auto text-gray-400" size={48} />
            <p className="text-gray-400 mt-2">Nenhum motorista encontrado</p>
            <p className="text-sm text-gray-500 mt-1">
              Registre abastecimentos com motoristas para ver as estatísticas
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {/* Campo Motorista - Ocupa toda a largura */}
              <div className="w-full">
                <Label htmlFor="driver" className="text-seguranca-lightgray text-sm font-medium mb-2 block">Motorista</Label>
                <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                  <SelectTrigger className="w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray hover:border-seguranca-yellow/50 focus:border-seguranca-yellow transition-colors h-11">
                    <SelectValue placeholder="Selecione um motorista" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600 max-h-60">
                    {driversArray.filter(driver => driver && driver.id).map((driver) => (
                      <SelectItem key={driver.id} value={driver.id} className="text-seguranca-lightgray hover:bg-seguranca-black/50 cursor-pointer">
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Campos de Data e Botões em linha responsiva */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                {/* Data Início */}
                <div>
                  <Label htmlFor="startDate" className="text-seguranca-lightgray text-sm font-medium mb-2 block">Data Início</Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    className="w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray hover:border-seguranca-yellow/50 focus:border-seguranca-yellow transition-colors h-11" 
                    placeholder="dd/mm/aaaa"
                  />
                </div>
                
                {/* Data Fim */}
                <div>
                  <Label htmlFor="endDate" className="text-seguranca-lightgray text-sm font-medium mb-2 block">Data Fim</Label>
                  <Input 
                    id="endDate" 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    className="w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray hover:border-seguranca-yellow/50 focus:border-seguranca-yellow transition-colors h-11" 
                    placeholder="dd/mm/aaaa"
                  />
                </div>
                
                {/* Botão Filtrar */}
                <div>
                  <Label className="text-seguranca-lightgray text-sm font-medium mb-2 block opacity-0">Ação</Label>
                  <Button 
                    onClick={loadStats} 
                    disabled={!selectedDriverId || loading} 
                    className="w-full bg-seguranca-yellow text-seguranca-black hover:bg-yellow-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4 shadow-lg hover:shadow-yellow-500/25 font-medium"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin mr-2" />
                    ) : (
                      <Filter size={18} className="mr-2" />
                    )}
                    Filtrar
                  </Button>
                </div>
                
                {/* Botão Limpar */}
                <div>
                  <Label className="text-seguranca-lightgray text-sm font-medium mb-2 block opacity-0">Ação</Label>
                  <Button 
                    onClick={clearFilters} 
                    variant="outline" 
                    className="w-full border-gray-600 text-seguranca-lightgray hover:bg-gray-700 hover:border-gray-500 hover:text-white transition-all duration-200 h-11 px-4 shadow-lg hover:shadow-gray-500/25 font-medium"
                  >
                    <X size={18} className="mr-2" />
                    Limpar
                  </Button>
                </div>
              </div>
              
              {/* Mensagem de ajuda */}
              <div className="text-xs text-gray-500 bg-seguranca-graphite/30 p-3 rounded-lg border border-gray-700">
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-seguranca-yellow rounded-full"></span>
                  Selecione um motorista para ver as estatísticas. As datas são opcionais para filtrar por período específico.
                </p>
              </div>
            </div>

            {/* Seção de Relatórios */}
            <div className="bg-seguranca-graphite/20 p-4 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="text-seguranca-yellow" size={20} />
                <h4 className="text-lg font-semibold text-seguranca-lightgray">Gerar Relatório de Abastecimentos</h4>
              </div>
              
              {/* Filtros para Relatório */}
              <div className="space-y-4 mb-4">
                {/* Primeira linha de filtros - Responsiva */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {/* Filtro por Data - Início */}
                  <div>
                    <Label htmlFor="reportStartDate" className="text-seguranca-lightgray text-sm font-medium mb-2 block">Data Início</Label>
                    <Input 
                      id="reportStartDate" 
                      type="date" 
                      value={reportStartDate} 
                      onChange={(e) => setReportStartDate(e.target.value)} 
                      className="w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray hover:border-seguranca-yellow/50 focus:border-seguranca-yellow transition-colors h-10" 
                      placeholder="dd/mm/aaaa"
                    />
                  </div>
                  
                  {/* Filtro por Data - Fim */}
                  <div>
                    <Label htmlFor="reportEndDate" className="text-seguranca-lightgray text-sm font-medium mb-2 block">Data Fim</Label>
                    <Input 
                      id="reportEndDate" 
                      type="date" 
                      value={reportEndDate} 
                      onChange={(e) => setReportEndDate(e.target.value)} 
                      className="w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray hover:border-seguranca-yellow/50 focus:border-seguranca-yellow transition-colors h-10" 
                      placeholder="dd/mm/aaaa"
                    />
                  </div>
                  
                  {/* Filtro por Veículo */}
                  <div>
                    <Label htmlFor="vehicle" className="text-seguranca-lightgray text-sm font-medium mb-2 block">Veículo</Label>
                    <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                      <SelectTrigger className="w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray hover:border-seguranca-yellow/50 focus:border-seguranca-yellow transition-colors h-10">
                        <SelectValue placeholder={loadingFilters ? "Carregando..." : "Todos os veículos"} />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600 max-h-60">
                        <SelectItem value="all" className="text-seguranca-lightgray hover:bg-seguranca-black/50 cursor-pointer">
                          Todos os veículos
                        </SelectItem>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id} className="text-seguranca-lightgray hover:bg-seguranca-black/50 cursor-pointer">
                            {vehicle.plate} - {vehicle.brand} {vehicle.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Filtro por Posto */}
                  <div>
                    <Label htmlFor="posto" className="text-seguranca-lightgray text-sm font-medium mb-2 block">Posto</Label>
                    <Select value={selectedPosto} onValueChange={setSelectedPosto}>
                      <SelectTrigger className="w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray hover:border-seguranca-yellow/50 focus:border-seguranca-yellow transition-colors h-10">
                        <SelectValue placeholder={loadingFilters ? "Carregando..." : "Todos os postos"} />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600 max-h-60">
                        <SelectItem value="all" className="text-seguranca-lightgray hover:bg-seguranca-black/50 cursor-pointer">
                          Todos os postos
                        </SelectItem>
                        {fuelStations.map((station) => (
                          <SelectItem key={station} value={station} className="text-seguranca-lightgray hover:bg-seguranca-black/50 cursor-pointer">
                            {station}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Segunda linha - Filtro por Motorista */}
                <div className="w-full">
                  <Label htmlFor="reportDriver" className="text-seguranca-lightgray text-sm font-medium mb-2 block">Motorista</Label>
                  <Select value={selectedReportDriverId} onValueChange={setSelectedReportDriverId}>
                    <SelectTrigger className="w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray hover:border-seguranca-yellow/50 focus:border-seguranca-yellow transition-colors h-10">
                      <SelectValue placeholder="Todos os motoristas" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600 max-h-60">
                      <SelectItem value="all" className="text-seguranca-lightgray hover:bg-seguranca-black/50 cursor-pointer">
                        Todos os motoristas
                      </SelectItem>
                      {driversArray.filter(driver => driver && driver.id).map((driver) => (
                        <SelectItem key={driver.id} value={driver.id} className="text-seguranca-lightgray hover:bg-seguranca-black/50 cursor-pointer">
                          {driver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Botões de Ação - Agrupados no final */}
              <div className="flex flex-col gap-3 mt-6">
                {/* Botões principais em linha responsiva */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => generateReport('pdf')}
                    disabled={generatingReport}
                    className="flex-1 bg-seguranca-red text-white hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4 shadow-lg hover:shadow-red-500/25 font-medium"
                  >
                    {generatingReport ? (
                      <Loader2 size={18} className="animate-spin mr-2" />
                    ) : (
                      <FileText size={18} className="mr-2" />
                    )}
                    Gerar PDF
                  </Button>
                  
                  <Button 
                    onClick={() => generateReport('excel')}
                    disabled={generatingReport}
                    className="flex-1 bg-green-600 text-white hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4 shadow-lg hover:shadow-green-500/25 font-medium"
                  >
                    {generatingReport ? (
                      <Loader2 size={18} className="animate-spin mr-2" />
                    ) : (
                      <FileSpreadsheet size={18} className="mr-2" />
                    )}
                    Exportar Excel
                  </Button>
                </div>
                
                {/* Botão Limpar Filtros - Sempre em linha separada */}
                <Button 
                  onClick={clearReportFilters} 
                  variant="outline" 
                  size="sm"
                  className="w-full border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500 hover:text-white transition-all duration-200 px-6 h-11 shadow-lg hover:shadow-gray-500/25 font-medium"
                >
                  <X size={18} className="mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            </div>

            {loading && (
              <div className="flex justify-center items-center py-8">
                <Loader2 size={32} className="animate-spin text-seguranca-yellow" />
                <span className="ml-2 text-seguranca-lightgray">Carregando estatísticas...</span>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">!</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-red-400 font-semibold mb-2">Erro ao Carregar Estatísticas</h4>
                    <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                    <div className="mt-4 flex gap-2">
                      <Button 
                        onClick={loadStats} 
                        variant="outline" 
                        size="sm"
                        className="border-red-500 text-red-400 hover:bg-red-900/20"
                      >
                        Tentar Novamente
                      </Button>
                      <Button 
                        onClick={clearFilters} 
                        variant="outline" 
                        size="sm"
                        className="border-gray-600 text-gray-400 hover:bg-gray-700"
                      >
                        Limpar Filtros
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {stats && !loading && (
              <div className="space-y-6">
                {/* Primeiro conjunto de cards - Informações do motorista */}
                <div className="bg-seguranca-black p-4 sm:p-6 rounded-lg border border-gray-600 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-seguranca-yellow/20 rounded-full flex items-center justify-center">
                        <User className="text-seguranca-yellow" size={28} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-bold text-seguranca-lightgray truncate">{stats?.driverName || 'N/A'}</h3>
                      <p className="text-gray-400 text-sm sm:text-base">Motorista</p>
                    </div>
                  </div>
                  
                  {/* Cards em coluna única com responsividade */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-seguranca-graphite/30 p-4 sm:p-5 rounded-lg border border-gray-700 hover:border-seguranca-yellow/30 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-3 h-3 bg-seguranca-yellow rounded-full flex-shrink-0"></div>
                        <span className="text-gray-400 text-sm sm:text-base uppercase tracking-wide font-medium">Total de Abastecimentos</span>
                      </div>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-seguranca-lightgray ml-6">{stats?.totalRecords || 0}</p>
                    </div>
                    
                    <div className="bg-seguranca-graphite/30 p-4 sm:p-5 rounded-lg border border-gray-700 hover:border-seguranca-yellow/30 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-3 h-3 bg-seguranca-yellow rounded-full flex-shrink-0"></div>
                        <span className="text-gray-400 text-sm sm:text-base uppercase tracking-wide font-medium">Último Abastecimento</span>
                      </div>
                      <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-seguranca-lightgray ml-6">
                        {stats?.lastRefillDate ? formatDate(stats.lastRefillDate) : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="bg-seguranca-graphite/30 p-4 sm:p-5 rounded-lg border border-gray-700 hover:border-seguranca-yellow/30 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-3 h-3 bg-seguranca-yellow rounded-full flex-shrink-0"></div>
                        <span className="text-gray-400 text-sm sm:text-base uppercase tracking-wide font-medium">Distância Total</span>
                      </div>
                      <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-seguranca-lightgray ml-6">
                        {formatNumber(stats?.totalDistance || 0)} km
                      </p>
                    </div>
                    
                    <div className="bg-seguranca-graphite/30 p-4 sm:p-5 rounded-lg border border-gray-700 hover:border-seguranca-yellow/30 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-3 h-3 bg-seguranca-yellow rounded-full flex-shrink-0"></div>
                        <span className="text-gray-400 text-sm sm:text-base uppercase tracking-wide font-medium">Eficiência</span>
                      </div>
                      <div className="ml-6">
                        <Badge className={`${getConsumptionEfficiency(stats?.consumptionPerKm || 0).color} text-white text-sm sm:text-base px-3 py-2`}>
                          {getConsumptionEfficiency(stats?.consumptionPerKm || 0).label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Segundo conjunto de cards - Métricas de consumo em coluna única */}
                <div className="space-y-4">
                  <h4 className="text-lg sm:text-xl font-semibold text-seguranca-lightgray px-1">Métricas de Consumo</h4>
                  <div className="space-y-4">
                    <Card className="bg-seguranca-black border-gray-600 hover:shadow-xl hover:shadow-seguranca-yellow/10 transition-all duration-300 hover:border-seguranca-yellow/50 group">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-seguranca-yellow/20 rounded-lg flex items-center justify-center group-hover:bg-seguranca-yellow/30 transition-colors flex-shrink-0">
                            <Fuel className="text-seguranca-yellow" size={24} />
                          </div>
                          <div className="flex-1">
                            <span className="text-gray-400 text-sm sm:text-base font-medium block mb-1">Combustível Total</span>
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-seguranca-lightgray">
                              {formatNumber(stats?.totalFuelConsumed || 0)} L
                            </p>
                          </div>
                        </div>
                        <div className="ml-16 sm:ml-18">
                          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed bg-seguranca-graphite/30 p-3 rounded-lg">
                            Média: {formatNumber(stats?.averageFuelPerRefill || 0)} L/abast.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-seguranca-black border-gray-600 hover:shadow-xl hover:shadow-seguranca-yellow/10 transition-all duration-300 hover:border-seguranca-yellow/50 group">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-seguranca-yellow/20 rounded-lg flex items-center justify-center group-hover:bg-seguranca-yellow/30 transition-colors flex-shrink-0">
                            <DollarSign className="text-seguranca-yellow" size={24} />
                          </div>
                          <div className="flex-1">
                            <span className="text-gray-400 text-sm sm:text-base font-medium block mb-1">Custo Total</span>
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-seguranca-lightgray">
                              {formatCurrency(stats?.totalCost || 0)}
                            </p>
                          </div>
                        </div>
                        <div className="ml-16 sm:ml-18">
                          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed bg-seguranca-graphite/30 p-3 rounded-lg">
                            Média: {formatCurrency(stats?.averagePricePerLiter || 0)}/L
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-seguranca-black border-gray-600 hover:shadow-xl hover:shadow-seguranca-yellow/10 transition-all duration-300 hover:border-seguranca-yellow/50 group">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-seguranca-yellow/20 rounded-lg flex items-center justify-center group-hover:bg-seguranca-yellow/30 transition-colors flex-shrink-0">
                            <TrendingUp className="text-seguranca-yellow" size={24} />
                          </div>
                          <div className="flex-1">
                            <span className="text-gray-400 text-sm sm:text-base font-medium block mb-1">Consumo/km</span>
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-seguranca-lightgray">
                              {formatNumber(stats?.consumptionPerKm || 0, 3)} L/km
                            </p>
                          </div>
                        </div>
                        <div className="ml-16 sm:ml-18">
                          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed bg-seguranca-graphite/30 p-3 rounded-lg">
                            Custo: {formatCurrency(stats?.costPerKm || 0)}/km
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-seguranca-black border-gray-600 hover:shadow-xl hover:shadow-seguranca-yellow/10 transition-all duration-300 hover:border-seguranca-yellow/50 group">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-seguranca-yellow/20 rounded-lg flex items-center justify-center group-hover:bg-seguranca-yellow/30 transition-colors flex-shrink-0">
                            <Car className="text-seguranca-yellow" size={24} />
                          </div>
                          <div className="flex-1">
                            <span className="text-gray-400 text-sm sm:text-base font-medium block mb-1">Veículos Usados</span>
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-seguranca-lightgray">
                              {stats?.vehiclesUsed?.length || 0}
                            </p>
                          </div>
                        </div>
                        <div className="ml-16 sm:ml-18">
                          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed bg-seguranca-graphite/30 p-3 rounded-lg">
                            Total de veículos
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {stats?.vehiclesUsed && stats.vehiclesUsed.length > 0 && (
                  <Card className="bg-seguranca-black border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                        <Car className="text-seguranca-yellow" size={20} />
                        Veículos Utilizados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-600">
                              <th className="text-left p-2 text-seguranca-lightgray">Veículo</th>
                              <th className="text-left p-2 text-seguranca-lightgray">Modelo</th>
                              <th className="text-left p-2 text-seguranca-lightgray">Abastecimentos</th>
                              <th className="text-left p-2 text-seguranca-lightgray">Combustível</th>
                              <th className="text-left p-2 text-seguranca-lightgray">Custo</th>
                              <th className="text-left p-2 text-seguranca-lightgray">Média/Abast.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats?.vehiclesUsed?.map((vehicle, index) => (
                              <tr key={index} className="border-b border-gray-700">
                                <td className="p-2 text-seguranca-lightgray font-medium">
                                  {vehicle.vehiclePlate}
                                </td>
                                <td className="p-2 text-gray-400">{vehicle.vehicleModel}</td>
                                <td className="p-2 text-seguranca-lightgray">{vehicle.recordsCount}</td>
                                <td className="p-2 text-seguranca-lightgray">
                                  {formatNumber(vehicle.totalFuel)} L
                                </td>
                                <td className="p-2 text-seguranca-lightgray">
                                  {formatCurrency(vehicle.totalCost)}
                                </td>
                                <td className="p-2 text-seguranca-lightgray">
                                  {formatNumber(vehicle.averageConsumption)} L
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}; 