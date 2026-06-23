import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings, 
  Download, 
  RefreshCw,
  Target,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  DollarSign,
  Car,
  Fuel,
  User,
  FileText,
  Receipt,
  CreditCard,
  TrendingDown,
  Award,
  Gauge
} from 'lucide-react';
import serviceRatingService from '@/services/serviceRatingService';
import { ServiceContract, ServiceRating, ServiceRatingFilter } from '@/services/serviceRatingService';
import SimpleExtraTrips from '@/components/transport/SimpleExtraTrips';
// import ExtraTripsManager from '@/components/transport/ExtraTripsManager';
// import DriverCostsManager from '@/components/transport/DriverCostsManager';
// import ContractServicesManager from '@/components/transport/ContractServicesManager';

export default function ServiceRatingManagement() {
  const [contracts, setContracts] = useState<ServiceContract[]>([]);
  const [ratings, setRatings] = useState<ServiceRating[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ServiceContract | null>(null);
  const [selectedRating, setSelectedRating] = useState<ServiceRating | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('contracts');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [contracts, ratings, searchTerm, statusFilter, typeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contractsData, ratingsData, statsData] = await Promise.all([
        serviceRatingService.getAllContracts(),
        serviceRatingService.getAllRatings(),
        serviceRatingService.getRatingStats()
      ]);
      
      setContracts(contractsData);
      setRatings(ratingsData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    const filter: ServiceRatingFilter = {
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined
    };
    
    // Apply filters (in real app, this would call the service)
    console.log('Applying filters:', filter);
  };

  const handleViewContract = (contract: ServiceContract) => {
    setSelectedContract(contract);
    setShowViewModal(true);
  };

  const handleViewRating = (rating: ServiceRating) => {
    setSelectedRating(rating);
    setShowViewModal(true);
  };

  const handleEditContract = (contract: ServiceContract) => {
    setSelectedContract(contract);
    setShowCreateModal(true);
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) {
      return;
    }

    try {
      await serviceRatingService.deleteContract(contractId);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      alert('Erro ao excluir contrato');
    }
  };

  const getContractTypeLabel = (type: string) => serviceRatingService.getContractTypeLabel(type);
  const getServiceTypeLabel = (type: string) => serviceRatingService.getServiceTypeLabel(type);
  const getStatusLabel = (status: string) => serviceRatingService.getStatusLabel(status);
  const getRatingStatusLabel = (status: string) => serviceRatingService.getRatingStatusLabel(status);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rateio de Serviços de Transporte</h1>
          <p className="text-muted-foreground">Gestão de contratos e cálculo de custos de serviços</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Contrato
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contratos Ativos</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{contracts.filter(c => c.status === 'ACTIVE').length}</div>
              <p className="text-xs text-muted-foreground">
                {contracts.length} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Margem: {stats.profitMargin.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">KM Percorridos</CardTitle>
              <Car className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.totalKm.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.averageFuelEfficiency.toFixed(2)} km/l
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rateios Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{ratings.filter(r => r.status === 'APPROVED').length}</div>
              <p className="text-xs text-muted-foreground">
                {ratings.filter(r => r.status === 'PAID').length} pagos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="ratings">Rateios</TabsTrigger>
          <TabsTrigger value="trips">Viagens Extras</TabsTrigger>
          <TabsTrigger value="extras">Serviços Extras</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="analytics">Análise</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar contratos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                    <SelectItem value="TERMINATED">Encerrado</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Tipos</SelectItem>
                    <SelectItem value="TRANSPORT">Transporte</SelectItem>
                    <SelectItem value="LOGISTICS">Logística</SelectItem>
                    <SelectItem value="DISTRIBUTION">Distribuição</SelectItem>
                    <SelectItem value="SHUTTLE">Shuttle</SelectItem>
                    <SelectItem value="DELIVERY">Entrega</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contracts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Contratos de Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Contrato</th>
                      <th className="text-left p-2">Cliente</th>
                      <th className="text-left p-2">Veículo</th>
                      <th className="text-left p-2">Tipo</th>
                      <th className="text-left p-2">Taxa Base</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Vigência</th>
                      <th className="text-center p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((contract) => (
                      <tr key={contract.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="font-medium">{contract.contractNumber}</div>
                              <div className="text-sm text-muted-foreground">{getContractTypeLabel(contract.contractType)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            <div className="font-medium">{contract.clientName}</div>
                            <div className="text-muted-foreground">{contract.clientId}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{contract.vehiclePlate}</div>
                              <div className="text-sm text-muted-foreground">{contract.vehicleModel}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">
                            {getServiceTypeLabel(contract.serviceType)}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            <div className="font-medium">
                              R$ {contract.baseRates.fixedRate.toLocaleString('pt-BR')}
                            </div>
                            <div className="text-muted-foreground">
                              R$ {contract.baseRates.perKmRate.toFixed(2)}/km
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge className={
                            contract.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            contract.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-800' :
                            contract.status === 'TERMINATED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {getStatusLabel(contract.status)}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            <div>{new Date(contract.startDate).toLocaleDateString('pt-BR')}</div>
                            <div className="text-muted-foreground">
                              até {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewContract(contract)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditContract(contract)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteContract(contract.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Rateios de Serviço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ratings.map((rating) => {
                  const contract = contracts.find(c => c.id === rating.contractId);
                  return (
                    <Card key={rating.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Calculator className="h-5 w-5 text-blue-600" />
                            <div>
                              <div className="font-medium">
                                Rateio {new Date(rating.ratingPeriod.startDate).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {contract?.clientName} • {contract?.vehiclePlate}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={
                              rating.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              rating.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                              rating.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              rating.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {getRatingStatusLabel(rating.status)}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewRating(rating)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Período:</span>
                            <div>{new Date(rating.ratingPeriod.startDate).toLocaleDateString('pt-BR')} - {new Date(rating.ratingPeriod.endDate).toLocaleDateString('pt-BR')}</div>
                          </div>
                          <div>
                            <span className="font-medium">Métricas:</span>
                            <div>{rating.metrics.totalKm} km • {rating.metrics.totalHours}h • {rating.metrics.totalTrips} viagens</div>
                          </div>
                          <div>
                            <span className="font-medium">Custo Base:</span>
                            <div>R$ {rating.baseCosts.totalBaseCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                          </div>
                          <div>
                            <span className="font-medium">Valor Final:</span>
                            <div className="font-bold text-green-600">
                              R$ {rating.finalCalculation.netAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-lg font-bold text-blue-600">
                              R$ {rating.baseCosts.totalBaseCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-muted-foreground">Custo Base</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-lg font-bold text-orange-600">
                              R$ {rating.extraCosts.totalExtraCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-muted-foreground">Serviços Extras</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-lg font-bold text-green-600">
                              R$ {rating.finalCalculation.netAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-muted-foreground">Valor Líquido</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {ratings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhum rateio encontrado</p>
                    <p className="text-sm">Os rateios calculados aparecerão aqui</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extras" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Serviços Extras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Zap className="h-12 w-12 mx-auto mb-4" />
                  <p>Interface de serviços extras será implementada</p>
                  <p className="text-sm mt-2">Diagnósticos, pedágios, estacionamento, manutenção, etc.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pagamentos e Retenções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <CreditCard className="h-12 w-12 mx-auto mb-4" />
                  <p>Interface de pagamentos será implementada</p>
                  <p className="text-sm mt-2">Salários de motoristas, retenções, bonificações</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Tendências de Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 mx-auto mb-4" />
                    <p>Gráfico de tendências será implementado com biblioteca de charts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição de Custos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-4" />
                    <p>Gráfico de distribuição será implementado com biblioteca de charts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Análise de Desempenho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {stats?.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground">Receita Total</div>
                  <div className="text-xs text-muted-foreground mt-1">Mês atual</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.profitMargin.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Margem de Lucro</div>
                  <div className="text-xs text-muted-foreground mt-1">Sobre receita</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats?.totalKm.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm text-muted-foreground">KM Percorridos</div>
                  <div className="text-xs text-muted-foreground mt-1">Total acumulado</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats?.averageFuelEfficiency.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Eficiência</div>
                  <div className="text-xs text-muted-foreground mt-1">KM por litro</div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-4">Tendências Mensais</h4>
                <div className="space-y-2">
                  {stats?.monthlyTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{trend.month}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Receita:</span>
                          <span className="font-medium text-green-600">
                            R$ {trend.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Lucro:</span>
                          <span className="font-medium text-blue-600">
                            R$ {trend.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">KM:</span>
                          <span className="font-medium text-orange-600">{trend.km.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trips" className="space-y-4">
          {selectedRating ? (
            <SimpleExtraTrips 
              ratingId={selectedRating.id}
              contractId={selectedRating.contractId}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">Selecione um rateio para gerenciar viagens extras</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pagamentos e Comissões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Funcionalidade de pagamentos em desenvolvimento...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
