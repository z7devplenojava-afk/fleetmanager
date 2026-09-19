import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  CalendarDays, DollarSign, Plus, Users, Building2, Tag, CheckCircle, 
  Search, X, Warehouse, FileSignature, CheckCircle2, Sparkles, Store
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
import SupplierFormModal from '@/components/estoque/SupplierFormModal';
import { useAuth } from '@/contexts/AuthContext';
import {
  CLASSIFICACOES_PADRAO,
  GRUPOS_CLASSIFICACAO,
  getClassificacaoStyle,
  ClassificacaoContaItem
} from '@/constants/classificacaoContasPagar';

export interface ContaAPagar {
  id?: string;
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
} = {};

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
  const [costCenters, setCostCenters] = useState<string[]>(cachedStaticData.costCenters || []);

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
      contasAPagarService.getCostCenters()
    ]).then(([resFornec, resEmp, resCli, resObr, resCont, resGar, resCost]) => {
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
      if (resCost.status === 'fulfilled' && Array.isArray(resCost.value)) {
        const centrosArray = resCost.value.map(v => (v ?? '').toString().trim()).filter(v => v.length > 0);
        setCostCenters(centrosArray);
        cachedStaticData.costCenters = centrosArray;
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
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target as Node)
      ) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fornecedor || !formData.descricao || !formData.valor || !formData.vencimento) {
      toast({
        title: "Campos Obrigatórios",
        description: "Preencha a descrição, valor, fornecedor e data de vencimento.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (editMode && initialData?.id) {
        await contasAPagarService.updateContaAPagar(initialData.id, formData);
        toast({
          title: "Sucesso",
          description: "Conta a pagar atualizada com sucesso!"
        });
      } else {
        await contasAPagarService.createContaAPagar({
          ...formData,
          companySigla: formData.companySigla || siglas[0] || undefined
        });
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
          
          {/* PAINEL 1: Informações Financeiras Principais */}
          <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                <DollarSign size={15} /> Informações Financeiras & Prazos
              </span>
              <span className="text-[11px] text-zinc-500">* Campos obrigatórios</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          </div>

          {/* PAINEL 2: Descrição e Fornecedor */}
          <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              <Store size={15} /> Identificação & Fornecedor
            </span>

            {/* Descrição */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Descrição da Despesa *</label>
              <Input
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Ex: Aquisição de peças para frota, Manutenção preventiva, Fatura de internet..."
                className="border-zinc-700/80 bg-zinc-950/80 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-10"
                required
              />
            </div>

            {/* Campo de Fornecedor com Pesquisa Interativa (>= 3 caracteres) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Store size={13} className="text-amber-400" />
                  Fornecedor *
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
                      placeholder="Pesquise o fornecedor (digite os 3 primeiros caracteres)..."
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

          {/* Se estiver no modo edição: Painel de Baixa/Confirmação de Pagamento */}
          {editMode && (
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
    </Dialog>
  );
};
export default ContasAPagarFormModal;