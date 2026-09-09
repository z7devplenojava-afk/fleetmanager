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
  UserPlus,
  CheckCircle2,
  Clock,
  UserMinus,
  XCircle,
  ChevronRight,
  FileUp
} from 'lucide-react';
import { useGSAP } from '@/hooks/use-gsap';
import { useToast } from '@/hooks/use-toast';
import { employeeService, EmployeeFilters } from '@/services/employeeService';
import { Employee } from '@/types/employee';
import FuncionarioNovoModal from '@/components/funcionarios/FuncionarioNovoModal';
import { EmployeeDocuments } from '@/components/funcionarios/EmployeeDocuments';
import { useLocation, useNavigate } from 'react-router-dom';
import EmployeeTrainingTab from '@/components/funcionarios/EmployeeTrainingTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmployeeDocumentsPanel from '@/components/funcionarios/EmployeeDocumentsPanel';
import DocumentosGerarTab from '@/components/funcionarios/DocumentosGerarTab';
import { EmployeePdfImportModal } from '@/components/funcionarios/EmployeePdfImportModal';
import DependenteModal from '@/components/dependentes/DependenteModal';
import { FuncionariosTable } from '@/components/funcionarios/FuncionariosTable';
import ExcelImportModal from '@/components/funcionarios/ExcelImportModal';
import { FileSpreadsheet } from 'lucide-react';

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
  useGSAP();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const shouldOpenModal = params.get('novo') === '1';
  const shouldOpenExcelImport = params.get('importar') === 'excel';
  const tabFromUrl = params.get('tab') || 'lista';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [modalOpen, setModalOpen] = useState(shouldOpenModal);
  const [excelImportModalOpen, setExcelImportModalOpen] = useState(shouldOpenExcelImport);
  const [pdfImportModalOpen, setPdfImportModalOpen] = useState(false);
  const [dependentSearchTerm, setDependentSearchTerm] = useState('');
  
  // Atualizar aba quando mudar na URL
  useEffect(() => {
    const tab = params.get('tab') || 'lista';
    setActiveTab(tab);
  }, [location.search]);

  // Carregar funcionários
  const loadEmployees = async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [Funcionarios] Carregando funcionários com searchTerm:', search);
      const data = await employeeService.getAllEmployees(search);
      console.log('🔍 [Funcionarios] Funcionários recebidos:', data.length);
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
    const term = searchTerm?.trim() || undefined;
    console.log('🔍 [Funcionarios] loadEmployeesWithFilters chamado com searchTerm:', term);
    await loadEmployees(term);
  };

  // Carregar funcionários iniciais
  useEffect(() => {
    loadEmployees();
  }, []);

  // Aplicar busca com debounce
  useEffect(() => {
    // Se o searchTerm estiver vazio, recarregar todos os funcionários
    if (!searchTerm || searchTerm.trim() === '') {
      const timeoutId = setTimeout(() => {
        if (!loading) {
          loadEmployees();
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    }
    
    // Se houver searchTerm, buscar apenas os resultados filtrados
    const timeoutId = setTimeout(() => {
      if (!loading) {
        loadEmployeesWithFilters();
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    if (shouldOpenModal) setModalOpen(true);
  }, [shouldOpenModal]);

  useEffect(() => {
    if (shouldOpenExcelImport) setExcelImportModalOpen(true);
  }, [shouldOpenExcelImport]);

  const handleOpenModal = () => {
    // Fechar modal de edição se estiver aberto
    if (editModalOpen) {
      setEditModalOpen(false);
      setEmployeeToEdit(null);
    }
    setModalOpen(true);
    navigate('/rh/funcionarios?novo=1', { replace: true });
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    if (shouldOpenModal) navigate('/rh/funcionarios', { replace: true });
  };

  // Abrir modal de edição
  const handleEditEmployee = async (employee: Employee) => {
    console.log('🔍 handleEditEmployee chamado com:', employee);
    console.log('🔍 Estado atual editModalOpen:', editModalOpen);
    console.log('🔍 Estado atual employeeToEdit:', employeeToEdit);
    console.log('🔍 Estado atual modalOpen:', modalOpen);
    
    try {
      // Fechar modal de criação se estiver aberto (primeiro, antes de tudo)
      if (modalOpen) {
        setModalOpen(false);
        // Limpar parâmetro da URL se existir
        if (shouldOpenModal) {
          navigate('/rh/funcionarios', { replace: true });
        }
      }
      
      // Garantir que editModalOpen está false antes de buscar dados
      setEditModalOpen(false);
      setEmployeeToEdit(null);
      
      // Buscar dados completos do funcionário do backend
      console.log('🔍 Buscando dados completos do funcionário:', employee.id);
      const fullEmployeeData = await employeeService.getEmployeeById(employee.id);
      console.log('🔍 Dados completos recebidos:', fullEmployeeData);
      
      // Verificar se os dados foram recebidos corretamente
      if (!fullEmployeeData || !fullEmployeeData.id) {
        throw new Error('Dados do funcionário não foram retornados corretamente');
      }
      
      // Definir dados primeiro, depois abrir modal
      // IMPORTANTE: Garantir que modalOpen está false antes de abrir editModalOpen
      setModalOpen(false);
      setEmployeeToEdit(fullEmployeeData);
      setEditModalOpen(true);
      
      console.log('🔍 Estado após setEditModalOpen:', true);
      
      console.log('🔍 Estado após setEmployeeToEdit:', fullEmployeeData);
    } catch (error) {
      console.error('❌ Erro ao buscar dados do funcionário:', error);
      toast({
        title: 'Erro ao carregar dados do funcionário',
        description: 'Não foi possível carregar os dados completos do funcionário. Tente novamente.',
        variant: 'destructive',
      });
      // Garantir que os estados estão limpos em caso de erro
      setEditModalOpen(false);
      setEmployeeToEdit(null);
      setModalOpen(false);
    }
  };

  // Fechar modal de edição
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEmployeeToEdit(null);
  };

  // Funcionário editado com sucesso
  const handleEmployeeEdited = () => {
    loadEmployeesWithFilters(); // Recarregar lista
  };

  // Filtrar funcionários por departamento, status e busca (filtro local)
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const searchDigits = searchTerm.replace(/\D/g, '');
  const filteredEmployees = employees.filter(employee => {
    const matchesDepartment = departmentFilter === 'all' || 
      employee.unit?.id === departmentFilter || 
      employee.position?.id === departmentFilter;
    
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;

    const matchesSearch = !normalizedSearch || (() => {
      const nameMatch = (employee.name || '').toLowerCase().includes(normalizedSearch);
      const emailMatch = (employee.email || '').toLowerCase().includes(normalizedSearch);
      const registrationMatch = (employee.registrationNumber || '').toLowerCase().includes(normalizedSearch);
      const documentDigits = (employee.document || employee.cpf || '').replace(/\D/g, '');
      const cpfMatch = searchDigits
        ? documentDigits.includes(searchDigits)
        : (employee.document || employee.cpf || '').toLowerCase().includes(normalizedSearch);

      return nameMatch || emailMatch || registrationMatch || cpfMatch;
    })();
    
    return matchesDepartment && matchesStatus && matchesSearch;
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

  // Calculate statistics
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'ACTIVE').length,
    vacation: employees.filter(e => e.status === 'VACATION').length,
    medicalCertificate: employees.filter(e => e.status === 'MEDICAL_CERTIFICATE').length,
    terminated: employees.filter(e => e.status === 'TERMINATED').length,
    suspended: employees.filter(e => e.status === 'SUSPENDED').length,
  };

  return (
    <StandardLayout 
      title="Gestão de Funcionários"
      subtitle={`${filteredEmployees.length} funcionário${filteredEmployees.length !== 1 ? 's' : ''} no sistema`}
    >
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        navigate(`/rh/funcionarios?tab=${value}`, { replace: true });
      }} className="w-full">
        <TabsList className="mb-4 bg-seguranca-black/50 border border-gray-600/30 p-1 flex-wrap h-auto justify-start">
          <TabsTrigger value="lista" className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white flex-grow sm:flex-grow-0">
            <Users className="h-4 w-4 mr-2" />
            Lista de Funcionários
          </TabsTrigger>
          <TabsTrigger value="documentos" className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="dependentes" className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white">
            <UserPlus className="h-4 w-4 mr-2" />
            Dependentes
          </TabsTrigger>
          <TabsTrigger value="treinamento" className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white">
            <Award className="h-4 w-4 mr-2" />
            Treinamento
          </TabsTrigger>
          <TabsTrigger value="gerar" className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Gerar Documentos
          </TabsTrigger>
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
                <div>
                  <div className="mb-4 flex items-center justify-between bg-seguranca-black/30 p-3 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-seguranca-yellow/20 flex items-center justify-center text-seguranca-yellow font-bold">
                        {selectedEmployee.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{selectedEmployee.name}</p>
                        <p className="text-xs text-gray-400">{selectedEmployee.position?.name || 'Cargo não definido'}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedEmployee(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      Trocar Funcionário
                    </Button>
                  </div>
                  
                  <DependenteModal 
                    employeeId={selectedEmployee.id} 
                    employeeName={selectedEmployee.name}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 space-y-6">
                  <div className="text-center max-w-lg">
                    <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">Selecione um funcionário</h3>
                    <p className="text-gray-400 mb-6">Selecione um funcionário abaixo para gerenciar seus dependentes.</p>
                    
                    <div className="w-full max-w-md mx-auto space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                          placeholder="Buscar por nome ou CPF..."
                          value={dependentSearchTerm}
                          onChange={(e) => setDependentSearchTerm(e.target.value)}
                          className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray focus-visible:ring-seguranca-yellow"
                        />
                      </div>

                      <div className="bg-seguranca-black/30 border border-gray-700 rounded-md max-h-80 overflow-y-auto text-left">
                        {employees
                          .filter(emp => 
                            !dependentSearchTerm || 
                            ((emp.name || '').toLowerCase().includes(dependentSearchTerm.toLowerCase())) ||
                            (emp.document && emp.document.includes(dependentSearchTerm))
                          )
                          .map(emp => (
                            <div 
                              key={emp.id}
                              className="p-3 hover:bg-gray-700 cursor-pointer flex items-center justify-between border-b border-gray-700/50 last:border-0 transition-colors group"
                              onClick={() => setSelectedEmployee(emp)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gray-700 group-hover:bg-gray-600 flex items-center justify-center text-gray-300 text-xs font-bold transition-colors">
                                  {(emp.name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-200 text-sm">{emp.name || 'Funcionário sem nome'}</p>
                                  <p className="text-xs text-gray-400">{emp.position?.name || 'Sem cargo'} • {emp.document || 'S/ CPF'}</p>
                                </div>
                              </div>
                              <ChevronRight size={16} className="text-gray-500 group-hover:text-seguranca-yellow transition-colors" />
                            </div>
                          ))}
                          
                        {employees.filter(emp => !dependentSearchTerm || ((emp.name || '').toLowerCase().includes(dependentSearchTerm.toLowerCase()))).length === 0 && (
                          <div className="p-8 text-center text-gray-500">
                            <p>Nenhum funcionário encontrado.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-700/50 w-full max-w-md text-center">
                    <Button 
                      variant="link" 
                      className="text-gray-400 hover:text-seguranca-yellow"
                      onClick={() => {
                        const tabsList = document.querySelector('[role="tablist"]');
                        const listaTab = tabsList?.querySelector('[value="lista"]');
                        if (listaTab) {
                          (listaTab as HTMLElement).click();
                        }
                      }}
                    >
                      Ver lista completa de funcionários
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="lista">
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-animate="fadeDown">
              <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 hover:border-blue-500/50 transition-all duration-300 group">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Total de Funcionários</p>
                      <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30 group-hover:bg-blue-500/30 transition-colors">
                      <Users className="h-6 w-6 text-blue-400" />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 hover:border-green-500/50 transition-all duration-300 group">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Funcionários Ativos</p>
                      <p className="text-3xl font-bold text-green-400 mt-2">{stats.active}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30 group-hover:bg-green-500/30 transition-colors">
                      <CheckCircle2 className="h-6 w-6 text-green-400" />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 hover:border-purple-500/50 transition-all duration-300 group">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Em Férias / Atestado</p>
                      <p className="text-3xl font-bold text-purple-400 mt-2">{stats.vacation + stats.medicalCertificate}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30 group-hover:bg-purple-500/30 transition-colors">
                      <Clock className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 hover:border-red-500/50 transition-all duration-300 group">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Demitidos / Suspensos</p>
                      <p className="text-3xl font-bold text-red-400 mt-2">{stats.terminated + stats.suspended}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 group-hover:bg-red-500/30 transition-colors">
                      <AlertCircle className="h-6 w-6 text-red-400" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-animate="fadeDown">
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setRefreshing(true);
                    loadEmployees();
                    setTimeout(() => setRefreshing(false), 1000);
                  }}
                  disabled={refreshing}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:border-seguranca-red/50"
                >
                  <RefreshCw size={20} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  className="border-blue-600/50 text-blue-400 hover:bg-blue-900/20"
                  onClick={() => setExcelImportModalOpen(true)}
                >
                  <FileSpreadsheet size={20} className="mr-2" />
                  Importar Excel
                </Button>
                <Button
                  variant="outline"
                  className="border-red-600/50 text-red-400 hover:bg-red-900/20"
                  onClick={() => setPdfImportModalOpen(true)}
                >
                  <FileUp size={20} className="mr-2" />
                  Importar Ficha PDF
                </Button>
                <Button
                  className="bg-gradient-to-r from-seguranca-red to-seguranca-darkred hover:from-seguranca-darkred hover:to-seguranca-red shadow-lg shadow-seguranca-red/20"
                  onClick={handleOpenModal}
                >
                  <Plus size={20} className="mr-2" />
                  Novo Funcionário
                </Button>
              </div>
            </div>

            {/* Notificação sobre regras de exclusão */}
            <Card className="bg-blue-900/20 border-blue-600/50" data-animate="fadeUp">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-blue-400 font-semibold">Regras de Exclusão de Funcionários</h4>
                    <p className="text-blue-300 text-sm mt-1">
                      <strong>⚠️ Importante:</strong> Apenas funcionários com status "Demitido" podem ser excluídos do sistema. 
                      Para excluir um funcionário ativo, primeiro altere seu status para "Demitido" usando o botão "Demitir".
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Filtros Modernos */}
            <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 p-6" data-animate="fadeUp">
              {/* Search Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-seguranca-red/20 border border-seguranca-red/30">
                    <Search className="h-5 w-5 text-seguranca-red" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Pesquisar Funcionários</h3>
                    <p className="text-sm text-gray-400">Filtre e encontre funcionários rapidamente</p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRefreshing(true);
                    clearFilters();
                    setTimeout(() => setRefreshing(false), 1000);
                  }}
                  disabled={refreshing}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite"
                >
                  {refreshing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw size={16} className="mr-2" />
                  )}
                  Limpar
                </Button>
              </div>

              {/* Search Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    placeholder="Digite o nome, CPF ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 bg-seguranca-black/70 border-gray-600 text-seguranca-lightgray placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow/20"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-11 bg-seguranca-black/70 border border-gray-600 rounded-md px-3 py-2 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow/20 outline-none"
                >
                  <option value="all">📋 Todos os status</option>
                  <option value="ACTIVE">✅ Ativo</option>
                  <option value="INACTIVE">⭕ Inativo</option>
                  <option value="VACATION">🏖️ Férias</option>
                  <option value="MATERNITY_LEAVE">👶 Licença Maternidade</option>
                  <option value="MEDICAL_CERTIFICATE">🏥 Atestado</option>
                  <option value="TERMINATED">❌ Demitido</option>
                  <option value="SUSPENDED">⏸️ Suspenso</option>
                </select>
                
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="h-11 bg-seguranca-black/70 border border-gray-600 rounded-md px-3 py-2 text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow/20 outline-none"
                >
                  <option value="all">🏢 Todos os departamentos</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </Card>

            {/* Lista de Funcionários Moderna */}
            <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 p-6" data-animate="fadeUp">
              <FuncionariosTable
                employees={filteredEmployees}
                onEdit={handleEditEmployee}
                onDelete={deleteEmployee}
                onTerminate={handleTerminateEmployee}
                onViewDocuments={handleViewDocuments}
                onViewDependents={(employee) => {
                  setSelectedEmployee(employee);
                  const tabsList = document.querySelector('[role="tablist"]');
                  const dependentesTab = tabsList?.querySelector('[value="dependentes"]');
                  if (dependentesTab) {
                    (dependentesTab as HTMLElement).click();
                  }
                }}
                isLoading={loading}
              />
            </Card>
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

      {/* Modal de Importação Excel */}
      <ExcelImportModal
        open={excelImportModalOpen}
        onOpenChange={(open) => {
          setExcelImportModalOpen(open);
          if (!open && shouldOpenExcelImport) {
            navigate('/rh/funcionarios', { replace: true });
          }
        }}
        onSuccess={() => {
          loadEmployeesWithFilters();
          setExcelImportModalOpen(false);
          if (shouldOpenExcelImport) {
            navigate('/rh/funcionarios', { replace: true });
          }
        }}
      />

      <EmployeePdfImportModal
        isOpen={pdfImportModalOpen}
        onClose={() => setPdfImportModalOpen(false)}
        onSuccess={() => {
          loadEmployeesWithFilters();
        }}
      />

      {/* Modal de Criação/Edição de Funcionário */}
      {/* 
        Prioridade: Se editModalOpen estiver true E employeeToEdit existir, abre em modo EDICIÃO
        Caso contrário, abre em modo CRIAÇÃO se modalOpen estiver true
      */}
      <FuncionarioNovoModal
        open={(editModalOpen && !!employeeToEdit) || modalOpen}
        onClose={() => {
          // Se estiver em modo de edição, usar handleCloseEditModal
          if (editModalOpen && employeeToEdit) {
            handleCloseEditModal();
          } else {
            // Caso contrário, usar handleCloseModal (modo criação)
            handleCloseModal();
          }
        }}
        onCreated={() => {
          // Se estiver em modo de edição, usar handleEmployeeEdited
          if (editModalOpen && employeeToEdit) {
            handleEmployeeEdited();
          } else {
            // Caso contrário, apenas recarregar (sem fechar o modal)
            loadEmployeesWithFilters();
          }
        }}
        employeeToEdit={editModalOpen && employeeToEdit ? employeeToEdit : null}
      />
    </StandardLayout>
  );
};

export default Funcionarios;
