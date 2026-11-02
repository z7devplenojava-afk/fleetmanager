import React, { useState, useEffect, useMemo } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Stethoscope, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Edit, 
  FileText, 
  Printer, 
  Clock, 
  Building2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sstService, MedicalExam, CreateMedicalExamDTO } from '@/services/sstService';
import { companyService } from '@/services/companyService';
import { employeeService } from '@/services/employeeService';
import { useToast } from '@/hooks/use-toast';
import MedicalExamFormModal from '@/components/sst/MedicalExamFormModal';
import { medicalExamPDFGenerator } from '@/utils/medicalExamPdfGenerator';

export default function ExamesMedicos() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados de dados
  const [exams, setExams] = useState<MedicalExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [clinicFilter, setClinicFilter] = useState<string>('all');
  
  // Modal de Criação / Edição
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<MedicalExam | null>(null);

  // Modal de Conclusão / Baixa Rápida de Exame
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [examToComplete, setExamToComplete] = useState<MedicalExam | null>(null);
  const [completeExamDate, setCompleteExamDate] = useState(new Date().toISOString().slice(0, 10));
  const [completeResult, setCompleteResult] = useState<'APTO' | 'INAPTO' | 'APTO_COM_RESTRICOES'>('APTO');
  const [completeRestrictions, setCompleteRestrictions] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  // Estado de geração de PDF
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sstService.getMedicalExams();
      setExams(data || []);
    } catch (err) {
      console.error('Erro ao carregar exames médicos:', err);
      setError('Erro ao carregar exames médicos');
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os exames médicos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Cálculo de Validade e Dias Restantes
  const getValidityInfo = (exam: MedicalExam) => {
    const rawExpDate = exam.nextExamDate || exam.expirationDate;
    if (!rawExpDate) {
      if (exam.status === 'PENDENTE') {
        return { status: 'AGENDADO', label: 'Aguardando Realização', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      }
      return { status: 'SEM_VALIDADE', label: 'Sem Validade Cadastrada', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expDate = new Date(rawExpDate);
      expDate.setHours(0, 0, 0, 0);

      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return {
          status: 'VENCIDO',
          days: Math.abs(diffDays),
          label: `Vencido há ${Math.abs(diffDays)} dia${Math.abs(diffDays) === 1 ? '' : 's'}`,
          color: 'bg-red-500/20 text-red-400 border-red-500/30',
          dateFormatted: expDate.toLocaleDateString('pt-BR'),
        };
      } else if (diffDays <= 30) {
        return {
          status: 'A_VENCER',
          days: diffDays,
          label: diffDays === 0 ? 'Vence Hoje' : `Vence em ${diffDays} dia${diffDays === 1 ? '' : 's'}`,
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          dateFormatted: expDate.toLocaleDateString('pt-BR'),
        };
      } else {
        return {
          status: 'VALIDO',
          days: diffDays,
          label: `Válido até ${expDate.toLocaleDateString('pt-BR')}`,
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          dateFormatted: expDate.toLocaleDateString('pt-BR'),
        };
      }
    } catch {
      return { status: 'DESCONHECIDO', label: 'Data Inválida', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    let total = exams.length;
    let vencidos = 0;
    let aVencer30 = 0;
    let validos = 0;
    let agendados = 0;

    exams.forEach(exam => {
      if (exam.status === 'PENDENTE') {
        agendados++;
      } else if (exam.status === 'ATRASADO') {
        vencidos++;
      } else {
        const val = getValidityInfo(exam);
        if (val.status === 'VENCIDO') vencidos++;
        else if (val.status === 'A_VENCER') aVencer30++;
        else if (val.status === 'VALIDO') validos++;
      }
    });

    return { total, vencidos, aVencer30, validos, agendados };
  }, [exams]);

  // Lista única de Clínicas para o filtro
  const distinctClinics = useMemo(() => {
    const list = exams.map(e => e.clinicName).filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [exams]);

  // Filtragem
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      // Busca texto
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        !term ||
        exam.employeeName?.toLowerCase().includes(term) ||
        exam.examType?.toLowerCase().includes(term) ||
        exam.clinicName?.toLowerCase().includes(term) ||
        exam.doctorName?.toLowerCase().includes(term) ||
        exam.employeeRegistrationNumber?.toLowerCase().includes(term);

      // Categoria
      const matchesCategory = categoryFilter === 'all' || exam.examCategory === categoryFilter;

      // Status
      const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;

      // Clínica
      const matchesClinic = clinicFilter === 'all' || exam.clinicName === clinicFilter;

      // Aba rápida
      const valInfo = getValidityInfo(exam);
      let matchesTab = true;
      if (activeTab === 'expiring') {
        matchesTab = valInfo.status === 'A_VENCER';
      } else if (activeTab === 'expired') {
        matchesTab = valInfo.status === 'VENCIDO' || exam.status === 'ATRASADO';
      } else if (activeTab === 'scheduled') {
        matchesTab = exam.status === 'PENDENTE';
      } else if (activeTab === 'completed') {
        matchesTab = exam.status === 'REALIZADO';
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesClinic && matchesTab;
    });
  }, [exams, searchTerm, categoryFilter, statusFilter, clinicFilter, activeTab]);

  // Submissão do Modal Form (Criação ou Edição)
  const handleSubmitExam = async (data: CreateMedicalExamDTO) => {
    try {
      let saved: MedicalExam;
      if (selectedExam) {
        saved = await sstService.updateMedicalExam(selectedExam.id, data);
        toast({
          title: 'Sucesso',
          description: 'Exame ocupacional atualizado com sucesso.',
        });
      } else {
        saved = await sstService.createMedicalExam(data);
        toast({
          title: 'Sucesso',
          description: 'Exame ocupacional agendado com sucesso.',
        });
      }
      
      setShowFormModal(false);
      setSelectedExam(null);
      await loadExams();
      return saved;
    } catch (err) {
      console.error('Erro ao salvar exame médico:', err);
      toast({
        title: 'Erro',
        description: selectedExam ? 'Não foi possível atualizar o exame' : 'Não foi possível agendar o exame',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Excluir Exame
  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm('Tem certeza de que deseja excluir este registro de exame?')) {
      return;
    }
    try {
      await sstService.deleteMedicalExam(examId);
      toast({
        title: 'Excluído',
        description: 'Exame removido com sucesso.',
      });
      loadExams();
    } catch (err) {
      console.error('Erro ao excluir exame:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o exame',
        variant: 'destructive',
      });
    }
  };

  // Abrir Modal de Baixa Rápida
  const handleOpenCompleteModal = (exam: MedicalExam) => {
    setExamToComplete(exam);
    setCompleteExamDate(new Date().toISOString().slice(0, 10));
    setCompleteResult('APTO');
    setCompleteRestrictions('');
    setShowCompleteModal(true);
  };

  // Confirmar Baixa / Realização
  const handleConfirmComplete = async () => {
    if (!examToComplete) return;

    setIsCompleting(true);
    try {
      // Calcular nova data de validade (1 ano à frente por padrão)
      const validMonths = examToComplete.validityMonths || 12;
      const performed = new Date(completeExamDate);
      performed.setMonth(performed.getMonth() + validMonths);
      const nextExp = performed.toISOString().split('T')[0];

      await sstService.updateMedicalExam(examToComplete.id, {
        status: 'REALIZADO',
        examDate: completeExamDate,
        nextExamDate: nextExp,
        result: completeResult,
        restrictions: completeResult === 'APTO_COM_RESTRICOES' ? completeRestrictions : undefined,
      });

      toast({
        title: 'Exame Concluído',
        description: `ASO registrado como REALIZADO. Validade calculada até ${new Date(nextExp).toLocaleDateString('pt-BR')}.`,
      });

      setShowCompleteModal(false);
      setExamToComplete(null);
      loadExams();
    } catch (err) {
      console.error('Erro ao concluir exame:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o exame para realizado.',
        variant: 'destructive',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  // Emitir Guia de Encaminhamento em PDF
  const handlePrintExamGuide = async (exam: MedicalExam) => {
    setGeneratingPdfId(exam.id);
    try {
      // Carregar dados da empresa e funcionário completos para sair detalhado
      const [company, empDetails] = await Promise.all([
        companyService.getMyCompany().catch(() => null),
        exam.employeeId ? employeeService.getEmployeeById(exam.employeeId).catch(() => null) : null,
      ]);

      await medicalExamPDFGenerator.generateAndOpenPDF({
        exam: {
          id: exam.id,
          employeeName: exam.employeeName,
          employeeCpf: empDetails?.cpf || empDetails?.document,
          employeeRegistrationNumber: empDetails?.registrationNumber || exam.employeeRegistrationNumber,
          employeeRole: empDetails?.positionDescription,
          examType: exam.examType,
          examCategory: exam.examCategory,
          scheduledDate: exam.scheduledDate,
          clinicName: exam.clinicName,
          doctorName: exam.doctorName,
          doctorCrm: exam.doctorCrm,
          notes: exam.notes,
          additionalExams: [exam.examType],
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
        title: 'Guia de Encaminhamento Aberta',
        description: 'O documento foi gerado para impressão/entrega ao colaborador.',
      });
    } catch (err) {
      console.error('Erro ao gerar guia PDF:', err);
      toast({
        title: 'Erro na Impressão',
        description: 'Não foi possível gerar a guia em PDF.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingPdfId(null);
    }
  };

  // Helper de badges visuais
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REALIZADO':
        return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Realizado</Badge>;
      case 'PENDENTE':
        return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">Agendado</Badge>;
      case 'ATRASADO':
        return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">Atrasado</Badge>;
      case 'CANCELADO':
        return <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30">Cancelado</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">{status}</Badge>;
    }
  };

  const getResultBadge = (result?: string) => {
    switch (result) {
      case 'APTO':
        return <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Apto</Badge>;
      case 'INAPTO':
        return <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/30">Inapto</Badge>;
      case 'APTO_COM_RESTRICOES':
        return <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30">Apto c/ Restrições</Badge>;
      default:
        return null;
    }
  };

  const getCategoryBadge = (category: string) => {
    const map: Record<string, { label: string; color: string }> = {
      ADMISSIONAL: { label: 'Admissional', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
      PERIODICO: { label: 'Periódico', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
      RETORNO: { label: 'Retorno', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
      MUDANCA_FUNCAO: { label: 'Mudança de Função', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
      DEMISSIONAL: { label: 'Demissional', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
      RECICLAGEM: { label: 'Reciclagem', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
      RENOVACAO_CNH: { label: 'Renovação CNH', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
      AVALIACAO_PSICOSSOCIAL: { label: 'Psicossocial', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
      MONITORAMENTO: { label: 'Monitoramento', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
      TOXICOLOGICO_SORTEIO: { label: 'Toxicológico (Sorteio)', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
      REABILITACAO: { label: 'Reabilitação', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
    };
    const c = map[category] || { label: category, color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };
    return <Badge className={`border ${c.color}`}>{c.label}</Badge>;
  };

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Header Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-seguranca-red/20 rounded-xl border border-seguranca-red/40">
                <Stethoscope className="h-7 w-7 text-seguranca-red" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
                  Gestão de Atestados de Saúde Ocupacional (ASO)
                </h1>
                <p className="text-gray-400 text-sm">
                  Controle de validades, exames ocupacionais periódicos, agendamentos em clínicas e emissão de guias
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/rh/sst')}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite"
            >
              Voltar ao SST
            </Button>
            <Button 
              onClick={() => {
                setSelectedExam(null);
                setShowFormModal(true);
              }}
              className="bg-gradient-to-r from-seguranca-red to-red-600 hover:from-seguranca-red/90 hover:to-red-600/90 text-white font-semibold shadow-lg flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Exame / Agendamento
            </Button>
          </div>
        </div>

        {/* Painel de Indicadores (KPIs de Validade e Agendamento) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {/* Card: Total */}
          <Card 
            onClick={() => setActiveTab('all')}
            className={`bg-seguranca-graphite border-gray-700 cursor-pointer transition-all hover:border-gray-500 ${activeTab === 'all' ? 'ring-2 ring-blue-500' : ''}`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase">Total Geral</p>
                <h3 className="text-2xl font-bold text-white mt-1">{kpis.total}</h3>
              </div>
              <div className="p-2.5 bg-gray-700/50 rounded-xl">
                <FileText className="h-5 w-5 text-gray-300" />
              </div>
            </CardContent>
          </Card>

          {/* Card: Vencidos */}
          <Card 
            onClick={() => setActiveTab('expired')}
            className={`bg-seguranca-graphite border-red-500/40 cursor-pointer transition-all hover:border-red-500 ${activeTab === 'expired' ? 'ring-2 ring-red-500' : ''}`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-400 uppercase">ASO Vencido</p>
                <h3 className="text-2xl font-bold text-red-400 mt-1">{kpis.vencidos}</h3>
              </div>
              <div className="p-2.5 bg-red-500/20 rounded-xl">
                <ShieldAlert className="h-5 w-5 text-red-400" />
              </div>
            </CardContent>
          </Card>

          {/* Card: A Vencer em 30 Dias */}
          <Card 
            onClick={() => setActiveTab('expiring')}
            className={`bg-seguranca-graphite border-yellow-500/40 cursor-pointer transition-all hover:border-yellow-500 ${activeTab === 'expiring' ? 'ring-2 ring-yellow-500' : ''}`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-yellow-400 uppercase">Vence em 30 Dias</p>
                <h3 className="text-2xl font-bold text-yellow-400 mt-1">{kpis.aVencer30}</h3>
              </div>
              <div className="p-2.5 bg-yellow-500/20 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          {/* Card: Válidos / Em Dia */}
          <Card 
            onClick={() => setActiveTab('completed')}
            className={`bg-seguranca-graphite border-green-500/40 cursor-pointer transition-all hover:border-green-500 ${activeTab === 'completed' ? 'ring-2 ring-green-500' : ''}`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-400 uppercase">ASO Válido / Em Dia</p>
                <h3 className="text-2xl font-bold text-green-400 mt-1">{kpis.validos}</h3>
              </div>
              <div className="p-2.5 bg-green-500/20 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
            </CardContent>
          </Card>

          {/* Card: Agendados */}
          <Card 
            onClick={() => setActiveTab('scheduled')}
            className={`bg-seguranca-graphite border-blue-500/40 cursor-pointer transition-all hover:border-blue-500 ${activeTab === 'scheduled' ? 'ring-2 ring-blue-500' : ''}`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-400 uppercase">Agendados</p>
                <h3 className="text-2xl font-bold text-blue-400 mt-1">{kpis.agendados}</h3>
              </div>
              <div className="p-2.5 bg-blue-500/20 rounded-xl">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abas Rápidas e Barra de Filtros */}
        <Card className="bg-seguranca-graphite border-gray-700">
          <CardHeader className="pb-3 border-b border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                <TabsList className="bg-seguranca-black border border-gray-700 p-1">
                  <TabsTrigger value="all" className="data-[state=active]:bg-gray-800 text-xs">
                    Todos ({kpis.total})
                  </TabsTrigger>
                  <TabsTrigger value="expiring" className="data-[state=active]:bg-yellow-950/60 data-[state=active]:text-yellow-400 text-xs font-medium">
                    Próximos a Vencer ({kpis.aVencer30})
                  </TabsTrigger>
                  <TabsTrigger value="expired" className="data-[state=active]:bg-red-950/60 data-[state=active]:text-red-400 text-xs font-medium">
                    Vencidos ({kpis.vencidos})
                  </TabsTrigger>
                  <TabsTrigger value="scheduled" className="data-[state=active]:bg-blue-950/60 data-[state=active]:text-blue-400 text-xs">
                    Agendados ({kpis.agendados})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="data-[state=active]:bg-green-950/60 data-[state=active]:text-green-400 text-xs">
                    Realizados
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Campo de Busca Geral */}
              <div>
                <Label className="text-xs text-gray-400">Buscar por Funcionário / Matrícula</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Nome, CPF ou exame..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 bg-seguranca-black border-gray-700 text-white text-xs h-9"
                  />
                </div>
              </div>

              {/* Filtro por Categoria */}
              <div>
                <Label className="text-xs text-gray-400">Finalidade (ASO)</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="mt-1 bg-seguranca-black border-gray-700 text-white text-xs h-9">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-700 text-white text-xs">
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="ADMISSIONAL">Admissional</SelectItem>
                    <SelectItem value="PERIODICO">Periódico</SelectItem>
                    <SelectItem value="RETORNO">Retorno ao Trabalho</SelectItem>
                    <SelectItem value="MUDANCA_FUNCAO">Mudança de Função</SelectItem>
                    <SelectItem value="DEMISSIONAL">Demissional</SelectItem>
                    <SelectItem value="RECICLAGEM">Reciclagem Operacional</SelectItem>
                    <SelectItem value="RENOVACAO_CNH">Renovação CNH / Motorista</SelectItem>
                    <SelectItem value="AVALIACAO_PSICOSSOCIAL">Avaliação Psicossocial</SelectItem>
                    <SelectItem value="MONITORAMENTO">Monitoramento de Saúde</SelectItem>
                    <SelectItem value="TOXICOLOGICO_SORTEIO">Toxicológico (Sorteio)</SelectItem>
                    <SelectItem value="REABILITACAO">Reabilitação (INSS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Status */}
              <div>
                <Label className="text-xs text-gray-400">Status do Registro</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="mt-1 bg-seguranca-black border-gray-700 text-white text-xs h-9">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-700 text-white text-xs">
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="PENDENTE">Agendado / Pendente</SelectItem>
                    <SelectItem value="REALIZADO">Realizado</SelectItem>
                    <SelectItem value="ATRASADO">Atrasado</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Clínica Credenciada */}
              <div>
                <Label className="text-xs text-gray-400">Clínica Credenciada</Label>
                <Select value={clinicFilter} onValueChange={setClinicFilter}>
                  <SelectTrigger className="mt-1 bg-seguranca-black border-gray-700 text-white text-xs h-9">
                    <SelectValue placeholder="Todas as clínicas" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-700 text-white text-xs">
                    <SelectItem value="all">Todas as Clínicas</SelectItem>
                    {distinctClinics.map((c, i) => (
                      <SelectItem key={i} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela / Lista de Exames Médicos */}
        <Card className="bg-seguranca-graphite border-gray-700 overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-gray-700 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-seguranca-red" />
              Exames Ocupacionais ({filteredExams.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-400 space-y-3">
                <Stethoscope className="h-8 w-8 animate-pulse text-seguranca-red" />
                <p className="text-sm">Carregando histórico e validades de exames...</p>
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 space-y-3">
                <FileText className="h-10 w-10 text-gray-600" />
                <div>
                  <p className="text-sm font-semibold text-white">Nenhum exame ocupacional encontrado</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || clinicFilter !== 'all' || activeTab !== 'all'
                      ? 'Nenhum resultado corresponde aos filtros aplicados.'
                      : 'Clique no botão acima para agendar o primeiro exame ocupacional.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {filteredExams.map((exam) => {
                  const validity = getValidityInfo(exam);
                  const isGeneratingThisPdf = generatingPdfId === exam.id;

                  return (
                    <div 
                      key={exam.id} 
                      className="p-4 hover:bg-gray-800/50 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      {/* Dados do Colaborador e Exame */}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-sm sm:text-base">
                            {exam.employeeName}
                          </span>
                          {exam.employeeRegistrationNumber && (
                            <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-700">
                              Matrícula: {exam.employeeRegistrationNumber}
                            </Badge>
                          )}
                          {getCategoryBadge(exam.examCategory)}
                          {getStatusBadge(exam.status)}
                          {getResultBadge(exam.result)}
                        </div>

                        {/* Detalhes do Exame e Agendamento */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <Stethoscope className="h-3.5 w-3.5 text-seguranca-yellow" />
                            <span className="truncate">{exam.examType}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-blue-400" />
                            <span className="truncate" title={exam.clinicName}>
                              {exam.clinicName || 'Clínica não definida'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-green-400" />
                            <span>
                              Agendado: {exam.scheduledDate ? new Date(exam.scheduledDate).toLocaleDateString('pt-BR') : 'A definir'}
                            </span>
                          </div>

                          {exam.doctorName && (
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-purple-400" />
                              <span className="truncate">{exam.doctorName} {exam.doctorCrm ? `(${exam.doctorCrm})` : ''}</span>
                            </div>
                          )}
                        </div>

                        {/* Alerta de Validade do ASO */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-xs font-semibold text-gray-300">Validade do ASO:</span>
                          <Badge className={`text-xs font-medium border ${validity.color} px-2.5 py-0.5`}>
                            {validity.label}
                          </Badge>
                          {exam.examDate && (
                            <span className="text-xs text-gray-500">
                              (Realizado em: {new Date(exam.examDate).toLocaleDateString('pt-BR')})
                            </span>
                          )}
                          {exam.restrictions && (
                            <span className="text-xs text-yellow-400 italic">
                              Restrições: {exam.restrictions}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 md:pt-0">
                        {/* Botão de Emissão de Guia de Encaminhamento PDF */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintExamGuide(exam)}
                          disabled={isGeneratingThisPdf}
                          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 text-xs flex items-center gap-1.5"
                          title="Emitir Guia de Encaminhamento Ocupacional para entrega à clínica"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          {isGeneratingThisPdf ? 'Gerando...' : 'Guia (PDF)'}
                        </Button>

                        {/* Botão de Conclusão / Dar Baixa Rápida se estiver pendente */}
                        {exam.status === 'PENDENTE' && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenCompleteModal(exam)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs flex items-center gap-1"
                            title="Registrar que o exame foi realizado e atualizar a validade"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Dar Baixa
                          </Button>
                        )}

                        {/* Editar */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedExam(exam);
                            setShowFormModal(true);
                          }}
                          className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs flex items-center gap-1"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Editar
                        </Button>

                        {/* Excluir */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteExam(exam.id)}
                          className="border-red-900/50 text-red-400 hover:bg-red-950/50 text-xs p-2"
                          title="Excluir exame"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Formulário Completo (Novo / Editar) */}
        <MedicalExamFormModal
          open={showFormModal}
          onOpenChange={(open) => {
            setShowFormModal(open);
            if (!open) setSelectedExam(null);
          }}
          exam={selectedExam}
          onSubmit={handleSubmitExam}
        />

        {/* Modal Rápido de Baixa / Realização do ASO */}
        <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
          <DialogContent className="max-w-md bg-seguranca-graphite border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                Registrar Realização do Exame (ASO)
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs">
                Informe o parecer e a data de realização para calcular a nova validade.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-3 bg-seguranca-black rounded-lg border border-gray-800 text-xs space-y-1">
                <div><strong className="text-gray-400">Colaborador:</strong> {examToComplete?.employeeName}</div>
                <div><strong className="text-gray-400">Exame:</strong> {examToComplete?.examType} ({examToComplete?.examCategory})</div>
                <div><strong className="text-gray-400">Clínica:</strong> {examToComplete?.clinicName || 'Não informada'}</div>
              </div>

              <div>
                <Label className="text-xs text-gray-300">Data de Realização do Exame</Label>
                <Input
                  type="date"
                  value={completeExamDate}
                  onChange={(e) => setCompleteExamDate(e.target.value)}
                  className="mt-1 bg-seguranca-black border-gray-700 text-white text-xs"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-300">Parecer Ocupacional do Médico</Label>
                <Select value={completeResult} onValueChange={(val: any) => setCompleteResult(val)}>
                  <SelectTrigger className="mt-1 bg-seguranca-black border-gray-700 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-700 text-white text-xs">
                    <SelectItem value="APTO">Apto</SelectItem>
                    <SelectItem value="INAPTO">Inapto</SelectItem>
                    <SelectItem value="APTO_COM_RESTRICOES">Apto com Restrições</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {completeResult === 'APTO_COM_RESTRICOES' && (
                <div>
                  <Label className="text-xs text-yellow-400">Descrição das Restrições</Label>
                  <Input
                    placeholder="Ex: Não trabalhar em altura, evitar poeira..."
                    value={completeRestrictions}
                    onChange={(e) => setCompleteRestrictions(e.target.value)}
                    className="mt-1 bg-seguranca-black border-yellow-500/50 text-white text-xs"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCompleteModal(false)}
                className="border-gray-700 text-gray-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmComplete}
                disabled={isCompleting}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                {isCompleting ? 'Salvando...' : 'Confirmar Realização'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </StandardLayout>
  );
}
