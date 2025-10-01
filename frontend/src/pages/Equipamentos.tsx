import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  Users, 
  Package,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  UserX,
  QrCode,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Equipment, 
  EquipmentFilters, 
  EquipmentSummary,
  EQUIPMENT_STATUS_LABELS,
  PROTECTION_LEVEL_LABELS,
  EQUIPMENT_USAGE_LABELS,
  EQUIPMENT_SIZE_LABELS
} from '@/types/equipment';
import { EquipmentMovement } from '@/types/equipmentMovement';
import equipmentService, { PaginatedResponse } from '@/services/equipmentService';
import equipmentMovementService from '@/services/equipmentMovementService';
import equipmentReportService from '@/services/equipmentReportService';
import EquipmentHistoryModal from '@/components/equipamentos/EquipmentHistoryModal';
import EquipmentFormModal from '@/components/equipamentos/EquipmentFormModal';
import EquipmentReportModal from '@/components/equipamentos/EquipmentReportModal';
import EquipamentosTableHybrid from '@/components/operacional/EquipamentosTableHybrid';
import EquipmentFiltersComponent from '@/components/equipamentos/EquipmentFilters';

interface DashboardCard {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const Equipamentos: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [summary, setSummary] = useState<EquipmentSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<EquipmentFilters>({});
  
  // Estado de paginação consolidado
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalPages: 1,
    totalElements: 0
  });
  
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateEquipment = () => {
    setFormModalOpen(true);
  };

  const handleFormModalClose = () => {
    setFormModalOpen(false);
  };

  const handleFormSuccess = () => {
    setFormModalOpen(false);
    // Recarregar a lista
    toast({
      title: 'Sucesso!',
      description: 'Equipamento criado com sucesso.',
    });
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [equipmentsResponse, summaryData] = await Promise.all([
        equipmentService.getAll(filters, pagination.page, pagination.size),
        equipmentService.getSummary()
      ]);
      
      setEquipments(equipmentsResponse.content);
      setPagination(prev => ({
        ...prev,
        totalElements: equipmentsResponse.totalElements,
        totalPages: equipmentsResponse.totalPages
      }));
      setSummary(summaryData);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados dos equipamentos');
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos equipamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const newFilters = { ...filters, searchTerm };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 0 }));
    
    try {
      const response = await equipmentService.getAll(newFilters, 0, pagination.size);
      setEquipments(response.content);
      setPagination(prev => ({
        ...prev,
        page: 0,
        totalElements: response.totalElements,
        totalPages: response.totalPages
      }));
    } catch (err) {
      console.error('Erro na busca:', err);
      toast({
        title: "Erro",
        description: "Erro ao realizar busca",
        variant: "destructive",
      });
    }
  };

  const dashboardCards: DashboardCard[] = summary ? [
    {
      title: 'Total de Equipamentos',
      value: summary.totalEquipments.toString(),
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Em Uso',
      value: summary.activeEquipments.toString(),
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Em Manutenção',
      value: summary.inMaintenanceEquipments.toString(),
      icon: AlertTriangle,
      color: 'text-yellow-600'
    },
    {
      title: 'Vencidos',
      value: summary.expiredEquipments.toString(),
      icon: AlertCircle,
      color: 'text-red-600'
    },
    {
      title: 'Vencendo em 30 dias',
      value: summary.expiringSoon30Days.toString(),
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Equipamentos Perigosos',
      value: summary.dangerousEquipments.toString(),
      icon: Shield,
      color: 'text-purple-600'
    }
  ] : [];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'EM_USO': return 'bg-green-100 text-green-800';
      case 'EM_MANUTENCAO': return 'bg-yellow-100 text-yellow-800';
      case 'AGUARDANDO_DESCARTE': return 'bg-red-100 text-red-800';
      case 'EM_ESTOQUE': return 'bg-blue-100 text-blue-800';
      case 'BAIXADO': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysToExpiryColor = (days?: number) => {
    if (!days) return 'text-gray-500';
    if (days < 0) return 'text-red-600 font-semibold';
    if (days <= 30) return 'text-yellow-600 font-semibold';
    if (days <= 60) return 'text-orange-600';
    return 'text-green-600';
  };

  const handleViewHistory = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setHistoryModalOpen(true);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Cards do Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card, index) => {
          const IconComponent = card.icon;
          
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={card.color}>
                  <IconComponent className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.change && (
                  <p className={`text-xs ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {card.change}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alertas */}
      {summary && (
        <div className="space-y-4">
          {summary.expiredEquipments > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{summary.expiredEquipments}</strong> equipamento(s) com validade vencida precisam de atenção imediata.
              </AlertDescription>
            </Alert>
          )}
          
          {summary.expiringSoon30Days > 0 && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>{summary.expiringSoon30Days}</strong> equipamento(s) vencem em 30 dias.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );

  const renderEquipmentsTable = () => (
    <EquipamentosTableHybrid
      equipments={equipments}
      loading={loading}
      onSearch={handleSearch}
      onView={handleViewHistory}
      onEdit={(equipment) => {
        setSelectedEquipment(equipment);
        setFormModalOpen(true);
      }}
      onAssignUser={(equipment) => {
        // TODO: Implementar atribuição de usuário
        console.log('Atribuir usuário para:', equipment);
      }}
      onRemoveUser={(equipment) => {
        // TODO: Implementar remoção de usuário
        console.log('Remover usuário de:', equipment);
      }}
      onQRCode={(equipment) => {
        // TODO: Implementar geração de QR Code
        console.log('Gerar QR Code para:', equipment);
      }}
      onDelete={(equipment) => {
        // TODO: Implementar exclusão
        console.log('Excluir equipamento:', equipment);
      }}
      onCreate={handleCreateEquipment}
      onReport={() => setReportModalOpen(true)}
    />
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando equipamentos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Equipamentos</h1>
            <p className="text-gray-600 mt-1">
              Controle de equipamentos de segurança, coletes balísticos e armamentos
            </p>
          </div>
          <div className="flex gap-2">
                                    <Button 
                          variant="outline"
                          onClick={() => setReportModalOpen(true)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Relatórios
                        </Button>
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={handleCreateEquipment}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Equipamento
                        </Button>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="equipments">Equipamentos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            {renderDashboard()}
          </TabsContent>
          
                                <TabsContent value="equipments" className="mt-6">
                        <div className="space-y-4">
                          {/* Filtros */}
                          <div className="flex justify-between items-center">
                            <Button
                              variant="outline"
                              onClick={() => setShowFilters(!showFilters)}
                              className="flex items-center gap-2"
                            >
                              <Filter className="h-4 w-4" />
                              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                            </Button>
                          </div>
                          
                          {showFilters && (
                            <EquipmentFiltersComponent
                              filters={filters}
                              onFiltersChange={setFilters}
                              onClearFilters={() => setFilters({})}
                            />
                          )}
                          
                          {renderEquipmentsTable()}
                        </div>
                      </TabsContent>
        </Tabs>

        {/* Modal de histórico */}
        <EquipmentHistoryModal
          equipment={selectedEquipment}
          isOpen={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedEquipment(null);
          }}
        />

        {/* Modal de relatórios */}
        <EquipmentReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
        />

        <EquipmentFormModal
          isOpen={formModalOpen}
          onClose={handleFormModalClose}
          onSuccess={handleFormSuccess}
        />
      </div>
  );
};

export default Equipamentos; 