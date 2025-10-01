import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  RefreshCw,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Loader2,
  AlertCircle,
  FileText,
  Briefcase,
  Award,
  FileWarning,
  Shuffle,
  Settings,
  UserPlus
} from 'lucide-react';
import { useAOS } from '@/hooks/use-aos';
import { useToast } from '@/hooks/use-toast';
import { employeeService, EmployeeFilters } from '@/services/employeeService';
import { Employee } from '@/types/employee';
import FuncionarioNovoModal from '@/components/funcionarios/FuncionarioNovoModal';
import FuncionarioEditModal from '@/components/funcionarios/FuncionarioEditModal';
import { EmployeeDocuments } from '@/components/funcionarios/EmployeeDocuments';
import { useLocation, useNavigate } from 'react-router-dom';
import EmployeeTrainingTab from '@/components/funcionarios/EmployeeTrainingTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmployeeDocumentsPanel from '@/components/funcionarios/EmployeeDocumentsPanel';
import DocumentosGerarTab from '@/components/funcionarios/DocumentosGerarTab';
import DependenteModal from '@/components/dependentes/DependenteModal';

const Funcionarios: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE' | 'VACATION' | 'MATERNITY_LEAVE' | 'MEDICAL_CERTIFICATE' | 'TERMINATED' | 'SUSPENDED'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const aos = useAOS();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const shouldOpenModal = params.get('novo') === '1';
  const [modalOpen, setModalOpen] = useState(shouldOpenModal);

  // Carregar funcionários
  const loadEmployees = async (filters: EmployeeFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await employeeService.getEmployees(filters);
      setEmployees(data);
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err);
      setError('Erro ao carregar funcionários. Tente novamente.');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os funcionários.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar funcionários com filtros
  const loadEmployeesWithFilters = async () => {
    const filters: EmployeeFilters = {};
    
    if (searchTerm) {
      filters.searchTerm = searchTerm;
    }
    
    if (statusFilter !== 'all') {
      filters.status = statusFilter;
    }
    
    await loadEmployees(filters);
  };

  // Carregar funcionários iniciais
  useEffect(() => {
    loadEmployees();
  }, []);

  // Aplicar filtros quando mudarem
  useEffect(() => {
    if (!loading) {
      loadEmployeesWithFilters();
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (shouldOpenModal) setModalOpen(true);
  }, [shouldOpenModal]);

  const handleOpenModal = () => {
    setModalOpen(true);
    navigate('/rh/funcionarios?novo=1', { replace: true });
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    if (shouldOpenModal) navigate('/rh/funcionarios', { replace: true });
  };

  // Abrir modal de edição
  const handleEditEmployee = (employee: Employee) => {
    console.log('🔍 handleEditEmployee chamado com:', employee);
    console.log('🔍 Estado atual editModalOpen:', editModalOpen);
    console.log('🔍 Estado atual employeeToEdit:', employeeToEdit);
    
    setEmployeeToEdit(employee);
    setEditModalOpen(true);
    
    console.log('🔍 Estado após setEmployeeToEdit:', employee);
    console.log('🔍 Estado após setEditModalOpen:', true);
  };

  // Fechar modal de edição
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEmployeeToEdit(null);
  };

  // Funcionário editado com sucesso
  const handleEmployeeEdited = () => {
    loadEmployeesWithFilters(); // Recarregar lista
    handleCloseEditModal();
  };

  // Filtrar funcionários por departamento (filtro local)
  const filteredEmployees = employees.filter(employee => {
    const matchesDepartment = departmentFilter === 'all' || 
      employee.unit?.id === departmentFilter || 
      employee.position?.id === departmentFilter;
    
    return matchesDepartment;
  });

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    loadEmployees();
  };

  // Atualizar status do funcionário
  const updateEmployeeStatus = async (employeeId: string, newStatus: string) => {
    try {
      await employeeService.updateEmployeeStatus(employeeId, newStatus);
      toast({
        title: "Sucesso",
        description: "Status do funcionário atualizado com sucesso.",
      });
      loadEmployeesWithFilters(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do funcionário.",
        variant: "destructive"
      });
    }
  };

  // Excluir funcionário
  const deleteEmployee = async (employeeId: string) => {
    // Encontrar o funcionário para verificar o status
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
      toast({
        title: "Erro",
        description: "Funcionário não encontrado.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se o funcionário pode ser excluído
    if (employee.status !== 'TERMINATED') {
      toast({
        title: "❌ Não é possível excluir",
        description: `Apenas funcionários com status "Demitido" podem ser excluídos. 
        
Status atual: ${getStatusText(employee.status)}

Para excluir este funcionário:
1. Clique no botão "Demitir" 
2. Confirme a alteração de status
3. Depois clique em "Excluir"`,
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`🗑️ Tem certeza que deseja excluir o funcionário "${employee.name}"?

⚠️ ATENÇÃO: Esta ação é irreversível e removerá permanentemente todos os dados do funcionário do sistema.

Status: ${getStatusText(employee.status)}
CPF: ${employee.cpf}

Confirma a exclusão?`)) {
      return;
    }

    try {
      await employeeService.deleteEmployee(employeeId);
      toast({
        title: "✅ Sucesso",
        description: `Funcionário "${employee.name}" foi excluído permanentemente do sistema.`,
      });
      loadEmployeesWithFilters(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao excluir funcionário:', err);
      toast({
        title: "❌ Erro na exclusão",
        description: "Não foi possível excluir o funcionário. Verifique se ele pode ser excluído ou se há dependências no sistema.",
        variant: "destructive"
      });
    }
  };

  // Alterar status do funcionário para TERMINATED
  const handleTerminateEmployee = async (employee: Employee) => {
    if (!confirm(`Tem certeza que deseja alterar o status do funcionário "${employee.name}" para "Demitido"?`)) {
      return;
    }

    try {
      await employeeService.updateEmployeeStatus(employee.id, 'TERMINATED');
      toast({
        title: "Sucesso",
        description: "Status do funcionário alterado para Demitido.",
      });
      loadEmployeesWithFilters(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao alterar status do funcionário:', err);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do funcionário.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-red-100 text-red-800';
      case 'VACATION': return 'bg-yellow-100 text-yellow-800';
      case 'MATERNITY_LEAVE': return 'bg-pink-100 text-pink-800';
      case 'MEDICAL_CERTIFICATE': return 'bg-blue-100 text-blue-800';
      case 'TERMINATED': return 'bg-gray-100 text-gray-800';
      case 'SUSPENDED': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Ativo';
      case 'INACTIVE': return 'Inativo';
      case 'VACATION': return 'Férias';
      case 'MATERNITY_LEAVE': return 'Licença Maternidade';
      case 'MEDICAL_CERTIFICATE': return 'Atestado';
      case 'TERMINATED': return 'Demitido';
      case 'SUSPENDED': return 'Suspenso';
      default: return 'Desconhecido';
    }
  };

  // Obter departamentos únicos
  const departments = Array.from(new Set(
    employees.map(emp => emp.unit?.id || emp.position?.id).filter(Boolean)
  ));

  const handleViewDocuments = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDocumentsModalOpen(true);
  };

  const handleCloseDocumentsModal = () => {
    setDocumentsModalOpen(false);
    setSelectedEmployee(null);
  };

  // Loading state
  if (loading && employees.length === 0) {
    return (
      <StandardLayout title="Funcionários" subtitle="Carregando...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-seguranca-red mb-4" />
            <p className="text-seguranca-lightgray">Carregando funcionários...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  // Error state
  if (error && employees.length === 0) {
    return (
      <StandardLayout title="Funcionários" subtitle="Erro ao carregar">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-4" />
            <p className="text-seguranca-lightgray mb-4">{error}</p>
            <Button 
              onClick={() => loadEmployees()}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout 
      title="Funcionários"
      subtitle={`${filteredEmployees.length} funcionário${filteredEmployees.length !== 1 ? 's' : ''} encontrado${filteredEmployees.length !== 1 ? 's' : ''}`}
    >
      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="lista">Lista de Funcionários</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="dependentes">Dependentes</TabsTrigger>
          <TabsTrigger value="treinamento">Controle de Treinamento</TabsTrigger>
          <TabsTrigger value="gerar">Gerar Documentos</TabsTrigger>
        </TabsList>
        <TabsContent value="dependentes">
          <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="text-seguranca-yellow" size={24} />
                Gerenciamento de Dependentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEmployee ? (
                <DependenteModal 
                  employeeId={selectedEmployee.id} 
                  employeeName={selectedEmployee.name}
                />
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">Selecione um funcionário</h3>
                  <p className="text-gray-400 mb-4">Selecione um funcionário na lista para gerenciar seus dependentes.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const tabsList = document.querySelector('[role="tablist"]');
                      const listaTab = tabsList?.querySelector('[value="lista"]');
                      if (listaTab) {
                        (listaTab as HTMLElement).click();
                      }
                    }}
                  >
                    Ir para Lista de Funcionários
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="lista">
          <div className="space-y-6">
            {/* Notificação sobre regras de exclusão */}
            <Card className="bg-blue-900/20 border-blue-600" data-aos={aos.fadeUp}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">ℹ️</span>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-semibold">Regras de Exclusão de Funcionários</h4>
                    <p className="text-blue-300 text-sm">
                      <strong>⚠️ Importante:</strong> Apenas funcionários com status "Demitido" podem ser excluídos do sistema. 
                      Para excluir um funcionário ativo, primeiro altere seu status para "Demitido" usando o botão "Demitir".
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dashboard RH Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div
                className="bg-seguranca-graphite rounded-xl p-4 sm:p-6 flex flex-col gap-2 shadow hover:shadow-lg transition cursor-pointer border border-gray-700 min-h-[120px]"
                data-aos={aos.fadeUp}
                onClick={() => {
                  setStatusFilter('ACTIVE');
                  toast({
                    title: "Filtro aplicado",
                    description: "Mostrando apenas funcionários ativos",
                  });
                }}
                tabIndex={0}
                role="button"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
                  setStatusFilter('ACTIVE');
                  toast({
                    title: "Filtro aplicado",
                    description: "Mostrando apenas funcionários ativos",
                  });
                }}}
                aria-label="Filtrar funcionários ativos"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <Users className="text-seguranca-yellow" size={24} />
                  <span className="text-base sm:text-lg font-bold text-seguranca-lightgray">Funcionários Ativos</span>
                </div>
                <span className="text-seguranca-lightgray text-xs sm:text-sm">Clique para filtrar apenas funcionários com status ativo</span>
              </div>
              <div 
                className="bg-seguranca-graphite rounded-xl p-4 sm:p-6 flex flex-col gap-2 shadow hover:shadow-lg transition cursor-pointer border border-gray-700 min-h-[120px]" 
                data-aos={aos.fadeUp} 
                data-aos-delay="100"
                onClick={() => {
                  setStatusFilter('TERMINATED');
                  toast({
                    title: "Filtro aplicado",
                    description: "Mostrando apenas funcionários demitidos",
                  });
                }}
                tabIndex={0}
                role="button"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
                  setStatusFilter('TERMINATED');
                  toast({
                    title: "Filtro aplicado",
                    description: "Mostrando apenas funcionários demitidos",
                  });
                }}}
                aria-label="Filtrar funcionários demitidos"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <Shuffle className="text-blue-400" size={24} />
                  <span className="text-base sm:text-lg font-bold text-seguranca-lightgray">Funcionários Demitidos</span>
                </div>
                <span className="text-seguranca-lightgray text-xs sm:text-sm">Clique para filtrar apenas funcionários demitidos</span>
              </div>
              <div 
                className="bg-seguranca-graphite rounded-xl p-4 sm:p-6 flex flex-col gap-2 shadow hover:shadow-lg transition cursor-pointer border border-gray-700 min-h-[120px]" 
                data-aos={aos.fadeUp} 
                data-aos-delay="200"
                onClick={() => {
                  setStatusFilter('VACATION');
                  toast({
                    title: "Filtro aplicado",
                    description: "Mostrando apenas funcionários de férias",
                  });
                }}
                tabIndex={0}
                role="button"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
                  setStatusFilter('VACATION');
                  toast({
                    title: "Filtro aplicado",
                    description: "Mostrando apenas funcionários de férias",
                  });
                }}}
                aria-label="Filtrar funcionários de férias"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <Calendar className="text-green-400" size={24} />
                  <span className="text-base sm:text-lg font-bold text-seguranca-lightgray">Funcionários de Férias</span>
                </div>
                <span className="text-seguranca-lightgray text-xs sm:text-sm">Clique para filtrar apenas funcionários de férias</span>
              </div>
              <div 
                className="bg-seguranca-graphite rounded-xl p-4 sm:p-6 flex flex-col gap-2 shadow hover:shadow-lg transition cursor-pointer border border-gray-700 min-h-[120px]" 
                data-aos={aos.fadeUp} 
                data-aos-delay="300"
                onClick={() => {
                  setStatusFilter('MEDICAL_CERTIFICATE');
                  toast({
                    title: "Filtro aplicado",
                    description: "Mostrando apenas funcionários com atestado",
                  });
                }}
                tabIndex={0}
                role="button"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
                  setStatusFilter('MEDICAL_CERTIFICATE');
                  toast({
                    title: "Filtro aplicado",
                    description: "Mostrando apenas funcionários com atestado",
                  });
                }}}
                aria-label="Filtrar funcionários com atestado"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <FileWarning className="text-purple-400" size={24} />
                  <span className="text-base sm:text-lg font-bold text-seguranca-lightgray">Funcionários com Atestado</span>
                </div>
                <span className="text-seguranca-lightgray text-xs sm:text-sm">Clique para filtrar apenas funcionários com atestado médico</span>
              </div>
              <div 
                className="bg-seguranca-graphite rounded-xl p-4 sm:p-6 flex flex-col gap-2 shadow hover:shadow-lg transition cursor-pointer border border-gray-700 min-h-[120px]" 
                data-aos={aos.fadeUp} 
                data-aos-delay="400"
                onClick={() => {
                  setStatusFilter('SUSPENDED');
                  toast({
                    title: "Filtro aplicado",
                    description: "Mostrando apenas funcionários suspensos",
                  });
                }}
                tabIndex={0}
                role="button"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
                  setStatusFilter('SUSPENDED');
                  toast({
                    title: "Filtro aplicado",
                    description: "Mostrando apenas funcionários suspensos",
                  });
                }}}
                aria-label="Filtrar funcionários suspensos"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <Award className="text-orange-400" size={24} />
                  <span className="text-base sm:text-lg font-bold text-seguranca-lightgray">Funcionários Suspensos</span>
                </div>
                <span className="text-seguranca-lightgray text-xs sm:text-sm">Clique para filtrar apenas funcionários suspensos</span>
              </div>
              <div 
                className="bg-seguranca-graphite rounded-xl p-4 sm:p-6 flex flex-col gap-2 shadow hover:shadow-lg transition cursor-pointer border border-gray-700 min-h-[120px]" 
                data-aos={aos.fadeUp} 
                data-aos-delay="500"
                onClick={() => {
                  setStatusFilter('all');
                  toast({
                    title: "Filtros limpos",
                    description: "Mostrando todos os funcionários",
                  });
                }}
                tabIndex={0}
                role="button"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
                  setStatusFilter('all');
                  toast({
                    title: "Filtros limpos",
                    description: "Mostrando todos os funcionários",
                  });
                }}}
                aria-label="Limpar filtros e mostrar todos os funcionários"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <Settings className="text-cyan-400" size={24} />
                  <span className="text-base sm:text-lg font-bold text-seguranca-lightgray">Todos os Funcionários</span>
                </div>
                <span className="text-seguranca-lightgray text-xs sm:text-sm">Clique para limpar filtros e mostrar todos os funcionários</span>
              </div>
            </div>

            {/* Filtros */}
            <Card className="bg-seguranca-graphite border-gray-600" data-aos={aos.fadeUp}>
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center justify-between">
                  Filtros
                  <Button 
                    className="bg-seguranca-red hover:bg-seguranca-darkred"
                    onClick={() => {
                      setRefreshing(true);
                      clearFilters();
                      setTimeout(() => setRefreshing(false), 1000);
                    }}
                    disabled={refreshing}
                  >
                    {refreshing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw size={20} className="mr-2" />
                    )}
                    {refreshing ? 'Atualizando...' : 'Limpar Filtros'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                      placeholder="Buscar funcionários..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-seguranca-black border border-gray-600 rounded-md px-3 py-2 text-seguranca-lightgray"
                  >
                    <option value="all">Todos os status</option>
                    <option value="ACTIVE">Ativo</option>
                    <option value="INACTIVE">Inativo</option>
                    <option value="VACATION">Férias</option>
                    <option value="MATERNITY_LEAVE">Licença Maternidade</option>
                    <option value="MEDICAL_CERTIFICATE">Atestado</option>
                    <option value="TERMINATED">Demitido</option>
                    <option value="SUSPENDED">Suspenso</option>
                  </select>
                  
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="bg-seguranca-black border border-gray-600 rounded-md px-3 py-2 text-seguranca-lightgray"
                  >
                    <option value="all">Todos os departamentos</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  
                  <Button 
                    className="bg-seguranca-yellow hover:bg-yellow-600 text-black sm:col-span-2 lg:col-span-1"
                    onClick={handleOpenModal}
                  >
                    <Plus size={20} className="mr-2" />
                    Novo Funcionário
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Funcionários */}
            <div className="grid gap-4">
              {filteredEmployees.map((employee, index) => (
                <Card 
                  key={employee.id} 
                  className="bg-seguranca-graphite border-gray-600 hover:shadow-lg transition-shadow"
                  data-aos={aos.fadeUp}
                  data-aos-delay={index * 100}
                >
                  <CardContent className="p-4">
                     <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 overflow-hidden">
                       {/* Seção Esquerda: Avatar, Nome e Cargo */}
                       <div className="flex items-center space-x-4 flex-shrink-0">
                         <div className="w-12 h-12 bg-seguranca-red rounded-full flex items-center justify-center">
                           <User className="text-white" size={24} />
                         </div>
                         <div>
                           <h3 className="text-lg font-semibold text-seguranca-lightgray">{employee.name}</h3>
                           <p className="text-seguranca-lightgray">Cargo: {employee.position?.name || 'Cargo não definido'}</p>
                         </div>
                       </div>

                       {/* Seção Central: Informações de Contato e Localização - ALINHADAS À ESQUERDA */}
                       <div className="flex flex-col space-y-2 flex-1 lg:ml-8 min-w-0">
                         <div className="flex items-center space-x-2 text-sm text-seguranca-lightgray">
                           <Mail size={16} className="w-5 flex-shrink-0" />
                           <span className="truncate">{employee.email || 'Email não informado'}</span>
                         </div>
                         <div className="flex items-center space-x-2 text-sm text-seguranca-lightgray">
                           <Phone size={16} className="w-5 flex-shrink-0" />
                           <span>{employee.phone || 'Telefone não informado'}</span>
                         </div>
                         <div className="flex items-center space-x-2 text-sm text-seguranca-lightgray">
                           <Building size={16} className="w-5 flex-shrink-0" />
                           <span>Unidade: {employee.unit?.name || 'Departamento não definido'}</span>
                         </div>
                         <div className="flex items-center space-x-2 text-sm text-seguranca-lightgray">
                           <MapPin size={16} className="w-5 flex-shrink-0" />
                           <span className="truncate">{typeof employee.address === 'string' ? employee.address : employee.address?.street || 'Endereço não informado'}</span>
                         </div>
                         <div className="flex items-center space-x-2 text-sm text-seguranca-lightgray">
                           <Calendar size={16} className="w-5 flex-shrink-0" />
                           <span>Admissão: {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('pt-BR') : 'Não informado'}</span>
                         </div>
                       </div>

                       {/* Seção Direita: Status e Botões de Ação */}
                       <div className="flex flex-col items-start gap-3 flex-shrink-0 min-w-0">
                         <Badge className={getStatusColor(employee.status)}>
                           {getStatusText(employee.status)}
                         </Badge>
                         <div className="flex flex-wrap gap-2 w-full">
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="border-blue-600 text-blue-400 hover:bg-blue-900"
                             onClick={() => handleViewDocuments(employee)}
                           >
                             <FileText size={16} className="mr-1" />
                             Documentos
                           </Button>
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="border-green-600 text-green-400 hover:bg-green-900"
                             onClick={() => {
                               setSelectedEmployee(employee);
                               const tabsList = document.querySelector('[role="tablist"]');
                               const dependentesTab = tabsList?.querySelector('[value="dependentes"]');
                               if (dependentesTab) {
                                 (dependentesTab as HTMLElement).click();
                               }
                             }}
                           >
                             <UserPlus size={16} className="mr-1" />
                             Dependentes
                           </Button>
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                             onClick={() => handleEditEmployee(employee)}
                           >
                             Editar
                           </Button>
                           {employee.status !== 'TERMINATED' && (
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="border-orange-600 text-orange-400 hover:bg-orange-900"
                               onClick={() => handleTerminateEmployee(employee)}
                               title="Alterar status para Demitido"
                             >
                               Demitir
                             </Button>
                           )}
                           {employee.status === 'TERMINATED' && (
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="border-red-600 text-red-400 hover:bg-red-900"
                               onClick={() => deleteEmployee(employee.id)}
                               title="Excluir funcionário (apenas para demitidos)"
                             >
                               Excluir
                             </Button>
                           )}
                         </div>
                       </div>
                     </div>

                     {/* Mensagem de Aviso para Funcionários Ativos */}
                     {employee.status !== 'TERMINATED' && (
                       <div className="mt-3 p-2 bg-orange-900/20 border border-orange-600/30 rounded-md">
                         <span className="text-xs text-orange-400 flex items-center">
                           ⚠️ Demitir primeiro para excluir
                         </span>
                       </div>
                     )}
                     {employee.status === 'TERMINATED' && (
                       <div className="mt-3 p-2 bg-green-900/20 border border-green-600/30 rounded-md">
                         <span className="text-xs text-green-400 flex items-center">
                           ✅ Pode ser excluído
                         </span>
                       </div>
                     )}
                   </CardContent>
                </Card>
              ))}
            </div>

            {filteredEmployees.length === 0 && !loading && (
              <Card className="bg-seguranca-graphite border-gray-600" data-aos={aos.fadeUp}>
                <CardContent className="p-8 text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">Nenhum funcionário encontrado</h3>
                  <p className="text-seguranca-lightgray">Tente ajustar os filtros de busca.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        <TabsContent value="documentos">
          <EmployeeDocumentsPanel />
        </TabsContent>
        <TabsContent value="treinamento">
          <EmployeeTrainingTab />
        </TabsContent>



        <TabsContent value="gerar">
          <DocumentosGerarTab />
        </TabsContent>
      </Tabs>

      {/* Modal de Documentos */}
      <Dialog open={documentsModalOpen} onOpenChange={handleCloseDocumentsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Documentos de {selectedEmployee?.name}</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <EmployeeDocuments 
              employeeId={selectedEmployee.id}
              employeeName={selectedEmployee.name}
            />
          )}
        </DialogContent>
      </Dialog>

      <FuncionarioNovoModal open={modalOpen} onClose={handleCloseModal} onCreated={loadEmployeesWithFilters} />
      
      {/* Modal de Edição de Funcionário */}
      <FuncionarioEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        funcionario={employeeToEdit}
        onSuccess={handleEmployeeEdited}
      />
    </StandardLayout>
  );
};

export default Funcionarios;
