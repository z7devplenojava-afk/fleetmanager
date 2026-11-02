import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MedicalExam, CreateMedicalExamDTO, MedicalExamType, sstService } from '@/services/sstService';
import { 
  Loader2, 
  User, 
  Stethoscope, 
  Calendar, 
  FileText, 
  Building2, 
  Search, 
  Printer, 
  Clock, 
  CheckCircle2, 
  Plus,
  Check,
  X,
  Bus,
  Pickaxe,
  Activity,
  ListChecks
} from 'lucide-react';
import { employeeService, SimpleEmployee, Employee } from '@/services/employeeService';
import { doctorService } from '@/services/doctorService';
import { contasAPagarService, Supplier } from '@/services/contasAPagarService';
import { companyService } from '@/services/companyService';
import { useDebounce } from '@/hooks/use-debounce';
import { medicalExamPDFGenerator } from '@/utils/medicalExamPdfGenerator';
import { useToast } from '@/hooks/use-toast';

interface MedicalExamFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam?: MedicalExam | null;
  onSubmit: (data: CreateMedicalExamDTO) => Promise<MedicalExam | void>;
}

interface DoctorItem {
  id: string;
  name: string;
  crmNumber: string;
  crmState: string;
}

export interface CategoryOption {
  value: string;
  label: string;
  isCustom?: boolean;
}

export const DEFAULT_CATEGORIES: CategoryOption[] = [
  { value: 'PERIODICO', label: 'Periódico (Padrão PCMSO)' },
  { value: 'ADMISSIONAL', label: 'Admissional' },
  { value: 'DEMISSIONAL', label: 'Demissional' },
  { value: 'RETORNO', label: 'Retorno ao Trabalho' },
  { value: 'MUDANCA_FUNCAO', label: 'Mudança de Função / Riscos' },
  { value: 'RECICLAGEM', label: 'Reciclagem / Treinamento Operacional' },
  { value: 'RENOVACAO_CNH', label: 'Renovação de CNH / Aptidão Motorista' },
  { value: 'AVALIACAO_PSICOSSOCIAL', label: 'Avaliação Psicossocial (NR-20 / NR-35)' },
  { value: 'MONITORAMENTO', label: 'Monitoramento / Reavaliação de Saúde' },
  { value: 'TOXICOLOGICO_SORTEIO', label: 'Toxicológico Periódico (Sorteio Lei 13.103)' },
  { value: 'REABILITACAO', label: 'Reabilitação Profissional (INSS)' },
];

export interface ExamTypeItem {
  name: string;
  validityMonths?: number;
  description?: string;
  categorySuggestion?: string;
}

export interface ExamTypeGroup {
  group: string;
  items: ExamTypeItem[];
}

export const DEFAULT_EXAM_GROUPS: ExamTypeGroup[] = [
  {
    group: '🚗 Motoristas & Operacional (Transporte e Logística)',
    items: [
      { 
        name: 'Exame Toxicológico de Larga Janela (CLT / CNH Motorista)', 
        validityMonths: 24, 
        description: 'Obrigatório para motoristas C, D e E (janela de 90 dias)',
        categorySuggestion: 'RENOVACAO_CNH'
      },
      { 
        name: 'Avaliação Psicossocial (Motoristas / NR-20 / NR-35)', 
        validityMonths: 12, 
        description: 'Avaliação de estresse e perfil de condução segura',
        categorySuggestion: 'AVALIACAO_PSICOSSOCIAL'
      },
      { 
        name: 'Acuidade Visual e Campo Visual (Campimetria)', 
        validityMonths: 12, 
        description: 'Avaliação oftalmológica e visão noturna para motoristas' 
      },
      { 
        name: 'Audiometria Tonal e Vocal', 
        validityMonths: 12, 
        description: 'Exige repouso auditivo obrigatório de 14 horas' 
      },
      { 
        name: 'Reciclagem / Teste Prático de Direção Preventiva', 
        validityMonths: 12, 
        description: 'Treinamento e validação de aptidão operacional',
        categorySuggestion: 'RECICLAGEM'
      },
      { 
        name: 'Avaliação de Distúrbio do Sono / Apneia', 
        validityMonths: 12, 
        description: 'Segurança e prevenção de fadiga ao volante' 
      },
    ]
  },
  {
    group: '🩺 Exames Clínicos & Cardíacos',
    items: [
      { name: 'Exame Clínico Ocupacional (ASO)', validityMonths: 12, description: 'Consulta clínica médica ocupacional' },
      { name: 'Eletrocardiograma (ECG)', validityMonths: 12, description: 'Avaliação cardíaca em repouso' },
      { name: 'Eletroencefalograma (EEG)', validityMonths: 12, description: 'Avaliação neurológica (altura / direção)' },
      { name: 'Teste Ergométrico', validityMonths: 12, description: 'Eletrocardiograma de esforço físico' },
    ]
  },
  {
    group: '🧪 Laboratoriais & Complementares (NR-07)',
    items: [
      { name: 'Espirometria Ocupacional', validityMonths: 12, description: 'Prova de função pulmonar' },
      { name: 'Raio-X de Tórax P.A. (Padrão OIT)', validityMonths: 12, description: 'Radiografia pulmonar ocupacional' },
      { name: 'Hemograma Completo', validityMonths: 12, description: 'Exame laboratorial de sangue' },
      { name: 'Glicemia de Jejum', validityMonths: 12, description: 'Jejum obrigatório de 8 a 12 horas' },
      { name: 'Lipidograma (Colesterol Total e Frações)', validityMonths: 12, description: 'Perfil lipídico e risco cardiovascular' },
      { name: 'Exame de Urina (EAS / EPF)', validityMonths: 12, description: 'Sumário de urina e parasitológico' },
      { name: 'Gama GT / Transaminases (Perfil Hepático)', validityMonths: 12, description: 'Avaliação hepática ocupacional' },
    ]
  }
];

// Lista de procedimentos disponíveis para seleção na Guia
export const AVAILABLE_PROCEDURES = [
  'Exame Clínico Ocupacional (ASO)',
  'Acuidade Visual e Campo Visual (Campimetria)',
  'Audiometria Tonal e Vocal',
  'Eletrocardiograma (ECG)',
  'Eletroencefalograma (EEG)',
  'Exames Laboratoriais (Glicemia, Hemograma, Lipidograma)',
  'Avaliação Psicossocial (Motoristas / NR-20 / NR-35)',
  'Exame Toxicológico de Larga Janela (CLT / CNH Motorista)',
  'Raio-X de Tórax P.A. (Padrão OIT)',
  'Espirometria Ocupacional',
  'Teste Ergométrico',
  'Exame de Urina (EAS / EPF)',
];

export default function MedicalExamFormModal({
  open,
  onOpenChange,
  exam,
  onSubmit,
}: MedicalExamFormModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Dados do formulário
  const [employeeId, setEmployeeId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Partial<Employee> | null>(null);
  const [examType, setExamType] = useState('Exame Clínico Ocupacional (ASO)');
  const [examCategory, setExamCategory] = useState<string>('PERIODICO');
  const [validityMonths, setValidityMonths] = useState<number>(12);
  const [scheduledDate, setScheduledDate] = useState('');
  const [examDate, setExamDate] = useState('');
  const [nextExamDate, setNextExamDate] = useState('');
  const [status, setStatus] = useState<'PENDENTE' | 'REALIZADO' | 'ATRASADO' | 'CANCELADO'>('PENDENTE');
  const [result, setResult] = useState<'APTO' | 'INAPTO' | 'APTO_COM_RESTRICOES' | ''>('');
  const [restrictions, setRestrictions] = useState('');
  const [notes, setNotes] = useState('');

  // Procedimentos selecionados para a Guia (Bateria)
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([
    'Exame Clínico Ocupacional (ASO)'
  ]);

  // Categorias (incluindo customizadas)
  const [categories, setCategories] = useState<CategoryOption[]>(() => {
    try {
      const saved = localStorage.getItem('sst_custom_categories');
      if (saved) {
        const parsed: CategoryOption[] = JSON.parse(saved);
        const existingValues = new Set(DEFAULT_CATEGORIES.map(c => c.value));
        const customFiltered = parsed.filter(p => !existingValues.has(p.value));
        return [...DEFAULT_CATEGORIES, ...customFiltered];
      }
    } catch {}
    return DEFAULT_CATEGORIES;
  });

  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Tipos de Exame (incluindo customizados)
  const [customExamTypes, setCustomExamTypes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sst_custom_exam_types');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [isAddingNewExamType, setIsAddingNewExamType] = useState(false);
  const [newExamTypeName, setNewExamTypeName] = useState('');

  // Clínica e Fornecedores
  const [clinicName, setClinicName] = useState('');
  const [clinicCnpj, setClinicCnpj] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [, setSelectedSupplierId] = useState<string>('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [clinicSearchTerm, setClinicSearchTerm] = useState('');
  const [showClinicDropdown, setShowClinicDropdown] = useState(false);

  // Médico
  const [doctorName, setDoctorName] = useState('');
  const [doctorCrm, setDoctorCrm] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  // Tipos vindos do backend
  const [backendExamTypes, setBackendExamTypes] = useState<MedicalExamType[]>([]);

  // Busca de Funcionário
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Debounce
  const debouncedEmployeeSearch = useDebounce(employeeSearchTerm, 300);
  const debouncedDoctorSearch = useDebounce(doctorSearchTerm, 300);

  // Carregar fornecedores e tipos do backend ao abrir
  useEffect(() => {
    if (open) {
      loadSuppliers();
      loadExamTypes();
    }
  }, [open]);

  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const data = await contasAPagarService.getFornecedores();
      setSuppliers(data || []);
    } catch (err) {
      console.error('Erro ao carregar fornecedores/clínicas:', err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const loadExamTypes = async () => {
    try {
      const types = await sstService.getExamTypes();
      if (types && types.length > 0) {
        setBackendExamTypes(types);
      }
    } catch {
      // Ignorar se a tabela de tipos ainda não tiver registros
    }
  };

  // Buscar funcionários
  useEffect(() => {
    if (debouncedEmployeeSearch && debouncedEmployeeSearch.length >= 2) {
      setLoadingEmployees(true);
      employeeService.searchSimpleEmployees(debouncedEmployeeSearch)
        .then(setEmployees)
        .catch(() => setEmployees([]))
        .finally(() => setLoadingEmployees(false));
    } else if (debouncedEmployeeSearch.length === 0) {
      setEmployees([]);
    }
  }, [debouncedEmployeeSearch]);

  // Buscar médicos
  useEffect(() => {
    if (debouncedDoctorSearch && debouncedDoctorSearch.length >= 2) {
      doctorService.searchByName(debouncedDoctorSearch)
        .then(setDoctors)
        .catch(() => setDoctors([]));
    }
  }, [debouncedDoctorSearch]);

  // Cálculo automático de vencimento
  useEffect(() => {
    const baseDateStr = examDate || (status === 'REALIZADO' ? scheduledDate : '');
    if (baseDateStr && validityMonths) {
      try {
        const base = new Date(baseDateStr);
        if (!isNaN(base.getTime())) {
          const next = new Date(base);
          next.setMonth(next.getMonth() + Number(validityMonths));
          setNextExamDate(next.toISOString().split('T')[0]);
        }
      } catch {
        // Ignora erro de data
      }
    }
  }, [examDate, validityMonths, status, scheduledDate]);

  // Inicializar dados do exame (para edição ou novo)
  useEffect(() => {
    if (exam) {
      setEmployeeId(exam.employeeId || '');
      setExamType(exam.examType || 'Exame Clínico Ocupacional (ASO)');
      setExamCategory(exam.examCategory || 'PERIODICO');
      setValidityMonths(exam.validityMonths || 12);
      setScheduledDate(exam.scheduledDate ? new Date(exam.scheduledDate).toISOString().slice(0, 16) : '');
      setExamDate(exam.examDate ? exam.examDate.slice(0, 10) : (exam.performedDate ? exam.performedDate.slice(0, 10) : ''));
      setNextExamDate(exam.nextExamDate ? exam.nextExamDate.slice(0, 10) : (exam.expirationDate ? exam.expirationDate.slice(0, 10) : ''));
      setStatus(exam.status || 'PENDENTE');
      setResult((exam.result as any) || '');
      setDoctorName(exam.doctorName || '');
      setDoctorCrm(exam.doctorCrm || '');
      setClinicName(exam.clinicName || '');
      setRestrictions(exam.restrictions || '');
      setNotes(exam.notes || '');

      if (exam.employeeName) {
        setEmployeeSearchTerm(exam.employeeName);
        fetchEmployeeDetails(exam.employeeId);
      }
      if (exam.clinicName) {
        setClinicSearchTerm(exam.clinicName);
      }

      // Se a categoria do exame for customizada e ainda não estiver na lista, adiciona
      if (exam.examCategory) {
        setCategories(prev => {
          if (!prev.some(c => c.value === exam.examCategory)) {
            return [...prev, { value: exam.examCategory, label: exam.examCategory, isCustom: true }];
          }
          return prev;
        });
      }

      // Tenta recuperar procedimentos da anotação ou colocar o exame atual
      if (exam.examType) {
        setSelectedProcedures([exam.examType]);
      }
    } else {
      // Padrões para novo agendamento
      setEmployeeId('');
      setEmployeeDetails(null);
      setEmployeeSearchTerm('');
      setExamType('Exame Clínico Ocupacional (ASO)');
      setExamCategory('PERIODICO');
      setValidityMonths(12);
      setSelectedProcedures(['Exame Clínico Ocupacional (ASO)']);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      setScheduledDate(tomorrow.toISOString().slice(0, 16));
      
      setExamDate('');
      setNextExamDate('');
      setStatus('PENDENTE');
      setResult('');
      setRestrictions('');
      setNotes('');
      setClinicName('');
      setClinicCnpj('');
      setClinicAddress('');
      setClinicPhone('');
      setSelectedSupplierId('');
      setClinicSearchTerm('');
      setDoctorName('');
      setDoctorCrm('');
      setDoctorSearchTerm('');
      setIsAddingNewCategory(false);
      setIsAddingNewExamType(false);
    }
  }, [exam, open]);

  const fetchEmployeeDetails = async (id: string) => {
    try {
      const emp = await employeeService.getEmployeeById(id);
      if (emp) {
        setEmployeeDetails(emp);
      }
    } catch {
      // Silencioso
    }
  };

  const handleSelectEmployee = (emp: SimpleEmployee) => {
    setEmployeeId(emp.id);
    setEmployeeSearchTerm(emp.name);
    setShowEmployeeDropdown(false);
    fetchEmployeeDetails(emp.id);
  };

  // Filtragem inteligente de Clínicas/Fornecedores
  const filteredSuppliers = useMemo(() => {
    const term = clinicSearchTerm.toLowerCase().trim();
    if (!term) return suppliers.slice(0, 15);
    return suppliers.filter(s => 
      s.name?.toLowerCase().includes(term) ||
      s.tradeName?.toLowerCase().includes(term) ||
      s.cnpj?.includes(term) ||
      s.category?.toLowerCase().includes(term)
    ).slice(0, 20);
  }, [suppliers, clinicSearchTerm]);

  const handleSelectSupplierClinic = (sup: Supplier) => {
    setSelectedSupplierId(sup.id);
    const displayName = sup.tradeName || sup.name;
    setClinicName(displayName);
    setClinicSearchTerm(displayName);
    setClinicCnpj(sup.cnpj || '');
    setClinicPhone(sup.phone || '');
    
    const addrParts = [
      sup.address,
      sup.city ? `${sup.city}${sup.state ? ` - ${sup.state}` : ''}` : ''
    ].filter(Boolean);
    setClinicAddress(addrParts.join(', '));
    setShowClinicDropdown(false);
  };

  const handleSelectDoctor = (doc: DoctorItem) => {
    setDoctorName(doc.name);
    setDoctorCrm(`${doc.crmNumber}${doc.crmState ? `/${doc.crmState}` : ''}`);
    setDoctorSearchTerm(doc.name);
    setShowDoctorDropdown(false);
  };

  // Adicionar Nova Categoria
  const handleConfirmNewCategory = () => {
    const clean = newCategoryName.trim();
    if (!clean) return;

    const slug = clean.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
    const newCat: CategoryOption = {
      value: slug || clean,
      label: clean,
      isCustom: true,
    };

    setCategories(prev => {
      const updated = [...prev, newCat];
      try {
        const customOnly = updated.filter(c => c.isCustom);
        localStorage.setItem('sst_custom_categories', JSON.stringify(customOnly));
      } catch {}
      return updated;
    });

    setExamCategory(newCat.value);
    setNewCategoryName('');
    setIsAddingNewCategory(false);
    toast({
      title: 'Categoria Criada',
      description: `A categoria "${clean}" foi adicionada e selecionada.`,
    });
  };

  // Adicionar Novo Tipo de Exame
  const handleConfirmNewExamType = () => {
    const clean = newExamTypeName.trim();
    if (!clean) return;

    if (!customExamTypes.includes(clean)) {
      const updated = [...customExamTypes, clean];
      setCustomExamTypes(updated);
      try {
        localStorage.setItem('sst_custom_exam_types', JSON.stringify(updated));
      } catch {}
    }

    setExamType(clean);
    toggleProcedure(clean);
    setNewExamTypeName('');
    setIsAddingNewExamType(false);
    toast({
      title: 'Tipo de Exame Cadastrado',
      description: `O exame "${clean}" foi adicionado e selecionado.`,
    });
  };

  // Tratar seleção do tipo de exame e auto-aplicar sugestões
  const handleSelectExamType = (val: string) => {
    if (val === '__ADD_NEW__') {
      setIsAddingNewExamType(true);
      return;
    }

    setExamType(val);
    if (!selectedProcedures.includes(val)) {
      setSelectedProcedures(prev => [...prev, val]);
    }

    // Buscar no catálogo padrão para sugerir validade e orientações
    for (const group of DEFAULT_EXAM_GROUPS) {
      const found = group.items.find(i => i.name === val);
      if (found) {
        if (found.validityMonths) {
          setValidityMonths(found.validityMonths);
        }
        if (found.categorySuggestion && examCategory === 'PERIODICO') {
          setExamCategory(found.categorySuggestion);
        }
        break;
      }
    }
  };

  // Alternar seleção de procedimento na Guia
  const toggleProcedure = (procName: string) => {
    setSelectedProcedures(prev => {
      if (prev.includes(procName)) {
        // Se tentar desmarcar o único que resta, impede
        if (prev.length === 1) return prev;
        return prev.filter(p => p !== procName);
      } else {
        return [...prev, procName];
      }
    });
  };

  // ========== PRESETS / BATERIAS RÁPIDAS ==========
  const applyDriverAnnualBattery = () => {
    const battery = [
      'Exame Clínico Ocupacional (ASO)',
      'Acuidade Visual e Campo Visual (Campimetria)',
      'Audiometria Tonal e Vocal',
      'Eletrocardiograma (ECG)',
      'Eletroencefalograma (EEG)',
      'Exames Laboratoriais (Glicemia, Hemograma, Lipidograma)',
      'Avaliação Psicossocial (Motoristas / NR-20 / NR-35)',
    ];
    setSelectedProcedures(battery);
    setExamType('Exame Clínico Ocupacional (ASO)');
    setExamCategory('PERIODICO');
    setValidityMonths(12);
    setNotes(
      'Bateria Periódica Anual de Motorista. Orientações: Jejum de 8 a 12 horas para coleta de sangue. ' +
      'Repouso auditivo obrigatório de 14 horas para audiometria. Apresentar documento oficial com foto e óculos de grau (se fizer uso).'
    );
    toast({
      title: '🚌 Bateria do Motorista Aplicada',
      description: '7 exames anuais configurados com instruções de preparo (jejum e repouso auditivo).',
    });
  };

  const applyMiningBattery = () => {
    const battery = [
      'Exame Clínico Ocupacional (ASO)',
      'Acuidade Visual e Campo Visual (Campimetria)',
      'Audiometria Tonal e Vocal',
      'Eletrocardiograma (ECG)',
      'Eletroencefalograma (EEG)',
      'Exames Laboratoriais (Glicemia, Hemograma, Lipidograma)',
      'Avaliação Psicossocial (Motoristas / NR-20 / NR-35)',
      'Raio-X de Tórax P.A. (Padrão OIT)',
      'Espirometria Ocupacional',
    ];
    setSelectedProcedures(battery);
    setExamType('Exame Clínico Ocupacional (ASO)');
    setExamCategory('PERIODICO');
    setValidityMonths(12);
    setNotes(
      'Bateria de Saúde Ocupacional para Mineração / Operações Pesadas (NR-07 e NR-22). ' +
      'Inclui Raio-X Padrão OIT e Espirometria. Jejum de 8 a 12h e repouso auditivo de 14h.'
    );
    toast({
      title: '⛏️ Bateria Mineração Aplicada',
      description: '9 exames configurados incluindo Raio-X OIT e Espirometria.',
    });
  };

  const applyToxicologicalPreset = () => {
    const toxicological = 'Exame Toxicológico de Larga Janela (CLT / CNH Motorista)';
    setSelectedProcedures([toxicological]);
    setExamType(toxicological);
    setExamCategory('RENOVACAO_CNH');
    setValidityMonths(24);
    setNotes(
      'Exame Toxicológico de Larga Janela (Lei 13.103/2015). ' +
      'Janela de detecção mínima de 90 dias. Comparecer com documento oficial com foto (RG/CNH).'
    );
    toast({
      title: '🧪 Toxicológico Aplicado',
      description: 'Configurado para Renovação CNH / Periodicidade de 24 meses.',
    });
  };

  const buildPayload = (): CreateMedicalExamDTO => {
    const finalNotes = notes || (selectedProcedures.length > 1
      ? `Procedimentos solicitados na Guia: ${selectedProcedures.join(', ')}`
      : undefined);

    return {
      employeeId,
      examType,
      examCategory,
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : new Date().toISOString(),
      examDate: examDate ? examDate : undefined,
      nextExamDate: nextExamDate ? nextExamDate : undefined,
      status,
      result: status === 'REALIZADO' ? (result || undefined) : undefined,
      doctorName: doctorName || undefined,
      doctorCrm: doctorCrm || undefined,
      clinicName: clinicName || undefined,
      restrictions: restrictions || undefined,
      notes: finalNotes,
    };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!employeeId) {
      toast({ title: 'Atenção', description: 'Selecione o funcionário para o exame.', variant: 'destructive' });
      return;
    }
    if (!scheduledDate) {
      toast({ title: 'Atenção', description: 'Informe a data agendada do exame.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      await onSubmit(payload);
      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao salvar exame:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndGeneratePDF = async () => {
    if (!employeeId) {
      toast({ title: 'Atenção', description: 'Selecione o funcionário para emitir a guia.', variant: 'destructive' });
      return;
    }
    if (!clinicName) {
      toast({ title: 'Atenção', description: 'Informe ou selecione a clínica para gerar a guia de encaminhamento.', variant: 'destructive' });
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const payload = buildPayload();
      const savedExam = await onSubmit(payload);
      
      const company = await companyService.getMyCompany();

      await medicalExamPDFGenerator.generateAndOpenPDF({
        exam: {
          id: (savedExam as any)?.id || exam?.id || 'NOVO',
          employeeName: employeeDetails?.name || employeeSearchTerm,
          employeeCpf: employeeDetails?.cpf || employeeDetails?.document,
          employeeRegistrationNumber: employeeDetails?.registrationNumber,
          employeeRole: employeeDetails?.positionDescription,
          examType,
          examCategory,
          scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : new Date().toISOString(),
          clinicName,
          clinicAddress,
          clinicPhone,
          clinicCnpj,
          doctorName,
          doctorCrm,
          notes,
          additionalExams: selectedProcedures.length > 0 ? selectedProcedures : [examType],
        },
        company: company ? {
          name: company.name,
          cnpj: company.cnpj,
          address: [company.address || company.enderecoRua, company.city, company.state].filter(Boolean).join(', '),
          phone: company.phone,
          email: company.email,
        } : undefined,
        issuedAt: new Date().toISOString(),
      });

      toast({
        title: 'Guia Gerada com Sucesso!',
        description: `A Guia de Encaminhamento com ${selectedProcedures.length} exame(s) foi aberta para impressão/download.`,
      });

      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao gerar guia de encaminhamento:', err);
      toast({
        title: 'Erro na Emissão',
        description: 'Não foi possível gerar a guia em PDF. Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-seguranca-graphite border-gray-600 p-0 text-seguranca-lightgray">
        {/* Top Header */}
        <DialogHeader className="bg-gradient-to-r from-seguranca-red via-red-600 to-red-700 p-5 rounded-t-lg text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur rounded-xl shadow-inner">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  {exam ? 'Editar Exame Ocupacional' : 'Agendar / Registrar Exame Ocupacional (ASO)'}
                </DialogTitle>
                <DialogDescription className="text-white/80 text-xs sm:text-sm mt-0.5">
                  Controle de saúde ocupacional, agendamento em clínicas conveniadas e emissão de guias de encaminhamento
                </DialogDescription>
              </div>
            </div>
            <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 px-3 py-1 text-xs">
              NR-07 / PCMSO
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Card 1: Colaborador */}
          <Card className="bg-gradient-to-br from-seguranca-graphite to-gray-800 border-gray-700 shadow-md">
            <CardHeader className="py-3 px-4 border-b border-gray-700 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <User className="h-4 w-4 text-seguranca-red" />
                1. Colaborador
              </CardTitle>
              {employeeDetails && (
                <Badge variant="outline" className="text-xs border-green-500/50 text-green-400 bg-green-500/10">
                  Matrícula: {employeeDetails.registrationNumber || 'N/A'}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Label className="text-xs font-medium text-gray-300">
                  Buscar Colaborador <span className="text-seguranca-red">*</span>
                </Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Digite o nome ou CPF do funcionário..."
                    value={employeeSearchTerm}
                    onChange={(e) => {
                      setEmployeeSearchTerm(e.target.value);
                      setShowEmployeeDropdown(true);
                    }}
                    onFocus={() => setShowEmployeeDropdown(true)}
                    className="pl-9 bg-seguranca-black border-gray-700 text-white placeholder:text-gray-500 focus:border-seguranca-yellow"
                  />
                  {loadingEmployees && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>

                {/* Dropdown de Funcionários */}
                {showEmployeeDropdown && (employeeSearchTerm.length >= 2 || employees.length > 0) && (
                  <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-2xl max-h-56 overflow-auto">
                    {employees.length > 0 ? (
                      employees.map((emp) => (
                        <div
                          key={emp.id}
                          onClick={() => handleSelectEmployee(emp)}
                          className="p-2.5 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-0 transition-colors"
                        >
                          <div className="font-semibold text-white text-sm">{emp.name}</div>
                          <div className="text-xs text-gray-400 flex gap-4 mt-0.5">
                            <span>CPF: {emp.document || 'N/I'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-gray-400 text-center">
                        Nenhum funcionário encontrado.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Informações detalhadas do colaborador selecionado */}
              {employeeDetails && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-900/60 rounded-lg border border-gray-800 text-xs">
                  <div>
                    <span className="text-gray-400 block font-medium">Cargo / Função</span>
                    <span className="text-white font-semibold">{employeeDetails.positionDescription || 'Não especificado'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">CPF</span>
                    <span className="text-white font-semibold">{employeeDetails.cpf || employeeDetails.document || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Status no RH</span>
                    <Badge className="mt-0.5 bg-green-500/20 text-green-300 border-0 text-[10px]">
                      {employeeDetails.status || 'ATIVO'}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Parâmetros do Exame Ocupacional, Baterias & Validade */}
          <Card className="bg-gradient-to-br from-seguranca-graphite to-gray-800 border-gray-700 shadow-md">
            <CardHeader className="py-3 px-4 border-b border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-seguranca-yellow" />
                2. Parâmetros do Exame & Validade (ASO)
              </CardTitle>

              {/* Atalhos de Bateria com 1 clique */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-gray-400 mr-1 font-medium hidden sm:inline">Preencher Bateria:</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={applyDriverAnnualBattery}
                  className="h-7 text-[11px] px-2.5 border-blue-500/50 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 flex items-center gap-1"
                  title="Aplica a bateria anual completa de exames para motoristas de ônibus e transporte"
                >
                  <Bus className="h-3 w-3 text-blue-400" />
                  Bateria Motorista
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={applyMiningBattery}
                  className="h-7 text-[11px] px-2.5 border-amber-500/50 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 flex items-center gap-1"
                  title="Aplica bateria completa de mineração com Raio-X OIT e Espirometria"
                >
                  <Pickaxe className="h-3 w-3 text-amber-400" />
                  Mineração (NR-22)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={applyToxicologicalPreset}
                  className="h-7 text-[11px] px-2.5 border-purple-500/50 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 flex items-center gap-1"
                  title="Aplica Exame Toxicológico de Larga Janela (24 meses)"
                >
                  <Activity className="h-3 w-3 text-purple-400" />
                  Toxicológico
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Finalidade / Categoria com opção de Nova Categoria */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-300">
                      Finalidade / Categoria <span className="text-seguranca-red">*</span>
                    </Label>
                    {!isAddingNewCategory && (
                      <button
                        type="button"
                        onClick={() => setIsAddingNewCategory(true)}
                        className="text-[11px] text-seguranca-yellow hover:underline flex items-center gap-1 font-medium"
                      >
                        <Plus className="h-3 w-3" />
                        Nova Categoria
                      </button>
                    )}
                  </div>

                  {isAddingNewCategory ? (
                    <div className="mt-1 flex items-center gap-1.5 bg-gray-900 p-1.5 rounded-md border border-seguranca-yellow/50">
                      <Input
                        autoFocus
                        placeholder="Nome da categoria..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleConfirmNewCategory();
                          } else if (e.key === 'Escape') {
                            setIsAddingNewCategory(false);
                          }
                        }}
                        className="h-8 bg-black text-xs text-white border-0 focus-visible:ring-0"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleConfirmNewCategory}
                        className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
                        title="Adicionar categoria"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsAddingNewCategory(false)}
                        className="h-8 px-2 text-gray-400 hover:text-white"
                        title="Cancelar"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Select 
                      value={examCategory} 
                      onValueChange={(val) => {
                        if (val === '__NEW_CAT__') {
                          setIsAddingNewCategory(true);
                        } else {
                          setExamCategory(val);
                        }
                      }}
                    >
                      <SelectTrigger className="mt-1 bg-seguranca-black border-gray-700 text-white focus:border-seguranca-yellow">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700 text-white max-h-72">
                        <SelectGroup>
                          <SelectLabel className="text-[10px] text-gray-400 uppercase tracking-wider">
                            Categorias PCMSO / Operacional
                          </SelectLabel>
                          {categories.map((c) => (
                            <SelectItem key={c.value} value={c.value} className="text-xs hover:bg-gray-800">
                              <div className="flex items-center justify-between w-full gap-2">
                                <span>{c.label}</span>
                                {c.isCustom && (
                                  <Badge className="text-[9px] bg-blue-500/20 text-blue-300 border-0">Custom</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectSeparator className="bg-gray-800" />
                        <SelectItem value="__NEW_CAT__" className="text-xs text-seguranca-yellow font-semibold hover:bg-yellow-500/10 cursor-pointer">
                          ➕ Cadastrar Nova Categoria...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* 2. Tipo do Exame Principal / Procedimento */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-300">
                      Exame Principal <span className="text-seguranca-red">*</span>
                    </Label>
                    {!isAddingNewExamType && (
                      <button
                        type="button"
                        onClick={() => setIsAddingNewExamType(true)}
                        className="text-[11px] text-seguranca-yellow hover:underline flex items-center gap-1 font-medium"
                      >
                        <Plus className="h-3 w-3" />
                        Novo Tipo
                      </button>
                    )}
                  </div>

                  {isAddingNewExamType ? (
                    <div className="mt-1 flex items-center gap-1.5 bg-gray-900 p-1.5 rounded-md border border-seguranca-yellow/50">
                      <Input
                        autoFocus
                        placeholder="Nome do exame/procedimento..."
                        value={newExamTypeName}
                        onChange={(e) => setNewExamTypeName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleConfirmNewExamType();
                          } else if (e.key === 'Escape') {
                            setIsAddingNewExamType(false);
                          }
                        }}
                        className="h-8 bg-black text-xs text-white border-0 focus-visible:ring-0"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleConfirmNewExamType}
                        className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
                        title="Adicionar exame"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsAddingNewExamType(false)}
                        className="h-8 px-2 text-gray-400 hover:text-white"
                        title="Cancelar"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Select 
                      value={examType} 
                      onValueChange={handleSelectExamType}
                    >
                      <SelectTrigger className="mt-1 bg-seguranca-black border-gray-700 text-white focus:border-seguranca-yellow">
                        <SelectValue placeholder="Selecione o tipo de exame..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700 text-white max-h-80 overflow-y-auto">
                        {/* Grupos Pré-definidos */}
                        {DEFAULT_EXAM_GROUPS.map((grp, idx) => (
                          <SelectGroup key={idx} className="mb-2">
                            <SelectLabel className="text-[11px] font-bold text-gray-300 uppercase tracking-wider bg-gray-800/80 px-2 py-1 rounded">
                              {grp.group}
                            </SelectLabel>
                            {grp.items.map((item) => (
                              <SelectItem 
                                key={item.name} 
                                value={item.name} 
                                className="text-xs hover:bg-gray-800 cursor-pointer py-1.5"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium text-white">{item.name}</span>
                                  {item.description && (
                                    <span className="text-[10px] text-gray-400">{item.description}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}

                        {/* Tipos Cadastrados no Banco / Backend */}
                        {backendExamTypes.length > 0 && (
                          <SelectGroup className="mb-2">
                            <SelectLabel className="text-[11px] font-bold text-purple-300 uppercase tracking-wider bg-purple-950/40 px-2 py-1 rounded">
                              📋 Tipos Cadastrados no PCMSO
                            </SelectLabel>
                            {backendExamTypes.map((t) => (
                              <SelectItem key={t.id} value={t.name} className="text-xs hover:bg-gray-800">
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}

                        {/* Exames Customizados pelo Usuário */}
                        {customExamTypes.length > 0 && (
                          <SelectGroup className="mb-2">
                            <SelectLabel className="text-[11px] font-bold text-blue-300 uppercase tracking-wider bg-blue-950/40 px-2 py-1 rounded">
                              ⭐ Exames Personalizados
                            </SelectLabel>
                            {customExamTypes.map((cName) => (
                              <SelectItem key={cName} value={cName} className="text-xs hover:bg-gray-800">
                                {cName}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}

                        <SelectSeparator className="bg-gray-800" />
                        <SelectItem 
                          value="__ADD_NEW__" 
                          className="text-xs text-seguranca-yellow font-semibold hover:bg-yellow-500/10 cursor-pointer"
                        >
                          ➕ Cadastrar Outro Tipo de Exame...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* 3. Validade em Meses */}
                <div>
                  <Label className="text-xs font-medium text-gray-300">
                    Periodicidade / Validade
                  </Label>
                  <Select 
                    value={String(validityMonths)} 
                    onValueChange={(val) => setValidityMonths(Number(val))}
                  >
                    <SelectTrigger className="mt-1 bg-seguranca-black border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-700 text-white">
                      <SelectItem value="6">6 Meses (Risco Alto)</SelectItem>
                      <SelectItem value="12">12 Meses (Padrão PCMSO / Anual)</SelectItem>
                      <SelectItem value="24">24 Meses (Motoristas / Bienal)</SelectItem>
                      <SelectItem value="30">30 Meses (Toxicológico CLT / Lei 13.103)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Seletor Multi-exames / Bateria de Procedimentos da Guia */}
              <div className="pt-2 border-t border-gray-700/70">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-seguranca-yellow" />
                    <Label className="text-xs font-bold text-white">
                      Procedimentos & Exames Solicitados na Guia de Encaminhamento
                    </Label>
                  </div>
                  <Badge className="bg-blue-900/60 text-blue-300 border-0 text-[11px]">
                    {selectedProcedures.length} exame{selectedProcedures.length === 1 ? '' : 's'} incluído{selectedProcedures.length === 1 ? '' : 's'}
                  </Badge>
                </div>
                <p className="text-[11px] text-gray-400 mb-2.5">
                  Marque todos os exames que a clínica deve realizar para o colaborador nesta mesma consulta. Todos sairão listados na Guia PDF.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-gray-900/80 rounded-lg border border-gray-700/80 max-h-48 overflow-y-auto">
                  {AVAILABLE_PROCEDURES.map((proc) => {
                    const isChecked = selectedProcedures.includes(proc);
                    return (
                      <label
                        key={proc}
                        onClick={() => toggleProcedure(proc)}
                        className={`flex items-start gap-2 p-2 rounded-md cursor-pointer text-xs transition-colors border select-none ${
                          isChecked 
                            ? 'bg-blue-950/60 border-blue-500/60 text-white' 
                            : 'bg-seguranca-black/60 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                          isChecked ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-600 bg-gray-800'
                        }`}>
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span className="leading-tight">{proc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Datas de Agendamento, Realização e Validade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <Label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-400" />
                    Data e Hora Agendada <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="mt-1 bg-seguranca-black border-gray-700 text-white focus:border-blue-400"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    Data da Realização (se já feito)
                  </Label>
                  <Input
                    type="date"
                    value={examDate}
                    onChange={(e) => {
                      setExamDate(e.target.value);
                      if (e.target.value && status === 'PENDENTE') {
                        setStatus('REALIZADO');
                      }
                    }}
                    className="mt-1 bg-seguranca-black border-gray-700 text-white focus:border-green-400"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-yellow-400" />
                    Validade do ASO (Vencimento)
                  </Label>
                  <Input
                    type="date"
                    value={nextExamDate}
                    onChange={(e) => setNextExamDate(e.target.value)}
                    className="mt-1 bg-seguranca-black border-gray-700 text-white focus:border-yellow-400"
                  />
                  <span className="text-[10px] text-gray-400 block mt-1">
                    Calculado automaticamente a partir da periodicidade
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Clínica Credenciada (Integração com Fornecedores) */}
          <Card className="bg-gradient-to-br from-seguranca-graphite to-gray-800 border-gray-700 shadow-md">
            <CardHeader className="py-3 px-4 border-b border-gray-700 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-400" />
                3. Clínica Credenciada / Fornecedor Parceiro
              </CardTitle>
              <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-300 bg-blue-500/10">
                Guia de Encaminhamento
              </Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Label className="text-xs font-medium text-gray-300">
                  Selecionar Clínica cadastrada nos Fornecedores ou digitar nome
                </Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Pesquise por nome da clínica, razão social ou CNPJ..."
                    value={clinicSearchTerm}
                    onChange={(e) => {
                      setClinicSearchTerm(e.target.value);
                      setClinicName(e.target.value);
                      setShowClinicDropdown(true);
                    }}
                    onFocus={() => setShowClinicDropdown(true)}
                    className="pl-9 bg-seguranca-black border-gray-700 text-white focus:border-blue-400"
                  />
                  {loadingSuppliers && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>

                {/* Dropdown de Clínicas/Fornecedores */}
                {showClinicDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-2xl max-h-56 overflow-auto">
                    {filteredSuppliers.length > 0 ? (
                      filteredSuppliers.map((sup) => (
                        <div
                          key={sup.id}
                          onClick={() => handleSelectSupplierClinic(sup)}
                          className="p-2.5 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-0 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white text-sm">
                              {sup.tradeName || sup.name}
                            </span>
                            {sup.category && (
                              <Badge className="text-[10px] bg-blue-900/60 text-blue-200 border-0">
                                {sup.category}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 flex flex-wrap gap-3 mt-1">
                            {sup.cnpj && <span>CNPJ: {sup.cnpj}</span>}
                            {sup.phone && <span>Tel: {sup.phone}</span>}
                            {sup.city && <span>{sup.city}/{sup.state}</span>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-gray-400 text-center">
                        Nenhum fornecedor encontrado com esse termo. Você pode continuar digitando o nome livremente.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Detalhes da Clínica para emissão da Guia */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-900/60 rounded-lg border border-gray-800 text-xs">
                <div>
                  <Label className="text-[11px] text-gray-400">CNPJ do Prestador</Label>
                  <Input
                    value={clinicCnpj}
                    onChange={(e) => setClinicCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="mt-1 h-8 bg-seguranca-black border-gray-700 text-white text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-gray-400">Telefone / Agendamento</Label>
                  <Input
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    placeholder="(00) 0000-0000"
                    className="mt-1 h-8 bg-seguranca-black border-gray-700 text-white text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-gray-400">Endereço de Atendimento</Label>
                  <Input
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    placeholder="Rua, número, bairro e cidade..."
                    className="mt-1 h-8 bg-seguranca-black border-gray-700 text-white text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Médico & Parecer / Status */}
          <Card className="bg-gradient-to-br from-seguranca-graphite to-gray-800 border-gray-700 shadow-md">
            <CardHeader className="py-3 px-4 border-b border-gray-700">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-400" />
                4. Médico Examinador & Status do ASO
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Médico */}
                <div className="relative">
                  <Label className="text-xs font-medium text-gray-300">
                    Médico Examinador / Coordenador
                  </Label>
                  <Input
                    placeholder="Nome do médico..."
                    value={doctorSearchTerm || doctorName}
                    onChange={(e) => {
                      setDoctorSearchTerm(e.target.value);
                      setDoctorName(e.target.value);
                      setShowDoctorDropdown(true);
                    }}
                    onFocus={() => setShowDoctorDropdown(true)}
                    className="mt-1 bg-seguranca-black border-gray-700 text-white"
                  />
                  {showDoctorDropdown && doctors.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-2xl max-h-48 overflow-auto">
                      {doctors.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => handleSelectDoctor(doc)}
                          className="p-2 hover:bg-gray-800 cursor-pointer text-xs border-b border-gray-800 last:border-0"
                        >
                          <span className="font-semibold text-white">{doc.name}</span>
                          <span className="text-gray-400 ml-2">CRM: {doc.crmNumber}/{doc.crmState}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CRM */}
                <div>
                  <Label className="text-xs font-medium text-gray-300">
                    CRM do Médico
                  </Label>
                  <Input
                    placeholder="Ex: 12345/SP"
                    value={doctorCrm}
                    onChange={(e) => setDoctorCrm(e.target.value)}
                    className="mt-1 bg-seguranca-black border-gray-700 text-white"
                  />
                </div>
              </div>

              {/* Status e Parecer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <Label className="text-xs font-medium text-gray-300">
                    Status Atual
                  </Label>
                  <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                    <SelectTrigger className="mt-1 bg-seguranca-black border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-700 text-white">
                      <SelectItem value="PENDENTE">Pendente / Agendado</SelectItem>
                      <SelectItem value="REALIZADO">Realizado</SelectItem>
                      <SelectItem value="ATRASADO">Atrasado</SelectItem>
                      <SelectItem value="CANCELADO">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-300">
                    Parecer Ocupacional
                  </Label>
                  <Select 
                    value={result || 'none'} 
                    onValueChange={(val) => setResult(val === 'none' ? '' : (val as any))}
                  >
                    <SelectTrigger className="mt-1 bg-seguranca-black border-gray-700 text-white">
                      <SelectValue placeholder="Selecione o parecer..." />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-700 text-white">
                      <SelectItem value="none">Pendente de Avaliação</SelectItem>
                      <SelectItem value="APTO">Apto</SelectItem>
                      <SelectItem value="INAPTO">Inapto</SelectItem>
                      <SelectItem value="APTO_COM_RESTRICOES">Apto com Restrições</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {result === 'APTO_COM_RESTRICOES' && (
                <div>
                  <Label className="text-xs font-medium text-yellow-400">
                    Detalhes das Restrições
                  </Label>
                  <Input
                    placeholder="Ex: Não trabalhar em altura, restrição de peso..."
                    value={restrictions}
                    onChange={(e) => setRestrictions(e.target.value)}
                    className="mt-1 bg-seguranca-black border-yellow-500/50 text-white"
                  />
                </div>
              )}

              {/* Observações / Orientações de Preparo */}
              <div>
                <Label className="text-xs font-medium text-gray-300">
                  Instruções de Preparo / Observações para a Guia
                </Label>
                <Textarea
                  placeholder="Ex: Jejum obrigatório de 10h, repouso auditivo prévio de 14h, comparecer com documento com foto..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 bg-seguranca-black border-gray-700 text-white placeholder:text-gray-500 min-h-[70px] text-xs"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Footer de Ações */}
          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isGeneratingPdf}
              className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              {/* Botão de emissão de Guia de Encaminhamento */}
              <Button
                type="button"
                onClick={handleSaveAndGeneratePDF}
                disabled={isSubmitting || isGeneratingPdf || !clinicName}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2 shadow-lg"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando Guia PDF...
                  </>
                ) : (
                  <>
                    <Printer className="h-4 w-4" />
                    Salvar e Emitir Guia ({selectedProcedures.length} Exames)
                  </>
                )}
              </Button>

              {/* Botão Salvar normal */}
              <Button
                type="submit"
                disabled={isSubmitting || isGeneratingPdf}
                className="w-full sm:w-auto bg-gradient-to-r from-seguranca-red to-red-600 hover:from-seguranca-red/90 hover:to-red-600/90 text-white font-semibold shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  exam ? 'Atualizar Exame' : 'Agendar / Salvar Exame'
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
