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
import { positionService, Position } from '@/services/positionService';
import { MultiFilterSelect, MultiFilterOption } from '@/components/funcionarios/MultiFilterSelect';
import { exportToPDF, exportToXLSX } from '@/utils/exportUtils';

const Funcionarios: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [positionFilter, setPositionFilter] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [workPostFilter, setWorkPostFilter] = useState<string[]>([]);
  const [clientFilter, setClientFilter] = useState<string[]>([]);
  const [garageFilter, setGarageFilter] = useState<string[]>([]);
  const [hireStart, setHireStart] = useState('');
  const [hireEnd, setHireEnd] = useState('');
  const [termStart, setTermStart] = useState('');
  const [termEnd, setTermEnd] = useState('');
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
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

  const handleViewEmployee = async (employee: Employee) => {
    setEmployeeToView(employee);
    setViewModalOpen(true);
    try {
      if (employee?.id) {
        const full = await employeeService.getEmployeeById(employee.id);
        if (full && full.id) {
          setEmployeeToView(prev => (prev?.id === employee.id ? { ...prev, ...full } : prev));
        }
      }
    } catch {
      // Falha silenciosa, modal já exibe employee local
    }
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
      garageService.list(),
      positionService.getPositions()
    ]).then(([wpRes, clRes, garRes, posRes]) => {
      if (wpRes.status === 'fulfilled') setWorkPosts(wpRes.value);
      if (clRes.status === 'fulfilled') setClients(clRes.value);
      if (garRes.status === 'fulfilled') setGarages(garRes.value);
      if (posRes.status === 'fulfilled') setPositions(posRes.value);
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
  const activeCount = useMemo(() => employees.filter(e => e.status === 'ACTIVE').length, [employees]);
  const historyCount = useMemo(() => employees.filter(e => e.status === 'INACTIVE' || e.status === 'TERMINATED').length, [employees]);

  // Helper para derivar cor semântica de cada cargo no modo dark
  const getCargoColorClasses = (cargoName: string): { badgeClass: string; dotClass: string } => {
    const norm = (cargoName || '').toLowerCase();
    if (norm.includes('motorista') || norm.includes('condutor')) {
      return { badgeClass: 'bg-sky-500/20 text-sky-200 border-sky-400/50', dotClass: 'bg-sky-400' };
    }
    if (norm.includes('mecanico') || norm.includes('mecânico') || norm.includes('eletricista') || norm.includes('borracheiro') || norm.includes('manutencao') || norm.includes('manutenção') || norm.includes('oficina')) {
      return { badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/50', dotClass: 'bg-amber-400' };
    }
    if (norm.includes('porteiro') || norm.includes('vigilante') || norm.includes('controlador') || norm.includes('seguranca') || norm.includes('segurança')) {
      return { badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50', dotClass: 'bg-emerald-400' };
    }
    if (norm.includes('auxiliar') || norm.includes('limpeza') || norm.includes('lavador') || norm.includes('servicos gerais') || norm.includes('serviços gerais')) {
      return { badgeClass: 'bg-teal-500/20 text-teal-200 border-teal-400/50', dotClass: 'bg-teal-400' };
    }
    if (norm.includes('gerente') || norm.includes('supervisor') || norm.includes('encarregado') || norm.includes('coordenador') || norm.includes('diretor')) {
      return { badgeClass: 'bg-rose-500/20 text-rose-200 border-rose-400/50', dotClass: 'bg-rose-400' };
    }
    return { badgeClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50', dotClass: 'bg-cyan-400' };
  };

  const getEmployeePositionKey = (emp: Employee): string => {
    return (emp.position?.name || (emp as any).cargo || emp.position?.id || '').trim();
  };

  const filteredEmployees = employees.filter(employee => {
    const empPosKey = getEmployeePositionKey(employee).toLowerCase();
    const matchesPosition = positionFilter.length === 0 || positionFilter.some(posVal => {
      const v = posVal.toLowerCase();
      return empPosKey === v || employee.position?.id === posVal || (employee.position?.name || '').toLowerCase() === v;
    });

    const matchesDepartment = departmentFilter.length === 0 || departmentFilter.some(deptVal =>
      employee.department?.id === deptVal ||
      employee.unit?.id === deptVal ||
      (employee.department?.name || '').toLowerCase() === deptVal.toLowerCase() ||
      (employee.unit?.name || '').toLowerCase() === deptVal.toLowerCase()
    );
    
    const matchesStatus = statusFilter.length === 0 || statusFilter.some(st => {
      if (st === 'HISTORY') {
        return employee.status === 'INACTIVE' || employee.status === 'TERMINATED';
      }
      return employee.status === st;
    });

    const matchesWorkPost = workPostFilter.length === 0 || workPostFilter.some(wpId =>
      employee.workPost?.id === wpId ||
      employee.department?.id === wpId
    );

    const matchesClient = clientFilter.length === 0 || (() => {
      const wpClientId = employee.workPost?.id
        ? workPostClientMap.get(employee.workPost.id)
        : undefined;
      return wpClientId ? clientFilter.includes(wpClientId) : false;
    })();

    const matchesGarage = garageFilter.length === 0 || (() => {
      const gId = employeeGarageIds.get(employee.id);
      return gId ? garageFilter.includes(gId) : false;
    })();

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
      const cargoMatch = (employee.position?.name || '').toLowerCase().includes(normalizedSearch);
      const documentRaw = (employee.document || employee.cpf || '').toLowerCase();
      const documentDigits = documentRaw.replace(/\D/g, '');
      const cpfMatch = searchDigits
        ? (documentDigits.includes(searchDigits) || documentRaw.includes(normalizedSearch))
        : documentRaw.includes(normalizedSearch);

      return nameMatch || emailMatch || registrationMatch || cargoMatch || cpfMatch;
    })();
    
    return matchesPosition && matchesDepartment && matchesStatus && matchesSearch &&
      matchesWorkPost && matchesClient && matchesGarage &&
      matchesHireStart && matchesHireEnd && matchesTermStart && matchesTermEnd;
  });

  const activeFiltersCount = useMemo(() => {
    return [
      searchTerm.trim() !== '',
      statusFilter.length > 0,
      positionFilter.length > 0,
      departmentFilter.length > 0,
      workPostFilter.length > 0,
      clientFilter.length > 0,
      garageFilter.length > 0,
      Boolean(hireStart || hireEnd),
      Boolean(termStart || termEnd),
    ].filter(Boolean).length;
  }, [searchTerm, statusFilter, positionFilter, departmentFilter, workPostFilter, clientFilter, garageFilter, hireStart, hireEnd, termStart, termEnd]);

  // Opções de Status com cores semânticas de alto contraste no modo dark
  const statusOptions = useMemo<MultiFilterOption[]>(() => [
    {
      value: 'ACTIVE',
      label: 'Ativo',
      badgeClass: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/60',
      dotClass: 'bg-emerald-400',
      count: employees.filter(e => e.status === 'ACTIVE').length,
    },
    {
      value: 'HISTORY',
      label: 'Inativos & Demitidos (Histórico)',
      badgeClass: 'bg-amber-500/25 text-amber-200 border-amber-400/60',
      dotClass: 'bg-amber-400',
      count: employees.filter(e => e.status === 'INACTIVE' || e.status === 'TERMINATED').length,
    },
    {
      value: 'INACTIVE',
      label: 'Inativo',
      badgeClass: 'bg-slate-500/30 text-slate-200 border-slate-400/60',
      dotClass: 'bg-slate-400',
      count: employees.filter(e => e.status === 'INACTIVE').length,
    },
    {
      value: 'TERMINATED',
      label: 'Demitido',
      badgeClass: 'bg-red-500/25 text-red-200 border-red-400/60',
      dotClass: 'bg-red-400',
      count: employees.filter(e => e.status === 'TERMINATED').length,
    },
    {
      value: 'VACATION',
      label: 'Férias',
      badgeClass: 'bg-yellow-500/25 text-yellow-200 border-yellow-400/60',
      dotClass: 'bg-yellow-400',
      count: employees.filter(e => e.status === 'VACATION').length,
    },
    {
      value: 'MATERNITY_LEAVE',
      label: 'Licença Maternidade',
      badgeClass: 'bg-pink-500/25 text-pink-200 border-pink-400/60',
      dotClass: 'bg-pink-400',
      count: employees.filter(e => e.status === 'MATERNITY_LEAVE').length,
    },
    {
      value: 'MEDICAL_CERTIFICATE',
      label: 'Atestado Médico',
      badgeClass: 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60',
      dotClass: 'bg-cyan-400',
      count: employees.filter(e => e.status === 'MEDICAL_CERTIFICATE').length,
    },
    {
      value: 'SUSPENDED',
      label: 'Suspenso',
      badgeClass: 'bg-orange-500/25 text-orange-200 border-orange-400/60',
      dotClass: 'bg-orange-400',
      count: employees.filter(e => e.status === 'SUSPENDED').length,
    },
  ], [employees]);

  // Opções de Cargo/Função com contagem e cores derivadas
  const positionOptions = useMemo<MultiFilterOption[]>(() => {
    const byName = new Map<string, { label: string; count: number }>();
    positions.forEach(p => {
      if (p.name && p.name.trim()) {
        const key = p.name.trim().toUpperCase();
        if (!byName.has(key)) {
          byName.set(key, { label: p.name.trim(), count: 0 });
        }
      }
    });
    employees.forEach(emp => {
      const rawName = (emp.position?.name || (emp as any).cargo || '').trim();
      if (!rawName) return;
      const key = rawName.toUpperCase();
      const existing = byName.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        byName.set(key, { label: rawName, count: 1 });
      }
    });
    return Array.from(byName.values())
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .map(item => {
        const colors = getCargoColorClasses(item.label);
        return {
          value: item.label,
          label: item.label,
          badgeClass: colors.badgeClass,
          dotClass: colors.dotClass,
          count: item.count,
        };
      });
  }, [positions, employees]);

  // Departamentos/unidades únicos com rótulo legível
  const departmentOptions = useMemo<MultiFilterOption[]>(() => {
    const byId = new Map<string, { label: string; count: number }>();
    employees.forEach(emp => {
      const entries: Array<[string | undefined, string | undefined]> = [
        [emp.department?.id, emp.department?.name],
        [emp.unit?.id, emp.unit?.name],
      ];
      entries.forEach(([id, name]) => {
        if (id && name) {
          const curr = byId.get(id);
          if (curr) curr.count += 1;
          else byId.set(id, { label: name, count: 1 });
        }
      });
    });
    return Array.from(byId.entries()).map(([id, info]) => ({
      value: id,
      label: info.label,
      badgeClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50',
      dotClass: 'bg-cyan-400',
      count: info.count,
    }));
  }, [employees]);

  const workPostOptions = useMemo<MultiFilterOption[]>(() => {
    return workPosts.map(wp => ({
      value: wp.id,
      label: wp.name,
      badgeClass: 'bg-rose-500/20 text-rose-200 border-rose-400/50',
      dotClass: 'bg-rose-400',
    }));
  }, [workPosts]);

  const clientOptions = useMemo<MultiFilterOption[]>(() => {
    return clients.map(c => ({
      value: c.id,
      label: c.name,
      badgeClass: 'bg-sky-500/20 text-sky-200 border-sky-400/50',
      dotClass: 'bg-sky-400',
    }));
  }, [clients]);

  const garageOptions = useMemo<MultiFilterOption[]>(() => {
    return garages.map(g => ({
      value: g.id,
      label: g.name,
      badgeClass: 'bg-orange-500/20 text-orange-200 border-orange-400/50',
      dotClass: 'bg-orange-400',
    }));
  }, [garages]);

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
    setStatusFilter([]);
    setPositionFilter([]);
    setDepartmentFilter([]);
    setWorkPostFilter([]);
    setClientFilter([]);
    setGarageFilter([]);
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

  // Desativar funcionário individual (Inativação segura mantendo histórico no banco)
  const handleDeactivateEmployee = async (employee: Employee) => {
    if (!confirm(`📋 Deseja desativar o colaborador "${employee.name}" da lista ativa?

ℹ️ HISTÓRICO PRESERVADO:
O colaborador sairá da lista ativa de operações, mas todo o seu histórico (dados cadastrais, CNH, holerites, pontos, viagens e documentos) permanecerá gravado com segurança no banco de dados para consultas futuras.

Confirmar desativação?`)) {
      return;
    }

    try {
      await employeeService.updateStatus(employee.id, 'INACTIVE');
      toast({
        title: "✅ Colaborador Desativado",
        description: `"${employee.name}" foi inativado. Seu histórico permanece salvo para consultas futuras.`,
      });
      loadEmployeesWithFilters();
    } catch (err: any) {
      console.error('Erro ao desativar funcionário:', err);
      toast({
        title: "❌ Erro ao desativar",
        description: err?.message || "Não foi possível desativar o funcionário.",
        variant: "destructive"
      });
    }
  };

  // Reativar funcionário
  const handleReactivateEmployee = async (employee: Employee) => {
    if (!confirm(`Deseja reativar o colaborador "${employee.name}" para o quadro de funcionários ativos?`)) {
      return;
    }

    try {
      await employeeService.updateStatus(employee.id, 'ACTIVE');
      toast({
        title: "✅ Colaborador Reativado",
        description: `"${employee.name}" agora está ativo novamente no sistema.`,
      });
      loadEmployeesWithFilters();
    } catch (err: any) {
      console.error('Erro ao reativar funcionário:', err);
      toast({
        title: "❌ Erro ao reativar",
        description: err?.message || "Não foi possível reativar o funcionário.",
        variant: "destructive"
      });
    }
  };

  // Excluir funcionário da lista (Exclusão lógica preservando histórico no banco de dados)
  const deleteEmployee = async (employeeId: string) => {
    // Encontrar o funcionário para exibir nome e detalhes na confirmação
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
      toast({
        title: "Erro",
        description: "Funcionário não encontrado.",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`📋 Deseja excluir/desativar o colaborador "${employee.name}" da lista?

ℹ️ HISTÓRICO PRESERVADO NO BANCO:
O colaborador será removido da lista ativa, mas todo o seu histórico (dados cadastrais, CPF: ${employee.cpf || 'N/A'}, CNH, viagens, ponto e holerites) continuará registrado com segurança no banco de dados para futuras consultas e auditorias.

Confirmar remoção da lista?`)) {
      return;
    }

    try {
      await employeeService.deleteEmployee(employeeId);
      toast({
        title: "✅ Colaborador Removido da Lista",
        description: `"${employee.name}" foi desativado. O histórico segue registrado no banco de dados.`,
      });
      loadEmployeesWithFilters(); // Recarregar lista
    } catch (err: any) {
      console.error('Erro ao excluir funcionário:', err);
      toast({
        title: "❌ Erro na operação",
        description: err?.message || "Não foi possível desativar o funcionário.",
        variant: "destructive"
      });
    }
  };

  // Excluir/Desativar múltiplos funcionários em massa (preservando histórico)
  const handleBulkDelete = async (selectedIds: string[]) => {
    if (!selectedIds || selectedIds.length === 0) return;

    if (!confirm(`📋 Deseja desativar/remover ${selectedIds.length} colaborador(es) selecionado(s) da lista ativa?

ℹ️ HISTÓRICO PRESERVADO NO BANCO:
Os colaboradores selecionados sairão da listagem ativa, porém todos os seus registros e históricos no banco de dados continuarão intactos para consultas e auditorias futuras.

Confirmar operação em lote?`)) {
      return;
    }

    try {
      const res = await employeeService.bulkDeleteEmployees(selectedIds);
      toast({
        title: "✅ Operação em Lote Concluída",
        description: `${res.deleted} colaborador(es) desativado(s) com sucesso. Histórico preservado no banco de dados.${res.failed?.length ? ` (${res.failed.length} falharam)` : ''}`,
      });
      loadEmployeesWithFilters();
    } catch (err: any) {
      console.error('Erro na desativação em massa:', err);
      toast({
        title: "❌ Erro na operação em massa",
        description: err?.message || "Erro ao processar desativação em massa.",
        variant: "destructive"
      });
      loadEmployeesWithFilters();
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

                {/* Botões Rápidos de Status (Ativos / Inativos / Todos) */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusFilter([])}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      statusFilter.length === 0
                        ? 'bg-seguranca-red text-white shadow-md shadow-red-950/40'
                        : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    Todos ({employees.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter(['ACTIVE'])}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      statusFilter.length === 1 && statusFilter[0] === 'ACTIVE'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                        : 'bg-slate-900 border border-emerald-500/30 text-emerald-300 hover:text-white hover:bg-emerald-950/40 hover:border-emerald-400/60'
                    }`}
                  >
                    Ativos ({activeCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter(['HISTORY'])}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      statusFilter.length === 1 && statusFilter[0] === 'HISTORY'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                        : 'bg-slate-900 border border-amber-500/30 text-amber-300 hover:text-white hover:bg-amber-950/40 hover:border-amber-400/60'
                    }`}
                    title="Funcionários inativos ou demitidos com histórico preservado no banco de dados"
                  >
                    🏛️ Inativos / Histórico ({historyCount})
                  </button>

                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRefreshing(true);
                      clearFilters();
                      setTimeout(() => setRefreshing(false), 800);
                    }}
                    disabled={refreshing}
                    className={`text-xs h-8 px-3 rounded-lg transition-all font-medium ${
                      activeFiltersCount > 0
                        ? 'border-seguranca-red/70 bg-red-950/30 text-red-300 hover:bg-seguranca-red/20 hover:text-white'
                        : 'border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
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
              </div>

              {/* Grid de Filtros com Multisseleção e Alto Contraste no Modo Dark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
                {/* 1. Busca por texto */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 h-4 w-4 pointer-events-none" />
                  <Input
                    placeholder="Digite o nome, CPF, cargo ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-7 h-10 text-xs bg-slate-900/95 border-slate-600/80 hover:border-slate-400 text-white placeholder:text-slate-400 focus:border-seguranca-red focus:ring-1 focus:ring-seguranca-red/30 rounded-lg transition-colors font-medium"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                      title="Limpar busca"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* 2. Cargo / Função (Multisseleção de Cargos) */}
                <MultiFilterSelect
                  placeholder="Todos os cargos / funções"
                  icon={<Briefcase className="w-4 h-4" />}
                  options={positionOptions}
                  selected={positionFilter}
                  onChange={setPositionFilter}
                  accentTheme="amber"
                />
                
                {/* 3. Status (Multisseleção com cores semânticas) */}
                <MultiFilterSelect
                  placeholder="Todos os status"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  options={statusOptions}
                  selected={statusFilter}
                  onChange={setStatusFilter}
                  accentTheme="emerald"
                />
                
                {/* 4. Departamento / Unidade (Multisseleção) */}
                <MultiFilterSelect
                  placeholder="Todos os departamentos"
                  icon={<Building className="w-4 h-4" />}
                  options={departmentOptions}
                  selected={departmentFilter}
                  onChange={setDepartmentFilter}
                  accentTheme="cyan"
                />

                {/* 5. Obra / Setor (Posto) (Multisseleção) */}
                <MultiFilterSelect
                  placeholder="Obra / Setor (posto)"
                  icon={<MapPin className="w-4 h-4" />}
                  options={workPostOptions}
                  selected={workPostFilter}
                  onChange={setWorkPostFilter}
                  accentTheme="rose"
                />

                {/* 6. Clientes (Multisseleção) */}
                <MultiFilterSelect
                  placeholder="Todos os clientes"
                  icon={<Users className="w-4 h-4" />}
                  options={clientOptions}
                  selected={clientFilter}
                  onChange={setClientFilter}
                  accentTheme="blue"
                />

                {/* 7. Garagens (Responsável) (Multisseleção) */}
                <MultiFilterSelect
                  placeholder="Todas as garagens (responsável)"
                  icon={<Filter className="w-4 h-4" />}
                  options={garageOptions}
                  selected={garageFilter}
                  onChange={setGarageFilter}
                  accentTheme="orange"
                />

                {/* 8. Período de Admissão Compacto e Alto Contraste */}
                <div
                  className={`h-10 rounded-lg px-2.5 flex items-center gap-1.5 transition-all ${
                    hireStart || hireEnd
                      ? 'bg-emerald-950/40 border border-emerald-400/80 shadow-sm shadow-emerald-500/10'
                      : 'bg-slate-900/95 border border-emerald-500/35 hover:border-emerald-400/70 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-500/30'
                  }`}
                  title="Filtrar por período de admissão"
                >
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 shrink-0 select-none">
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Admissão</span>
                  </div>
                  <div className="h-3.5 w-px bg-slate-700 shrink-0 mx-0.5" />
                  <Input
                    type="date"
                    value={hireStart}
                    onChange={(e) => setHireStart(e.target.value)}
                    title="Data de admissão inicial"
                    className="flex-1 min-w-0 bg-transparent border-0 p-0 h-8 text-[11px] text-slate-100 font-medium focus:outline-none [color-scheme:dark] cursor-pointer"
                  />
                  <span className="text-slate-400 text-[10px] shrink-0 font-semibold select-none">a</span>
                  <Input
                    type="date"
                    value={hireEnd}
                    onChange={(e) => setHireEnd(e.target.value)}
                    title="Data de admissão final"
                    className="flex-1 min-w-0 bg-transparent border-0 p-0 h-8 text-[11px] text-slate-100 font-medium focus:outline-none [color-scheme:dark] cursor-pointer"
                  />
                  {(hireStart || hireEnd) && (
                    <button
                      type="button"
                      onClick={() => { setHireStart(''); setHireEnd(''); }}
                      className="p-0.5 text-slate-300 hover:text-emerald-300 rounded transition-colors shrink-0"
                      title="Limpar período de admissão"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* 9. Período de Demissão Compacto e Alto Contraste */}
                <div
                  className={`h-10 rounded-lg px-2.5 flex items-center gap-1.5 transition-all ${
                    termStart || termEnd
                      ? 'bg-rose-950/40 border border-rose-400/80 shadow-sm shadow-rose-500/10'
                      : 'bg-slate-900/95 border border-rose-500/35 hover:border-rose-400/70 focus-within:border-rose-400 focus-within:ring-1 focus-within:ring-rose-500/30'
                  }`}
                  title="Filtrar por período de demissão"
                >
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-300 shrink-0 select-none">
                    <Calendar className="h-3.5 w-3.5 text-rose-400" />
                    <span>Demissão</span>
                  </div>
                  <div className="h-3.5 w-px bg-slate-700 shrink-0 mx-0.5" />
                  <Input
                    type="date"
                    value={termStart}
                    onChange={(e) => setTermStart(e.target.value)}
                    title="Data de demissão inicial"
                    className="flex-1 min-w-0 bg-transparent border-0 p-0 h-8 text-[11px] text-slate-100 font-medium focus:outline-none [color-scheme:dark] cursor-pointer"
                  />
                  <span className="text-slate-400 text-[10px] shrink-0 font-semibold select-none">a</span>
                  <Input
                    type="date"
                    value={termEnd}
                    onChange={(e) => setTermEnd(e.target.value)}
                    title="Data de demissão final"
                    className="flex-1 min-w-0 bg-transparent border-0 p-0 h-8 text-[11px] text-slate-100 font-medium focus:outline-none [color-scheme:dark] cursor-pointer"
                  />
                  {(termStart || termEnd) && (
                    <button
                      type="button"
                      onClick={() => { setTermStart(''); setTermEnd(''); }}
                      className="p-0.5 text-slate-300 hover:text-rose-300 rounded transition-colors shrink-0"
                      title="Limpar período de demissão"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </Card>

            {/* Lista de Funcionários Moderna */}
            <Card className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 p-2 sm:p-4" data-animate="fadeUp">
              <FuncionariosTable
                employees={filteredEmployees}
                onView={handleViewEmployee}
                onEdit={handleEditEmployee}
                onDelete={deleteEmployee}
                onBulkDelete={handleBulkDelete}
                onDeactivate={handleDeactivateEmployee}
                onReactivate={handleReactivateEmployee}
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
