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
      console.warn('Erro ao carregar dados, usando dados mock:', error);
      // Não mostrar toast de erro pois estamos usando dados mock
      // toast({
      //   title: "Aviso",
      //   description: "Usando dados de demonstração. APIs do backend não estão disponíveis.",
      //   variant: "default"
      // });
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
      console.warn('Erro ao carregar rondas, usando dados mock:', error);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Controle de Rondas</h1>
            <p className="text-gray-400 mt-1">Gestão completa de rondas de segurança</p>
            <div className="mt-2">
              <Badge className="bg-yellow-100 text-yellow-800">
                🚧 Modo Demonstração - Dados Mock
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={handleCreateRonda} className="bg-seguranca-red hover:bg-seguranca-darkred">
              <Plus className="h-4 w-4 mr-2" />
              Nova Ronda
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-seguranca-lightgray">Total</CardTitle>
                <Route className="h-4 w-4 text-seguranca-yellow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-seguranca-lightgray">{stats.total}</div>
                <p className="text-xs text-gray-400">Rondas cadastradas</p>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-seguranca-lightgray">Em Andamento</CardTitle>
                <Play className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-seguranca-lightgray">{stats.emAndamento}</div>
                <p className="text-xs text-gray-400">Executando agora</p>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-seguranca-lightgray">Concluídas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-seguranca-lightgray">{stats.concluidas}</div>
                <p className="text-xs text-gray-400">{stats.percentualConclusao.toFixed(1)}% do total</p>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-seguranca-lightgray">Hoje</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-seguranca-lightgray">{stats.rondasHoje}</div>
                <p className="text-xs text-gray-400">Rondas programadas</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nome, local, responsável..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Status</label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
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
                <label className="text-sm font-medium text-gray-300 mb-2 block">Tipo</label>
                <Select
                  value={filters.tipo || 'all'}
                  onValueChange={(value) => handleFilterChange('tipo', value)}
                >
                  <SelectTrigger>
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
                <label className="text-sm font-medium text-gray-300 mb-2 block">Prioridade</label>
                <Select
                  value={filters.prioridade || 'all'}
                  onValueChange={(value) => handleFilterChange('prioridade', value)}
                >
                  <SelectTrigger>
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

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo Principal */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rondas" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              Rondas
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rondas" className="mt-6">
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

          <TabsContent value="relatorios" className="mt-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle>Relatórios de Rondas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Relatórios em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuracoes" className="mt-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Configurações em desenvolvimento...</p>
              </CardContent>
            </Card>
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
