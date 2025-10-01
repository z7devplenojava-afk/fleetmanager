import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Plus, 
  Search, 
  Filter,
  Loader2,
  AlertTriangle,
  Calendar,
  Package,
  DollarSign,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  HardHat,
  Hand,
  Eye,
  Shirt,
  Zap,
  FileText
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import epiService from '@/services/epiService';
import { EPI, EPIType, EPIStatus } from '@/types/epi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EPIControl from './EPIControl';

const EPIs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<EPIType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<EPIStatus | 'ALL'>('ALL');

  // Buscar EPIs
  const { 
    data: epis, 
    isLoading: episLoading, 
    error: episError,
    refetch: refetchEPIs 
  } = useQuery({
    queryKey: ['epis'],
    queryFn: () => epiService.getEPIs()
  });

  // Buscar estatísticas
  const { 
    data: stats, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ['epiStats'],
    queryFn: () => epiService.getEPIStats()
  });

  // Filtrar EPIs
  const filteredEPIs = epis?.filter(epi => {
    const matchesSearch = epi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         epi.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         epi.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         epi.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'ALL' || epi.type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || epi.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  // Funções auxiliares
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: EPIStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle size={12} />Ativo</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1"><XCircle size={12} />Inativo</Badge>;
      case 'MAINTENANCE':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1"><Clock size={12} />Manutenção</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><AlertCircle size={12} />Expirado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: EPIType) => {
    switch (type) {
      case 'HELMET':
        return <HardHat className="h-4 w-4 text-yellow-500" />;
      case 'GLOVES':
        return <Hand className="h-4 w-4 text-blue-500" />;
      case 'SAFETY_GLASSES':
        return <Eye className="h-4 w-4 text-purple-500" />;
      case 'SAFETY_SHOES':
        return <Zap className="h-4 w-4 text-green-500" />;
      case 'UNIFORM':
        return <Shirt className="h-4 w-4 text-orange-500" />;
      case 'RESPIRATOR':
        return <Shield className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: EPIType): string => {
    switch (type) {
      case 'HELMET':
        return 'Capacete';
      case 'GLOVES':
        return 'Luvas';
      case 'SAFETY_GLASSES':
        return 'Óculos';
      case 'SAFETY_SHOES':
        return 'Calçados';
      case 'UNIFORM':
        return 'Uniforme';
      case 'RESPIRATOR':
        return 'Respirador';
      default:
        return 'Outro';
    }
  };

  // Loading state
  if (episLoading || statsLoading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
          <span className="ml-2 text-seguranca-lightgray">Carregando EPIs...</span>
        </div>
      </StandardLayout>
    );
  }

  // Error state
  if (episError) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-seguranca-red mx-auto mb-2" />
            <p className="text-seguranca-lightgray">Erro ao carregar EPIs</p>
            <Button 
              onClick={() => refetchEPIs()}
              className="mt-2 bg-seguranca-red hover:bg-seguranca-darkred"
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Gestão de EPIs</h1>
            <p className="text-gray-400 mt-1">Controle de Equipamentos de Proteção Individual</p>
          </div>
        </div>

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Estoque de EPIs
            </TabsTrigger>
            <TabsTrigger value="control" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Controle de EPI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-seguranca-lightgray">Estoque de EPIs</h2>
                <p className="text-gray-400 mt-1">Gestão do inventário de equipamentos</p>
              </div>
              <Button 
                className="bg-seguranca-red hover:bg-seguranca-darkred"
              >
                <Plus size={16} className="mr-2" />
                Novo EPI
              </Button>
            </div>

        {/* Cards de Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-seguranca-lightgray">Total EPIs</CardTitle>
                <Shield className="h-4 w-4 text-seguranca-yellow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-seguranca-lightgray">{stats.total}</div>
                <p className="text-xs text-gray-400">Valor: {formatCurrency(stats.totalValue)}</p>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-seguranca-lightgray">Ativos</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-seguranca-lightgray">{stats.active}</div>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-seguranca-lightgray">Disponíveis</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-seguranca-lightgray">{stats.available}</div>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-seguranca-lightgray">Atribuídos</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-seguranca-lightgray">{stats.assigned}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Buscar EPIs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>

              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as EPIType | 'ALL')}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Tipo de EPI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os tipos</SelectItem>
                  <SelectItem value="HELMET">Capacete</SelectItem>
                  <SelectItem value="GLOVES">Luvas</SelectItem>
                  <SelectItem value="SAFETY_GLASSES">Óculos</SelectItem>
                  <SelectItem value="SAFETY_SHOES">Calçados</SelectItem>
                  <SelectItem value="UNIFORM">Uniforme</SelectItem>
                  <SelectItem value="RESPIRATOR">Respirador</SelectItem>
                  <SelectItem value="OTHER">Outro</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as EPIStatus | 'ALL')}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os status</SelectItem>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                  <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
                  <SelectItem value="EXPIRED">Expirado</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('ALL');
                  setSelectedStatus('ALL');
                }}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de EPIs */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">
              EPIs ({filteredEPIs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEPIs.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
                  Nenhum EPI encontrado
                </h3>
                <p className="text-gray-400">
                  {searchTerm || selectedType !== 'ALL' || selectedStatus !== 'ALL' 
                    ? 'Tente ajustar os filtros de busca.' 
                    : 'Não há EPIs cadastrados no sistema.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEPIs.map((epi) => (
                  <div key={epi.id} className="flex items-center justify-between p-4 bg-seguranca-black rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(epi.type)}
                        <div>
                          <h4 className="font-medium text-seguranca-lightgray">{epi.name}</h4>
                          <p className="text-sm text-gray-400">{epi.description}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500">{epi.brand} {epi.model}</span>
                            {epi.size && <span className="text-xs text-gray-500">Tamanho: {epi.size}</span>}
                            {epi.color && <span className="text-xs text-gray-500">Cor: {epi.color}</span>}
                            <span className="text-xs text-gray-500">{getTypeLabel(epi.type)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          {getStatusBadge(epi.status)}
                          <div className="flex items-center space-x-1 text-xs text-gray-400">
                            <Package size={12} />
                            <span>{epi.availableQuantity}/{epi.quantity}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <div className="flex items-center space-x-1">
                            <DollarSign size={12} />
                            <span>{formatCurrency(epi.unitPrice)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin size={12} />
                            <span>{epi.location}</span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 mt-1">
                          Fornecedor: {epi.supplier}
                        </div>

                        {epi.expiryDate && (
                          <div className="flex items-center space-x-1 text-xs text-gray-400 mt-1">
                            <Calendar size={12} />
                            <span>Expira: {formatDate(epi.expiryDate)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">
                          <Eye size={14} />
                        </Button>
                        <Button variant="outline" size="sm" className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">
                          <Users size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="control" className="space-y-6">
            <EPIControl />
          </TabsContent>
        </Tabs>
      </div>
    </StandardLayout>
  );
};

export default EPIs; 