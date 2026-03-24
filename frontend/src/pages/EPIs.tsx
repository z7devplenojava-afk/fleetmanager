import React, { useState, useEffect } from 'react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import epiService from '@/services/epiService';
import { EPI, EPIType, EPIStatus } from '@/types/epi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import EPIControl from './EPIControl';
import api from '@/lib/axios';
import { caepiService, CAEPIResponse } from '@/services/caepiService';
import { contasAPagarService, Supplier } from '@/services/contasAPagarService';
import SupplierFormModal from '@/components/estoque/SupplierFormModal';

const EPIs: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<EPIType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<EPIStatus | 'ALL'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEPI, setSelectedEPI] = useState<EPI | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [epiDeliveries, setEpiDeliveries] = useState<any[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  
  // Estados para busca de CA
  const [caLoading, setCaLoading] = useState(false);
  const [caSearchTimeout, setCaSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Estados para fornecedores
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  
  // Formulário de criação
  const [epiForm, setEpiForm] = useState<Omit<EPI, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    type: 'OTHER',
    brand: '',
    model: '',
    size: undefined,
    color: undefined,
    certification: '',
    status: 'ACTIVE',
    quantity: 0,
    availableQuantity: 0,
    unitPrice: 0,
    supplier: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: undefined,
    lastMaintenanceDate: undefined,
    nextMaintenanceDate: undefined,
    location: 'Almoxarifado',
    notes: ''
  });

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

  // Carregar fornecedores quando modal abrir
  useEffect(() => {
    if (isCreateModalOpen) {
      loadSuppliers();
    }
  }, [isCreateModalOpen]);

  // Buscar CA automaticamente quando o nome do EPI mudar
  useEffect(() => {
    if (!epiForm.name || epiForm.name.trim().length < 3) {
      return;
    }

    // Limpar timeout anterior
    if (caSearchTimeout) {
      clearTimeout(caSearchTimeout);
    }

    // Debounce de 800ms
    const timeout = setTimeout(async () => {
      try {
        setCaLoading(true);
        const resultados = await caepiService.buscarCAs(epiForm.name);
        
        if (resultados && resultados.length > 0) {
          // Pegar o primeiro resultado mais relevante
          const caEncontrado = resultados[0];
          setEpiForm(prev => ({
            ...prev,
            certification: caEncontrado.numero,
            // Se não tiver validade preenchida, tentar preencher
            expiryDate: prev.expiryDate || (caEncontrado.validade ? formatDateForInput(caEncontrado.validade) : undefined)
          }));
          
          toast({
            title: "CA encontrado",
            description: `CA ${caEncontrado.numero} - ${caEncontrado.nome}`,
            variant: "default"
          });
        }
      } catch (error) {
        console.error('Erro ao buscar CA:', error);
      } finally {
        setCaLoading(false);
      }
    }, 800);

    setCaSearchTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [epiForm.name]);

  // Função auxiliar para formatar data para input
  const formatDateForInput = (dateString: string): string | undefined => {
    try {
      // Tentar diferentes formatos de data
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return undefined;
      }
      return date.toISOString().split('T')[0];
    } catch {
      return undefined;
    }
  };

  // Carregar fornecedores
  const loadSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const fornecedores = await contasAPagarService.getFornecedores();
      setSuppliers(fornecedores);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de fornecedores",
        variant: "destructive"
      });
    } finally {
      setLoadingSuppliers(false);
    }
  };

  // Salvar novo fornecedor
  const handleSupplierSave = async (payload: any) => {
    try {
      const newSupplier = await contasAPagarService.createFornecedor(payload);
      toast({
        title: "Sucesso",
        description: "Fornecedor criado com sucesso!",
      });
      await loadSuppliers();
      // Selecionar automaticamente o fornecedor recém-criado
      setEpiForm(prev => ({ ...prev, supplier: newSupplier.name }));
      setIsSupplierModalOpen(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Não foi possível salvar o fornecedor.';
      toast({
        title: "Erro",
        description: msg,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Mutation para criar EPI
  const createEPIMutation = useMutation({
    mutationFn: (epi: Omit<EPI, 'id' | 'createdAt' | 'updatedAt'>) => epiService.createEPI(epi),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epis'] });
      queryClient.invalidateQueries({ queryKey: ['epiStats'] });
      toast({
        title: "Sucesso",
        description: "EPI cadastrado com sucesso!",
      });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Erro ao criar EPI:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível cadastrar o EPI",
        variant: "destructive",
      });
    }
  });

  // Resetar formulário
  const resetForm = () => {
    setEpiForm({
      name: '',
      description: '',
      type: 'OTHER',
      brand: '',
      model: '',
      size: undefined,
      color: undefined,
      certification: '',
      status: 'ACTIVE',
      quantity: 0,
      availableQuantity: 0,
      unitPrice: 0,
      supplier: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      expiryDate: undefined,
      lastMaintenanceDate: undefined,
      nextMaintenanceDate: undefined,
      location: 'Almoxarifado',
      notes: ''
    });
  };

  // Carregar entregas de um EPI específico
  const loadEPIDeliveries = async (epiId: number) => {
    setLoadingDeliveries(true);
    try {
      // Buscar o EPI selecionado para obter o UUID original
      const allEPIs = await epiService.getEPIs();
      const epi = allEPIs.find(e => e.id === epiId);
      
      if (!epi) {
        throw new Error('EPI não encontrado');
      }

      // Usar o UUID original se disponível, caso contrário tentar buscar do backend
      let epiUUID: string | undefined = epi.uuid;
      
      if (!epiUUID) {
        // Se não tiver UUID, buscar do backend diretamente
        const response = await api.get('/api/sst/epis/stock-inventory');
        const epiFromBackend = response.data.find((e: any) => 
          e.name === epi.name && e.brand === epi.brand && e.model === epi.model
        );
        epiUUID = epiFromBackend?.id;
      }

      if (epiUUID) {
        // Buscar entregas usando o UUID
        const deliveriesResponse = await api.get(`/api/sst/epi-deliveries/epi/${epiUUID}`);
        setEpiDeliveries(deliveriesResponse.data || []);
      } else {
        throw new Error('UUID do EPI não encontrado');
      }
    } catch (error: any) {
      console.error('Erro ao carregar entregas do EPI:', error);
      toast({
        title: "Aviso",
        description: "Não foi possível carregar as entregas deste EPI. Pode não haver entregas cadastradas ainda.",
        variant: "default",
      });
      setEpiDeliveries([]);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  // Handler para criar EPI
  const handleCreateEPI = async () => {
    if (!epiForm.name || !epiForm.type) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos o nome e o tipo do EPI",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createEPIMutation.mutateAsync(epiForm);
    } catch (error) {
      // Erro já tratado no onError
    } finally {
      setIsSubmitting(false);
    }
  };

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
                onClick={() => setIsCreateModalOpen(true)}
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                          onClick={() => {
                            setSelectedEPI(epi);
                            setIsViewModalOpen(true);
                          }}
                          title="Visualizar detalhes do EPI"
                        >
                          <Eye size={14} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                          onClick={async () => {
                            setSelectedEPI(epi);
                            setIsUsersModalOpen(true);
                            await loadEPIDeliveries(epi.id);
                          }}
                          title="Visualizar usuários com este EPI"
                        >
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

        {/* Modal de Criação de EPI */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-600 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Shield className="h-5 w-5 text-seguranca-yellow" />
                Novo EPI
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Preencha os dados para cadastrar um novo Equipamento de Proteção Individual
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Nome */}
              <div>
                <Label htmlFor="name" className="text-seguranca-lightgray">Nome do EPI *</Label>
                <div className="relative">
                  <Input
                    id="name"
                    value={epiForm.name}
                    onChange={(e) => setEpiForm({ ...epiForm, name: e.target.value })}
                    placeholder="Ex: Capacete de Segurança"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray mt-1 pr-8"
                  />
                  {caLoading && (
                    <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400 mt-1" />
                  )}
                </div>
                {caLoading && (
                  <p className="text-xs text-gray-400 mt-1">Buscando CA...</p>
                )}
              </div>

              {/* Descrição */}
              <div>
                <Label htmlFor="description" className="text-seguranca-lightgray">Descrição</Label>
                <Textarea
                  id="description"
                  value={epiForm.description}
                  onChange={(e) => setEpiForm({ ...epiForm, description: e.target.value })}
                  placeholder="Descrição detalhada do EPI"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray mt-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo */}
                <div>
                  <Label htmlFor="type" className="text-seguranca-lightgray">Tipo *</Label>
                  <Select
                    value={epiForm.type}
                    onValueChange={(value) => setEpiForm({ ...epiForm, type: value as EPIType })}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray mt-1">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="HELMET" className="text-seguranca-lightgray focus:bg-seguranca-black">Capacete</SelectItem>
                      <SelectItem value="GLOVES" className="text-seguranca-lightgray focus:bg-seguranca-black">Luvas</SelectItem>
                      <SelectItem value="SAFETY_GLASSES" className="text-seguranca-lightgray focus:bg-seguranca-black">Óculos</SelectItem>
                      <SelectItem value="SAFETY_SHOES" className="text-seguranca-lightgray focus:bg-seguranca-black">Calçados</SelectItem>
                      <SelectItem value="UNIFORM" className="text-seguranca-lightgray focus:bg-seguranca-black">Uniforme</SelectItem>
                      <SelectItem value="RESPIRATOR" className="text-seguranca-lightgray focus:bg-seguranca-black">Respirador</SelectItem>
                      <SelectItem value="OTHER" className="text-seguranca-lightgray focus:bg-seguranca-black">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <Label htmlFor="status" className="text-seguranca-lightgray">Status</Label>
                  <Select
                    value={epiForm.status}
                    onValueChange={(value) => setEpiForm({ ...epiForm, status: value as EPIStatus })}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray mt-1">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="ACTIVE" className="text-seguranca-lightgray focus:bg-seguranca-black">Ativo</SelectItem>
                      <SelectItem value="INACTIVE" className="text-seguranca-lightgray focus:bg-seguranca-black">Inativo</SelectItem>
                      <SelectItem value="MAINTENANCE" className="text-seguranca-lightgray focus:bg-seguranca-black">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Marca/Fabricante */}
                <div>
                  <Label htmlFor="brand" className="text-seguranca-lightgray">Marca/Fabricante</Label>
                  <Input
                    id="brand"
                    value={epiForm.brand}
                    onChange={(e) => setEpiForm({ ...epiForm, brand: e.target.value })}
                    placeholder="Ex: 3M, Ansell, etc."
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray mt-1"
                  />
                </div>

                {/* Modelo */}
                <div>
                  <Label htmlFor="model" className="text-seguranca-lightgray">Modelo</Label>
                  <Input
                    id="model"
                    value={epiForm.model}
                    onChange={(e) => setEpiForm({ ...epiForm, model: e.target.value })}
                    placeholder="Ex: SecureFit Pro"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Certificação (CA) */}
                <div>
                  <Label htmlFor="certification" className="text-seguranca-lightgray">Número do CA</Label>
                  <div className="relative">
                    <Input
                      id="certification"
                      value={epiForm.certification}
                      onChange={(e) => setEpiForm({ ...epiForm, certification: e.target.value })}
                      placeholder="Ex: ABNT NBR 8221"
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray mt-1 pr-8"
                    />
                    {caLoading && (
                      <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {caLoading ? 'Buscando CA...' : 'Preenchido automaticamente ao digitar o nome do EPI'}
                  </p>
                </div>

                {/* Quantidade */}
                <div>
                  <Label htmlFor="quantity" className="text-seguranca-lightgray">Quantidade Inicial</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={epiForm.quantity}
                    onChange={(e) => setEpiForm({ ...epiForm, quantity: parseInt(e.target.value) || 0, availableQuantity: parseInt(e.target.value) || 0 })}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray mt-1"
                  />
                </div>

                {/* Preço Unitário */}
                <div>
                  <Label htmlFor="unitPrice" className="text-seguranca-lightgray">Preço Unitário (R$)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={epiForm.unitPrice}
                    onChange={(e) => setEpiForm({ ...epiForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fornecedor */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="supplier" className="text-seguranca-lightgray">Fornecedor</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSupplierModalOpen(true)}
                      className="text-xs h-6 px-2 text-seguranca-yellow hover:text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Novo
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={epiForm.supplier || undefined}
                      onValueChange={(value) => {
                        if (value === '__NEW__') {
                          setIsSupplierModalOpen(true);
                        } else {
                          setEpiForm({ ...epiForm, supplier: value || '' });
                        }
                      }}
                      disabled={loadingSuppliers}
                    >
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray mt-1 flex-1">
                        <SelectValue placeholder={loadingSuppliers ? "Carregando..." : "Selecione o fornecedor"} />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[300px]">
                        {suppliers.map((supplier) => (
                          <SelectItem
                            key={supplier.id}
                            value={supplier.name}
                            className="text-seguranca-lightgray hover:bg-seguranca-black"
                          >
                            {supplier.name}
                          </SelectItem>
                        ))}
                        <SelectItem
                          value="__NEW__"
                          className="text-seguranca-yellow hover:bg-yellow-500/10 border-t border-gray-600 mt-1"
                        >
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            <span>Novo Fornecedor</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Validade do CA */}
                <div>
                  <Label htmlFor="expiryDate" className="text-seguranca-lightgray">Validade do CA</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={epiForm.expiryDate || ''}
                    onChange={(e) => setEpiForm({ ...epiForm, expiryDate: e.target.value || undefined })}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray mt-1"
                  />
                </div>
              </div>

              {/* Localização */}
              <div>
                <Label htmlFor="location" className="text-seguranca-lightgray">Localização</Label>
                <Input
                  id="location"
                  value={epiForm.location}
                  onChange={(e) => setEpiForm({ ...epiForm, location: e.target.value })}
                  placeholder="Ex: Almoxarifado A"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray mt-1"
                />
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="notes" className="text-seguranca-lightgray">Observações</Label>
                <Textarea
                  id="notes"
                  value={epiForm.notes}
                  onChange={(e) => setEpiForm({ ...epiForm, notes: e.target.value })}
                  placeholder="Observações adicionais sobre o EPI"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray mt-1"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-600">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateEPI}
                disabled={isSubmitting || !epiForm.name || !epiForm.type}
                className="bg-seguranca-red hover:bg-seguranca-darkred"
              >
                {isSubmitting ? 'Cadastrando...' : 'Cadastrar EPI'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Visualização de Detalhes do EPI */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-600 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Shield className="h-5 w-5 text-seguranca-yellow" />
                Detalhes do EPI
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Informações completas do equipamento de proteção individual
              </DialogDescription>
            </DialogHeader>
            {selectedEPI && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-seguranca-lightgray">Nome</Label>
                    <p className="text-white mt-1">{selectedEPI.name}</p>
                  </div>
                  <div>
                    <Label className="text-seguranca-lightgray">Tipo</Label>
                    <p className="text-white mt-1">{selectedEPI.type}</p>
                  </div>
                  <div>
                    <Label className="text-seguranca-lightgray">Marca</Label>
                    <p className="text-white mt-1">{selectedEPI.brand}</p>
                  </div>
                  <div>
                    <Label className="text-seguranca-lightgray">Modelo</Label>
                    <p className="text-white mt-1">{selectedEPI.model}</p>
                  </div>
                  <div>
                    <Label className="text-seguranca-lightgray">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedEPI.status)}</div>
                  </div>
                  <div>
                    <Label className="text-seguranca-lightgray">Certificação</Label>
                    <p className="text-white mt-1">{selectedEPI.certification || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-seguranca-lightgray">Quantidade Total</Label>
                    <p className="text-white mt-1">{selectedEPI.quantity}</p>
                  </div>
                  <div>
                    <Label className="text-seguranca-lightgray">Quantidade Disponível</Label>
                    <p className="text-white mt-1">{selectedEPI.availableQuantity}</p>
                  </div>
                  <div>
                    <Label className="text-seguranca-lightgray">Preço Unitário</Label>
                    <p className="text-white mt-1">{formatCurrency(selectedEPI.unitPrice)}</p>
                  </div>
                  <div>
                    <Label className="text-seguranca-lightgray">Fornecedor</Label>
                    <p className="text-white mt-1">{selectedEPI.supplier}</p>
                  </div>
                  <div>
                    <Label className="text-seguranca-lightgray">Localização</Label>
                    <p className="text-white mt-1">{selectedEPI.location}</p>
                  </div>
                  {selectedEPI.expiryDate && (
                    <div>
                      <Label className="text-seguranca-lightgray">Data de Expiração</Label>
                      <p className="text-white mt-1">{formatDate(selectedEPI.expiryDate)}</p>
                    </div>
                  )}
                </div>
                {selectedEPI.description && (
                  <div>
                    <Label className="text-seguranca-lightgray">Descrição</Label>
                    <p className="text-white mt-1">{selectedEPI.description}</p>
                  </div>
                )}
                {selectedEPI.notes && (
                  <div>
                    <Label className="text-seguranca-lightgray">Observações</Label>
                    <p className="text-white mt-1">{selectedEPI.notes}</p>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Usuários com o EPI */}
        <Dialog open={isUsersModalOpen} onOpenChange={setIsUsersModalOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-600 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Users className="h-5 w-5 text-seguranca-yellow" />
                Usuários com {selectedEPI?.name}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Lista de funcionários que receberam este EPI
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {loadingDeliveries ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-seguranca-yellow" />
                  <span className="ml-2 text-seguranca-lightgray">Carregando entregas...</span>
                </div>
              ) : epiDeliveries.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum funcionário recebeu este EPI ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {epiDeliveries.map((delivery: any) => (
                    <Card key={delivery.id} className="bg-seguranca-black border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-seguranca-lightgray">
                              {delivery.employee?.name || 'Funcionário não identificado'}
                            </h4>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-400">
                              <div>
                                <span className="font-medium">Quantidade:</span> {delivery.quantity}
                              </div>
                              <div>
                                <span className="font-medium">Data de Entrega:</span> {delivery.deliveryDate ? formatDate(delivery.deliveryDate) : 'N/A'}
                              </div>
                              {delivery.employee?.registrationNumber && (
                                <div>
                                  <span className="font-medium">Matrícula:</span> {delivery.employee.registrationNumber}
                                </div>
                              )}
                              {delivery.employee?.cpf && (
                                <div>
                                  <span className="font-medium">CPF:</span> {delivery.employee.cpf}
                                </div>
                              )}
                            </div>
                            {delivery.notes && (
                              <p className="text-xs text-gray-500 mt-2">{delivery.notes}</p>
                            )}
                          </div>
                          <div className="ml-4">
                            {delivery.receivedByEmployee ? (
                              <Badge className="bg-green-600">Recebido</Badge>
                            ) : (
                              <Badge className="bg-yellow-600">Pendente</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setIsUsersModalOpen(false)}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Novo Fornecedor */}
        <SupplierFormModal
          isOpen={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          onSave={handleSupplierSave}
        />
      </div>
    </StandardLayout>
  );
};

export default EPIs; 