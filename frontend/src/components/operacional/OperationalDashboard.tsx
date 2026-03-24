import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import '@/styles/mobile-tabs-sst.css';
import {
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  MapPin,
  Activity,
  Plus,
  Eye,
  Edit,
  Trash2,
  Loader2,
  PlayCircle,
  ArrowRightLeft,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { operationalService, VacationCoverage, Absence, WorkPostAssignment, SpecificActivity, CreateAbsenceDTO, CreateWorkPostAssignmentDTO, CreateSpecificActivityDTO, CreateVacationCoverageDTO } from '@/services/operationalService';
import { remanejamentoService, Remanejamento, CreateRemanejamentoDTO } from '@/services/remanejamentoService';
import operationalReportGenerator from '@/utils/operationalReportGenerator';
import OperationalStatsCards from './OperationalStatsCards';
import AbsenceFormModal from './AbsenceFormModal';
import WorkPostAssignmentFormModal from './WorkPostAssignmentFormModal';
import SpecificActivityFormModal from './SpecificActivityFormModal';
import RemanejamentoFormModal from './RemanejamentoFormModal';
import VacationCoverageFormModal from './VacationCoverageFormModal';
import VacationCoverageStatusModal from './VacationCoverageStatusModal';
import ChangeStatusModal from './ChangeStatusModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';

const OperationalDashboard: React.FC = () => {
  const [vacationCoverages, setVacationCoverages] = useState<VacationCoverage[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [workPostAssignments, setWorkPostAssignments] = useState<WorkPostAssignment[]>([]);
  const [specificActivities, setSpecificActivities] = useState<SpecificActivity[]>([]);
  const [remanejamentos, setRemanejamentos] = useState<Remanejamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  
  // Estados para modais
  const [showVacationCoverageModal, setShowVacationCoverageModal] = useState(false);
  const [selectedVacationCoverage, setSelectedVacationCoverage] = useState<VacationCoverage | null>(null);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<WorkPostAssignment | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<SpecificActivity | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [assignmentToChangeStatus, setAssignmentToChangeStatus] = useState<WorkPostAssignment | null>(null);
  const [showDeleteVacationCoverageModal, setShowDeleteVacationCoverageModal] = useState(false);
  const [vacationCoverageToDelete, setVacationCoverageToDelete] = useState<VacationCoverage | null>(null);
  const [showVacationStatusModal, setShowVacationStatusModal] = useState(false);
  const [vacationCoverageToChangeStatus, setVacationCoverageToChangeStatus] = useState<VacationCoverage | null>(null);
  const [showDeleteAbsenceModal, setShowDeleteAbsenceModal] = useState(false);
  const [absenceToDelete, setAbsenceToDelete] = useState<Absence | null>(null);
  const [showDeleteAssignmentModal, setShowDeleteAssignmentModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<WorkPostAssignment | null>(null);
  const [showDeleteActivityModal, setShowDeleteActivityModal] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<SpecificActivity | null>(null);
  const [showRemanejamentoModal, setShowRemanejamentoModal] = useState(false);
  const [selectedRemanejamento, setSelectedRemanejamento] = useState<Remanejamento | null>(null);
  const [showDeleteRemanejamentoModal, setShowDeleteRemanejamentoModal] = useState(false);
  const [remanejamentoToDelete, setRemanejamentoToDelete] = useState<Remanejamento | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [coverages, absenceList, assignments, activities, remanejamentosList, employeesData] = await Promise.all([
        operationalService.getAllVacationCoverages(),
        operationalService.getAllAbsences(),
        operationalService.getAllWorkPostAssignments(),
        operationalService.getAllSpecificActivities(),
        remanejamentoService.getAllRemanejamentos(),
        loadEmployees()
      ]);

      setVacationCoverages(coverages);
      setAbsences(absenceList);
      setWorkPostAssignments(assignments);
      setSpecificActivities(activities);
      setRemanejamentos(remanejamentosList);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Erro ao carregar dados operacionais:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados operacionais.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async (): Promise<Array<{ id: string; name: string }>> => {
    try {
      const response = await fetch('/api/employees/basic');
      const data = await response.json();
      return data.employees || [];
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      return [];
    }
  };

  // Handlers para Absences
  const handleCreateAbsence = () => {
    setSelectedAbsence(null);
    setShowAbsenceModal(true);
  };

  const handleEditAbsence = (absence: Absence) => {
    setSelectedAbsence(absence);
    setShowAbsenceModal(true);
  };

  // Handlers para Vacation Coverage
  const handleCreateVacationCoverage = () => {
    setSelectedVacationCoverage(null);
    setShowVacationCoverageModal(true);
  };

  const handleEditVacationCoverage = (coverage: VacationCoverage) => {
    setSelectedVacationCoverage(coverage);
    setShowVacationCoverageModal(true);
  };

  const handleDeleteVacationCoverage = (coverage: VacationCoverage) => {
    setVacationCoverageToDelete(coverage);
    setShowDeleteVacationCoverageModal(true);
  };

  const confirmDeleteVacationCoverage = async () => {
    if (!vacationCoverageToDelete) return;
    
    try {
      await operationalService.deleteVacationCoverage(vacationCoverageToDelete.id);
      setVacationCoverages(prev => prev.filter(v => v.id !== vacationCoverageToDelete.id));
      toast({
        title: 'Sucesso',
        description: 'Cobertura de férias excluída com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir cobertura.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitVacationCoverage = async (data: CreateVacationCoverageDTO) => {
    try {
      if (selectedVacationCoverage) {
        // Atualizar
        const updated = await operationalService.updateVacationCoverage(selectedVacationCoverage.id, data);
        setVacationCoverages(prev => prev.map(v => v.id === selectedVacationCoverage.id ? updated : v));
        toast({
          title: 'Sucesso',
          description: 'Cobertura de férias atualizada com sucesso.',
        });
      } else {
        // Criar
        const created = await operationalService.createVacationCoverage(data);
        setVacationCoverages(prev => [created, ...prev]);
        toast({
          title: 'Sucesso',
          description: 'Cobertura de férias criada com sucesso.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar cobertura de férias.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleChangeVacationCoverageStatus = (coverage: VacationCoverage) => {
    setVacationCoverageToChangeStatus(coverage);
    setShowVacationStatusModal(true);
  };

  const handleConfirmVacationStatusChange = async (newStatus: string) => {
    if (!vacationCoverageToChangeStatus) return;

    try {
      // Mapear status do frontend para o backend
      const statusMap: Record<string, string> = {
        'PENDING': 'PENDING',
        'CONFIRMED': 'CONFIRMED',
        'NO_COVERAGE': 'NO_COVERAGE',
        'COMPLETED': 'COMPLETED',
        'CANCELLED': 'CANCELLED'
      };
      
      const backendStatus = statusMap[newStatus] || newStatus;
      await operationalService.updateVacationCoverageStatus(vacationCoverageToChangeStatus.id, backendStatus);

      // Atualizar lista
      const updatedCoverages = await operationalService.getAllVacationCoverages();
      setVacationCoverages(updatedCoverages);
      
      // Mapear label do status para exibição
      const statusLabels: Record<string, string> = {
        'PENDING': 'Pendente',
        'CONFIRMED': 'Confirmado',
        'NO_COVERAGE': 'Sem Cobertura',
        'COMPLETED': 'Concluído',
        'CANCELLED': 'Cancelado'
      };

      toast({
        title: 'Sucesso',
        description: `Status alterado para "${statusLabels[newStatus] || newStatus}" com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status da cobertura.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAbsence = (absence: Absence) => {
    setAbsenceToDelete(absence);
    setShowDeleteAbsenceModal(true);
  };

  const confirmDeleteAbsence = async () => {
    if (!absenceToDelete) return;
    
    try {
      await operationalService.deleteAbsence(absenceToDelete.id);
      setAbsences(prev => prev.filter(a => a.id !== absenceToDelete.id));
      toast({
        title: 'Sucesso',
        description: 'Falta excluída com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir falta.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitAbsence = async (data: CreateAbsenceDTO) => {
    try {
      console.log('📤 Enviando dados da falta:', data);
      
      if (selectedAbsence) {
        // Atualizar
        console.log('🔄 Atualizando falta:', selectedAbsence.id);
        const updated = await operationalService.updateAbsence(selectedAbsence.id, data);
        setAbsences(prev => prev.map(a => a.id === selectedAbsence.id ? updated : a));
        setSelectedAbsence(null);
      } else {
        // Criar
        console.log('➕ Criando nova falta');
        const created = await operationalService.createAbsence(data);
        console.log('✅ Falta criada:', created);
        setAbsences(prev => [created, ...prev]);
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar falta:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Erro ao salvar falta. Verifique os dados e tente novamente.';
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error; // Re-throw para que o modal possa tratar também
    }
  };

  // Handlers para Work Post Assignments
  const handleCreateAssignment = () => {
    setSelectedAssignment(null);
    setShowAssignmentModal(true);
  };

  const handleEditAssignment = (assignment: WorkPostAssignment) => {
    setSelectedAssignment(assignment);
    setShowAssignmentModal(true);
  };

  const handleDeleteAssignment = (assignment: WorkPostAssignment) => {
    setAssignmentToDelete(assignment);
    setShowDeleteAssignmentModal(true);
  };

  const confirmDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    
    try {
      await operationalService.deleteWorkPostAssignment(assignmentToDelete.id);
      // Atualizar apenas a lista de atribuições sem mudar de aba
      setWorkPostAssignments(prev => prev.filter(a => a.id !== assignmentToDelete.id));
      toast({
        title: 'Sucesso',
        description: 'Atribuição excluída com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir atribuição.',
        variant: 'destructive',
      });
    }
  };

  // Handlers para Specific Activities
  const handleCreateActivity = () => {
    setSelectedActivity(null);
    setShowActivityModal(true);
  };

  const handleEditActivity = (activity: SpecificActivity) => {
    setSelectedActivity(activity);
    setShowActivityModal(true);
  };

  const handleDeleteActivity = (activity: SpecificActivity) => {
    setActivityToDelete(activity);
    setShowDeleteActivityModal(true);
  };

  const confirmDeleteActivity = async () => {
    if (!activityToDelete) return;
    
    try {
      await operationalService.deleteSpecificActivity(activityToDelete.id);
      setSpecificActivities(prev => prev.filter(a => a.id !== activityToDelete.id));
      toast({
        title: 'Sucesso',
        description: 'Atividade excluída com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir atividade.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitActivity = async (data: CreateSpecificActivityDTO) => {
    try {
      if (selectedActivity) {
        // Atualizar
        const updated = await operationalService.updateSpecificActivity(selectedActivity.id, data);
        setSpecificActivities(prev => prev.map(a => a.id === selectedActivity.id ? updated : a));
        toast({
          title: 'Sucesso',
          description: 'Atividade atualizada com sucesso.',
        });
      } else {
        // Criar
        const created = await operationalService.createSpecificActivity(data);
        setSpecificActivities(prev => [created, ...prev]);
        toast({
          title: 'Sucesso',
          description: 'Atividade criada com sucesso.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar atividade.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Handlers para Remanejamentos
  const handleCreateRemanejamento = () => {
    setSelectedRemanejamento(null);
    setShowRemanejamentoModal(true);
  };

  const handleEditRemanejamento = (remanejamento: Remanejamento) => {
    setSelectedRemanejamento(remanejamento);
    setShowRemanejamentoModal(true);
  };

  const handleDeleteRemanejamento = (remanejamento: Remanejamento) => {
    setRemanejamentoToDelete(remanejamento);
    setShowDeleteRemanejamentoModal(true);
  };

  const confirmDeleteRemanejamento = async () => {
    if (!remanejamentoToDelete) return;
    
    try {
      await remanejamentoService.deleteRemanejamento(remanejamentoToDelete.id);
      setRemanejamentos(prev => prev.filter(r => r.id !== remanejamentoToDelete.id));
      toast({
        title: 'Sucesso',
        description: 'Remanejamento excluído com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir remanejamento.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitRemanejamento = async (data: CreateRemanejamentoDTO) => {
    try {
      if (selectedRemanejamento) {
        // Atualizar
        const updated = await remanejamentoService.updateRemanejamento(selectedRemanejamento.id, data);
        setRemanejamentos(prev => prev.map(r => r.id === selectedRemanejamento.id ? updated : r));
        toast({
          title: 'Sucesso',
          description: 'Remanejamento atualizado com sucesso.',
        });
      } else {
        // Criar
        const created = await remanejamentoService.createRemanejamento(data);
        setRemanejamentos(prev => [created, ...prev]);
        toast({
          title: 'Sucesso',
          description: 'Remanejamento criado com sucesso.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar remanejamento.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Funções para gerar relatórios em PDF
  const handleGenerateVacationCoverageReport = async () => {
    try {
      const blob = await operationalReportGenerator.generateVacationCoverageReport(vacationCoverages);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-cobertura-ferias-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Sucesso',
        description: 'Relatório de Cobertura de Férias gerado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório PDF. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateAbsenceReport = async () => {
    try {
      const blob = await operationalReportGenerator.generateAbsenceReport(absences);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-controle-faltas-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Sucesso',
        description: 'Relatório de Controle de Faltas gerado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório PDF. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateWorkPostAssignmentReport = async () => {
    try {
      const blob = await operationalReportGenerator.generateWorkPostAssignmentReport(workPostAssignments);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-atribuicoes-posto-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Sucesso',
        description: 'Relatório de Atribuições de Posto gerado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório PDF. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateSpecificActivityReport = async () => {
    try {
      const blob = await operationalReportGenerator.generateSpecificActivityReport(specificActivities);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-atividades-especificas-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Sucesso',
        description: 'Relatório de Atividades Específicas gerado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório PDF. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateRemanejamentoReport = async () => {
    try {
      const blob = await operationalReportGenerator.generateRemanejamentoReport(remanejamentos);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-remanejamentos-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Sucesso',
        description: 'Relatório de Remanejamentos gerado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório PDF. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitAssignment = async (data: CreateWorkPostAssignmentDTO) => {
    try {
      if (selectedAssignment) {
        // Atualizar
        const updated = await operationalService.updateWorkPostAssignment(selectedAssignment.id, data);
        // Atualizar apenas a lista de atribuições sem mudar de aba
        setWorkPostAssignments(prev => prev.map(a => a.id === selectedAssignment.id ? updated : a));
        toast({
          title: 'Sucesso',
          description: 'Atribuição atualizada com sucesso.',
        });
      } else {
        // Criar
        const created = await operationalService.createWorkPostAssignment(data);
        // Adicionar nova atribuição ao topo da lista sem mudar de aba
        setWorkPostAssignments(prev => [created, ...prev]);
        toast({
          title: 'Sucesso',
          description: 'Atribuição criada com sucesso.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar atribuição.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getStatusBadge = (status: string) => {
    // Mapeamento de status para exibição com ícones
    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      // Status de Atribuições de Posto
      'SCHEDULED': { 
        label: 'Pendente', 
        className: 'bg-yellow-500 hover:bg-yellow-600 text-white font-medium shadow-md',
        icon: <Clock className="h-3.5 w-3.5" />
      },
      'CONFIRMED': { 
        label: 'Confirmado', 
        className: 'bg-green-500 hover:bg-green-600 text-white font-medium shadow-md',
        icon: <CheckCircle className="h-3.5 w-3.5" />
      },
      'ACTIVE': { 
        label: 'Ativo', 
        className: 'bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-md',
        icon: <PlayCircle className="h-3.5 w-3.5" />
      },
      'COMPLETED': { 
        label: 'Concluído', 
        className: 'bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md',
        icon: <CheckCircle className="h-3.5 w-3.5" />
      },
      'CANCELLED': { 
        label: 'Cancelado', 
        className: 'bg-red-500 hover:bg-red-600 text-white font-medium shadow-md',
        icon: <XCircle className="h-3.5 w-3.5" />
      },
      
      // Status de Cobertura de Férias e outros
      'PENDING': { 
        label: 'Pendente', 
        className: 'bg-yellow-500 hover:bg-yellow-600 text-white font-medium shadow-md',
        icon: <Clock className="h-3.5 w-3.5" />
      },
      'NO_COVERAGE': { 
        label: 'Sem Cobertura', 
        className: 'bg-red-500 hover:bg-red-600 text-white font-medium shadow-md',
        icon: <AlertTriangle className="h-3.5 w-3.5" />
      },
      'APPROVED': { 
        label: 'Aprovado', 
        className: 'bg-green-500 hover:bg-green-600 text-white font-medium shadow-md',
        icon: <CheckCircle className="h-3.5 w-3.5" />
      },
      'REJECTED': { 
        label: 'Rejeitado', 
        className: 'bg-red-500 hover:bg-red-600 text-white font-medium shadow-md',
        icon: <XCircle className="h-3.5 w-3.5" />
      },
      'IN_PROGRESS': { 
        label: 'Em Andamento', 
        className: 'bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-md',
        icon: <PlayCircle className="h-3.5 w-3.5" />
      },
    };

    const config = statusConfig[status] || { 
      label: status, 
      className: 'bg-gray-500 hover:bg-gray-600 text-white font-medium shadow-md',
      icon: <AlertTriangle className="h-3.5 w-3.5" />
    };

    return (
      <Badge 
        variant="default" 
        className={`${config.className} transition-colors cursor-pointer px-3 py-1.5 flex items-center gap-1.5`}
      >
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM
  };

  const formatShift = (shift: string) => {
    const shiftLabels: Record<string, string> = {
      'DAY': 'Diurno',
      'NIGHT': 'Noturno',
      'MIXED': 'Misto',
      'NOTURNO': 'Noturno',
      'MORNING': 'Matutino',
      'AFTERNOON': 'Vespertino',
      'EXTENDED': 'Estendido'
    };
    return shiftLabels[shift] || shift;
  };

  const formatActivityType = (type: string) => {
    const typeLabels: Record<string, string> = {
      'CLEANING': 'Limpeza',
      'GLASS_CLEANING': 'Limpeza de Vidros',
      'LAWN_MOWING': 'Poda de Grama',
      'RECYCLING': 'Reciclagem',
      'MAINTENANCE': 'Manutenção',
      'SECURITY_PATROL': 'Ronda de Segurança',
      'EQUIPMENT_CHECK': 'Verificação de Equipamentos',
      'SPECIAL_EVENT': 'Evento Especial',
      'TRAINING': 'Treinamento',
      'MEETING': 'Reunião',
      'OTHER': 'Outros'
    };
    return typeLabels[type] || type;
  };

  const formatRemanejamentoType = (type: string) => {
    const typeLabels: Record<string, string> = {
      'TRANSFERENCIA_UNIDADE': 'Transferência de Unidade',
      'TRANSFERENCIA_POSTO_TRABALHO': 'Transferência de Posto',
      'TROCA_FUNCAO': 'Troca de Função',
      'PROMOCAO': 'Promoção',
      'COBRIR_FERIAS': 'Cobertura de Férias',
      'COBRIR_FALTA': 'Cobertura de Falta',
      'PLANTAO': 'Plantão Extra',
      'OUTROS': 'Outros'
    };
    return typeLabels[type] || type;
  };

  const handleChangeAssignmentStatus = (assignment: WorkPostAssignment) => {
    setAssignmentToChangeStatus(assignment);
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = async (newStatus: string) => {
    if (!assignmentToChangeStatus) return;

    try {
      // Usar o endpoint genérico que aceita todos os status
      await operationalService.updateAssignmentStatus(assignmentToChangeStatus.id, newStatus);

      // Atualizar apenas as atribuições ao invés de recarregar tudo
      const updatedAssignments = await operationalService.getAllWorkPostAssignments();
      setWorkPostAssignments(updatedAssignments);
      
      // Mapear label do status para exibição
      const statusLabels: Record<string, string> = {
        'SCHEDULED': 'Pendente',
        'CONFIRMED': 'Confirmado',
        'ACTIVE': 'Ativo',
        'COMPLETED': 'Concluído',
        'CANCELLED': 'Cancelado'
      };

      toast({
        title: 'Sucesso',
        description: `Status alterado para "${statusLabels[newStatus] || newStatus}" com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status da atribuição.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados operacionais...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Operacionais */}
      <OperationalStatsCards />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestão Operacional Detalhada</h2>
        <Button onClick={loadAllData} variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="vacations" className="space-y-4">
        {/* Tabs com Padrão SST Mobile */}
        <TooltipProvider>
          <div className="relative overflow-hidden rounded-lg glass-card border-slate-700/50 shadow-xl">
            <TabsList className="
              w-full
              flex md:grid
              overflow-x-auto md:overflow-x-visible
              md:grid-cols-5
              glass-card border-0
              p-2
              gap-2
              min-h-[100px] md:min-h-[80px]
              scrollbar-hide
            ">
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="vacations" 
                    className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                  >
                    <Calendar className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                    <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Férias</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                  <p className="font-semibold">Cobertura de Férias</p>
                  <p className="text-xs text-gray-400">Gestão de férias e substituições</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="absences" 
                    className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                  >
                    <UserX className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                    <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Faltas</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                  <p className="font-semibold">Controle de Faltas</p>
                  <p className="text-xs text-gray-400">Registro e justificativas</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="assignments" 
                    className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                  >
                    <MapPin className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                    <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Postos</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                  <p className="font-semibold">Atribuições de Posto</p>
                  <p className="text-xs text-gray-400">Alocação de funcionários</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="activities" 
                    className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                  >
                    <Activity className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                    <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Atividades</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                  <p className="font-semibold">Atividades Específicas</p>
                  <p className="text-xs text-gray-400">Tarefas e eventos especiais</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger 
                    value="remanejamentos" 
                    className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                  >
                    <ArrowRightLeft className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                    <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Remanejamento</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                  <p className="font-semibold">Remanejamentos</p>
                  <p className="text-xs text-gray-400">Transferências e mudanças de função</p>
                </TooltipContent>
              </Tooltip>

            </TabsList>
          </div>
        </TooltipProvider>

        {/* Aba de Cobertura de Férias */}
        <TabsContent value="vacations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Cobertura de Férias ({vacationCoverages.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button onClick={handleGenerateVacationCoverageReport} size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                  <Button onClick={handleCreateVacationCoverage} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Cobertura
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vacationCoverages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma cobertura de férias encontrada.
                  </p>
                ) : (
                  vacationCoverages.map(coverage => (
                    <div key={coverage.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-semibold text-base">
                          {coverage.employee?.name || 'Funcionário não definido'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="h-4 w-4 text-blue-400" />
                          <p className="text-sm text-muted-foreground">
                            Substituto: <strong>{coverage.substituteEmployee?.name || 'Sem substituto'}</strong>
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(coverage.startDate)} - {formatDate(coverage.endDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Turno: <strong>{formatShift(coverage.shift)}</strong>
                          </span>
                          {coverage.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {coverage.location.name}
                            </span>
                          )}
                        </div>
                        {coverage.observations && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            💬 {coverage.observations}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="cursor-pointer"
                          onClick={() => handleChangeVacationCoverageStatus(coverage)}
                          title="Clique para alterar o status"
                        >
                          {getStatusBadge(coverage.status)}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditVacationCoverage(coverage)}
                          title="Editar cobertura"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteVacationCoverage(coverage)}
                          title="Excluir cobertura"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Controle de Faltas */}
        <TabsContent value="absences" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5" />
                  Controle de Faltas ({absences.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button onClick={handleGenerateAbsenceReport} size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                  <Button onClick={handleCreateAbsence} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Falta
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {absences.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma falta registrada.
                  </p>
                ) : (
                  absences.map(absence => (
                    <div key={absence.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                      <div className="flex-1">
                        <p className="font-medium">
                          {absence.employee?.name || 'Funcionário não definido'} ({formatDate(absence.absenceDate)})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Tipo: {absence.absenceType.replace('_', ' ')} | 
                          Motivo: {absence.reason}
                          {absence.medicalCertificateDays && ` | Dias: ${absence.medicalCertificateDays}`}
                        </p>
                        {absence.coverageNotes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Observações: {absence.coverageNotes}
                          </p>
                        )}
                        {absence.coverageEmployee && (
                          <p className="text-xs text-muted-foreground">
                            Coberto por: {absence.coverageEmployee?.name || 'Não definido'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(absence.status)}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditAbsence(absence)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteAbsence(absence)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Atribuições de Posto */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Atribuições de Posto ({workPostAssignments.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button onClick={handleGenerateWorkPostAssignmentReport} size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                  <Button onClick={handleCreateAssignment} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Atribuição
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workPostAssignments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma atribuição de posto encontrada.
                  </p>
                ) : (
                  workPostAssignments.map(assignment => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-semibold text-base">
                          {assignment.employee?.name || 'Funcionário não definido'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-4 w-4 text-seguranca-red" />
                          <p className="text-sm text-muted-foreground font-medium">
                            {assignment.workPost?.name || 'Posto não definido'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(assignment.assignmentDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Turno: <strong>{formatShift(assignment.shift)}</strong>
                          </span>
                          {assignment.startTime && assignment.endTime && (
                            <span>
                              Horário: {formatTime(assignment.startTime)} - {formatTime(assignment.endTime)}
                            </span>
                          )}
                        </div>
                        {assignment.observations && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            💬 {assignment.observations}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="cursor-pointer"
                          onClick={() => handleChangeAssignmentStatus(assignment)}
                          title="Clique para alterar o status"
                        >
                          {getStatusBadge(assignment.status)}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditAssignment(assignment)}
                          title="Editar atribuição"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteAssignment(assignment)}
                          title="Excluir atribuição"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Atividades Específicas */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Atividades Específicas ({specificActivities.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button onClick={handleGenerateSpecificActivityReport} size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                  <Button onClick={handleCreateActivity} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Atividade
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {specificActivities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma atividade específica encontrada.
                  </p>
                ) : (
                  specificActivities.map(activity => (
                    <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-seguranca-red/20 text-seguranca-red px-2 py-1 rounded text-xs font-semibold">
                            {formatActivityType(activity.activityType)}
                          </span>
                        </div>
                        <p className="font-semibold text-base">
                          {activity.employee?.name || 'Funcionário não definido'}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(activity.activityDate)}
                          </span>
                          {activity.startTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatTime(activity.startTime)}
                              {activity.endTime && ` - ${formatTime(activity.endTime)}`}
                            </span>
                          )}
                          {activity.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {activity.location.name}
                            </span>
                          )}
                        </div>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            📝 {activity.description}
                          </p>
                        )}
                        {activity.observations && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            💬 {activity.observations}
                          </p>
                        )}
                        {activity.completionNotes && (
                          <p className="text-xs text-green-600 mt-1">
                            ✅ {activity.completionNotes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(activity.status)}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditActivity(activity)}
                          title="Editar atividade"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteActivity(activity)}
                          title="Excluir atividade"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Remanejamentos */}
        <TabsContent value="remanejamentos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Remanejamentos ({remanejamentos.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button onClick={handleGenerateRemanejamentoReport} size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                  <Button onClick={handleCreateRemanejamento} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Remanejamento
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {remanejamentos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum remanejamento encontrado.
                  </p>
                ) : (
                  remanejamentos.map(remanejamento => (
                    <div key={remanejamento.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-semibold">
                            {formatRemanejamentoType(remanejamento.tipo)}
                          </span>
                        </div>
                        <p className="font-semibold text-base">
                          {remanejamento.employeeName || 'Funcionário não definido'}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(remanejamento.dataRemanejamento)}
                          </span>
                          <span className="flex items-center gap-1">
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                            De: <strong>{remanejamento.origem}</strong> → Para: <strong>{remanejamento.destino}</strong>
                          </span>
                        </div>
                        {remanejamento.observacao && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            💬 {remanejamento.observacao}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditRemanejamento(remanejamento)}
                          title="Editar remanejamento"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteRemanejamento(remanejamento)}
                          title="Excluir remanejamento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Cobertura de Férias */}
      <VacationCoverageFormModal
        open={showVacationCoverageModal}
        onOpenChange={setShowVacationCoverageModal}
        coverage={selectedVacationCoverage}
        onSubmit={handleSubmitVacationCoverage}
        employees={employees}
      />

      {/* Modal de Falta */}
      <AbsenceFormModal
        open={showAbsenceModal}
        onOpenChange={setShowAbsenceModal}
        absence={selectedAbsence}
        onSubmit={handleSubmitAbsence}
        employees={employees}
      />

      {/* Modal de Atribuição de Posto */}
      <WorkPostAssignmentFormModal
        open={showAssignmentModal}
        onOpenChange={setShowAssignmentModal}
        assignment={selectedAssignment}
        onSubmit={handleSubmitAssignment}
        employees={employees}
      />

      {/* Modal de Alteração de Status - Atribuição */}
      <ChangeStatusModal
        open={showStatusModal}
        onOpenChange={setShowStatusModal}
        currentStatus={assignmentToChangeStatus?.status || ''}
        onConfirm={handleConfirmStatusChange}
        title="Alterar Status da Atribuição"
      />

      {/* Modal de Alteração de Status - Cobertura de Férias */}
      <VacationCoverageStatusModal
        open={showVacationStatusModal}
        onOpenChange={setShowVacationStatusModal}
        currentStatus={vacationCoverageToChangeStatus?.status || ''}
        onConfirm={handleConfirmVacationStatusChange}
      />

      {/* Modal de Confirmação de Exclusão - Cobertura de Férias */}
      <ConfirmDeleteModal
        open={showDeleteVacationCoverageModal}
        onOpenChange={setShowDeleteVacationCoverageModal}
        onConfirm={confirmDeleteVacationCoverage}
        title="Excluir Cobertura de Férias"
        description="Tem certeza que deseja excluir esta cobertura de férias?"
        itemName={vacationCoverageToDelete ? `${vacationCoverageToDelete.employee?.name} (${formatDate(vacationCoverageToDelete.startDate)} - ${formatDate(vacationCoverageToDelete.endDate)})` : ''}
      />

      {/* Modal de Confirmação de Exclusão - Falta */}
      <ConfirmDeleteModal
        open={showDeleteAbsenceModal}
        onOpenChange={setShowDeleteAbsenceModal}
        onConfirm={confirmDeleteAbsence}
        title="Excluir Falta"
        description="Tem certeza que deseja excluir esta falta?"
        itemName={absenceToDelete ? `${absenceToDelete.employee?.name} - ${formatDate(absenceToDelete.absenceDate)}` : ''}
      />

      {/* Modal de Confirmação de Exclusão - Atribuição */}
      <ConfirmDeleteModal
        open={showDeleteAssignmentModal}
        onOpenChange={setShowDeleteAssignmentModal}
        onConfirm={confirmDeleteAssignment}
        title="Excluir Atribuição"
        description="Tem certeza que deseja excluir esta atribuição de posto?"
        itemName={assignmentToDelete ? `${assignmentToDelete.employee?.name} - ${assignmentToDelete.workPost?.name}` : ''}
      />

      {/* Modal de Atividade Específica */}
      <SpecificActivityFormModal
        open={showActivityModal}
        onOpenChange={setShowActivityModal}
        activity={selectedActivity}
        onSubmit={handleSubmitActivity}
        employees={employees}
      />

      {/* Modal de Confirmação de Exclusão - Atividade */}
      <ConfirmDeleteModal
        open={showDeleteActivityModal}
        onOpenChange={setShowDeleteActivityModal}
        onConfirm={confirmDeleteActivity}
        title="Excluir Atividade"
        description="Tem certeza que deseja excluir esta atividade específica?"
        itemName={activityToDelete ? `${formatActivityType(activityToDelete.activityType)} - ${activityToDelete.employee?.name}` : ''}
      />

      {/* Modal de Remanejamento */}
      <RemanejamentoFormModal
        open={showRemanejamentoModal}
        onOpenChange={setShowRemanejamentoModal}
        remanejamento={selectedRemanejamento}
        onSubmit={handleSubmitRemanejamento}
        employees={employees}
      />

      {/* Modal de Confirmação de Exclusão - Remanejamento */}
      <ConfirmDeleteModal
        open={showDeleteRemanejamentoModal}
        onOpenChange={setShowDeleteRemanejamentoModal}
        onConfirm={confirmDeleteRemanejamento}
        title="Excluir Remanejamento"
        description="Tem certeza que deseja excluir este remanejamento?"
        itemName={remanejamentoToDelete ? `${formatRemanejamentoType(remanejamentoToDelete.tipo)} - ${remanejamentoToDelete.employeeName}` : ''}
      />
    </div>
  );
};

export default OperationalDashboard;