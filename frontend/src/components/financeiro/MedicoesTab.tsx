import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import MeasurementCompleteTable from '@/components/financeiro/MeasurementCompleteTable';
import MeasurementSimpleTable from '@/components/financeiro/MeasurementSimpleTable';
import {
  Calculator,
  DollarSign,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  Target,
  RefreshCw,
  Download,
  Upload,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building,
  FileText,
  ClipboardList,
  CheckSquare,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/axios';
import { contractService, Contract } from '@/services/contractService';
import { employeeService, Employee } from '@/services/employeeService';
import { companyService } from '@/services/companyService';
import { Company } from '@/types/company';
import { measurementService } from '@/services/measurementService';

interface MeasurementItem {
  id: string;
  itemNumber: number;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  costCenterId?: string;
  costCenterName?: string;
}

interface MeasurementBulletin {
  id: string;
  companyName: string;
  periodStart: string;
  periodEnd: string;
  contractNumber: string;
  contractStart?: string;
  contractEnd?: string;
  nfNumber?: string;
  elaboratedBy: string;
  measuredBy: string;
  validatedBy?: string;
  checkedBy?: string;
  status: 'DRAFT' | 'PENDING' | 'VALIDATED' | 'CANCELLED';
  subtotal: number;
  items: MeasurementItem[];
  clientId?: string;
  clientName?: string;
  client?: {
    id: string;
    name: string;
  };
  contractId?: string;
  contract?: {
    id: string;
    number: string;
  };
  unitId?: string;
  unit?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

interface MeasurementSummary {
  totalBulletins: number;
  draftBulletins: number;
  pendingBulletins: number;
  validatedBulletins: number;
  totalValue: number;
  averageValue: number;
}

const MedicoesTab: React.FC = () => {
  const { toast } = useToast();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [bulletins, setBulletins] = useState<MeasurementBulletin[]>([]);
  const [summary, setSummary] = useState<MeasurementSummary>({
    totalBulletins: 0,
    draftBulletins: 0,
    pendingBulletins: 0,
    validatedBulletins: 0,
    totalValue: 0,
    averageValue: 0
  });
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingBulletin, setEditingBulletin] = useState<MeasurementBulletin | null>(null);
  const [viewingBulletin, setViewingBulletin] = useState<MeasurementBulletin | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [contractFilter, setContractFilter] = useState<string>('');
  
  // Dados para os selects
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Formulário
  const [formData, setFormData] = useState<Partial<MeasurementBulletin>>({
    companyName: '',
    periodStart: '',
    periodEnd: '',
    contractNumber: '',
    elaboratedBy: '',
    measuredBy: '',
    status: 'DRAFT',
    notes: ''
  });
  
  // IDs auxiliares para os selects (armazenam IDs, mas formData armazena nomes)
  const [companyId, setCompanyId] = useState<string>('');
  const [contractId, setContractId] = useState<string>('');
  const [elaboratedById, setElaboratedById] = useState<string>('');
  const [measuredById, setMeasuredById] = useState<string>('');

  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Função helper para determinar se uma medição é completa
  const isCompleteMeasurement = (bulletin: MeasurementBulletin): boolean => {
    // Priorizar notas explícitas
    const hasCompleteNote = bulletin.notes?.toLowerCase().includes('completa') || 
                          bulletin.notes?.toLowerCase().includes('detalhada');
    if (hasCompleteNote) return true;
    
    // Se tiver nota de simplificada, não é completa
    const hasSimplifiedNote = bulletin.notes?.toLowerCase().includes('simplificada') || 
                             bulletin.notes?.toLowerCase().includes('rápida');
    if (hasSimplifiedNote) return false;
    
    // Medição completa: múltiplos itens OU valor alto
    const hasMultipleItems = bulletin.items && bulletin.items.length > 1;
    const totalValue = bulletin.items?.reduce((sum, item) => {
      const itemValue = item.totalValue || ((item.quantity || 0) * (item.unitPrice || 0));
      return sum + itemValue;
    }, 0) || 0;
    const hasHighValue = totalValue > 10000;
    
    return hasMultipleItems || hasHighValue;
  };

  // Função helper para determinar se uma medição é simplificada
  const isSimplifiedMeasurement = (bulletin: MeasurementBulletin): boolean => {
    // Priorizar notas explícitas
    const hasSimplifiedNote = bulletin.notes?.toLowerCase().includes('simplificada') || 
                             bulletin.notes?.toLowerCase().includes('rápida');
    if (hasSimplifiedNote) return true;
    
    // Se tiver nota de completa, não é simplificada
    const hasCompleteNote = bulletin.notes?.toLowerCase().includes('completa') || 
                          bulletin.notes?.toLowerCase().includes('detalhada');
    if (hasCompleteNote) return false;
    
    // Medição simplificada: item único OU valor baixo
    const hasSingleItem = bulletin.items && bulletin.items.length === 1;
    const totalValue = bulletin.items?.reduce((sum, item) => {
      const itemValue = item.totalValue || ((item.quantity || 0) * (item.unitPrice || 0));
      return sum + itemValue;
    }, 0) || 0;
    const hasLowValue = totalValue <= 10000;
    
    // Se não tem itens ou itens não carregados, considerar como simplificada se não for completa
    if (!bulletin.items || bulletin.items.length === 0) {
      return !hasCompleteNote;
    }
    
    // Retornar true se tiver 1 item OU valor baixo
    return hasSingleItem || hasLowValue;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para calcular subtotal a partir dos itens se necessário
  const calculateSubtotalFromItems = (bulletin: MeasurementBulletin): number => {
    if (bulletin.subtotal && bulletin.subtotal > 0) {
      return bulletin.subtotal;
    }
    if (bulletin.items && bulletin.items.length > 0) {
      return bulletin.items.reduce((sum: number, item: any) => {
        const itemValue = item.totalValue || ((item.quantity || 0) * (item.unitPrice || 0));
        return sum + itemValue;
      }, 0);
    }
    return 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'VALIDATED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <FileText className="h-4 w-4" />;
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'VALIDATED': return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED': return <X className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Rascunho';
      case 'PENDING': return 'Pendente';
      case 'VALIDATED': return 'Validado';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar boletins de medição da API
      const response = await api.get('/measurements/all');
      // Garantir que o subtotal seja calculado se necessário
      const bulletinsWithSubtotal = response.data.map((bulletin: MeasurementBulletin) => {
        if (!bulletin.subtotal || bulletin.subtotal === 0) {
          const calculatedSubtotal = calculateSubtotalFromItems(bulletin);
          return { ...bulletin, subtotal: calculatedSubtotal };
        }
        return bulletin;
      });
      setBulletins(bulletinsWithSubtotal);

      // Calcular resumo
      const totalBulletins = response.data.length;
      const draftBulletins = response.data.filter((b: MeasurementBulletin) => b.status === 'DRAFT').length;
      const pendingBulletins = response.data.filter((b: MeasurementBulletin) => b.status === 'PENDING').length;
      const validatedBulletins = response.data.filter((b: MeasurementBulletin) => b.status === 'VALIDATED').length;
      const totalValue = response.data.reduce((sum: number, b: MeasurementBulletin) => {
        const subtotal = calculateSubtotalFromItems(b);
        return sum + subtotal;
      }, 0);
      const averageValue = totalBulletins > 0 ? totalValue / totalBulletins : 0;

      setSummary({
        totalBulletins,
        draftBulletins,
        pendingBulletins,
        validatedBulletins,
        totalValue,
        averageValue
      });

    } catch (error) {
      console.error('Erro ao carregar boletins de medição:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar boletins de medição",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarBoletim = async () => {
    try {
      // Criar payload limpo sem campos não aceitos pelo DTO
      const payload: any = {
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        contractNumber: formData.contractNumber,
        contractStart: formData.contractStart,
        contractEnd: formData.contractEnd,
        nfNumber: formData.nfNumber || '',
        elaboratedBy: formData.elaboratedBy,
        measuredBy: formData.measuredBy,
        status: formData.status || 'DRAFT',
        notes: formData.notes || '',
        items: formData.items || []
      };

      // Adicionar subtotal se estiver definido
      if (formData.subtotal !== undefined && formData.subtotal !== null) {
        payload.subtotal = formData.subtotal;
      }

      // Adicionar IDs apenas se estiverem definidos
      if (contractId) {
        payload.contractId = contractId;
      }
      if (companyId) {
        payload.clientId = companyId; // O backend espera clientId
      }

      if (editingBulletin) {
        // Atualizar boletim existente
        await api.put(`/measurements/${editingBulletin.id}`, payload);
        toast({
          title: "Sucesso",
          description: "Boletim de medição atualizado com sucesso",
        });
      } else {
        // Criar novo boletim
        await api.post('/measurements', payload);
        toast({
          title: "Sucesso",
          description: "Boletim de medição criado com sucesso",
        });
      }
      
      setShowFormModal(false);
      setEditingBulletin(null);
      setFormData({
        companyName: '',
        periodStart: '',
        periodEnd: '',
        contractNumber: '',
        elaboratedBy: '',
        measuredBy: '',
        status: 'DRAFT',
        notes: ''
      });
      setElaboratedById('');
      setMeasuredById('');
      setContractId('');
      setCompanyId('');
      
      carregarDados();
    } catch (error) {
      console.error('Erro ao salvar boletim:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar boletim de medição",
        variant: "destructive",
      });
    }
  };

  const handleExcluirBoletim = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este boletim de medição?')) return;
    
    try {
      await api.delete(`/measurements/${id}`);
      toast({
        title: "Sucesso",
        description: "Boletim de medição excluído com sucesso",
      });
      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir boletim:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir boletim de medição",
        variant: "destructive",
      });
    }
  };

  const handleValidarBoletim = async (id: string) => {
    try {
      await api.patch(`/measurements/${id}/validate`, null, {
        params: {
          validatedBy: 'Usuário Atual',
          checkedBy: 'Usuário Atual'
        }
      });
      toast({
        title: "Sucesso",
        description: "Boletim de medição validado com sucesso",
      });
      carregarDados();
    } catch (error) {
      console.error('Erro ao validar boletim:', error);
      toast({
        title: "Erro",
        description: "Erro ao validar boletim de medição",
        variant: "destructive",
      });
    }
  };

  const handleEditarBoletim = async (bulletin: MeasurementBulletin) => {
    setEditingBulletin(bulletin);
    setFormData({
      companyName: bulletin.companyName,
      periodStart: bulletin.periodStart,
      periodEnd: bulletin.periodEnd,
      contractNumber: bulletin.contractNumber,
      contractStart: bulletin.contractStart,
      contractEnd: bulletin.contractEnd,
      nfNumber: bulletin.nfNumber,
      elaboratedBy: bulletin.elaboratedBy,
      measuredBy: bulletin.measuredBy,
      status: bulletin.status,
      notes: bulletin.notes || '',
      items: bulletin.items || [],
      subtotal: bulletin.subtotal || 0
    });
    
    // Carregar dados primeiro
    const { contracts: contractsData, employees: employeesData, companies: companiesData } = await carregarDadosParaModal();
    
    // Encontrar empresa - priorizar clientId, depois client.id, depois busca por nome
    let companyIdToSet = '';
    if (bulletin.clientId) {
      // Usar clientId diretamente se disponível
      companyIdToSet = bulletin.clientId;
      console.log('🔍 Usando clientId do boletim:', companyIdToSet);
    } else if (bulletin.client?.id) {
      companyIdToSet = bulletin.client.id;
      console.log('🔍 Usando client.id do boletim:', companyIdToSet);
    } else if (bulletin.companyName) {
      // Buscar por nome (case-insensitive e trim)
      const company = companiesData.find(c => {
        const companyName = c.name?.trim().toLowerCase() || '';
        const bulletinName = bulletin.companyName?.trim().toLowerCase() || '';
        return companyName === bulletinName || companyName.includes(bulletinName) || bulletinName.includes(companyName);
      });
      companyIdToSet = company?.id || '';
      console.log('🔍 Buscando empresa por nome:', bulletin.companyName, 'Encontrada:', company?.name, 'ID:', companyIdToSet);
    }
    
    // Se ainda não encontrou, tentar buscar na lista de empresas carregadas
    if (!companyIdToSet && bulletin.companyName && companiesData.length > 0) {
      const company = companiesData.find(c => 
        c.name?.trim().toLowerCase().includes(bulletin.companyName?.trim().toLowerCase() || '') ||
        bulletin.companyName?.trim().toLowerCase().includes(c.name?.trim().toLowerCase() || '')
      );
      if (company) {
        companyIdToSet = company.id;
        console.log('🔍 Empresa encontrada por busca parcial:', company.name, 'ID:', companyIdToSet);
      }
    }
    
    setCompanyId(companyIdToSet);
    console.log('✅ companyId definido:', companyIdToSet);
    
    // Encontrar contrato - priorizar contractId, depois contract.id, depois busca por número
    let contractIdToSet = '';
    if (bulletin.contractId) {
      contractIdToSet = bulletin.contractId;
    } else if (bulletin.contract?.id) {
      contractIdToSet = bulletin.contract.id;
    } else if (bulletin.contractNumber) {
      const contract = contractsData.find(c => c.contractNumber === bulletin.contractNumber);
      contractIdToSet = contract?.id || '';
    }
    setContractId(contractIdToSet);
    
    // Encontrar funcionários pelo nome
    const elaboratedEmployee = employeesData.find(e => e.name === bulletin.elaboratedBy);
    const measuredEmployee = employeesData.find(e => e.name === bulletin.measuredBy);
    setElaboratedById(elaboratedEmployee?.id || '');
    setMeasuredById(measuredEmployee?.id || '');
    
    setShowFormModal(true);
  };

  const handleVisualizarBoletim = (bulletin: MeasurementBulletin) => {
    setViewingBulletin(bulletin);
    setShowViewModal(true);
  };

  const carregarDadosParaModal = async (): Promise<{ contracts: Contract[], employees: Employee[], companies: Company[] }> => {
    try {
      setLoadingData(true);
      // Carregar contratos, funcionários e empresas em paralelo
      const [contractsData, employeesData, companiesData] = await Promise.all([
        contractService.getContracts(),
        employeeService.getAllEmployees(),
        companyService.getAllCompanies()
      ]);
      setContracts(contractsData);
      setEmployees(employeesData);
      setCompanies(companiesData as Company[]);
      return { contracts: contractsData, employees: employeesData, companies: companiesData as Company[] };
    } catch (error) {
      console.error('Erro ao carregar dados para modal:', error);
      toast({
        title: "Aviso",
        description: "Erro ao carregar dados. Alguns campos podem não estar disponíveis.",
        variant: "destructive",
      });
      return { contracts: [], employees: [], companies: [] };
    } finally {
      setLoadingData(false);
    }
  };

  const handleNovoBoletim = async () => {
    setEditingBulletin(null);
    setFormData({
      companyName: '',
      periodStart: '',
      periodEnd: '',
      contractNumber: '',
      elaboratedBy: '',
      measuredBy: '',
      status: 'DRAFT',
      notes: ''
    });
    setContractId('');
    setCompanyId('');
    setElaboratedById('');
    setMeasuredById('');
    await carregarDadosParaModal();
    setShowFormModal(true);
  };

  // Filtrar boletins baseado na aba ativa e filtros
  const filteredBulletins = bulletins.filter(bulletin => {
    // Filtro por tipo de medição baseado na aba ativa
    let matchesType = true;
    if (activeTab === 'completa') {
      matchesType = isCompleteMeasurement(bulletin);
    } else if (activeTab === 'simplificada') {
      matchesType = isSimplifiedMeasurement(bulletin);
    }
    // Se estiver na aba dashboard (activeTab === 'dashboard'), matchesType permanece true
    // isso significa que todas as medições serão exibidas no dashboard
    
    const matchesSearch = searchTerm === '' || 
      bulletin.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bulletin.elaboratedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bulletin.measuredBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'TODOS' || bulletin.status === statusFilter;
    const matchesContract = contractFilter === '' || bulletin.contractNumber.includes(contractFilter);
    
    return matchesType && matchesSearch && matchesStatus && matchesContract;
  });
  
  // Debug: log da contagem de medições
  console.log(`📊 Dashboard - Total: ${bulletins.length}, Filtrados: ${filteredBulletins.length}, Aba ativa: ${activeTab}`);

  useEffect(() => {
    carregarDados();
  }, []);

  // Atualizar companyId quando empresas forem carregadas e estiver editando
  useEffect(() => {
    if (editingBulletin && companies.length > 0 && !companyId) {
      // Tentar encontrar empresa novamente agora que as empresas foram carregadas
      let foundCompanyId = '';
      
      if (editingBulletin.clientId) {
        foundCompanyId = editingBulletin.clientId;
      } else if (editingBulletin.client?.id) {
        foundCompanyId = editingBulletin.client.id;
      } else if (editingBulletin.companyName) {
        const company = companies.find(c => {
          const companyName = c.name?.trim().toLowerCase() || '';
          const bulletinName = editingBulletin.companyName?.trim().toLowerCase() || '';
          return companyName === bulletinName || 
                 companyName.includes(bulletinName) || 
                 bulletinName.includes(companyName);
        });
        foundCompanyId = company?.id || '';
      }
      
      if (foundCompanyId) {
        setCompanyId(foundCompanyId);
        console.log('✅ companyId atualizado via useEffect:', foundCompanyId);
      }
    }
  }, [companies, editingBulletin, companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-seguranca-yellow"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
            <Calculator className="h-6 w-6 text-seguranca-yellow" />
            Medições
          </h2>
          <p className="text-gray-400 mt-1">
            Gerencie boletins de medição e acompanhe contratos
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={carregarDados}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            onClick={handleNovoBoletim}
            className="bg-seguranca-yellow hover:bg-yellow-600 text-black"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Boletim
          </Button>
        </div>
      </div>

      {/* Tabs - Padrão SST */}
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-seguranca-graphite border-gray-600">
          <TabsTrigger value="dashboard" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red text-xs sm:text-sm">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="completa" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red text-xs sm:text-sm">
            Completa
          </TabsTrigger>
          <TabsTrigger value="simplificada" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red text-xs sm:text-sm">
            Simplificada
          </TabsTrigger>
        </TabsList>

        {/* Tab Dashboard */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-600/20 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Total de Boletins</p>
                <p className="text-2xl font-bold text-white">{summary.totalBulletins}</p>
                <p className="text-blue-200 text-xs">{summary.draftBulletins} rascunhos</p>
              </div>
              <ClipboardList className="h-8 w-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-600/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm">Validados</p>
                <p className="text-2xl font-bold text-white">{summary.validatedBulletins}</p>
                <p className="text-green-200 text-xs">Boletins aprovados</p>
              </div>
              <CheckSquare className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-600/20 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 text-sm">Pendentes</p>
                <p className="text-2xl font-bold text-white">{summary.pendingBulletins}</p>
                <p className="text-yellow-200 text-xs">Aguardando validação</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-600/20 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">Valor Total</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalValue)}</p>
                <p className="text-purple-200 text-xs">Média: {formatCurrency(summary.averageValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Contrato, elaborado por, medido por..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-seguranca-black border-gray-600 text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="DRAFT">Rascunho</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="VALIDATED">Validado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Contrato</label>
              <Input
                placeholder="Número do contrato"
                value={contractFilter}
                onChange={(e) => setContractFilter(e.target.value)}
                className="bg-seguranca-black border-gray-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Boletins */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray">
            Boletins de Medição ({filteredBulletins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600">
                  <TableHead className="text-gray-300">Contrato</TableHead>
                  <TableHead className="text-gray-300">Período</TableHead>
                  <TableHead className="text-gray-300">Elaborado por</TableHead>
                  <TableHead className="text-gray-300">Medido por</TableHead>
                  <TableHead className="text-gray-300">Valor</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBulletins.map((bulletin) => (
                  <TableRow key={bulletin.id} className="border-gray-600 hover:bg-gray-700/50">
                    <TableCell className="text-white font-medium">
                      {bulletin.contractNumber}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {format(new Date(bulletin.periodStart), 'dd/MM/yy', { locale: ptBR })} - {format(new Date(bulletin.periodEnd), 'dd/MM/yy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {bulletin.elaboratedBy}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {bulletin.measuredBy}
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {formatCurrency(calculateSubtotalFromItems(bulletin))}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(bulletin.status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(bulletin.status)}
                        {getStatusText(bulletin.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleVisualizarBoletim(bulletin)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Visualizar boletim"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditarBoletim(bulletin)}
                          className="text-yellow-400 hover:text-yellow-300"
                          title="Editar boletim"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {bulletin.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleValidarBoletim(bulletin.id)}
                            className="text-green-400 hover:text-green-300"
                            title="Validar boletim"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExcluirBoletim(bulletin.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Excluir boletim"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Tab Completa */}
        <TabsContent value="completa" className="mt-6">
          <MeasurementCompleteTable
            onView={handleVisualizarBoletim}
            onEdit={handleEditarBoletim}
            onDelete={(bulletin) => handleExcluirBoletim(bulletin.id)}
            onCreate={handleNovoBoletim}
            onValidate={(bulletin) => handleValidarBoletim(bulletin.id)}
          />
        </TabsContent>

        {/* Tab Simplificada */}
        <TabsContent value="simplificada" className="mt-6">
          <MeasurementSimpleTable
            onView={handleVisualizarBoletim}
            onEdit={handleEditarBoletim}
            onDelete={(bulletin) => handleExcluirBoletim(bulletin.id)}
            onCreate={handleNovoBoletim}
            onValidate={(bulletin) => handleValidarBoletim(bulletin.id)}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Formulário */}
      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
          <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
            <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              {editingBulletin ? 'Editar Boletim' : 'Novo Boletim de Medição'}
            </DialogTitle>
            <DialogDescription className="text-white/80 text-sm">
              {editingBulletin ? 'Atualize os dados do boletim' : 'Preencha os dados do novo boletim de medição'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Seção: Informações Básicas */}
            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <Building className="h-5 w-5 text-seguranca-red" />
                  </div>
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray font-medium">Nome da Empresa <span className="text-seguranca-red">*</span></Label>
                  <Select
                    value={(() => {
                      // Priorizar companyId se estiver definido
                      if (companyId) {
                        return companyId;
                      }
                      // Tentar encontrar empresa por nome se companyId não estiver definido
                      if (formData.companyName && companies.length > 0) {
                        const found = companies.find(c => {
                          const companyName = c.name?.trim().toLowerCase() || '';
                          const formName = formData.companyName?.trim().toLowerCase() || '';
                          return companyName === formName || 
                                 companyName.includes(formName) || 
                                 formName.includes(companyName);
                        });
                        if (found) {
                          // Atualizar companyId se encontrou
                          setCompanyId(found.id);
                          return found.id;
                        }
                      }
                      return '';
                    })()}
                    onValueChange={(value) => {
                      const selectedCompany = companies.find(c => c.id === value);
                      setCompanyId(value);
                      setFormData({
                        ...formData,
                        companyName: selectedCompany?.name || ''
                      });
                    }}
                    disabled={loadingData}
                  >
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                      <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione a empresa"} />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-seguranca-lightgray font-medium">Número do Contrato <span className="text-seguranca-red">*</span></Label>
                    <Select
                      value={formData.contractNumber}
                      onValueChange={(value) => {
                        const selectedContract = contracts.find(c => c.contractNumber === value);
                        setContractId(selectedContract?.id || '');
                        setFormData({
                          ...formData,
                          contractNumber: value,
                          contractStart: selectedContract?.startDate || '',
                          contractEnd: selectedContract?.endDate || ''
                        });
                      }}
                      disabled={loadingData}
                    >
                      <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                        <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione o contrato"} />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[200px]">
                        {contracts.map(contract => (
                          <SelectItem key={contract.id} value={contract.contractNumber} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                            {contract.contractNumber} - {contract.clientName || contract.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-seguranca-lightgray font-medium">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as any})}>
                      <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-graphite border-gray-600">
                        <SelectItem value="DRAFT" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Rascunho</SelectItem>
                        <SelectItem value="PENDING" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Pendente</SelectItem>
                        <SelectItem value="VALIDATED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Validado</SelectItem>
                        <SelectItem value="CANCELLED" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Seção: Período e Valor */}
            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-seguranca-red" />
                  </div>
                  Período e Valor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-seguranca-lightgray font-medium">Data Início do Período <span className="text-seguranca-red">*</span></Label>
                    <Input
                      type="date"
                      value={formData.periodStart}
                      onChange={(e) => setFormData({...formData, periodStart: e.target.value})}
                      className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-seguranca-lightgray font-medium">Data Fim do Período <span className="text-seguranca-red">*</span></Label>
                    <Input
                      type="date"
                      value={formData.periodEnd}
                      onChange={(e) => setFormData({...formData, periodEnd: e.target.value})}
                      className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                    />
                  </div>
                </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Elaborado por *</label>
                <Select
                  value={elaboratedById || (formData.elaboratedBy ? employees.find(e => e.name === formData.elaboratedBy)?.id || '' : '')}
                  onValueChange={(value) => {
                    const selectedEmployee = employees.find(e => e.id === value);
                    setElaboratedById(value);
                    setFormData({
                      ...formData,
                      elaboratedBy: selectedEmployee?.name || ''
                    });
                  }}
                  disabled={loadingData}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-white">
                    <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione o funcionário"} />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Medido por *</label>
                <Select
                  value={measuredById || (formData.measuredBy ? employees.find(e => e.name === formData.measuredBy)?.id || '' : '')}
                  onValueChange={(value) => {
                    const selectedEmployee = employees.find(e => e.id === value);
                    setMeasuredById(value);
                    setFormData({
                      ...formData,
                      measuredBy: selectedEmployee?.name || ''
                    });
                  }}
                  disabled={loadingData}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-white">
                    <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione o funcionário"} />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Valor Total (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.subtotal || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setFormData({...formData, subtotal: value});
                    }}
                    placeholder="0.00"
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11"
                  />
                  {formData.subtotal && formData.subtotal > 0 && (
                    <p className="text-sm text-gray-400">
                      {formatCurrency(formData.subtotal)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Observações</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Observações adicionais"
                className="bg-seguranca-black border-gray-600 text-white"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2 pt-4">
            {editingBulletin && editingBulletin.id && (
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    if (!editingBulletin?.id) return;
                    const blob = await measurementService.generateBulletinPDF(editingBulletin.id);
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `boletim_medicao_${editingBulletin.id}.pdf`;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                    toast({
                      title: "Sucesso",
                      description: `PDF gerado com sucesso! (${Math.round(blob.size / 1024)} KB)`,
                    });
                  } catch (error) {
                    console.error('Erro ao gerar PDF:', error);
                    toast({
                      title: "Erro",
                      description: `Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                      variant: "destructive",
                    });
                  }
                }}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
              >
                <FileText className="mr-2 h-4 w-4" />
                Gerar PDF
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFormModal(false)}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSalvarBoletim}
              className="bg-gradient-to-r from-seguranca-yellow to-yellow-500 hover:from-seguranca-yellow/90 hover:to-yellow-500/90 text-black font-semibold shadow-lg"
            >
              {editingBulletin ? 'Atualizar Boletim' : 'Criar Boletim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl bg-seguranca-graphite border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray">
              Detalhes do Boletim de Medição
            </DialogTitle>
          </DialogHeader>
          
          {viewingBulletin && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Empresa</label>
                  <p className="text-white">{viewingBulletin.companyName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Contrato</label>
                  <p className="text-white font-medium">{viewingBulletin.contractNumber}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Período</label>
                  <p className="text-white">
                    {format(new Date(viewingBulletin.periodStart), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(viewingBulletin.periodEnd), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Status</label>
                  <Badge className={`${getStatusColor(viewingBulletin.status)} flex items-center gap-1 w-fit`}>
                    {getStatusIcon(viewingBulletin.status)}
                    {getStatusText(viewingBulletin.status)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Elaborado por</label>
                  <p className="text-white">{viewingBulletin.elaboratedBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Medido por</label>
                  <p className="text-white">{viewingBulletin.measuredBy}</p>
                </div>
              </div>
              
              {viewingBulletin.validatedBy && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Validado por</label>
                    <p className="text-white">{viewingBulletin.validatedBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Verificado por</label>
                    <p className="text-white">{viewingBulletin.checkedBy}</p>
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-300">Valor Total</label>
                <p className="text-white text-2xl font-bold">{formatCurrency(viewingBulletin.subtotal)}</p>
              </div>
              
              {/* Itens da Medição */}
              {viewingBulletin.items && viewingBulletin.items.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Itens da Medição</label>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-600">
                          <TableHead className="text-gray-300">Item</TableHead>
                          <TableHead className="text-gray-300">Código</TableHead>
                          <TableHead className="text-gray-300">Descrição</TableHead>
                          <TableHead className="text-gray-300">Unidade</TableHead>
                          <TableHead className="text-gray-300">Quantidade</TableHead>
                          <TableHead className="text-gray-300">Preço Unit.</TableHead>
                          <TableHead className="text-gray-300">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingBulletin.items.map((item) => (
                          <TableRow key={item.id} className="border-gray-600">
                            <TableCell className="text-white">{item.itemNumber}</TableCell>
                            <TableCell className="text-gray-300">{item.code}</TableCell>
                            <TableCell className="text-gray-300">{item.description}</TableCell>
                            <TableCell className="text-gray-300">{item.unit}</TableCell>
                            <TableCell className="text-gray-300">{item.quantity}</TableCell>
                            <TableCell className="text-gray-300">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-white font-medium">{formatCurrency(item.totalValue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
              {viewingBulletin.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-300">Observações</label>
                  <p className="text-white">{viewingBulletin.notes}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setShowViewModal(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicoesTab;
