import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { employeeService } from '@/services/employeeService';
import { CreateEmployeeDTO } from '@/types/employee';
import { positionService, Position } from '@/services/positionService';
import workPostService, { WorkPost } from '@/services/workPostService';
import departmentService, { Department } from '@/services/departmentService';
import { unitService, Unit } from '@/services/unitService';
import { userService } from '@/services/userService';
import { User } from '@/types/user';
import { companyService } from '@/services/companyService';
import { Company } from '@/types/company';
import { Search, User as UserIcon, Building, Briefcase, Plus, UserPlus, Link, X, FileText, Upload, FileCheck, AlertCircle, Users as UsersIcon, Trash2, Edit2, Shield, Eye, FileSpreadsheet } from 'lucide-react';
import NovoCargoModal from '@/components/funcionarios/NovoCargoModal';
import NovoMedicoModal from '@/components/funcionarios/NovoMedicoModal';
import CriarUsuarioPadraoModal from '@/components/funcionarios/CriarUsuarioPadraoModal';
import { EmployeeDataFromPDF } from '@/services/pdfProcessingService';
import { DependentFormModal } from '@/components/dependentes/DependentFormModal';
import dependentService from '@/services/dependentService';
import { Dependent, DependentCreateRequest } from '@/types/dependent';
import { useToast } from '@/hooks/use-toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { epiDeliveryFormService } from '@/services/epiDeliveryFormService';
import accountingFormService from '@/services/accountingFormService';
import { doctorService } from '@/services/doctorService';
import { Doctor } from '@/types/doctor';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FuncionarioNovoModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  employeeToEdit?: Employee | null; // Funcionário para edição (opcional)
}

const initialState: CreateEmployeeDTO = {
  name: '',
  cpf: '',
  rg: '',
  email: '',
  phone: '',
  telefoneContato: '',
  address: '',
  enderecoRua: '',
  enderecoNumero: '',
  enderecoComplemento: '',
  enderecoBairro: '',
  enderecoCidade: '',
  enderecoEstado: '',
  enderecoCep: '',
  birthDate: '',
  maritalStatus: 'SINGLE',
  nationality: 'Brasileiro',
  nomePai: '',
  nomeMae: '',
  localNascimento: '',
  municipioNascimento: '',
  estadoNascimento: '',
  sexo: '',
  grauInstrucao: '',
  matriculaEsocial: '',
  registrationNumber: '',
  hireDate: '',
  status: 'ACTIVE',
  position: {
    id: ''
  },
  unit: {
    id: ''
  },
  user: {
    id: ''
  },
  company: {
    id: ''
  },
  bankData: {
    bank: '',
    agency: '',
    account: '',
    type: 'CORRENTE'
  }
};

const FuncionarioNovoModal: React.FC<FuncionarioNovoModalProps> = ({ open, onClose, onCreated, employeeToEdit }) => {
  const { toast } = useToast();
  const [form, setForm] = useState<CreateEmployeeDTO>(initialState);
  const [isEditMode, setIsEditMode] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  
  // Estados para médicos
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  
  // Função para carregar médicos
  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const doctorsList = await doctorService.getAllActive();
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de médicos.",
        variant: "destructive"
      });
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Função para buscar médicos por nome
  const handleDoctorSearch = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      loadDoctors();
      return;
    }
    try {
      setLoadingDoctors(true);
      const results = await doctorService.searchByName(searchTerm);
      setDoctors(results);
    } catch (error) {
      console.error('Erro ao buscar médicos:', error);
    } finally {
      setLoadingDoctors(false);
    }
  };
  
  // Função para buscar CEP via API ViaCEP
  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    
    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        const enderecoCompleto = `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''} - ${data.uf || ''}, ${cepLimpo}`;
        setForm(prev => ({
          ...prev,
          enderecoRua: data.logradouro || '',
          enderecoBairro: data.bairro || '',
          enderecoCidade: data.localidade || '',
          enderecoEstado: data.uf || '',
          enderecoCep: cepLimpo, // Salvar sem máscara
          address: enderecoCompleto // Manter compatibilidade com campo antigo
        }));
        toast({
          title: "CEP encontrado",
          description: "Endereço preenchido automaticamente.",
          variant: "default"
        });
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP digitado.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar o CEP.",
        variant: "destructive"
      });
    } finally {
      setLoadingCep(false);
    }
  };
  
  // Função para aplicar máscara de telefone
  const aplicarMascaraTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    } else {
      return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    }
  };
  
  // Função para aplicar máscara de CEP
  const aplicarMascaraCep = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros.replace(/(\d{5})(\d{0,3})/, '$1-$2');
  };
  
  // Estados para os dados dos selects
  const [positions, setPositions] = useState<Position[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Estados para busca e filtros
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Estados para busca de cargos
  const [positionSearchTerm, setPositionSearchTerm] = useState('');
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  
  // Estados para empresas
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Estados para dependentes
  const [employeeDependents, setEmployeeDependents] = useState<Dependent[]>([]);
  const [pendingDependents, setPendingDependents] = useState<DependentCreateRequest[]>([]); // Dependentes pendentes para salvar após criar funcionário
  const [dependentModalOpen, setDependentModalOpen] = useState(false);
  const [dependentToEdit, setDependentToEdit] = useState<Dependent | null>(null);
  const [loadingDependents, setLoadingDependents] = useState(false);

  // useEffect para carregar dados do funcionário em modo de edição
  useEffect(() => {
    if (employeeToEdit && open) {
      console.log('🔍 Carregando dados do funcionário para edição:', employeeToEdit);
      setIsEditMode(true);
      // Definir currentEmployeeId quando abrir para edição
      if (employeeToEdit.id) {
        setCurrentEmployeeId(employeeToEdit.id);
        console.log('✅ currentEmployeeId definido para edição:', employeeToEdit.id);
      }
      
      // Preencher o formulário com os dados do funcionário
      setForm({
        name: employeeToEdit.name || '',
        cpf: employeeToEdit.cpf || employeeToEdit.document || '',
        rg: employeeToEdit.rg || '',
        email: employeeToEdit.email || '',
        phone: employeeToEdit.phone || '',
        telefoneContato: (employeeToEdit as any).telefoneContato || '',
        address: employeeToEdit.address || '',
        // Preencher campos separados se existirem, senão tentar extrair do campo address
        enderecoRua: (employeeToEdit as any).enderecoRua || '',
        enderecoNumero: (employeeToEdit as any).enderecoNumero || '',
        enderecoComplemento: (employeeToEdit as any).enderecoComplemento || '',
        enderecoBairro: (employeeToEdit as any).enderecoBairro || '',
        enderecoCidade: (employeeToEdit as any).enderecoCidade || '',
        enderecoEstado: (employeeToEdit as any).enderecoEstado || '',
        enderecoCep: (employeeToEdit as any).enderecoCep || '',
        birthDate: employeeToEdit.birthDate || '',
        maritalStatus: employeeToEdit.maritalStatus || 'SINGLE',
        nationality: employeeToEdit.nationality || 'Brasileiro',
        registrationNumber: employeeToEdit.registrationNumber || '',
        hireDate: employeeToEdit.hireDate || '',
        status: employeeToEdit.status || 'ACTIVE',
        notes: employeeToEdit.notes || '',
        position: employeeToEdit.position || { id: '' },
        unit: employeeToEdit.unit || { id: '' },
        user: employeeToEdit.user || { id: '' },
        company: employeeToEdit.company || { id: '' },
        
        // Campos do cônjuge
        spouseName: employeeToEdit.spouseName || '',
        spouseCpf: employeeToEdit.spouseCpf || '',
        spouseRg: employeeToEdit.spouseRg || '',
        spouseBirthDate: employeeToEdit.spouseBirthDate || '',
        spousePhone: employeeToEdit.spousePhone || '',
        spouseEmail: employeeToEdit.spouseEmail || '',
        
        // Campos da ficha de registro
        empresaNome: employeeToEdit.empresaNome || '',
        empresaEndereco: employeeToEdit.empresaEndereco || '',
        empresaCnpj: employeeToEdit.empresaCnpj || '',
        tituloEleitor: employeeToEdit.tituloEleitor || '',
        tituloEleitorZona: employeeToEdit.tituloEleitorZona || '',
        tituloEleitorSecao: employeeToEdit.tituloEleitorSecao || '',
        tituloEleitorDataExpedicao: employeeToEdit.tituloEleitorDataExpedicao || '',
        tituloEleitorValidade: employeeToEdit.tituloEleitorValidade || '',
        nomeConselhoRegional: employeeToEdit.nomeConselhoRegional || '',
        carteiraIdentidadeOrgaoEmissor: employeeToEdit.carteiraIdentidadeOrgaoEmissor || '',
        carteiraIdentidadeDataEmissao: employeeToEdit.carteiraIdentidadeDataEmissao || '',
        certificadoMilitar: employeeToEdit.certificadoMilitar || '',
        nomePai: employeeToEdit.nomePai || '',
        nomeMae: employeeToEdit.nomeMae || '',
        localNascimento: employeeToEdit.localNascimento || '',
        municipioNascimento: employeeToEdit.municipioNascimento || '',
        estadoNascimento: employeeToEdit.estadoNascimento || '',
        sexo: employeeToEdit.sexo || '',
        grauInstrucao: employeeToEdit.grauInstrucao || '',
        matriculaEsocial: employeeToEdit.matriculaEsocial || '',
        cbo: employeeToEdit.cbo || '',
        salario: employeeToEdit.salario || 0,
        salarioPorExtenso: employeeToEdit.salarioPorExtenso || '',
        periodoPagamento: employeeToEdit.periodoPagamento || '',
        horarioTrabalho: employeeToEdit.horarioTrabalho || '',
        horarioTrabalhoIntervalo: employeeToEdit.horarioTrabalhoIntervalo || '',
        diasTrabalho: employeeToEdit.diasTrabalho || '',
        prazoExperienciaTexto: employeeToEdit.prazoExperienciaTexto || '',
        prorrogacaoExperiencia: employeeToEdit.prorrogacaoExperiencia || '',
        folgaSemanal: employeeToEdit.folgaSemanal || '',
        escalaTrabalho: employeeToEdit.escalaTrabalho || '',
        fgtsOptante: employeeToEdit.fgtsOptante || false,
        fgtsDataOpcao: employeeToEdit.fgtsDataOpcao || '',
        fgtsBancoDepositario: employeeToEdit.fgtsBancoDepositario || '',
        fgtsDataRetratacao: employeeToEdit.fgtsDataRetratacao || '',
        pisDataCadastro: employeeToEdit.pisDataCadastro || '',
        pisBancoDepositario: employeeToEdit.pisBancoDepositario || '',
        pisEnderecoBanco: employeeToEdit.pisEnderecoBanco || '',
        pisCodigoBanco: employeeToEdit.pisCodigoBanco || '',
        pisCodigoAgencia: employeeToEdit.pisCodigoAgencia || '',
        cnhNumber: employeeToEdit.cnhNumber || '',
        cnhExpirationDate: employeeToEdit.cnhExpirationDate || '',
        cnhCategory: employeeToEdit.cnhCategory || '',
        ctps: employeeToEdit.ctps || '',
        ctpsRural: employeeToEdit.ctpsRural || '',
        ctpsSeries: employeeToEdit.ctpsSeries || '',
        ctpsIssueDate: employeeToEdit.ctpsIssueDate || '',
        ctpsIssuingAgency: employeeToEdit.ctpsIssuingAgency || '',
        carteiraModelo19: employeeToEdit.carteiraModelo19 || '',
        registroGeralEstrangeiro: employeeToEdit.registroGeralEstrangeiro || '',
        casadoBrasileiro: employeeToEdit.casadoBrasileiro || false,
        nomeConjugeEstrangeiro: employeeToEdit.nomeConjugeEstrangeiro || '',
        temFilhosBrasileiros: employeeToEdit.temFilhosBrasileiros || false,
        quantidadeFilhosBrasileiros: employeeToEdit.quantidadeFilhosBrasileiros || 0,
        dataChegadaBrasil: employeeToEdit.dataChegadaBrasil || '',
        naturalizado: employeeToEdit.naturalizado || false,
        decretoNaturalizacao: employeeToEdit.decretoNaturalizacao || '',
        assinaturaFuncionario: employeeToEdit.assinaturaFuncionario || '',
        dataRescisao: employeeToEdit.dataRescisao || '',
        pis: employeeToEdit.pis || '',
        gender: employeeToEdit.gender || '',
        vistoFiscalizacao: employeeToEdit.vistoFiscalizacao || '',
        
        // Campos para Estrangeiro
        rneNumero: employeeToEdit.rneNumero || '',
        rneValidade: employeeToEdit.rneValidade || '',
        ricNumero: employeeToEdit.ricNumero || '',
        ricOrgaoEmissor: employeeToEdit.ricOrgaoEmissor || '',
        ricDataEmissao: employeeToEdit.ricDataEmissao || '',
        tipoVisto: employeeToEdit.tipoVisto || '',
        
        // Dados do Exame Médico (ASO)
        exameMedicoData: employeeToEdit.exameMedicoData || '',
        exameMedicoTipo: employeeToEdit.exameMedicoTipo || '',
        exameMedicoDoctor: employeeToEdit.exameMedicoDoctor || undefined,
        exameMedicoHorario: employeeToEdit.exameMedicoHorario || '',
        exameMedicoIntervalosRefeicao: employeeToEdit.exameMedicoIntervalosRefeicao,
        exameMedicoObservacoes: employeeToEdit.exameMedicoObservacoes || '',
        exameMedicoPrimeiroEmprego: employeeToEdit.exameMedicoPrimeiroEmprego,
        exameMedicoContribuicaoSindicalPaga: employeeToEdit.exameMedicoContribuicaoSindicalPaga,
        
        // Dados bancários - converter de bankInfo (backend) para bankData (frontend)
        bankData: employeeToEdit.bankData ? {
          bank: employeeToEdit.bankData.bank || '',
          agency: employeeToEdit.bankData.agency || '',
          account: employeeToEdit.bankData.account || '',
          type: employeeToEdit.bankData.type || 'CORRENTE'
        } : {
          bank: '',
          agency: '',
          account: '',
          type: 'CORRENTE'
        },
        
        // Campos adicionais - comentados pois não existem na entidade
        // workPostId: (employeeToEdit as any).workPostId || '',
        // departmentId: (employeeToEdit as any).departmentId || ''
      });

      // Preencher seleções
      console.log('🔍 Dados de relacionamento:', {
        position: employeeToEdit.position,
        unit: employeeToEdit.unit,
        user: employeeToEdit.user,
        company: employeeToEdit.company
        // workPostId e departmentId não existem na entidade Employee
      });
      
      if (employeeToEdit.position) {
        console.log('🔍 Carregando posição:', employeeToEdit.position);
        setSelectedPosition(employeeToEdit.position);
        setPositionSearchTerm(employeeToEdit.position.name || '');
      }
      if (employeeToEdit.unit) {
        console.log('🔍 Carregando unidade:', employeeToEdit.unit);
        setSelectedUnit(employeeToEdit.unit);
      }
      if (employeeToEdit.user) {
        console.log('🔍 Carregando usuário:', employeeToEdit.user);
        setSelectedUser(employeeToEdit.user);
        setUserSearchTerm(employeeToEdit.user.name || employeeToEdit.user.username || '');
      }
      if (employeeToEdit.company && employeeToEdit.company.id) {
        console.log('🔍 Carregando empresa:', employeeToEdit.company);
        // Buscar empresa completa da lista de empresas
        const fullCompany = companies.find(c => c.id === employeeToEdit.company?.id);
        if (fullCompany) {
          setSelectedCompany(fullCompany);
        } else {
          // Se não encontrou, usar os dados disponíveis ou buscar depois
          setSelectedCompany(employeeToEdit.company as Company);
        }
      }

      // Carregar dependentes do funcionário
      loadEmployeeDependents(employeeToEdit.id);
      
      // Carregar médico se houver
      if (employeeToEdit.exameMedicoDoctor?.id) {
        doctorService.getById(employeeToEdit.exameMedicoDoctor.id)
          .then(doctor => {
            setSelectedDoctor(doctor);
            setDoctorSearchTerm(`${doctor.name} - CRM ${doctor.crmNumber}/${doctor.crmState}`);
          })
          .catch(err => console.error('Erro ao carregar médico:', err));
      }
    } else if (!employeeToEdit && open) {
      // Modo de criação - resetar formulário
      setIsEditMode(false);
      setForm(initialState);
      setSelectedPosition(null);
      setSelectedUnit(null);
      setSelectedUser(null);
      setSelectedCompany(null);
      setPhotoPreview(null);
      setEmployeeDependents([]);
      setUserSearchTerm('');
      setPositionSearchTerm('');
      setSelectedDoctor(null);
      setDoctorSearchTerm('');
      setShowDoctorDropdown(false);
    }
  }, [employeeToEdit, open]);
  
  // Carregar médicos quando abrir o modal
  useEffect(() => {
    if (open) {
      loadDoctors();
    }
  }, [open]);

  // Carregar Postos de Trabalho e Departamentos
  useEffect(() => {
    const loadWorkPostsAndDepartments = async () => {
      try {
        const [wp, deps] = await Promise.all([
          workPostService.getAllWorkPosts(),
          departmentService.listActive(),
        ]);
        setWorkPosts(wp);
        setDepartments(deps);
      } catch (e) {
        console.error('Erro ao carregar postos/departamentos', e);
      }
    };
    loadWorkPostsAndDepartments();
  }, []);

  // Atualizar selectedCompany quando companies forem carregadas e houver employeeToEdit
  useEffect(() => {
    if (employeeToEdit?.company?.id && companies.length > 0) {
      const fullCompany = companies.find(c => c.id === employeeToEdit.company?.id);
      if (fullCompany && (!selectedCompany || selectedCompany.id !== fullCompany.id)) {
        console.log('🔍 Atualizando empresa com dados completos:', fullCompany);
        setSelectedCompany(fullCompany);
      }
    }
  }, [companies, employeeToEdit?.company?.id]);

  // Função para carregar dependentes do funcionário
  const loadEmployeeDependents = async (employeeId: string) => {
    if (!employeeId) return;
    
    // Validar UUID - não fazer chamada se for UUID inválido/padrão
    if (employeeId === '00000000-0000-0000-0000-000000000001' || 
        employeeId === '00000000-0000-0000-0000-000000000000' ||
        !employeeId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.warn('UUID inválido para carregar dependentes:', employeeId);
      setEmployeeDependents([]);
      return;
    }
    
    setLoadingDependents(true);
    try {
      const dependents = await dependentService.getDependentsByEmployee(employeeId);
      setEmployeeDependents(dependents);
    } catch (error: any) {
      console.error('Erro ao carregar dependentes:', error);
      // Se for erro 403, apenas logar e não mostrar erro ao usuário
      if (error?.response?.status === 403) {
        console.warn('Acesso negado ao carregar dependentes. Verifique as permissões do usuário.');
      }
      setEmployeeDependents([]);
    } finally {
      setLoadingDependents(false);
    }
  };

  // Abrir modal para adicionar dependente
  const handleAddDependent = () => {
    setDependentToEdit(null);
    setDependentModalOpen(true);
  };
  
  // Modificar callback para salvar dependente temporariamente se ainda não há funcionário criado
  const handleDependentSavedInCreation = async (dependentData: DependentCreateRequest) => {
    if (!isEditMode || !employeeToEdit?.id) {
      // Se ainda não há funcionário criado, armazenar temporariamente
      setPendingDependents(prev => [...prev, dependentData]);
      setDependentModalOpen(false);
      toast({
        title: "Sucesso!",
        description: "Dependente será adicionado após salvar o funcionário.",
        variant: "default"
      });
    } else {
      // Se já há funcionário, salvar normalmente
      await handleDependentSaved();
    }
  };

  // Abrir modal para editar dependente
  const handleEditDependent = (dependent: Dependent) => {
    setDependentToEdit(dependent);
    setDependentModalOpen(true);
  };

  // Excluir dependente
  const handleDeleteDependent = async (dependent: Dependent) => {
    if (!window.confirm(`Tem certeza que deseja excluir o dependente "${dependent.name}"?`)) {
      return;
    }

    try {
      await dependentService.deleteDependent(dependent.id);
      toast({
        title: "Sucesso!",
        description: "Dependente excluído com sucesso.",
        variant: "default"
      });
      
      // Recarregar dependentes
      if (employeeToEdit?.id) {
        await loadEmployeeDependents(employeeToEdit.id);
      }
    } catch (error: any) {
      console.error('Erro ao excluir dependente:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir dependente.",
        variant: "destructive"
      });
    }
  };

  // Callback quando dependente é criado/editado com sucesso
  const handleDependentSaved = async () => {
    setDependentModalOpen(false);
    setDependentToEdit(null);
    
    // Recarregar dependentes
    if (employeeToEdit?.id) {
      await loadEmployeeDependents(employeeToEdit.id);
    }
    
    toast({
      title: "Sucesso!",
      description: dependentToEdit ? "Dependente atualizado com sucesso." : "Dependente adicionado com sucesso.",
      variant: "default"
    });
  };
  
  // Estados para modal de novo cargo
  const [novoCargoModalOpen, setNovoCargoModalOpen] = useState(false);
  
  // Estados para modal de novo médico
  const [novoMedicoModalOpen, setNovoMedicoModalOpen] = useState(false);
  
  // Estados para modal de criar usuário padrão
  const [criarUsuarioModalOpen, setCriarUsuarioModalOpen] = useState(false);
  
  // Estados para dependentes
  const [dependents, setDependents] = useState<Array<{
    name: string;
    relationship: string;
    birthDate: string;
    cpf: string;
    rg: string;
  }>>([]);

  // Estados para importação de PDF
  const [showPDFImport, setShowPDFImport] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<any | null>(null);

  // Carregar dados para os selects
  useEffect(() => {
    if (open) {
      loadSelectData();
    }
  }, [open]);

  // Buscar usuários no backend baseado no termo de busca
  useEffect(() => {
    const searchUsers = async () => {
      try {
        // Verificar se o termo de busca é um CPF (apenas números)
        const isCpfSearch = /^\d+$/.test(userSearchTerm.replace(/\D/g, ''));
        
        if (isCpfSearch && userSearchTerm.replace(/\D/g, '').length >= 11) {
          // Buscar por CPF
          try {
            const userByCpf = await userService.getUserByCpf(userSearchTerm.replace(/\D/g, ''));
            setFilteredUsers([userByCpf]);
          } catch (cpfError) {
            // Se não encontrar por CPF, fazer busca normal
            const searchResults = await userService.searchUsers(userSearchTerm);
            setFilteredUsers(searchResults);
          }
        } else {
          // Busca normal por nome, email ou username
          const searchResults = await userService.searchUsers(userSearchTerm);
          setFilteredUsers(searchResults);
        }
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        setFilteredUsers([]);
      }
    };

    // Debounce para evitar muitas requisições
    const timeoutId = setTimeout(() => {
      if (userSearchTerm.trim()) {
        searchUsers();
      } else {
        setFilteredUsers([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userSearchTerm]);

  // Buscar cargos no backend baseado no termo de busca
  useEffect(() => {
    const searchPositions = async () => {
      try {
        const searchResults = await positionService.searchPositions(positionSearchTerm);
        setFilteredPositions(searchResults);
      } catch (error) {
        console.error('Erro ao buscar cargos:', error);
        setFilteredPositions([]);
      }
    };

    // Debounce para evitar muitas requisições
    const timeoutId = setTimeout(() => {
      searchPositions();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [positionSearchTerm]);

  // Atualizar usuário selecionado quando form.user muda
  useEffect(() => {
    if (form.user?.id) {
      const user = users.find(u => u.id === form.user.id);
      setSelectedUser(user || null);
      if (user) {
        setUserSearchTerm(user.name);
      }
    } else {
      setSelectedUser(null);
      setUserSearchTerm('');
    }
  }, [form.user?.id, users]);

  // Atualizar cargo selecionado quando form.position muda
  useEffect(() => {
    if (form.position?.id) {
      const position = positions.find(p => p.id === form.position.id);
      setSelectedPosition(position || null);
      if (position) {
        setPositionSearchTerm(position.name);
      }
    } else {
      setSelectedPosition(null);
      setPositionSearchTerm('');
    }
  }, [form.position?.id, positions]);

  // Atualizar campo address quando campos separados são alterados
  useEffect(() => {
    if (form.enderecoRua || form.enderecoNumero || form.enderecoBairro || form.enderecoCidade || form.enderecoEstado || form.enderecoCep) {
      const partes = [
        form.enderecoRua,
        form.enderecoNumero ? `nº ${form.enderecoNumero}` : '',
        form.enderecoComplemento || '',
        form.enderecoBairro,
        form.enderecoCidade,
        form.enderecoEstado,
        form.enderecoCep ? `CEP: ${form.enderecoCep}` : ''
      ].filter(Boolean);
      
      const enderecoCompleto = partes.join(', ');
      
      setForm(prev => ({
        ...prev,
        address: enderecoCompleto
      }));
    }
  }, [form.enderecoRua, form.enderecoNumero, form.enderecoComplemento, form.enderecoBairro, form.enderecoCidade, form.enderecoEstado, form.enderecoCep]);

  const loadSelectData = async () => {
    setLoadingData(true);
    try {
      const [positionsData, unitsData, companiesData] = await Promise.all([
        positionService.searchPositions(), // Usar searchPositions para carregar todos
        unitService.getAllUnits(),
        companyService.getAllCompanies()
      ]);
      setPositions(positionsData);
      setFilteredPositions(positionsData);
      setUnits(unitsData);
      setCompanies(companiesData);
      
      // Carregar usuários iniciais (sem filtro)
      const usersData = await userService.searchUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (err) {
      console.error('Erro ao carregar dados dos selects:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle bankData fields
    if (name.startsWith('bankData.')) {
      const field = name.split('.')[1];
      setForm((prev) => ({
        ...prev,
        bankData: {
          ...(prev.bankData || { bank: '', agency: '', account: '', type: 'CORRENTE' }),
          [field]: value
        }
      }));
    } else if (name === 'cbo') {
      const normalized = value.replace(/\D/g, '');
      const matched = positions.find(p => (p.cbo || '').replace(/\D/g, '') === normalized);
      if (matched) {
        setSelectedPosition(matched);
        setPositionSearchTerm(matched.name);
        setForm(prev => ({
          ...prev,
          cbo: value,
          position: { id: matched.id }
        }));
      } else {
        setForm((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    if (value) {
      setForm((prev) => ({ 
        ...prev, 
        [field]: { id: value } 
      }));
    } else {
      setForm((prev) => {
        const newForm = { ...prev };
        if (field === 'position') {
          newForm.position = { id: '' };
        } else if (field === 'unit') {
          newForm.unit = { id: '' };
        } else if (field === 'user') {
          newForm.user = { id: '' };
        } else if (field === 'company') {
          newForm.company = { id: '' };
        }
        return newForm;
      });
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de formato de email (se preenchido)
    if (form.email && form.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        setError('Por favor, insira um email válido.');
        return;
      }
    }
    
    // Validações básicas
    if (!form.name || !form.cpf || !form.phone) {
      setError('Campos obrigatórios: Nome, CPF e Telefone.');
      return;
    }
    
    // Validações de endereço
    if (!form.enderecoRua || !form.enderecoNumero || !form.enderecoBairro || !form.enderecoCidade || !form.enderecoEstado || !form.enderecoCep) {
      setError('Todos os campos de endereço são obrigatórios (Rua, Número, Bairro, Cidade, Estado e CEP).');
      return;
    }

    // Validar dependentes
    for (let i = 0; i < dependents.length; i++) {
      const dependent = dependents[i];
      if (!dependent.name.trim()) {
        setError(`Nome do dependente ${i + 1} é obrigatório.`);
        return;
      }
      if (!dependent.relationship) {
        setError(`Parentesco do dependente ${i + 1} é obrigatório.`);
        return;
      }
      if (!dependent.birthDate) {
        setError(`Data de nascimento do dependente ${i + 1} é obrigatória.`);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      // Incluir dependentes no payload (mas não enviar na criação/edição de funcionário)
      // Os dependentes devem ser gerenciados separadamente
      const employeeData = {
        ...form
        // Removido: dependents - não enviar dependentes no payload do funcionário
      };
      
      if (isEditMode && employeeToEdit?.id) {
        // Modo de edição
        const updatedEmployee = await employeeService.updateEmployee(employeeToEdit.id, employeeData);
        const savedId = updatedEmployee?.id || employeeToEdit.id;
        console.log('✅ Funcionário atualizado - ID:', savedId);
        console.log('✅ updatedEmployee:', updatedEmployee);
        setCurrentEmployeeId(savedId);
        toast({
          title: "Sucesso!",
          description: "Funcionário atualizado com sucesso.",
          variant: "default"
        });
        onCreated(); // Atualizar lista
        // Não fechar o modal para permitir gerar fichas
      } else {
        // Modo de criação
        const createdEmployee = await employeeService.createEmployee(employeeData);
        console.log('✅ Funcionário criado - ID:', createdEmployee.id);
        console.log('✅ createdEmployee:', createdEmployee);
        setCurrentEmployeeId(createdEmployee.id);
        setIsEditMode(true); // Mudar para modo de edição após criar
        
        // Salvar dependentes pendentes após criar o funcionário
        if (pendingDependents.length > 0 && createdEmployee.id) {
          try {
            for (const dependentData of pendingDependents) {
              await dependentService.createDependent({
                ...dependentData,
                employeeId: createdEmployee.id
              });
            }
            toast({
              title: "Sucesso!",
              description: `Funcionário criado com sucesso. ${pendingDependents.length} dependente(s) adicionado(s).`,
              variant: "default"
            });
            setPendingDependents([]);
          } catch (err: any) {
            console.error('Erro ao salvar dependentes:', err);
            toast({
              title: "Aviso",
              description: "Funcionário criado, mas houve erro ao salvar alguns dependentes. Você pode adicioná-los depois.",
              variant: "default"
            });
          }
        } else {
          toast({
            title: "Sucesso!",
            description: "Funcionário criado com sucesso.",
            variant: "default"
          });
        }
        
        onCreated();
        
        // Não limpar o formulário nem fechar o modal após criar
        // Permitir que o usuário gere as fichas imediatamente
      }
    } catch (err: any) {
      console.error('Erro ao cadastrar funcionário:', err);
      
      // Tratar erros específicos
      if (err.message.includes('CPF já cadastrado')) {
        setError('CPF já cadastrado para outro funcionário');
      } else if (err.message.includes('Email já cadastrado')) {
        setError('Email já cadastrado para outro funcionário');
      } else {
        setError('Erro ao cadastrar funcionário.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentEmployeeId(null);
    setIsEditMode(false);
    setForm(initialState);
    setPhotoPreview(null);
    setError(null);
    setUserSearchTerm('');
  };

  const handleCargoCreated = (cargo: { id: string; name: string; description: string }) => {
    // Adicionar o novo cargo à lista
    setPositions(prev => [...prev, cargo]);
    // Selecionar automaticamente o novo cargo
    setForm(prev => ({ ...prev, position: { id: cargo.id } }));
  };

  const handleMedicoCreated = (medico: Doctor) => {
    // Adicionar o novo médico à lista
    setDoctors(prev => [...prev, medico]);
    // Selecionar automaticamente o novo médico
    setSelectedDoctor(medico);
    setDoctorSearchTerm(`${medico.name} - CRM ${medico.crmNumber}/${medico.crmState}`);
    setForm(prev => ({ 
      ...prev, 
      exameMedicoDoctor: { id: medico.id } 
    }));
    setShowDoctorDropdown(false);
    toast({
      title: "Sucesso!",
      description: "Médico cadastrado e selecionado com sucesso.",
      variant: "default"
    });
  };

  const handleUsuarioPadraoCriado = (usuario: User) => {
    // Adicionar o novo usuário à lista
    setUsers(prev => [...prev, usuario]);
    setFilteredUsers(prev => [...prev, usuario]);
    // Selecionar automaticamente o novo usuário
    setForm(prev => ({ ...prev, user: { id: usuario.id } }));
    setSelectedUser(usuario);
    setUserSearchTerm(usuario.name);
    setCriarUsuarioModalOpen(false);
    
    // Fechar o modal principal após criar o usuário
    onClose();
  };

  // Funções para importação de PDF
  const handlePDFFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setPdfError('Apenas arquivos PDF são aceitos');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setPdfError('Arquivo muito grande. Máximo 10MB');
        return;
      }
      setPdfFile(file);
      setPdfError(null);
    }
  };

  const handleProcessPDF = async () => {
    if (!pdfFile) return;

    setPdfProcessing(true);
    setPdfError(null);
    setPdfSuccess(false);

    try {
      // Processar no backend
      const data = await employeeService.processEmployeeForm(pdfFile);
      // Converter para tipo esperado pelo preenchimento
      fillFormWithPDFData(data as EmployeeDataFromPDF);
      // Guardar pré-visualização por blocos
      setExtractedPreview({
        employer: data?.employer || {},
        employee: data?.employee || {},
        contract: data?.contract || {},
        fgts: data?.fgts || {},
        pis: data?.pis || {},
        voter: data?.voter || {},
        foreigner: data?.foreigner || {},
        notes: data?.notes || ''
      });
      setPdfSuccess(true);
      setShowPDFImport(false);
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      setPdfError('Erro ao processar PDF. Tente novamente.');
    } finally {
      setPdfProcessing(false);
    }
  };

  const fillFormWithPDFData = (data: any) => {
    // Suporte a novo formato por blocos do backend
    const employer = data?.employer || {};
    const employee = data?.employee || {};
    const contract = data?.contract || {};
    const fgts = data?.fgts || {};
    const pis = data?.pis || {};
    const voter = data?.voter || {};
    const foreigner = data?.foreigner || {};

    // Criar objeto combinado com retrocompatibilidade
    const combined: EmployeeDataFromPDF = {
      // Employer
      empresaNome: employer.companyName ?? data.empresaNome,
      empresaCnpj: employer.cnpj ?? data.empresaCnpj,
      empresaEndereco: employer.address ?? data.empresaEndereco,
      // Employee
      name: employee.name ?? data.name,
      cpf: employee.cpf ?? data.cpf,
      rg: employee.rg ?? data.rg,
      carteiraIdentidadeOrgaoEmissor: employee.issuingAuthority ?? data.carteiraIdentidadeOrgaoEmissor,
      birthDate: employee.birthDate ?? data.birthDate,
      nationality: employee.nationality ?? data.nationality,
      maritalStatus: employee.maritalStatus ?? data.maritalStatus,
      nomePai: employee.fatherName ?? data.nomePai,
      nomeMae: employee.motherName ?? data.nomeMae,
      address: employee.address ?? data.address,
      cep: employee.cep ?? data.cep,
      city: employee.city ?? data.city,
      // Contract
      hireDate: contract.admissionDate ?? data.hireDate,
      position: contract.position ?? data.position,
      cbo: contract.cbo ?? data.cbo,
      salary: contract.salary ?? (data as any).salary,
      periodoPagamento: contract.paymentPeriod ?? (data as any).periodoPagamento,
      horarioTrabalho: contract.workSchedule ?? data.horarioTrabalho,
      folgaSemanal: contract.weeklyRest ?? data.folgaSemanal,
      // FGTS
      fgtsOptante: fgts.optante ?? data.fgtsOptante,
      fgtsDataOpcao: fgts.optionDate ?? data.fgtsDataOpcao,
      fgtsBancoDepositario: fgts.bank ?? data.fgtsBancoDepositario,
      // PIS
      pis: pis.number ?? data.pis,
      pisDataCadastro: pis.registeredAt ?? data.pisDataCadastro,
      pisBancoDepositario: pis.bank ?? data.pisBancoDepositario,
      pisEnderecoBanco: pis.address ?? (data as any).pisEnderecoBanco,
      pisCodigoBanco: pis.bankCode ?? (data as any).pisCodigoBanco,
      pisCodigoAgencia: pis.agencyCode ?? (data as any).pisCodigoAgencia,
      // Voter
      tituloEleitor: voter.titulo ?? data.tituloEleitor,
      tituloEleitorZona: voter.zona ?? data.tituloEleitorZona,
      tituloEleitorSecao: voter.secao ?? data.tituloEleitorSecao,
      // Foreigner (opcional)
      spouseName: foreigner.spouseName ?? data.spouseName,
      notes: data.notes ?? data.observations,
    } as any;

    setForm(prev => ({
      ...prev,
      // Employer
      empresaNome: combined.empresaNome || prev.empresaNome,
      empresaCnpj: combined.empresaCnpj || prev.empresaCnpj,
      empresaEndereco: combined.empresaEndereco || prev.empresaEndereco,
      // Employee
      name: combined.name || prev.name,
      cpf: combined.cpf || prev.cpf,
      rg: combined.rg || prev.rg,
      birthDate: combined.birthDate || prev.birthDate,
      nationality: combined.nationality || prev.nationality,
      maritalStatus: combined.maritalStatus || prev.maritalStatus,
      address: combined.address || prev.address,
      city: combined.city || prev.city,
      cep: combined.cep || prev.cep,
      hireDate: combined.hireDate || prev.hireDate,
      email: data.email || prev.email,
      phone: data.phone || prev.phone,
      notes: combined.notes || prev.notes,
      
      // Campos adicionais
      tituloEleitor: combined.tituloEleitor || prev.tituloEleitor,
      tituloEleitorZona: combined.tituloEleitorZona || prev.tituloEleitorZona,
      carteiraIdentidadeOrgaoEmissor: combined.carteiraIdentidadeOrgaoEmissor || prev.carteiraIdentidadeOrgaoEmissor,
      cnhNumber: data.cnhNumber || prev.cnhNumber,
      certificadoMilitar: data.certificadoMilitar || prev.certificadoMilitar,
      nomePai: combined.nomePai || prev.nomePai,
      nomeMae: combined.nomeMae || prev.nomeMae,
      localNascimento: data.localNascimento || prev.localNascimento,
      municipioNascimento: data.municipioNascimento || prev.municipioNascimento,
      estadoNascimento: data.estadoNascimento || prev.estadoNascimento,
      sexo: data.sexo || prev.sexo,
      grauInstrucao: data.grauInstrucao || prev.grauInstrucao,
      matriculaEsocial: data.matriculaEsocial || prev.matriculaEsocial,
      cbo: combined.cbo || prev.cbo,
      salario: combined.salary || prev.salario,
      salarioPorExtenso: data.salarioPorExtenso || prev.salarioPorExtenso,
      periodoPagamento: combined.periodoPagamento || prev.periodoPagamento,
      horarioTrabalho: combined.horarioTrabalho || prev.horarioTrabalho,
      folgaSemanal: combined.folgaSemanal || prev.folgaSemanal,
      escalaTrabalho: combined.escalaTrabalho || prev.escalaTrabalho,
      fgtsOptante: combined.fgtsOptante !== undefined ? combined.fgtsOptante : prev.fgtsOptante,
      fgtsDataOpcao: combined.fgtsDataOpcao || prev.fgtsDataOpcao,
      fgtsBancoDepositario: combined.fgtsBancoDepositario || prev.fgtsBancoDepositario,
      pis: combined.pis || prev.pis,
      pisDataCadastro: combined.pisDataCadastro || prev.pisDataCadastro,
      pisBancoDepositario: combined.pisBancoDepositario || prev.pisBancoDepositario,
      vistoFiscalizacao: data.vistoFiscalizacao || prev.vistoFiscalizacao,
      
      // Dados do cônjuge
      spouseName: combined.spouseName || prev.spouseName,
      spouseCpf: data.spouseCpf || prev.spouseCpf,
      spouseRg: data.spouseRg || prev.spouseRg,
      spouseBirthDate: data.spouseBirthDate || prev.spouseBirthDate,
      spouseProfession: data.spouseProfession || prev.spouseProfession,
      spousePhone: data.spousePhone || prev.spousePhone,
    }));

    // Se há dados de dependentes, adicionar
    if (data.dependents && data.dependents.length > 0) {
      setDependents(data.dependents);
    }

    // Pré-preencher cargo a partir do PDF, se houver correspondência
    const positionText = combined.position || data.position;
    if (positionText && positionText.trim()) {
      const normalized = positionText.trim().toLowerCase();
      const matched = positions.find(p => (p.name || '').trim().toLowerCase() === normalized);
      if (matched) {
        setSelectedPosition(matched);
        setPositionSearchTerm(matched.name);
        setForm(prev => ({ ...prev, position: { id: matched.id } }));
      } else {
        // Preenche o campo de busca para facilitar a seleção/criação
        setPositionSearchTerm(positionText);
      }
    }
  };

  const handleUserSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserSearchTerm(value);
    setShowUserDropdown(true);
    
    // Se o campo estiver vazio, limpar seleção
    if (value.trim() === '') {
      setForm(prev => ({ ...prev, user: { id: '' } }));
      setSelectedUser(null);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setUserSearchTerm(user.name);
    setForm(prev => ({ ...prev, user: { id: user.id } }));
    setShowUserDropdown(false);
  };

  const handleUserInputFocus = () => {
    setShowUserDropdown(true);
  };

  const handleUserInputBlur = () => {
    // Delay para permitir clique no dropdown
    setTimeout(() => {
      setShowUserDropdown(false);
    }, 200);
  };

  const handlePositionSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPositionSearchTerm(value);
    setShowPositionDropdown(true);

    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      setSelectedPosition(null);
      setForm(prev => ({ ...prev, position: { id: '' } }));
      return;
    }

    const matched = positions.find(p => (p.name || '').trim().toLowerCase() === normalized);
    if (matched) {
      setSelectedPosition(matched);
      setForm(prev => ({
        ...prev,
        position: { id: matched.id },
        cbo: matched.cbo || prev.cbo || ''
      }));
    }
  };

  const handlePositionSelect = (position: Position) => {
    setSelectedPosition(position);
    setPositionSearchTerm(position.name);
    setForm(prev => ({ 
      ...prev, 
      position: { id: position.id },
      // Preencher CBO automaticamente se o cargo tiver CBO
      cbo: position.cbo || prev.cbo || ''
    }));
    setShowPositionDropdown(false);
  };

  const handlePositionInputFocus = () => {
    setShowPositionDropdown(true);
  };

  const handlePositionInputBlur = () => {
    // Delay para permitir clique no dropdown
    setTimeout(() => {
      setShowPositionDropdown(false);
    }, 200);
  };

  const handleCompanySelect = (companyId: string) => {
    if (companyId === 'none') {
      setSelectedCompany(null);
      setForm(prev => ({ ...prev, company: { id: '' } }));
    } else {
      const company = companies.find(c => c.id === companyId);
      if (company) {
        setSelectedCompany(company);
        setForm(prev => ({ ...prev, company: { id: company.id } }));
      }
    }
  };

  // Funções para gerenciar dependentes
  const addDependent = () => {
    setDependents(prev => [...prev, {
      name: '',
      relationship: '',
      birthDate: '',
      cpf: '',
      rg: ''
    }]);
  };

  const removeDependent = (index: number) => {
    setDependents(prev => prev.filter((_, i) => i !== index));
  };

  const updateDependent = (index: number, field: string, value: string) => {
    setDependents(prev => prev.map((dependent, i) => 
      i === index ? { ...dependent, [field]: value } : dependent
    ));
  };

  // Verificar se o cargo selecionado permite criação de usuário padrão
  const canCreateDefaultUser = selectedPosition && 
    ['Vigia', 'Vigilante', 'Porteiro', 'Auxiliar de Serviços Gerais', 'Supervisor'].some(cargo => 
      selectedPosition.name.toLowerCase().includes(cargo.toLowerCase())
    );

  const employeeIdValue = currentEmployeeId || employeeToEdit?.id || '';
  const employeeDisplayName = form.name || employeeToEdit?.name || 'Funcionário';
  const canGenerateReports = Boolean(employeeIdValue);

  const openBlobInNewTab = (blob: Blob) => {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleEmployeeRecordPdf = async (mode: 'download' | 'preview') => {
    if (!employeeIdValue) {
      toast({
        title: "Atenção",
        description: "É necessário salvar o funcionário primeiro para gerar a ficha.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const blob = await employeeService.generateEmployeeRecordPdf(employeeIdValue);
      if (mode === 'preview') {
        openBlobInNewTab(blob);
      } else {
        downloadBlob(blob, `ficha-registro-funcionario-${employeeIdValue}.pdf`);
      }
      toast({
        title: "Sucesso",
        description: "Ficha de registro gerada com sucesso!",
        variant: "default"
      });
    } catch (error: any) {
      console.error('❌ Erro ao gerar ficha:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar a ficha.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeRecordExcel = async () => {
    if (!employeeIdValue) {
      toast({
        title: "Atenção",
        description: "É necessário salvar o funcionário primeiro para gerar a ficha.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const blob = await employeeService.generateEmployeeRecordExcel(employeeIdValue);
      downloadBlob(blob, `ficha-registro-funcionario-${employeeIdValue}.xlsx`);
      toast({
        title: "Sucesso",
        description: "Ficha de registro em Excel gerada com sucesso!",
        variant: "default"
      });
    } catch (error: any) {
      console.error('❌ Erro ao gerar ficha em Excel:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar a ficha em Excel.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEpiPdf = async (mode: 'download' | 'preview') => {
    if (!employeeIdValue) {
      toast({
        title: "Atenção",
        description: "É necessário salvar o funcionário primeiro para gerar a ficha de EPI.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const employee = await employeeService.getEmployeeById(employeeIdValue);
      if (!employee) {
        throw new Error('Funcionário não encontrado');
      }

      if (!employee.company || !employee.company.id) {
        toast({
          title: "Atenção",
          description: "O funcionário precisa ter uma empresa cadastrada para gerar a ficha de EPI.",
          variant: "destructive"
        });
        return;
      }

      const epiFormData = {
        employeeId: employeeIdValue,
        companyId: employee.company.id,
        deliveryDate: new Date().toISOString().split('T')[0],
        items: []
      };

      const blob = await epiDeliveryFormService.generateAndSavePdf(epiFormData);
      if (mode === 'preview') {
        openBlobInNewTab(blob);
      } else {
        downloadBlob(blob, `ficha-entrega-epi-${employeeIdValue}.pdf`);
      }
      toast({
        title: "Sucesso",
        description: "Ficha de entrega de EPI gerada com sucesso!",
        variant: "default"
      });
    } catch (error: any) {
      console.error('❌ Erro ao gerar ficha de EPI:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar a ficha de EPI.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEpiExcel = async () => {
    if (!employeeIdValue) {
      toast({
        title: "Atenção",
        description: "É necessário salvar o funcionário primeiro para gerar a ficha de EPI.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const employee = await employeeService.getEmployeeById(employeeIdValue);
      if (!employee) {
        throw new Error('Funcionário não encontrado');
      }

      if (!employee.company || !employee.company.id) {
        toast({
          title: "Atenção",
          description: "O funcionário precisa ter uma empresa cadastrada para gerar a ficha de EPI.",
          variant: "destructive"
        });
        return;
      }

      const epiFormData = {
        employeeId: employeeIdValue,
        companyId: employee.company.id,
        deliveryDate: new Date().toISOString().split('T')[0],
        items: []
      };

      const blob = await epiDeliveryFormService.generateAndSaveExcel(epiFormData);
      downloadBlob(blob, `ficha-entrega-epi-${employeeIdValue}.xlsx`);
      toast({
        title: "Sucesso",
        description: "Ficha de entrega de EPI em Excel gerada com sucesso!",
        variant: "default"
      });
    } catch (error: any) {
      console.error('❌ Erro ao gerar ficha de EPI em Excel:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar a ficha de EPI em Excel.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountingPdf = async () => {
    if (!employeeIdValue) {
      toast({
        title: "Atenção",
        description: "É necessário salvar o funcionário primeiro para gerar a ficha.",
        variant: "destructive"
      });
      return;
    }

    try {
      await accountingFormService.downloadPdf(employeeIdValue, employeeDisplayName);
      toast({
        title: "✅ Ficha Gerada",
        description: "Ficha de contabilidade gerada e baixada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao gerar ficha de contabilidade:', error);
      toast({
        title: "❌ Erro",
        description: "Erro ao gerar ficha de contabilidade. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleAccountingExcel = async () => {
    if (!employeeIdValue) {
      toast({
        title: "Atenção",
        description: "É necessário salvar o funcionário primeiro para gerar a ficha.",
        variant: "destructive"
      });
      return;
    }

    try {
      await accountingFormService.downloadExcel(employeeIdValue, employeeDisplayName);
      toast({
        title: "✅ Ficha Gerada",
        description: "Ficha de contabilidade em Excel gerada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao gerar ficha de contabilidade em Excel:', error);
      toast({
        title: "❌ Erro",
        description: "Erro ao gerar ficha de contabilidade em Excel. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleAccountingPreview = async () => {
    if (!employeeIdValue) {
      toast({
        title: "Atenção",
        description: "É necessário salvar o funcionário primeiro para visualizar a ficha.",
        variant: "destructive"
      });
      return;
    }

    try {
      await accountingFormService.generateHtml(employeeIdValue);
    } catch (error) {
      console.error('Erro ao visualizar ficha de contabilidade:', error);
      toast({
        title: "❌ Erro",
        description: "Erro ao visualizar ficha de contabilidade. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <TooltipProvider>
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Só fechar se o usuário explicitamente fechar (X ou ESC)
      // Não fechar automaticamente após salvar
      if (!isOpen) {
        // Só fechar se não estiver carregando e não houver funcionário salvo recentemente
        if (!loading) {
          onClose();
        }
      }
    }}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 mx-4 sm:mx-0 bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-seguranca-yellow p-4 sm:p-6 text-white sticky top-0 z-10">
          <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl md:text-2xl font-bold">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
              <UserIcon className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <span className="truncate">{isEditMode ? 'Editar Funcionário' : 'Novo Funcionário'}</span>
          </DialogTitle>
          <DialogDescription className="text-white/90 text-xs sm:text-sm mt-1">
            {isEditMode 
              ? 'Edite os dados do funcionário. Campos marcados com * são obrigatórios.'
              : 'Preencha os dados do funcionário. Campos marcados com * são obrigatórios.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Botão de Importação de PDF */}
          <div className="flex justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPDFImport(!showPDFImport)}
              className="flex items-center gap-2 border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black"
            >
              <Upload className="h-4 w-4" />
              Importar PDF
            </Button>
          </div>
          
          {/* Seção de Importação de PDF */}
          {showPDFImport && (
            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <div className="p-4">
              <h4 className="text-lg font-semibold text-seguranca-yellow mb-3 flex items-center">
                <FileCheck className="mr-2" size={20} />
                Importar FICHA DE REGISTRO DOS EMPREGADOS
              </h4>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-seguranca-lightgray">
                    Selecionar arquivo PDF
                  </Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handlePDFFileChange}
                    className="mt-1 bg-seguranca-black border-seguranca-lightgray/30 text-white"
                  />
                  <p className="text-xs text-seguranca-lightgray/60 mt-1">
                    Apenas arquivos PDF. Máximo 10MB.
                  </p>
                </div>
                
                {pdfFile && (
                  <div className="flex items-center gap-2 p-2 bg-seguranca-black rounded border border-seguranca-lightgray/30">
                    <FileText className="h-4 w-4 text-seguranca-yellow" />
                    <span className="text-sm text-white">{pdfFile.name}</span>
                    <span className="text-xs text-seguranca-lightgray/60">
                      ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                )}
                
                {pdfError && (
                  <div className="flex items-center gap-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{pdfError}</span>
                  </div>
                )}
                
            {pdfSuccess && (
                  <div className="flex items-center gap-2 p-2 bg-green-900/20 border border-green-500/30 rounded text-green-400">
                    <FileCheck className="h-4 w-4" />
                    <span className="text-sm">PDF processado com sucesso! Formulário preenchido automaticamente.</span>
                  </div>
                )}

            {extractedPreview && (
              <div className="mt-3 p-3 bg-seguranca-black rounded border border-seguranca-lightgray/30 text-sm text-white">
                <h5 className="font-semibold mb-2">Pré-visualização dos dados extraídos</h5>
                <div className="space-y-2">
                  <details className="bg-[#2a2a2a] rounded p-2" open>
                    <summary className="cursor-pointer font-medium">Dados da Empresa</summary>
                    <div className="flex justify-end mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fillFormWithPDFData({ employer: extractedPreview.employer })}
                        className="h-7 text-xs"
                      >
                        Aplicar este bloco
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(extractedPreview.employer || {}).map(([k,v]) => (
                        v ? <div key={k}><span className="text-gray-400">{k}:</span> {String(v)}</div> : null
                      ))}
                    </div>
                  </details>
                  <details className="bg-[#2a2a2a] rounded p-2">
                    <summary className="cursor-pointer font-medium">Dados do Funcionário</summary>
                    <div className="flex justify-end mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fillFormWithPDFData({ employee: extractedPreview.employee })}
                        className="h-7 text-xs"
                      >
                        Aplicar este bloco
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(extractedPreview.employee || {}).map(([k,v]) => (
                        v ? <div key={k}><span className="text-gray-400">{k}:</span> {String(v)}</div> : null
                      ))}
                    </div>
                  </details>
                  <details className="bg-[#2a2a2a] rounded p-2">
                    <summary className="cursor-pointer font-medium">Vínculo Empregatício</summary>
                    <div className="flex justify-end mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fillFormWithPDFData({ contract: extractedPreview.contract })}
                        className="h-7 text-xs"
                      >
                        Aplicar este bloco
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(extractedPreview.contract || {}).map(([k,v]) => (
                        v ? <div key={k}><span className="text-gray-400">{k}:</span> {String(v)}</div> : null
                      ))}
                    </div>
                  </details>
                  <details className="bg-[#2a2a2a] rounded p-2">
                    <summary className="cursor-pointer font-medium">FGTS</summary>
                    <div className="flex justify-end mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fillFormWithPDFData({ fgts: extractedPreview.fgts })}
                        className="h-7 text-xs"
                      >
                        Aplicar este bloco
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(extractedPreview.fgts || {}).map(([k,v]) => (
                        (v !== undefined && v !== null && String(v).length > 0) ? <div key={k}><span className="text-gray-400">{k}:</span> {String(v)}</div> : null
                      ))}
                    </div>
                  </details>
                  <details className="bg-[#2a2a2a] rounded p-2">
                    <summary className="cursor-pointer font-medium">PIS</summary>
                    <div className="flex justify-end mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fillFormWithPDFData({ pis: extractedPreview.pis })}
                        className="h-7 text-xs"
                      >
                        Aplicar este bloco
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(extractedPreview.pis || {}).map(([k,v]) => (
                        v ? <div key={k}><span className="text-gray-400">{k}:</span> {String(v)}</div> : null
                      ))}
                    </div>
                  </details>
                  <details className="bg-[#2a2a2a] rounded p-2">
                    <summary className="cursor-pointer font-medium">Título de Eleitor</summary>
                    <div className="flex justify-end mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fillFormWithPDFData({ voter: extractedPreview.voter })}
                        className="h-7 text-xs"
                      >
                        Aplicar este bloco
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(extractedPreview.voter || {}).map(([k,v]) => (
                        v ? <div key={k}><span className="text-gray-400">{k}:</span> {String(v)}</div> : null
                      ))}
                    </div>
                  </details>
                  <details className="bg-[#2a2a2a] rounded p-2">
                    <summary className="cursor-pointer font-medium">Quando Estrangeiro</summary>
                    <div className="flex justify-end mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fillFormWithPDFData({ foreigner: extractedPreview.foreigner })}
                        className="h-7 text-xs"
                      >
                        Aplicar este bloco
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(extractedPreview.foreigner || {}).map(([k,v]) => (
                        v ? <div key={k}><span className="text-gray-400">{k}:</span> {String(v)}</div> : null
                      ))}
                    </div>
                  </details>
                  {extractedPreview.notes ? (
                    <div className="bg-[#2a2a2a] rounded p-2">
                      <div className="font-medium">Observações</div>
                      <div className="text-xs mt-1">{extractedPreview.notes}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleProcessPDF}
                    disabled={!pdfFile || pdfProcessing}
                    className="flex items-center gap-2 bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
                  >
                    {pdfProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-seguranca-black"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <FileCheck className="h-4 w-4" />
                        Processar PDF
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPDFImport(false);
                      setPdfFile(null);
                      setPdfError(null);
                      setPdfSuccess(false);
                    }}
                    className="border-seguranca-lightgray/30 text-seguranca-lightgray hover:bg-seguranca-lightgray/10"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
              </div>
            </Card>
          )}
        
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <Tabs defaultValue="cadastro" className="space-y-4 sm:space-y-6">
                    <TabsList className="grid w-full grid-cols-3 bg-seguranca-graphite border border-gray-600">
                      <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
                      <TabsTrigger value="dependentes">Dependentes</TabsTrigger>
                      <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
                    </TabsList>
                    <TabsContent value="cadastro" className="space-y-4 sm:space-y-6">
           {/* Seção: Relacionamentos Obrigatórios */}
           <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
             <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
             <div className="flex items-center gap-2 sm:gap-3">
               <div className="p-1.5 sm:p-2 bg-seguranca-yellow/20 rounded-lg">
                 <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
               </div>
               <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white">
                 Relacionamentos Obrigatórios
               </h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
               {/* Seleção de Usuário */}
               <div className="space-y-2">
                 <Label className="text-xs sm:text-sm font-medium text-gray-200">
                   Usuário do Sistema
                 </Label>
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                   <Input
                     placeholder="Digite nome, email, username ou CPF para buscar usuário..."
                     value={userSearchTerm}
                     onChange={handleUserSearch}
                     onFocus={handleUserInputFocus}
                     onBlur={handleUserInputBlur}
                     className="pl-9 sm:pl-10 text-xs sm:text-sm h-9 sm:h-10"
                   />
                   
                   {/* Dropdown de usuários */}
                   {showUserDropdown && filteredUsers.length > 0 && (
                     <div className="absolute z-50 w-full mt-1 bg-seguranca-graphite border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                       {filteredUsers.map((user) => (
                         <div
                           key={user.id}
                           className="px-3 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-600 last:border-b-0"
                           onClick={() => handleUserSelect(user)}
                         >
                           <div className="flex flex-col">
                             <span className="font-medium text-seguranca-lightgray">{user.name}</span>
                             <span className="text-xs text-gray-400">
                               {user.email} • {user.username} • {user.role}
                             </span>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                   
                   {/* Mensagem quando não há resultados */}
                   {showUserDropdown && userSearchTerm.trim() !== '' && filteredUsers.length === 0 && (
                     <div className="absolute z-50 w-full mt-1 bg-seguranca-graphite border border-gray-600 rounded-lg shadow-lg p-3">
                       <p className="text-sm text-gray-400">Nenhum usuário encontrado</p>
                     </div>
                   )}
                 </div>
                 
                 {/* Exibir usuário selecionado */}
                 {selectedUser && (
                   <div className="bg-green-900/20 border border-green-600 rounded-lg p-3">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-green-400">Usuário selecionado:</p>
                         <p className="text-sm text-seguranca-lightgray">{selectedUser.name}</p>
                         <p className="text-xs text-gray-400">{selectedUser.email}</p>
                       </div>
                       <Button
                         type="button"
                         variant="ghost"
                         size="sm"
                         onClick={() => {
                           setSelectedUser(null);
                           setUserSearchTerm('');
                           setForm(prev => ({ ...prev, user: { id: '' } }));
                         }}
                         className="text-red-400 hover:text-red-300"
                       >
                         <X className="h-4 w-4" />
                       </Button>
                     </div>
                   </div>
                 )}
                 <div className="flex items-center justify-between">
                 <p className="text-xs text-gray-300">
                   O usuário selecionado será associado ao funcionário para acesso ao sistema. (Opcional)
                   {canCreateDefaultUser && (
                     <span className="block mt-1 text-seguranca-yellow">
                       Para este cargo, é recomendado criar um usuário padrão.
                     </span>
                   )}
                 </p>
                   {canCreateDefaultUser && (
                     <Button
                       type="button"
                       variant="ghost"
                       size="sm"
                       onClick={() => setCriarUsuarioModalOpen(true)}
                       className="text-seguranca-yellow hover:text-yellow-400 text-xs px-2 py-1 h-auto"
                     >
                       <UserPlus className="h-3 w-3 mr-1" />
                       Criar Usuário Padrão
                       <Link className="h-3 w-3 ml-1" />
                     </Button>
                   )}
                 </div>
               </div>

             </div>
             </div>
           </Card>

           {/* Seção: Informações Pessoais */}
           <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
             <div className="p-4 space-y-4">
             <div className="flex items-center gap-2 sm:gap-3">
               <div className="p-1.5 sm:p-2 bg-seguranca-red/20 rounded-lg">
                 <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
               </div>
               <h3 className="text-lg font-semibold text-white">Informações Pessoais</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <Label className="text-sm font-medium text-gray-200">Nome Completo *</Label>
                 <Input 
                   name="name" 
                   value={form.name} 
                   onChange={handleChange} 
                   required 
                 />
               </div>
               <div>
                 <Label className="text-sm font-medium text-gray-200">CPF *</Label>
                 <Input 
                   name="cpf" 
                   value={form.cpf} 
                   onChange={handleChange} 
                   required 
                   placeholder="000.000.000-00"
                 />
               </div>
               <div>
                 <Label className="text-sm font-medium text-gray-200">RG</Label>
                 <Input 
                   name="rg" 
                   value={form.rg} 
                   onChange={handleChange} 
                 />
               </div>
               <div>
                 <Label className="text-sm font-medium text-gray-200">Data de Nascimento *</Label>
                 <Input
                   name="birthDate"
                   type="date"
                   value={form.birthDate}
                   onChange={handleChange}
                   required
                 />
               </div>
               <div>
                 <Label className="text-sm font-medium text-gray-200">Sexo</Label>
                 <Select 
                   value={form.sexo || ''} 
                   onValueChange={(value) => setForm(prev => ({ ...prev, sexo: value }))}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione o sexo" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="MASCULINO">Masculino</SelectItem>
                     <SelectItem value="FEMININO">Feminino</SelectItem>
                     <SelectItem value="OUTRO">Outro</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label className="text-sm font-medium text-gray-200">Município de Nascimento</Label>
                 <Input 
                   name="municipioNascimento" 
                   value={form.municipioNascimento || ''} 
                   onChange={handleChange} 
                   placeholder="Ex: Belo Horizonte"
                 />
               </div>
               <div>
                 <Label className="text-sm font-medium text-gray-200">Estado de Nascimento</Label>
                 <Select 
                   value={form.estadoNascimento || ''} 
                   onValueChange={(value) => setForm(prev => ({ ...prev, estadoNascimento: value }))}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione o estado" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="AC">Acre</SelectItem>
                     <SelectItem value="AL">Alagoas</SelectItem>
                     <SelectItem value="AP">Amapá</SelectItem>
                     <SelectItem value="AM">Amazonas</SelectItem>
                     <SelectItem value="BA">Bahia</SelectItem>
                     <SelectItem value="CE">Ceará</SelectItem>
                     <SelectItem value="DF">Distrito Federal</SelectItem>
                     <SelectItem value="ES">Espírito Santo</SelectItem>
                     <SelectItem value="GO">Goiás</SelectItem>
                     <SelectItem value="MA">Maranhão</SelectItem>
                     <SelectItem value="MT">Mato Grosso</SelectItem>
                     <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                     <SelectItem value="MG">Minas Gerais</SelectItem>
                     <SelectItem value="PA">Pará</SelectItem>
                     <SelectItem value="PB">Paraíba</SelectItem>
                     <SelectItem value="PR">Paraná</SelectItem>
                     <SelectItem value="PE">Pernambuco</SelectItem>
                     <SelectItem value="PI">Piauí</SelectItem>
                     <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                     <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                     <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                     <SelectItem value="RO">Rondônia</SelectItem>
                     <SelectItem value="RR">Roraima</SelectItem>
                     <SelectItem value="SC">Santa Catarina</SelectItem>
                     <SelectItem value="SP">São Paulo</SelectItem>
                     <SelectItem value="SE">Sergipe</SelectItem>
                     <SelectItem value="TO">Tocantins</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label className="text-sm font-medium text-gray-200">Grau de Instrução</Label>
                 <Select 
                   value={form.grauInstrucao || ''} 
                   onValueChange={(value) => setForm(prev => ({ ...prev, grauInstrucao: value }))}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione o grau de instrução" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="ANALFABETO">Analfabeto</SelectItem>
                     <SelectItem value="FUNDAMENTAL_INCOMPLETO">Ensino Fundamental Incompleto</SelectItem>
                     <SelectItem value="FUNDAMENTAL_COMPLETO">Ensino Fundamental Completo</SelectItem>
                     <SelectItem value="MEDIO_INCOMPLETO">Ensino Médio Incompleto</SelectItem>
                     <SelectItem value="MEDIO_COMPLETO">Ensino Médio Completo</SelectItem>
                     <SelectItem value="SUPERIOR_INCOMPLETO">Ensino Superior Incompleto</SelectItem>
                     <SelectItem value="SUPERIOR_COMPLETO">Ensino Superior Completo</SelectItem>
                     <SelectItem value="POS_GRADUACAO">Pós-Graduação</SelectItem>
                     <SelectItem value="MESTRADO">Mestrado</SelectItem>
                     <SelectItem value="DOUTORADO">Doutorado</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label className="text-sm font-medium text-gray-200">Matrícula do eSocial</Label>
                 <Input 
                   name="matriculaEsocial" 
                   value={form.matriculaEsocial || ''} 
                   onChange={handleChange} 
                   placeholder="Matrícula do eSocial (opcional)"
                 />
               </div>
               <div>
                 <Label className="text-sm font-medium text-gray-200">Estado Civil</Label>
                 <Select 
                   value={form.maritalStatus} 
                   onValueChange={(value) => setForm(prev => ({ ...prev, maritalStatus: value }))}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione o estado civil" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="SINGLE">Solteiro</SelectItem>
                     <SelectItem value="MARRIED">Casado</SelectItem>
                     <SelectItem value="DIVORCED">Divorciado</SelectItem>
                     <SelectItem value="WIDOWED">Viúvo</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label className="text-sm font-medium text-gray-200">Nacionalidade</Label>
                 <Input 
                   name="nationality" 
                   value={form.nationality} 
                   onChange={handleChange} 
                   className="text-xs sm:text-sm h-9 sm:h-10"
                 />
               </div>
             </div>
             
             {/* Dados Familiares (Nomes dos pais) */}
             <div className="mt-4 pt-4 border-t border-gray-600">
               <h4 className="text-md font-semibold text-white mb-4">Dados Familiares (Nomes dos pais)</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Nome da Mãe</Label>
                   <Input 
                     name="nomeMae" 
                     value={form.nomeMae || ''} 
                     onChange={handleChange} 
                     placeholder="Nome completo da mãe"
                     className="text-xs sm:text-sm h-9 sm:h-10"
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Nome do Pai</Label>
                   <Input 
                     name="nomePai" 
                     value={form.nomePai || ''} 
                     onChange={handleChange} 
                     placeholder="Nome completo do pai"
                     className="text-xs sm:text-sm h-9 sm:h-10"
                   />
                 </div>
               </div>
             </div>
             
             {/* Título de Eleitor */}
             <div className="mt-4 pt-4 border-t border-gray-600">
               <h4 className="text-md font-semibold text-white mb-4">Título de Eleitor</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Número</Label>
                   <Input 
                     name="tituloEleitor" 
                     value={form.tituloEleitor || ''} 
                     onChange={handleChange} 
                     placeholder="Ex: 2236.5048.0205"
                     className="text-xs sm:text-sm h-9 sm:h-10"
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Zona</Label>
                   <Input 
                     name="tituloEleitorZona" 
                     value={form.tituloEleitorZona || ''} 
                     onChange={handleChange} 
                     placeholder="Ex: 316"
                     className="text-xs sm:text-sm h-9 sm:h-10"
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Seção</Label>
                   <Input 
                     name="tituloEleitorSecao" 
                     value={form.tituloEleitorSecao || ''} 
                     onChange={handleChange} 
                     placeholder="Ex: 0585"
                     className="text-xs sm:text-sm h-9 sm:h-10"
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Data de Expedição</Label>
                   <Input 
                     name="tituloEleitorDataExpedicao" 
                     type="date" 
                     value={form.tituloEleitorDataExpedicao || ''} 
                     onChange={handleChange} 
                     className="text-xs sm:text-sm h-9 sm:h-10"
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Validade</Label>
                   <Input 
                     name="tituloEleitorValidade" 
                     type="date" 
                     value={form.tituloEleitorValidade || ''} 
                     onChange={handleChange} 
                     className="text-xs sm:text-sm h-9 sm:h-10"
                   />
                 </div>
               </div>
             </div>
             
             {/* Registro Geral (RG) */}
             <div className="mt-4 pt-4 border-t border-gray-600">
               <h4 className="text-md font-semibold text-white mb-4">Registro Geral (RG)</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Número</Label>
                   <Input 
                     name="rg" 
                     value={form.rg || ''} 
                     onChange={handleChange} 
                     placeholder="Ex: MG-15.934.064"
                     className="text-xs sm:text-sm h-9 sm:h-10"
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Órgão Emissor</Label>
                   <Input 
                     name="carteiraIdentidadeOrgaoEmissor" 
                     value={form.carteiraIdentidadeOrgaoEmissor || ''} 
                     onChange={handleChange} 
                     placeholder="Ex: PF"
                     className="text-xs sm:text-sm h-9 sm:h-10"
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Data de Expedição</Label>
                   <Input 
                     name="carteiraIdentidadeDataEmissao" 
                     type="date" 
                     value={form.carteiraIdentidadeDataEmissao || ''} 
                     onChange={handleChange} 
                     className="text-xs sm:text-sm h-9 sm:h-10"
                   />
                 </div>
               </div>
             </div>
             
             {/* Nome do Conselho Regional */}
             <div className="mt-4 pt-4 border-t border-gray-600">
               <h4 className="text-md font-semibold text-white mb-4">Nome do Conselho Regional</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Sigla</Label>
                   <Input 
                     name="nomeConselhoRegional" 
                     value={form.nomeConselhoRegional || ''} 
                     onChange={handleChange} 
                     placeholder="Ex: CRM, CRO, etc."
                     className="text-xs sm:text-sm h-9 sm:h-10"
                   />
                 </div>
               </div>
             </div>
             
             {/* Seção de Documentos Pessoais */}
             <div className="mt-4 pt-4 border-t border-gray-600">
               <h4 className="text-md font-semibold text-seguranca-yellow mb-4 flex items-center">
                 <FileText className="mr-2" size={16} />
                 Documentos Pessoais
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* CNH */}
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Número da CNH</Label>
                   <Input 
                     name="cnhNumber" 
                     value={form.cnhNumber || ''} 
                     onChange={handleChange} 
                     placeholder="00000000000"
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Categoria da CNH</Label>
                   <Select 
                     value={form.cnhCategory || ''} 
                     onValueChange={(value) => setForm(prev => ({ ...prev, cnhCategory: value }))}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Selecione a categoria" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="A">A - Motocicleta</SelectItem>
                       <SelectItem value="B">B - Carro</SelectItem>
                       <SelectItem value="C">C - Caminhão</SelectItem>
                       <SelectItem value="D">D - Ônibus</SelectItem>
                       <SelectItem value="E">E - Carreta</SelectItem>
                       <SelectItem value="AB">AB - Moto e Carro</SelectItem>
                       <SelectItem value="AC">AC - Moto e Caminhão</SelectItem>
                       <SelectItem value="AD">AD - Moto e Ônibus</SelectItem>
                       <SelectItem value="AE">AE - Moto e Carreta</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Validade da CNH</Label>
                   <Input 
                     name="cnhExpirationDate" 
                     type="date" 
                     value={form.cnhExpirationDate || ''} 
                     onChange={handleChange} 
                   />
                 </div>
                 
                 {/* CTPS */}
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Número da CTPS</Label>
                   <Input 
                     name="ctps" 
                     value={form.ctps || ''} 
                     onChange={handleChange} 
                     placeholder="0000000"
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Série da CTPS</Label>
                   <Input 
                     name="ctpsSeries" 
                     value={form.ctpsSeries || ''} 
                     onChange={handleChange} 
                     placeholder="0000"
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Data de Emissão da CTPS</Label>
                   <Input 
                     name="ctpsIssueDate" 
                     type="date" 
                     value={form.ctpsIssueDate || ''} 
                     onChange={handleChange} 
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Órgão Emissor da CTPS</Label>
                   <Input 
                     name="ctpsIssuingAgency" 
                     value={form.ctpsIssuingAgency || ''} 
                     onChange={handleChange} 
                     placeholder="Ex: SSP, DETRAN"
                   />
                 </div>
                 
                 {/* Upload PDF da CTPS Digital */}
                 <div className="md:col-span-2">
                   <Label className="text-sm font-medium text-gray-200">Upload do PDF da CTPS Digital</Label>
                   <Input 
                     type="file"
                     accept=".pdf"
                     onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                         setForm(prev => ({ ...prev, ctpsDigitalPdf: file }));
                       }
                     }}
                     className="mt-1"
                   />
                 </div>
                 
                 {/* CIN - Carteira de Identidade Nacional */}
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Número do CIN</Label>
                   <Input 
                     name="cinNumero" 
                     value={form.cinNumero || ''} 
                     onChange={handleChange} 
                     placeholder="Número do CIN"
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Órgão Emissor do CIN</Label>
                   <Input 
                     name="cinOrgaoEmissor" 
                     value={form.cinOrgaoEmissor || ''} 
                     onChange={handleChange} 
                     placeholder="Ex: SSP, DETRAN"
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-gray-200">Data de Emissão do CIN</Label>
                   <Input 
                     name="cinDataEmissao" 
                     type="date" 
                     value={form.cinDataEmissao || ''} 
                     onChange={handleChange} 
                   />
                 </div>
               </div>
             </div>
             
             {/* Seção de dados do cônjuge - aparece apenas se estado civil for "Casado" */}
             {form.maritalStatus === 'MARRIED' && (
               <div className="mt-4 pt-4 border-t border-gray-600">
                 <h4 className="text-md font-semibold text-seguranca-yellow mb-4 flex items-center">
                   <UserIcon className="mr-2" size={16} />
                   Dados do Cônjuge
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <Label className="text-sm font-medium text-gray-200">Nome do Cônjuge *</Label>
                     <Input 
                       name="spouseName" 
                       value={form.spouseName || ''} 
                       onChange={handleChange} 
                       required 
                       placeholder="Nome completo do cônjuge"
                     />
                   </div>
                   <div>
                     <Label className="text-sm font-medium text-gray-200">CPF do Cônjuge *</Label>
                     <Input 
                       name="spouseCpf" 
                       value={form.spouseCpf || ''} 
                       onChange={handleChange} 
                       required 
                       placeholder="000.000.000-00"
                     />
                   </div>
                   <div>
                     <Label className="text-sm font-medium text-gray-200">RG do Cônjuge *</Label>
                     <Input 
                       name="spouseRg" 
                       value={form.spouseRg || ''} 
                       onChange={handleChange} 
                       required 
                       placeholder="Número do RG"
                     />
                   </div>
                   <div>
                     <Label className="text-sm font-medium text-gray-200">Data de Nascimento do Cônjuge *</Label>
                     <Input 
                       name="spouseBirthDate" 
                       type="date" 
                       value={form.spouseBirthDate || ''} 
                       onChange={handleChange} 
                       required 
                     />
                   </div>
                   <div>
                     <Label className="text-sm font-medium text-gray-200">Profissão do Cônjuge</Label>
                     <Input 
                       name="spouseProfession" 
                       value={form.spouseProfession || ''} 
                       onChange={handleChange} 
                       placeholder="Profissão do cônjuge"
                     />
                   </div>
                   <div>
                     <Label className="text-sm font-medium text-gray-200">Telefone do Cônjuge</Label>
                     <Input 
                       name="spousePhone" 
                       value={form.spousePhone || ''} 
                       onChange={handleChange} 
                       placeholder="(00) 00000-0000"
                     />
                   </div>
                 </div>
               </div>
             )}
             
            {/* Seção de dependentes removida do formulário de criação. A gestão de dependentes permanece no modo de edição via modal dedicado. */}
             </div>
           </Card>

           {/* Seção: Informações de Contato */}
           <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
             <div className="p-4 space-y-4">
             <div className="flex items-center gap-2 sm:gap-3">
               <div className="p-1.5 sm:p-2 bg-seguranca-yellow/20 rounded-lg">
                 <Link className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
               </div>
               <h3 className="text-lg font-semibold text-white">Informações de Contato</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-200">Email</Label>
                <Input 
                  name="email" 
                  type="email" 
                  value={form.email} 
                  onChange={handleChange}
                  placeholder="exemplo@email.com"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">WhatsApp *</Label>
                <Input 
                  name="phone" 
                  value={aplicarMascaraTelefone(form.phone || '')} 
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, '');
                    setForm(prev => ({ ...prev, phone: valor }));
                  }}
                  required 
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
               <div>
                 <Label className="text-sm font-medium text-gray-200">Telefone de Contato</Label>
                 <Input 
                   name="telefoneContato" 
                   value={aplicarMascaraTelefone(form.telefoneContato || '')} 
                   onChange={(e) => {
                     const valor = e.target.value.replace(/\D/g, '');
                     setForm(prev => ({ ...prev, telefoneContato: valor }));
                   }}
                   placeholder="(00) 00000-0000"
                   maxLength={15}
                 />
               </div>
             </div>
             </div>
           </Card>
            
           {/* Seção: Endereço Separado */}
           <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
             <div className="p-4 space-y-4">
               <div className="flex items-center gap-2 sm:gap-3">
                 <div className="p-1.5 sm:p-2 bg-seguranca-yellow/20 rounded-lg">
                   <Building className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
                 </div>
                 <h4 className="text-md font-semibold text-seguranca-yellow">Endereço</h4>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-xs sm:text-sm font-medium text-gray-200">CEP *</Label>
                  <div className="flex gap-2">
                    <Input 
                      name="enderecoCep" 
                      value={aplicarMascaraCep(form.enderecoCep || '')} 
                      onChange={(e) => {
                        const valor = e.target.value.replace(/\D/g, '');
                        setForm(prev => ({ ...prev, enderecoCep: valor }));
                        if (valor.length === 8) {
                          buscarCep(valor);
                        }
                      }}
                      placeholder="00000-000"
                      maxLength={9}
                      required
                      className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
                    />
                    {loadingCep && (
                      <div className="flex items-center px-2 sm:px-3 text-gray-400">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs sm:text-sm font-medium text-gray-200">Rua/Logradouro *</Label>
                  <Input 
                    name="enderecoRua" 
                    value={form.enderecoRua || ''} 
                    onChange={handleChange} 
                    placeholder="Nome da rua, avenida, etc."
                    required
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-200">Número *</Label>
                  <Input 
                    name="enderecoNumero" 
                    value={form.enderecoNumero || ''} 
                    onChange={handleChange} 
                    placeholder="123"
                    required
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-200">Complemento</Label>
                  <Input 
                    name="enderecoComplemento" 
                    value={form.enderecoComplemento || ''} 
                    onChange={handleChange} 
                    placeholder="Apto, Bloco, etc."
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-200">Bairro *</Label>
                  <Input 
                    name="enderecoBairro" 
                    value={form.enderecoBairro || ''} 
                    onChange={handleChange} 
                    placeholder="Nome do bairro"
                    required
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-200">Cidade *</Label>
                  <Input 
                    name="enderecoCidade" 
                    value={form.enderecoCidade || ''} 
                    onChange={handleChange} 
                    placeholder="Nome da cidade"
                    required
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-200">Estado (UF) *</Label>
                  <Input 
                    name="enderecoEstado" 
                    value={form.enderecoEstado || ''} 
                    onChange={(e) => {
                      const valor = e.target.value.toUpperCase().substring(0, 2);
                      setForm(prev => ({ ...prev, enderecoEstado: valor }));
                    }}
                    placeholder="MG"
                    maxLength={2}
                    required
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>
              </div>
            </div>
           </Card>

          {/* Seção: Dados Bancários */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-seguranca-yellow/20 rounded-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
                </div>
                <h3 className="text-lg font-semibold text-white">Dados Bancários</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-200">Banco</Label>
                  <Input 
                    name="bankData.bank" 
                    value={form.bankData?.bank || ''} 
                    onChange={handleChange} 
                    placeholder="Nome do banco"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-200">Agência</Label>
                  <Input 
                    name="bankData.agency" 
                    value={form.bankData?.agency || ''} 
                    onChange={handleChange} 
                    placeholder="0000"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-200">Conta Corrente</Label>
                  <Input 
                    name="bankData.account" 
                    value={form.bankData?.account || ''} 
                    onChange={handleChange} 
                    placeholder="00000-0"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Seção: Dados do Exame Médico (ASO) */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-seguranca-red/20 rounded-lg">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
              </div>
              <h3 className="text-lg font-semibold text-white">Dados do Exame Médico (ASO)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-200">Data do Exame Médico (ASO)</Label>
                <Input 
                  name="exameMedicoData" 
                  type="date"
                  value={form.exameMedicoData || ''} 
                  onChange={(e) => setForm(prev => ({ ...prev, exameMedicoData: e.target.value }))} 
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Tipo de Exame Realizado</Label>
                <Select 
                  value={form.exameMedicoTipo || ''} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, exameMedicoTipo: value }))}
                >
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="ADMISSIONAL" className="text-seguranca-lightgray hover:bg-gray-700">Admissional</SelectItem>
                    <SelectItem value="DEMISSIONAL" className="text-seguranca-lightgray hover:bg-gray-700">Demissional</SelectItem>
                    <SelectItem value="PERIODICO" className="text-seguranca-lightgray hover:bg-gray-700">Periódico</SelectItem>
                    <SelectItem value="MUDANCA_FUNCAO" className="text-seguranca-lightgray hover:bg-gray-700">Mudança de Função</SelectItem>
                    <SelectItem value="RETORNO_TRABALHO" className="text-seguranca-lightgray hover:bg-gray-700">Retorno ao Trabalho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-200">Nome do Médico</Label>
                <div className="relative">
                  <Input 
                    value={doctorSearchTerm} 
                    onChange={(e) => {
                      setDoctorSearchTerm(e.target.value);
                      setShowDoctorDropdown(true);
                      if (e.target.value.length > 0) {
                        handleDoctorSearch(e.target.value);
                      } else {
                        loadDoctors();
                      }
                    }}
                    onFocus={() => {
                      setShowDoctorDropdown(true);
                      if (doctors.length === 0) {
                        loadDoctors();
                      }
                    }}
                    onBlur={() => {
                      // Delay para permitir clique no dropdown
                      setTimeout(() => setShowDoctorDropdown(false), 200);
                    }}
                    placeholder="Digite para buscar médico..."
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                  {showDoctorDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-seguranca-graphite border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                      {loadingDoctors ? (
                        <div className="p-2 text-sm text-gray-400">Carregando...</div>
                      ) : doctors.length > 0 ? (
                        doctors.map((doctor) => (
                          <div
                            key={doctor.id}
                            className="p-2 hover:bg-gray-700 cursor-pointer text-seguranca-lightgray text-xs sm:text-sm"
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setDoctorSearchTerm(`${doctor.name} - CRM ${doctor.crmNumber}/${doctor.crmState}`);
                              setForm(prev => ({ 
                                ...prev, 
                                exameMedicoDoctor: { id: doctor.id } 
                              }));
                              setShowDoctorDropdown(false);
                            }}
                          >
                            {doctor.name} - CRM {doctor.crmNumber}/{doctor.crmState}
                          </div>
                        ))
                      ) : (
                        <div className="p-2 space-y-2">
                          <div className="text-sm text-gray-400 mb-2">Nenhum médico encontrado</div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setNovoMedicoModalOpen(true);
                              setShowDoctorDropdown(false);
                            }}
                            className="w-full text-left p-2 text-sm text-seguranca-yellow hover:bg-gray-700 rounded border border-seguranca-yellow/30 flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Cadastrar novo médico</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Horário</Label>
                <Input 
                  name="exameMedicoHorario" 
                  value={form.exameMedicoHorario || ''} 
                  onChange={(e) => setForm(prev => ({ ...prev, exameMedicoHorario: e.target.value }))} 
                  placeholder="Ex: 18:00 ÀS 06:00 H"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Intervalos Almoço/Janta</Label>
                <RadioGroup 
                  value={form.exameMedicoIntervalosRefeicao === true ? 'sim' : form.exameMedicoIntervalosRefeicao === false ? 'nao' : ''}
                  onValueChange={(value) => setForm(prev => ({ ...prev, exameMedicoIntervalosRefeicao: value === 'sim' }))}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="intervalos-sim" className="text-seguranca-lightgray" />
                    <Label htmlFor="intervalos-sim" className="text-gray-300 cursor-pointer text-xs sm:text-sm">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="intervalos-nao" className="text-seguranca-lightgray" />
                    <Label htmlFor="intervalos-nao" className="text-gray-300 cursor-pointer text-xs sm:text-sm">Não</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-200">Observações</Label>
                <Textarea 
                  name="exameMedicoObservacoes" 
                  value={form.exameMedicoObservacoes || ''} 
                  onChange={(e) => setForm(prev => ({ ...prev, exameMedicoObservacoes: e.target.value }))} 
                  placeholder="Observações sobre o exame médico..."
                  rows={3}
                  className="text-xs sm:text-sm bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Este é o primeiro registro (1º emprego)?</Label>
                <RadioGroup 
                  value={form.exameMedicoPrimeiroEmprego === true ? 'sim' : form.exameMedicoPrimeiroEmprego === false ? 'nao' : ''}
                  onValueChange={(value) => setForm(prev => ({ ...prev, exameMedicoPrimeiroEmprego: value === 'sim' }))}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="primeiro-sim" className="text-seguranca-lightgray" />
                    <Label htmlFor="primeiro-sim" className="text-gray-300 cursor-pointer text-xs sm:text-sm">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="primeiro-nao" className="text-seguranca-lightgray" />
                    <Label htmlFor="primeiro-nao" className="text-gray-300 cursor-pointer text-xs sm:text-sm">Não</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Contribuição Sindical está pago este ano?</Label>
                <RadioGroup 
                  value={form.exameMedicoContribuicaoSindicalPaga === true ? 'sim' : form.exameMedicoContribuicaoSindicalPaga === false ? 'nao' : ''}
                  onValueChange={(value) => setForm(prev => ({ ...prev, exameMedicoContribuicaoSindicalPaga: value === 'sim' }))}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="sindical-sim" className="text-seguranca-lightgray" />
                    <Label htmlFor="sindical-sim" className="text-gray-300 cursor-pointer text-xs sm:text-sm">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="sindical-nao" className="text-seguranca-lightgray" />
                    <Label htmlFor="sindical-nao" className="text-gray-300 cursor-pointer text-xs sm:text-sm">Não</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            </div>
           </Card>

          {/* Seção: Para Estrangeiro */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-seguranca-yellow/20 rounded-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
              </div>
              <h3 className="text-lg font-semibold text-white">Para Estrangeiro</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-200">RNE nº</Label>
                <Input 
                  name="rneNumero" 
                  value={form.rneNumero || ''} 
                  onChange={(e) => setForm(prev => ({ ...prev, rneNumero: e.target.value }))} 
                  placeholder="Número do RNE"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Validade</Label>
                <Input 
                  name="rneValidade" 
                  type="date"
                  value={form.rneValidade || ''} 
                  onChange={(e) => setForm(prev => ({ ...prev, rneValidade: e.target.value }))} 
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Possui filhos com brasileiro?</Label>
                <RadioGroup 
                  value={form.temFilhosBrasileiros === true ? 'sim' : form.temFilhosBrasileiros === false ? 'nao' : ''}
                  onValueChange={(value) => setForm(prev => ({ ...prev, temFilhosBrasileiros: value === 'sim' }))}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="filhos-brasileiros-sim" className="text-seguranca-lightgray" />
                    <Label htmlFor="filhos-brasileiros-sim" className="text-gray-300 cursor-pointer text-xs sm:text-sm">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="filhos-brasileiros-nao" className="text-seguranca-lightgray" />
                    <Label htmlFor="filhos-brasileiros-nao" className="text-gray-300 cursor-pointer text-xs sm:text-sm">Não</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Quantos?</Label>
                <Input 
                  name="quantidadeFilhosBrasileiros" 
                  type="number"
                  min="0"
                  value={form.quantidadeFilhosBrasileiros || ''} 
                  onChange={(e) => setForm(prev => ({ ...prev, quantidadeFilhosBrasileiros: e.target.value ? parseInt(e.target.value) : undefined }))} 
                  placeholder="Quantidade"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                  disabled={form.temFilhosBrasileiros !== true}
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-200 mb-2 block">
                  Em caso de estrangeiro naturalizado brasileiro, informar o Nº RIC / Órgão Emissor / Data Emissão:
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-300">Nº RIC</Label>
                    <Input 
                      name="ricNumero" 
                      value={form.ricNumero || ''} 
                      onChange={(e) => setForm(prev => ({ ...prev, ricNumero: e.target.value }))} 
                      placeholder="Número do RIC"
                      className="text-xs sm:text-sm h-9 sm:h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-300">Órgão Emissor</Label>
                    <Input 
                      name="ricOrgaoEmissor" 
                      value={form.ricOrgaoEmissor || ''} 
                      onChange={(e) => setForm(prev => ({ ...prev, ricOrgaoEmissor: e.target.value }))} 
                      placeholder="Órgão Emissor"
                      className="text-xs sm:text-sm h-9 sm:h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-300">Data Emissão</Label>
                    <Input 
                      name="ricDataEmissao" 
                      type="date"
                      value={form.ricDataEmissao || ''} 
                      onChange={(e) => setForm(prev => ({ ...prev, ricDataEmissao: e.target.value }))} 
                      className="text-xs sm:text-sm h-9 sm:h-10"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Tipo de Visto</Label>
                <Input 
                  name="tipoVisto" 
                  value={form.tipoVisto || ''} 
                  onChange={(e) => setForm(prev => ({ ...prev, tipoVisto: e.target.value }))} 
                  placeholder="Tipo de visto"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
            </div>
            </div>
          </Card>

          {/* Seção: Dados do Cadastro / Admissão */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-seguranca-red/20 rounded-lg">
                <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
              </div>
              <h3 className="text-lg font-semibold text-white">Dados do Cadastro / Admissão</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-200">PIS</Label>
                <Input 
                  name="pis" 
                  value={form.pis || ''} 
                  onChange={handleChange} 
                  placeholder="000.00000.00-0"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Reservista nº</Label>
                <Input 
                  name="certificadoMilitar" 
                  value={form.certificadoMilitar || ''} 
                  onChange={handleChange} 
                  placeholder="Número do certificado militar"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Data de Admissão *</Label>
                <Input 
                  name="hireDate" 
                  type="date" 
                  value={form.hireDate} 
                  onChange={handleChange} 
                  required 
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Setor/Posto de Trabalho</Label>
                <Select 
                  value={(form as any).workPostId || ''}
                  onValueChange={(value) => setForm(prev => ({ ...(prev as any), workPostId: value }))}
                >
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue placeholder="Selecione um posto" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    {workPosts.map((wp) => (
                      <SelectItem key={wp.id} value={wp.id} className="text-seguranca-lightgray hover:bg-gray-700">
                        {wp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Salário (R$)</Label>
                <Input 
                  name="salario" 
                  type="number" 
                  step="0.01"
                  value={form.salario as any || ''} 
                  onChange={handleChange} 
                  placeholder="0,00"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Forma de Pagamento</Label>
                <Select 
                  value={form.periodoPagamento || ''} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, periodoPagamento: value }))}
                >
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue placeholder="Selecione a forma" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="MENSAL" className="text-seguranca-lightgray hover:bg-gray-700">Mensal</SelectItem>
                    <SelectItem value="QUINZENAL" className="text-seguranca-lightgray hover:bg-gray-700">Quinzenal</SelectItem>
                    <SelectItem value="SEMANAL" className="text-seguranca-lightgray hover:bg-gray-700">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Dias de Trabalho</Label>
                <Input 
                  name="diasTrabalho" 
                  value={form.diasTrabalho || ''} 
                  onChange={(e) => setForm(prev => ({ ...prev, diasTrabalho: e.target.value }))} 
                  placeholder="Ex: 12X36"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-200 mb-2 block">Horário de Trabalho</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-300">Intervalo</Label>
                    <Input 
                      name="horarioTrabalhoIntervalo" 
                      value={form.horarioTrabalhoIntervalo || ''} 
                      onChange={(e) => setForm(prev => ({ ...prev, horarioTrabalhoIntervalo: e.target.value }))} 
                      placeholder="Ex: 23:00 ÀS 00:00 H"
                      className="text-xs sm:text-sm h-9 sm:h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-300">Período de Trabalho</Label>
                    <Input 
                      name="horarioTrabalho" 
                      value={form.horarioTrabalho || ''} 
                      onChange={handleChange} 
                      placeholder="Ex: 18:00 ÀS 06:00 H"
                      className="text-xs sm:text-sm h-9 sm:h-10"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Prazo de Experiência</Label>
                <Input 
                  name="prazoExperienciaTexto" 
                  value={form.prazoExperienciaTexto || ''} 
                  onChange={(e) => setForm(prev => ({ ...prev, prazoExperienciaTexto: e.target.value }))} 
                  placeholder="Ex: 45 DIAS"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Prorrogação</Label>
                <Input 
                  name="prorrogacaoExperiencia" 
                  value={form.prorrogacaoExperiencia || ''} 
                  onChange={(e) => setForm(prev => ({ ...prev, prorrogacaoExperiencia: e.target.value }))} 
                  placeholder="Prorrogação do prazo"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Dias de Folga</Label>
                <Input 
                  name="folgaSemanal" 
                  value={form.folgaSemanal || ''} 
                  onChange={handleChange} 
                  placeholder="Ex: 1ª Escola"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Escala de Trabalho</Label>
                <Input 
                  name="escalaTrabalho" 
                  value={form.escalaTrabalho || ''} 
                  onChange={handleChange} 
                  placeholder="Ex: 12x36, 6x1, etc."
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
            </div>
            </div>
          </Card>

          {/* Seção: Informações Profissionais */}
           <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
             <div className="p-4 space-y-4">
             <div className="flex items-center gap-2 sm:gap-3">
               <div className="p-1.5 sm:p-2 bg-seguranca-yellow/20 rounded-lg">
                 <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
               </div>
               <h3 className="text-lg font-semibold text-white">Informações Profissionais</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <Label className="text-sm font-medium text-gray-200">Número de Registro</Label>
                 <Input 
                   name="registrationNumber" 
                   value={form.registrationNumber} 
                   onChange={handleChange} 
                   placeholder="EMP001"
                   className="text-xs sm:text-sm h-9 sm:h-10"
                 />
               </div>
              {/* Cargo */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-200">
                  Cargo
                </Label>
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="text"
                        value={positionSearchTerm}
                        onChange={handlePositionSearch}
                        onFocus={handlePositionInputFocus}
                        onBlur={handlePositionInputBlur}
                        placeholder="Digite para buscar cargo..."
                        className="pr-10"
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      
                      {/* Dropdown de cargos */}
                      {showPositionDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredPositions.length > 0 ? (
                            filteredPositions.map((position) => (
                              <div
                                key={position.id}
                                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                                onClick={() => handlePositionSelect(position)}
                              >
                                <Briefcase className="mr-2" size={16} />
                                <div className="flex-1">
                                  <div className="font-medium">{position.name}</div>
                                  {position.description && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {position.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                              Nenhum cargo encontrado
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNovoCargoModalOpen(true)}
                      className="px-3 flex-shrink-0"
                      title="Criar novo cargo"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                  
                  {/* Cargo selecionado */}
                  {selectedPosition && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center justify-between">
                      <div className="flex items-center">
                        <Briefcase className="mr-2 text-blue-600 dark:text-blue-400" size={16} />
                        <span className="text-sm text-blue-800 dark:text-blue-200">
                          {selectedPosition.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPosition(null);
                          setPositionSearchTerm('');
                          setForm(prev => ({ ...prev, position: { id: '' } }));
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-300">
                  Digite para buscar cargos existentes ou clique no botão + para criar um novo.
                </p>
              </div>
               <div>
                 <Label className="text-sm font-medium text-gray-200">Status *</Label>
                <Select 
                  value={form.status} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, status: value }))}
                >
                   <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray text-xs sm:text-sm h-9 sm:h-10">
                     <SelectValue placeholder="Selecione o status" />
                   </SelectTrigger>
                   <SelectContent className="bg-seguranca-graphite border-gray-600">
                     <SelectItem value="ACTIVE" className="text-seguranca-lightgray hover:bg-gray-700">Ativo</SelectItem>
                     <SelectItem value="INACTIVE" className="text-seguranca-lightgray hover:bg-gray-700">Inativo</SelectItem>
                     <SelectItem value="VACATION" className="text-seguranca-lightgray hover:bg-gray-700">Férias</SelectItem>
                     <SelectItem value="TERMINATED" className="text-seguranca-lightgray hover:bg-gray-700">Demitido</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Data de Demissão</Label>
                <Input 
                  name="dataRescisao" 
                  type="date" 
                  value={form.dataRescisao || ''} 
                  onChange={handleChange} 
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              {form.status === 'TERMINATED' && (
                <div className="md:col-span-2 bg-red-900/20 border border-red-500/40 rounded-lg p-3">
                  <p className="text-red-300 text-xs sm:text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    Ao definir o status como Demitido, é obrigatório informar a Data de Demissão.
                  </p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-gray-200">CBO</Label>
                <Input 
                  name="cbo" 
                  value={form.cbo || ''} 
                  onChange={handleChange} 
                  placeholder="Ex: 517410"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Departamento</Label>
                <Select 
                  value={(form as any).departmentId || ''}
                  onValueChange={(value) => setForm(prev => ({ ...(prev as any), departmentId: value }))}
                >
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue placeholder="Selecione um departamento" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-seguranca-lightgray hover:bg-gray-700">
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
               <div>
                 <Label className="text-sm font-medium text-gray-200">Unidade (Opcional)</Label>
                 <Select 
                   value={form.unit?.id || ''} 
                   onValueChange={(value) => handleSelectChange('unit', value)}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione uma unidade" />
                   </SelectTrigger>
                   <SelectContent>
                     {units.map((unit) => (
                       <SelectItem key={unit.id} value={unit.id}>
                         <div className="flex items-center">
                           <Building className="mr-2" size={16} />
                           {unit.name}
                         </div>
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label className="text-sm font-medium text-gray-200">Empresa (Opcional)</Label>
                 <Select 
                   value={selectedCompany?.id || 'none'} 
                   onValueChange={handleCompanySelect}
                 >
                   <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                     <SelectValue placeholder="Selecione uma empresa" />
                   </SelectTrigger>
                   <SelectContent className="bg-seguranca-graphite border-gray-600">
                     <SelectItem value="none" className="text-seguranca-lightgray hover:bg-gray-700">
                       <span className="text-gray-400">Nenhuma empresa</span>
                     </SelectItem>
                     {companies.map((company) => (
                       <SelectItem 
                         key={company.id} 
                         value={company.id}
                         className="text-seguranca-lightgray hover:bg-gray-700"
                       >
                         {company.sigla ? `${company.sigla.toUpperCase()} - ${company.name}` : company.name}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>
             </div>
           </Card>

          {/* Seção: FGTS */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-seguranca-yellow/20 rounded-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
              </div>
              <h3 className="text-lg font-semibold text-white">FGTS</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-200">Optante pelo FGTS?</Label>
                <Select 
                  value={String(form.fgtsOptante ?? '')} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, fgtsOptante: value === 'true' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Data da Opção</Label>
                <Input 
                  name="fgtsDataOpcao" 
                  type="date" 
                  value={form.fgtsDataOpcao || ''} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Data de Retratação</Label>
                <Input 
                  name="fgtsDataRetratacao" 
                  type="date" 
                  value={form.fgtsDataRetratacao || ''} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Banco Depositário</Label>
                <Input 
                  name="fgtsBancoDepositario" 
                  value={form.fgtsBancoDepositario || ''} 
                  onChange={handleChange} 
                  placeholder="Ex: Banco do Brasil"
                />
              </div>
            </div>
            </div>
          </Card>

          {/* Seção: PIS/PASEP */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-seguranca-yellow/20 rounded-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
              </div>
              <h3 className="text-lg font-semibold text-white">PIS / PASEP</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-200">Número do PIS</Label>
                <Input 
                  name="pis" 
                  value={form.pis || ''} 
                  onChange={handleChange} 
                  placeholder="Número do PIS"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Data de Cadastro</Label>
                <Input 
                  name="pisDataCadastro" 
                  type="date" 
                  value={form.pisDataCadastro || ''} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Banco Depositário do PIS</Label>
                <Input 
                  name="pisBancoDepositario" 
                  value={form.pisBancoDepositario || ''} 
                  onChange={handleChange} 
                  placeholder="Ex: Banco do Brasil"
                />
              </div>
            </div>
            </div>
          </Card>

          {/* Seção: Dados da Empresa (Ficha) - opcional */}

           {/* Seção: Foto e Observações */}
           <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
             <div className="p-4 space-y-4">
             <div className="flex items-center gap-2 sm:gap-3">
               <div className="p-1.5 sm:p-2 bg-seguranca-yellow/20 rounded-lg">
                 <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
               </div>
               <h3 className="text-lg font-semibold text-white">Documentos e Observações</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <Label className="text-sm font-medium text-gray-200">Foto 3x4</Label>
                 <Input 
                   type="file" 
                   accept="image/*" 
                   onChange={handlePhotoChange} 
                 />
                 {photoPreview && (
                   <img 
                     src={photoPreview} 
                     alt="Prévia" 
                     className="mt-2 w-24 h-24 rounded object-cover border" 
                   />
                 )}
               </div>
               <div>
                 <Label className="text-sm font-medium text-gray-200">Observações</Label>
                 <textarea
                   name="notes"
                   value={form.notes || ''}
                   onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                   rows={3}
                   className="w-full rounded px-3 py-2 resize-none border border-gray-600 bg-gray-700 text-white"
                   placeholder="Observações sobre o funcionário..."
                 />
               </div>
             </div>
             </div>
           </Card>

          </TabsContent>
          <TabsContent value="dependentes" className="space-y-4 sm:space-y-6">
          {/* Seção: Dependentes */}
           <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
             <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-seguranca-yellow/20 rounded-lg">
                  <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
                </div>
                <h3 className="text-lg font-semibold text-white">Dependentes</h3>
              </div>
               <Button
                 type="button"
                 onClick={handleAddDependent}
                 disabled={false}
                 className="bg-purple-600 hover:bg-purple-700 text-white"
                 size="sm"
               >
                 <Plus className="mr-2" size={16} />
                 Adicionar Dependente
               </Button>
             </div>

             {/* Permitir adicionar dependentes mesmo na criação - serão salvos após salvar o funcionário */}
             {employeeDependents.length === 0 && !isEditMode ? (
               <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                 <p className="text-blue-300 text-sm flex items-center">
                   <AlertCircle className="mr-2" size={16} />
                   Você pode adicionar dependentes após salvar o funcionário. Eles serão salvos automaticamente.
                 </p>
               </div>
             ) : (
               <div className="space-y-3">
                 {loadingDependents ? (
                   <div className="text-center py-4">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                     <p className="text-gray-400 text-sm mt-2">Carregando dependentes...</p>
                   </div>
                 ) : employeeDependents.length === 0 ? (
                   <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 text-center">
                     <UsersIcon className="mx-auto mb-2 text-gray-400" size={32} />
                     <p className="text-gray-400 text-sm">Nenhum dependente cadastrado</p>
                     <p className="text-gray-500 text-xs mt-1">Clique em "Adicionar Dependente" para começar</p>
                   </div>
                 ) : (
                   <div className="space-y-2">
                     {employeeDependents.map((dependent) => (
                       <div
                         key={dependent.id}
                         className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 hover:border-purple-500/50 transition-colors"
                       >
                         <div className="flex items-start justify-between">
                           <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                               <h4 className="font-semibold text-white">{dependent.name}</h4>
                               <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                 {dependent.relationship}
                               </Badge>
                               {dependent.isStudent && (
                                 <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                   Estudante
                                 </Badge>
                               )}
                               {dependent.isBeneficiary && (
                                 <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                   Beneficiário
                                 </Badge>
                               )}
                             </div>
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                               {dependent.cpf && (
                                 <p className="text-gray-400">
                                   <span className="font-medium">CPF:</span> {dependent.cpf}
                                 </p>
                               )}
                               {dependent.birthDate && (
                                 <p className="text-gray-400">
                                   <span className="font-medium">Nascimento:</span> {new Date(dependent.birthDate).toLocaleDateString('pt-BR')}
                                 </p>
                               )}
                               {dependent.phone && (
                                 <p className="text-gray-400">
                                   <span className="font-medium">Telefone:</span> {dependent.phone}
                                 </p>
                               )}
                             </div>
                           </div>
                           <div className="flex gap-2 ml-4">
                             <Button
                               type="button"
                               variant="ghost"
                               size="sm"
                               onClick={() => handleEditDependent(dependent)}
                               className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                             >
                               <Edit2 size={16} />
                             </Button>
                             <Button
                               type="button"
                               variant="ghost"
                               size="sm"
                               onClick={() => handleDeleteDependent(dependent)}
                               className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                             >
                               <Trash2 size={16} />
                             </Button>
                           </div>
                         </div>
                       </div>
                     ))}
                     <p className="text-gray-400 text-xs mt-2">
                       Total: {employeeDependents.length} dependente(s)
                     </p>
                   </div>
                 )}
               </div>
             )}
             </div>
           </Card>

          </TabsContent>
          <TabsContent value="relatorios" className="space-y-4 sm:space-y-6">
            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-seguranca-yellow/20 rounded-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
                </div>
                <h3 className="text-lg font-semibold text-white">Relatório Resumido</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleEmployeeRecordPdf('download')}
                  disabled={!canGenerateReports || loading}
                  className="border-blue-500 text-blue-400 hover:bg-blue-500/10 h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleEmployeeRecordPdf('preview')}
                  disabled={!canGenerateReports || loading}
                  className="border-gray-500 text-gray-300 hover:bg-gray-500/10 h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEmployeeRecordExcel}
                  disabled={!canGenerateReports || loading}
                  className="border-emerald-500 text-emerald-400 h-9 sm:h-10 text-xs sm:text-sm disabled:opacity-50"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Gerar Excel
                </Button>
              </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-seguranca-yellow/20 rounded-lg">
                  <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
                </div>
                <h3 className="text-lg font-semibold text-white">Ficha de Registro de Funcionário</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleEmployeeRecordPdf('download')}
                  disabled={!canGenerateReports || loading}
                  className="border-blue-500 text-blue-400 hover:bg-blue-500/10 h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleEmployeeRecordPdf('preview')}
                  disabled={!canGenerateReports || loading}
                  className="border-gray-500 text-gray-300 hover:bg-gray-500/10 h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEmployeeRecordExcel}
                  disabled={!canGenerateReports || loading}
                  className="border-emerald-500 text-emerald-400 h-9 sm:h-10 text-xs sm:text-sm disabled:opacity-50"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Gerar Excel
                </Button>
              </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-seguranca-yellow/20 rounded-lg">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
                </div>
                <h3 className="text-lg font-semibold text-white">Ficha de Entrega de EPI</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleEpiPdf('download')}
                    disabled={!canGenerateReports || loading}
                    className="border-green-500 text-green-400 hover:bg-green-500/10 w-full h-9 sm:h-10 text-xs sm:text-sm"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Gerar PDF
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleEpiPdf('preview')}
                    disabled={!canGenerateReports || loading}
                    className="border-gray-500 text-gray-300 hover:bg-gray-500/10 w-full h-9 sm:h-10 text-xs sm:text-sm"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleEpiExcel}
                    disabled={!canGenerateReports || loading}
                    className="border-emerald-500 text-emerald-400 w-full h-9 sm:h-10 text-xs sm:text-sm disabled:opacity-50"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Gerar Excel
                  </Button>
                </div>
                <div className="rounded-lg border border-gray-600 bg-seguranca-black/40 p-3 text-xs text-gray-400">
                  A visualização abre em nova aba para pré-visualizar o PDF gerado.
                </div>
              </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-seguranca-yellow/20 rounded-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
                </div>
                <h3 className="text-lg font-semibold text-white">Dados para Contabilidade</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAccountingPdf}
                  disabled={!canGenerateReports || loading}
                  className="border-red-500 text-red-400 hover:bg-red-500/10 h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAccountingPreview}
                  disabled={!canGenerateReports || loading}
                  className="border-gray-500 text-gray-300 hover:bg-gray-500/10 h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAccountingExcel}
                  disabled={!canGenerateReports || loading}
                  className="border-emerald-500 text-emerald-400 h-9 sm:h-10 text-xs sm:text-sm disabled:opacity-50"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Gerar Excel
                </Button>
              </div>
              </div>
            </Card>
          </TabsContent>
          </Tabs>

          {error && (
             <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
               <p className="text-destructive text-sm">{error}</p>
             </div>
           )}
          
          <DialogFooter className="flex flex-col gap-2 sm:gap-2 pt-3 sm:pt-4 border-t border-gray-600 overflow-x-hidden">
            {/* Botões de ação */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={loading}
                className="w-full h-9 sm:h-10 text-xs sm:text-sm"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-9 sm:h-10 text-xs sm:text-sm bg-seguranca-red hover:bg-seguranca-red/90 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </DialogFooter>
         </form>
        </div>
       </DialogContent>
       
       {/* Modal de Novo Cargo */}
       <NovoCargoModal
         open={novoCargoModalOpen}
         onClose={() => setNovoCargoModalOpen(false)}
         onCargoCreated={handleCargoCreated}
       />

       {/* Modal de Criar Usuário Padrão */}
       <CriarUsuarioPadraoModal
         open={criarUsuarioModalOpen}
         onClose={() => {
           setCriarUsuarioModalOpen(false);
           // Se fechar sem criar usuário, fechar o modal principal também
           onClose();
         }}
         onUsuarioCreated={handleUsuarioPadraoCriado}
         positionName={selectedPosition?.name || ''}
         employeeName={form.name}
         employeeCpf={form.cpf}
         employeePhone={form.phone}
       />

       {/* Modal de Novo Médico */}
       <NovoMedicoModal
         open={novoMedicoModalOpen}
         onClose={() => setNovoMedicoModalOpen(false)}
         onMedicoCreated={handleMedicoCreated}
       />

       {/* Modal de Dependentes */}
       <DependentFormModal
         isOpen={dependentModalOpen}
         onClose={() => {
           setDependentModalOpen(false);
           setDependentToEdit(null);
         }}
         employeeId={employeeToEdit?.id}
         employeeName={employeeToEdit?.name}
         dependent={dependentToEdit || undefined}
         onSuccess={async () => {
           if (!isEditMode || !employeeToEdit?.id) {
             // Se ainda não há funcionário criado, armazenar dependente temporariamente
             // O DependentFormModal retornará os dados do dependente via callback
             setDependentModalOpen(false);
             setDependentToEdit(null);
             toast({
               title: "Aviso",
               description: "Dependente será adicionado após salvar o funcionário.",
               variant: "default"
             });
           } else {
             // Se já há funcionário, usar o callback normal
             await handleDependentSaved();
           }
         }}
       />
     </Dialog>
     </TooltipProvider>
   );
 };

export default FuncionarioNovoModal; 