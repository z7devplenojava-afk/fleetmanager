import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Route, 
  Clock, 
  Users, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  BarChart3,
  FileText,
  Calendar,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Ronda, RondaFilters, RondaStats, RondaStatus, RondaTipo, RondaPrioridade } from '@/types/rondas';
import { rondasService } from '@/services/rondasService';
import { RondasTable } from '@/components/rondas/RondasTable';
import { RondaFormModal } from '@/components/rondas/RondaFormModal';
import { RondaViewModal } from '@/components/rondas/RondaViewModal';
import { RondasRelatorios } from '@/components/rondas/RondasRelatorios';
import { RondasConfiguracoes } from '@/components/rondas/RondasConfiguracoes';

const ControleRondas: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('rondas');
  
  // Estados para dados
  const [rondas, setRondas] = useState<Ronda[]>([]);
  const [stats, setStats] = useState<RondaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para filtros
  const [filters, setFilters] = useState<RondaFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para modais
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRonda, setSelectedRonda] = useState<Ronda | null>(null);
  
  // Estados para enums
  const [statusOptions, setStatusOptions] = useState<RondaStatus[]>([]);
  const [tipoOptions, setTipoOptions] = useState<RondaTipo[]>([]);
  const [prioridadeOptions, setPrioridadeOptions] = useState<RondaPrioridade[]>([]);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Aplicar filtros quando mudarem
  useEffect(() => {
    loadRondas();
  }, [filters, searchTerm]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [rondasData, statsData, statusData, tiposData, prioridadesData] = await Promise.all([
        rondasService.getAllRondas(),
        rondasService.getRondaStats(),
        rondasService.getStatusOptions(),
        rondasService.getTipoOptions(),
        rondasService.getPrioridadeOptions()
      ]);
      
      setRondas(rondasData);
      setStats(statsData);
      setStatusOptions(statusData);
      setTipoOptions(tiposData);
      setPrioridadeOptions(prioridadesData);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados das rondas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRondas = async () => {
    try {
      const filtersWithSearch = {
        ...filters,
        searchTerm: searchTerm || undefined
      };
      
      const result = await rondasService.getRondasWithFilters(filtersWithSearch);
      setRondas(result.content);
    } catch (error) {
      console.error('Erro ao carregar rondas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as rondas.",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleCreateRonda = () => {
    setSelectedRonda(null);
    setShowFormModal(true);
  };

  const handleEditRonda = (ronda: Ronda) => {
    setSelectedRonda(ronda);
    setShowFormModal(true);
  };

  const handleViewRonda = (ronda: Ronda) => {
    setSelectedRonda(ronda);
    setShowViewModal(true);
  };

  const handleDeleteRonda = async (ronda: Ronda) => {
    if (window.confirm(`Tem certeza que deseja excluir a ronda "${ronda.nome}"?`)) {
      try {
        await rondasService.deleteRonda(ronda.id);
        toast({
          title: "Sucesso",
          description: "Ronda excluída com sucesso.",
        });
        loadRondas();
      } catch (error) {
        console.error('Erro ao excluir ronda:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir a ronda.",
          variant: "destructive"
        });
      }
    }
  };

  const handleIniciarRonda = async (ronda: Ronda) => {
    try {
      await rondasService.iniciarRonda(ronda.id);
      toast({
        title: "Sucesso",
        description: "Ronda iniciada com sucesso.",
      });
      loadRondas();
    } catch (error) {
      console.error('Erro ao iniciar ronda:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a ronda.",
        variant: "destructive"
      });
    }
  };

  const handleConcluirRonda = async (ronda: Ronda) => {
    const observacoes = prompt('Observações da conclusão (opcional):');
    try {
      await rondasService.concluirRonda(ronda.id, observacoes || undefined);
      toast({
        title: "Sucesso",
        description: "Ronda concluída com sucesso.",
      });
      loadRondas();
    } catch (error) {
      console.error('Erro ao concluir ronda:', error);
      toast({
        title: "Erro",
        description: "Não foi possível concluir a ronda.",
        variant: "destructive"
      });
    }
  };

  const handleCancelarRonda = async (ronda: Ronda) => {
    const motivo = prompt('Motivo do cancelamento:');
    if (motivo) {
      try {
        await rondasService.cancelarRonda(ronda.id, motivo);
        toast({
          title: "Sucesso",
          description: "Ronda cancelada com sucesso.",
        });
        loadRondas();
      } catch (error) {
        console.error('Erro ao cancelar ronda:', error);
        toast({
          title: "Erro",
          description: "Não foi possível cancelar a ronda.",
          variant: "destructive"
        });
      }
    }
  };

  const handleSaveRonda = (ronda: Ronda) => {
    setShowFormModal(false);
    setSelectedRonda(null);
    loadRondas();
    toast({
      title: "Sucesso",
      description: "Ronda salva com sucesso.",
    });
  };

  const handleFilterChange = (field: keyof RondaFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === 'all' ? undefined : value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const getStatusLabel = (status: RondaStatus) => {
    const labels = {
      AGENDADA: 'Agendadas',
      EM_ANDAMENTO: 'Em Andamento',
      CONCLUIDA: 'Concluídas',
      CANCELADA: 'Canceladas',
      ATRASADA: 'Atrasadas'
    };
    return labels[status] || status;
  };

  const getTipoLabel = (tipo: RondaTipo) => {
    const labels = {
      PREVENTIVA: 'Preventiva',
      PATRULHAMENTO: 'Patrulhamento',
      VIGILANCIA: 'Vigilância',
      EMERGENCIA: 'Emergência',
      ESPECIAL: 'Especial'
    };
    return labels[tipo] || tipo;
  };

  const getPrioridadeLabel = (prioridade: RondaPrioridade) => {
    const labels = {
      BAIXA: 'Baixa',
      MEDIA: 'Média',
      ALTA: 'Alta',
      CRITICA: 'Crítica'
    };
    return labels[prioridade] || prioridade;
  };

  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando dados das rondas...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="space-y-3 sm:space-y-4 md:space-y-6 p-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="p-1.5 sm:p-2 bg-seguranca-darkred/20 rounded-lg">
              <Route className="h-5 w-5 sm:h-6 sm:w-6 text-seguranca-darkred" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-seguranca-lightgray">Controle de Rondas</h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">Gestão completa de rondas de segurança</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-gray-600 hover:bg-gray-700 w-full sm:w-auto h-10 sm:h-11 text-xs sm:text-sm"
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              onClick={handleCreateRonda} 
              className="bg-seguranca-darkred hover:bg-seguranca-red text-white shadow-lg hover:shadow-xl transition-all w-full sm:w-auto h-10 sm:h-11 text-xs sm:text-sm"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Nova Ronda
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6">
            <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600 hover:border-seguranca-yellow transition-all shadow-lg hover:shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-3 md:p-6">
                <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium text-seguranca-lightgray truncate">Total</CardTitle>
                <div className="p-1 sm:p-1.5 md:p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                  <Route className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent className="p-2 sm:p-3 md:p-6 pt-0">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-seguranca-lightgray mb-1">{stats.total}</div>
                <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-2">Rondas cadastradas</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600 hover:border-yellow-500 transition-all shadow-lg hover:shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-3 md:p-6">
                <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium text-seguranca-lightgray truncate">Em Andamento</CardTitle>
                <div className="p-1 sm:p-1.5 md:p-2 bg-yellow-500/20 rounded-lg flex-shrink-0">
                  <Play className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-yellow-400" />
                </div>
              </CardHeader>
              <CardContent className="p-2 sm:p-3 md:p-6 pt-0">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-400 mb-1">{stats.emAndamento}</div>
                <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-2">Executando agora</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600 hover:border-green-500 transition-all shadow-lg hover:shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-3 md:p-6">
                <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium text-seguranca-lightgray truncate">Concluídas</CardTitle>
                <div className="p-1 sm:p-1.5 md:p-2 bg-green-500/20 rounded-lg flex-shrink-0">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-400" />
                </div>
              </CardHeader>
              <CardContent className="p-2 sm:p-3 md:p-6 pt-0">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-400 mb-1">{stats.concluidas}</div>
                <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-2">{stats.percentualConclusao.toFixed(1)}% do total</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600 hover:border-blue-500 transition-all shadow-lg hover:shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-3 md:p-6">
                <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium text-seguranca-lightgray truncate">Hoje</CardTitle>
                <div className="p-1 sm:p-1.5 md:p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent className="p-2 sm:p-3 md:p-6 pt-0">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-400 mb-1">{stats.rondasHoje}</div>
                <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-2">Rondas programadas</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="bg-seguranca-graphite border-gray-600 mb-4 sm:mb-6">
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-seguranca-lightgray text-sm sm:text-base">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <Input
                    placeholder="Nome, local, responsável..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-10 h-10 sm:h-11 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2 block">Status</label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger className="h-10 sm:h-11 text-xs sm:text-sm">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>
                        {getStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2 block">Tipo</label>
                <Select
                  value={filters.tipo || 'all'}
                  onValueChange={(value) => handleFilterChange('tipo', value)}
                >
                  <SelectTrigger className="h-10 sm:h-11 text-xs sm:text-sm">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {tipoOptions.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>
                        {getTipoLabel(tipo)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2 block">Prioridade</label>
                <Select
                  value={filters.prioridade || 'all'}
                  onValueChange={(value) => handleFilterChange('prioridade', value)}
                >
                  <SelectTrigger className="h-10 sm:h-11 text-xs sm:text-sm">
                    <SelectValue placeholder="Todas as prioridades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as prioridades</SelectItem>
                    {prioridadeOptions.map(prioridade => (
                      <SelectItem key={prioridade} value={prioridade}>
                        {getPrioridadeLabel(prioridade)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="border-gray-600 hover:bg-gray-700 w-full sm:w-auto h-10 sm:h-11 text-xs sm:text-sm"
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo Principal */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-seguranca-graphite border border-gray-600 h-auto sm:h-11 p-1 gap-1">
            <TabsTrigger 
              value="rondas" 
              className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-seguranca-darkred data-[state=active]:text-white text-[10px] sm:text-xs md:text-sm h-9 sm:h-10 px-1.5 sm:px-3 md:px-4 py-2 transition-all"
            >
              <Route className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Rondas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="relatorios" 
              className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-seguranca-darkred data-[state=active]:text-white text-[10px] sm:text-xs md:text-sm h-9 sm:h-10 px-1.5 sm:px-3 md:px-4 py-2 transition-all"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate hidden sm:inline">Relatórios</span>
              <span className="truncate sm:hidden">Rel.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="configuracoes" 
              className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-seguranca-darkred data-[state=active]:text-white text-[10px] sm:text-xs md:text-sm h-9 sm:h-10 px-1.5 sm:px-3 md:px-4 py-2 transition-all"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate hidden md:inline">Configurações</span>
              <span className="truncate md:hidden">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rondas" className="mt-3 sm:mt-6">
            <RondasTable
              rondas={rondas}
              loading={loading}
              onView={handleViewRonda}
              onEdit={handleEditRonda}
              onDelete={handleDeleteRonda}
              onIniciar={handleIniciarRonda}
              onConcluir={handleConcluirRonda}
              onCancelar={handleCancelarRonda}
            />
          </TabsContent>

          <TabsContent value="relatorios" className="mt-3 sm:mt-6">
            <RondasRelatorios stats={stats} />
          </TabsContent>

          <TabsContent value="configuracoes" className="mt-3 sm:mt-6">
            <RondasConfiguracoes />
          </TabsContent>
        </Tabs>

        {/* Modais */}
        <RondaFormModal
          open={showFormModal}
          onOpenChange={setShowFormModal}
          ronda={selectedRonda}
          onSave={handleSaveRonda}
        />

        <RondaViewModal
          open={showViewModal}
          onOpenChange={setShowViewModal}
          ronda={selectedRonda}
          onIniciar={handleIniciarRonda}
          onConcluir={handleConcluirRonda}
          onCancelar={handleCancelarRonda}
        />
      </div>
    </StandardLayout>
  );
};

export default ControleRondas;
