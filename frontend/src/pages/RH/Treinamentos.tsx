import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CertificateManagementTab from '@/components/treinamentos/CertificateManagementTab';
import { useToast } from '@/components/ui/use-toast';
import { trainingService, Training, EmployeeCertification } from '@/services/trainingService';
import { employeeService, SimpleEmployee } from '@/services/employeeService';
import {
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  Users,
  Plus,
  Link as LinkIcon,
  Calendar,
  Edit,
  Trash2,
  Award,
} from 'lucide-react';

type CertificationFilter = 'all' | 'dueSoon' | 'expired' | 'compliant';

const DAYS_DUE_SOON = 30;

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

const normalizeDate = (value: string) => {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const calculateDaysUntil = (value?: string | null): number | null => {
  if (!value) return null;
  const target = normalizeDate(value);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = target.getTime() - startOfToday.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

const addMonthsToDate = (value: string, months: number): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const originalDay = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() < originalDay) {
    date.setDate(0);
  }
  return date.toISOString().split('T')[0];
};

const todayIso = new Date().toISOString().split('T')[0];

interface TrainingStats {
  total: number;
  expired: number;
  dueSoon: number;
  compliant: number;
}

const Treinamentos: React.FC = () => {
  const { toast } = useToast();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [certifications, setCertifications] = useState<EmployeeCertification[]>([]);
  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<CertificationFilter>('dueSoon');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTrainingModalOpen, setTrainingModalOpen] = useState(false);
  const [isAssignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [isSavingTraining, setIsSavingTraining] = useState(false);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [renewingCertificationId, setRenewingCertificationId] = useState<string | null>(null);
  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [trainingToDelete, setTrainingToDelete] = useState<Training | null>(null);
  const [isDeletingTraining, setIsDeletingTraining] = useState(false);

  const [trainingForm, setTrainingForm] = useState({
    name: '',
    description: '',
    provider: '',
    duration: 8,
    renewalPeriodMonths: 12,
    mandatoryForGuards: true,
  });

  const [assignmentForm, setAssignmentForm] = useState({
    employeeId: '',
    trainingId: '',
    certificationNumber: '',
    issueDate: todayIso,
    expirationDate: '',
    documentUrl: '',
  });

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trainingData, certificationData, employeeData] = await Promise.all([
        trainingService.getTrainings(),
        trainingService.getEmployeeCertifications(),
        employeeService.getSimpleEmployees(),
      ]);
      console.log('📋 Treinamentos - Dados carregados:', {
        trainings: trainingData.length,
        certifications: certificationData.length,
        employees: employeeData.length,
        certificationsData: certificationData
      });
      setTrainings(trainingData);
      setCertifications(certificationData);
      setEmployees(employeeData);
    } catch (error) {
      console.error('Erro ao carregar dados de treinamentos', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as informações de treinamentos. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrainingRenewalPeriod = (trainingId: string): number => {
    if (!trainingId) return 12;
    const training = trainings.find((item) => item.id === trainingId);
    return training?.renewalPeriodMonths ?? 12;
  };

  const trainingStats = useMemo(() => {
    const stats = new Map<string, TrainingStats>();
    for (const training of trainings) {
      stats.set(training.id, { total: 0, expired: 0, dueSoon: 0, compliant: 0 });
    }

    certifications.forEach((cert) => {
      if (!cert.trainingId) return;
      const entry = stats.get(cert.trainingId);
      if (!entry) return;

      entry.total += 1;
      const days = calculateDaysUntil(cert.expirationDate);
      if (cert.status === 'CANCELLED') {
        return;
      }
      if (days !== null && days < 0) {
        entry.expired += 1;
      } else if (days !== null && days <= DAYS_DUE_SOON) {
        entry.dueSoon += 1;
      } else {
        entry.compliant += 1;
      }
    });

    return stats;
  }, [certifications, trainings]);

  const summary = useMemo(() => {
    let dueSoon = 0;
    let expired = 0;
    let compliant = 0;
    certifications.forEach((cert) => {
      if (cert.status === 'CANCELLED') return;
      const days = calculateDaysUntil(cert.expirationDate);
      if (days !== null && days < 0) {
        expired += 1;
      } else if (days !== null && days <= DAYS_DUE_SOON) {
        dueSoon += 1;
      } else {
        compliant += 1;
      }
    });
    return {
      totalMandatory: trainings.filter((training) => training.mandatoryForGuards !== false).length,
      dueSoon,
      expired,
      compliant,
    };
  }, [certifications, trainings]);

  const filteredCertifications = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase().trim();
    return certifications
      .filter((cert) => {
        const matchesSearch =
          !lowerTerm ||
          cert.employeeName?.toLowerCase().includes(lowerTerm) ||
          cert.trainingName?.toLowerCase().includes(lowerTerm) ||
          cert.employeeDocument?.replace(/\D/g, '').includes(lowerTerm.replace(/\D/g, ''));

        if (!matchesSearch) return false;

        if (cert.status === 'CANCELLED') {
          return filterStatus === 'all';
        }

        const days = calculateDaysUntil(cert.expirationDate);
        if (filterStatus === 'expired') {
          return days !== null && days < 0;
        }
        if (filterStatus === 'dueSoon') {
          return days !== null && days >= 0 && days <= DAYS_DUE_SOON;
        }
        if (filterStatus === 'compliant') {
          return days === null || days > DAYS_DUE_SOON;
        }
        return true;
      })
      .sort((a, b) => {
        const aDate = a.expirationDate || a.issueDate || '';
        const bDate = b.expirationDate || b.issueDate || '';
        return aDate.localeCompare(bDate);
      });
  }, [certifications, filterStatus, searchTerm]);

  const openAssignmentModal = (trainingId?: string) => {
    const targetTraining = trainingId ?? '';
    const expiration = targetTraining ? addMonthsToDate(todayIso, getTrainingRenewalPeriod(targetTraining)) : '';
    const trainingName = trainings.find((item) => item.id === targetTraining)?.name ?? '';
    const defaultCertification = trainingName
      ? `${trainingName.slice(0, 12).replace(/\s+/g, '').toUpperCase()}-${new Date().getFullYear()}`
      : '';

    setAssignmentForm({
      employeeId: '',
      trainingId: targetTraining,
      certificationNumber: defaultCertification,
      issueDate: todayIso,
      expirationDate: expiration,
      documentUrl: '',
    });
    setAssignmentModalOpen(true);
  };

  const openEditTrainingModal = (training: Training) => {
    setEditingTrainingId(training.id);
    setTrainingForm({
      name: training.name,
      description: training.description || '',
      provider: training.provider || '',
      duration: training.duration ?? 8,
      renewalPeriodMonths: training.renewalPeriodMonths ?? 12,
      mandatoryForGuards: training.mandatoryForGuards !== false,
    });
    setTrainingModalOpen(true);
  };

  const openNewTrainingModal = () => {
    setEditingTrainingId(null);
    setTrainingForm({
      name: '',
      description: '',
      provider: '',
      duration: 8,
      renewalPeriodMonths: 12,
      mandatoryForGuards: true,
    });
    setTrainingModalOpen(true);
  };

  const openDeleteDialog = (training: Training) => {
    setTrainingToDelete(training);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateTraining = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingTraining(true);
    try {
      if (editingTrainingId) {
        // Modo de edição
        await trainingService.updateTraining(editingTrainingId, {
          name: trainingForm.name.trim(),
          description: trainingForm.description.trim(),
          provider: trainingForm.provider.trim(),
          duration: trainingForm.duration,
          renewalPeriodMonths: trainingForm.renewalPeriodMonths,
          mandatoryForGuards: trainingForm.mandatoryForGuards,
        });
        toast({
          title: 'Treinamento atualizado',
          description: 'As alterações foram salvas com sucesso.',
        });
        setEditingTrainingId(null);
      } else {
        // Modo de criação
        const newTraining = await trainingService.createTraining({
          name: trainingForm.name.trim(),
          description: trainingForm.description.trim(),
          provider: trainingForm.provider.trim(),
          duration: trainingForm.duration,
          renewalPeriodMonths: trainingForm.renewalPeriodMonths,
          mandatoryForGuards: trainingForm.mandatoryForGuards,
        });
        toast({
          title: 'Treinamento cadastrado',
          description: 'O treinamento foi registrado com sucesso.',
        });
        
        // Se estava vindo do modal de reciclagem, reabrir e selecionar o novo treinamento
        if (assignmentForm.trainingId === '') {
          setTrainingModalOpen(false);
          setTimeout(() => {
            setAssignmentModalOpen(true);
            if (newTraining?.id) {
              const expiration = addMonthsToDate(todayIso, trainingForm.renewalPeriodMonths);
              const defaultCertification = trainingForm.name
                ? `${trainingForm.name.slice(0, 12).replace(/\s+/g, '').toUpperCase()}-${new Date().getFullYear()}`
                : '';
              setAssignmentForm((prev) => ({
                ...prev,
                trainingId: newTraining.id,
                expirationDate: expiration,
                certificationNumber: defaultCertification,
              }));
            }
          }, 100);
          setTrainingForm({
            name: '',
            description: '',
            provider: '',
            duration: 8,
            renewalPeriodMonths: 12,
            mandatoryForGuards: true,
          });
          return;
        }
      }
      
      setTrainingForm({
        name: '',
        description: '',
        provider: '',
        duration: 8,
        renewalPeriodMonths: 12,
        mandatoryForGuards: true,
      });
      await loadData();
      setTrainingModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar treinamento', error);
      toast({
        title: 'Erro ao salvar',
        description: `Não foi possível ${editingTrainingId ? 'atualizar' : 'criar'} o treinamento. Verifique os dados e tente novamente.`,
        variant: 'destructive',
      });
    } finally {
      setIsSavingTraining(false);
    }
  };

  const handleDeleteTraining = async () => {
    if (!trainingToDelete) return;
    
    setIsDeletingTraining(true);
    try {
      await trainingService.deleteTraining(trainingToDelete.id);
      toast({
        title: 'Treinamento excluído',
        description: 'O treinamento foi removido com sucesso.',
      });
      setIsDeleteDialogOpen(false);
      setTrainingToDelete(null);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir treinamento', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o treinamento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingTraining(false);
    }
  };

  const handleAssignmentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assignmentForm.employeeId || !assignmentForm.trainingId || !assignmentForm.issueDate || !assignmentForm.expirationDate) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha todos os campos obrigatórios: colaborador, treinamento, data de realização e data de validade.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingAssignment(true);
    try {
      await trainingService.createEmployeeCertification({
        employeeId: assignmentForm.employeeId,
        trainingId: assignmentForm.trainingId,
        certificationNumber: assignmentForm.certificationNumber || 'N/A',
        issueDate: assignmentForm.issueDate,
        expirationDate: assignmentForm.expirationDate,
        documentUrl: assignmentForm.documentUrl || undefined,
      });
      toast({
        title: 'Treinamento registrado',
        description: 'A reciclagem foi vinculada ao colaborador.',
      });
      setAssignmentModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Erro ao registrar certificação', error);
      toast({
        title: 'Erro ao registrar',
        description: 'Não foi possível registrar a reciclagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const handleRenewCertification = async (cert: EmployeeCertification) => {
    const referenceDate = cert.expirationDate || cert.issueDate;
    if (!referenceDate) {
      toast({
        title: 'Data não encontrada',
        description: 'Não foi possível determinar a data base para renovação.',
        variant: 'destructive',
      });
      return;
    }
    const months = cert.renewalPeriodMonths ?? getTrainingRenewalPeriod(cert.trainingId);
    const newExpiration = addMonthsToDate(referenceDate, months);

    setRenewingCertificationId(cert.id);
    try {
      await trainingService.renewEmployeeCertification(cert.id, newExpiration);
      toast({
        title: 'Reciclagem renovada',
        description: `Nova validade: ${formatDate(newExpiration)}.`,
      });
      await loadData();
    } catch (error) {
      console.error('Erro ao renovar certificação', error);
      toast({
        title: 'Erro ao renovar',
        description: 'Não foi possível renovar a reciclagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setRenewingCertificationId(null);
    }
  };

  const renderStatusBadge = (cert: EmployeeCertification) => {
    if (cert.status === 'CANCELLED') {
      return <Badge variant="outline" className="border-gray-600 text-gray-400">Cancelada</Badge>;
    }
    const days = calculateDaysUntil(cert.expirationDate);
    if (days === null) {
      return <Badge className="bg-slate-600 text-white">Sem validade</Badge>;
    }
    if (days < 0) {
      return <Badge className="bg-red-500/20 text-red-400 border border-red-500/40">Expirada</Badge>;
    }
    if (days <= DAYS_DUE_SOON) {
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40">
          Expira em {days} dia{days === 1 ? '' : 's'}
        </Badge>
      );
    }
    return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">Em dia</Badge>;
  };

  if (loading) {
    return (
      <StandardLayout
        title="Treinamentos e Reciclagens"
        subtitle="Acompanhe os cursos obrigatórios e organize as reciclagens anuais dos vigilantes."
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-xl bg-seguranca-graphite/80" />
            ))}
          </div>
          <Skeleton className="h-[420px] rounded-xl bg-seguranca-graphite/80" />
          <Skeleton className="h-[420px] rounded-xl bg-seguranca-graphite/80" />
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout
      title="Treinamentos e Reciclagens"
      subtitle="Organize os cursos obrigatórios dos vigilantes e acompanhe as reciclagens anuais."
    >
      <Tabs defaultValue="treinamentos" className="w-full space-y-6">
        <TabsList className="bg-seguranca-black/50 border border-gray-600/30 h-auto p-1">
          <TabsTrigger
            value="treinamentos"
            className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white"
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            Treinamentos
          </TabsTrigger>
          <TabsTrigger
            value="certificados"
            className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white"
          >
            <Award className="h-4 w-4 mr-2" />
            Certificados
          </TabsTrigger>
        </TabsList>
        <TabsContent value="treinamentos" className="space-y-6">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Treinamentos obrigatórios</CardTitle>
              <GraduationCap className="h-5 w-5 text-seguranca-yellow" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-white">{summary.totalMandatory}</div>
              <p className="text-xs text-gray-400 mt-1">
                Cursos marcados como obrigatórios para vigilantes
              </p>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Reciclagens próximas (30 dias)</CardTitle>
              <CalendarClock className="h-5 w-5 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-white">{summary.dueSoon}</div>
              <p className="text-xs text-gray-400 mt-1">
                Colaboradores que precisam renovar treinamento em breve
              </p>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Treinamentos vencidos</CardTitle>
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-white">{summary.expired}</div>
              <p className="text-xs text-gray-400 mt-1">
                Reciclagens obrigatórias já vencidas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Colaboradores em dia</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-white">{summary.compliant}</div>
              <p className="text-xs text-gray-400 mt-1">
                Treinamentos com validade superior a 30 dias
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-seguranca-graphite border-gray-700">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl text-white">Mapa de treinamentos obrigatórios</CardTitle>
              <CardDescription className="text-gray-400 text-sm mt-1">
                Cadastre os cursos exigidos para vigilantes e acompanhe a quantidade de colaboradores cobertos.
              </CardDescription>
            </div>
            <Button 
              onClick={openNewTrainingModal} 
              className="gap-2 w-full sm:w-auto"
              size="sm"
            >
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Novo treinamento</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-6">
            <div className="min-w-full">
              {/* Mobile: Cards */}
              <div className="block sm:hidden space-y-4">
                {trainings.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                    <p>Nenhum treinamento cadastrado ainda.</p>
                  </div>
                ) : (
                  trainings.map((training) => {
                    const stats = trainingStats.get(training.id) ?? { total: 0, expired: 0, dueSoon: 0, compliant: 0 };
                    return (
                      <div key={training.id} className="bg-seguranca-black border border-gray-800 rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-base mb-1">{training.name}</h3>
                            {training.description && (
                              <p className="text-xs text-gray-400 mb-2">{training.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {training.provider && (
                                <span className="text-gray-400">Instrutor: {training.provider}</span>
                              )}
                              {training.mandatoryForGuards !== false && (
                                <Badge className="uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs">
                                  Obrigatório
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Carga horária</p>
                            <p className="text-sm font-medium text-gray-300">{training.duration ?? 0} h</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Renovação</p>
                            <p className="text-sm font-medium text-gray-300">{training.renewalPeriodMonths ?? 12} meses</p>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-800">
                          <p className="text-xs text-gray-400 mb-2">Cobertura</p>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Total certificados:</span>
                              <span className="text-gray-300 font-medium">{stats.total}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="text-emerald-400">Em dia: {stats.compliant}</span>
                              <span className="text-amber-400">Em 30 dias: {stats.dueSoon}</span>
                              <span className="text-red-400">Vencidos: {stats.expired}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-gray-600 text-gray-200 text-xs"
                            onClick={() => openAssignmentModal(training.id)}
                          >
                            Registrar reciclagem
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Desktop: Table */}
              <table className="hidden sm:table min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="py-3 px-2 text-left font-medium">Treinamento</th>
                    <th className="py-3 px-2 text-left font-medium">Carga horária</th>
                    <th className="py-3 px-2 text-left font-medium">Renovação</th>
                    <th className="py-3 px-2 text-left font-medium">Cobertura</th>
                    <th className="py-3 px-2 text-left font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {trainings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">
                        Nenhum treinamento cadastrado ainda.
                      </td>
                    </tr>
                  )}
                  {trainings.map((training) => {
                    const stats = trainingStats.get(training.id) ?? { total: 0, expired: 0, dueSoon: 0, compliant: 0 };
                    return (
                      <tr key={training.id} className="border-b border-gray-800 last:border-0 hover:bg-seguranca-black/50 transition-colors">
                        <td className="py-3 px-2 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-white">{training.name}</span>
                            {training.description && (
                              <span className="text-xs text-gray-400">{training.description}</span>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              {training.provider && <span>Instrutor/Fornecedor: {training.provider}</span>}
                              {training.mandatoryForGuards !== false && (
                                <Badge className="uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                  Obrigatório
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-300">{training.duration ?? 0} h</td>
                        <td className="py-3 px-2 text-gray-300">{training.renewalPeriodMonths ?? 12} meses</td>
                        <td className="py-3 px-2 text-gray-300">
                          <div className="flex flex-col gap-1">
                            <span>Total certificados: {stats.total}</span>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="text-emerald-400">Em dia: {stats.compliant}</span>
                              <span className="text-amber-400">Em 30 dias: {stats.dueSoon}</span>
                              <span className="text-red-400">Vencidos: {stats.expired}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-600 text-gray-200"
                              onClick={() => openAssignmentModal(training.id)}
                            >
                              Registrar reciclagem
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-blue-600/50 text-blue-400 hover:bg-blue-600/10"
                              onClick={() => openEditTrainingModal(training)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-600/50 text-red-400 hover:bg-red-600/10"
                              onClick={() => openDeleteDialog(training)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-700">
          <CardHeader className="flex flex-col gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl text-white">Agenda de reciclagens</CardTitle>
              <CardDescription className="text-gray-400 text-sm mt-1">
                Acompanhe quais vigilantes precisam renovar os cursos obrigatórios.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="filter-status" className="text-gray-400 text-sm whitespace-nowrap">
                    Visualizar
                  </Label>
                  <Select value={filterStatus} onValueChange={(value: CertificationFilter) => setFilterStatus(value)}>
                    <SelectTrigger id="filter-status" className="w-full sm:w-[180px] bg-seguranca-black border-gray-700 text-gray-200">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-700 text-gray-100">
                      <SelectItem value="all">Todos os registros</SelectItem>
                      <SelectItem value="dueSoon">Válidos por até 30 dias</SelectItem>
                      <SelectItem value="expired">Já vencidos</SelectItem>
                      <SelectItem value="compliant">Em dia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Buscar por nome, CPF ou treinamento"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="flex-1 bg-seguranca-black border-gray-700 text-gray-100 placeholder:text-gray-500"
                />
              </div>
              <Button 
                variant="outline" 
                className="border-gray-600 text-gray-200 w-full sm:w-auto" 
                onClick={() => openAssignmentModal()}
                size="sm"
              >
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Registrar reciclagem</span>
                <span className="sm:hidden">Registrar</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-6">
            <div className="min-w-full">
              {/* Mobile: Cards */}
              <div className="block sm:hidden space-y-4">
                {filteredCertifications.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                    <p>Nenhum registro encontrado para os filtros selecionados.</p>
                  </div>
                ) : (
                  filteredCertifications.map((cert) => (
                    <div key={cert.id} className="bg-seguranca-black border border-gray-800 rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-base mb-1">{cert.employeeName ?? '—'}</h3>
                          {cert.employeeDocument && (
                            <p className="text-xs text-gray-500 mb-2">CPF: {cert.employeeDocument}</p>
                          )}
                        </div>
                        <div>{renderStatusBadge(cert)}</div>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-800 space-y-2">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Treinamento</p>
                          <p className="text-sm font-medium text-gray-300">{cert.trainingName ?? '—'}</p>
                          {cert.certificationNumber && (
                            <p className="text-xs text-gray-500 mt-1">Certificado: {cert.certificationNumber}</p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Emitido em</p>
                            <p className="text-sm text-gray-300">{formatDate(cert.issueDate)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Válido até</p>
                            <p className="text-sm text-gray-300">{formatDate(cert.expirationDate)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-gray-600 text-gray-200 text-xs"
                          onClick={() => handleRenewCertification(cert)}
                          disabled={cert.status === 'CANCELLED' || renewingCertificationId === cert.id}
                        >
                          {renewingCertificationId === cert.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCcw className="h-4 w-4 mr-2" />
                          )}
                          Renovar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Desktop: Table */}
              <table className="hidden sm:table min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="py-3 px-2 text-left font-medium">Colaborador</th>
                    <th className="py-3 px-2 text-left font-medium">Treinamento</th>
                    <th className="py-3 px-2 text-left font-medium">Emitido em</th>
                    <th className="py-3 px-2 text-left font-medium">Válido até</th>
                    <th className="py-3 px-2 text-left font-medium">Status</th>
                    <th className="py-3 px-2 text-left font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertifications.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-400">
                        Nenhum registro encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                  {filteredCertifications.map((cert) => (
                    <tr key={cert.id} className="border-b border-gray-800 last:border-0 hover:bg-seguranca-black/50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{cert.employeeName ?? '—'}</span>
                          {cert.employeeDocument && (
                            <span className="text-xs text-gray-500">CPF: {cert.employeeDocument}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-300">
                        <div className="flex flex-col gap-1">
                          <span>{cert.trainingName ?? '—'}</span>
                          <span className="text-xs text-gray-500">
                            Certificado: {cert.certificationNumber || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-300">{formatDate(cert.issueDate)}</td>
                      <td className="py-3 px-2 text-gray-300">{formatDate(cert.expirationDate)}</td>
                      <td className="py-3 px-2">{renderStatusBadge(cert)}</td>
                      <td className="py-3 px-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-200"
                          onClick={() => handleRenewCertification(cert)}
                          disabled={cert.status === 'CANCELLED' || renewingCertificationId === cert.id}
                        >
                          {renewingCertificationId === cert.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCcw className="h-4 w-4" />
                          )}
                          <span className="ml-2">Renovar</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isTrainingModalOpen} onOpenChange={(open) => {
        setTrainingModalOpen(open);
        if (!open) setEditingTrainingId(null);
      }}>
        <DialogContent className="w-[95vw] sm:max-w-lg bg-seguranca-black border-gray-700 text-gray-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingTrainingId ? 'Editar treinamento' : 'Novo treinamento obrigatório'}
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              {editingTrainingId 
                ? 'Atualize as informações do treinamento selecionado.'
                : 'Cadastre cursos e reciclagens que devem ser renovados periodicamente pelos vigilantes.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTraining} className="space-y-4 sm:space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="training-name" className="text-gray-300">Nome do treinamento</Label>
              <Input
                id="training-name"
                value={trainingForm.name}
                onChange={(event) => setTrainingForm((prev) => ({ ...prev, name: event.target.value }))}
                required
                placeholder="Ex.: Reciclagem anual de tiro"
                className="bg-seguranca-black border-gray-700 text-gray-100 placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="training-provider" className="text-gray-300">Instrutor ou fornecedor</Label>
              <Input
                id="training-provider"
                value={trainingForm.provider}
                onChange={(event) => setTrainingForm((prev) => ({ ...prev, provider: event.target.value }))}
                placeholder="Ex.: Centro de Treinamento XYZ"
                className="bg-seguranca-black border-gray-700 text-gray-100 placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="training-description" className="text-gray-300">Descrição</Label>
              <Textarea
                id="training-description"
                value={trainingForm.description}
                onChange={(event) => setTrainingForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Resumo do conteúdo abordado"
                className="bg-seguranca-black border-gray-700 text-gray-100 placeholder:text-gray-500 resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="training-duration" className="text-gray-300">Carga horária (horas)</Label>
                <Input
                  id="training-duration"
                  type="number"
                  min={1}
                  value={trainingForm.duration}
                  onChange={(event) =>
                    setTrainingForm((prev) => ({ ...prev, duration: Number(event.target.value) || 0 }))
                  }
                  className="bg-seguranca-black border-gray-700 text-gray-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="training-renewal" className="text-gray-300">Renovação a cada (meses)</Label>
                <Input
                  id="training-renewal"
                  type="number"
                  min={1}
                  value={trainingForm.renewalPeriodMonths}
                  onChange={(event) =>
                    setTrainingForm((prev) => ({
                      ...prev,
                      renewalPeriodMonths: Number(event.target.value) || 12,
                    }))
                  }
                  className="bg-seguranca-black border-gray-700 text-gray-100"
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="training-mandatory"
                checked={trainingForm.mandatoryForGuards}
                onCheckedChange={(checked) =>
                  setTrainingForm((prev) => ({ ...prev, mandatoryForGuards: checked === true }))
                }
              />
              <Label htmlFor="training-mandatory" className="text-gray-300">
                Treinamento obrigatório para vigilantes
              </Label>
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-gray-600 text-gray-200 w-full sm:w-auto"
                onClick={() => setTrainingModalOpen(false)}
                disabled={isSavingTraining}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSavingTraining} 
                className="gap-2 w-full sm:w-auto bg-seguranca-red hover:bg-seguranca-darkred"
              >
                {isSavingTraining && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar treinamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl bg-seguranca-black border-gray-700 text-gray-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-white">Registrar reciclagem realizada</DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              Informe qual vigilante concluiu o treinamento e quando. A validade será calculada automaticamente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignmentSubmit} className="space-y-4 sm:space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="assignment-employee" className="text-gray-300">Colaborador</Label>
              <Select
                value={assignmentForm.employeeId}
                onValueChange={(value) => setAssignmentForm((prev) => ({ ...prev, employeeId: value }))}
                required
              >
                <SelectTrigger
                  id="assignment-employee"
                  className="bg-seguranca-black border-gray-700 text-gray-100"
                >
                  <SelectValue placeholder="Selecione o vigilante" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-700 text-gray-100 max-h-64">
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} {employee.document ? `- ${employee.document}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <Label htmlFor="assignment-training" className="text-gray-300 font-medium text-sm">Treinamento</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1.5 px-2 text-xs text-seguranca-red hover:text-seguranca-red/90 hover:bg-seguranca-red/10 border border-seguranca-red/30 rounded-md transition-colors w-full sm:w-auto"
                            onClick={() => {
                              setAssignmentModalOpen(false);
                              setTimeout(() => {
                                openNewTrainingModal();
                              }, 100);
                            }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden sm:inline">Cadastrar novo treinamento</span>
                  <span className="sm:hidden">Novo treinamento</span>
                </Button>
              </div>
              <div className="relative">
                <Select
                  value={assignmentForm.trainingId}
                  onValueChange={(value) => {
                    const expiration = addMonthsToDate(
                      assignmentForm.issueDate,
                      getTrainingRenewalPeriod(value),
                    );
                    const selectedTraining = trainings.find((training) => training.id === value);
                    setAssignmentForm((prev) => ({
                      ...prev,
                      trainingId: value,
                      expirationDate: expiration,
                      certificationNumber: prev.certificationNumber || (selectedTraining
                        ? `${selectedTraining.name.slice(0, 12).replace(/\s+/g, '').toUpperCase()}-${new Date(
                          prev.issueDate || todayIso,
                        ).getFullYear()}`
                        : ''),
                    }));
                  }}
                  required
                >
                  <SelectTrigger
                    id="assignment-training"
                    className="bg-seguranca-black border-gray-700 text-gray-100 hover:border-gray-600"
                  >
                    <SelectValue placeholder="Selecione o treinamento" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-700 text-gray-100 max-h-64">
                    {trainings.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <GraduationCap className="h-8 w-8 text-gray-500" />
                          <p className="text-sm text-gray-400">Nenhum treinamento cadastrado</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2 border-seguranca-red/50 text-seguranca-red hover:bg-seguranca-red/10 hover:border-seguranca-red/70"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignmentModalOpen(false);
                              setTimeout(() => {
                                openNewTrainingModal();
                              }, 100);
                            }}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Cadastrar primeiro treinamento
                          </Button>
                        </div>
                      </div>
                    ) : (
                      trainings.map((training) => (
                        <SelectItem key={training.id} value={training.id}>
                          {training.name} ({training.renewalPeriodMonths ?? 12} meses)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {trainings.length === 0 && (
                  <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-xs text-amber-400 flex items-start gap-2">
                      <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Nenhum treinamento cadastrado. Clique no botão acima para cadastrar um novo treinamento antes de registrar a reciclagem.</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Datas - Destaque visual */}
            <div className="bg-seguranca-graphite/50 border border-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-seguranca-yellow" />
                <h3 className="text-sm font-semibold text-gray-300">Datas do Treinamento</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignment-issueDate" className="text-gray-300 font-medium text-sm">
                    Data de realização <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="assignment-issueDate"
                    type="date"
                    value={assignmentForm.issueDate}
                    max={todayIso}
                    onChange={(event) => {
                      const newDate = event.target.value;
                      setAssignmentForm((prev) => ({
                        ...prev,
                        issueDate: newDate,
                        expirationDate: prev.trainingId
                          ? addMonthsToDate(newDate, getTrainingRenewalPeriod(prev.trainingId))
                          : prev.expirationDate,
                      }));
                    }}
                    className="bg-seguranca-black border-gray-700 text-gray-100 w-full"
                    required
                  />
                  <p className="text-xs text-gray-400">
                    Data em que o treinamento foi realizado/concluído
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignment-expirationDate" className="text-gray-300 font-medium text-sm">
                    Data de validade <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="assignment-expirationDate"
                    type="date"
                    value={assignmentForm.expirationDate}
                    min={assignmentForm.issueDate || todayIso}
                    onChange={(event) =>
                      setAssignmentForm((prev) => ({ ...prev, expirationDate: event.target.value }))
                    }
                    className="bg-seguranca-black border-gray-700 text-gray-100 w-full"
                    required
                  />
                  <p className="text-xs text-gray-400">
                    {assignmentForm.trainingId
                      ? `Calculada automaticamente (${getTrainingRenewalPeriod(assignmentForm.trainingId)} meses após a realização)`
                      : 'Data até quando o certificado é válido'}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignment-certNumber" className="text-gray-300">Número do certificado</Label>
                <Input
                  id="assignment-certNumber"
                  value={assignmentForm.certificationNumber}
                  onChange={(event) =>
                    setAssignmentForm((prev) => ({ ...prev, certificationNumber: event.target.value }))
                  }
                  placeholder="Ex.: REC-TIRO-2025-001"
                  className="bg-seguranca-black border-gray-700 text-gray-100 placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignment-docUrl" className="text-gray-300">Link do certificado (opcional)</Label>
                <Input
                  id="assignment-docUrl"
                  value={assignmentForm.documentUrl}
                  onChange={(event) =>
                    setAssignmentForm((prev) => ({ ...prev, documentUrl: event.target.value }))
                  }
                  placeholder="URL do certificado digitalizado"
                  className="bg-seguranca-black border-gray-700 text-gray-100 placeholder:text-gray-500"
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-gray-600 text-gray-200 w-full sm:w-auto"
                onClick={() => setAssignmentModalOpen(false)}
                disabled={isSavingAssignment}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSavingAssignment} 
                className="gap-2 w-full sm:w-auto bg-seguranca-red hover:bg-seguranca-darkred"
              >
                {isSavingAssignment && <Loader2 className="h-4 w-4 animate-spin" />}
                Registrar reciclagem
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md bg-seguranca-black border-gray-700 text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-lg text-red-400 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Confirmar exclusão
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {trainingToDelete && (
            <div className="py-4 space-y-3">
              <p className="text-gray-300">
                Tem certeza que deseja excluir o treinamento:
              </p>
              <div className="bg-seguranca-graphite border border-gray-700 rounded-lg p-3">
                <p className="font-semibold text-white">{trainingToDelete.name}</p>
                {trainingToDelete.description && (
                  <p className="text-sm text-gray-400 mt-1">{trainingToDelete.description}</p>
                )}
              </div>
              <p className="text-sm text-amber-400 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Todos os registros de reciclagem vinculados a este treinamento também serão removidos.
                </span>
              </p>
            </div>
          )}
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="border-gray-600 text-gray-200 w-full sm:w-auto"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setTrainingToDelete(null);
              }}
              disabled={isDeletingTraining}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="gap-2 w-full sm:w-auto bg-red-600 hover:bg-red-700"
              onClick={handleDeleteTraining}
              disabled={isDeletingTraining}
            >
              {isDeletingTraining && <Loader2 className="h-4 w-4 animate-spin" />}
              Excluir treinamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>
        <TabsContent value="certificados" className="space-y-6">
          <CertificateManagementTab />
        </TabsContent>
      </Tabs>
    </StandardLayout>
  );
};

export default Treinamentos;
