import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { employeeService } from '@/services/employeeService';
import { UpdateEmployeeDTO } from '@/types/employee';
import { positionService, Position } from '@/services/positionService';
import { unitService, Unit } from '@/services/unitService';
import { userService } from '@/services/userService';
import { companyService } from '@/services/companyService';
import { Company } from '@/types/company';
import { User } from '@/types/user';
import { Employee } from '@/types/employee';
import { Search, User as UserIcon, Building, Briefcase, Plus, FileText } from 'lucide-react';
import NovoCargoModal from '@/components/funcionarios/NovoCargoModal';
import { useToast } from '@/hooks/use-toast';
import workPostService, { WorkPost } from '@/services/workPostService';
import departmentService, { Department } from '@/services/departmentService';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { doctorService } from '@/services/doctorService';
import { Doctor } from '@/types/doctor';

interface FuncionarioEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionario: Employee | null;
  onSuccess: () => void;
}

const FuncionarioEditModal: React.FC<FuncionarioEditModalProps> = ({ 
  open, 
  onOpenChange, 
  funcionario, 
  onSuccess 
}) => {
  const { toast } = useToast();
  const [form, setForm] = useState<UpdateEmployeeDTO>({
    name: '',
    cpf: '',
    rg: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    maritalStatus: 'SINGLE',
    nationality: 'Brasileiro',
    registrationNumber: '',
    hireDate: '',
    status: 'ACTIVE',
    notes: '',
    position: { id: '' },
    unit: { id: '' },
    user: { id: '' },
    company: { id: '' },
    bankData: {
      bank: '',
      agency: '',
      account: '',
      type: 'CORRENTE'
    },
    // Campos do cônjuge
    spouseName: '',
    spouseCpf: '',
    spouseRg: '',
    spouseBirthDate: '',
    spousePhone: '',
    spouseEmail: '',
    
    // Campos da ficha de registro
    empresaNome: '',
    empresaEndereco: '',
    empresaCnpj: '',
    tituloEleitor: '',
    tituloEleitorZona: '',
    tituloEleitorSecao: '',
    carteiraIdentidadeOrgaoEmissor: '',
    carteiraIdentidadeDataEmissao: '',
    certificadoMilitar: '',
    nomePai: '',
    nomeMae: '',
    localNascimento: '',
    municipioNascimento: '',
    estadoNascimento: '',
    sexo: '',
    grauInstrucao: '',
    matriculaEsocial: '',
    cbo: '',
    salario: 0,
    salarioPorExtenso: '',
    periodoPagamento: '',
    horarioTrabalho: '',
    folgaSemanal: '',
    fgtsOptante: false,
    fgtsDataOpcao: '',
    fgtsBancoDepositario: '',
    fgtsDataRetratacao: '',
    pis: '',
    pisDataCadastro: '',
    pisBancoDepositario: '',
    pisEnderecoBanco: '',
    pisCodigoBanco: '',
    pisCodigoAgencia: '',
    cnhNumber: '',
    cnhExpirationDate: '',
    cnhCategory: '',
    ctps: '',
    ctpsRural: '',
    ctpsSeries: '',
    ctpsIssueDate: '',
    ctpsIssuingAgency: '',
    carteiraModelo19: '',
    registroGeralEstrangeiro: '',
    casadoBrasileiro: false,
    nomeConjugeEstrangeiro: '',
    temFilhosBrasileiros: false,
    quantidadeFilhosBrasileiros: 0,
    dataChegadaBrasil: '',
    naturalizado: false,
    decretoNaturalizacao: '',
    vistoFiscalizacao: '',
    assinaturaFuncionario: '',
    dataRescisao: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  
  // Estados para os dados dos selects
  const [positions, setPositions] = useState<Position[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Estados para busca e filtros
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  
  // Estados para médicos
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  
  // Estados para modal de novo cargo
  const [novoCargoModalOpen, setNovoCargoModalOpen] = useState(false);

  // Carregar dados para os selects quando o modal abrir
  useEffect(() => {
    if (open) {
      console.log('🔄 Modal aberto, carregando dados dos selects...');
      loadSelectData();
    }
  }, [open]);

  // Atualizar usuário e cargo selecionados quando os dados forem carregados
  useEffect(() => {
    if (funcionario && open && users.length > 0 && positions.length > 0) {
      console.log('🔄 Atualizando selects com dados carregados');
      console.log('👤 Funcionário user ID:', funcionario.user?.id);
      console.log('💼 Funcionário position ID:', funcionario.position?.id);
      console.log('📋 Users disponíveis:', users.length);
      console.log('📋 Positions disponíveis:', positions.length);
      
      // Preencher usuário selecionado
      if (funcionario.user?.id) {
        const user = users.find(u => u.id === funcionario.user?.id);
        if (user) {
          setSelectedUser(user);
          setUserSearchTerm(user.name || user.email || '');
          console.log('✅ Usuário encontrado e selecionado:', user.name);
        } else {
          console.warn('⚠️ Usuário não encontrado na lista:', funcionario.user?.id);
        }
      } else {
        console.log('ℹ️ Funcionário não tem usuário associado');
      }
      
      // Preencher cargo selecionado - comparar IDs como strings
      if (funcionario.position?.id) {
        const positionId = String(funcionario.position.id);
        const position = positions.find(p => String(p.id) === positionId);
        if (position) {
          setSelectedPosition(position);
          console.log('✅ Cargo encontrado e selecionado:', position.name);
        } else {
          console.warn('⚠️ Cargo não encontrado na lista:', positionId);
        }
      } else {
        console.log('ℹ️ Funcionário não tem cargo associado');
      }
      
      // Preencher usuário selecionado - comparar IDs como strings
      if (funcionario.user?.id) {
        const userId = String(funcionario.user.id);
        const user = users.find(u => String(u.id) === userId);
        if (user) {
          setSelectedUser(user);
          setUserSearchTerm(user.name || user.email || '');
          console.log('✅ Usuário encontrado e selecionado:', user.name);
        } else {
          console.warn('⚠️ Usuário não encontrado na lista:', userId);
        }
      } else {
        console.log('ℹ️ Funcionário não tem usuário associado');
      }
      
      // Preencher empresa selecionada - comparar IDs como strings
      if (funcionario.company?.id && companies.length > 0) {
        const companyId = String(funcionario.company.id);
        const company = companies.find(c => String(c.id) === companyId);
        if (company) {
          setSelectedCompany(company);
          console.log('✅ Empresa encontrada e selecionada:', company.name, company.id);
        } else {
          console.warn('⚠️ Empresa não encontrada na lista:', companyId);
        }
      } else {
        console.log('ℹ️ Funcionário não tem empresa associada ou lista de empresas não carregada');
      }
    }
  }, [funcionario, users, positions, companies, open]);

  // Filtrar usuários baseado no termo de busca
  useEffect(() => {
    if (userSearchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [userSearchTerm, users]);

  // Preencher formulário quando funcionário for selecionado
  useEffect(() => {
    const loadFullEmployeeData = async () => {
      if (!funcionario || !open || !funcionario.id) {
        return;
      }

      try {
        // Buscar dados completos do funcionário do backend
        console.log('🔍 Buscando dados completos do funcionário ID:', funcionario.id);
        const fullEmployee = await employeeService.getEmployeeById(funcionario.id);
        
        if (!fullEmployee) {
          console.warn('⚠️ Funcionário não encontrado no backend');
          return;
        }

        console.log('✅ Dados completos do funcionário carregados:', fullEmployee);
        console.log('🔍 Dados bancários brutos:', {
          bankData: fullEmployee.bankData,
          bankInfo: (fullEmployee as any).bankInfo
        });
        
        // Usar dados do funcionário completo buscado do backend
        const employeeData = fullEmployee || funcionario;
        
        // Tratar address que pode ser string ou objeto
        const addressValue = typeof employeeData.address === 'string' 
          ? employeeData.address 
          : employeeData.address?.street || '';
        
        // Tratar CPF que pode vir como cpf ou document
        const cpfValue = employeeData.cpf || (employeeData as any).document || '';
      
      // Tratar dados bancários - verificar tanto bankData quanto bankInfo
      let bankData = {
        bank: '',
        agency: '',
        account: '',
        type: 'CORRENTE'
      };
        
        // Priorizar bankInfo (que vem do backend) sobre bankData
        if ((employeeData as any).bankInfo) {
          const bankInfo = (employeeData as any).bankInfo;
          bankData = {
            bank: bankInfo.bank || '',
            agency: bankInfo.agency || '',
            account: bankInfo.account || '',
            type: bankInfo.accountType || 'CORRENTE'
          };
          console.log('💰 Dados bancários encontrados em bankInfo:', bankInfo);
        } else if (employeeData.bankData) {
          bankData = {
            bank: employeeData.bankData.bank || '',
            agency: employeeData.bankData.agency || '',
            account: employeeData.bankData.account || '',
            type: employeeData.bankData.type || 'CORRENTE'
          };
          console.log('💰 Dados bancários encontrados em bankData:', employeeData.bankData);
        } else {
          console.log('⚠️ Nenhum dado bancário encontrado no funcionário');
        }
        
        console.log('💰 Dados bancários mapeados para o formulário:', bankData);
        
        // Inicialmente usar phone do funcionário
        let initialPhone = employeeData.phone || '';
        
        // Se endereço vier como objeto AddressDTO, extrair campos separados
        let enderecoRua = (employeeData as any).enderecoRua || '';
        let enderecoNumero = (employeeData as any).enderecoNumero || '';
        let enderecoComplemento = (employeeData as any).enderecoComplemento || '';
        let enderecoBairro = (employeeData as any).enderecoBairro || '';
        let enderecoCidade = (employeeData as any).enderecoCidade || '';
        let enderecoEstado = (employeeData as any).enderecoEstado || '';
        let enderecoCep = (employeeData as any).enderecoCep || '';
        
        // Se endereço vier como objeto address com campos separados
        if (employeeData.address && typeof employeeData.address === 'object' && !addressValue) {
          const addr = employeeData.address as any;
          enderecoRua = addr.street || enderecoRua;
          enderecoNumero = addr.number || enderecoNumero;
          enderecoComplemento = addr.complement || enderecoComplemento;
          enderecoBairro = addr.neighborhood || enderecoBairro;
          enderecoCidade = addr.city || enderecoCidade;
          enderecoEstado = addr.state || enderecoEstado;
          enderecoCep = addr.zipCode || enderecoCep;
        }
        
        setForm({
          name: employeeData.name || '',
          cpf: cpfValue,
          rg: employeeData.rg || '',
          email: employeeData.email || '',
          phone: initialPhone,
          telefoneContato: (employeeData as any).telefoneContato || '',
          address: addressValue,
          enderecoRua: enderecoRua,
          enderecoNumero: enderecoNumero,
          enderecoComplemento: enderecoComplemento,
          enderecoBairro: enderecoBairro,
          enderecoCidade: enderecoCidade,
          enderecoEstado: enderecoEstado,
          enderecoCep: enderecoCep,
          birthDate: employeeData.birthDate || '',
          maritalStatus: employeeData.maritalStatus || 'SINGLE',
          nationality: employeeData.nationality || 'Brasileiro',
          registrationNumber: employeeData.registrationNumber || '',
          hireDate: employeeData.hireDate || '',
          status: employeeData.status || 'ACTIVE',
          notes: employeeData.notes || '',
          position: { id: employeeData.position?.id ? String(employeeData.position.id) : '' },
          unit: { id: employeeData.unit?.id ? String(employeeData.unit.id) : '' },
          user: { id: employeeData.user?.id ? String(employeeData.user.id) : '' },
          company: { id: employeeData.company?.id ? String(employeeData.company.id) : '' },
          workPostId: (employeeData as any).workPost?.id || (employeeData as any).workPostId || '',
          departmentId: (employeeData as any).department?.id || (employeeData as any).departmentId || '',
          bankData: bankData,
          // Campos do cônjuge
          spouseName: employeeData.spouseName || '',
          spouseCpf: employeeData.spouseCpf || '',
          spouseRg: employeeData.spouseRg || '',
          spouseBirthDate: employeeData.spouseBirthDate || '',
          spousePhone: employeeData.spousePhone || '',
          spouseEmail: employeeData.spouseEmail || '',
          
          // Campos da ficha de registro
          empresaNome: employeeData.empresaNome || '',
          empresaEndereco: employeeData.empresaEndereco || '',
          empresaCnpj: employeeData.empresaCnpj || '',
          tituloEleitor: employeeData.tituloEleitor || '',
          tituloEleitorZona: employeeData.tituloEleitorZona || '',
          tituloEleitorSecao: employeeData.tituloEleitorSecao || '',
          carteiraIdentidadeOrgaoEmissor: employeeData.carteiraIdentidadeOrgaoEmissor || '',
          carteiraIdentidadeDataEmissao: employeeData.carteiraIdentidadeDataEmissao || '',
          certificadoMilitar: employeeData.certificadoMilitar || '',
          nomePai: employeeData.nomePai || '',
          nomeMae: employeeData.nomeMae || '',
          localNascimento: employeeData.localNascimento || '',
          municipioNascimento: employeeData.municipioNascimento || '',
          estadoNascimento: employeeData.estadoNascimento || '',
          sexo: employeeData.sexo || '',
          grauInstrucao: employeeData.grauInstrucao || '',
          matriculaEsocial: employeeData.matriculaEsocial || '',
          cbo: employeeData.cbo || '',
          salario: employeeData.salario || 0,
          salarioPorExtenso: employeeData.salarioPorExtenso || '',
          periodoPagamento: employeeData.periodoPagamento || '',
          horarioTrabalho: employeeData.horarioTrabalho || '',
          folgaSemanal: employeeData.folgaSemanal || '',
          fgtsOptante: employeeData.fgtsOptante || false,
          fgtsDataOpcao: employeeData.fgtsDataOpcao || '',
          fgtsBancoDepositario: employeeData.fgtsBancoDepositario || '',
          fgtsDataRetratacao: employeeData.fgtsDataRetratacao || '',
          pis: employeeData.pis || '',
          pisDataCadastro: employeeData.pisDataCadastro || '',
          pisBancoDepositario: employeeData.pisBancoDepositario || '',
          pisEnderecoBanco: employeeData.pisEnderecoBanco || '',
          pisCodigoBanco: employeeData.pisCodigoBanco || '',
          pisCodigoAgencia: employeeData.pisCodigoAgencia || '',
          cnhNumber: employeeData.cnhNumber || '',
          cnhExpirationDate: employeeData.cnhExpirationDate || '',
          cnhCategory: employeeData.cnhCategory || '',
          ctps: employeeData.ctps || '',
          ctpsRural: employeeData.ctpsRural || '',
          ctpsSeries: employeeData.ctpsSeries || '',
          ctpsIssueDate: employeeData.ctpsIssueDate || '',
          ctpsIssuingAgency: employeeData.ctpsIssuingAgency || '',
          carteiraModelo19: employeeData.carteiraModelo19 || '',
          registroGeralEstrangeiro: employeeData.registroGeralEstrangeiro || '',
          casadoBrasileiro: employeeData.casadoBrasileiro || false,
          nomeConjugeEstrangeiro: employeeData.nomeConjugeEstrangeiro || '',
          temFilhosBrasileiros: employeeData.temFilhosBrasileiros || false,
          quantidadeFilhosBrasileiros: employeeData.quantidadeFilhosBrasileiros || 0,
          dataChegadaBrasil: employeeData.dataChegadaBrasil || '',
          naturalizado: employeeData.naturalizado || false,
          decretoNaturalizacao: employeeData.decretoNaturalizacao || '',
          vistoFiscalizacao: employeeData.vistoFiscalizacao || '',
          assinaturaFuncionario: employeeData.assinaturaFuncionario || '',
          dataRescisao: employeeData.dataRescisao || '',
          gender: employeeData.gender || ''
        });
        
        console.log('✅ Formulário preenchido com dados completos do funcionário');
        console.log('📋 Dados principais:', {
          name: employeeData.name,
          cpf: cpfValue,
          email: employeeData.email,
          phone: employeeData.phone,
          whatsapp: initialPhone,
          enderecoRua: enderecoRua,
          enderecoCep: enderecoCep,
          position: employeeData.position?.id,
          positionName: employeeData.position?.name,
          userId: employeeData.user?.id,
          userName: employeeData.user?.name || employeeData.user?.email,
          bankData: bankData,
          address: addressValue
        });
        
        // Buscar WhatsApp do usuário vinculado se existir
        if (employeeData.user?.id) {
          try {
            const userId = String(employeeData.user.id);
            // Primeiro tentar encontrar na lista já carregada
            const linkedUser = users.find(u => String(u.id) === userId);
            if (linkedUser?.whatsapp) {
              setForm(prev => ({
                ...prev,
                phone: linkedUser.whatsapp || prev.phone
              }));
              console.log('✅ WhatsApp encontrado no usuário vinculado (da lista):', linkedUser.whatsapp);
            } else {
              // Se não encontrou na lista, buscar do backend
              try {
                const userData = await userService.getUserById(userId);
                if (userData?.whatsapp) {
                  setForm(prev => ({
                    ...prev,
                    phone: userData.whatsapp || prev.phone
                  }));
                  console.log('✅ WhatsApp encontrado após buscar usuário:', userData.whatsapp);
                } else {
                  console.log('ℹ️ Usuário vinculado não tem WhatsApp cadastrado');
                }
              } catch (userError) {
                console.warn('⚠️ Erro ao buscar usuário para WhatsApp:', userError);
              }
            }
          } catch (whatsappError) {
            console.warn('⚠️ Erro ao buscar WhatsApp do usuário:', whatsappError);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar dados completos do funcionário:', error);
        // Se falhar, usar dados do prop funcionario mesmo assim
        console.log('⚠️ Usando dados parciais do funcionário passado como prop');
      }
    };

    if (funcionario && open) {
      loadFullEmployeeData();
    } else if (open && !funcionario) {
      // Resetar formulário quando modal abrir sem funcionário
      console.log('🔄 Resetando formulário - nenhum funcionário selecionado');
    }
  }, [funcionario, open]);

  // Buscar WhatsApp do usuário vinculado quando o funcionário tiver usuário
  useEffect(() => {
    const loadWhatsAppFromUser = async () => {
      if (!funcionario || !open || !funcionario.user?.id) {
        return;
      }

      const userId = String(funcionario.user.id);

      // Primeiro tentar encontrar na lista já carregada
      const linkedUser = users.find(u => String(u.id) === userId);
      if (linkedUser?.whatsapp) {
        setForm(prev => ({
          ...prev,
          phone: linkedUser.whatsapp || prev.phone
        }));
        console.log('✅ WhatsApp encontrado no usuário vinculado (da lista):', linkedUser.whatsapp);
        return;
      }

      // Se não encontrou na lista ou não tem WhatsApp, buscar do backend
      try {
        const userData = await userService.getUserById(userId);
        if (userData?.whatsapp) {
          setForm(prev => ({
            ...prev,
            phone: userData.whatsapp || prev.phone
          }));
          console.log('✅ WhatsApp encontrado após buscar usuário:', userData.whatsapp);
        } else {
          console.log('ℹ️ Usuário vinculado não tem WhatsApp cadastrado');
        }
      } catch (error) {
        console.warn('⚠️ Erro ao buscar usuário para WhatsApp:', error);
      }
    };

    loadWhatsAppFromUser();
  }, [funcionario, open, users]);

  // Função para buscar CEP
  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    
    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          enderecoRua: data.logradouro || '',
          enderecoBairro: data.bairro || '',
          enderecoCidade: data.localidade || '',
          enderecoEstado: data.uf || '',
          enderecoCep: cepLimpo,
          address: `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''} - ${data.uf || ''}, ${cepLimpo}`
        }));
        toast({
          title: "CEP encontrado",
          description: "Endereço preenchido automaticamente.",
        });
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado.",
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

  // Função para carregar médicos
  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const doctorsList = await doctorService.getAllActive();
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
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
      const doctorsList = await doctorService.getAllActive();
      const filtered = doctorsList.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.crmNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setDoctors(filtered);
    } catch (error) {
      console.error('Erro ao buscar médicos:', error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const loadSelectData = async () => {
    setLoadingData(true);
    try {
      console.log('📥 Carregando dados dos selects...');
      const [positionsData, unitsData, usersData, companiesData, workPostsData, departmentsData] = await Promise.all([
        positionService.getPositions(),
        unitService.getAllUnits(),
        userService.getAllUsers(),
        companyService.getAllCompanies(),
        workPostService.getAllWorkPosts(),
        departmentService.listActive()
      ]);
      
      console.log('✅ Dados carregados:', {
        positions: positionsData.length,
        units: unitsData.length,
        users: usersData.length,
        companies: companiesData.length
      });
      
      setPositions(positionsData);
      setUnits(unitsData);
      setUsers(usersData);
      setFilteredUsers(usersData);
      setCompanies(companiesData);
      setWorkPosts(workPostsData);
      setDepartments(departmentsData);
      
      // Carregar médicos
      await loadDoctors();
      
      // Após carregar os dados, preencher os selects se houver funcionário
      if (funcionario) {
        console.log('🔍 Funcionário encontrado, preenchendo selects...');
        console.log('👤 Funcionário user ID:', funcionario.user?.id);
        console.log('💼 Funcionário position ID:', funcionario.position?.id);
        
        // Preencher usuário selecionado - comparar IDs como strings
        if (funcionario.user?.id) {
          const userId = String(funcionario.user.id);
          const user = usersData.find(u => String(u.id) === userId);
          if (user) {
            setSelectedUser(user);
            setUserSearchTerm(user.name || user.email || '');
            console.log('✅ Usuário encontrado e selecionado:', user.name, user.id);
          } else {
            console.warn('⚠️ Usuário não encontrado na lista');
            console.warn('   Procurando por:', userId);
            console.warn('   IDs disponíveis:', usersData.map(u => String(u.id)));
            // Mesmo não encontrando, definir o ID no formulário para que apareça quando a lista carregar
            setForm(prev => ({ ...prev, user: { id: userId } }));
          }
        } else {
          console.log('ℹ️ Funcionário não tem usuário associado');
        }
        
        // Preencher cargo selecionado - comparar IDs como strings
        if (funcionario.position?.id) {
          const positionId = String(funcionario.position.id);
          const position = positionsData.find(p => String(p.id) === positionId);
          if (position) {
            setSelectedPosition(position);
            console.log('✅ Cargo encontrado e selecionado:', position.name, position.id);
          } else {
            console.warn('⚠️ Cargo não encontrado na lista');
            console.warn('   Procurando por:', positionId);
            console.warn('   IDs disponíveis:', positionsData.map(p => String(p.id)));
            // Mesmo não encontrando, definir o ID no formulário para que apareça quando a lista carregar
            setForm(prev => ({ ...prev, position: { id: positionId } }));
          }
        } else {
          console.log('ℹ️ Funcionário não tem cargo associado');
        }
        
        // Preencher empresa selecionada - comparar IDs como strings
        if (funcionario.company?.id) {
          const companyId = String(funcionario.company.id);
          const company = companiesData.find(c => String(c.id) === companyId);
          if (company) {
            setSelectedCompany(company);
            console.log('✅ Empresa encontrada e selecionada:', company.name, company.id);
          } else {
            console.warn('⚠️ Empresa não encontrada na lista');
            console.warn('   Procurando por:', companyId);
            console.warn('   IDs disponíveis:', companiesData.map(c => String(c.id)));
          }
        } else {
          console.log('ℹ️ Funcionário não tem empresa associada');
        }
      }
    } catch (err) {
      console.error('❌ Erro ao carregar dados dos selects:', err);
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
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    if (value) {
      const stringValue = String(value);
      setForm((prev) => ({ 
        ...prev, 
        [field]: { id: stringValue } 
      }));
      
      // Atualizar estados selecionados
      if (field === 'user') {
        const user = users.find(u => String(u.id) === stringValue);
        if (user) {
          setSelectedUser(user);
          setUserSearchTerm(user.name || user.email || '');
        }
      } else if (field === 'position') {
        const position = positions.find(p => String(p.id) === stringValue);
        if (position) {
          setSelectedPosition(position);
        }
      }
    } else {
      setForm((prev) => {
        const newForm = { ...prev };
        if (field === 'position') {
          newForm.position = { id: '' };
          setSelectedPosition(null);
        } else if (field === 'unit') {
          newForm.unit = { id: '' };
        } else if (field === 'user') {
          newForm.user = { id: '' };
          setSelectedUser(null);
          setUserSearchTerm('');
        } else if (field === 'company') {
          newForm.company = { id: '' };
          setSelectedCompany(null);
        }
        return newForm;
      });
    }
  };
  
  const handleCompanySelect = (companyId: string) => {
    if (companyId === 'none' || companyId === '') {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!funcionario) return;
    
    // Validação de formato de email (se preenchido)
    if (form.email && form.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        setError('Por favor, insira um email válido.');
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    try {
      await employeeService.updateEmployee(funcionario.id, form);
      toast({
        title: "Sucesso",
        description: "Funcionário atualizado com sucesso!",
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Erro ao atualizar funcionário:', err);
      
      // Tratar erros específicos
      if (err.message.includes('CPF já cadastrado')) {
        setError('CPF já cadastrado para outro funcionário');
        toast({
          title: "CPF Duplicado",
          description: "Este CPF já está cadastrado para outro funcionário.",
          variant: "destructive"
        });
      } else if (err.message.includes('Email já cadastrado')) {
        setError('Email já cadastrado para outro funcionário');
        toast({
          title: "Email Duplicado",
          description: "Este email já está cadastrado para outro funcionário.",
          variant: "destructive"
        });
      } else {
        setError('Erro ao atualizar funcionário.');
        toast({
          title: "Erro",
          description: err.message || "Não foi possível atualizar o funcionário.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (funcionario) {
      setForm({
        name: funcionario.name || '',
        cpf: funcionario.cpf || '',
        rg: funcionario.rg || '',
        email: funcionario.email || '',
        phone: funcionario.phone || '',
        address: funcionario.address?.street || '',
        birthDate: funcionario.birthDate || '',
        maritalStatus: funcionario.maritalStatus || 'SINGLE',
        nationality: funcionario.nationality || 'Brasileiro',
        registrationNumber: funcionario.registrationNumber || '',
        hireDate: funcionario.hireDate || '',
        status: funcionario.status || 'ACTIVE',
        notes: funcionario.notes || '',
        position: { id: funcionario.position?.id || '' },
        unit: { id: funcionario.unit?.id || '' },
        user: { id: funcionario.user?.id || '' }
      });
    }
    setError(null);
    setUserSearchTerm('');
  };

  const handleCargoCreated = (cargo: { id: string; name: string; description: string }) => {
    // Adicionar o novo cargo à lista
    setPositions(prev => [...prev, cargo]);
    // Selecionar automaticamente o novo cargo
    setForm(prev => ({ ...prev, position: { id: cargo.id } }));
  };

  // Não renderizar se não houver funcionário e a modal estiver fechada
  if (!open) return null;
  if (!funcionario && open) {
    // Se a modal está aberta mas não há funcionário, mostrar mensagem ou fechar
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full p-3 sm:p-4 md:p-6 overflow-y-auto max-h-[90vh] bg-seguranca-graphite border-gray-600">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-seguranca-lightgray">
            Editar Funcionário
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-gray-400">
            Edite os dados do funcionário. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Relacionamentos */}
          <div className="space-y-4 bg-[#363636] p-4 rounded-lg">
            <h3 className="text-lg font-semibold flex items-center text-white">
              <UserIcon className="mr-2" size={20} />
              Relacionamentos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Seleção de Usuário */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-200">
                  Usuário do Sistema
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Buscar usuário por nome, email ou username..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select 
                  value={form.user?.id ? String(form.user.id) : undefined} 
                  onValueChange={(value) => handleSelectChange('user', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário">
                      {selectedUser ? (
                        <div className="flex flex-col text-left">
                          <span className="font-medium">{selectedUser.name}</span>
                          <span className="text-xs text-gray-500">
                            {selectedUser.email}
                          </span>
                        </div>
                      ) : form.user?.id ? (
                        <span className="text-gray-400">Carregando usuário...</span>
                      ) : (
                        'Selecione um usuário'
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-xs text-gray-500">
                              {user.email} • {user.username} • {user.role}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        Nenhum usuário encontrado
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-300">
                  O usuário selecionado será associado ao funcionário para acesso ao sistema. (Opcional)
                </p>
              </div>

                             {/* Seleção de Cargo */}
               <div className="space-y-2">
                 <Label className="text-sm font-medium text-gray-200">
                   Cargo
                 </Label>
                 <div className="flex gap-2">
                   <Select 
                     value={form.position?.id ? String(form.position.id) : undefined} 
                     onValueChange={(value) => handleSelectChange('position', value)}
                     className="flex-1"
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Selecione um cargo">
                         {selectedPosition ? (
                           <div className="flex items-center">
                             <Briefcase className="mr-2" size={16} />
                             <div className="flex flex-col text-left">
                               <span className="font-medium">{selectedPosition.name}</span>
                               {selectedPosition.description && (
                                 <span className="text-xs text-gray-500">{selectedPosition.description}</span>
                               )}
                             </div>
                           </div>
                         ) : form.position?.id ? (
                           <span className="text-gray-400">Carregando cargo...</span>
                         ) : (
                           'Selecione um cargo'
                         )}
                       </SelectValue>
                     </SelectTrigger>
                     <SelectContent>
                       {positions.length > 0 ? (
                         positions.map((position) => (
                           <SelectItem key={position.id} value={String(position.id)}>
                             <div className="flex items-center">
                               <Briefcase className="mr-2" size={16} />
                               <div className="flex flex-col">
                                 <span className="font-medium">{position.name}</span>
                                 {position.description && (
                                   <span className="text-xs text-gray-500">{position.description}</span>
                                 )}
                               </div>
                             </div>
                           </SelectItem>
                         ))
                       ) : (
                         <div className="px-3 py-2 text-sm text-gray-500">
                           Nenhum cargo disponível
                         </div>
                       )}
                     </SelectContent>
                   </Select>
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
                 <p className="text-xs text-gray-300">
                   Selecione um cargo existente ou crie um novo.
                 </p>
               </div>
            </div>
          </div>

          {/* Seção: Informações Pessoais */}
          <div className="space-y-4 bg-[#363636] p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white">Informações Pessoais</h3>
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
                <Label className="text-sm font-medium text-gray-200">RG *</Label>
                <Input 
                  name="rg" 
                  value={form.rg} 
                  onChange={handleChange} 
                  required 
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
          </div>

          {/* Seção: Informações do Cônjuge - Exibida apenas quando estado civil for "Casado" */}
          {form.maritalStatus === 'MARRIED' && (
            <div className="space-y-4 bg-[#363636] p-4 rounded-lg border-l-4 border-yellow-500">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-yellow-500" />
                Informações do Cônjuge
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-200">Nome Completo do Cônjuge *</Label>
                  <Input 
                    name="spouseName" 
                    value={form.spouseName} 
                    onChange={handleChange} 
                    placeholder="Digite o nome completo do cônjuge"
                    required 
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-200">CPF do Cônjuge *</Label>
                  <Input 
                    name="spouseCpf" 
                    value={form.spouseCpf} 
                    onChange={handleChange} 
                    placeholder="000.000.000-00"
                    required 
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-200">RG do Cônjuge</Label>
                  <Input 
                    name="spouseRg" 
                    value={form.spouseRg} 
                    onChange={handleChange} 
                    placeholder="Digite o RG do cônjuge"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-200">Data de Nascimento do Cônjuge</Label>
                  <Input 
                    name="spouseBirthDate" 
                    type="date" 
                    value={form.spouseBirthDate} 
                    onChange={handleChange} 
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-200">Telefone do Cônjuge</Label>
                  <Input 
                    name="spousePhone" 
                    value={form.spousePhone} 
                    onChange={handleChange} 
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-200">Email do Cônjuge</Label>
                  <Input 
                    name="spouseEmail" 
                    type="email" 
                    value={form.spouseEmail} 
                    onChange={handleChange} 
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Seção: Informações de Contato */}
          <div className="space-y-4 bg-[#363636] p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white">Informações de Contato</h3>
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
                  value={form.phone} 
                  onChange={handleChange} 
                  required 
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Telefone de Contato</Label>
                <Input 
                  name="telefoneContato" 
                  value={aplicarMascaraTelefone((form as any).telefoneContato || '')} 
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, '');
                    setForm(prev => ({ ...prev, telefoneContato: valor } as any));
                  }}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
            </div>
            
            {/* Seção: Endereço Separado */}
            <div className="mt-4 pt-4 border-t border-gray-600">
              <h4 className="text-md font-semibold text-seguranca-yellow mb-4">Endereço</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-xs sm:text-sm font-medium text-gray-200">CEP *</Label>
                  <div className="flex gap-2">
                    <Input 
                      name="enderecoCep" 
                      value={aplicarMascaraCep((form as any).enderecoCep || '')} 
                      onChange={(e) => {
                        const valor = e.target.value.replace(/\D/g, '');
                        setForm(prev => ({ ...prev, enderecoCep: valor } as any));
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
                    value={(form as any).enderecoRua || ''} 
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
                    value={(form as any).enderecoNumero || ''} 
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
                    value={(form as any).enderecoComplemento || ''} 
                    onChange={handleChange} 
                    placeholder="Apto, Bloco, etc."
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-200">Bairro *</Label>
                  <Input 
                    name="enderecoBairro" 
                    value={(form as any).enderecoBairro || ''} 
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
                    value={(form as any).enderecoCidade || ''} 
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
                    value={(form as any).enderecoEstado || ''} 
                    onChange={(e) => {
                      const valor = e.target.value.toUpperCase().substring(0, 2);
                      setForm(prev => ({ ...prev, enderecoEstado: valor } as any));
                    }}
                    placeholder="MG"
                    maxLength={2}
                    required
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Informações da Empresa */}
          <div className="space-y-4 bg-[#363636] p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-500" />
              Informações da Empresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-200">Nome da Empresa</Label>
                <Input 
                  name="empresaNome" 
                  value={form.empresaNome} 
                  onChange={handleChange} 
                  placeholder="Nome da empresa contratante"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">CNPJ/CEI</Label>
                <Input 
                  name="empresaCnpj" 
                  value={form.empresaCnpj} 
                  onChange={handleChange} 
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-200">Endereço da Empresa</Label>
                <Input 
                  name="empresaEndereco" 
                  value={form.empresaEndereco} 
                  onChange={handleChange} 
                  placeholder="Endereço completo da empresa"
                />
              </div>
            </div>
          </div>

          {/* Seção: Documentos Pessoais */}
          <div className="space-y-4 bg-[#363636] p-4 rounded-lg border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-green-500" />
              Documentos Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-200">CTPS</Label>
                <Input 
                  name="ctps" 
                  value={form.ctps} 
                  onChange={handleChange} 
                  placeholder="Número da CTPS"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Série CTPS</Label>
                <Input 
                  name="ctpsSeries" 
                  value={form.ctpsSeries} 
                  onChange={handleChange} 
                  placeholder="Série da CTPS"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Título de Eleitor</Label>
                <Input 
                  name="tituloEleitor" 
                  value={form.tituloEleitor} 
                  onChange={handleChange} 
                  placeholder="Número do título de eleitor"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Zona Eleitoral</Label>
                <Input 
                  name="tituloEleitorZona" 
                  value={form.tituloEleitorZona} 
                  onChange={handleChange} 
                  placeholder="Zona eleitoral"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Órgão Emissor RG</Label>
                <Input 
                  name="carteiraIdentidadeOrgaoEmissor" 
                  value={form.carteiraIdentidadeOrgaoEmissor} 
                  onChange={handleChange} 
                  placeholder="SSP, IFP, etc."
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Data Emissão RG</Label>
                <Input 
                  name="carteiraIdentidadeDataEmissao" 
                  type="date" 
                  value={form.carteiraIdentidadeDataEmissao} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Certificado Militar</Label>
                <Input 
                  name="certificadoMilitar" 
                  value={form.certificadoMilitar} 
                  onChange={handleChange} 
                  placeholder="Número do certificado militar"
                />
              </div>
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
              
              {/* CIN - Carteira de Identidade Nacional */}
              <div>
                <Label className="text-sm font-medium text-gray-200">Número do CIN</Label>
                <Input 
                  name="cinNumero" 
                  value={(form as any).cinNumero || ''} 
                  onChange={handleChange} 
                  placeholder="Número do CIN"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Órgão Emissor do CIN</Label>
                <Input 
                  name="cinOrgaoEmissor" 
                  value={(form as any).cinOrgaoEmissor || ''} 
                  onChange={handleChange} 
                  placeholder="Ex: SSP, DETRAN"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Data de Emissão do CIN</Label>
                <Input 
                  name="cinDataEmissao" 
                  type="date" 
                  value={(form as any).cinDataEmissao || ''} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          </div>

          {/* Seção: Informações Familiares */}
          <div className="space-y-4 bg-[#363636] p-4 rounded-lg border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-purple-500" />
              Informações Familiares
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-200">Nome do Pai</Label>
                <Input 
                  name="nomePai" 
                  value={form.nomePai} 
                  onChange={handleChange} 
                  placeholder="Nome completo do pai"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Nome da Mãe</Label>
                <Input 
                  name="nomeMae" 
                  value={form.nomeMae} 
                  onChange={handleChange} 
                  placeholder="Nome completo da mãe"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Local de Nascimento</Label>
                <Input 
                  name="localNascimento" 
                  value={form.localNascimento} 
                  onChange={handleChange} 
                  placeholder="Cidade, Estado"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Grau de Instrução</Label>
                <Input 
                  name="grauInstrucao" 
                  value={form.grauInstrucao} 
                  onChange={handleChange} 
                  placeholder="Ensino médio completo, etc."
                />
              </div>
            </div>
          </div>

          {/* Seção: Informações Profissionais */}
          <div className="space-y-4 bg-[#363636] p-4 rounded-lg">
            <h3 className="text-lg font-semibold flex items-center text-white">
              <Building className="mr-2" size={20} />
              Informações Profissionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-200">Número de Registro *</Label>
                <Input 
                  name="registrationNumber" 
                  value={form.registrationNumber} 
                  onChange={handleChange} 
                  required 
                  placeholder="EMP001"
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
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">CBO</Label>
                <Input 
                  name="cbo" 
                  value={form.cbo} 
                  onChange={handleChange} 
                  placeholder="Código Brasileiro de Ocupações"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Salário</Label>
                <Input 
                  name="salario" 
                  type="number" 
                  step="0.01"
                  value={form.salario} 
                  onChange={handleChange} 
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Período de Pagamento</Label>
                <Input 
                  name="periodoPagamento" 
                  value={form.periodoPagamento} 
                  onChange={handleChange} 
                  placeholder="Mensal, Quinzenal, etc."
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Status *</Label>
                <Select 
                  value={form.status} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                    <SelectItem value="VACATION">Férias</SelectItem>
                    <SelectItem value="TERMINATED">Demitido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-200">Horário de Trabalho</Label>
                <Input 
                  name="horarioTrabalho" 
                  value={form.horarioTrabalho} 
                  onChange={handleChange} 
                  placeholder="Ex: 08h às 17h"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Folga Semanal</Label>
                <Input 
                  name="folgaSemanal" 
                  value={form.folgaSemanal} 
                  onChange={handleChange} 
                  placeholder="Ex: Domingo"
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
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id} className="text-seguranca-lightgray hover:bg-gray-700">
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  value={selectedCompany?.id || form.company?.id || 'none'} 
                  onValueChange={handleCompanySelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa">
                      {selectedCompany ? (
                        <div className="flex flex-col text-left">
                          <span className="font-medium">
                            {selectedCompany.sigla ? selectedCompany.sigla.toUpperCase() : selectedCompany.name}
                          </span>
                          {selectedCompany.sigla && selectedCompany.name && (
                            <span className="text-xs text-gray-500">{selectedCompany.name}</span>
                          )}
                        </div>
                      ) : form.company?.id ? (
                        <span className="text-gray-400">Carregando empresa...</span>
                      ) : (
                        'Nenhuma empresa'
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-gray-400">Nenhuma empresa</span>
                    </SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {company.sigla ? company.sigla.toUpperCase() : company.name}
                          </span>
                          {company.sigla && company.name && (
                            <span className="text-xs text-gray-500">{company.name}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Seção: Dados Bancários */}
          <div className="space-y-4 bg-[#363636] p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-500" />
              Dados Bancários
            </h3>
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
              <div>
                <Label className="text-sm font-medium text-gray-200">Tipo de Conta</Label>
                <Select 
                  value={form.bankData?.type || 'CORRENTE'} 
                  onValueChange={(value) => setForm(prev => ({ 
                    ...prev, 
                    bankData: {
                      ...(prev.bankData || { bank: '', agency: '', account: '', type: 'CORRENTE' }),
                      type: value
                    }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORRENTE">Conta Corrente</SelectItem>
                    <SelectItem value="POUPANCA">Poupança</SelectItem>
                    <SelectItem value="SALARIO">Conta Salário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Seção: FGTS e PIS */}
          <div className="space-y-4 bg-[#363636] p-4 rounded-lg border-l-4 border-orange-500">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building className="h-5 w-5 text-orange-500" />
              FGTS e PIS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-200">É Optante do FGTS?</Label>
                <Select 
                  value={form.fgtsOptante ? 'true' : 'false'} 
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
                <Label className="text-sm font-medium text-gray-200">Data da Opção FGTS</Label>
                <Input 
                  name="fgtsDataOpcao" 
                  type="date" 
                  value={form.fgtsDataOpcao} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Banco Depositário FGTS</Label>
                <Input 
                  name="fgtsBancoDepositario" 
                  value={form.fgtsBancoDepositario} 
                  onChange={handleChange} 
                  placeholder="Nome do banco"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">PIS</Label>
                <Input 
                  name="pis" 
                  value={form.pis} 
                  onChange={handleChange} 
                  placeholder="Número do PIS"
                />
              </div>
            </div>
          </div>

          {/* Seção: Dados do Exame Médico (ASO) */}
          <div className="space-y-4 bg-[#363636] p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white">Dados do Exame Médico (ASO)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-200">Data do Exame Médico (ASO)</Label>
                <Input 
                  name="exameMedicoData" 
                  type="date"
                  value={(form as any).exameMedicoData || ''} 
                  onChange={(e) => setForm(prev => ({ ...prev, exameMedicoData: e.target.value } as any))} 
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Tipo de Exame Realizado</Label>
                <Select 
                  value={(form as any).exameMedicoTipo || ''} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, exameMedicoTipo: value } as any))}
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
                              } as any));
                              setShowDoctorDropdown(false);
                            }}
                          >
                            {doctor.name} - CRM {doctor.crmNumber}/{doctor.crmState}
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-400">Nenhum médico encontrado</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Horário</Label>
                <Input 
                  name="exameMedicoHorario" 
                  value={(form as any).exameMedicoHorario || ''} 
                  onChange={(e) => setForm(prev => ({ ...prev, exameMedicoHorario: e.target.value } as any))} 
                  placeholder="Ex: 18:00 ÀS 06:00 H"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-200">Observações</Label>
                <Textarea 
                  name="exameMedicoObservacoes" 
                  value={(form as any).exameMedicoObservacoes || ''} 
                  onChange={(e) => setForm(prev => ({ ...prev, exameMedicoObservacoes: e.target.value } as any))} 
                  placeholder="Observações sobre o exame médico..."
                  rows={3}
                  className="text-xs sm:text-sm bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>
          </div>

          {/* Seção: Para Estrangeiro */}
          <div className="space-y-4 bg-[#363636] p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white">Para Estrangeiro</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-200">RNE nº</Label>
                <Input 
                  name="rneNumero" 
                  value={(form as any).rneNumero || ''} 
                  onChange={(e) => setForm(prev => ({ ...prev, rneNumero: e.target.value } as any))} 
                  placeholder="Número do RNE"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-200">Validade</Label>
                <Input 
                  name="rneValidade" 
                  type="date"
                  value={(form as any).rneValidade || ''} 
                  onChange={(e) => setForm(prev => ({ ...prev, rneValidade: e.target.value } as any))} 
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
            </div>
          </div>

          {/* Seção: Observações */}
          <div className="space-y-4 bg-[#363636] p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white">Observações</h3>
            <div className="grid grid-cols-1 gap-4">
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
         
          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
         
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={resetForm}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Restaurar Dados
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || loadingData || !form.position?.id}
              className="w-full sm:w-auto"
            >
              {loading ? 'Salvando...' : 'Atualizar Funcionário'}
            </Button>
          </DialogFooter>
                 </form>
       </DialogContent>
       
       {/* Modal de Novo Cargo */}
       <NovoCargoModal
         open={novoCargoModalOpen}
         onClose={() => setNovoCargoModalOpen(false)}
         onCargoCreated={handleCargoCreated}
       />
     </Dialog>
   );
 };

export default FuncionarioEditModal;
