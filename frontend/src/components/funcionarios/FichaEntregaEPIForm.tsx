import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { FileText, Download, Eye, User, Building, Calendar, Shield, Plus, X, HardHat, Loader2, CheckCircle2, ChevronsUpDown, Check, AlertCircle, MessageCircle, Copy, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { employeeService, SimpleEmployee, Employee } from '@/services/employeeService';
import { companyService } from '@/services/companyService';
import { EmployeeCombobox } from '../ui/employee-combobox';

import { epiDeliveryFormService, EPIDeliveryType, EPIDeliveryFormItem, EpiItemConfirmation } from '@/services/epiDeliveryFormService';
import { refreshEmployeeDocuments } from '@/utils/refreshEmployeeDocuments';
import { buildInsufficientStockMessage, findInsufficientStockRows, sumActiveStockQuantities } from '@/utils/epiStockBalance';
import { employeeAdmissionIsoDateOrToday, formatAdmissionDateBr, todayIsoDateLocal } from '@/utils/employeeAdmissionDate';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import { caepiService, CAEPIResponse } from '@/services/caepiService';
import { formatCPF, formatCNPJ } from '@/utils/validation';
import SignaturePad from '@/components/SignaturePad';
import { stockService } from '@/services/stockService';
import { StockItem } from '@/types/stock';
import { Switch } from '@/components/ui/switch';
import { SearchableSelect } from '@/components/ui/searchable-select';

const epiOptions = [
  'Capacete de Segurança',
  'Óculos de Proteção',
  'Protetor Auditivo',
  'Máscara Respiratória',
  'Luvas de Segurança',
  'Calçado de Segurança',
  'Cinto de Segurança',
  'Avental de Proteção',
  'Protetor Facial',
  'Uniforme de Trabalho',
  'Colete Refletivo',
  'Luminária de Cabeça',
  'Detector de Gás',
  'Protetor Solar',
  'Outros',
];

const uniformePecasOptions = [
  { value: 'CALCA', label: 'Calça' },
  { value: 'CAMISA', label: 'Camisa' },
  { value: 'CAMISA_SOCIAL', label: 'Camisa Social' },
  { value: 'JAQUETA', label: 'Jaqueta' },
  { value: 'SAPATO', label: 'Sapato' },
  { value: 'SAPATA_SOCIAL', label: 'Sapata Social' },
  { value: 'PERNEIRA', label: 'Perneira' },
  { value: 'BLASER', label: 'Blaser' },
  { value: 'LUVA_LATEX', label: 'Luva Latex' },
];

interface FichaEntregaEPIFormProps {
  employeeId?: string;
  companyId?: string;
  fichaId?: string;
  /** Chamado após salvar. Por padrão a ficha permanece aberta para continuar adicionando itens. */
  onSuccess?: (meta?: { fichaId: string; status: 'DRAFT' | 'COMPLETED' }) => void;
}

const emptyEpiRow = () => ({
  id: '',
  nome: '',
  tamanho: '',
  quantidade: '1',
  ca: '',
  caName: '',
  validade: '',
  observacoes: '',
  uniformeTipo: '',
  uniformePeca: '',
  stockItemId: '',
  dataSubstituicao: '',
  motivoSubstituicao: '',
  dataDevolucao: '',
  motivoDevolucao: '',
});

const MIN_EMPLOYEE_SEARCH_CHARS = 3;

function resolveCompanyIdFromEmployee(emp: SimpleEmployee | undefined): string {
  if (!emp) return '';
  return emp.companyId || '';
}

function buildWorkSectorSnapshot(emp: SimpleEmployee | null): string {
  if (!emp) return '';
  const parts = [];
  if (emp.departmentName) parts.push(emp.departmentName);
  if (emp.workPostName) parts.push(emp.workPostName);
  if (emp.unitName) parts.push(emp.unitName);
  if (emp.positionName) parts.push(emp.positionName);
  
  // Use Set to remove potential duplicates (e.g. if department and workPost have same name)
  return Array.from(new Set(parts)).filter(Boolean).join(' / ').toUpperCase();
}



/**
 * Verifica se um item de estoque é relacionado a EPI/Uniforme/Proteção.
 * Permite filtrar para que apenas itens de EPI apareçam na Ficha de Entrega de EPI.
 */
const isEpiStockItem = (item: StockItem): boolean => {
  if (!item) return false;

  // Se possui número de CA cadastrado ou exige CA obrigatoriamente
  if (item.requiresCa || (item.caNumber && item.caNumber.trim() !== '')) {
    return true;
  }

  // Categoria de EPI, Calçados ou Uniformes
  const cat = String(item.category || '').toUpperCase();
  if (
    cat === 'EPI' ||
    cat === 'CALCADOS' ||
    cat.startsWith('UNIFORME') ||
    cat.includes('SEGURANCA') ||
    cat.includes('PROTECAO')
  ) {
    return true;
  }

  // Palavras-chave no nome, nome completo, descrição ou categoria
  const textToSearch = [
    item.name,
    item.fullName,
    item.description,
    cat,
  ].filter(Boolean).join(' ').toLowerCase();

  const epiKeywords = [
    'epi',
    'capacete',
    'óculos',
    'oculos',
    'protetor auditivo',
    'protetor auricular',
    'protetor facial',
    'protetor solar',
    'máscara',
    'mascara',
    'respirador',
    'luva',
    'calçado',
    'calcado',
    'bota',
    'botina',
    'sapato',
    'cinto de segurança',
    'cinto',
    'talabarte',
    'avental',
    'colete',
    'colete refletivo',
    'colete balístico',
    'balístico',
    'balistico',
    'perneira',
    'luminária de cabeça',
    'luminaria de cabeca',
    'detector de gás',
    'detector de gas',
    'abafador',
    'uniforme',
    'jaleco',
    'macacão',
    'macacao',
    'camisa',
    'calça',
    'calca',
    'jaqueta',
    'blaser',
    'segurança do trabalho',
    'equipamento de proteção',
    'proteção auditiva',
    'proteção visual',
    'proteção respiratória'
  ];

  return epiKeywords.some((kw) => textToSearch.includes(kw));
};

const FichaEntregaEPIForm: React.FC<FichaEntregaEPIFormProps> = ({
  employeeId,
  companyId,
  fichaId,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { user, empresa: authEmpresa } = useAuth();

  const userCompanyId = useMemo(() => {
    return (
      companyId ||
      authEmpresa?.id ||
      user?.companyId ||
      (user as any)?.empresaId ||
      (user as any)?.company?.id ||
      localStorage.getItem('companyId') ||
      localStorage.getItem('empresaId') ||
      localStorage.getItem('selectedCompanyId') ||
      ''
    );
  }, [companyId, authEmpresa?.id, user?.companyId, (user as any)?.empresaId, (user as any)?.company?.id]);

  // Load ficha data if editing
  useEffect(() => {
    if (fichaId) {
      const loadFicha = async () => {
        try {
          setLoadingData(true);
          const ficha = await epiDeliveryFormService.getById(fichaId);
          setForm({
            funcionarioId: ficha.employeeId,
            empresaId: ficha.companyId,
            dataEntrega: ficha.deliveryDate,
            responsavelEntregaId: ficha.responsibleEmployeeId || '',
            observacoes: ficha.observations || '',
            status: ficha.status || 'DRAFT',
            signatureType: (ficha.signatureType as any) || 'ON_SCREEN',
            signatureBase64: '', // Signature is not returned for security/storage reasons in edit mode usually, or we can't edit it easily
            employeeWorkSector: ficha.employeeWorkSector || '',
            tipoEntrega: ficha.deliveryType || 'PRIMEIRA_ENTREGA',
          });
          setHasPriorEpiDelivery((ficha.deliveryType || 'PRIMEIRA_ENTREGA') !== 'PRIMEIRA_ENTREGA');
          setCurrentFichaId(ficha.id);
          setConfirmationPending(!!ficha.confirmationPending);
          setItemConfirmations(ficha.items || []);
          // Itens já cadastrados aparecem primeiro (ordem da ficha) e a linha
          // vazia para o próximo item fica na linha de baixo, após os salvos.
          const savedEpis = ficha.items.map(item => ({
            id: item.id || '',
            nome: item.epiName,
            tamanho: item.sizeNumber || '',
            quantidade: String(item.quantity),
            ca: item.ca || '',
            caName: item.caName || '',
            validade: item.validityDate || '',
            observacoes: item.observations || '',
            uniformeTipo: item.uniformType || '',
            uniformePeca: item.uniformPiece || '',
            stockItemId: item.stockItemId || '',
            dataSubstituicao: (item as any).substitutedDate || '',
            motivoSubstituicao: (item as any).replacementReason || '',
            dataDevolucao: (item as any).returnedDate || '',
            motivoDevolucao: (item as any).returnReason || '',
          }));
          setEpis([...savedEpis, emptyEpiRow()]);

          // Estado gravado no backend: base para validar o saldo disponível no formulário.
          persistedStatusRef.current = ficha.status || 'DRAFT';
          persistedStockQuantitiesRef.current = persistedStatusRef.current === 'COMPLETED'
            ? sumActiveStockQuantities(ficha.items)
            : {};
          
          // Trigger data resolution for employee and company
          const emp = await employeeService.getEmployeeById(ficha.employeeId);
          if (emp) {
            const mappedEmp: SimpleEmployee = {
              id: emp.id,
              name: emp.name,
              document: emp.document || emp.cpf,
              cpf: emp.cpf || emp.document,
              email: emp.email,
              phone: emp.phone,
              registrationNumber: emp.registrationNumber,
              hireDate: emp.hireDate,
              terminationDate: emp.terminationDate,
              positionName: emp.position?.name,
              unitName: emp.unit?.name,
              departmentName: emp.department?.name,
              workPostName: emp.workPost?.name,
              address: emp.address,
              companyId: emp.company?.id,
              companySigla: emp.company?.sigla,
              status: emp.status,
            } as SimpleEmployee;
            setSelectedEmployeeData(mappedEmp);
          }

          if (ficha.responsibleEmployeeId) {
            const resp = await employeeService.getEmployeeById(ficha.responsibleEmployeeId);
            if (resp) {
              const mappedResp: SimpleEmployee = {
                id: resp.id,
                name: resp.name,
                document: resp.document || resp.cpf,
                cpf: resp.cpf || resp.document,
                email: resp.email,
                phone: resp.phone,
                registrationNumber: resp.registrationNumber,
                hireDate: resp.hireDate,
                terminationDate: resp.terminationDate,
                positionName: resp.position?.name,
                unitName: resp.unit?.name,
                departmentName: resp.department?.name,
                workPostName: resp.workPost?.name,
                address: resp.address,
                companyId: resp.company?.id,
                companySigla: resp.company?.sigla,
              } as SimpleEmployee;
              setSelectedResponsibleData(mappedResp);
            }
          }
        } catch (error) {
          console.error('Erro ao carregar ficha para edição:', error);
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar os dados da ficha.',
            variant: 'destructive'
          });
        } finally {
          setLoadingData(false);
        }
      };
      loadFicha();
    }
  }, [fichaId]);
  
  // 1. All State and Ref declarations first
  const [form, setForm] = useState({
    funcionarioId: employeeId || '',
    empresaId: userCompanyId || companyId || '',
    dataEntrega: todayIsoDateLocal(),
    responsavelEntregaId: '',
    observacoes: '',
    // Nova Entrega Manual: concluída por padrão para dar baixa automática no estoque
    status: 'COMPLETED' as 'DRAFT' | 'COMPLETED',
    signatureType: 'PHYSICAL_ACKNOWLEDGEMENT' as 'ON_SCREEN' | 'PHYSICAL_ACKNOWLEDGEMENT' | 'WHATSAPP_CONFIRM',
    signatureBase64: '',
    employeeWorkSector: '',
    tipoEntrega: 'PRIMEIRA_ENTREGA'
  });

  const [currentFichaId, setCurrentFichaId] = useState<string | undefined>(fichaId);
  /**
   * Quantidades que ESTA ficha já baixou no estoque (a REQ-EPI gerada por ela).
   * O backend estorna e baixa tudo de novo a cada gravação, então o saldo disponível
   * para um item já lançado é `saldo atual + quantidade já baixada` — sem isso, itens
   * da própria ficha apareceriam como "sem saldo".
   */
  const persistedStockQuantitiesRef = useRef<Record<string, number>>({});
  /** Status gravado no backend (o preview/PDF grava mantendo este status). */
  const persistedStatusRef = useRef<string>('DRAFT');
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [whatsappResult, setWhatsappResult] = useState<{
    confirmationCode: string;
    confirmUrl: string;
    whatsappUrl: string;
    phoneMasked: string;
    sent: boolean;
    message: string;
    items?: EpiItemConfirmation[];
  } | null>(null);
  const [adminConfirmCode, setAdminConfirmCode] = useState('');
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [itemConfirmations, setItemConfirmations] = useState<EPIDeliveryFormItem[]>([]);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState<SimpleEmployee | null>(null);

  /** Confirmação por item: entregas que não sejam a primeira, enquanto o funcionário estiver ativo no sistema. */
  const perItemMode = useMemo(
    () => form.tipoEntrega !== 'PRIMEIRA_ENTREGA' && selectedEmployeeData?.status === 'ACTIVE',
    [form.tipoEntrega, selectedEmployeeData?.status]
  );

  const [epis, setEpis] = useState([emptyEpiRow()]);

  const [caSuggestions, setCaSuggestions] = useState<{ [key: number]: CAEPIResponse[] }>({});
  const [caLoading, setCaLoading] = useState<{ [key: number]: boolean }>({});
  const [caSearchTimeouts, setCaSearchTimeouts] = useState<{ [key: number]: NodeJS.Timeout }>({});
  const [showCaSuggestions, setShowCaSuggestions] = useState<{ [key: number]: boolean }>({});

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedResponsibleData, setSelectedResponsibleData] = useState<SimpleEmployee | null>(null);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [hasPriorEpiDelivery, setHasPriorEpiDelivery] = useState<boolean | null>(null);

  const resolveDeliveryDefaults = async (emp: SimpleEmployee) => {
    try {
      const fichas = await epiDeliveryFormService.getByEmployeeId(emp.id);
      const hasCompleted = fichas.some((f) => f.status === 'COMPLETED' && f.id !== fichaId);
      if (hasCompleted) {
        return { dataEntrega: todayIsoDateLocal(), tipoEntrega: 'SUBSTITUICAO' as EPIDeliveryType, hasPrior: true };
      }
    } catch (error) {
      console.warn('Não foi possível verificar histórico de EPI do funcionário:', error);
    }
    return {
      dataEntrega: todayIsoDateLocal(),
      tipoEntrega: 'PRIMEIRA_ENTREGA' as EPIDeliveryType,
      hasPrior: false,
    };
  };

  const stockItemOptions = useMemo(
    () =>
      stockItems
        .filter(isEpiStockItem)
        .map((item) => {
          const code = item.code || item.barcode || '';
          const name = item.fullName || item.name || 'Item sem nome';
          const qty = Number(item.currentQuantity) || 0;
          const minQty = Number(item.minimumQuantity) || 0;
          const desc = item.description ? item.description.trim() : '';
          const ca = item.caNumber ? `CA: ${item.caNumber}` : '';

          const searchTerms = [
            name,
            item.name || '',
            item.fullName || '',
            item.code || '',
            item.barcode || '',
            desc,
            item.caNumber || '',
            item.sizeVariation || '',
            item.category || '',
          ].filter(Boolean);

          const descParts: string[] = [];
          if (desc) descParts.push(desc);
          if (ca) descParts.push(ca);
          if (qty <= 0) {
            descParts.push(
              `Saldo: 0 • SEM ESTOQUE • cadastre entrada e informe quantidade mínima${minQty > 0 ? ` (mín: ${minQty})` : ''}`
            );
          } else {
            descParts.push(
              `Saldo: ${qty}${minQty > 0 ? ` • Mín: ${minQty}` : ''}${item.barcode && item.barcode !== code ? ` • Cód. barras: ${item.barcode}` : ''}`
            );
          }

          return {
            value: item.id,
            label: code ? `${code} — ${name}` : name,
            description: descParts.join(' • '),
            searchTerms,
          };
        }),
    [stockItems],
  );

  const getStockQty = (stockItemId?: string) => {
    if (!stockItemId) return null;
    const item = stockItems.find((i) => i.id === stockItemId);
    if (!item) return null;
    return Number(item.currentQuantity) || 0;
  };

  const refreshStockItems = async () => {
    try {
      const items = await stockService.getAllItems();
      setStockItems(items);
    } catch (error) {
      console.error('Erro ao buscar itens de estoque:', error);
    }
  };

  useEffect(() => {
    refreshStockItems();
  }, []);
  const [companies, setCompanies] = useState<any[]>([]);

  
  const prevFuncionarioIdForCompanySync = useRef<string | undefined>(undefined);


  const funcionario = selectedEmployeeData;
  const empresa = companies.find(e => e.id === form.empresaId);
  const responsavel = selectedResponsibleData;
  const loggedInResponsibleLabel = user?.name || user?.username || 'Usuário logado';

  // Nova entrega: preenche responsável com o usuário logado
  useEffect(() => {
    if (fichaId || form.responsavelEntregaId || !user) return;

    let cancelled = false;
    const mapToSimple = (match: Employee | SimpleEmployee): SimpleEmployee => ({
      id: match.id,
      name: match.name,
      document: match.document || match.cpf,
      cpf: match.cpf || match.document,
      email: match.email,
      companyId: (match as any).companyId || (match as any).company?.id,
      positionName: (match as any).positionName || (match as any).position?.name,
      departmentName: (match as any).departmentName || (match as any).department?.name,
      unitName: (match as any).unitName || (match as any).unit?.name,
      workPostName: (match as any).workPostName || (match as any).workPost?.name,
      hireDate: match.hireDate,
    });

    const resolveLoggedInResponsible = async () => {
      try {
        let match: Employee | SimpleEmployee | null = await employeeService.getMyEmployee();

        const cpfDigits = String((user as any).cpf || user.username || '')
          .replace(/\D/g, '');
        if (!match && cpfDigits.length >= 11) {
          match = await employeeService.getEmployeeByCpfExact(cpfDigits);
          if (!match) {
            const results = await employeeService.searchEmployees(cpfDigits);
            match = results.find((e) => {
              const doc = (e.cpf || e.document || '').replace(/\D/g, '');
              return doc === cpfDigits;
            }) || null;
          }
        }
        if (!match && user.name) {
          const results = await employeeService.searchEmployeesByName(user.name);
          const normalized = user.name.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          match = results.find((e) =>
            (e.name || '')
              .trim()
              .toUpperCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '') === normalized
          ) || results[0] || null;
        }
        if (cancelled || !match) return;

        const mapped = mapToSimple(match);
        setForm((prev) => (prev.responsavelEntregaId ? prev : { ...prev, responsavelEntregaId: mapped.id }));
        setSelectedResponsibleData(mapped);
      } catch (err) {
        console.warn('Não foi possível vincular responsável ao usuário logado:', err);
      }
    };
    void resolveLoggedInResponsible();
    return () => {
      cancelled = true;
    };
  }, [fichaId, user, form.responsavelEntregaId]);

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      funcionarioId: employeeId || prev.funcionarioId,
      empresaId: companyId || prev.empresaId
    }));
  }, [employeeId, companyId]);

  // Mantém form.empresaId sincronizado com a empresa do usuário logado
  useEffect(() => {
    if (userCompanyId && (!form.empresaId || form.empresaId !== userCompanyId)) {
      setForm((prev) => ({ ...prev, empresaId: userCompanyId }));
    }
  }, [userCompanyId]);

  useEffect(() => {
    if (!selectedEmployeeData) return;
    if (userCompanyId) {
      // Usuário pertence a uma empresa: não deve alterar para outra empresa
      if (form.empresaId !== userCompanyId) {
        setForm((prev) => ({ ...prev, empresaId: userCompanyId }));
      }
      return;
    }
    if (companyId) return;
    const cid = resolveCompanyIdFromEmployee(selectedEmployeeData);
    if (!cid) return;

    const funcionarioMudou = prevFuncionarioIdForCompanySync.current !== form.funcionarioId;
    prevFuncionarioIdForCompanySync.current = form.funcionarioId;

    setForm((prev) => {
      if (funcionarioMudou) return { ...prev, empresaId: cid };
      if (!prev.empresaId) return { ...prev, empresaId: cid };
      return prev;
    });
  }, [form.funcionarioId, selectedEmployeeData, companyId, userCompanyId]);

  useEffect(() => {
    if (form.funcionarioId && !selectedEmployeeData) {
      const fetchEmployee = async () => {
        try {
          const emp = await employeeService.getEmployeeById(form.funcionarioId);
          if (emp) {
            const mappedEmp = {
              id: emp.id,
              name: emp.name,
              document: emp.document || emp.cpf,
              cpf: emp.cpf || emp.document,
              email: emp.email,
              phone: emp.phone,
              registrationNumber: emp.registrationNumber,
              hireDate: emp.hireDate,
              terminationDate: emp.terminationDate,
              positionName: emp.position?.name,
              unitName: emp.unit?.name,
              departmentName: emp.department?.name,
              workPostName: emp.workPost?.name,
              address: emp.address,
              companyId: emp.company?.id,
              companySigla: emp.company?.sigla,
              status: emp.status
            } as SimpleEmployee;
            setSelectedEmployeeData(mappedEmp);
            if (!fichaId) {
              const defaults = await resolveDeliveryDefaults(mappedEmp);
              setHasPriorEpiDelivery(defaults.hasPrior);
              setForm(prev => ({
                ...prev,
                employeeWorkSector: buildWorkSectorSnapshot(mappedEmp),
                dataEntrega: prev.dataEntrega || defaults.dataEntrega,
                tipoEntrega: defaults.tipoEntrega,
              }));
            } else {
              setForm(prev => ({ ...prev, employeeWorkSector: buildWorkSectorSnapshot(mappedEmp) }));
            }
          }
        } catch (error) {
          console.error("Erro ao carregar dados iniciais do funcionário:", error);
        }
      };
      fetchEmployee();
    }
  }, [form.funcionarioId, selectedEmployeeData]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (fichaId) return;

    if (form.empresaId && companies.length > 0) {
      const selectedCompany = companies.find(c => c.id === form.empresaId);
      if (selectedCompany) {
        const companyDefaultEpis = (selectedCompany as any).defaultEpis;
        if (companyDefaultEpis && companyDefaultEpis.length > 0) {
          const firstEpiName = epis.length > 0 ? epis[0].nome : '';
          const shouldLoad = firstEpiName === '' || firstEpiName !== companyDefaultEpis[0]?.epiName;

          if (shouldLoad) {
            const loadedEpis = companyDefaultEpis.map((epi: any) => ({
              nome: epi.epiName || '',
              quantidade: String(epi.quantity || 1),
              ca: epi.caNumber || '',
              caName: epi.caName || '',
              validade: epi.validity || '',
              observacoes: epi.observations || '',
              uniformeTipo: '',
              uniformePeca: '',
              stockItemId: '',
              dataSubstituicao: '',
              motivoSubstituicao: '',
            }));
            setEpis(loadedEpis);
            toast({
              title: 'EPIs carregados',
              description: `${loadedEpis.length} EPI(s) padrão da empresa foram carregados automaticamente.`,
              variant: 'default'
            });
          }
        } else {
          if (epis.length === 0 || (epis.length === 1 && epis[0].nome === '')) {
            setEpis([{ 
              nome: '', 
              quantidade: '1', 
              ca: '', 
              caName: '',
              validade: '', 
              observacoes: '', 
              uniformeTipo: '', 
              uniformePeca: '',
              stockItemId: '',
              dataSubstituicao: '',
              motivoSubstituicao: '',
            }]);
          }
        }
      }
    }
  }, [form.empresaId]);


  const loadData = async () => {
    setLoadingData(true);
    try {
      const companiesData = await companyService.getAllCompanies();
      const allCompanies = Array.isArray(companiesData) ? companiesData : [];

      if (userCompanyId) {
        // Filtrar estritamente para a empresa à qual o usuário logado pertence
        const userMatched = allCompanies.filter(
          (c) =>
            c.id === userCompanyId ||
            (c.id && c.id.toLowerCase() === userCompanyId.toLowerCase()) ||
            (authEmpresa?.nome && c.name?.toLowerCase() === authEmpresa.nome.toLowerCase()) ||
            (user?.companyName && c.name?.toLowerCase() === user.companyName.toLowerCase())
        );

        if (userMatched.length > 0) {
          setCompanies(userMatched);
        } else {
          // Fallback garantido para exibir a empresa do usuário logado
          setCompanies([
            {
              id: userCompanyId,
              name: authEmpresa?.nome || user?.companyName || 'Empresa do Usuário',
              sigla: authEmpresa?.sigla || '',
              cnpj: (authEmpresa as any)?.cnpj || '',
            },
          ]);
        }
      } else {
        setCompanies(allCompanies);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar empresas.',
        variant: 'destructive'
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleEpiChange = (idx: number, field: string, value: any) => {
    setEpis(prevEpis => {
      const updatedEpis = [...prevEpis];
      const updatedItem = { ...updatedEpis[idx], [field]: value };
      
      if (field === 'stockItemId' && value && value !== 'none' && value !== 'all') {
        const selectedItem = stockItems.find(item => item.id === value);
        if (selectedItem) {
          updatedItem.nome = selectedItem.name || selectedItem.fullName || updatedItem.nome || '';
          if (selectedItem.caNumber || (selectedItem as any).ca) {
            updatedItem.ca = selectedItem.caNumber || (selectedItem as any).ca || '';
          }
        }
      }
      
      updatedEpis[idx] = updatedItem;
      return updatedEpis;
    });
  };

  const handleCABlur = async (idx: number, caNumber: string) => {
    if (!caNumber || caNumber.trim().length < 3) {
      setShowCaSuggestions(prev => ({ ...prev, [idx]: false }));
      return;
    }

    try {
      setCaLoading(prev => ({ ...prev, [idx]: true }));
      const caInfo = await caepiService.buscarCA(caNumber);

      if (caInfo) {
        handleEpiChange(idx, 'ca', caInfo.numero);
        handleEpiChange(idx, 'caName', caInfo.nome || caInfo.descricao || '');
        toast({
          title: "CA encontrado",
          description: `CA ${caInfo.numero} - ${caInfo.nome}`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CA:', error);
    } finally {
      setCaLoading(prev => ({ ...prev, [idx]: false }));
      setShowCaSuggestions(prev => ({ ...prev, [idx]: false }));
    }
  };

  const handleCASearch = async (idx: number, searchTerm: string) => {
    if (caSearchTimeouts[idx]) {
      clearTimeout(caSearchTimeouts[idx]);
    }

    if (!searchTerm || searchTerm.trim().length < 3) {
      setCaSuggestions(prev => ({ ...prev, [idx]: [] }));
      setShowCaSuggestions(prev => ({ ...prev, [idx]: false }));
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setCaLoading(prev => ({ ...prev, [idx]: true }));
        const resultados = await caepiService.buscarCAs(searchTerm);
        setCaSuggestions(prev => ({ ...prev, [idx]: resultados }));
        setShowCaSuggestions(prev => ({ ...prev, [idx]: resultados.length > 0 }));
      } catch (error) {
        console.error('Erro ao buscar sugestões de CA:', error);
      } finally {
        setCaLoading(prev => ({ ...prev, [idx]: false }));
      }
    }, 500);

    setCaSearchTimeouts(prev => ({ ...prev, [idx]: timeout }));
  };

  const handleCASelect = (idx: number, ca: CAEPIResponse) => {
    handleEpiChange(idx, 'ca', ca.numero);
    handleEpiChange(idx, 'caName', ca.nome || ca.descricao || '');
    setShowCaSuggestions(prev => ({ ...prev, [idx]: false }));
    setCaSuggestions(prev => ({ ...prev, [idx]: [] }));
  };

  const addEpi = () => {
    setEpis([...epis, emptyEpiRow()]);
  };

  const removeEpi = (idx: number) => {
    if (epis.length > 1) {
      setEpis(epis.filter((_, i) => i !== idx));
    }
  };

  const isEpiRowFilled = (epi: (typeof epis)[number]) =>
    Boolean(epi.nome?.trim() || (epi.stockItemId && epi.stockItemId !== 'none'));

  const getFilledEpis = () => epis.filter(isEpiRowFilled);

  const mapEpisToFormItems = (source = getFilledEpis()) =>
    // A ordem do array é preservada: itens já cadastrados primeiro,
    // novos itens por último (lineOrder garante que o novo fique na linha de baixo).
    source.map((epi, idx) => ({
      id: epi.id || undefined,
      epiName: epi.nome,
      sizeNumber: epi.tamanho || undefined,
      quantity: Math.max(1, parseInt(String(epi.quantidade).trim(), 10) || 1),
      ca: epi.ca || undefined,
      caName: epi.caName || undefined,
      validityDate: epi.validade || undefined,
      uniformType: epi.uniformeTipo || undefined,
      uniformPiece: epi.uniformePeca || undefined,
      observations: epi.observacoes || undefined,
      stockItemId: epi.stockItemId && epi.stockItemId !== 'none' ? epi.stockItemId : undefined,
      lineOrder: idx,
      substitutedDate: epi.dataSubstituicao || undefined,
      replacementReason: epi.motivoSubstituicao || undefined,
      returnedDate: epi.dataDevolucao || undefined,
      returnReason: epi.motivoDevolucao || undefined,
    }));

  /**
   * Guarda o estado que o backend passou a ter depois de gravar a ficha:
   * status final e quantidades efetivamente baixadas por ela.
   */
  const syncPersistedStockState = (
    status: string,
    items: Array<{ stockItemId?: string; quantity?: number; substitutedDate?: string; returnedDate?: string }>,
  ) => {
    persistedStatusRef.current = status;
    persistedStockQuantitiesRef.current = status === 'COMPLETED' ? sumActiveStockQuantities(items) : {};
  };

  /**
   * Saldo disponível item a item, antes de enviar.
   * Evita o 400 "Quantidade insuficiente em estoque" que o backend devolve ao dar baixa.
   */
  const validateStockBalance = (source = getFilledEpis()): string | null =>
    buildInsufficientStockMessage(
      findInsufficientStockRows(
        source,
        stockItems,
        currentFichaId ? persistedStockQuantitiesRef.current : {},
      ),
    );

  /** Na conclusão, todo item deve gerar baixa no estoque. */
  const validateEpisForCompletion = (source = getFilledEpis()): string | null => {
    if (source.length === 0) {
      return 'Adicione ao menos um item na ficha.';
    }
    if (source.some(epi => !epi.nome?.trim())) {
      return 'Preencha o nome de todos os EPIs!';
    }
    if (source.some(epi => epi.nome === 'Uniforme de Trabalho' && !epi.uniformeTipo)) {
      return 'Para Uniforme de Trabalho, selecione se é Completo ou Individual!';
    }
    if (source.some(epi => epi.nome === 'Uniforme de Trabalho' && epi.uniformeTipo === 'INDIVIDUAL' && !epi.uniformePeca)) {
      return 'Para Uniforme de Trabalho Individual, selecione a peça específica!';
    }

    // Se a entrega for de Devolução ou se algum item tiver motivo de devolução, garante a data de devolução
    for (const epi of source) {
      if (form.tipoEntrega === 'DEVOLUCAO' || epi.motivoDevolucao || epi.dataDevolucao) {
        if (!epi.dataDevolucao || !epi.dataDevolucao.trim()) {
          epi.dataDevolucao = form.dataEntrega || todayIsoDateLocal();
        }
      }
    }

    // Validação NR-6 Grupo 1 (Colete, Calçado/Bota, Capa de Chuva, Óculos, Protetor, Capacete, Luva)
    for (const epi of source) {
      const nameUpper = (epi.nome || '').toUpperCase();
      const stockItem = stockItems.find((s) => s.id === epi.stockItemId);
      const isEpiGroup1 = (stockItem && (stockItem.category === 'EPI' || stockItem.requiresCa)) ||
        nameUpper.includes('COLETE BALÍSTICO') || nameUpper.includes('COLETE BALISTICO') ||
        nameUpper.includes('CALÇADO') || nameUpper.includes('CALCADO') || nameUpper.includes('SAPATO') || nameUpper.includes('BOTA') ||
        nameUpper.includes('CAPA DE CHUVA') || nameUpper.includes('ÓCULOS') || nameUpper.includes('OCULOS') ||
        nameUpper.includes('PROTETOR AURICULAR') || nameUpper.includes('CAPACETE') || nameUpper.includes('LUVA');

      // Se o item do estoque já tem CA cadastrado, herda o CA caso esteja em branco
      if ((!epi.ca || !epi.ca.trim()) && stockItem?.caNumber) {
        epi.ca = stockItem.caNumber;
      }

      // Exige CA apenas se for cadastro e não houver CA nem no item nem no formulário
      if (!currentFichaId && isEpiGroup1 && (!epi.ca || !epi.ca.trim()) && (!stockItem || !stockItem.caNumber)) {
        return `Para o novo item EPI (Grupo 1) "${epi.nome}", é obrigatório informar o número do CA válido!`;
      }
    }
    const withoutStock = source.filter(epi => !epi.stockItemId || epi.stockItemId === 'none');
    if (withoutStock.length > 0) {
      const names = withoutStock.map(e => e.nome || 'Item sem nome').join(', ');
      return `Todos os itens devem estar vinculados ao estoque para dar baixa. Sem vínculo: ${names}`;
    }
    const zeroStock = source.filter((epi) => {
      // Em atualização de ficha já salva, o backend estorna a REQ-EPI e baixa de novo —
      // saldo atual pode estar zerado pelos itens já entregues desta mesma ficha.
      if (currentFichaId) return false;
      const item = stockItems.find((s) => s.id === epi.stockItemId);
      return item && (Number(item.currentQuantity) || 0) <= 0;
    });
    if (zeroStock.length > 0) {
      const names = zeroStock.map((e) => e.nome || 'Item sem nome').join(', ');
      return `Itens sem saldo no estoque: ${names}. Cadastre entrada no estoque e informe a quantidade mínima antes de concluir.`;
    }
    return null;
  };

  const handlePreview = async () => {
    if (!form.funcionarioId || !form.empresaId || !form.dataEntrega) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios para visualizar a ficha!',
        variant: 'destructive'
      });
      return;
    }

    // O preview também grava a ficha; se ela já está concluída no servidor a baixa de
    // estoque é refeita, então o saldo precisa ser validado antes de enviar.
    if (persistedStatusRef.current === 'COMPLETED') {
      const balanceError = validateStockBalance();
      if (balanceError) {
        toast({ title: 'Saldo insuficiente', description: balanceError, variant: 'destructive' });
        return;
      }
    }

    if (epis.some(epi => !epi.nome)) {
      toast({
        title: 'Atenção',
        description: 'Preencha o nome de todos os EPIs para visualizar a ficha!',
        variant: 'destructive'
      });
      return;
    }

    if (epis.some(epi => epi.nome === 'Uniforme de Trabalho' && !epi.uniformeTipo)) {
      toast({
        title: 'Atenção',
        description: 'Para Uniforme de Trabalho, é necessário selecionar se é Completo ou Individual!',
        variant: 'destructive'
      });
      return;
    }

    if (epis.some(epi => epi.nome === 'Uniforme de Trabalho' && epi.uniformeTipo === 'INDIVIDUAL' && !epi.uniformePeca)) {
      toast({
        title: 'Atenção',
        description: 'Para Uniforme de Trabalho Individual, é necessário selecionar a peça específica!',
        variant: 'destructive'
      });
      return;
    }

    if (epis.some(epi => epi.nome === 'Uniforme de Trabalho' && epi.uniformeTipo === 'INDIVIDUAL' && (!epi.stockItemId || epi.stockItemId === 'none'))) {
      toast({
        title: 'Atenção',
        description: 'Uniforme de Trabalho Individual deve ser vinculado a um item do estoque!',
        variant: 'destructive'
      });
      return;
    }

    if (!funcionario || !empresa) {
      toast({
        title: 'Atenção',
        description: 'Selecione funcionário e empresa para visualizar a ficha!',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const fullEmployee = await employeeService.getEmployeeById(funcionario.id);
      if (!fullEmployee) {
        toast({
          title: 'Erro',
          description: 'Funcionário não encontrado!',
          variant: 'destructive'
        });
        return;
      }

      const items = mapEpisToFormItems();
      const formData = {
        id: currentFichaId || undefined,
        employeeId: form.funcionarioId,
        companyId: form.empresaId,
        deliveryDate: form.dataEntrega,
        responsibleEmployeeId: form.responsavelEntregaId || undefined,
        observations: form.observacoes || undefined,
        employeeWorkSector: form.employeeWorkSector,
        items,
      };

      // O preview não envia status: o backend mantém o status atual da ficha.
      const statusAfterSave = persistedStatusRef.current;
      const blob = await epiDeliveryFormService.generateAndSavePdf(formData);
      syncPersistedStockState(statusAfterSave, items);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 100);

    } catch (err: any) {
      console.error('Erro ao gerar preview:', err);
      toast({
        title: 'Erro',
        description: err.message || err.response?.data?.message || 'Erro ao gerar preview da ficha. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGerarPDF = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!form.funcionarioId || !form.empresaId || !form.dataEntrega) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios!',
        variant: 'destructive'
      });
      return;
    }

    if (form.status === 'COMPLETED') {
      const completionError = validateEpisForCompletion();
      if (completionError) {
        toast({ title: 'Atenção', description: completionError, variant: 'destructive' });
        return;
      }
      // Bloqueia aqui: o backend recusa a baixa com 400 quando falta saldo.
      const balanceError = validateStockBalance();
      if (balanceError) {
        toast({ title: 'Saldo insuficiente', description: balanceError, variant: 'destructive' });
        return;
      }
    } else if (epis.some(epi => !epi.nome)) {
      toast({
        title: 'Atenção',
        description: 'Preencha o nome de todos os EPIs!',
        variant: 'destructive'
      });
      return;
    }

    if (!funcionario || !empresa) {
      toast({
        title: 'Atenção',
        description: 'Selecione funcionário e empresa!',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const fullEmployee = await employeeService.getEmployeeById(funcionario.id);
      if (!fullEmployee) {
        throw new Error('Funcionário não encontrado');
      }

      const items = mapEpisToFormItems();
      const buildEpiFormData = () => ({
        id: currentFichaId || undefined,
        employeeId: form.funcionarioId,
        companyId: form.empresaId,
        deliveryDate: form.dataEntrega,
        responsibleEmployeeId: form.responsavelEntregaId || undefined,
        observations: form.observacoes || undefined,
        deliveryType: form.tipoEntrega || 'PRIMEIRA_ENTREGA',
        signatureBase64: form.signatureBase64 || undefined,
        signatureType: form.signatureType,
        employeeWorkSector: form.employeeWorkSector || undefined,
        status: form.status,
        items,
      });

      const blob = await epiDeliveryFormService.generateAndSavePdf(buildEpiFormData());

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ficha-entrega-epi-${fullEmployee.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      syncPersistedStockState(form.status, items);

      toast({
        title: 'Sucesso',
        description: 'Ficha de Entrega de EPI gerada e salva com sucesso!',
      });
      void refreshEmployeeDocuments(form.funcionarioId);
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      toast({
        title: 'Erro',
        description: err.message || err.response?.data?.message || 'Erro ao gerar PDF. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarFicha = async () => {
    if (!form.funcionarioId || !form.empresaId || !form.dataEntrega) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios!',
        variant: 'destructive'
      });
      return;
    }

    const filledEpis = getFilledEpis();
    if (filledEpis.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Adicione ao menos um item vinculado ao estoque na ficha.',
        variant: 'destructive'
      });
      return;
    }

    if (form.status === 'COMPLETED') {
      const completionError = validateEpisForCompletion(filledEpis);
      if (completionError) {
        toast({ title: 'Atenção', description: completionError, variant: 'destructive' });
        return;
      }
      // Bloqueia aqui: o backend recusa a baixa com 400 quando falta saldo.
      const balanceError = validateStockBalance(filledEpis);
      if (balanceError) {
        toast({ title: 'Saldo insuficiente', description: balanceError, variant: 'destructive' });
        return;
      }
    } else if (filledEpis.some(epi => !epi.nome?.trim())) {
      toast({
        title: 'Atenção',
        description: 'Preencha o nome de todos os EPIs!',
        variant: 'destructive'
      });
      return;
    }

    if (form.status === 'COMPLETED' && form.signatureType === 'WHATSAPP_CONFIRM') {
      toast({
        title: 'Confirmação WhatsApp',
        description: 'Com WhatsApp, mantenha a ficha em rascunho, envie o link e aguarde a confirmação do funcionário (ou digite o código).',
        variant: 'destructive'
      });
      return;
    }

    if (form.status === 'COMPLETED' && !form.signatureBase64 && form.signatureType === 'ON_SCREEN') {
      toast({
        title: 'Assinatura Obrigatória',
        description: 'Para concluir a ficha, a assinatura do funcionário é necessária!',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const items = mapEpisToFormItems(filledEpis);
      const formData = {
        id: currentFichaId || undefined,
        employeeId: form.funcionarioId,
        companyId: form.empresaId,
        deliveryDate: form.dataEntrega,
        responsibleEmployeeId: form.responsavelEntregaId || undefined,
        observations: form.observacoes || undefined,
        status: form.status,
        signatureType: form.signatureType,
        signatureBase64: form.signatureBase64 || undefined,
        employeeWorkSector: form.employeeWorkSector || undefined,
        deliveryType: form.tipoEntrega || 'PRIMEIRA_ENTREGA',
        items,
      };

      const saved = currentFichaId
        ? await epiDeliveryFormService.update(currentFichaId, formData)
        : await epiDeliveryFormService.create(formData);

      setCurrentFichaId(saved.id);
      syncPersistedStockState(form.status, items);

      // Mantém a lista salva e deixa uma linha vazia para continuar adicionando
      const persistedEpis = filledEpis.map((epi) => ({ ...epi }));
      setEpis([...persistedEpis, emptyEpiRow()]);

      await refreshStockItems();

      const deductedLabels = filledEpis
        .filter((epi) => epi.stockItemId && epi.stockItemId !== 'none')
        .map((epi) => `${epi.nome || 'Item'} (qtd ${epi.quantidade || 1})`)
        .join(', ');

      toast({
        title: '✅ Sucesso',
        description: form.status === 'COMPLETED'
          ? `Ficha salva com ${filledEpis.length} item(ns). Baixa automática no estoque: ${deductedLabels || 'itens vinculados'}. Pode continuar adicionando.`
          : `Ficha salva com ${filledEpis.length} item(ns). Pode continuar adicionando na lista.`,
      });
      
      if (form.status === 'COMPLETED') {
        setForm(prev => ({ ...prev, signatureBase64: '' }));
        setConfirmationPending(false);
      }

      if (onSuccess) {
        onSuccess({ fichaId: saved.id, status: form.status });
      }
    } catch (err: any) {
      console.error('❌ Erro ao salvar ficha de EPI:', err);
      toast({
        title: 'Erro',
        description: err.message || err.response?.data?.message || 'Erro ao salvar a ficha. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const ensureFichaSavedAsDraft = async (): Promise<string | null> => {
    if (!form.funcionarioId || !form.empresaId || !form.dataEntrega) {
      toast({
        title: 'Atenção',
        description: 'Preencha funcionário, empresa e data antes de enviar o WhatsApp.',
        variant: 'destructive'
      });
      return null;
    }
    const completionError = validateEpisForCompletion();
    if (completionError) {
      toast({ title: 'Atenção', description: completionError, variant: 'destructive' });
      return null;
    }

    const formData = {
      employeeId: form.funcionarioId,
      companyId: form.empresaId,
      deliveryDate: form.dataEntrega,
      responsibleEmployeeId: form.responsavelEntregaId || undefined,
      observations: form.observacoes || undefined,
      status: 'DRAFT' as const,
      signatureType: 'WHATSAPP_CONFIRM' as const,
      employeeWorkSector: form.employeeWorkSector || undefined,
      deliveryType: form.tipoEntrega || 'PRIMEIRA_ENTREGA',
      items: mapEpisToFormItems(),
    };

    const saved = currentFichaId
      ? await epiDeliveryFormService.update(currentFichaId, formData)
      : await epiDeliveryFormService.create(formData);

    setCurrentFichaId(saved.id);
    setForm(prev => ({ ...prev, status: 'DRAFT', signatureType: 'WHATSAPP_CONFIRM' }));
    // Rascunho não baixa estoque no backend.
    syncPersistedStockState('DRAFT', formData.items);
    return saved.id;
  };

  const handleSendWhatsApp = async (mode: 'AUTO' | 'MANUAL') => {
    try {
      setSendingWhatsApp(true);
      const id = await ensureFichaSavedAsDraft();
      if (!id) return;

      const result = await epiDeliveryFormService.sendWhatsAppConfirmation(
        id,
        mode,
        window.location.origin
      );
      setWhatsappResult(result);
      setConfirmationPending(true);

      if (result.items?.length) {
        const fresh = await epiDeliveryFormService.getById(id);
        setItemConfirmations(fresh.items || []);
      }

      toast({
        title: result.sent ? 'WhatsApp enviado' : 'Link gerado',
        description: result.message,
      });

      if (mode === 'MANUAL' && result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank');
      }
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Não foi possível enviar a confirmação.',
        variant: 'destructive'
      });
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleAdminConfirmCode = async () => {
    if (!currentFichaId) {
      toast({
        title: 'Atenção',
        description: 'Salve a ficha e envie a confirmação antes de validar o código.',
        variant: 'destructive'
      });
      return;
    }
    if (!adminConfirmCode.trim() || adminConfirmCode.trim().length !== 6) {
      toast({
        title: 'Atenção',
        description: 'Informe o código de 6 dígitos.',
        variant: 'destructive'
      });
      return;
    }
    try {
      setSendingWhatsApp(true);
      await epiDeliveryFormService.confirmWithCode(currentFichaId, adminConfirmCode.trim());
      let finalStatus: 'DRAFT' | 'COMPLETED' = 'COMPLETED';
      if (perItemMode) {
        const fresh = await epiDeliveryFormService.getById(currentFichaId);
        setItemConfirmations(fresh.items || []);
        setConfirmationPending(!!fresh.confirmationPending);
        finalStatus = (fresh.items || []).every((i) => !!i.confirmedAt) ? 'COMPLETED' : 'DRAFT';
        setForm(prev => ({ ...prev, status: finalStatus }));
      } else {
        setConfirmationPending(false);
        setForm(prev => ({ ...prev, status: 'COMPLETED' }));
      }
      // A confirmação conclui a ficha e dá baixa no estoque no backend.
      syncPersistedStockState(finalStatus, mapEpisToFormItems());
      setWhatsappResult(null);
      toast({
        title: 'Recebimento confirmado',
        description: perItemMode ? 'Item confirmado. Confira os demais itens pendentes.' : 'Ficha concluída e estoque atualizado.',
      });
      if (onSuccess) onSuccess({ fichaId: currentFichaId, status: finalStatus });
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Código inválido.',
        variant: 'destructive'
      });
    } finally {
      setSendingWhatsApp(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-t-4 border-t-primary shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <HardHat className="h-6 w-6 text-primary" />
                Ficha de Entrega de EPI Eletrônica
              </CardTitle>
              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
                <span>Controle e Registro de Equipamentos de Proteção Individual.</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                  Amparo Jurídico: NR-6 (Item 6.5.1) • Portaria MTE nº 671/2021 • Lei nº 13.874/2019
                </Badge>
              </div>
            </div>
            {(funcionario && empresa) && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 px-3 py-1">
                <CheckCircle2 className="h-3 w-3" />
                Pronto para gerar
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-8">

          {/* Identificação */}
          <div className="bg-muted/30 p-6 rounded-xl border space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <User className="h-4 w-4" />
              <span>Identificação</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  Funcionário
                  <span className="block text-[11px] font-normal text-muted-foreground/80">
                    Selecione o colaborador que receberá os EPIs. Digite pelo menos 3 caracteres do nome, matrícula ou CPF para buscar.
                  </span>
                </Label>
                <EmployeeCombobox
                  value={form.funcionarioId}
                  onChange={(value) => setForm(prev => ({ ...prev, funcionarioId: value }))}
                  onEmployeeSelect={async (emp) => {
                    setSelectedEmployeeData(emp);
                    const cid = resolveCompanyIdFromEmployee(emp);
                    const defaults = await resolveDeliveryDefaults(emp);
                    setHasPriorEpiDelivery(defaults.hasPrior);
                    setForm(prev => ({
                      ...prev,
                      funcionarioId: emp.id,
                      empresaId: cid || prev.empresaId,
                      employeeWorkSector: buildWorkSectorSnapshot(emp),
                      dataEntrega: prev.dataEntrega || defaults.dataEntrega,
                      tipoEntrega: defaults.tipoEntrega,
                    }));
                  }}
                />
                {funcionario && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 border border-border/60">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">
                      {funcionario.name}
                    </span>
                    {(funcionario.cpf || (funcionario as any).document) && (
                      <span className="text-[11px] text-muted-foreground">
                        · CPF: {formatCPF(funcionario.cpf || (funcionario as any).document || '')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  Empresa
                  <span className="block text-[11px] font-normal text-muted-foreground/80">
                    Escolha a empresa responsável pela entrega.
                  </span>
                </Label>
                <Select
                  value={form.empresaId}
                  onValueChange={(value) => setForm(prev => ({ ...prev, empresaId: value }))}
                  disabled={loadingData || Boolean(userCompanyId && companies.length <= 1)}
                >
                  <SelectTrigger className="h-11 bg-background border-2 border-gray-600 focus:border-seguranca-yellow">
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name} {company.sigla ? `(${company.sigla})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {empresa && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 border border-border/60">
                    <Building className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">
                      {empresa.name} {empresa.sigla ? `(${empresa.sigla})` : ''}
                    </span>
                    {empresa.cnpj && (
                      <span className="text-[11px] text-muted-foreground">
                        · CNPJ: {formatCNPJ(empresa.cnpj)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detalhes do Funcionário */}
            {funcionario && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2 font-medium">
                    <User className="h-4 w-4 text-primary" />
                    Dados do Funcionário
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {funcionario.status === 'ACTIVE' ? 'Ativo' : funcionario.status || 'Ativo'}
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nome Completo</Label>
                    <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                      {funcionario.name}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">CPF</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors">
                        {funcionario.cpf || (funcionario as any).document ? formatCPF(funcionario.cpf || (funcionario as any).document || '') : '-'}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Admissão</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors">
                        {formatAdmissionDateBr(funcionario.hireDate)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Setor / Departamento</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                        {form.employeeWorkSector || buildWorkSectorSnapshot(funcionario) || funcionario.departmentName || funcionario.unitName || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detalhes da Empresa */}
            {empresa && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300 delay-100">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2 font-medium">
                    <Building className="h-4 w-4 text-primary" />
                    Dados da Empresa
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Razão Social</Label>
                    <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                      {empresa.name}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">CNPJ</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors">
                        {empresa.cnpj ? formatCNPJ(empresa.cnpj) : '-'}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Sigla</Label>
                      <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors">
                        {empresa.sigla || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {(funcionario || empresa) && <Separator />}

          {/* Dados da Entrega */}
          <div className="bg-muted/30 p-6 rounded-xl border space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span>Dados da Entrega</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 space-y-2">
                <Label className="text-base font-semibold">Data de Entrega</Label>
                <Input
                  type="date"
                  value={form.dataEntrega}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (value && value.length > 10) {
                      const match = value.match(/(\d{4}-\d{2}-\d{2})/);
                      if (match) value = match[1];
                    }
                    setForm(prev => ({ ...prev, dataEntrega: value }));
                  }}
                  className="h-11 bg-background border-2 border-gray-600 focus:border-seguranca-yellow"
                  max="9999-12-31"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Informe a data em que os EPIs estão sendo entregues. Todos os itens adicionados nesta entrega terão esta data registrada.
                </p>
              </div>

              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                <div className="space-y-2 min-w-0">
                  <Label className="text-base font-semibold">Setor/Trabalho</Label>
                  <Input
                    value={form.employeeWorkSector}
                    onChange={(e) => setForm(prev => ({ ...prev, employeeWorkSector: e.target.value }))}
                    placeholder="Setor/Cargo do funcionário"
                    className="h-11 bg-background border-2 border-gray-600 focus:border-seguranca-yellow"
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label className="text-base font-semibold">Responsável pela Entrega</Label>
                  <EmployeeCombobox
                    value={form.responsavelEntregaId}
                    onChange={(value) => setForm(prev => ({ ...prev, responsavelEntregaId: value }))}
                    onEmployeeSelect={(emp) => setSelectedResponsibleData(emp)}
                    placeholder="Selecione o responsável"
                    initialDisplayName={selectedResponsibleData?.name || loggedInResponsibleLabel}
                    fallbackDisplayName={loggedInResponsibleLabel}
                    displayNameOnly
                  />
                  {!form.responsavelEntregaId && (
                    <p className="text-[10px] text-muted-foreground italic pl-1 leading-tight">
                      * Preenchido com o usuário logado — <strong>{loggedInResponsibleLabel}</strong>
                      {' '}(o sistema confirma o vínculo ao salvar)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Status e Tipo de Assinatura */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-dashed">
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-primary/20 shadow-sm">
                <div className="space-y-1">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <CheckCircle2 className={cn("h-4 w-4", form.status === 'COMPLETED' ? "text-green-500" : "text-muted-foreground")} />
                    Status da Ficha
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {form.status === 'COMPLETED' 
                      ? 'CONCLUÍDA: todos os itens dão baixa automática no estoque (vínculo obrigatório).' 
                      : 'RASCUNHO: apenas salva as informações (sem baixa no estoque).'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={form.status === 'COMPLETED' ? 'default' : 'secondary'} className="h-6">
                    {form.status === 'COMPLETED' ? 'CONCLUÍDA' : 'RASCUNHO'}
                  </Badge>
                  <Switch
                    checked={form.status === 'COMPLETED'}
                    disabled={form.signatureType === 'WHATSAPP_CONFIRM'}
                    onCheckedChange={(checked) => setForm(prev => ({ 
                      ...prev, 
                      status: checked ? 'COMPLETED' : 'DRAFT' 
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2 p-4 bg-background rounded-lg border shadow-sm">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Forma de Assinatura
                </Label>
                <Select
                  value={form.signatureType}
                  onValueChange={(value: any) => setForm(prev => ({
                    ...prev,
                    signatureType: value,
                    status: value === 'WHATSAPP_CONFIRM' ? 'DRAFT' : prev.status,
                    signatureBase64: value === 'WHATSAPP_CONFIRM' ? '' : prev.signatureBase64,
                  }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ON_SCREEN">Assinar na Tela Digital</SelectItem>
                    <SelectItem value="PHYSICAL_ACKNOWLEDGEMENT">Assinatura em Papel (Anexo)</SelectItem>
                    <SelectItem value="WHATSAPP_CONFIRM">Confirmação via WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
                {form.signatureType === 'WHATSAPP_CONFIRM' && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    A ficha permanece em rascunho até o funcionário confirmar com o código enviado no WhatsApp.
                  </p>
                )}
              </div>
            </div>

            {/* Exibir dados do responsável quando selecionado */}
            {responsavel && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300 pt-2">
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <User className="h-4 w-4 text-primary" />
                    Dados do Responsável
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nome Completo</Label>
                    <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors truncate">
                      {responsavel.name}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">CPF</Label>
                    <div className="p-2.5 bg-muted rounded-md text-sm font-medium border border-transparent hover:border-border transition-colors">
                      {responsavel.cpf || responsavel.document || '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Lista de EPIs */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>EPIs Entregues</span>
              </div>
              <Button type="button" size="sm" onClick={addEpi} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar EPI
              </Button>
            </div>

            <div className="space-y-4">
              {epis.map((epi, idx) => (
                <Card key={idx} className="relative overflow-hidden border-l-4 border-l-primary/50">
                  <div className="absolute top-0 right-0 p-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeEpi(idx)}
                      disabled={epis.length === 1}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <CardContent className="p-6 pt-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono">#{idx + 1}</Badge>
                        {(epi.dataSubstituicao || epi.dataDevolucao) ? (
                          <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs">
                            🔄 Devolvido / Substituído (Estorno no Estoque)
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs">
                            ✅ Item Entregue / Ativo
                          </Badge>
                        )}
                      </div>
                      {!epi.dataSubstituicao && !epi.dataDevolucao && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 gap-1.5 border-amber-500/60 text-amber-300 hover:bg-amber-500/10"
                          onClick={() => {
                            const today = todayIsoDateLocal();
                            const reason = 'Devolvido ao Estoque - Tamanho Incorreto';
                            setEpis(prev => {
                              const updated = [...prev];
                              const currentItem = updated[idx];
                              updated[idx] = {
                                ...currentItem,
                                dataSubstituicao: today,
                                motivoSubstituicao: reason,
                                dataDevolucao: today,
                                motivoDevolucao: reason,
                              };
                              const newRow = {
                                ...emptyEpiRow(),
                                nome: currentItem.nome,
                                ca: currentItem.ca,
                                caName: currentItem.caName,
                                validade: currentItem.validade,
                                uniformeTipo: currentItem.uniformeTipo,
                                uniformePeca: currentItem.uniformePeca,
                              };
                              updated.splice(idx + 1, 0, newRow);
                              return updated;
                            });
                            toast({
                              title: 'Troca / Devolução Registrada',
                              description: 'O item foi marcado como devolvido (estorno no estoque). Um novo item foi inserido para selecionar o tamanho correto.',
                            });
                          }}
                        >
                          🔄 Registrar Troca / Devolução (Tamanho Incorreto)
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Primeira linha: Nome do EPI */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Vincular ao Estoque (Prioridade) */}
                        <div className="space-y-2 lg:col-span-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            Vincular ao Estoque
                            <Badge
                              variant={form.status === 'COMPLETED' ? 'default' : 'outline'}
                              className="text-[10px] h-4"
                            >
                              {form.status === 'COMPLETED' ? 'Obrigatório' : 'Recomendado'}
                            </Badge>
                          </Label>
                          <SearchableSelect
                            options={stockItemOptions}
                            value={epi.stockItemId || ''}
                            fallbackLabel={
                              (() => {
                                if (epi.stockItemId) {
                                  const found = stockItems.find((i) => i.id === epi.stockItemId);
                                  if (found) {
                                    const code = found.code || found.barcode || '';
                                    const name = found.fullName || found.name || 'Item sem nome';
                                    return code ? `${code} — ${name}` : name;
                                  }
                                }
                                return epi.nome ? `EPI: ${epi.nome}` : undefined;
                              })()
                            }
                            onChange={(value) => {
                              if (!value || value === 'all' || value === 'none') {
                                handleEpiChange(idx, 'stockItemId', '');
                                return;
                              }
                              handleEpiChange(idx, 'stockItemId', value);
                              const selected = stockItems.find((i) => i.id === value);
                              if (selected) {
                                if (selected.fullName || selected.name) {
                                  handleEpiChange(idx, 'nome', selected.fullName || selected.name);
                                }
                                if (selected.sizeVariation && !epi.tamanho) {
                                  handleEpiChange(idx, 'tamanho', selected.sizeVariation);
                                }
                                if (selected.caNumber && !epi.ca) {
                                  handleEpiChange(idx, 'ca', selected.caNumber);
                                }
                                const qty = Number(selected.currentQuantity) || 0;
                                if (qty <= 0) {
                                  toast({
                                    title: 'Item sem estoque',
                                    description:
                                      'Este item está com saldo 0. Cadastre entrada no estoque e informe a quantidade mínima antes de concluir a entrega.',
                                    variant: 'destructive',
                                  });
                                }
                              }
                            }}
                            placeholder="Buscar por código, nome ou descrição do item..."
                            searchPlaceholder="Buscar por código, nome ou descrição..."
                            emptyPlaceholder="Nenhum item de EPI encontrado."
                            minSearchChars={0}
                            minCharsMessage="Digite para filtrar itens de estoque..."
                            className={cn(
                              "h-10 bg-background border-primary/20 text-foreground hover:bg-background",
                              form.status === 'COMPLETED' && (!epi.stockItemId || epi.stockItemId === 'none')
                                && "border-destructive"
                            )}
                          />
                          {(() => {
                            const qty = getStockQty(epi.stockItemId);
                            if (epi.stockItemId && qty !== null && qty <= 0) {
                              return (
                                <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" />
                                  <span>
                                    Saldo zerado neste item. Cadastre itens/entrada no sistema de estoque e informe a{' '}
                                    <strong className="text-amber-50">quantidade mínima</strong> antes de concluir a ficha.
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <p className="text-[10px] text-muted-foreground">
                                {form.status === 'COMPLETED'
                                  ? 'Digite o código do item (mín. 3 caracteres). Cada item concluído gera saída no estoque.'
                                  : 'Digite o código ou nome (mín. 3 caracteres). O nome do EPI é preenchido ao selecionar.'}
                              </p>
                            );
                          })()}
                        </div>

                        {/* Nome do EPI */}
                        <div className="space-y-2 lg:col-span-2">
                          <Label className="text-sm font-medium">Nome do EPI / Equipamento</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                title={epi.nome || "Selecione ou digite o nome..."}
                                className="w-full h-10 justify-between font-normal bg-background text-foreground hover:bg-muted hover:text-foreground focus:text-foreground"
                              >
                                <span className="truncate text-left flex-1" title={epi.nome || "Selecione ou digite o nome..."}>
                                  {epi.nome || "Selecione ou digite o nome..."}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Buscar EPI..." />
                                <CommandList>
                                  <CommandEmpty>Nenhum EPI encontrado.</CommandEmpty>
                                  <CommandGroup heading="Sugestões">
                                    {epiOptions.map((option) => (
                                      <CommandItem
                                        key={option}
                                        value={option}
                                        onSelect={() => {
                                          handleEpiChange(idx, 'nome', option);
                                          const match = option?.trim().match(/\b(PP|P|M|G|GG|XG|XGG|EG|EGG|EXG|3[3-9]|4[0-9]|5[0-0])\b$/i);
                                          if (match && !epi.tamanho) {
                                            handleEpiChange(idx, 'tamanho', match[1].toUpperCase());
                                          }
                                          // Se não possui stockItemId vinculado, tentar auto-vincular se houver correspondência exata de nome no estoque
                                          if (!epi.stockItemId && stockItems.length > 0) {
                                            const optLower = option.trim().toLowerCase();
                                            const matchedStock = stockItems.find(item => {
                                              const fullName = (item.fullName || item.name || '').trim().toLowerCase();
                                              return fullName === optLower || fullName.startsWith(optLower);
                                            });
                                            if (matchedStock) {
                                              handleEpiChange(idx, 'stockItemId', matchedStock.id);
                                              if (matchedStock.caNumber && !epi.ca) {
                                                handleEpiChange(idx, 'ca', matchedStock.caNumber);
                                              }
                                            }
                                          }
                                          // Limpar campos de uniforme se mudar o EPI
                                          if (option !== 'Uniforme de Trabalho') {
                                            handleEpiChange(idx, 'uniformeTipo', '');
                                            handleEpiChange(idx, 'uniformePeca', '');
                                          }
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            epi.nome === option ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {option}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Campos padrão quando NÃO é Uniforme de Trabalho */}
                        {epi.nome !== 'Uniforme de Trabalho' && (
                          <>
                            <div className="space-y-2">
                              <Label>Nº / Tamanho</Label>
                              <Input
                                value={epi.tamanho || ''}
                                onChange={(e) => handleEpiChange(idx, 'tamanho', e.target.value)}
                                placeholder="Ex.: 44, 42, M, G..."
                                className="bg-background"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Quantidade</Label>
                              <Input
                                type="number"
                                min="1"
                                value={epi.quantidade}
                                onChange={(e) => handleEpiChange(idx, 'quantidade', e.target.value)}
                                className="bg-background"
                              />
                            </div>

                            <div className="space-y-2 relative">
                              <Label>CA</Label>
                              <div className="relative">
                                <Input
                                  value={epi.ca}
                                  onChange={(e) => {
                                    handleEpiChange(idx, 'ca', e.target.value);
                                    handleCASearch(idx, e.target.value);
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      if (epi.ca) {
                                        handleCABlur(idx, epi.ca);
                                      }
                                    }, 200);
                                  }}
                                  placeholder="Digite o número do CA"
                                  className="bg-background pr-8"
                                />
                                {caLoading[idx] && (
                                  <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                                )}
                              </div>
                              {epi.caName && (
                                <p className="text-xs text-gray-500 mt-1">{epi.caName}</p>
                              )}
                              {showCaSuggestions[idx] && caSuggestions[idx] && caSuggestions[idx].length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                                  {caSuggestions[idx].map((suggestion, sugIdx) => (
                                    <div
                                      key={sugIdx}
                                      onClick={() => handleCASelect(idx, suggestion)}
                                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                                    >
                                      <div className="font-medium text-sm">{suggestion.numero}</div>
                                      <div className="text-xs text-gray-500">{suggestion.nome || suggestion.descricao}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Campos específicos para Uniforme de Trabalho */}
                      {epi.nome === 'Uniforme de Trabalho' && (
                        <div className="bg-seguranca-black/40 p-4 rounded-lg border border-seguranca-yellow/40 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="font-semibold text-seguranca-lightgray">Tipo de Uniforme *</Label>
                              <Select
                                value={epi.uniformeTipo || ''}
                                onValueChange={(value) => {
                                  handleEpiChange(idx, 'uniformeTipo', value);
                                  if (value !== 'INDIVIDUAL') {
                                    handleEpiChange(idx, 'uniformePeca', '');
                                  }
                                }}
                              >
                                <SelectTrigger className="bg-background">
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="COMPLETO">Completo</SelectItem>
                                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Se for Individual, mostrar seleção de peça */}
                            {epi.uniformeTipo === 'INDIVIDUAL' && (
                              <div className="space-y-2">
                                <Label className="font-semibold text-seguranca-lightgray">Peça do Uniforme *</Label>
                                <Select
                                  value={epi.uniformePeca || ''}
                                  onValueChange={(value) => handleEpiChange(idx, 'uniformePeca', value)}
                                >
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Selecione a peça" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {uniformePecasOptions.map(option => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Campos comuns para uniforme */}
                            {epi.uniformeTipo && (
                              <>
                                <div className="space-y-2">
                                  <Label>Nº / Tamanho</Label>
                                  <Input
                                    value={epi.tamanho || ''}
                                    onChange={(e) => handleEpiChange(idx, 'tamanho', e.target.value)}
                                    placeholder="Ex.: 44, 42, M, G, GG..."
                                    className="bg-background"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Quantidade</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={epi.quantidade}
                                    onChange={(e) => handleEpiChange(idx, 'quantidade', e.target.value)}
                                    className="bg-background"
                                  />
                                </div>

                                <div className="space-y-2 relative">
                                  <Label>CA</Label>
                                  <div className="relative">
                                    <Input
                                      value={epi.ca}
                                      onChange={(e) => {
                                        handleEpiChange(idx, 'ca', e.target.value);
                                        handleCASearch(idx, e.target.value);
                                      }}
                                      onBlur={() => {
                                        setTimeout(() => {
                                          if (epi.ca) {
                                            handleCABlur(idx, epi.ca);
                                          }
                                        }, 200);
                                      }}
                                      placeholder="Digite o número do CA"
                                      className="bg-background pr-8"
                                    />
                                    {caLoading[idx] && (
                                      <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                                    )}
                                  </div>
                                  {epi.caName && (
                                    <p className="text-xs text-gray-500 mt-1">{epi.caName}</p>
                                  )}
                                  {showCaSuggestions[idx] && caSuggestions[idx] && caSuggestions[idx].length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                                      {caSuggestions[idx].map((suggestion, sugIdx) => (
                                        <div
                                          key={sugIdx}
                                          onClick={() => handleCASelect(idx, suggestion)}
                                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                                        >
                                          <div className="font-medium text-sm">{suggestion.numero}</div>
                                          <div className="text-xs text-gray-500">{suggestion.nome || suggestion.descricao}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Validade para uniforme */}
                          {epi.uniformeTipo && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Validade</Label>
                                <Input
                                  type="date"
                                  value={epi.validade}
                                  onChange={(e) => handleEpiChange(idx, 'validade', e.target.value)}
                                  className="bg-background"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Validade para EPIs que não são uniforme */}
                      {epi.nome !== 'Uniforme de Trabalho' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Validade</Label>
                            <Input
                              type="date"
                              value={epi.validade}
                              onChange={(e) => handleEpiChange(idx, 'validade', e.target.value)}
                              className="bg-background"
                            />
                          </div>
                        </div>
                      )}

                      {/* Substituição — preenche colunas SUBSTITUÍDO / MOTIVO DA SUBST. no PDF */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            Substituído em
                            <Badge variant="outline" className="text-[10px] h-4">PDF</Badge>
                          </Label>
                          <Input
                            type="date"
                            value={epi.dataSubstituicao || ''}
                            onChange={(e) => handleEpiChange(idx, 'dataSubstituicao', e.target.value)}
                            className="bg-background"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Data exibida na coluna SUBSTITUÍDO da ficha.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            Motivo da substituição
                            <Badge variant="outline" className="text-[10px] h-4">PDF</Badge>
                          </Label>
                          <Input
                            value={epi.motivoSubstituicao || ''}
                            onChange={(e) => handleEpiChange(idx, 'motivoSubstituicao', e.target.value)}
                            placeholder="Ex.: desgaste, troca de tamanho, extravio..."
                            className="bg-background"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Texto da coluna MOTIVO DA SUBST. no PDF.
                          </p>
                        </div>
                      </div>

                      {/* Devolução — preenche colunas DEVOLUÇÃO / MOTIVO DA DEVOLUÇÃO no PDF */}
                      {(form.tipoEntrega === 'DEVOLUCAO' || epi.dataDevolucao || epi.motivoDevolucao) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              Data da Devolução
                              <Badge variant="outline" className="text-[10px] h-4">PDF</Badge>
                            </Label>
                            <Input
                              type="date"
                              value={epi.dataDevolucao || ''}
                              onChange={(e) => handleEpiChange(idx, 'dataDevolucao', e.target.value)}
                              className="bg-background"
                            />
                            <p className="text-[10px] text-muted-foreground">
                              Data exibida na coluna DEVOLUÇÃO da ficha.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              Motivo da Devolução
                              <Badge variant="outline" className="text-[10px] h-4">PDF</Badge>
                            </Label>
                            <Input
                              value={epi.motivoDevolucao || ''}
                              onChange={(e) => handleEpiChange(idx, 'motivoDevolucao', e.target.value)}
                              placeholder="Ex.: demissão, devolução de equipamento..."
                              className="bg-background"
                            />
                            <p className="text-[10px] text-muted-foreground">
                              Texto da coluna MOTIVO DA DEVOLUÇÃO no PDF.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Observações do Item (sempre visível) */}
                      <div className="space-y-2">
                        <Label>Observações do Item</Label>
                        <Input
                          value={epi.observacoes}
                          onChange={(e) => handleEpiChange(idx, 'observacoes', e.target.value)}
                          placeholder="Observações específicas..."
                          className="bg-background"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações Gerais</Label>
            <Textarea
              value={form.observacoes}
              onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações adicionais sobre a entrega dos EPIs..."
              rows={3}
              className="resize-none bg-background"
            />
          </div>

          {/* Assinatura Digital */}
          {form.signatureType === 'ON_SCREEN' && (
            <div className="space-y-4 p-6 bg-muted/30 rounded-xl border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Assinatura do Funcionário</span>
                </div>
                {form.signatureBase64 ? (
                  <Badge className="bg-green-500 hover:bg-green-600 gap-1 text-white border-none">
                    <CheckCircle2 className="h-3 w-3" />
                    Assinado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-500 border-amber-500 gap-1 animate-pulse">
                    <AlertCircle className="h-3 w-3" />
                    Aguardando Assinatura
                  </Badge>
                )}
              </div>
              
              {!form.signatureBase64 ? (
                <div className="bg-white rounded-lg p-2 border-2 border-dashed border-muted-foreground/30">
                  <SignaturePad 
                    onSave={(base64) => setForm(prev => ({ ...prev, signatureBase64: base64 }))} 
                  />
                </div>
              ) : (
                <div className="relative group max-w-lg mx-auto bg-white rounded-lg border-2 border-green-200 p-4 shadow-inner">
                  <img 
                    src={form.signatureBase64} 
                    alt="Assinatura" 
                    className="max-h-32 mx-auto" 
                  />
                  <Button 
                    type="button"
                    variant="destructive" 
                    size="sm" 
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0 shadow-lg"
                    onClick={() => setForm(prev => ({ ...prev, signatureBase64: '' }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground mt-2 uppercase tracking-widest font-mono">
                    Assinatura Digital Registrada
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Confirmação WhatsApp */}
          {form.signatureType === 'WHATSAPP_CONFIRM' && (
            <div className="space-y-4 p-6 bg-muted/30 rounded-xl border border-emerald-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  <span>Confirmação de recebimento via WhatsApp</span>
                </div>
                {confirmationPending ? (
                  <Badge variant="outline" className="text-amber-600 border-amber-500 gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Aguardando confirmação
                  </Badge>
                ) : form.status === 'COMPLETED' ? (
                  <Badge className="bg-green-500 text-white border-none gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Confirmado
                  </Badge>
                ) : null}
              </div>

              <p className="text-sm text-muted-foreground">
                {perItemMode ? (
                  <>O funcionário ativo recebe um código e um link de 6 dígitos <strong>para cada item</strong> entregue. A ficha só é concluída quando todos os itens forem confirmados.</>
                ) : (
                  <>O funcionário recebe um link e um código de 6 dígitos. Ao confirmar, a ficha é concluída e o estoque é baixado.</>
                )}
                {funcionario?.phone ? (
                  <> Telefone cadastrado: <strong>{funcionario.phone}</strong>.</>
                ) : (
                  <span className="text-amber-600"> Cadastre o telefone do funcionário antes de enviar.</span>
                )}
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  className="gap-2"
                  disabled={sendingWhatsApp || !funcionario || !empresa}
                  onClick={() => handleSendWhatsApp('AUTO')}
                >
                  {sendingWhatsApp ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                  Enviar automaticamente
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={sendingWhatsApp || !funcionario || !empresa}
                  onClick={() => handleSendWhatsApp('MANUAL')}
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir WhatsApp (manual)
                </Button>
              </div>

              {whatsappResult && whatsappResult.items?.length ? (
                <div className="rounded-lg border bg-background p-4 space-y-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground font-medium">Códigos por item:</span>
                    <span className="text-muted-foreground ml-auto">Tel. {whatsappResult.phoneMasked}</span>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow>
                          <TableHead>EPI</TableHead>
                          <TableHead>Código</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {whatsappResult.items.map((item) => (
                          <TableRow key={item.itemId}>
                            <TableCell className="font-medium">{item.epiName}</TableCell>
                            <TableCell>
                              <code className="font-mono text-lg tracking-widest font-bold">{item.confirmationCode}</code>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  navigator.clipboard.writeText(item.confirmationCode);
                                  toast({ title: 'Código copiado' });
                                }}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => window.open(item.confirmUrl, '_blank')}
                                title="Abrir link de confirmação"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cada código confirma um item individualmente. Copie os códigos para informar ao funcionário ou
                    {whatsappResult.whatsappUrl && (
                      <> reabra o WhatsApp: </>
                    )}
                    {whatsappResult.whatsappUrl && (
                      <Button type="button" variant="link" size="sm" className="p-0 h-auto text-xs underline" onClick={() => window.open(whatsappResult.whatsappUrl!, '_blank')}>
                        abrir mensagem
                      </Button>
                    )}
                    {!whatsappResult.whatsappUrl && '.'}
                  </p>
                  {!whatsappResult.sent && whatsappResult.whatsappUrl && (
                    <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={() => window.open(whatsappResult.whatsappUrl!, '_blank')}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      Reabrir WhatsApp
                    </Button>
                  )}
                </div>
              ) : whatsappResult ? (
                <div className="rounded-lg border bg-background p-4 space-y-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">Código:</span>
                    <code className="font-mono text-lg tracking-widest font-bold">{whatsappResult.confirmationCode}</code>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        navigator.clipboard.writeText(whatsappResult.confirmationCode);
                        toast({ title: 'Código copiado' });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-muted-foreground ml-auto">Tel. {whatsappResult.phoneMasked}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground shrink-0">Link:</span>
                    <a
                      href={whatsappResult.confirmUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline break-all text-xs"
                    >
                      {whatsappResult.confirmUrl}
                    </a>
                  </div>
                  {!whatsappResult.sent && whatsappResult.whatsappUrl && (
                    <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={() => window.open(whatsappResult.whatsappUrl, '_blank')}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      Reabrir WhatsApp
                    </Button>
                  )}
                </div>
              ) : null}

              {perItemMode && itemConfirmations.some((i) => i.confirmationCode || i.confirmedAt) && (
                <div className="rounded-lg border bg-background p-4 space-y-2 text-sm">
                  <span className="text-muted-foreground font-medium">Status da confirmação por item</span>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow>
                          <TableHead>EPI</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itemConfirmations.map((item) => (
                          <TableRow key={item.id || item.epiName}>
                            <TableCell className="font-medium">{item.epiName}</TableCell>
                            <TableCell className="text-right">
                              {item.confirmedAt ? (
                                <Badge className="bg-green-500 text-white border-none gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Confirmado
                                </Badge>
                              ) : item.confirmationCode ? (
                                <Badge variant="outline" className="text-amber-600 border-amber-500 gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Aguardando confirmação
                                </Badge>
                              ) : (
                                <Badge variant="outline">Sem envio</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 space-y-2">
                <Label className="text-sm">Confirmar com código informado pelo funcionário</Label>
                <p className="text-xs text-muted-foreground">
                  {perItemMode
                    ? 'Digite o código de 6 dígitos de um item para confirmá-lo individualmente.'
                    : 'Digite o código de 6 dígitos recebido pelo funcionário para confirmar a ficha inteira.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={adminConfirmCode}
                    onChange={(e) => setAdminConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="font-mono tracking-widest sm:max-w-[160px]"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={sendingWhatsApp || adminConfirmCode.length !== 6}
                    onClick={handleAdminConfirmCode}
                  >
                    Validar código {perItemMode ? 'do item' : 'e concluir'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Ações */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSalvarFicha}
              className="flex items-center gap-2 w-full sm:w-auto h-11"
              disabled={loading || loadingData || !funcionario || !empresa}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Salvar Ficha
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={handlePreview}
              variant="outline"
              className="flex items-center gap-2 w-full sm:w-auto h-11"
              disabled={loading || loadingData || !funcionario || !empresa || !form.dataEntrega || epis.some(epi => !epi.nome)}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando Preview...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Visualizar Ficha
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => handleGerarPDF()}
              className="flex items-center gap-2 w-full sm:w-auto h-11 shadow-md hover:shadow-lg transition-all"
              disabled={loading || loadingData || !funcionario || !empresa}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Gerar e Baixar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FichaEntregaEPIForm;