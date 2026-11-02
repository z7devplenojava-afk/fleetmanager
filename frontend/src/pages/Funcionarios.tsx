import React, { useState, useEffect, useMemo } from 'react';
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
  FileUp,
  BarChart3,
  LogIn,
  LogOut,
  X
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
import { FuncionariosTable, getEmployeeTerminationDate } from '@/components/funcionarios/FuncionariosTable';
import { EmployeeViewModal } from '@/components/funcionarios/EmployeeViewModal';
import { EmployeeCrachaModal } from '@/components/funcionarios/EmployeeCrachaModal';
import ExcelImportModal from '@/components/funcionarios/ExcelImportModal';
import { FileSpreadsheet } from 'lucide-react';
import { workPostService, WorkPost } from '@/services/workPostService';
import { clientService, Client } from '@/services/clientService';
import { garageService, Garage } from '@/services/garageService';
import { exportToPDF, exportToXLSX } from '@/utils/exportUtils';

const Funcionarios: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE' | 'VACATION' | 'MATERNITY_LEAVE' | 'MEDICAL_CERTIFICATE' | 'TERMINATED' | 'SUSPENDED'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [workPostFilter, setWorkPostFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [garageFilter, setGarageFilter] = useState<string>('all');
  const [hireStart, setHireStart] = useState('');
  const [hireEnd, setHireEnd] = useState('');
  const [termStart, setTermStart] = useState('');
  const [termEnd, setTermEnd] = useState('');
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [employeeToView, setEmployeeToView] = useState<Employee | null>(null);
  const [crachaModalOpen, setCrachaModalOpen] = useState(false);
  const [employeeToCracha, setEmployeeToCracha] = useState<Employee | null>(null);

  const handleViewEmployee = (employee: Employee) => {
    setEmployeeToView(employee);
    setViewModalOpen(true);
  };

  const handleOpenCracha = (employee: Employee) => {
    setEmployeeToCracha(employee);
    setCrachaModalOpen(true);
  };
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

  // Carregar funcionários iniciais + dados auxiliares dos filtros
  useEffect(() => {
    loadEmployees();
    Promise.allSettled([
      workPostService.getAllWorkPosts(),
      clientService.getClientsForSelect(),
      garageService.list()
    ]).then(([wpRes, clRes, garRes]) => {
      if (wpRes.status === 'fulfilled') setWorkPosts(wpRes.value);
      if (clRes.status === 'fulfilled') setClients(clRes.value);
      if (garRes.status === 'fulfilled') setGarages(garRes.value);
    });
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
      let fullEmployeeData: Employee | null = null;
      try {
        fullEmployeeData = await employeeService.getEmployeeById(employee.id);
      } catch {
        // silencioso — fallback abaixo
      }
      console.log('🔍 Dados completos recebidos:', fullEmployeeData);

      // Fallback: se a API não retornou dados (ex: IDs de seed), usar o objeto local
      if (!fullEmployeeData || !fullEmployeeData.id) {
        console.warn('⚠️ getEmployeeById retornou null — usando dados locais do funcionário');
        fullEmployeeData = employee;
      }

      // Definir dados primeiro, depois abrir modal
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

  // Mapa workPostId -> clientId para filtro de cliente
  const workPostClientMap = useMemo(() => {
    const map = new Map<string, string>();
    workPosts.forEach(wp => {
      if (wp.id && wp.clientId) map.set(wp.id, wp.clientId);
    });
    return map;
  }, [workPosts]);

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach(c => map.set(c.id, c.name));
    return map;
  }, [clients]);

  // Conjunto de funcionários responsáveis por garagem
  const employeeGarageIds = useMemo(() => {
    const map = new Map<string, string>();
    garages.forEach(g => {
      if (g.responsibleEmployeeId) map.set(g.responsibleEmployeeId, g.id);
    });
    return map;
  }, [garages]);

  // Filtrar funcionários (filtros locais combinados)
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const searchDigits = searchTerm.replace(/\D/g, '');
  const filteredEmployees = employees.filter(employee => {
    const matchesDepartment = departmentFilter === 'all' || 
      employee.department?.id === departmentFilter ||
      employee.unit?.id === departmentFilter || 
      employee.position?.id === departmentFilter;
    
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;

    const matchesWorkPost = workPostFilter === 'all' ||
      employee.workPost?.id === workPostFilter ||
      employee.department?.id === workPostFilter;

    const matchesClient = clientFilter === 'all' || (() => {
      const wpClientId = employee.workPost?.id
        ? workPostClientMap.get(employee.workPost.id)
        : undefined;
      return wpClientId === clientFilter;
    })();

    const matchesGarage = garageFilter === 'all' ||
      employeeGarageIds.get(employee.id) === garageFilter;

    const hireDate = employee.hireDate || '';
    const terminationDate = getEmployeeTerminationDate(employee) || '';
    const matchesHireStart = !hireStart || (hireDate && hireDate >= hireStart);
    const matchesHireEnd = !hireEnd || (hireDate && hireDate <= hireEnd);
    const matchesTermStart = !termStart || (terminationDate && terminationDate >= termStart);
    const matchesTermEnd = !termEnd || (terminationDate && terminationDate <= termEnd);

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
    
    return matchesDepartment && matchesStatus && matchesSearch &&
      matchesWorkPost && matchesClient && matchesGarage &&
      matchesHireStart && matchesHireEnd && matchesTermStart && matchesTermEnd;
  });

  const activeFiltersCount = useMemo(() => {
    return [
      searchTerm.trim() !== '',
      statusFilter !== 'all',
      departmentFilter !== 'all',
      workPostFilter !== 'all',
      clientFilter !== 'all',
      garageFilter !== 'all',
      Boolean(hireStart || hireEnd),
      Boolean(termStart || termEnd),
    ].filter(Boolean).length;
  }, [searchTerm, statusFilter, departmentFilter, workPostFilter, clientFilter, garageFilter, hireStart, hireEnd, termStart, termEnd]);

  // Departamentos/setores únicos com rótulo legível
  const departments = useMemo(() => {
    const byId = new Map<string, string>();
    employees.forEach(emp => {
      const entries: Array<[string | undefined, string | undefined]> = [
        [emp.department?.id, emp.department?.name],
        [emp.unit?.id, emp.unit?.name],
        [emp.position?.id, emp.position?.name],
      ];
      entries.forEach(([id, name]) => {
        if (id && !byId.has(id)) byId.set(id, name || id);
      });
    });
    return Array.from(byId.entries()).map(([id, label]) => ({ id, label }));
  }, [employees]);

  // Última admissão e última demissão
  const lastAdmission = useMemo(() => {
    const withHire = employees.filter(e => e.hireDate);
    if (!withHire.length) return null;
    return [...withHire].sort((a, b) => (b.hireDate || '').localeCompare(a.hireDate || ''))[0];
  }, [employees]);

  const lastDismissal = useMemo(() => {
    const withTerm = employees.filter(e => getEmployeeTerminationDate(e));
    if (!withTerm.length) return null;
    return [...withTerm].sort((a, b) =>
      ((getEmployeeTerminationDate(b) || '')).localeCompare(getEmployeeTerminationDate(a) || '')
    )[0];
  }, [employees]);

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setWorkPostFilter('all');
    setClientFilter('all');
    setGarageFilter('all');
    setHireStart('');
    setHireEnd('');
    setTermStart('');
    setTermEnd('');
    loadEmployees();
  };

  // Relatório completo (Excel + PDF) da lista filtrada
  const handleFullReport = async () => {
    if (!filteredEmployees.length) {
      toast({
        title: 'Nenhum funcionário',
        description: 'Não há funcionários para exportar com os filtros atuais.',
        variant: 'destructive',
      });
      return;
    }
    setExporting(true);
    try {
      const rows = filteredEmployees.map(emp => ({
        Nome: emp.name || '',
        CPF: emp.cpf || emp.document || '',
        Matricula: emp.registrationNumber || '',
        Cargo: emp.position?.name || '',
        Setor: emp.department?.name || emp.workPost?.name || '',
        Empresa: emp.company?.name || '',
        Posto: emp.workPost?.name || '',
        Status: emp.status || '',
        Admissao: emp.hireDate || '',
        Demissao: getEmployeeTerminationDate(emp) || '',
        Genero: emp.gender || emp.sexo || '',
        Salario: emp.salario ?? '',
        Email: emp.email || '',
        Telefone: emp.phone || '',
      }));
      const stamp = new Date().toISOString().slice(0, 10);
      const filename = `relatorio-completo-funcionarios-${stamp}`;
      await Promise.all([
        exportToXLSX(rows, filename, 'Relatório Completo de Funcionários'),
        exportToPDF(rows, filename, 'Relatório Completo de Funcionários'),
      ]);
      toast({
        title: 'Relatório gerado',
        description: `Excel e PDF exportados com ${rows.length} funcionário(s).`,
      });
    } catch (err) {
      console.error('Erro ao gerar relatório completo:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o relatório completo.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
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

  // Obter departamentos únicos (rótulos legíveis — removido; use `departments` derivado acima)

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
    <StandardLayout>
      <div className="space-y-4">
        {/* ── HEADER DA PÁGINA (TÍTULO + REGRAS DE EXCLUSÃO COMPACTAS) ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Gestão de Funcionários
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {filteredEmployees.length} funcionário{filteredEmployees.length !== 1 ? 's' : ''} no sistema
            </p>
          </div>

          {/* Card Compacto: Regras de Exclusão de Funcionários */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-300 shadow-sm max-w-xl">
            <AlertCircle className="h-4 w-4 text-blue-400 shrink-0" />
            <span className="leading-snug">
              <strong className="text-blue-200">Regras de Exclusão:</strong> Apenas funcionários com status <span className="text-amber-300 font-semibold">"Demitido"</span> podem ser excluídos do sistema.
            </span>
          </div>
        </div>

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
          <div className="space-y-4">
            {/* ── BARRA SUPERIOR DE AÇÕES (TODOS OS BOTÕES NO TOPO) ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-seguranca-graphite/80 via-seguranca-black to-seguranca-graphite/80 border border-gray-700/60 rounded-xl p-3 shadow-md" data-animate="fadeDown">
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setRefreshing(true);
                    loadEmployees();
                    setTimeout(() => setRefreshing(false), 1000);
                  }}
                  disabled={refreshing}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite text-xs h-9"
                >
                  <RefreshCw size={15} className={`mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-600/50 text-blue-400 hover:bg-blue-900/20 text-xs h-9"
                  onClick={() => setExcelImportModalOpen(true)}
                >
                  <FileSpreadsheet size={15} className="mr-1.5" />
                  Importar Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-600/50 text-red-400 hover:bg-red-900/20 text-xs h-9"
                  onClick={() => setPdfImportModalOpen(true)}
                >
                  <FileUp size={15} className="mr-1.5" />
                  Importar Ficha PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-seguranca-yellow/50 text-seguranca-yellow hover:bg-seguranca-yellow/10 text-xs h-9"
                  onClick={handleFullReport}
                  disabled={exporting || !filteredEmployees.length}
                >
                  {exporting ? (
                    <Loader2 size={15} className="mr-1.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet size={15} className="mr-1.5" />
                  )}
                  Relatório Completo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-500/50 text-seguranca-lightgray hover:bg-seguranca-graphite text-xs h-9"
                  onClick={() => navigate('/rh/relatorios/funcionarios')}
                >
                  <BarChart3 size={15} className="mr-1.5" />
                  Relatórios
                </Button>
              </div>

              <Button
                size="sm"
                className="bg-gradient-to-r from-seguranca-red to-seguranca-darkred hover:from-seguranca-darkred hover:to-seguranca-red text-white font-semibold text-xs h-9 shadow-lg shadow-seguranca-red/20 px-4"
                onClick={handleOpenModal}
              >
                <Plus size={16} className="mr-1.5" />
                Novo Funcionário
              </Button>
            </div>

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

            {/* ── BARRA COMPACTA: ÚLTIMA ADMISSÃO & ÚLTIMA DEMISSÃO (ESTILO IMAGEM 3) ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-r from-seguranca-graphite/60 via-seguranca-black to-seguranca-graphite/60 border border-gray-700/50 rounded-xl text-xs shadow-sm" data-animate="fadeDown">
              <div className="flex items-center gap-2 text-gray-300">
                <div className="p-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shrink-0">
                  <LogIn className="h-3.5 w-3.5" />
                </div>
                <span className="text-gray-400">Última admissão no cadastro:</span>
                <strong className="text-emerald-400 font-semibold">{lastAdmission?.name || '—'}</strong>
                {lastAdmission?.hireDate && (
                  <span className="text-gray-400 font-medium">· {new Date(lastAdmission.hireDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <div className="p-1 rounded-md bg-orange-500/20 border border-orange-500/30 text-orange-400 shrink-0">
                  <LogOut className="h-3.5 w-3.5" />
                </div>
                <span className="text-gray-400">Última demissão no cadastro:</span>
                <strong className="text-orange-400 font-semibold">{lastDismissal?.name || '—'}</strong>
                {lastDismissal && getEmployeeTerminationDate(lastDismissal) && (
                  <span className="text-gray-400 font-medium">· {new Date((getEmployeeTerminationDate(lastDismissal) as string) + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                )}
              </div>
            </div>


            {/* Filtros Modernos */}
            <Card className="bg-gradient-to-br from-seguranca-graphite/90 via-seguranca-black/95 to-seguranca-graphite/90 border border-gray-700/60 p-5 rounded-2xl shadow-xl shadow-black/20" data-animate="fadeUp">
              {/* Header do Card */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-seguranca-red/15 border border-seguranca-red/30 text-seguranca-red shadow-sm">
                    <Search className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-sm tracking-tight">Pesquisar Funcionários</h3>
                      {activeFiltersCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-seguranca-red/20 border border-seguranca-red/40 text-seguranca-red">
                          {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro ativo' : 'filtros ativos'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      Mostrando <span className="text-white font-medium">{filteredEmployees.length}</span> de <span className="text-white font-medium">{employees.length}</span> funcionários
                    </p>
                  </div>
                </div>

                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRefreshing(true);
                    clearFilters();
                    setTimeout(() => setRefreshing(false), 800);
                  }}
                  disabled={refreshing}
                  className={`text-xs h-8 px-3 rounded-lg transition-all ${
                    activeFiltersCount > 0
                      ? 'border-seguranca-red/50 text-seguranca-red hover:bg-seguranca-red/10'
                      : 'border-gray-700 text-gray-400 hover:text-white hover:bg-seguranca-graphite'
                  }`}
                >
                  {refreshing ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw size={13} className="mr-1.5" />
                  )}
                  {activeFiltersCount > 0 ? `Limpar (${activeFiltersCount})` : 'Limpar'}
                </Button>
              </div>

              {/* Grid de Filtros: 2 linhas perfeitas de 4 colunas em desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Busca por texto */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                  <Input
                    placeholder="Digite o nome, CPF ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-7 h-10 text-xs bg-seguranca-black/70 border-gray-700/80 hover:border-gray-600 text-seguranca-lightgray placeholder:text-gray-500 focus:border-seguranca-red/50 focus:ring-1 focus:ring-seguranca-red/20 rounded-lg transition-colors"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5 rounded transition-colors"
                      title="Limpar busca"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                
                {/* 2. Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className={`h-10 text-xs rounded-lg px-3 outline-none transition-colors cursor-pointer ${
                    statusFilter !== 'all'
                      ? 'bg-blue-950/30 border border-blue-500/50 text-blue-200'
                      : 'bg-seguranca-black/70 border border-gray-700/80 hover:border-gray-600 text-seguranca-lightgray focus:border-seguranca-red/50 focus:ring-1 focus:ring-seguranca-red/20'
                  }`}
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
                
                {/* 3. Departamento */}
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className={`h-10 text-xs rounded-lg px-3 outline-none transition-colors cursor-pointer ${
                    departmentFilter !== 'all'
                      ? 'bg-blue-950/30 border border-blue-500/50 text-blue-200'
                      : 'bg-seguranca-black/70 border border-gray-700/80 hover:border-gray-600 text-seguranca-lightgray focus:border-seguranca-red/50 focus:ring-1 focus:ring-seguranca-red/20'
                  }`}
                >
                  <option value="all">🏢 Todos os departamentos</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.label}</option>
                  ))}
                </select>

                {/* 4. Obra / Setor */}
                <select
                  value={workPostFilter}
                  onChange={(e) => setWorkPostFilter(e.target.value)}
                  className={`h-10 text-xs rounded-lg px-3 outline-none transition-colors cursor-pointer ${
                    workPostFilter !== 'all'
                      ? 'bg-blue-950/30 border border-blue-500/50 text-blue-200'
                      : 'bg-seguranca-black/70 border border-gray-700/80 hover:border-gray-600 text-seguranca-lightgray focus:border-seguranca-red/50 focus:ring-1 focus:ring-seguranca-red/20'
                  }`}
                >
                  <option value="all">📍 Obra / Setor (posto)</option>
                  {workPosts.map(wp => (
                    <option key={wp.id} value={wp.id}>{wp.name}</option>
                  ))}
                </select>

                {/* 5. Clientes */}
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className={`h-10 text-xs rounded-lg px-3 outline-none transition-colors cursor-pointer ${
                    clientFilter !== 'all'
                      ? 'bg-blue-950/30 border border-blue-500/50 text-blue-200'
                      : 'bg-seguranca-black/70 border border-gray-700/80 hover:border-gray-600 text-seguranca-lightgray focus:border-seguranca-red/50 focus:ring-1 focus:ring-seguranca-red/20'
                  }`}
                >
                  <option value="all">👥 Todos os clientes</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {/* 6. Garagens */}
                <select
                  value={garageFilter}
                  onChange={(e) => setGarageFilter(e.target.value)}
                  className={`h-10 text-xs rounded-lg px-3 outline-none transition-colors cursor-pointer ${
                    garageFilter !== 'all'
                      ? 'bg-blue-950/30 border border-blue-500/50 text-blue-200'
                      : 'bg-seguranca-black/70 border border-gray-700/80 hover:border-gray-600 text-seguranca-lightgray focus:border-seguranca-red/50 focus:ring-1 focus:ring-seguranca-red/20'
                  }`}
                >
                  <option value="all">🚗 Todas as garagens (responsável)</option>
                  {garages.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>

                {/* 7. Período de Admissão Compacto e Elegante */}
                <div
                  className={`h-10 rounded-lg px-2.5 flex items-center gap-1.5 transition-all ${
                    hireStart || hireEnd
                      ? 'bg-emerald-950/20 border border-emerald-500/50 shadow-sm shadow-emerald-500/10'
                      : 'bg-seguranca-black/70 border border-gray-700/80 hover:border-gray-600 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20'
                  }`}
                  title="Filtrar por período de admissão"
                >
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 shrink-0 select-none">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Admissão</span>
                  </div>
                  <div className="h-3.5 w-px bg-gray-700 shrink-0 mx-0.5" />
                  <input
                    type="date"
                    value={hireStart}
                    onChange={(e) => setHireStart(e.target.value)}
                    title="Data de admissão inicial"
                    className="flex-1 min-w-0 bg-transparent text-[11px] text-gray-200 focus:outline-none [color-scheme:dark] cursor-pointer"
                  />
                  <span className="text-gray-500 text-[10px] shrink-0 font-medium select-none">a</span>
                  <input
                    type="date"
                    value={hireEnd}
                    onChange={(e) => setHireEnd(e.target.value)}
                    title="Data de admissão final"
                    className="flex-1 min-w-0 bg-transparent text-[11px] text-gray-200 focus:outline-none [color-scheme:dark] cursor-pointer"
                  />
                  {(hireStart || hireEnd) && (
                    <button
                      type="button"
                      onClick={() => { setHireStart(''); setHireEnd(''); }}
                      className="p-0.5 text-gray-400 hover:text-emerald-300 rounded transition-colors shrink-0"
                      title="Limpar período de admissão"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* 8. Período de Demissão Compacto e Elegante */}
                <div
                  className={`h-10 rounded-lg px-2.5 flex items-center gap-1.5 transition-all ${
                    termStart || termEnd
                      ? 'bg-rose-950/20 border border-rose-500/50 shadow-sm shadow-rose-500/10'
                      : 'bg-seguranca-black/70 border border-gray-700/80 hover:border-gray-600 focus-within:border-rose-500/50 focus-within:ring-1 focus-within:ring-rose-500/20'
                  }`}
                  title="Filtrar por período de demissão"
                >
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 shrink-0 select-none">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Demissão</span>
                  </div>
                  <div className="h-3.5 w-px bg-gray-700 shrink-0 mx-0.5" />
                  <input
                    type="date"
                    value={termStart}
                    onChange={(e) => setTermStart(e.target.value)}
                    title="Data de demissão inicial"
                    className="flex-1 min-w-0 bg-transparent text-[11px] text-gray-200 focus:outline-none [color-scheme:dark] cursor-pointer"
                  />
                  <span className="text-gray-500 text-[10px] shrink-0 font-medium select-none">a</span>
                  <input
                    type="date"
                    value={termEnd}
                    onChange={(e) => setTermEnd(e.target.value)}
                    title="Data de demissão final"
                    className="flex-1 min-w-0 bg-transparent text-[11px] text-gray-200 focus:outline-none [color-scheme:dark] cursor-pointer"
                  />
                  {(termStart || termEnd) && (
                    <button
                      type="button"
                      onClick={() => { setTermStart(''); setTermEnd(''); }}
                      className="p-0.5 text-gray-400 hover:text-rose-300 rounded transition-colors shrink-0"
                      title="Limpar período de demissão"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </Card>

            {/* Lista de Funcionários Moderna */}
            <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 p-6" data-animate="fadeUp">
              <FuncionariosTable
                employees={filteredEmployees}
                onView={handleViewEmployee}
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
                onCracha={handleOpenCracha}
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

      {/* Modal de Visualização Completa do Funcionário */}
      <EmployeeViewModal
        employee={employeeToView}
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setEmployeeToView(null);
        }}
        onEdit={(employee) => {
          setViewModalOpen(false);
          handleEditEmployee(employee);
        }}
        onViewDocuments={(employee) => {
          setViewModalOpen(false);
          handleViewDocuments(employee);
        }}
        onViewDependents={(employee) => {
          setViewModalOpen(false);
          setSelectedEmployee(employee);
          const tabsList = document.querySelector('[role="tablist"]');
          const dependentesTab = tabsList?.querySelector('[value="dependentes"]');
          if (dependentesTab) {
            (dependentesTab as HTMLElement).click();
          }
        }}
      />

      {/* Modal de Crachá & QR Code do Funcionário */}
      <EmployeeCrachaModal
        employee={employeeToCracha}
        isOpen={crachaModalOpen}
        onClose={() => {
          setCrachaModalOpen(false);
          setEmployeeToCracha(null);
        }}
      />
      </div>
    </StandardLayout>
  );
};

export default Funcionarios;
