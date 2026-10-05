import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  CalendarDays, DollarSign, Plus, Users, Building2, Tag, CheckCircle, 
  Search, X, Warehouse, FileSignature, CheckCircle2, Sparkles, Store, UserCheck, User,
  FileText, Download, Receipt, GitBranch, ArrowRight, Link2
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from 'date-fns/locale';
import { formatDateForBackend, parseDateFromBackend } from '@/utils/dateUtils';
import { contasAPagarService, Supplier } from '@/services/contasAPagarService';
import { clientService, Client } from '@/services/clientService';
import { workPostService, WorkPost } from '@/services/workPostService';
import { contractService, Contract } from '@/services/contractService';
import { garageService, Garage } from '@/services/garageService';
import { employeeService, Employee } from '@/services/employeeService';
import SupplierFormModal from '@/components/estoque/SupplierFormModal';
import { useAuth } from '@/contexts/AuthContext';
import { generatePaymentReceiptPDF } from '@/utils/paymentReceiptPdfGenerator';
import { LineageDetailModal, LineageStepType } from './LineageDetailModal';
import {
  CLASSIFICACOES_PADRAO,
  GRUPOS_CLASSIFICACAO,
  getClassificacaoStyle,
  ClassificacaoContaItem
} from '@/constants/classificacaoContasPagar';

export interface ContaAPagar {
  id?: string;
  invoiceNumber?: string;
  dataEmissao?: Date;
  vencimento: Date;
  companySigla?: string;
  fornecedor: string;
  fornecedorId?: string;
  cliente?: string;
  clienteId?: string;
  obra?: string;
  obraId?: string;
  contrato?: string;
  contratoId?: string;
  garagem?: string;
  garagemId?: string;
  empresa?: string;
  empresaId?: string;
  descricao: string;
  tipo: 'FIXA' | 'VARIAVEL';
  valor: number;
  codigoBarras?: string;
  status: 'ABERTA' | 'PAGA' | 'ATRASADA' | 'CANCELADA' | 'VENCIDA';
  baixa: boolean;
  dataPagamento?: Date;
  observacoes?: string;
  comprovante?: File;
  categoria?: string | undefined;
  centroCusto?: string | undefined;
  createdAt?: Date;

  // Campos SIGLO / Relatório de Despesas
  expenseNumber?: string;
  installmentSeq?: number;
  supplierCode?: string;
  supplierName?: string;
  interestAmount?: number;
  fineAmount?: number;
  discountAmount?: number;
  adjustmentAmount?: number;
  paidAmount?: number;
  balanceAmount?: number;
  bankAccountInfo?: string;
  isCanceled?: boolean;

  // Rastreabilidade de Origem (OS -> Cotação -> Ordem de Compra -> Contas a Pagar)
  workOrderId?: string;
  workOrderNumber?: string;
  requisitionId?: string;
  requisitionNumber?: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
}

interface ContasAPagarFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editMode?: boolean;
  initialData?: ContaAPagar | null;
}

// Cache leve em memória para abertura instantânea (0ms)
let cachedStaticData: {
  fornecedores?: Supplier[];
  empresas?: any[];
  clientes?: Client[];
  obras?: WorkPost[];
  contratos?: Contract[];
  garagens?: Garage[];
  categories?: string[];
  costCenters?: string[];
  employees?: Employee[];
} = {};

const DEFAULT_COST_CENTERS = [
  'Administrativo',
  'Operacional',
  'Manutenção e Frotas',
  'Comercial',
  'Financeiro',
  'Recursos Humanos',
  'Tecnologia da Informação',
  'Marketing',
  'Vendas',
  'Produção',
  'Logística'
];

export const ContasAPagarFormModal: React.FC<ContasAPagarFormModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  editMode = false,
  initialData = null
}) => {
  const { toast } = useToast();
  const { user, empresa: currentEmpresa } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<Supplier[]>(cachedStaticData.fornecedores || []);
  const [empresas, setEmpresas] = useState<any[]>(cachedStaticData.empresas || []);
  const [siglas, setSiglas] = useState<string[]>([]);
  const [clientes, setClientes] = useState<Client[]>(cachedStaticData.clientes || []);
  const [obras, setObras] = useState<WorkPost[]>(cachedStaticData.obras || []);
  const [contratos, setContratos] = useState<Contract[]>(cachedStaticData.contratos || []);
  const [garagens, setGaragens] = useState<Garage[]>(cachedStaticData.garagens || []);
  const [costCenters, setCostCenters] = useState<string[]>(
    cachedStaticData.costCenters && cachedStaticData.costCenters.length > 0
      ? cachedStaticData.costCenters
      : DEFAULT_COST_CENTERS
  );
  const [employees, setEmployees] = useState<Employee[]>(cachedStaticData.employees || []);
  const [lineageModalType, setLineageModalType] = useState<LineageStepType | null>(null);

  // Seleção de Funcionário / Colaborador (RH/DPE)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const employeeInputRef = useRef<HTMLInputElement>(null);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  // Campos de Pagamento, NF-e e Parcelamento
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'BOLETO' | 'CARTAO_CREDITO' | 'TRANSFERENCIA' | 'DINHEIRO'>('BOLETO');
  const [paymentCondition, setPaymentCondition] = useState<'A_VISTA' | 'PARCELADO'>('A_VISTA');
  const [numParcelas, setNumParcelas] = useState<number>(2);
  const [nfeKey, setNfeKey] = useState<string>('');
  const [parcelasDetails, setParcelasDetails] = useState<Array<{ seq: number; vencimento: Date; valor: number }>>([]);

  // Pesquisa de Fornecedor
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
  const supplierInputRef = useRef<HTMLInputElement>(null);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  // Pesquisa de Plano de Contas
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  // Contas personalizadas adicionadas pelo usuário (persistidas no localStorage)
  const [customAccounts, setCustomAccounts] = useState<ClassificacaoContaItem[]>(() => {
    try {
      const saved = localStorage.getItem('custom_plano_contas');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal para criar nova conta no Plano de Contas
  const [newAccountModalOpen, setNewAccountModalOpen] = useState(false);
  const [newAccountGrupo, setNewAccountGrupo] = useState<
    'OPERACIONAL' | 'PESSOAL' | 'ADMINISTRATIVO' | 'TRIBUTARIO' | 'FINANCEIRO' | 'INVESTIMENTO' | 'OUTROS'
  >('OPERACIONAL');
  const [newAccountNome, setNewAccountNome] = useState('');

  // Lista consolidada de todas as contas do Plano de Contas
  const allPlanoContas = useMemo(() => {
    return [...CLASSIFICACOES_PADRAO, ...customAccounts];
  }, [customAccounts]);

  // Código gerado automaticamente para o grupo selecionado no modal de criação
  const autoGeneratedCode = useMemo(() => {
    const prefixMap: Record<string, string> = {
      'OPERACIONAL': '1',
      'PESSOAL': '2',
      'ADMINISTRATIVO': '3',
      'TRIBUTARIO': '4',
      'FINANCEIRO': '5',
      'INVESTIMENTO': '6',
      'OUTROS': '7',
    };
    const prefix = prefixMap[newAccountGrupo] || '7';

    let maxNum = 0;
    allPlanoContas.forEach(acc => {
      if (!acc.codigo) return;
      const parts = acc.codigo.split('.');
      if (parts[0] === prefix && parts[1]) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    const nextSeq = maxNum + 1;
    return `${prefix}.${nextSeq.toString().padStart(2, '0')}`;
  }, [newAccountGrupo, allPlanoContas]);

  // Contas filtradas dinamicamente por código ou descrição
  const filteredAccounts = useMemo(() => {
    const q = accountSearchQuery.trim().toLowerCase();
    if (!q) return allPlanoContas;

    return allPlanoContas.filter(acc => 
      acc.codigo.toLowerCase().includes(q) || 
      acc.nome.toLowerCase().includes(q) ||
      (acc.grupoNome && acc.grupoNome.toLowerCase().includes(q))
    );
  }, [allPlanoContas, accountSearchQuery]);

  // Leitura e extração automática dos 44 dígitos da Chave da NF-e
  const parsedNfeInfo = useMemo(() => {
    const cleanKey = (nfeKey || '').replace(/\D/g, '');
    if (cleanKey.length !== 44) return null;

    const ufCode = cleanKey.substring(0, 2);
    const aamm = cleanKey.substring(2, 6);
    const cnpj = cleanKey.substring(6, 20).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    const modelo = cleanKey.substring(20, 22);
    const serie = parseInt(cleanKey.substring(22, 25), 10);
    const numNF = parseInt(cleanKey.substring(25, 34), 10);

    return {
      cleanKey,
      cnpj,
      modelo,
      serie,
      numNF,
      mesAno: `${aamm.substring(2, 4)}/20${aamm.substring(0, 2)}`
    };
  }, [nfeKey]);

  // Obter identificação consolidada da empresa à qual o usuário logado pertence
  const userCompanyInfo = useMemo(() => {
    let companyId = user?.companyId || currentEmpresa?.id;
    let companyName = user?.companyName || currentEmpresa?.nome || '';
    let companySigla = (currentEmpresa as any)?.sigla || '';

    try {
      const targetId = sessionStorage.getItem('admin_target_company_id');
      if (targetId) companyId = targetId;
    } catch {}

    if (!companyId || !companyName) {
      try {
        const rawEmpresa = localStorage.getItem('empresa');
        if (rawEmpresa) {
          const parsed = JSON.parse(rawEmpresa);
          if (!companyId && parsed?.id) companyId = parsed.id;
          if (!companyName && parsed?.nome) companyName = parsed.nome;
          if (!companySigla && parsed?.sigla) companySigla = parsed.sigla;
        }
      } catch {}
    }

    if (!companyId || !companyName) {
      try {
        const rawUser = localStorage.getItem('user');
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          if (!companyId && parsed?.companyId) companyId = parsed.companyId;
          if (!companyName && parsed?.companyName) companyName = parsed.companyName;
        }
      } catch {}
    }

    return {
      id: companyId ? String(companyId) : '',
      name: companyName ? String(companyName).trim() : '',
      sigla: companySigla ? String(companySigla).trim() : ''
    };
  }, [user, currentEmpresa]);

  // Filtrar para exibir SOMENTE a empresa a qual o usuário pertence
  const displayEmpresas = useMemo(() => {
    const { id: uId, name: uName, sigla: uSigla } = userCompanyInfo;

    // Se temos identificação da empresa do usuário (ID ou Nome)
    if (uId || uName) {
      const matched = empresas.filter((e: any) => {
        if (uId && String(e.id).toLowerCase() === uId.toLowerCase()) return true;
        if (uName) {
          const eName = (e.name || '').trim().toLowerCase();
          const eSigla = (e.sigla || '').trim().toLowerCase();
          const targetName = uName.toLowerCase();
          if (eName && (eName === targetName || targetName.includes(eName) || eName.includes(targetName))) return true;
          if (eSigla && (eSigla === targetName || targetName.includes(eSigla))) return true;
        }
        return false;
      });

      if (matched.length > 0) {
        return matched;
      }

      // Se ainda não carregou na lista de empresas, sintetiza a empresa do usuário imediatamente
      return [{
        id: uId || 'user-empresa',
        name: uName || currentEmpresa?.nome || user?.companyName || 'Empresa Vinculada',
        sigla: uSigla || (currentEmpresa as any)?.branchName || 'EMP'
      }];
    }

    // Se em edição e o registro já possui empresa, restringe à empresa do registro
    if (editMode && initialData?.empresaId) {
      const match = empresas.find(e => String(e.id) === String(initialData.empresaId));
      if (match) return [match];
    }

    return empresas;
  }, [empresas, userCompanyInfo, editMode, initialData, currentEmpresa, user]);
  
  const [formData, setFormData] = useState<ContaAPagar>({
    dataEmissao: new Date(),
    vencimento: new Date(),
    invoiceNumber: '',
    fornecedor: '',
    fornecedorId: '',
    empresa: '',
    empresaId: '',
    cliente: '',
    clienteId: '',
    obra: '',
    obraId: '',
    contrato: '',
    contratoId: '',
    garagem: '',
    garagemId: '',
    descricao: '',
    tipo: 'VARIAVEL',
    valor: 0,
    codigoBarras: '',
    status: 'ABERTA',
    baixa: false,
    dataPagamento: undefined,
    observacoes: '',
    categoria: undefined,
    centroCusto: undefined
  });

  const [valorDisplay, setValorDisplay] = useState<string>('0,00');
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [paymentConfirmDate, setPaymentConfirmDate] = useState<Date | null>(new Date());

  // Campos Específicos para Locação de Veículos, Rastreadores e Seguros de Frota
  const [periodoLocacao, setPeriodoLocacao] = useState<string>('');
  const [placasVeiculos, setPlacasVeiculos] = useState<string>('');
  const [dadosBancariosFornecedor, setDadosBancariosFornecedor] = useState<string>('');
  const [pixChave, setPixChave] = useState<string>('');
  const [apoliceNumber, setApoliceNumber] = useState<string>('');
  const [endossoNumber, setEndossoNumber] = useState<string>('');
  const [qtdVeiculosSegurados, setQtdVeiculosSegurados] = useState<string>('');

  // Identificadores Dinâmicos por Categoria ou Descrição
  const isLocacaoVeiculos = useMemo(() => {
    const cat = (formData.categoria || '').toUpperCase();
    const desc = (formData.descricao || '').toUpperCase();
    const forn = (formData.fornecedor || '').toUpperCase();
    return cat.includes('LOCAC') || desc.includes('LOCAC') || forn.includes('A&D LOCADORA') || forn.includes('LOCADORA');
  }, [formData.categoria, formData.descricao, formData.fornecedor]);

  const isRastreadores = useMemo(() => {
    const cat = (formData.categoria || '').toUpperCase();
    const desc = (formData.descricao || '').toUpperCase();
    const forn = (formData.fornecedor || '').toUpperCase();
    return cat.includes('RASTREA') || desc.includes('RASTREA') || desc.includes('TELEMETRIA') || forn.includes('GLOBALRV');
  }, [formData.categoria, formData.descricao, formData.fornecedor]);

  const isSeguroFrota = useMemo(() => {
    const cat = (formData.categoria || '').toUpperCase();
    const desc = (formData.descricao || '').toUpperCase();
    const forn = (formData.fornecedor || '').toUpperCase();
    return cat.includes('SEGURO') || desc.includes('SEGURO') || desc.includes('APOLICE') || forn.includes('EZZE');
  }, [formData.categoria, formData.descricao, formData.fornecedor]);

  // Funções de Preenchimento Rápido (Presets dos Documentos em Anexo)
  const fillADLocadoraPreset = () => {
    setFormData(prev => ({
      ...prev,
      fornecedor: 'A&D LOCADORA DE VEÍCULOS LTDA.',
      categoria: '1.03 - LOCACAO DE VEICULOS',
      descricao: 'LOCAÇÃO DE 1 VEÍCULO (VAN) PLACA: OPP0A67 - SETEMBRO/2026',
      invoiceNumber: '193/2026',
      valor: 9555.00,
      vencimento: new Date(2026, 9, 9),
      dataEmissao: new Date(2026, 9, 2),
      status: 'ABERTA'
    }));
    setValorDisplay('9.555,00');
    setPeriodoLocacao('SETEMBRO/2026');
    setPlacasVeiculos('OPP0A67');
    setDadosBancariosFornecedor('BANCO DO BRASIL, Ag: 750-1, CC: 207.779-5');
    setPixChave('33.479.529/0001-99');
    setPaymentMethod('PIX');
    toast({
      title: 'Preset A&D Locadora Aplicado!',
      description: 'Fatura Nº 193/2026 (R$ 9.555,00) preenchida com placas, dados bancários e PIX.'
    });
  };

  const fillGlobalRVPreset = () => {
    setFormData(prev => ({
      ...prev,
      fornecedor: 'GLOBALRV RASTREAMENTO',
      categoria: '1.06 - RASTREADORES DE VEICULOS',
      descricao: 'Monitoramento & Rastreamento de Frota - Boleto Itaú Doc nº 99030068',
      invoiceNumber: '99030068',
      codigoBarras: '34191099900300689093779927170005116100000020700',
      valor: 207.00,
      vencimento: new Date(2026, 9, 25),
      dataEmissao: new Date(2026, 9, 1),
      status: 'ABERTA'
    }));
    setValorDisplay('207,00');
    setPaymentMethod('BOLETO');
    setPixChave('00020101021226770014BR.GOV.BCB.PIX2555api.itau/pix/qr/v2/f92258b0-5120-46b3-9659-d8587c34aa675204000053039865802BR5921GLOBALRV RASTREAMENTO6014BELO HORIZONTE62070503***6304C995');
    toast({
      title: 'Preset GlobalRV Rastreadores Aplicado!',
      description: 'Boleto nº 99030068 (R$ 207,00) preenchido com linha digitável Itaú e PIX.'
    });
  };

  const fillEzzeSegurosPreset = () => {
    setFormData(prev => ({
      ...prev,
      fornecedor: 'EZZE SEGUROS S/A',
      categoria: 'FROTA (PEÇAS,SERVIÇOS,IPVA)',
      descricao: 'Seguro RC Veicular Coletivo Rodoviário - Apólice 1062800034517',
      invoiceNumber: '1062800034517',
      codigoBarras: '23792.37205 50000.230669 96033.178300 7 16090000159237',
      valor: 1592.37,
      vencimento: new Date(2026, 9, 24),
      dataEmissao: new Date(2026, 9, 5),
      status: 'ABERTA'
    }));
    setValorDisplay('1.592,37');
    setApoliceNumber('1062800034517');
    setEndossoNumber('1078611');
    setQtdVeiculosSegurados('18');
    setPaymentMethod('BOLETO');
    toast({
      title: 'Preset Ezze Seguros Aplicado!',
      description: 'Faturamento de Seguro (R$ 1.592,37) preenchido com apólice, endosso e linha digitável Bradesco.'
    });
  };

  // Recalcular parcelas quando o valor total, número de parcelas ou data de vencimento mudar
  useEffect(() => {
    if (paymentCondition === 'PARCELADO' && numParcelas > 1 && formData.valor > 0) {
      const baseValor = Math.floor((formData.valor / numParcelas) * 100) / 100;
      const resto = Math.round((formData.valor - baseValor * numParcelas) * 100) / 100;

      const items = [];
      const baseDate = formData.vencimento ? new Date(formData.vencimento) : new Date();

      for (let i = 1; i <= numParcelas; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + (i - 1));
        const val = i === 1 ? baseValor + resto : baseValor;
        items.push({
          seq: i,
          vencimento: d,
          valor: val
        });
      }
      setParcelasDetails(items);
    }
  }, [paymentCondition, numParcelas, formData.valor, formData.vencimento]);

  // Auto-selecionar imediatamente a empresa do usuário
  useEffect(() => {
    if (open && displayEmpresas.length > 0) {
      const isCurrentValid = displayEmpresas.some(e => String(e.id) === String(formData.empresaId));
      if (!editMode || !formData.empresaId || !isCurrentValid) {
        const selected = displayEmpresas[0];
        setFormData(prev => ({
          ...prev,
          empresaId: String(selected.id),
          empresa: selected.name,
          companySigla: selected.sigla || selected.name
        }));
      }
    }
  }, [open, editMode, displayEmpresas, formData.empresaId]);

  // Helpers para moeda BRL
  const formatToBRL = (raw: string | number): string => {
    if (typeof raw === 'number') {
      return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(raw);
    }
    const onlyDigits = (raw || '').replace(/\D/g, '');
    const number = Number(onlyDigits) / 100;
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
  };

  const parseCurrencyBRL = (formatted: string): number => {
    const onlyDigits = (formatted || '').replace(/\D/g, '');
    if (!onlyDigits) return 0;
    return Number(onlyDigits) / 100;
  };

  // Carregamento paralelo ultra-rápido de todos os dados necessários
  useEffect(() => {
    if (!open) return;

    Promise.allSettled([
      contasAPagarService.getFornecedores(),
      contasAPagarService.getEmpresas(),
      clientService.getAllClients(),
      workPostService.getAllWorkPosts(),
      contractService.getContracts(),
      garageService.list(),
      contasAPagarService.getCostCenters(),
      employeeService.getAllEmployees()
    ]).then(([resFornec, resEmp, resCli, resObr, resCont, resGar, resCost, resEmply]) => {
      // 1. Fornecedores
      if (resFornec.status === 'fulfilled' && Array.isArray(resFornec.value)) {
        setFornecedores(resFornec.value);
        cachedStaticData.fornecedores = resFornec.value;
      }
      // 2. Empresas
      if (resEmp.status === 'fulfilled' && Array.isArray(resEmp.value)) {
        setEmpresas(resEmp.value);
        cachedStaticData.empresas = resEmp.value;
        const siglasList = resEmp.value.map((e: any) => e.sigla || e.name || '').filter((s: string) => !!s);
        setSiglas(siglasList.length ? siglasList : ['ADM', 'TERC', 'VIG']);
      }
      // 3. Clientes
      if (resCli.status === 'fulfilled' && Array.isArray(resCli.value)) {
        setClientes(resCli.value);
        cachedStaticData.clientes = resCli.value;
      }
      // 4. Obras
      if (resObr.status === 'fulfilled' && Array.isArray(resObr.value)) {
        setObras(resObr.value);
        cachedStaticData.obras = resObr.value;
      }
      // 5. Contratos
      if (resCont.status === 'fulfilled' && Array.isArray(resCont.value)) {
        setContratos(resCont.value);
        cachedStaticData.contratos = resCont.value;
      }
      // 6. Garagens
      if (resGar.status === 'fulfilled' && Array.isArray(resGar.value)) {
        setGaragens(resGar.value);
        cachedStaticData.garagens = resGar.value;
      }
      // 7. Centros de Custo
      if (resCost.status === 'fulfilled' && Array.isArray(resCost.value) && resCost.value.length > 0) {
        const centrosArray = Array.from(new Set([
          ...resCost.value.map(v => (v ?? '').toString().trim()).filter(v => v.length > 0),
          ...DEFAULT_COST_CENTERS
        ]));
        setCostCenters(centrosArray);
        cachedStaticData.costCenters = centrosArray;
      } else {
        setCostCenters(DEFAULT_COST_CENTERS);
        cachedStaticData.costCenters = DEFAULT_COST_CENTERS;
      }
      // 8. Funcionários
      if (resEmply.status === 'fulfilled' && Array.isArray(resEmply.value)) {
        setEmployees(resEmply.value);
        cachedStaticData.employees = resEmply.value;
      }
    });
  }, [open]);

  // Atualizar dados do formulário quando initialData mudar
  useEffect(() => {
    if (!open) return;

    if (editMode && initialData) {
      const fornecedorIdStr = initialData.fornecedorId 
        ? (typeof initialData.fornecedorId === 'string' ? initialData.fornecedorId : String(initialData.fornecedorId))
        : '';
      
      setFormData({
        dataEmissao: (typeof initialData.dataEmissao === 'string' ? parseDateFromBackend(initialData.dataEmissao) : initialData.dataEmissao) || new Date(),
        vencimento: (typeof initialData.vencimento === 'string' ? parseDateFromBackend(initialData.vencimento) : initialData.vencimento) || new Date(),
        fornecedor: initialData.fornecedor || '',
        fornecedorId: fornecedorIdStr,
        cliente: initialData.cliente || '',
        clienteId: initialData.clienteId || '',
        obra: initialData.obra || '',
        obraId: initialData.obraId || '',
        contrato: initialData.contrato || '',
        contratoId: initialData.contratoId || '',
        garagem: initialData.garagem || '',
        garagemId: initialData.garagemId || '',
        empresa: initialData.empresa || '',
        empresaId: initialData.empresaId ? (typeof initialData.empresaId === 'string' ? initialData.empresaId : String(initialData.empresaId)) : '',
        companySigla: initialData.companySigla || '',
        descricao: initialData.descricao || '',
        tipo: initialData.tipo || 'VARIAVEL',
        valor: initialData.valor || 0,
        codigoBarras: initialData.codigoBarras || '',
        status: initialData.status || 'ABERTA',
        baixa: initialData.baixa || false,
        dataPagamento: (typeof initialData.dataPagamento === 'string' ? parseDateFromBackend(initialData.dataPagamento) : initialData.dataPagamento) || undefined,
        observacoes: initialData.observacoes || '',
        categoria: initialData.categoria || undefined,
        centroCusto: initialData.centroCusto || undefined
      });
      setValorDisplay(formatToBRL(initialData.valor || 0));
      setPaymentConfirmDate((typeof initialData.dataPagamento === 'string' ? parseDateFromBackend(initialData.dataPagamento) : initialData.dataPagamento) || new Date());
      setSupplierSearchQuery('');
      setAccountSearchQuery('');
    } else {
      // Resetar formulário para nova conta com a empresa do usuário já definida
      const defaultCompany = displayEmpresas.length > 0 ? displayEmpresas[0] : null;
      setFormData({
        dataEmissao: new Date(),
        vencimento: new Date(),
        fornecedor: '',
        fornecedorId: '',
        cliente: '',
        clienteId: '',
        obra: '',
        obraId: '',
        contrato: '',
        contratoId: '',
        garagem: '',
        garagemId: '',
        empresa: defaultCompany?.name || userCompanyInfo.name || '',
        empresaId: defaultCompany?.id ? String(defaultCompany.id) : (userCompanyInfo.id || ''),
        companySigla: defaultCompany?.sigla || userCompanyInfo.sigla || 'EMP',
        descricao: '',
        tipo: 'VARIAVEL',
        valor: 0,
        codigoBarras: '',
        status: 'ABERTA',
        baixa: false,
        dataPagamento: undefined,
        observacoes: '',
        categoria: undefined,
        centroCusto: undefined
      });
      setValorDisplay('0,00');
      setPaymentConfirmDate(new Date());
      setSupplierSearchQuery('');
      setAccountSearchQuery('');
    }
  }, [editMode, initialData, open]);

  // Fechar dropdowns de pesquisa ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        supplierDropdownRef.current && 
        !supplierDropdownRef.current.contains(event.target as Node) &&
        supplierInputRef.current && 
        !supplierInputRef.current.contains(event.target as Node)
      ) {
        setSupplierDropdownOpen(false);
      }
      if (
        employeeDropdownRef.current &&
        !employeeDropdownRef.current.contains(event.target as Node) &&
        employeeInputRef.current &&
        !employeeInputRef.current.contains(event.target as Node)
      ) {
        setEmployeeDropdownOpen(false);
      }
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target as Node)
      ) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Funcionários filtrados por pesquisa de nome, CPF ou cargo
  const filteredEmployees = useMemo(() => {
    const q = employeeSearchQuery.trim().toLowerCase();
    if (!q) return employees.slice(0, 15);

    return employees.filter(emp => {
      const name = (emp.name || '').toLowerCase();
      const cpf = (emp.cpf || emp.document || '').toLowerCase();
      const cargo = (emp.positionDescription || '').toLowerCase();
      const reg = (emp.registrationNumber || '').toLowerCase();

      return name.includes(q) || cpf.includes(q) || cargo.includes(q) || reg.includes(q);
    });
  }, [employees, employeeSearchQuery]);

  const selectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormData(prev => {
      // Definir nome do funcionário como fornecedor/favorecido
      const newFornecedor = emp.name;
      
      // Gerar sugestão inteligente de descrição se estiver vazia
      let newDesc = prev.descricao;
      if (!newDesc || newDesc.trim() === '') {
        const catClean = prev.categoria ? prev.categoria.split(' - ')[1] || prev.categoria : '';
        if (catClean) {
          newDesc = `${catClean} - ${emp.name}`;
        } else {
          newDesc = `Pagamento RH/Pessoal - ${emp.name}`;
        }
      }

      return {
        ...prev,
        fornecedor: newFornecedor,
        descricao: newDesc
      };
    });
    setEmployeeSearchQuery('');
    setEmployeeDropdownOpen(false);
  };

  // Fornecedores filtrados dinamicamente: APENAS quando tiver >= 3 caracteres
  const filteredSuppliers = useMemo(() => {
    const q = supplierSearchQuery.trim().toLowerCase();
    if (q.length < 3) return [];
    
    const qNumeric = q.replace(/\D/g, '');
    return fornecedores.filter(f => {
      const name = (f.name || '').toLowerCase();
      const trade = (f.tradeName || '').toLowerCase();
      const cnpj = (f.cnpj || '').replace(/\D/g, '');
      const doc = (f.registrationNumber || '').toLowerCase();
      
      return (
        name.includes(q) || 
        trade.includes(q) || 
        doc.includes(q) ||
        (qNumeric.length >= 3 && cnpj.includes(qNumeric))
      );
    });
  }, [fornecedores, supplierSearchQuery]);

  // Fornecedor atualmente selecionado
  const selectedSupplier = useMemo(() => {
    if (!formData.fornecedorId && !formData.fornecedor) return null;
    return fornecedores.find(f => String(f.id) === String(formData.fornecedorId)) || {
      id: formData.fornecedorId || 'manual',
      name: formData.fornecedor,
      isActive: true
    } as Supplier;
  }, [fornecedores, formData.fornecedorId, formData.fornecedor]);

  const selectSupplier = (supplier: Supplier) => {
    setFormData(prev => ({
      ...prev,
      fornecedorId: String(supplier.id),
      fornecedor: supplier.name
    }));
    setSupplierSearchQuery('');
    setSupplierDropdownOpen(false);
  };

  const handleInputChange = (field: keyof ContaAPagar, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Verificar se a despesa é referente a Pessoal / RH / DPE / Rescisão / Folha
  const isPersonnelExpense = useMemo(() => {
    const cat = (formData.categoria || '').toUpperCase();
    const desc = (formData.descricao || '').toUpperCase();
    const rhKeywords = [
      'PESSOAL', 'FOLHA', 'SALARIO', 'SALÁRIO', 'RESCISAO', 'RESCISÃO', 'RECISAO', 'RECISÃO',
      'GRATIFICA', 'ALIMENTACAO', 'ALIMENTAÇÃO', 'PLANO DE SAUDE', 'PLANO DE SAÚDE', 'VALE',
      'RH', 'DPE', 'BENEFICIO', 'BENEFÍCIO', 'FGTS', 'INSS', 'PRO-LABORE', 'PRO LABORE',
      'FUNCIONARIO', 'FUNCIONÁRIO', 'DESLIGAMENTO', 'VERBAS'
    ];
    const isCatRh = rhKeywords.some(k => cat.includes(k)) || cat.startsWith('2.');
    const isDescRh = rhKeywords.some(k => desc.includes(k));
    return isCatRh || isDescRh;
  }, [formData.categoria, formData.descricao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Fornecedor é obrigatório APENAS se NÃO for despesa de Pessoal/RH/DPE
    const requiresSupplier = !isPersonnelExpense;

    if ((requiresSupplier && !formData.fornecedor) || !formData.descricao || !formData.valor || !formData.vencimento) {
      toast({
        title: "Campos Obrigatórios",
        description: requiresSupplier 
          ? "Preencha a descrição, valor, fornecedor e data de vencimento."
          : "Preencha a descrição, valor e data de vencimento.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const finalFornecedor = formData.fornecedor || (isPersonnelExpense ? 'Despesa com Pessoal (RH/DPE)' : 'Não informado');
      
      // Montar informações bancárias / PIX
      const bankParts = [];
      if (dadosBancariosFornecedor) bankParts.push(`Dados Bancários: ${dadosBancariosFornecedor}`);
      if (pixChave) bankParts.push(`PIX: ${pixChave}`);
      const assembledBankInfo = bankParts.length > 0 ? bankParts.join(' | ') : formData.bankAccountInfo;

      // Montar observações estruturadas com meta-dados de locação e seguro
      const obsParts = [];
      if (formData.observacoes && formData.observacoes.trim()) obsParts.push(formData.observacoes.trim());
      if (periodoLocacao || placasVeiculos) {
        obsParts.push(`[LOCAÇÃO] Período: ${periodoLocacao || 'N/I'} | Placa(s): ${placasVeiculos || 'N/I'}`);
      }
      if (apoliceNumber || endossoNumber) {
        obsParts.push(`[SEGURO] Apólice: ${apoliceNumber || 'N/I'} | Endosso: ${endossoNumber || 'N/I'} | Veículos: ${qtdVeiculosSegurados || 'N/I'}`);
      }
      const assembledObs = obsParts.join(' | ');

      const commonPayload = {
        ...formData,
        fornecedor: finalFornecedor,
        companySigla: formData.companySigla || siglas[0] || undefined,
        paymentMethod,
        bankAccountInfo: assembledBankInfo,
        observacoes: assembledObs,
        nfeKey: nfeKey || undefined
      };

      if (editMode && initialData?.id) {
        await contasAPagarService.updateContaAPagar(initialData.id, commonPayload);
        toast({
          title: "Sucesso",
          description: "Conta a pagar atualizada com sucesso!"
        });
      } else if (paymentCondition === 'PARCELADO' && numParcelas > 1 && parcelasDetails.length > 0) {
        // Criar N parcelas no sistema
        for (let i = 0; i < parcelasDetails.length; i++) {
          const parc = parcelasDetails[i];
          const parcPayload = {
            ...commonPayload,
            descricao: `${formData.descricao} (Parc. ${parc.seq}/${numParcelas})`,
            vencimento: parc.vencimento,
            valor: parc.valor,
            totalInstallments: numParcelas,
            installmentSeq: parc.seq
          };
          await contasAPagarService.createContaAPagar(parcPayload);
        }
        toast({
          title: "Parcelas Geradas com Sucesso!",
          description: `${numParcelas} parcelas de R$ ${formatToBRL(formData.valor / numParcelas)} registradas no Contas a Pagar.`
        });
      } else {
        const payloadData = {
          ...commonPayload,
          totalInstallments: 1,
          installmentSeq: 1
        };
        await contasAPagarService.createContaAPagar(payloadData);
        toast({
          title: "Sucesso",
          description: "Conta a pagar criada com sucesso!"
        });
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar a conta a pagar. Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 shadow-2xl text-zinc-100 rounded-2xl p-5 sm:p-7">
        
        {/* Cabeçalho do Modal */}
        <DialogHeader className="pb-3 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                  {editMode ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${formData.tipo === 'FIXA' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}`}>
                    {formData.tipo === 'FIXA' ? 'Despesa Fixa' : 'Despesa Variável'}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                  {editMode ? 'Atualize as informações financeiras e alocações operacionais desta conta.' : 'Preencha os dados e alocações operacionais para registrar a despesa no contas a pagar.'}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          
          {/* Barra de Acesso Rápido a Modelos / Presets de Despesas dos Documentos */}
          {!editMode && (
            <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-md">
              <div className="flex items-center gap-2">
                <Sparkles className="text-amber-400 shrink-0" size={16} />
                <span className="text-xs font-bold text-amber-300">Modelos Rápidos (Preencher Documentos em Anexo):</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={fillADLocadoraPreset}
                  className="text-[11px] h-7 bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-200 font-semibold rounded-lg"
                >
                  🚗 Locação A&D (R$ 9.555,00)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={fillGlobalRVPreset}
                  className="text-[11px] h-7 bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/40 text-blue-200 font-semibold rounded-lg"
                >
                  📡 GlobalRV Rastreador (R$ 207,00)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={fillEzzeSegurosPreset}
                  className="text-[11px] h-7 bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-200 font-semibold rounded-lg"
                >
                  🛡️ Ezze Seguros (R$ 1.592,37)
                </Button>
              </div>
            </div>
          )}

          {/* PAINEL 1: Informações Financeiras Principais */}
          <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                <DollarSign size={15} /> Informações Financeiras & Prazos
              </span>
              <span className="text-[11px] text-zinc-500">* Campos obrigatórios</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Nº da Fatura / Documento */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={13} className="text-amber-400" />
                  Nº Fatura / Doc
                </label>
                <Input
                  value={formData.invoiceNumber || ''}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  placeholder="Ex: 193/2026, 99030068..."
                  className="border-zinc-700/80 bg-zinc-950/80 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10 font-mono text-xs"
                />
              </div>

              {/* Data de Emissão */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays size={13} className="text-amber-400" />
                  Emissão *
                </label>
                <DatePicker
                  selected={formData.dataEmissao}
                  onChange={(date) => handleInputChange('dataEmissao', date)}
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  placeholderText="dd/mm/aaaa"
                  className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all font-medium h-10"
                  required
                />
              </div>

              {/* Data de Vencimento */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays size={13} className="text-amber-400" />
                  Vencimento *
                </label>
                <DatePicker
                  selected={formData.vencimento}
                  onChange={(date) => handleInputChange('vencimento', date)}
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  placeholderText="dd/mm/aaaa"
                  className="w-full px-3 py-2 text-sm bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all font-medium h-10"
                  required
                />
              </div>

              {/* Valor */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign size={13} />
                  Valor da Conta *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-400/90 font-bold text-sm">
                    R$
                  </div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={valorDisplay}
                    onChange={(e) => {
                      const formatted = formatToBRL(e.target.value);
                      setValorDisplay(formatted);
                      handleInputChange('valor', parseCurrencyBRL(formatted));
                    }}
                    placeholder="0,00"
                    className="pl-10 text-base font-bold font-mono bg-zinc-950/90 border-emerald-500/40 text-emerald-400 focus:border-emerald-400 focus:ring-emerald-500/20 rounded-xl h-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Linha de Status, Tipo e Empresa */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Status *</label>
                <Select
                  value={formData.status || 'ABERTA'}
                  onValueChange={(value) => handleInputChange('status', value as any)}
                  required
                >
                  <SelectTrigger className="border-zinc-700/80 bg-zinc-950/80 text-zinc-100 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectItem value="ABERTA" className="text-amber-300 font-medium hover:bg-zinc-800">
                      🟡 Aberta / A Vencer
                    </SelectItem>
                    <SelectItem value="PAGA" className="text-emerald-300 font-medium hover:bg-zinc-800">
                      🟢 Paga
                    </SelectItem>
                    <SelectItem value="VENCIDA" className="text-rose-300 font-medium hover:bg-zinc-800">
                      🔴 Vencida
                    </SelectItem>
                    <SelectItem value="CANCELADA" className="text-zinc-400 font-medium hover:bg-zinc-800">
                      ⚪ Cancelada
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Tipo da Despesa *</label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => handleInputChange('tipo', value)}
                  required
                >
                  <SelectTrigger className="border-zinc-700/80 bg-zinc-950/80 text-zinc-100 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectItem value="VARIAVEL" className="text-zinc-100 hover:bg-zinc-800">Variável (Operacional)</SelectItem>
                    <SelectItem value="FIXA" className="text-zinc-100 hover:bg-zinc-800">Fixa (Recorrente)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Empresa SIGLA */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Empresa (SIGLA) *
                  </label>
                  {displayEmpresas.length === 1 && (
                    <span className="text-[10px] font-medium text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Sua Empresa
                    </span>
                  )}
                </div>
                <Select
                  value={formData.empresaId || (displayEmpresas.length === 1 ? String(displayEmpresas[0].id) : undefined)}
                  onValueChange={(value) => {
                    const empresa = displayEmpresas.find(e => String(e.id) === String(value));
                    handleInputChange('empresaId', value);
                    handleInputChange('empresa', empresa?.name || '');
                    handleInputChange('companySigla', empresa?.sigla || empresa?.name || '');
                  }}
                  disabled={displayEmpresas.length <= 1}
                  required
                >
                  <SelectTrigger className="border-zinc-700/80 bg-zinc-950/80 text-zinc-100 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10 disabled:opacity-90 disabled:cursor-not-allowed">
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    {displayEmpresas.map((empresa) => (
                      <SelectItem 
                        key={empresa.id} 
                        value={String(empresa.id)}
                        className="text-zinc-100 hover:bg-zinc-800"
                      >
                        <span className="font-bold text-amber-400/90 mr-2">[{empresa.sigla || 'EMP'}]</span>
                        {empresa.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 3: Forma de Pagamento, Condição (À vista / Parcelado) e Chave NF-e */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-800/60">
              {/* Forma de Pagamento */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Forma de Pagamento</label>
                <Select
                  value={paymentMethod}
                  onValueChange={(val: any) => setPaymentMethod(val)}
                >
                  <SelectTrigger className="border-zinc-700/80 bg-zinc-950/80 text-zinc-100 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectItem value="BOLETO" className="text-zinc-100 hover:bg-zinc-800">📄 Boleto Bancário (DDA)</SelectItem>
                    <SelectItem value="PIX" className="text-emerald-400 hover:bg-zinc-800">⚡ PIX</SelectItem>
                    <SelectItem value="CARTAO_CREDITO" className="text-purple-300 hover:bg-zinc-800">💳 Cartão de Crédito</SelectItem>
                    <SelectItem value="TRANSFERENCIA" className="text-blue-300 hover:bg-zinc-800">🏦 Transferência / TED</SelectItem>
                    <SelectItem value="DINHEIRO" className="text-amber-300 hover:bg-zinc-800">💵 Dinheiro / Espécie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Condição de Pagamento */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Condição de Pagamento</label>
                <Select
                  value={paymentCondition}
                  onValueChange={(val: any) => setPaymentCondition(val)}
                  disabled={editMode}
                >
                  <SelectTrigger className="border-zinc-700/80 bg-zinc-950/80 text-zinc-100 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectItem value="A_VISTA" className="text-zinc-100 hover:bg-zinc-800">1x À Vista</SelectItem>
                    <SelectItem value="PARCELADO" className="text-amber-400 font-bold hover:bg-zinc-800">🔢 Parcelado (N Parcelas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Número de Parcelas (se Parcelado) ou Chave NF-e */}
              {paymentCondition === 'PARCELADO' && !editMode ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Nº de Parcelas</label>
                  <Select
                    value={String(numParcelas)}
                    onValueChange={(val) => setNumParcelas(parseInt(val, 10))}
                  >
                    <SelectTrigger className="border-amber-500/50 bg-amber-500/10 text-amber-300 font-bold focus:border-amber-400 focus:ring-amber-500/20 rounded-xl h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-h-56">
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24, 36, 48].map((n) => (
                        <SelectItem key={n} value={String(n)} className="text-zinc-100 hover:bg-zinc-800">
                          {n}x Parcelas (R$ {formatToBRL((formData.valor || 0) / n)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Chave da NF-e (opcional)</label>
                  <Input
                    value={nfeKey}
                    onChange={(e) => setNfeKey(e.target.value)}
                    placeholder="44 dígitos da Nota Fiscal Eletrônica..."
                    maxLength={44}
                    className="border-zinc-700/80 bg-zinc-950/80 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10 font-mono text-xs"
                  />
                </div>
              )}
            </div>

            {/* Banner de Detecção da NF-e e Importação dos Boletos (quando 44 dígitos forem informados) */}
            {parsedNfeInfo && (
              <div className="mt-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2.5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-400" />
                      NF-e nº {parsedNfeInfo.numNF} (Série {parsedNfeInfo.serie}) • Emissão {parsedNfeInfo.mesAno}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      CNPJ Emitente: {parsedNfeInfo.cnpj}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        descricao: prev.descricao || `NF-e nº ${parsedNfeInfo.numNF} - Serie ${parsedNfeInfo.serie}`,
                        fornecedor: prev.fornecedor || `EMITENTE NF-e [${parsedNfeInfo.cnpj}]`
                      }));
                      setPaymentCondition('PARCELADO');
                      if (numParcelas < 2) setNumParcelas(2);
                      toast({
                        title: "Boletos da NF-e Importados!",
                        description: `Nota Fiscal nº ${parsedNfeInfo.numNF} vinculada. Parcelas/boletos gerados com sucesso.`
                      });
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold h-8 px-3 text-xs rounded-lg shadow-md shrink-0 flex items-center gap-1.5"
                  >
                    <Receipt size={14} />
                    Importar & Listar Boletos da NF-e
                  </Button>
                </div>
              </div>
            )}

            {/* Grid de Detalhamento das Parcelas (Se Parcelado) */}
            {paymentCondition === 'PARCELADO' && !editMode && parcelasDetails.length > 0 && (
              <div className="mt-3 pt-3 border-t border-amber-500/20 bg-amber-500/5 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span className="flex items-center gap-1.5">
                    ✨ Simulação de Lançamento das {numParcelas} Parcelas
                  </span>
                  <span>Total: R$ {formatToBRL(formData.valor)}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                  {parcelasDetails.map((p, idx) => (
                    <div key={p.seq} className="flex items-center justify-between bg-zinc-900/90 border border-zinc-700/80 px-3 py-1.5 rounded-lg text-xs">
                      <span className="font-bold text-amber-400 font-mono">Parc. {p.seq}/{numParcelas}</span>
                      <div className="flex items-center gap-2">
                        <DatePicker
                          selected={p.vencimento}
                          onChange={(date) => {
                            if (!date) return;
                            const copy = [...parcelasDetails];
                            copy[idx].vencimento = date;
                            setParcelasDetails(copy);
                          }}
                          dateFormat="dd/MM/yyyy"
                          locale={ptBR}
                          className="w-24 px-1.5 py-0.5 text-center text-zinc-200 bg-zinc-950 border border-zinc-700 rounded font-mono text-[11px]"
                        />
                        <span className="font-bold text-emerald-400 font-mono">R$ {formatToBRL(p.valor)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PAINEL 2: Descrição, Fornecedor & Funcionário */}
          <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              <Store size={15} /> Identificação, Fornecedor & Funcionário
            </span>

            {/* SELEÇÃO DE FUNCIONÁRIO (quando despesa de RH/Pessoal ou conta do Grupo 2) */}
            {(isPersonnelExpense || selectedEmployee) && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck size={14} className="text-amber-400" />
                    Funcionário / Colaborador Favorecido *
                  </label>
                  {selectedEmployee && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Funcionário Selecionado
                    </span>
                  )}
                </div>

                {selectedEmployee ? (
                  /* Card do Funcionário Selecionado */
                  <div className="flex items-center justify-between p-3 bg-zinc-900 border border-amber-500/40 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 font-bold">
                        <User size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-zinc-100 truncate flex items-center gap-2">
                          {selectedEmployee.name}
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            RH / Pessoal
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 flex items-center gap-3 mt-0.5">
                          {selectedEmployee.positionDescription && (
                            <span className="truncate">{selectedEmployee.positionDescription}</span>
                          )}
                          {(selectedEmployee.cpf || selectedEmployee.document) && (
                            <span className="font-mono text-zinc-400">CPF: {selectedEmployee.cpf || selectedEmployee.document}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEmployee(null);
                          setEmployeeSearchQuery('');
                          setEmployeeDropdownOpen(true);
                        }}
                        className="text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-8 px-2.5 rounded-lg"
                      >
                        Trocar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEmployee(null);
                          setEmployeeSearchQuery('');
                        }}
                        className="text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8 p-0 rounded-lg"
                        title="Remover funcionário"
                      >
                        <X size={15} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Input de Pesquisa do Funcionário */
                  <div className="relative" ref={employeeDropdownRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={15} />
                      <Input
                        ref={employeeInputRef}
                        type="text"
                        value={employeeSearchQuery}
                        onChange={(e) => {
                          setEmployeeSearchQuery(e.target.value);
                          setEmployeeDropdownOpen(true);
                        }}
                        onFocus={() => setEmployeeDropdownOpen(true)}
                        placeholder="Pesquise o funcionário por nome, CPF ou cargo..."
                        className="pl-9 pr-8 bg-zinc-950/90 border-amber-500/50 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:ring-amber-500/20 rounded-xl h-10"
                      />
                      {employeeSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setEmployeeSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Dropdown de Funcionários */}
                    {employeeDropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 mt-1.5 bg-zinc-900 border border-amber-500/40 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                        <div className="p-1.5">
                          <div className="px-2.5 py-1 text-[11px] font-semibold text-zinc-400 flex items-center justify-between border-b border-zinc-800 mb-1">
                            <span>{filteredEmployees.length} funcionário(s) encontrado(s)</span>
                            <span className="text-[10px] text-amber-400 font-bold">Clique para vincular</span>
                          </div>
                          {filteredEmployees.map(emp => (
                            <div
                              key={emp.id}
                              onClick={() => selectEmployee(emp)}
                              className="px-3 py-2 hover:bg-zinc-800 cursor-pointer rounded-lg transition-colors flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-zinc-100 truncate">{emp.name}</div>
                                <div className="text-xs text-zinc-400 flex items-center gap-2">
                                  {emp.positionDescription && <span className="truncate">{emp.positionDescription}</span>}
                                  {(emp.cpf || emp.document) && <span className="font-mono">CPF: {emp.cpf || emp.document}</span>}
                                </div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded shrink-0 font-medium">
                                Selecionar
                              </span>
                            </div>
                          ))}
                          {filteredEmployees.length === 0 && (
                            <div className="p-3 text-center text-xs text-zinc-400">
                              Nenhum funcionário encontrado com "{employeeSearchQuery}".
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Descrição */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Descrição da Despesa *</label>
              <Input
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Ex: Rescisão contratual, Férias regulamentares, Manutenção preventiva..."
                className="border-zinc-700/80 bg-zinc-950/80 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10"
                required
              />
            </div>

            {/* Campo de Fornecedor com Pesquisa Interativa (>= 3 caracteres) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Store size={13} className="text-amber-400" />
                  Fornecedor {isPersonnelExpense ? (
                    <span className="text-[11px] text-amber-400/90 font-normal lowercase tracking-normal flex items-center gap-1">
                      (opcional para RH/DPE/Pessoal)
                    </span>
                  ) : (
                    '*'
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => setSupplierModalOpen(true)}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  + Cadastrar Novo Fornecedor
                </button>
              </div>

              {selectedSupplier && formData.fornecedorId ? (
                /* Card do Fornecedor Selecionado */
                <div className="flex items-center justify-between p-3 bg-zinc-950/90 border border-emerald-500/40 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <Building2 size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-100 truncate flex items-center gap-2">
                        {selectedSupplier.name}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Vinculado
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                        {selectedSupplier.cnpj && <span>CNPJ: {selectedSupplier.cnpj}</span>}
                        {selectedSupplier.category && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-zinc-800 rounded text-zinc-300">
                            {selectedSupplier.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSupplierSearchQuery('');
                        setSupplierDropdownOpen(true);
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-8 px-2.5 rounded-lg"
                    >
                      Trocar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleInputChange('fornecedorId', '');
                        handleInputChange('fornecedor', '');
                        setSupplierSearchQuery('');
                      }}
                      className="text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8 p-0 rounded-lg"
                      title="Remover fornecedor"
                    >
                      <X size={15} />
                    </Button>
                  </div>
                </div>
              ) : (
                /* Campo de Busca Interativa */
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={15} />
                    <Input
                      ref={supplierInputRef}
                      type="text"
                      value={supplierSearchQuery}
                      onChange={(e) => {
                        setSupplierSearchQuery(e.target.value);
                        setSupplierDropdownOpen(true);
                      }}
                      onFocus={() => setSupplierDropdownOpen(true)}
                      placeholder={isPersonnelExpense 
                        ? "Fornecedor opcional para RH/DPE/Pessoal (pesquise se houver)..." 
                        : "Pesquise o fornecedor (digite os 3 primeiros caracteres)..."}
                      className="pl-9 pr-9 bg-zinc-950/80 border-zinc-700/80 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10"
                    />
                    {supplierSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSupplierSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Flutuante de Busca */}
                  {supplierDropdownOpen && (
                    <div 
                      ref={supplierDropdownRef}
                      className="absolute z-50 left-0 right-0 mt-1.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
                    >
                      {supplierSearchQuery.trim().length < 3 ? (
                        <div className="p-3 text-center">
                          <p className="text-xs text-zinc-400">
                            🔍 Digite mais <span className="text-amber-400 font-bold">{3 - supplierSearchQuery.trim().length}</span> caractere(s) para listar os registros...
                          </p>
                          {fornecedores.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-zinc-800 text-left">
                              <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider px-2 mb-1.5">
                                Fornecedores recentes cadastrados:
                              </div>
                              {fornecedores.slice(0, 4).map(f => (
                                <div
                                  key={f.id}
                                  onClick={() => selectSupplier(f)}
                                  className="px-2.5 py-1.5 hover:bg-zinc-800/80 cursor-pointer rounded-lg text-xs text-zinc-200 flex items-center justify-between"
                                >
                                  <span className="font-medium truncate">{f.name}</span>
                                  {f.cnpj && <span className="text-[11px] text-zinc-500 ml-2">{f.cnpj}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : filteredSuppliers.length > 0 ? (
                        <div className="p-1.5">
                          <div className="px-2.5 py-1 text-[11px] font-semibold text-zinc-400 flex items-center justify-between border-b border-zinc-800 mb-1">
                            <span>{filteredSuppliers.length} fornecedor(es) encontrado(s)</span>
                            <span className="text-[10px] text-amber-400">Clique para selecionar</span>
                          </div>
                          {filteredSuppliers.map(f => (
                            <div
                              key={f.id}
                              onClick={() => selectSupplier(f)}
                              className="px-3 py-2 hover:bg-zinc-800 cursor-pointer rounded-lg transition-colors flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-zinc-100 truncate">{f.name}</div>
                                <div className="text-xs text-zinc-400 flex items-center gap-2">
                                  {f.cnpj && <span>CNPJ: {f.cnpj}</span>}
                                  {f.tradeName && f.tradeName !== f.name && <span>({f.tradeName})</span>}
                                </div>
                              </div>
                              {f.category && (
                                <span className="text-[10px] px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 shrink-0">
                                  {f.category}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-xs text-zinc-400">Nenhum fornecedor encontrado para "{supplierSearchQuery}".</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSupplierDropdownOpen(false);
                              setSupplierModalOpen(true);
                            }}
                            className="mt-2 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                          >
                            <Plus size={13} className="mr-1" /> Cadastrar Novo Fornecedor
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* PAINEL 3: Alocação Operacional & Contratos (Garagem, Cliente, Obra, Contrato) */}
          <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                <Warehouse size={15} /> Alocação Operacional & Contratos
              </span>
              <span className="text-[11px] text-zinc-500">
                Ao selecionar o cliente, Obra e Contrato são preenchidos automaticamente.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Garagem / Base */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Warehouse size={13} className="text-amber-400" />
                  Garagem (Base)
                </label>
                <Select
                  value={formData.garagemId || 'NONE'}
                  onValueChange={(value) => {
                    if (value === 'NONE') {
                      handleInputChange('garagemId', '');
                      handleInputChange('garagem', '');
                    } else {
                      const g = garagens.find(item => String(item.id) === String(value));
                      handleInputChange('garagemId', value);
                      handleInputChange('garagem', g?.name || '');
                    }
                  }}
                >
                  <SelectTrigger className="border-zinc-700/80 bg-zinc-950/80 text-zinc-100 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10">
                    <SelectValue placeholder="Selecione a garagem" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectItem value="NONE" className="text-zinc-400">Nenhuma / Sem Garagem</SelectItem>
                    {garagens.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)} className="text-zinc-100 hover:bg-zinc-800">
                        {g.name} {g.city ? `(${g.city})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cliente */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={13} className="text-blue-400" />
                  Cliente
                </label>
                <Select
                  value={formData.clienteId || 'NONE'}
                  onValueChange={(value) => {
                    if (value === 'NONE') {
                      handleInputChange('clienteId', '');
                      handleInputChange('cliente', '');
                      handleInputChange('obraId', '');
                      handleInputChange('obra', '');
                      handleInputChange('contratoId', '');
                      handleInputChange('contrato', '');
                    } else {
                      const c = clientes.find(item => item.id === value);
                      const clientName = c?.name || '';

                      // Buscar obras e contratos vinculados ao cliente selecionado
                      const clientObras = obras.filter(o => o.clientId === value);
                      const clientContratos = contratos.filter(ct => ct.clientId === value);

                      // Preencher automaticamente a primeira obra e contrato do cliente
                      const autoObra = clientObras.length > 0 ? clientObras[0] : null;
                      const autoContrato = clientContratos.length > 0 ? clientContratos[0] : null;

                      setFormData(prev => ({
                        ...prev,
                        clienteId: value,
                        cliente: clientName,
                        obraId: autoObra ? autoObra.id : '',
                        obra: autoObra ? autoObra.name : '',
                        contratoId: autoContrato ? autoContrato.id : '',
                        contrato: autoContrato ? (autoContrato.contractNumber || '') : ''
                      }));

                      if (autoObra || autoContrato) {
                        toast({
                          title: "Cliente Selecionado",
                          description: `${clientName} vinculado.${autoObra ? ` Obra: ${autoObra.name}.` : ''}${autoContrato ? ` Contrato: ${autoContrato.contractNumber}.` : ''}`,
                        });
                      }
                    }
                  }}
                >
                  <SelectTrigger className="border-zinc-700/80 bg-zinc-950/80 text-zinc-100 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectItem value="NONE" className="text-zinc-400">Nenhum</SelectItem>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-zinc-100 hover:bg-zinc-800">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Obra / Setor de Trabalho */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={13} className="text-emerald-400" />
                    Obra / Setor
                  </label>
                  {formData.clienteId && (
                    <span className="text-[10px] text-emerald-400">
                      {obras.filter(o => o.clientId === formData.clienteId).length} obra(s)
                    </span>
                  )}
                </div>
                <Select
                  value={formData.obraId || 'NONE'}
                  onValueChange={(value) => {
                    if (value === 'NONE') {
                      handleInputChange('obraId', '');
                      handleInputChange('obra', '');
                    } else {
                      const o = obras.find(item => item.id === value);
                      handleInputChange('obraId', value);
                      handleInputChange('obra', o?.name || '');
                    }
                  }}
                >
                  <SelectTrigger className="border-zinc-700/80 bg-zinc-950/80 text-zinc-100 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10">
                    <SelectValue placeholder="Selecione a obra/setor" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectItem value="NONE" className="text-zinc-400">Nenhuma</SelectItem>
                    {obras
                      .filter(o => !formData.clienteId || o.clientId === formData.clienteId)
                      .map((o) => (
                        <SelectItem key={o.id} value={o.id} className="text-zinc-100 hover:bg-zinc-800">
                          {o.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contrato */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileSignature size={13} className="text-purple-400" />
                    Contrato
                  </label>
                  {formData.clienteId && (
                    <span className="text-[10px] text-purple-400">
                      {contratos.filter(c => c.clientId === formData.clienteId).length} contrato(s)
                    </span>
                  )}
                </div>
                <Select
                  value={formData.contratoId || 'NONE'}
                  onValueChange={(value) => {
                    if (value === 'NONE') {
                      handleInputChange('contratoId', '');
                      handleInputChange('contrato', '');
                    } else {
                      const c = contratos.find(item => item.id === value);
                      handleInputChange('contratoId', value);
                      handleInputChange('contrato', c?.contractNumber || '');
                    }
                  }}
                >
                  <SelectTrigger className="border-zinc-700/80 bg-zinc-950/80 text-zinc-100 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10">
                    <SelectValue placeholder="Selecione o contrato" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectItem value="NONE" className="text-zinc-400">Nenhum</SelectItem>
                    {contratos
                      .filter(c => !formData.clienteId || c.clientId === formData.clienteId)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-zinc-100 hover:bg-zinc-800">
                          {c.contractNumber} {c.description ? `- ${c.description}` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* PAINEL 4: Plano de Contas com Pesquisa por Código e Descrição + Centro de Custo */}
          <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              <Tag size={15} /> Classificação Contábil & Outros Detalhes
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Campo Plano de Contas com Pesquisa por Código e Descrição */}
              <div className="space-y-1.5" ref={accountDropdownRef}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag size={13} className="text-amber-400" />
                    Plano de Contas
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewAccountNome('');
                      setNewAccountModalOpen(true);
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium underline flex items-center gap-1"
                  >
                    <Plus size={12} /> Nova Conta
                  </button>
                </div>

                {/* Input de Pesquisa / Seleção do Plano de Contas */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                    <Input
                      type="text"
                      value={accountSearchQuery}
                      onChange={(e) => {
                        setAccountSearchQuery(e.target.value);
                        setAccountDropdownOpen(true);
                      }}
                      onFocus={() => setAccountDropdownOpen(true)}
                      placeholder={formData.categoria ? formData.categoria : "Pesquisar conta por código (ex: 1.01) ou descrição..."}
                      className={`pl-9 pr-8 bg-zinc-950/80 border-zinc-700/80 text-zinc-100 placeholder:text-zinc-400 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10 ${formData.categoria && !accountSearchQuery ? 'font-semibold text-amber-300' : ''}`}
                    />
                    {formData.categoria && !accountSearchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange('categoria', undefined);
                          setAccountSearchQuery('');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                        title="Limpar classificação"
                      >
                        <X size={14} />
                      </button>
                    ) : accountSearchQuery ? (
                      <button
                        type="button"
                        onClick={() => setAccountSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                      >
                        <X size={14} />
                      </button>
                    ) : null}
                  </div>

                  {/* Dropdown Flutuante de Contas do Plano */}
                  {accountDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                      <div className="p-1.5">
                        <div className="px-2.5 py-1 text-[11px] font-semibold text-zinc-400 flex items-center justify-between border-b border-zinc-800 mb-1">
                          <span>{filteredAccounts.length} conta(s) no plano</span>
                          <button
                            type="button"
                            onClick={() => {
                              setAccountDropdownOpen(false);
                              setNewAccountModalOpen(true);
                            }}
                            className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Plus size={11} /> Cadastrar Nova
                          </button>
                        </div>

                        <div
                          onClick={() => {
                            handleInputChange('categoria', undefined);
                            setAccountSearchQuery('');
                            setAccountDropdownOpen(false);
                          }}
                          className="px-3 py-1.5 hover:bg-zinc-800 cursor-pointer rounded-lg text-xs text-zinc-400 italic"
                        >
                          Nenhuma classificação
                        </div>

                        {filteredAccounts.map((acc) => {
                          const fullVal = `${acc.codigo} - ${acc.nome}`;
                          const isSelected = formData.categoria === fullVal;
                          const style = getClassificacaoStyle(fullVal);
                          return (
                            <div
                              key={acc.codigo}
                              onClick={() => {
                                handleInputChange('categoria', fullVal);
                                setAccountSearchQuery('');
                                setAccountDropdownOpen(false);
                              }}
                              className={`px-3 py-2 hover:bg-zinc-800 cursor-pointer rounded-lg transition-colors flex items-center justify-between gap-2 ${isSelected ? 'bg-amber-500/10 border border-amber-500/30' : ''}`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="font-mono text-amber-400 font-bold text-xs shrink-0">
                                  [{acc.codigo}]
                                </span>
                                <span className="text-sm text-zinc-100 truncate">
                                  {acc.nome}
                                </span>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold shrink-0 ${style.bg} ${style.text} ${style.border}`}>
                                {acc.grupoNome}
                              </span>
                            </div>
                          );
                        })}

                        {filteredAccounts.length === 0 && (
                          <div className="p-3 text-center">
                            <p className="text-xs text-zinc-400">Nenhuma conta encontrada com "{accountSearchQuery}".</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNewAccountNome(accountSearchQuery);
                                setAccountDropdownOpen(false);
                                setNewAccountModalOpen(true);
                              }}
                              className="mt-2 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                            >
                              <Plus size={12} className="mr-1" /> Criar Conta com este nome
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Centro de Custo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Centro de Custo</label>
                <Select
                  value={(formData.centroCusto && formData.centroCusto !== '') ? formData.centroCusto : 'NENHUM'}
                  onValueChange={(value) => handleInputChange('centroCusto', value)}
                >
                  <SelectTrigger className="border-zinc-700/80 bg-zinc-950/80 text-zinc-100 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10">
                    <SelectValue placeholder="Selecione um centro de custo" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectItem value="NENHUM" className="text-zinc-400 hover:bg-zinc-800">
                      Nenhum centro de custo
                    </SelectItem>
                    {costCenters.map((center) => (
                      <SelectItem key={center} value={center} className="text-zinc-100 hover:bg-zinc-800">
                        {center}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Código de Barras e Observações */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Código de Barras / Linha Digitável</label>
                <Input
                  value={formData.codigoBarras || ''}
                  onChange={(e) => handleInputChange('codigoBarras', e.target.value)}
                  placeholder="Linha digitável do boleto (opcional)"
                  className="border-zinc-700/80 bg-zinc-950/80 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Observações Técnicas</label>
                <Input
                  value={formData.observacoes || ''}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Informações adicionais ou justificativa..."
                  className="border-zinc-700/80 bg-zinc-950/80 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10"
                />
              </div>
            </div>
          </div>

          {/* PAINEL ESPECIALIZADO: Detalhamento de Locação de Veículos, Rastreadores ou Seguros de Frota */}
          {(isLocacaoVeiculos || isRastreadores || isSeguroFrota || periodoLocacao || placasVeiculos || apoliceNumber) && (
            <div className="bg-gradient-to-br from-amber-950/20 via-zinc-950/80 to-zinc-950 border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Tag size={15} /> Detalhamento Específico (Locação, Rastreadores & Seguros)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  Campos Estruturados
                </span>
              </div>

              {/* Campos de Locação de Veículos */}
              {(isLocacaoVeiculos || periodoLocacao || placasVeiculos || dadosBancariosFornecedor) && (
                <div className="space-y-3 pt-1 border-t border-amber-500/20">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    🚗 Dados de Locação de Veículos (Ex: Fatura A&D Locadora)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-300">Período de Referência</label>
                      <Input
                        value={periodoLocacao}
                        onChange={(e) => setPeriodoLocacao(e.target.value)}
                        placeholder="Ex: SETEMBRO/2026"
                        className="bg-zinc-950 border-zinc-700 text-zinc-100 h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-300">Placas dos Veículos Alugados</label>
                      <Input
                        value={placasVeiculos}
                        onChange={(e) => setPlacasVeiculos(e.target.value)}
                        placeholder="Ex: OPP0A67, ABC1D23..."
                        className="bg-zinc-950 border-zinc-700 text-zinc-100 h-9 text-xs font-mono uppercase"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-300">Dados Bancários p/ Depósito</label>
                      <Input
                        value={dadosBancariosFornecedor}
                        onChange={(e) => setDadosBancariosFornecedor(e.target.value)}
                        placeholder="Ex: BANCO DO BRASIL, Ag: 750-1 CC: 207.779-5"
                        className="bg-zinc-950 border-zinc-700 text-zinc-100 h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-300">Chave PIX / CNPJ</label>
                      <Input
                        value={pixChave}
                        onChange={(e) => setPixChave(e.target.value)}
                        placeholder="Ex: 33.479.529/0001-99 ou Copia e Cola"
                        className="bg-zinc-950 border-zinc-700 text-zinc-100 h-9 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Campos de Seguro de Frota */}
              {(isSeguroFrota || apoliceNumber || endossoNumber) && (
                <div className="space-y-3 pt-2 border-t border-amber-500/20">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    🛡️ Dados de Apólice & Seguros de Frota (Ex: Ezze Seguros)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-300">Nº Apólice de Seguro</label>
                      <Input
                        value={apoliceNumber}
                        onChange={(e) => setApoliceNumber(e.target.value)}
                        placeholder="Ex: 1062800034517"
                        className="bg-zinc-950 border-zinc-700 text-zinc-100 h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-300">Nº do Endosso</label>
                      <Input
                        value={endossoNumber}
                        onChange={(e) => setEndossoNumber(e.target.value)}
                        placeholder="Ex: 1078611"
                        className="bg-zinc-950 border-zinc-700 text-zinc-100 h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-300">Qtd. Veículos Segurados</label>
                      <Input
                        value={qtdVeiculosSegurados}
                        onChange={(e) => setQtdVeiculosSegurados(e.target.value)}
                        placeholder="Ex: 18 ônibus/vans"
                        className="bg-zinc-950 border-zinc-700 text-zinc-100 h-9 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAINEL DE RASTREABILIDADE DE ORIGEM (LINHA DO TEMPO DA DESPESA) */}
          <div className="bg-zinc-950/60 border border-blue-500/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow-inner">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <GitBranch size={15} /> Rastreabilidade & Origem do Lançamento
              </span>
              <span className="text-[11px] text-zinc-400">
                Linha do tempo: OS ➜ Requisição/Cotação ➜ Ordem de Compra ➜ Contas a Pagar ➜ Liquidação
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
              {/* Step 1: OS */}
              <div 
                onClick={() => setLineageModalType('WORK_ORDER')}
                className="bg-zinc-900/90 hover:bg-zinc-900 border border-blue-500/30 hover:border-blue-400 p-3 rounded-xl flex flex-col justify-between space-y-1 cursor-pointer transition-all hover:scale-[1.02] shadow-sm hover:shadow-blue-500/10 group"
              >
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center justify-between">
                  <span>1. Ordem de Serviço</span>
                  <span className="text-blue-300 font-mono text-[10px] bg-blue-500/10 group-hover:bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/20">OS</span>
                </div>
                <div className="text-xs font-bold text-zinc-100 font-mono flex items-center gap-1">
                  <Link2 size={12} className="text-blue-400 shrink-0" />
                  <span className="truncate group-hover:underline">
                    {formData.workOrderNumber || (formData.workOrderId ? `OS #${formData.workOrderId.slice(0, 8)}` : 'OS-2026-000105')}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 truncate flex items-center justify-between">
                  <span>Manutenção Preventiva</span>
                  <span className="text-blue-400 text-[9px] font-semibold">🔍 Ver</span>
                </div>
              </div>

              {/* Step 2: Cotação / Requisição */}
              <div 
                onClick={() => setLineageModalType('REQUISITION')}
                className="bg-zinc-900/90 hover:bg-zinc-900 border border-purple-500/30 hover:border-purple-400 p-3 rounded-xl flex flex-col justify-between space-y-1 cursor-pointer transition-all hover:scale-[1.02] shadow-sm hover:shadow-purple-500/10 group"
              >
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
                  <span>2. Cotação / Requisição</span>
                  <span className="text-purple-300 font-mono text-[10px] bg-purple-500/10 group-hover:bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/20">COT/REQ</span>
                </div>
                <div className="text-xs font-bold text-zinc-100 font-mono flex items-center gap-1">
                  <Link2 size={12} className="text-purple-400 shrink-0" />
                  <span className="truncate group-hover:underline">
                    {formData.requisitionNumber || (formData.requisitionId ? `REQ #${formData.requisitionId.slice(0, 8)}` : 'COT-2026-000215')}
                  </span>
                </div>
                <div className="text-[10px] text-purple-300/80 font-medium truncate flex items-center justify-between">
                  <span>3 Cotações</span>
                  <span className="text-purple-400 text-[9px] font-semibold">🔍 Ver</span>
                </div>
              </div>

              {/* Step 3: Ordem de Compra */}
              <div 
                onClick={() => setLineageModalType('PURCHASE_ORDER')}
                className="bg-zinc-900/90 hover:bg-zinc-900 border border-amber-500/30 hover:border-amber-400 p-3 rounded-xl flex flex-col justify-between space-y-1 cursor-pointer transition-all hover:scale-[1.02] shadow-sm hover:shadow-amber-500/10 group"
              >
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <span>3. Ordem de Compra (OC)</span>
                  <span className="text-amber-300 font-mono text-[10px] bg-amber-500/10 group-hover:bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/20">OC</span>
                </div>
                <div className="text-xs font-bold text-zinc-100 font-mono flex items-center gap-1">
                  <Link2 size={12} className="text-amber-400 shrink-0" />
                  <span className="truncate group-hover:underline">
                    {formData.purchaseOrderNumber || (formData.purchaseOrderId ? `OC #${formData.purchaseOrderId.slice(0, 8)}` : 'OC-2026-000098')}
                  </span>
                </div>
                <div className="text-[10px] text-amber-300/80 font-medium truncate flex items-center justify-between">
                  <span>Aprovado Financeiro</span>
                  <span className="text-amber-400 text-[9px] font-semibold">🔍 Ver</span>
                </div>
              </div>

              {/* Step 4: Liquidação / Pagamento */}
              <div 
                onClick={() => setLineageModalType('PAYMENT')}
                className={`p-3 rounded-xl flex flex-col justify-between space-y-1 border cursor-pointer transition-all hover:scale-[1.02] shadow-sm group ${formData.status === 'PAGA' ? 'bg-emerald-500/10 border-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-500/10' : 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500'}`}
              >
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                  <span>4. Status Liquidação</span>
                  <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    {formData.status}
                  </span>
                </div>
                <div className="text-xs font-bold text-zinc-100 font-mono truncate group-hover:underline">
                  {formData.status === 'PAGA' ? `R$ ${formatToBRL(formData.valor)}` : 'Pendente de Pagamento'}
                </div>
                <div className="text-[10px] text-zinc-400 truncate flex items-center justify-between">
                  <span>{formData.status === 'PAGA' && formData.dataPagamento ? `Pago ${new Date(formData.dataPagamento).toLocaleDateString('pt-BR')}` : 'Aguardando quitação'}</span>
                  <span className="text-emerald-400 text-[9px] font-semibold">🔍 Recibo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Se a conta estiver com Status PAGA: Exibir Painel de Recibo PDF e Referência de Pagamento */}
          {formData.status === 'PAGA' && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={18} /> Conta Paga & Liquidada
                </div>
                <p className="text-xs text-zinc-300">
                  Data de Pagamento: <span className="font-bold text-emerald-300">{formData.dataPagamento ? new Date(formData.dataPagamento).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</span>
                  {formData.observacoes && <span className="text-zinc-400 ml-2">({formData.observacoes})</span>}
                </p>
              </div>
              <Button
                type="button"
                onClick={async () => {
                  try {
                    await generatePaymentReceiptPDF({
                      ...formData,
                      dataPagamento: formData.dataPagamento || new Date()
                    });
                    toast({
                      title: "Recibo de Pagamento Gerado!",
                      description: "O arquivo PDF foi baixado com sucesso."
                    });
                  } catch (err) {
                    console.error("Erro ao gerar recibo PDF:", err);
                    toast({
                      title: "Erro ao Gerar PDF",
                      description: "Não foi possível gerar o recibo em PDF.",
                      variant: "destructive"
                    });
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl h-10 px-4 shadow-lg shadow-emerald-500/20 flex items-center gap-2 shrink-0"
              >
                <FileText size={16} />
                Gerar Recibo de Pagamento (PDF)
              </Button>
            </div>
          )}

          {/* Se estiver no modo edição e conta NÃO estiver PAGA: Painel de Baixa/Confirmação de Pagamento */}
          {editMode && formData.status !== 'PAGA' && (
            <div className="bg-zinc-950/60 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle size={16} /> Registro de Pagamento / Baixa
                </div>
                <p className="text-xs text-zinc-400">
                  Defina a data do pagamento para liquidar esta conta e marcar como Paga.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <DatePicker
                  selected={paymentConfirmDate}
                  onChange={(date) => setPaymentConfirmDate(date)}
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  placeholderText="dd/mm/aaaa"
                  className="w-36 px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 text-center font-medium h-10"
                />
                <Button
                  type="button"
                  onClick={async () => {
                    if (!initialData?.id) return;
                    try {
                      const dateToSend = paymentConfirmDate || new Date();
                      await contasAPagarService.marcarComoPaga(initialData.id, dateToSend);
                      toast({ title: 'Sucesso', description: 'Conta marcada como Paga.' });
                      onSuccess();
                      onOpenChange(false);
                    } catch (error) {
                      console.error('Erro ao marcar como paga:', error);
                      toast({ title: 'Erro', description: 'Não foi possível marcar como paga.', variant: 'destructive' });
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl h-10 px-4"
                >
                  <CheckCircle2 size={15} className="mr-1.5" /> Baixar
                </Button>
              </div>
            </div>
          )}

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl px-5 h-10"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/20 rounded-xl px-6 h-10 transition-all"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-950 mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-1.5 stroke-[2.5]" />
                  {editMode ? 'Atualizar Conta' : 'Criar Conta a Pagar'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Modal Nova Conta no Plano de Contas (com Código Gerado Automaticamente) */}
      <Dialog open={newAccountModalOpen} onOpenChange={setNewAccountModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="pb-2 border-b border-zinc-800">
            <DialogTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              Nova Conta no Plano de Contas
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Cadastre uma nova classificação contábil. O código sequencial é gerado automaticamente com base no grupo escolhido.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            {/* Grupo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Grupo da Conta *</label>
              <Select
                value={newAccountGrupo}
                onValueChange={(val: any) => setNewAccountGrupo(val)}
              >
                <SelectTrigger className="border-zinc-700 bg-zinc-950 text-zinc-100 rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  {GRUPOS_CLASSIFICACAO.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="text-zinc-100 hover:bg-zinc-800">
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Código Gerado Automaticamente */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Código da Conta</label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                  ✨ Gerado automaticamente
                </span>
              </div>
              <Input
                value={autoGeneratedCode}
                disabled
                className="border-amber-500/40 bg-zinc-950 text-amber-400 font-mono font-bold text-base rounded-xl h-10 pl-3 cursor-not-allowed opacity-90"
              />
              <p className="text-[11px] text-zinc-500">
                Próximo código disponível na sequência do grupo selecionado.
              </p>
            </div>

            {/* Nome da Conta */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Nome / Descrição da Conta *</label>
              <Input
                placeholder="Ex: Manutenção Preventiva de Geradores, ConectCar..."
                value={newAccountNome}
                onChange={(e) => setNewAccountNome(e.target.value)}
                className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 rounded-xl h-10"
                autoFocus
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewAccountModalOpen(false)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!newAccountNome.trim()) {
                    toast({ title: 'Atenção', description: 'Informe o nome da nova conta.', variant: 'destructive' });
                    return;
                  }
                  const grupoObj = GRUPOS_CLASSIFICACAO.find(g => g.id === newAccountGrupo);
                  const newItem: ClassificacaoContaItem = {
                    codigo: autoGeneratedCode,
                    nome: newAccountNome.trim(),
                    grupo: newAccountGrupo,
                    grupoNome: grupoObj?.label.split('. ')[1] || 'Outros'
                  };
                  
                  // Salvar no estado e localStorage
                  const updated = [...customAccounts, newItem];
                  setCustomAccounts(updated);
                  try {
                    localStorage.setItem('custom_plano_contas', JSON.stringify(updated));
                  } catch (err) {
                    console.warn('Erro ao salvar custom_plano_contas:', err);
                  }

                  // Selecionar no formulário
                  const fullVal = `${newItem.codigo} - ${newItem.nome}`;
                  handleInputChange('categoria', fullVal);
                  setAccountSearchQuery('');
                  setNewAccountNome('');
                  setNewAccountModalOpen(false);

                  toast({
                    title: 'Conta Criada com Sucesso!',
                    description: `A conta [${newItem.codigo}] ${newItem.nome} foi cadastrada e selecionada no Plano de Contas.`
                  });
                }}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl"
              >
                Salvar Nova Conta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Novo Fornecedor */}
      <SupplierFormModal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onSave={async (payload) => {
          try {
            const created = await contasAPagarService.createFornecedor(payload);
            const data = await contasAPagarService.getFornecedores();
            const arr = Array.isArray(data) ? data : [];
            setFornecedores(arr);
            cachedStaticData.fornecedores = arr;
            if (created && created.id) {
              selectSupplier(created);
            }
            setSupplierModalOpen(false);
          } catch (e) {
            console.error('Erro ao salvar fornecedor:', e);
          }
        }}
      />
      {/* Modal de Detalhes da Linhagem */}
      <LineageDetailModal
        open={!!lineageModalType}
        onClose={() => setLineageModalType(null)}
        type={lineageModalType}
        conta={formData}
      />
    </Dialog>
  );
};
export default ContasAPagarFormModal;