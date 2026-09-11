import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Users,
  Truck,
  Shield,
  FileText,
  Calendar,
  Edit,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  UserCheck,
  CalendarDays,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Eye,
  Grid3X3,
  List,
  Zap,
} from 'lucide-react';
import { workPostService, WorkPost } from '@/services/workPostService';
import {
  workPostAssignmentService,
  WorkPostAssignment,
  CreateWorkPostAssignmentRequest,
} from '@/services/workPostAssignmentService';
import { useToast } from '@/hooks/use-toast';

// ==================== HELPERS ====================

const shiftTypeLabel: Record<string, string> = {
  DAY: '☀️ Diurno',
  NIGHT: '🌙 Noturno',
  MIXED: '🔄 Misto',
  NOTURNO: '🌙 Noturno',
  MORNING: '🌅 Matutino',
  AFTERNOON: '🌇 Vespertino',
  EXTENDED: '⏰ Estendido',
};

const statusColors: Record<string, string> = {
  ATIVO: 'bg-green-500/20 text-green-400 border-green-500/30',
  EM_IMPLANTACAO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  INATIVO: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  SUSPENSO: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CANCELADO: 'bg-red-500/20 text-red-400 border-red-500/30',
  EM_ANALISE: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  PENDENTE: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const assignmentStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CONFIRMED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
  COMPLETED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
  MODIFIED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const assignmentStatusLabel: Record<string, string> = {
  PENDING: '⏳ Pendente',
  CONFIRMED: '✅ Confirmada',
  ACTIVE: '🟢 Ativa',
  COMPLETED: '✔️ Concluída',
  CANCELLED: '❌ Cancelada',
  MODIFIED: '✏️ Modificada',
};

const STATUS_OPTIONS = [
  { value: 'EM_ANALISE', label: 'Em Análise' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_IMPLANTACAO', label: 'Em Implantação' },
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'INATIVO', label: 'Inativo' },
  { value: 'SUSPENSO', label: 'Suspenso' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const SHIFT_COLORS: Record<string, string> = {
  DAY: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40',
  NIGHT: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/40',
  MIXED: 'bg-orange-400/20 text-orange-300 border-orange-400/40',
  MORNING: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
  AFTERNOON: 'bg-pink-400/20 text-pink-300 border-pink-400/40',
  EXTENDED: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40',
  NOTURNO: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/40',
};

const STATUS_DOT_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-400',
  CONFIRMED: 'bg-blue-400',
  ACTIVE: 'bg-green-400',
  COMPLETED: 'bg-gray-400',
  CANCELLED: 'bg-red-400',
};

type TabType = 'specs' | 'assignments' | 'calendar';

// ==================== MAIN COMPONENT ====================

const WorkPostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Core state
  const [workPost, setWorkPost] = useState<WorkPost | null>(null);
  const [assignments, setAssignments] = useState<WorkPostAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('specs');
  const [showSpecs, setShowSpecs] = useState({
    identification: true,
    location: true,
    personnel: true,
    benefits: false,
    equipment: false,
    compliance: false,
    implementation: false,
  });

  // Assignment dialog
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<WorkPostAssignment | null>(null);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [assignmentForm, setAssignmentForm] = useState<CreateWorkPostAssignmentRequest>({
    employeeId: '',
    workPostId: '',
    assignmentDate: new Date().toISOString().split('T')[0],
    shiftType: 'DAY',
    startTime: '',
    endTime: '',
    observations: '',
    specialInstructions: '',
    isPrimaryAssignment: true,
    isBackupAssignment: false,
  });

  // Bulk assignment dialog
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    employeeIds: [] as string[],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    shiftType: 'DAY',
    startTime: '',
    endTime: '',
    isPrimaryAssignment: true,
  });

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarView, setCalendarView] = useState<'calendar' | 'list'>('calendar');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Date range for assignment list
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date(new Date().setMonth(new Date().getMonth() + 1, 0)).toISOString().split('T')[0],
  });

  // Status dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  // ==================== DATA LOADING ====================

  const loadWorkPost = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await workPostService.getWorkPostById(id);
      setWorkPost(data);
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do posto de trabalho',
        variant: 'destructive',
      });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id, toast, navigate]);

  const loadAssignments = useCallback(async () => {
    if (!id) return;
    try {
      const data = await workPostAssignmentService.getByWorkPostAndDateRange(
        id,
        dateRange.start,
        dateRange.end
      );
      setAssignments(data);
    } catch {
      try {
        const data = await workPostAssignmentService.getByWorkPost(id);
        setAssignments(data);
      } catch {
        setAssignments([]);
      }
    }
  }, [id, dateRange]);

  const loadEmployees = useCallback(async () => {
    try {
      const response = await import('@/services/api').then((m) =>
        m.default.get('/api/employees')
      );
      const data = response.data;
      if (Array.isArray(data)) {
        setEmployees(data.map((e: any) => ({ id: e.id, name: e.name })));
      } else if (data?.content) {
        setEmployees(data.content.map((e: any) => ({ id: e.id, name: e.name })));
      }
    } catch {
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    loadWorkPost();
    loadEmployees();
  }, [loadWorkPost, loadEmployees]);

  useEffect(() => {
    if (activeTab === 'assignments' || activeTab === 'calendar') {
      loadAssignments();
    }
  }, [activeTab, loadAssignments]);

  // ==================== HANDLERS ====================

  // Status change
  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    try {
      await workPostService.updateWorkPostStatus(id, newStatus);
      setWorkPost((prev) => prev ? { ...prev, status: newStatus as any } : prev);
      setStatusDialogOpen(false);
      toast({ title: 'Sucesso', description: `Status alterado para ${newStatus.replace(/_/g, ' ')}` });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao alterar status', variant: 'destructive' });
    }
  };

  // Assignment CRUD
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta atribuição?')) return;
    try {
      await workPostAssignmentService.delete(assignmentId);
      toast({ title: 'Sucesso', description: 'Atribuição excluída com sucesso' });
      loadAssignments();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir atribuição', variant: 'destructive' });
    }
  };

  const handleAssignmentStatus = async (
    assignmentId: string,
    action: 'confirm' | 'complete' | 'cancel'
  ) => {
    try {
      if (action === 'confirm') await workPostAssignmentService.confirm(assignmentId);
      else if (action === 'complete') await workPostAssignmentService.complete(assignmentId);
      else await workPostAssignmentService.updateStatus(assignmentId, 'CANCELLED');
      const labels = { confirm: 'confirmada', complete: 'concluída', cancel: 'cancelada' };
      toast({ title: 'Sucesso', description: `Atribuição ${labels[action]} com sucesso` });
      loadAssignments();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao atualizar status da atribuição', variant: 'destructive' });
    }
  };

  const handleSaveAssignment = async () => {
    if (!id) return;
    if (!assignmentForm.employeeId) {
      toast({ title: 'Erro', description: 'Selecione um funcionário', variant: 'destructive' });
      return;
    }
    try {
      const payload = { ...assignmentForm, workPostId: id };
      if (editingAssignment) {
        await workPostAssignmentService.update(editingAssignment.id, payload);
        toast({ title: 'Sucesso', description: 'Atribuição atualizada com sucesso' });
      } else {
        await workPostAssignmentService.create(payload);
        toast({ title: 'Sucesso', description: 'Atribuição criada com sucesso' });
      }
      setAssignmentDialogOpen(false);
      setEditingAssignment(null);
      resetAssignmentForm();
      loadAssignments();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Erro ao salvar atribuição', variant: 'destructive' });
    }
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({
      employeeId: '',
      workPostId: id || '',
      assignmentDate: new Date().toISOString().split('T')[0],
      shiftType: 'DAY',
      startTime: workPost?.shiftStart || '',
      endTime: workPost?.shiftEnd || '',
      observations: '',
      specialInstructions: '',
      isPrimaryAssignment: true,
      isBackupAssignment: false,
    });
  };

  const openNewAssignment = (date?: string) => {
    setEditingAssignment(null);
    resetAssignmentForm();
    if (date) {
      setAssignmentForm((prev) => ({ ...prev, assignmentDate: date }));
    }
    setAssignmentDialogOpen(true);
  };

  const openEditAssignment = (assignment: WorkPostAssignment) => {
    setEditingAssignment(assignment);
    setAssignmentForm({
      employeeId: assignment.employee?.id || '',
      workPostId: id || '',
      assignmentDate: assignment.assignmentDate,
      shiftType: assignment.shift || 'DAY',
      startTime: assignment.startTime || '',
      endTime: assignment.endTime || '',
      observations: assignment.observations || '',
      specialInstructions: assignment.specialInstructions || '',
      isPrimaryAssignment: assignment.primaryAssignment ?? true,
      isBackupAssignment: assignment.backupAssignment ?? false,
    });
    setAssignmentDialogOpen(true);
  };

  // Bulk assignment
  const handleBulkAssign = async () => {
    if (!id) return;
    if (bulkForm.employeeIds.length === 0) {
      toast({ title: 'Erro', description: 'Selecione pelo menos um funcionário', variant: 'destructive' });
      return;
    }
    if (!bulkForm.startDate || !bulkForm.endDate) {
      toast({ title: 'Erro', description: 'Defina o período (início e fim)', variant: 'destructive' });
      return;
    }

    const start = new Date(bulkForm.startDate);
    const end = new Date(bulkForm.endDate);
    let created = 0;

    for (const empId of bulkForm.employeeIds) {
      const current = new Date(start);
      while (current <= end) {
        try {
          await workPostAssignmentService.create({
            employeeId: empId,
            workPostId: id,
            assignmentDate: current.toISOString().split('T')[0],
            shiftType: bulkForm.shiftType,
            startTime: bulkForm.startTime || undefined,
            endTime: bulkForm.endTime || undefined,
            isPrimaryAssignment: bulkForm.isPrimaryAssignment,
          });
          created++;
        } catch {
          // Skip duplicates
        }
        current.setDate(current.getDate() + 1);
      }
    }

    toast({
      title: 'Sucesso',
      description: `${created} atribuição(ões) criada(s) com sucesso`,
    });
    setBulkDialogOpen(false);
    setBulkForm({
      employeeIds: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      shiftType: 'DAY',
      startTime: '',
      endTime: '',
      isPrimaryAssignment: true,
    });
    loadAssignments();
  };

  const toggleSpecs = (section: keyof typeof showSpecs) => {
    setShowSpecs((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // ==================== CALENDAR LOGIC ====================

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startPad = firstDay.getDay();

    const days: { date: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Pad previous month
    const prevMonthLast = new Date(calendarYear, calendarMonth, 0).getDate();
    for (let i = startPad - 1; i >= 0; i--) {
      const d = prevMonthLast - i;
      const dt = new Date(calendarYear, calendarMonth - 1, d);
      days.push({ date: dt.toISOString().split('T')[0], dayNum: d, isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(calendarYear, calendarMonth, d);
      days.push({ date: dt.toISOString().split('T')[0], dayNum: d, isCurrentMonth: true });
    }

    // Pad next month
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const dt = new Date(calendarYear, calendarMonth + 1, d);
      days.push({ date: dt.toISOString().split('T')[0], dayNum: d, isCurrentMonth: false });
    }

    return days;
  }, [calendarMonth, calendarYear]);

  const assignmentsByDate = useMemo(() => {
    const map: Record<string, WorkPostAssignment[]> = {};
    const wpAssignments = assignments.filter((a) => a.workPost?.id === id);
    for (const a of wpAssignments) {
      if (!map[a.assignmentDate]) map[a.assignmentDate] = [];
      map[a.assignmentDate].push(a);
    }
    return map;
  }, [assignments, id]);

  const calendarNav = (dir: number) => {
    if (dir === -1) {
      if (calendarMonth === 0) {
        setCalendarMonth(11);
        setCalendarYear((y) => y - 1);
      } else {
        setCalendarMonth((m) => m - 1);
      }
    } else {
      if (calendarMonth === 11) {
        setCalendarMonth(0);
        setCalendarYear((y) => y + 1);
      } else {
        setCalendarMonth((m) => m + 1);
      }
    }
  };

  // ==================== DERIVED STATE ====================

  const workPostAssignments = useMemo(
    () => assignments.filter((a) => a.workPost?.id === id),
    [assignments, id]
  );

  const pendingCount = workPostAssignments.filter((a) => a.status === 'PENDING').length;
  const confirmedCount = workPostAssignments.filter((a) => a.status === 'CONFIRMED').length;
  const activeCount = workPostAssignments.filter((a) => a.status === 'ACTIVE').length;
  const completedCount = workPostAssignments.filter((a) => a.status === 'COMPLETED').length;

  // ==================== RENDER ====================

  if (loading) {
    return (
      <StandardLayout title="Carregando..." subtitle="">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-seguranca-red animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Carregando dados do posto...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  if (!workPost) {
    return (
      <StandardLayout title="Posto não encontrado" subtitle="">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Posto de trabalho não encontrado</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout
      title={`Posto: ${workPost.name}`}
      subtitle={`${workPost.postCode} • ${workPost.clientName || 'Sem cliente'} • ${workPost.address || ''}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-animate="fadeDown">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite self-start"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => setStatusDialogOpen(true)}>
              <Badge className={`border cursor-pointer hover:opacity-80 ${statusColors[workPost.status || 'EM_IMPLANTACAO']}`}>
                {workPost.status?.replace(/_/g, ' ')} ✏️
              </Badge>
            </button>
            <Badge variant="outline" className="text-gray-400 border-gray-600">
              {workPost.type?.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>

        {/* Quick Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" data-animate="fadeDown">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30">
            <div className="p-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">Vigilantes</p>
                <p className="text-xl font-bold text-blue-400">{workPost.requiredVigilantes || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
            <div className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-xs text-gray-400">Turno</p>
                <p className="text-sm font-bold text-green-400">
                  {workPost.shiftStart || '—'} → {workPost.shiftEnd || '—'}
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30">
            <div className="p-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-xs text-gray-400">Escala</p>
                <p className="text-sm font-bold text-purple-400">{workPost.workSchedule || '—'}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/30">
            <div className="p-4 flex items-center gap-3">
              <UserCheck className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-xs text-gray-400">Atribuições (mês)</p>
                <p className="text-xl font-bold text-yellow-400">{workPostAssignments.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2" data-animate="fadeDown">
          <Button
            variant={activeTab === 'specs' ? 'default' : 'outline'}
            onClick={() => setActiveTab('specs')}
            className={
              activeTab === 'specs'
                ? 'bg-seguranca-red hover:bg-seguranca-darkred'
                : 'border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite'
            }
          >
            <FileText className="mr-2 h-4 w-4" /> Especificações
          </Button>
          <Button
            variant={activeTab === 'assignments' ? 'default' : 'outline'}
            onClick={() => setActiveTab('assignments')}
            className={
              activeTab === 'assignments'
                ? 'bg-seguranca-red hover:bg-seguranca-darkred'
                : 'border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite'
            }
          >
            <UserCheck className="mr-2 h-4 w-4" /> Atribuições
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                {pendingCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'calendar' ? 'default' : 'outline'}
            onClick={() => setActiveTab('calendar')}
            className={
              activeTab === 'calendar'
                ? 'bg-seguranca-red hover:bg-seguranca-darkred'
                : 'border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite'
            }
          >
            <CalendarDays className="mr-2 h-4 w-4" /> Calendário
          </Button>
        </div>

        {/* ==================== TAB: SPECS ==================== */}
        {activeTab === 'specs' && (
          <div className="space-y-4" data-animate="fadeUp">
            <CollapsibleSection
              title="Identificação do Posto"
              icon={<Building2 className="h-5 w-5 text-blue-400" />}
              isOpen={showSpecs.identification}
              onToggle={() => toggleSpecs('identification')}
              badge={<Badge variant="outline" className="text-gray-400 border-gray-600">{workPost.postCode}</Badge>}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <SpecItem label="Nome" value={workPost.name} />
                <SpecItem label="Código" value={workPost.postCode} />
                <SpecItem label="Tipo" value={workPost.type?.replace(/_/g, ' ')} />
                <SpecItem label="Descrição" value={workPost.description} fullWidth />
                <SpecItem label="Responsável" value={workPost.responsibleId ? 'Definido' : 'Não definido'} />
                <SpecItem label="Observações" value={workPost.observations} fullWidth />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Localização"
              icon={<MapPin className="h-5 w-5 text-green-400" />}
              isOpen={showSpecs.location}
              onToggle={() => toggleSpecs('location')}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <SpecItem label="Endereço" value={workPost.address} fullWidth />
                <SpecItem label="Cidade" value={workPost.city} />
                <SpecItem label="Estado" value={workPost.state} />
                <SpecItem label="CEP" value={workPost.zipCode} />
                <SpecItem label="Cliente" value={workPost.clientName} />
                <SpecItem label="CNPJ" value={workPost.clientCnpj} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Configuração de Pessoal"
              icon={<Users className="h-5 w-5 text-purple-400" />}
              isOpen={showSpecs.personnel}
              onToggle={() => toggleSpecs('personnel')}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <SpecItem label="Vigilantes Necessários" value={workPost.requiredVigilantes?.toString()} icon={<Users className="h-4 w-4 text-purple-400" />} />
                <SpecItem label="Escala de Trabalho" value={workPost.workSchedule} />
                <SpecItem label="Início do Turno" value={workPost.shiftStart} icon={<Clock className="h-4 w-4 text-green-400" />} />
                <SpecItem label="Fim do Turno" value={workPost.shiftEnd} icon={<Clock className="h-4 w-4 text-red-400" />} />
                <SpecItem label="Descrição do Turno" value={workPost.shiftDescription} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Benefícios e Condições"
              icon={<Briefcase className="h-5 w-5 text-yellow-400" />}
              isOpen={showSpecs.benefits}
              onToggle={() => toggleSpecs('benefits')}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <BenefitBadge label="Vale Transporte" active={workPost.transportVoucher} />
                <BenefitBadge label="Ajuda de Custo" active={workPost.costAllowance} />
                {workPost.costAllowance && workPost.costAllowanceValue && (
                  <SpecItem label="Valor Ajuda de Custo" value={`R$ ${workPost.costAllowanceValue}`} />
                )}
                <BenefitBadge label="Intrajornada" active={workPost.intrajourney} />
                <BenefitBadge label="Alimentação no Local" active={workPost.localMeal} />
                <BenefitBadge label="Ticket Alimentação" active={workPost.mealTicket} />
                <BenefitBadge label="Plano de Saúde" active={workPost.healthPlan} />
                <BenefitBadge label="Plano Odontológico" active={workPost.dentalPlan} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Recursos e Equipamentos"
              icon={<Truck className="h-5 w-5 text-orange-400" />}
              isOpen={showSpecs.equipment}
              onToggle={() => toggleSpecs('equipment')}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <SpecItem label="Carros" value={workPost.cars?.toString() || '0'} icon={<Truck className="h-4 w-4 text-orange-400" />} />
                <SpecItem label="Motos" value={workPost.motorcycles?.toString() || '0'} />
                <SpecItem label="Rádios" value={workPost.radios?.toString() || '0'} />
                <SpecItem label="Corporativos" value={workPost.corporates?.toString() || '0'} />
                <BenefitBadge label="Banco DOC" active={workPost.documentBank} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Conformidade Legal"
              icon={<Shield className="h-5 w-5 text-red-400" />}
              isOpen={showSpecs.compliance}
              onToggle={() => toggleSpecs('compliance')}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <BenefitBadge label="PGR" active={workPost.pgr} />
                  <BenefitBadge label="PCMSO" active={workPost.pcmso} />
                </div>
                {workPost.nrs && workPost.nrs.length > 0 && (
                  <div>
                    <Label className="text-gray-400 text-sm mb-2 block">Normas Regulamentadoras (NRs)</Label>
                    <div className="flex flex-wrap gap-2">
                      {workPost.nrs.map((nr, i) => (
                        <Badge key={i} variant="outline" className="text-blue-400 border-blue-500/30 bg-blue-500/10">{nr}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {workPost.epis && workPost.epis.length > 0 && (
                  <div>
                    <Label className="text-gray-400 text-sm mb-2 block">EPIs Necessários</Label>
                    <div className="flex flex-wrap gap-2">
                      {workPost.epis.map((epi, i) => (
                        <Badge key={i} variant="outline" className="text-yellow-400 border-yellow-500/30 bg-yellow-500/10">{epi}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {workPost.trainings && workPost.trainings.length > 0 && (
                  <div>
                    <Label className="text-gray-400 text-sm mb-2 block">Treinamentos Necessários</Label>
                    <div className="flex flex-wrap gap-2">
                      {workPost.trainings.map((t, i) => (
                        <Badge key={i} variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Implantação"
              icon={<Calendar className="h-5 w-5 text-cyan-400" />}
              isOpen={showSpecs.implementation}
              onToggle={() => toggleSpecs('implementation')}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <SpecItem label="Data de Implantação" value={workPost.implementationDate} icon={<Calendar className="h-4 w-4 text-cyan-400" />} />
                <SpecItem label="Horário de Implantação" value={workPost.implementationTime} icon={<Clock className="h-4 w-4 text-cyan-400" />} />
                <SpecItem label="Criado em" value={workPost.createdAt ? new Date(workPost.createdAt).toLocaleDateString('pt-BR') : undefined} />
                <SpecItem label="Atualizado em" value={workPost.updatedAt ? new Date(workPost.updatedAt).toLocaleDateString('pt-BR') : undefined} />
              </div>
            </CollapsibleSection>
          </div>
        )}

        {/* ==================== TAB: ASSIGNMENTS ==================== */}
        {activeTab === 'assignments' && (
          <div className="space-y-4" data-animate="fadeUp">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MiniStatCard label="Pendentes" value={pendingCount} color="yellow" icon={<AlertCircle className="h-4 w-4" />} />
              <MiniStatCard label="Confirmadas" value={confirmedCount} color="blue" icon={<CheckCircle2 className="h-4 w-4" />} />
              <MiniStatCard label="Ativas" value={activeCount} color="green" icon={<Eye className="h-4 w-4" />} />
              <MiniStatCard label="Concluídas" value={completedCount} color="gray" icon={<CheckCircle2 className="h-4 w-4" />} />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Label className="text-gray-400 text-sm">Período:</Label>
                <Input type="date" value={dateRange.start} onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))} className="bg-seguranca-black/50 border-gray-600/30 text-white text-sm w-36" />
                <span className="text-gray-500">até</span>
                <Input type="date" value={dateRange.end} onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))} className="bg-seguranca-black/50 border-gray-600/30 text-white text-sm w-36" />
                <Button variant="outline" size="sm" onClick={loadAssignments} className="border-gray-600 text-gray-400 hover:bg-seguranca-graphite">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setBulkDialogOpen(true)} className="border-gray-600 text-gray-400 hover:bg-seguranca-graphite">
                  <Zap className="mr-2 h-4 w-4" /> Atribuição em Massa
                </Button>
                <Button onClick={() => openNewAssignment()} className="bg-gradient-to-r from-seguranca-red to-seguranca-darkred hover:from-seguranca-darkred hover:to-seguranca-red">
                  <Plus className="mr-2 h-4 w-4" /> Nova Atribuição
                </Button>
              </div>
            </div>

            {/* Assignment list */}
            {workPostAssignments.length === 0 ? (
              <Card className="bg-gradient-to-br from-seguranca-graphite/80 to-seguranca-black/60 border-gray-600/30 p-12">
                <div className="text-center">
                  <UserCheck className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Nenhuma atribuição encontrada</p>
                  <p className="text-gray-500 text-sm mt-2">Clique em "Nova Atribuição" para alocar um funcionário a este posto</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {workPostAssignments.map((a) => (
                  <Card key={a.id} className="bg-gradient-to-br from-seguranca-graphite/80 to-seguranca-black/60 border-gray-600/30 hover:border-gray-500/50 transition-all">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-8 h-8 rounded-full bg-seguranca-red/20 border border-seguranca-red/30 flex items-center justify-center text-seguranca-red text-sm font-bold">
                            {a.employee?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-white font-medium truncate">{a.employee?.name || 'Funcionário não informado'}</p>
                            <p className="text-gray-400 text-sm">
                              {new Date(a.assignmentDate).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2 ml-11">
                          <Badge className={`text-xs border ${assignmentStatusColors[a.status] || assignmentStatusColors.PENDING}`}>
                            {assignmentStatusLabel[a.status] || a.status}
                          </Badge>
                          {a.shift && (
                            <Badge variant="outline" className={`text-xs border ${SHIFT_COLORS[a.shift] || 'text-gray-400 border-gray-600'}`}>
                              {shiftTypeLabel[a.shift] || a.shift}
                            </Badge>
                          )}
                          {a.startTime && a.endTime && (
                            <span className="text-gray-500 text-xs">🕐 {a.startTime} às {a.endTime}</span>
                          )}
                          {a.primaryAssignment && <Badge className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">Principal</Badge>}
                          {a.backupAssignment && <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Reserva</Badge>}
                        </div>
                        {a.observations && <p className="text-gray-500 text-xs mt-1 ml-11 truncate">📝 {a.observations}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {a.status === 'PENDING' && (
                          <Button size="sm" variant="outline" onClick={() => handleAssignmentStatus(a.id, 'confirm')} className="border-green-500/30 text-green-400 hover:bg-green-500/10 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmar
                          </Button>
                        )}
                        {(a.status === 'CONFIRMED' || a.status === 'ACTIVE') && (
                          <Button size="sm" variant="outline" onClick={() => handleAssignmentStatus(a.id, 'complete')} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Concluir
                          </Button>
                        )}
                        {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                          <Button size="sm" variant="outline" onClick={() => handleAssignmentStatus(a.id, 'cancel')} className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs">
                            <XCircle className="h-3 w-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => openEditAssignment(a)} className="border-gray-600 text-gray-400 hover:bg-seguranca-graphite text-xs">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteAssignment(a.id)} className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: CALENDAR ==================== */}
        {activeTab === 'calendar' && (
          <div className="space-y-4" data-animate="fadeUp">
            {/* Calendar header */}
            <Card className="bg-gradient-to-br from-seguranca-graphite/80 to-seguranca-black/60 border-gray-600/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => calendarNav(-1)} className="border-gray-600 text-gray-400">◀</Button>
                  <h3 className="text-white font-bold text-lg min-w-[200px] text-center">
                    {MONTH_NAMES[calendarMonth]} {calendarYear}
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => calendarNav(1)} className="border-gray-600 text-gray-400">▶</Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setCalendarMonth(new Date().getMonth()); setCalendarYear(new Date().getFullYear()); }} className="border-gray-600 text-gray-400 text-xs">Hoje</Button>
                  <div className="flex border border-gray-600 rounded-lg overflow-hidden">
                    <button onClick={() => setCalendarView('calendar')} className={`px-3 py-1 text-xs ${calendarView === 'calendar' ? 'bg-seguranca-red text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                      <Grid3X3 className="h-3 w-3" />
                    </button>
                    <button onClick={() => setCalendarView('list')} className={`px-3 py-1 text-xs ${calendarView === 'list' ? 'bg-seguranca-red text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                      <List className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Calendar legend */}
              <div className="flex flex-wrap gap-3 mt-3 text-xs">
                {Object.entries(shiftTypeLabel).slice(0, 5).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full border ${SHIFT_COLORS[key]?.includes('yellow') ? 'bg-yellow-400' : SHIFT_COLORS[key]?.includes('indigo') ? 'bg-indigo-400' : SHIFT_COLORS[key]?.includes('orange') ? 'bg-orange-400' : SHIFT_COLORS[key]?.includes('amber') ? 'bg-amber-400' : SHIFT_COLORS[key]?.includes('pink') ? 'bg-pink-400' : 'bg-cyan-400'}`} />
                    <span className="text-gray-500">{label.split(' ')[1]}</span>
                  </div>
                ))}
              </div>
            </Card>

            {calendarView === 'calendar' ? (
              /* Calendar grid */
              <Card className="bg-gradient-to-br from-seguranca-graphite/80 to-seguranca-black/60 border-gray-600/30 overflow-hidden">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 border-b border-gray-700/50">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="p-2 text-center text-xs font-semibold text-gray-400">{d}</div>
                  ))}
                </div>
                {/* Days grid */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, idx) => {
                    const dayAssignments = assignmentsByDate[day.date] || [];
                    const isToday = day.date === new Date().toISOString().split('T')[0];
                    const isSelected = selectedCalendarDate === day.date;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedCalendarDate(isSelected ? null : day.date)}
                        className={`min-h-[80px] sm:min-h-[100px] border-b border-r border-gray-700/30 p-1 cursor-pointer transition-colors ${
                          !day.isCurrentMonth ? 'bg-black/20 opacity-40' : ''
                        } ${isToday ? 'bg-seguranca-red/5' : ''} ${isSelected ? 'bg-seguranca-red/10 ring-1 ring-seguranca-red/30' : 'hover:bg-white/5'}`}
                      >
                        <div className={`text-xs font-medium mb-1 ${isToday ? 'text-seguranca-red font-bold' : day.isCurrentMonth ? 'text-gray-300' : 'text-gray-600'}`}>
                          {day.dayNum}
                        </div>
                        <div className="space-y-0.5">
                          {dayAssignments.slice(0, 3).map((a) => (
                            <div
                              key={a.id}
                              onClick={(e) => { e.stopPropagation(); openEditAssignment(a); }}
                              className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 ${SHIFT_COLORS[a.shift || 'DAY'] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}
                              title={`${a.employee?.name} — ${shiftTypeLabel[a.shift || 'DAY']}`}
                            >
                              {a.employee?.name?.split(' ')[0] || '?'}
                            </div>
                          ))}
                          {dayAssignments.length > 3 && (
                            <div className="text-[9px] text-gray-500 text-center">+{dayAssignments.length - 3}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : (
              /* List view for calendar */
              <div className="space-y-2">
                {(() => {
                  const sorted = [...workPostAssignments].sort((a, b) => a.assignmentDate.localeCompare(b.assignmentDate));
                  const grouped: Record<string, WorkPostAssignment[]> = {};
                  for (const a of sorted) {
                    if (!grouped[a.assignmentDate]) grouped[a.assignmentDate] = [];
                    grouped[a.assignmentDate].push(a);
                  }
                  return Object.entries(grouped).map(([date, dayAssignments]) => (
                    <Card key={date} className="bg-gradient-to-br from-seguranca-graphite/80 to-seguranca-black/60 border-gray-600/30">
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white text-sm font-semibold">
                            {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                          <Button size="sm" variant="outline" onClick={() => openNewAssignment(date)} className="border-gray-600 text-gray-400 text-xs h-6">
                            <Plus className="h-3 w-3 mr-1" /> Adicionar
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {dayAssignments.map((a) => (
                            <div
                              key={a.id}
                              onClick={() => openEditAssignment(a)}
                              className={`flex items-center gap-2 px-2 py-1 rounded-lg border cursor-pointer hover:opacity-80 ${SHIFT_COLORS[a.shift || 'DAY'] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_COLORS[a.status] || 'bg-gray-400'}`} />
                              <span className="text-xs font-medium">{a.employee?.name?.split(' ').slice(0, 2).join(' ')}</span>
                              {a.startTime && <span className="text-[10px] opacity-70">{a.startTime}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ));
                })()}
              </div>
            )}
          </div>
        )}

        {/* ==================== STATUS DIALOG ==================== */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-600/50 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-white">🔄 Alterar Status do Posto</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    workPost.status === opt.value
                      ? 'bg-seguranca-red/20 border-seguranca-red/50 text-white'
                      : 'bg-seguranca-black/30 border-gray-600/30 text-gray-300 hover:bg-seguranca-graphite hover:border-gray-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{opt.label}</span>
                    {workPost.status === opt.value && <CheckCircle2 className="h-4 w-4 text-seguranca-red" />}
                  </div>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* ==================== ASSIGNMENT DIALOG ==================== */}
        <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-600/50 text-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingAssignment ? '✏️ Editar Atribuição' : '➕ Nova Atribuição'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-gray-400">Funcionário *</Label>
                <Select value={assignmentForm.employeeId} onValueChange={(v) => setAssignmentForm((p) => ({ ...p, employeeId: v }))}>
                  <SelectTrigger className="bg-seguranca-black/50 border-gray-600/30 text-white">
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600/30 max-h-60 overflow-y-auto">
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id} className="text-white hover:bg-seguranca-graphite">{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">Data da Atribuição *</Label>
                <Input type="date" value={assignmentForm.assignmentDate} onChange={(e) => setAssignmentForm((p) => ({ ...p, assignmentDate: e.target.value }))} className="bg-seguranca-black/50 border-gray-600/30 text-white" />
              </div>
              <div>
                <Label className="text-gray-400">Tipo de Turno *</Label>
                <Select value={assignmentForm.shiftType} onValueChange={(v) => setAssignmentForm((p) => ({ ...p, shiftType: v }))}>
                  <SelectTrigger className="bg-seguranca-black/50 border-gray-600/30 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600/30">
                    <SelectItem value="DAY" className="text-white hover:bg-seguranca-graphite">☀️ Diurno</SelectItem>
                    <SelectItem value="NIGHT" className="text-white hover:bg-seguranca-graphite">🌙 Noturno</SelectItem>
                    <SelectItem value="MIXED" className="text-white hover:bg-seguranca-graphite">🔄 Misto</SelectItem>
                    <SelectItem value="MORNING" className="text-white hover:bg-seguranca-graphite">🌅 Matutino</SelectItem>
                    <SelectItem value="AFTERNOON" className="text-white hover:bg-seguranca-graphite">🌇 Vespertino</SelectItem>
                    <SelectItem value="EXTENDED" className="text-white hover:bg-seguranca-graphite">⏰ Estendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Horário Início</Label>
                  <Input type="time" value={assignmentForm.startTime} onChange={(e) => setAssignmentForm((p) => ({ ...p, startTime: e.target.value }))} className="bg-seguranca-black/50 border-gray-600/30 text-white" />
                </div>
                <div>
                  <Label className="text-gray-400">Horário Fim</Label>
                  <Input type="time" value={assignmentForm.endTime} onChange={(e) => setAssignmentForm((p) => ({ ...p, endTime: e.target.value }))} className="bg-seguranca-black/50 border-gray-600/30 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={assignmentForm.isPrimaryAssignment} onChange={(e) => setAssignmentForm((p) => ({ ...p, isPrimaryAssignment: e.target.checked, isBackupAssignment: e.target.checked ? false : p.isBackupAssignment }))} className="rounded border-gray-600" />
                  Principal
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={assignmentForm.isBackupAssignment} onChange={(e) => setAssignmentForm((p) => ({ ...p, isBackupAssignment: e.target.checked, isPrimaryAssignment: e.target.checked ? false : p.isPrimaryAssignment }))} className="rounded border-gray-600" />
                  Reserva
                </label>
              </div>
              <div>
                <Label className="text-gray-400">Observações</Label>
                <Textarea value={assignmentForm.observations} onChange={(e) => setAssignmentForm((p) => ({ ...p, observations: e.target.value }))} className="bg-seguranca-black/50 border-gray-600/30 text-white" rows={2} placeholder="Observações sobre a atribuição..." />
              </div>
              <div>
                <Label className="text-gray-400">Instruções Especiais</Label>
                <Textarea value={assignmentForm.specialInstructions} onChange={(e) => setAssignmentForm((p) => ({ ...p, specialInstructions: e.target.value }))} className="bg-seguranca-black/50 border-gray-600/30 text-white" rows={2} placeholder="Instruções especiais para o funcionário..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignmentDialogOpen(false)} className="border-gray-600 text-gray-400 hover:bg-seguranca-graphite">Cancelar</Button>
              <Button onClick={handleSaveAssignment} className="bg-gradient-to-r from-seguranca-red to-seguranca-darkred hover:from-seguranca-darkred hover:to-seguranca-red">
                {editingAssignment ? 'Salvar Alterações' : 'Criar Atribuição'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ==================== BULK ASSIGNMENT DIALOG ==================== */}
        <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-600/50 text-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">⚡ Atribuição em Massa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-gray-400">Funcionários *</Label>
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-600/30 rounded-lg p-2 space-y-1">
                  {employees.map((emp) => (
                    <label key={emp.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={bulkForm.employeeIds.includes(emp.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkForm((p) => ({ ...p, employeeIds: [...p.employeeIds, emp.id] }));
                          } else {
                            setBulkForm((p) => ({ ...p, employeeIds: p.employeeIds.filter((i) => i !== emp.id) }));
                          }
                        }}
                        className="rounded border-gray-600"
                      />
                      {emp.name}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{bulkForm.employeeIds.length} selecionado(s)</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Data Início *</Label>
                  <Input type="date" value={bulkForm.startDate} onChange={(e) => setBulkForm((p) => ({ ...p, startDate: e.target.value }))} className="bg-seguranca-black/50 border-gray-600/30 text-white" />
                </div>
                <div>
                  <Label className="text-gray-400">Data Fim *</Label>
                  <Input type="date" value={bulkForm.endDate} onChange={(e) => setBulkForm((p) => ({ ...p, endDate: e.target.value }))} className="bg-seguranca-black/50 border-gray-600/30 text-white" />
                </div>
              </div>
              <div>
                <Label className="text-gray-400">Tipo de Turno</Label>
                <Select value={bulkForm.shiftType} onValueChange={(v) => setBulkForm((p) => ({ ...p, shiftType: v }))}>
                  <SelectTrigger className="bg-seguranca-black/50 border-gray-600/30 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600/30">
                    <SelectItem value="DAY" className="text-white hover:bg-seguranca-graphite">☀️ Diurno</SelectItem>
                    <SelectItem value="NIGHT" className="text-white hover:bg-seguranca-graphite">🌙 Noturno</SelectItem>
                    <SelectItem value="MIXED" className="text-white hover:bg-seguranca-graphite">🔄 Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Horário Início</Label>
                  <Input type="time" value={bulkForm.startTime} onChange={(e) => setBulkForm((p) => ({ ...p, startTime: e.target.value }))} className="bg-seguranca-black/50 border-gray-600/30 text-white" />
                </div>
                <div>
                  <Label className="text-gray-400">Horário Fim</Label>
                  <Input type="time" value={bulkForm.endTime} onChange={(e) => setBulkForm((p) => ({ ...p, endTime: e.target.value }))} className="bg-seguranca-black/50 border-gray-600/30 text-white" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input type="checkbox" checked={bulkForm.isPrimaryAssignment} onChange={(e) => setBulkForm((p) => ({ ...p, isPrimaryAssignment: e.target.checked }))} className="rounded border-gray-600" />
                Atribuição Principal
              </label>
              {bulkForm.startDate && bulkForm.endDate && bulkForm.employeeIds.length > 0 && (
                <div className="bg-seguranca-black/30 border border-gray-600/30 rounded-lg p-3 text-sm text-gray-400">
                  <p>📋 Serão criadas <span className="text-white font-bold">
                    {(() => {
                      const s = new Date(bulkForm.startDate);
                      const e = new Date(bulkForm.endDate);
                      const days = Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
                      return Math.max(0, days * bulkForm.employeeIds.length);
                    })()}
                  </span> atribuição(ões)</p>
                  <p className="text-xs mt-1">({bulkForm.employeeIds.length} funcionário(s) × {(() => {
                    const s = new Date(bulkForm.startDate);
                    const e = new Date(bulkForm.endDate);
                    return Math.max(0, Math.floor((e.getTime() - s.getTime()) / 86400000) + 1);
                  })()} dia(s))</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkDialogOpen(false)} className="border-gray-600 text-gray-400 hover:bg-seguranca-graphite">Cancelar</Button>
              <Button onClick={handleBulkAssign} className="bg-gradient-to-r from-seguranca-red to-seguranca-darkred hover:from-seguranca-darkred hover:to-seguranca-red">
                <Zap className="mr-2 h-4 w-4" /> Criar Atribuições
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </StandardLayout>
  );
};

// ==================== SUB-COMPONENTS ====================

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, isOpen, onToggle, badge, children }) => (
  <Card className="bg-gradient-to-br from-seguranca-graphite/80 to-seguranca-black/60 border-gray-600/30 overflow-hidden">
    <button onClick={onToggle} className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="font-bold text-lg text-white">{title}</h3>
        {badge}
      </div>
      {isOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
    </button>
    {isOpen && (
      <CardContent className="px-5 pb-5 pt-0 border-t border-gray-700/50">
        <div className="pt-4">{children}</div>
      </CardContent>
    )}
  </Card>
);

interface SpecItemProps {
  label: string;
  value?: string | number | null;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const SpecItem: React.FC<SpecItemProps> = ({ label, value, icon, fullWidth }) => (
  <div className={fullWidth ? 'sm:col-span-2 lg:col-span-3' : ''}>
    <Label className="text-gray-500 text-xs uppercase tracking-wide">{label}</Label>
    <div className="flex items-center gap-2 mt-1">
      {icon}
      <p className="text-white text-sm">{value || '—'}</p>
    </div>
  </div>
);

interface BenefitBadgeProps {
  label: string;
  active?: boolean;
}

const BenefitBadge: React.FC<BenefitBadgeProps> = ({ label, active }) => (
  <div className={`flex items-center gap-2 p-2 rounded-lg border ${active ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-gray-500/5 border-gray-600/20 text-gray-500'}`}>
    {active ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
    <span className="text-xs font-medium">{label}</span>
  </div>
);

interface MiniStatCardProps {
  label: string;
  value: number;
  color: 'yellow' | 'blue' | 'green' | 'gray';
  icon: React.ReactNode;
}

const colorMap = {
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', iconBg: 'bg-yellow-500/20' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', iconBg: 'bg-blue-500/20' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', iconBg: 'bg-green-500/20' },
  gray: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', iconBg: 'bg-gray-500/20' },
};

const MiniStatCard: React.FC<MiniStatCardProps> = ({ label, value, color, icon }) => {
  const c = colorMap[color];
  return (
    <Card className={`${c.bg} ${c.border} border`}>
      <div className="p-4 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs font-medium">{label}</p>
          <p className={`text-2xl font-bold ${c.text} mt-1`}>{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${c.iconBg}`}>{icon}</div>
      </div>
    </Card>
  );
};

export default WorkPostDetailPage;
