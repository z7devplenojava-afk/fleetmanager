import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import '@/styles/operacional-background.css';
import '@/styles/mobile-tabs-sst.css';
import {
  Shield,
  Users,
  MapPin,
  Clock,
  AlertTriangle,
  BarChart3,
  FileText,
  Settings,
  Eye,
  Plus,
  Activity,
  Bell,
  Calendar,
  Briefcase,
  ClipboardList,
  LayoutDashboard,
  Truck,
  UserCheck,
  PackageCheck,
  Calculator
} from 'lucide-react';
import { StandardLayout } from '@/components/StandardLayout';
import Equipamentos from './Equipamentos';
import ServiceRatingManagement from './transport/ServiceRatingManagement';

import EscalaTrabalhoTable from '@/components/operacional/EscalaTrabalhoTable';
import NotificacoesList from '@/components/operacional/NotificacoesList';
import OcorrenciasTable from '@/components/operacional/OcorrenciasTable';
import OcorrenciaFormModal from '@/components/operacional/OcorrenciaFormModal';
import OcorrenciaViewModal from '@/components/operacional/OcorrenciaViewModal';
import ConfirmDeleteModal from '@/components/operacional/ConfirmDeleteModal';
import EscalaFormModal from '@/components/EscalaFormModal';
import TransportGuideTab from '@/components/operacional/TransportGuideTab';
import VisitWidget from '@/components/operacional/VisitWidget';
import DailyLogTable from '@/components/operacional/DailyLogTable';
import DailyLogFormModal from '@/components/operacional/DailyLogFormModal';

import dailyLogService, { DailyLog } from '@/services/dailyLogService';
import DailyLogAuditModal from '@/components/operacional/DailyLogAuditModal';
import SstCompliancePanel from '@/components/operacional/SstCompliancePanel';
import { ShieldCheck } from 'lucide-react';
import { scheduleService, Schedule, CreateScheduleDTO, UpdateScheduleDTO, ScheduleStatus } from '@/services/scheduleService';

// Interface para o formulário de escala
interface EscalaFormData {
  employeeId: string;
  locationId: string;
  workPostId: string;
  scheduleDate: Date;
  shift: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  observations: string;
}
import { notificationService, NotificationData } from '@/services/notificationService';
import { occurrenceService, Occurrence } from '@/services/occurrenceService';
import { activityReportService } from '@/services/activityReportService';
import { ActivityReport, CreateActivityReportDTO, ActivityReportFilters } from '@/types/activityReport';
import ActivityReportsTable from '@/components/operacional/ActivityReportsTable';
import ActivityReportModal from '@/components/operacional/ActivityReportModal';
import ActivityReportViewModal from '@/components/operacional/ActivityReportViewModal';
import ShiftChangeTable from '@/components/operacional/ShiftChangeTable';
import OrderOfServiceTable from '@/components/operacional/OrderOfServiceTable';
import OrderOfServiceFormModal from '@/components/operacional/OrderOfServiceFormModal';
import OrdemServicoViewModal from '@/components/ordemServico/OrdemServicoViewModal';
import OperationalDashboard from '@/components/operacional/OperationalDashboard';
import VisitDashboard from '@/components/visits/VisitDashboard';
import NotificationSettingsModal from '@/components/operacional/NotificationSettingsModal';
import { orderOfServiceService, OrderOfService, CreateOrderOfServiceRequest } from '@/services/orderOfServiceService';
import { useToast } from '@/hooks/use-toast';

const Operacional: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [escalas, setEscalas] = useState<Schedule[]>([]);
  const [isLoadingEscalas, setIsLoadingEscalas] = useState(false);
  const [notificacoes, setNotificacoes] = useState<NotificationData[]>([]);
  const [isLoadingNotificacoes, setIsLoadingNotificacoes] = useState(false);
  const [ocorrencias, setOcorrencias] = useState<Occurrence[]>([]);
  const [isLoadingOcorrencias, setIsLoadingOcorrencias] = useState(false);
  const [showOcorrenciaModal, setShowOcorrenciaModal] = useState(false);
  const [showOcorrenciaViewModal, setShowOcorrenciaViewModal] = useState(false);
  const [showDeleteOcorrenciaModal, setShowDeleteOcorrenciaModal] = useState(false);
  const [ocorrenciaToDelete, setOcorrenciaToDelete] = useState<Occurrence | null>(null);
  const [activityReports, setActivityReports] = useState<ActivityReport[]>([]);
  const [isLoadingActivityReports, setIsLoadingActivityReports] = useState(false);
  const [showActivityReportModal, setShowActivityReportModal] = useState(false);
  const [showActivityReportViewModal, setShowActivityReportViewModal] = useState(false);
  const [selectedActivityReport, setSelectedActivityReport] = useState<ActivityReport | null>(null);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<Occurrence | null>(null);
  const [showEscalaModal, setShowEscalaModal] = useState(false);
  const [selectedEscala, setSelectedEscala] = useState<Schedule | null>(null);
  const [showDeleteEscalaModal, setShowDeleteEscalaModal] = useState(false);
  const [escalaToDelete, setEscalaToDelete] = useState<Schedule | null>(null);
  const [ordersOfService, setOrdersOfService] = useState<OrderOfService[]>([]);
  const [isLoadingOrdersOfService, setIsLoadingOrdersOfService] = useState(false);
  const [showOrderOfServiceModal, setShowOrderOfServiceModal] = useState(false);
  const [showOrderOfServiceViewModal, setShowOrderOfServiceViewModal] = useState(false);
  const [selectedOrderOfService, setSelectedOrderOfService] = useState<OrderOfService | null>(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [isLoadingDailyLogs, setIsLoadingDailyLogs] = useState(false);
  // PRD Módulo 5: auditoria da Parte Diária (assinatura fiscal, telemetria, viagem extra)
  const [auditLog, setAuditLog] = useState<DailyLog | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showDailyLogModal, setShowDailyLogModal] = useState(false);
  const [selectedDailyLog, setSelectedDailyLog] = useState<DailyLog | null>(null);
  const [showDailyLogViewModal, setShowDailyLogViewModal] = useState(false);

  const { toast } = useToast();







  // Reage a mudanças no parâmetro de URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'escalas') {
      loadEscalas();
    } else if (activeTab === 'notificacoes') {
      loadNotificacoes();
    } else if (activeTab === 'ocorrencias') {
      loadOcorrencias();
    } else if (activeTab === 'atividades') {
      loadActivityReports();
    } else if (activeTab === 'servicos') {
      loadOrdersOfService();
    } else if (activeTab === 'parte-diaria') {
      loadDailyLogs();
    }
  }, [activeTab]);

  const loadEscalas = async () => {
    setIsLoadingEscalas(true);
    try {
      console.log('🔍 Tentando carregar escalas do backend...');
      const data = await scheduleService.findAll();
      console.log('📦 Dados recebidos do backend:', data);
      console.log('📦 Tipo dos dados:', typeof data);
      console.log('📦 É array?', Array.isArray(data));
      console.log('📦 Quantidade:', Array.isArray(data) ? data.length : 'N/A');

      if (Array.isArray(data) && data.length > 0) {
        console.log('📦 Primeira escala:', data[0]);
      }

      setEscalas(Array.isArray(data) ? data : []);
      console.log('✅ Escalas carregadas do backend:', Array.isArray(data) ? data.length : 0);

      if (Array.isArray(data) && data.length > 0) {
        toast({
          title: 'Sucesso',
          description: `${data.length} escala${data.length > 1 ? 's' : ''} carregada${data.length > 1 ? 's' : ''} do servidor.`,
          variant: 'default',
        });
      } else {
        console.warn('⚠️ Nenhuma escala retornada do backend');
      }
    } catch (error: any) {
      console.error('❌ Erro detalhado ao carregar escalas:', error);
      console.error('❌ Erro completo:', JSON.stringify(error, null, 2));
      setEscalas([]);
      toast({
        title: 'Erro de Integração',
        description: `Falha ao conectar com o backend: ${error?.message || 'Erro desconhecido'}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingEscalas(false);
    }
  };

  const loadNotificacoes = async () => {
    setIsLoadingNotificacoes(true);
    try {
      const data = await notificationService.getAllNotifications();
      setNotificacoes(data);
      console.log('✅ Notificações carregadas:', data.length);
    } catch (error) {
      console.warn('⚠️ Erro ao carregar notificações, usando dados vazios:', error);
      setNotificacoes([]);
      toast({
        title: 'Aviso',
        description: 'Não foi possível carregar as notificações do servidor. Mostrando dados locais.',
        variant: 'default',
      });
    } finally {
      setIsLoadingNotificacoes(false);
    }
  };

  const loadOcorrencias = async () => {
    setIsLoadingOcorrencias(true);
    try {
      const data = await occurrenceService.getOccurrences();

      // Verificar se os dados são um array válido
      if (Array.isArray(data)) {
        setOcorrencias(data);
        console.log('✅ Ocorrências carregadas:', data.length);
      } else {
        console.warn('⚠️ Dados de ocorrências não são um array válido:', data);
        setOcorrencias([]);
        toast({
          title: 'Aviso',
          description: 'Formato de dados inválido recebido do servidor.',
          variant: 'default',
        });
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar ocorrências, usando dados de fallback:', error);
      // O occurrenceService já tem fallback interno, então não precisamos fazer nada aqui
      setOcorrencias([]);
      toast({
        title: 'Aviso',
        description: 'Conectado em modo offline. Algumas funcionalidades podem estar limitadas.',
        variant: 'default',
      });
    } finally {
      setIsLoadingOcorrencias(false);
    }
  };

  const handleRefreshEscalas = () => {
    loadEscalas();
  };

  const handleRefreshNotificacoes = () => {
    loadNotificacoes();
  };

  const handleRefreshOcorrencias = () => {
    loadOcorrencias();
  };

  const loadActivityReports = async () => {
    setIsLoadingActivityReports(true);
    try {
      const data = await activityReportService.getActivityReports();
      setActivityReports(data);
      console.log('✅ Relatórios de atividade carregados:', data.length);
    } catch (error) {
      console.warn('⚠️ Erro ao carregar relatórios de atividade:', error);
      setActivityReports([]);
      toast({
        title: 'Aviso',
        description: 'Não foi possível carregar os relatórios do servidor. Mostrando dados locais.',
        variant: 'default',
      });
    } finally {
      setIsLoadingActivityReports(false);
    }
  };

  const handleRefreshActivityReports = () => {
    loadActivityReports();
  };

  const loadOrdersOfService = async () => {
    setIsLoadingOrdersOfService(true);
    try {
      const data = await orderOfServiceService.getOrders();

      // Verificar se os dados são um array válido
      if (Array.isArray(data)) {
        setOrdersOfService(data);
        console.log('✅ Ordens de serviço carregadas:', data.length);
      } else {
        console.warn('⚠️ Dados de ordens de serviço não são um array válido:', data);
        setOrdersOfService([]);
        toast({
          title: 'Aviso',
          description: 'Formato de dados inválido recebido do servidor.',
          variant: 'default',
        });
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar ordens de serviço, usando dados vazios:', error);
      setOrdersOfService([]);
      toast({
        title: 'Aviso',
        description: 'Não foi possível carregar as ordens de serviço do servidor. Mostrando dados locais.',
        variant: 'default',
      });
    } finally {
      setIsLoadingOrdersOfService(false);
    }
  };

  const handleRefreshOrdersOfService = () => {
    loadOrdersOfService();
  };

  const loadDailyLogs = async () => {
    setIsLoadingDailyLogs(true);
    try {
      const data = await dailyLogService.getAll();
      setDailyLogs(data);
    } catch (error) {
      console.error('Erro ao carregar logs diários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a Parte Diária.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDailyLogs(false);
    }
  };

  const handleDailyLogsRefresh = () => {
    loadDailyLogs();
  };


  const handleCreateDailyLog = () => {
    setSelectedDailyLog(null);
    setShowDailyLogModal(true);
  };

  const handleEditDailyLog = (log: DailyLog) => {
    setSelectedDailyLog(log);
    setShowDailyLogModal(true);
  };

  const handleViewDailyLog = (log: DailyLog) => {
    setSelectedDailyLog(log);
    // Para simplificar agora, vamos usar o mesmo modal em modo "view" ou implementar um view modal depois
    setShowDailyLogModal(true);
  };

  const handleDeleteDailyLog = async (log: DailyLog) => {
    if (window.confirm('Excluir este registro de Parte Diária?')) {
      try {
        await dailyLogService.delete(log.id);
        setDailyLogs(prev => prev.filter(l => l.id !== log.id));
        toast({ title: 'Sucesso', description: 'Registro excluído.' });
      } catch (error) {
        toast({ title: 'Erro', description: 'Erro ao excluir.', variant: 'destructive' });
      }
    }
  };

  const handleSaveDailyLog = async (data: CreateDailyLogDTO) => {
    if (selectedDailyLog) {
      const updated = await dailyLogService.update(selectedDailyLog.id, data);
      setDailyLogs(prev => prev.map(l => l.id === selectedDailyLog.id ? updated : l));
      toast({ title: 'Sucesso', description: 'Registro atualizado.' });
    } else {
      const created = await dailyLogService.create(data);
      setDailyLogs(prev => [created, ...prev]);
      toast({ title: 'Sucesso', description: 'Registro criado.' });
    }
  };

  const handleCreateOrderOfService = () => {
    setSelectedOrderOfService(null);
    setShowOrderOfServiceModal(true);
  };

  const handleEditOrderOfService = (order: OrderOfService) => {
    setSelectedOrderOfService(order);
    setShowOrderOfServiceModal(true);
  };

  const handleViewOrderOfService = (order: OrderOfService) => {
    setSelectedOrderOfService(order);
    setShowOrderOfServiceViewModal(true);
  };

  const handleDeleteOrderOfService = async (order: OrderOfService) => {
    if (window.confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
      try {
        await orderOfServiceService.deleteOrder(order.id);
        setOrdersOfService(prev => prev.filter(o => o.id !== order.id));
        toast({
          title: 'Sucesso!',
          description: 'Ordem de serviço excluída com sucesso.',
        });
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível excluir a ordem de serviço.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSubmitOrderOfService = async (data: CreateOrderOfServiceRequest) => {
    if (selectedOrderOfService) {
      // Atualizar ordem existente
      await orderOfServiceService.updateOrder(selectedOrderOfService.id, data);
      setOrdersOfService(prev => prev.map(o => o.id === selectedOrderOfService.id ? { ...o, ...data } : o));
    } else {
      // Criar nova ordem
      const newOrder = await orderOfServiceService.createOrder(data);
      setOrdersOfService(prev => [newOrder, ...prev]);
    }
  };

  const handleCreateActivityReport = () => {
    setSelectedActivityReport(null);
    setShowActivityReportModal(true);
  };

  const handleEditActivityReport = (report: ActivityReport) => {
    setSelectedActivityReport(report);
    setShowActivityReportModal(true);
  };

  const handleViewActivityReport = (report: ActivityReport) => {
    setSelectedActivityReport(report);
    setShowActivityReportViewModal(true);
  };

  const handleDeleteActivityReport = async (report: ActivityReport) => {
    try {
      await activityReportService.deleteActivityReport(report.id);
      setActivityReports(prev => prev.filter(r => r.id !== report.id));
      toast({
        title: 'Sucesso',
        description: 'Relatório excluído com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir relatório.',
        variant: 'destructive',
      });
    }
  };

  const handleApproveActivityReport = async (report: ActivityReport) => {
    try {
      const updatedReport = await activityReportService.approveReport(report.id);
      setActivityReports(prev => prev.map(r => r.id === report.id ? updatedReport : r));
      toast({
        title: 'Sucesso',
        description: 'Relatório aprovado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao aprovar relatório.',
        variant: 'destructive',
      });
    }
  };

  const handleRejectActivityReport = async (report: ActivityReport) => {
    try {
      const reason = prompt('Motivo da rejeição:');
      if (!reason) return;

      const updatedReport = await activityReportService.rejectReport(report.id, reason);
      setActivityReports(prev => prev.map(r => r.id === report.id ? updatedReport : r));
      toast({
        title: 'Relatório rejeitado',
        description: 'Relatório rejeitado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao rejeitar relatório.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveActivityReport = async (reportData: CreateActivityReportDTO) => {
    try {
      let savedReport;
      if (selectedActivityReport) {
        // Atualizar relatório existente
        savedReport = await activityReportService.updateActivityReport(selectedActivityReport.id, reportData);
        setActivityReports(prev => prev.map(r => r.id === selectedActivityReport.id ? savedReport : r));
        toast({
          title: 'Sucesso!',
          description: 'Relatório atualizado com sucesso.',
        });
      } else {
        // Criar novo relatório
        savedReport = await activityReportService.createActivityReport(reportData);
        setActivityReports(prev => [savedReport, ...prev]);
        toast({
          title: 'Sucesso!',
          description: 'Relatório criado com sucesso.',
        });
      }
      setShowActivityReportModal(false);
      setSelectedActivityReport(null);
      return savedReport; // Retornar o relatório salvo para permitir upload de arquivos
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar relatório.',
        variant: 'destructive',
      });
      throw error; // Re-throw para permitir tratamento no modal
    }
  };

  const handleGenerateActivityReportPDF = async (filters: ActivityReportFilters) => {
    try {
      const blob = await activityReportService.generatePDFReport(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-atividades-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Sucesso',
        description: 'Relatório PDF gerado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório PDF.',
        variant: 'destructive',
      });
    }
  };

  const handleEditEscala = (escala: Schedule) => {
    setSelectedEscala(escala);
    setShowEscalaModal(true);
  };

  const handleDeleteEscala = (escala: Schedule) => {
    setEscalaToDelete(escala);
    setShowDeleteEscalaModal(true);
  };

  const confirmDeleteEscala = async () => {
    if (!escalaToDelete) return;

    try {
      await scheduleService.delete(escalaToDelete.id);
      setEscalas(prev => prev.filter(e => e.id !== escalaToDelete.id));
      setShowDeleteEscalaModal(false);
      setEscalaToDelete(null);
      toast({
        title: 'Escala excluída',
        description: `A escala de ${escalaToDelete.employee.name} foi excluída com sucesso.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao excluir escala:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a escala. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleViewEscala = (escala: Schedule) => {
    toast({
      title: 'Visualizar Escala',
      description: `Visualizando escala de ${escala.employee.name}`,
    });
    // TODO: Implementar modal de visualização
  };

  const handleCreateEscala = () => {
    setSelectedEscala(null);
    setShowEscalaModal(true);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotificacoes(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, lida: true } : notif
      )
    );
    toast({
      title: 'Notificação marcada como lida',
      description: 'A notificação foi marcada como lida.',
    });
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotificacoes(prev =>
      prev.map(notif => ({ ...notif, lida: true }))
    );
    toast({
      title: 'Todas as notificações marcadas como lidas',
      description: 'Todas as notificações foram marcadas como lidas.',
    });
  };

  const handleDeleteNotification = (id: string) => {
    setNotificacoes(prev => prev.filter(notif => notif.id !== id));
    toast({
      title: 'Notificação excluída',
      description: 'A notificação foi excluída com sucesso.',
    });
  };

  const handleEditOcorrencia = (ocorrencia: Occurrence) => {
    setSelectedOcorrencia(ocorrencia);
    setShowOcorrenciaModal(true);
  };

  const handleDeleteOcorrencia = (ocorrencia: Occurrence) => {
    setOcorrenciaToDelete(ocorrencia);
    setShowDeleteOcorrenciaModal(true);
  };

  const confirmDeleteOcorrencia = async () => {
    if (!ocorrenciaToDelete) return;

    try {
      await occurrenceService.deleteOccurrence(ocorrenciaToDelete.id);
      setOcorrencias(prev => prev.filter(o => o.id !== ocorrenciaToDelete.id));
      setShowDeleteOcorrenciaModal(false);
      setOcorrenciaToDelete(null);
      toast({
        title: 'Ocorrência excluída',
        description: `A ocorrência "${ocorrenciaToDelete.title}" foi excluída com sucesso.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao excluir ocorrência:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a ocorrência. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleViewOcorrencia = (ocorrencia: Occurrence) => {
    setSelectedOcorrencia(ocorrencia);
    setShowOcorrenciaViewModal(true);
  };

  const handleCreateOcorrencia = () => {
    setSelectedOcorrencia(null);
    setShowOcorrenciaModal(true);
  };

  const handleSaveOcorrencia = async (ocorrencia: Occurrence) => {
    try {
      if (selectedOcorrencia) {
        // Atualizar ocorrência existente
        await occurrenceService.updateOccurrence(ocorrencia.id, ocorrencia);
        setOcorrencias(prev => prev.map(o => o.id === ocorrencia.id ? ocorrencia : o));
        toast({
          title: 'Sucesso!',
          description: 'Ocorrência atualizada com sucesso.',
        });
      } else {
        // Criar nova ocorrência
        const newOcorrencia = await occurrenceService.createOccurrence(ocorrencia);
        setOcorrencias(prev => [newOcorrencia, ...prev]);
        toast({
          title: 'Sucesso!',
          description: 'Ocorrência criada com sucesso.',
        });
      }
      setShowOcorrenciaModal(false);
      setSelectedOcorrencia(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar ocorrência.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveEscala = async (escalaData: EscalaFormData) => {
    try {
      // Converter dados do formulário para o formato da API
      const scheduleData: CreateScheduleDTO = {
        employeeId: escalaData.employeeId,
        locationId: escalaData.locationId || escalaData.workPostId, // Usar workPostId como fallback
        workPostId: escalaData.workPostId, // Incluir workPostId para o backend criar Location automaticamente
        scheduleDate: escalaData.scheduleDate.toISOString().split('T')[0], // Converter Date para string YYYY-MM-DD
        shift: escalaData.shift as 'DAY' | 'NIGHT' | 'MIXED', // Converter string para Shift
        status: (escalaData.status || 'PENDING') as ScheduleStatus, // Usar status do formulário ou padrão
        observations: escalaData.observations
      };

      if (selectedEscala) {
        // Atualizar escala existente
        const updateData: UpdateScheduleDTO = scheduleData;
        await scheduleService.update(selectedEscala.id, updateData);
        setEscalas(prev => prev.map(e => e.id === selectedEscala.id ? { ...e, ...scheduleData } : e));
        toast({
          title: 'Sucesso!',
          description: 'Escala atualizada com sucesso.',
        });
      } else {
        // Criar nova escala
        const newEscala = await scheduleService.create(scheduleData);
        setEscalas(prev => [newEscala, ...prev]);
        toast({
          title: 'Sucesso!',
          description: 'Escala criada com sucesso.',
        });
      }
      setShowEscalaModal(false);
      setSelectedEscala(null);
    } catch (error) {
      console.error('Erro ao salvar escala:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar escala.',
        variant: 'destructive',
      });
    }
  };

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Equipamentos Ativos</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">24</div>
          <p className="text-xs text-muted-foreground">
            +2 desde o último mês
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Funcionários em Serviço</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">18</div>
          <p className="text-xs text-muted-foreground">
            +1 desde ontem
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Postos Ativos</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">
            Todos operacionais
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas Pendentes</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">3</div>
          <p className="text-xs text-muted-foreground">
            2 equipamentos vencendo
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderEquipamentosTab = () => (
    <div className="space-y-4">
      {/* Componente Equipamentos */}
      <Equipamentos />
    </div>
  );







  return (
    <StandardLayout>
      {/* Background melhorado com gradiente e textura */}
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none"></div>

        {/* Accent gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-red-950/10 via-transparent to-transparent pointer-events-none"></div>

        <div className="container mx-auto py-6 relative z-10">
          <div className="mb-6 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 border border-slate-800/50 shadow-lg">
            <h1 className="text-3xl font-bold text-white">Módulo Operacional</h1>
            <p className="text-slate-400 mt-2">
              Gestão completa das operações de segurança
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tabs Modernas com Ícones e Tooltips - Padrão SST Mobile */}
            <TooltipProvider>
              <div className="relative overflow-hidden rounded-lg glass-card border-slate-700/50 shadow-xl">
                {/* Mobile: Scroll Horizontal | Desktop: Grid */}
                <TabsList className="
                w-full
                flex md:grid
                overflow-x-auto md:overflow-x-visible
                md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12
                glass-card border-0
                p-2 md:p-2
                gap-2 md:gap-2
                min-h-[100px] md:min-h-[80px]
                scrollbar-hide
              ">

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value="dashboard"
                        className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 md:py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                      >
                        <LayoutDashboard className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                        <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Dashboard</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                      <p className="font-semibold">Dashboard</p>
                      <p className="text-xs text-gray-400">Visão geral operacional</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value="equipamentos"
                        className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 md:py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                      >
                        <PackageCheck className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                        <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Equipamentos</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                      <p className="font-semibold">Equipamentos</p>
                      <p className="text-xs text-gray-400">Gestão de armamento e EPIs</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value="escalas"
                        className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 md:py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                      >
                        <Calendar className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                        <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Escalas</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                      <p className="font-semibold">Escalas de Trabalho</p>
                      <p className="text-xs text-gray-400">Gestão de turnos e plantões</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value="notificacoes"
                        className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 md:py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                      >
                        <Bell className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                        <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Notificações</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                      <p className="font-semibold">Notificações</p>
                      <p className="text-xs text-gray-400">Alertas e avisos do sistema</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value="ocorrencias"
                        className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 md:py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                      >
                        <AlertTriangle className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                        <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Ocorrências</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                      <p className="font-semibold">Ocorrências</p>
                      <p className="text-xs text-gray-400">Registro de incidentes</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value="atividades"
                        className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 md:py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                      >
                        <ClipboardList className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                        <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Atividades</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                      <p className="font-semibold">Atividades</p>
                      <p className="text-xs text-gray-400">Relatórios de atividade</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value="servicos"
                        className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 md:py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                      >
                        <Briefcase className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                        <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Serviços</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                      <p className="font-semibold">Ordens de Serviço</p>
                      <p className="text-xs text-gray-400">Gestão de OS</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value="controle-visitas"
                        className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 md:py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                      >
                        <MapPin className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                        <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Visitas</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                      <p className="font-semibold">Controle de Visitas</p>
                      <p className="text-xs text-gray-400">Visitas dos supervisores</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value="gestao-operacional"
                        className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 md:py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                      >
                        <BarChart3 className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                        <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Gestão</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                      <p className="font-semibold">Gestão Operacional</p>
                      <p className="text-xs text-gray-400">Indicadores e métricas</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value="troca-plantao"
                        className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 md:py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                      >
                        <UserCheck className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                        <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Plantão</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                      <p className="font-semibold">Troca de Plantão</p>
                      <p className="text-xs text-gray-400">Gestão de trocas</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value="parte-diaria"
                        className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 md:py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                      >
                        <Activity className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0 text-red-500" />
                        <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Parte Diária</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                      <p className="font-semibold">Parte Diária</p>
                      <p className="text-xs text-gray-400">Controle de KM e registros diários</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* PRD Módulo 4: SST & Conformidade */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value="sst-conformidade"
                        className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 md:py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                      >
                        <ShieldCheck className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                        <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">SST</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                      <p className="font-semibold">SST & Conformidade</p>
                      <p className="text-xs text-gray-400">Fumaça preta, ASO e dossiê do BM</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value="guia-transporte"
                        className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 md:py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                      >
                        <Truck className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                        <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Transporte</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                      <p className="font-semibold">Guia de Transporte</p>
                      <p className="text-xs text-gray-400">Gestão de transporte</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value="rateio-servicos"
                        className="modern-tab flex flex-col items-center justify-center gap-2 px-4 md:px-3 py-4 md:py-4 text-slate-300 data-[state='active']:bg-gradient-to-br data-[state='active']:from-red-600 data-[state='active']:to-red-700 data-[state='active']:text-white data-[state='active']:shadow-lg data-[state='active']:shadow-red-500/50 hover:bg-slate-800/50 hover:text-white transition-all duration-300 rounded-md min-w-[85px] md:min-w-0 min-h-[85px] md:min-h-[72px] flex-shrink-0"
                      >
                        <Calculator className="h-6 w-6 md:h-5 md:w-5 flex-shrink-0" />
                        <span className="text-[11px] md:text-xs leading-tight text-center whitespace-nowrap">Rateio</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-seguranca-graphite text-white border-seguranca-red">
                      <p className="font-semibold">Rateio de Serviços</p>
                      <p className="text-xs text-gray-400">Cálculo de custos e contratos</p>
                    </TooltipContent>
                  </Tooltip>

                </TabsList>
              </div>
            </TooltipProvider>

            <TabsContent value="dashboard" className="mt-6">
              {renderDashboard()}

              {/* Widget de Controle de Visitas */}
              <div className="mb-6">
                <VisitWidget />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Atividade Recente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Equipamento EQ-001 atribuído a João Silva</span>
                        <span className="text-xs text-muted-foreground ml-auto">2h atrás</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Alerta: Arma AR-002 vencendo em 15 dias</span>
                        <span className="text-xs text-muted-foreground ml-auto">4h atrás</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Nova escala criada para Portaria Principal</span>
                        <span className="text-xs text-muted-foreground ml-auto">6h atrás</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Próximas Ações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-800/30 transition-colors">
                        <div>
                          <p className="font-medium">Renovar registro AR-003</p>
                          <p className="text-sm text-muted-foreground">Vence em 5 dias</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setActiveTab('equipamentos');
                            toast({
                              title: '📋 Navegando para Equipamentos',
                              description: 'Verifique o equipamento AR-003 que vence em breve.',
                            });
                          }}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-800/30 transition-colors">
                        <div>
                          <p className="font-medium">Manutenção EQ-005</p>
                          <p className="text-sm text-muted-foreground">Agendada para amanhã</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setActiveTab('equipamentos');
                            toast({
                              title: '🔧 Navegando para Equipamentos',
                              description: 'Verifique a manutenção programada para EQ-005.',
                            });
                          }}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-800/30 transition-colors">
                        <div>
                          <p className="font-medium">Relatório mensal</p>
                          <p className="text-sm text-muted-foreground">Vencimento em 2 dias</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            toast({
                              title: '📊 Gerando Relatório Mensal',
                              description: 'O relatório operacional está sendo gerado...',
                            });
                            // TODO: Implementar geração real de relatório
                            setTimeout(() => {
                              toast({
                                title: '✅ Relatório Gerado!',
                                description: 'O relatório mensal foi gerado com sucesso.',
                              });
                            }, 2000);
                          }}
                        >
                          Gerar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="equipamentos" className="mt-6">
              {renderEquipamentosTab()}
            </TabsContent>



            <TabsContent value="escalas" className="mt-6">
              <EscalaTrabalhoTable
                escalas={escalas}
                isLoading={isLoadingEscalas}
                onRefresh={handleRefreshEscalas}
                onEdit={handleEditEscala}
                onDelete={handleDeleteEscala}
                onView={handleViewEscala}
                onCreate={handleCreateEscala}
              />
            </TabsContent>

            <TabsContent value="notificacoes" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Notificações</h2>
                    <p className="text-muted-foreground">
                      Sistema de notificações e alertas operacionais
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowNotificationSettings(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Button>
                </div>

                <NotificacoesList
                  notificacoes={notificacoes}
                  onRefresh={handleRefreshNotificacoes}
                  onMarkAsRead={handleMarkNotificationAsRead}
                  onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                  onDelete={handleDeleteNotification}
                />
              </div>
            </TabsContent>

            {/* Modal de Configurações de Notificações */}
            <NotificationSettingsModal
              open={showNotificationSettings}
              onOpenChange={setShowNotificationSettings}
            />

            <TabsContent value="ocorrencias" className="mt-6">
              <OcorrenciasTable
                ocorrencias={ocorrencias}
                onRefresh={handleRefreshOcorrencias}
                onEdit={handleEditOcorrencia}
                onDelete={handleDeleteOcorrencia}
                onView={handleViewOcorrencia}
                onCreate={handleCreateOcorrencia}
              />
            </TabsContent>

            <TabsContent value="atividades" className="mt-6">
              <ActivityReportsTable
                reports={activityReports}
                isLoading={isLoadingActivityReports}
                onRefresh={handleRefreshActivityReports}
                onCreate={handleCreateActivityReport}
                onEdit={handleEditActivityReport}
                onView={handleViewActivityReport}
                onDelete={handleDeleteActivityReport}
                onApprove={handleApproveActivityReport}
                onReject={handleRejectActivityReport}
                onGeneratePDF={handleGenerateActivityReportPDF}
              />
            </TabsContent>

            <TabsContent value="servicos" className="mt-6">
              <OrderOfServiceTable
                orders={ordersOfService}
                isLoading={isLoadingOrdersOfService}
                onRefresh={handleRefreshOrdersOfService}
                onCreate={handleCreateOrderOfService}
                onEdit={handleEditOrderOfService}
                onDelete={handleDeleteOrderOfService}
                onView={handleViewOrderOfService}
              />
            </TabsContent>

            <TabsContent value="controle-visitas" className="mt-6">
              <VisitDashboard />
            </TabsContent>

            <TabsContent value="gestao-operacional" className="mt-6">
              <OperationalDashboard />
            </TabsContent>

            <TabsContent value="troca-plantao" className="mt-6">
              <ShiftChangeTable onRefresh={() => { }} />
            </TabsContent>

            <TabsContent value="guia-transporte" className="mt-6">
              <TransportGuideTab />
            </TabsContent>

            <TabsContent value="rateio-servicos" className="mt-6">
              <ServiceRatingManagement />
            </TabsContent>

            {/* PRD Módulo 4: SST & Conformidade (fumaça preta + dossiê) */}
            <TabsContent value="sst-conformidade" className="mt-6">
              <SstCompliancePanel />
            </TabsContent>

            <TabsContent value="parte-diaria" className="mt-6">
              <DailyLogTable
                data={dailyLogs}
                isLoading={isLoadingDailyLogs}
                onCreate={handleCreateDailyLog}
                onRefresh={handleDailyLogsRefresh}
                onEdit={handleEditDailyLog}
                onDelete={handleDeleteDailyLog}
                onAudit={(log) => {
                  setAuditLog(log);
                  setShowAuditModal(true);
                }}
                onExportPDF={() => toast({ title: 'Em breve', description: 'Exportação PDF em desenvolvimento' })}
              />
            </TabsContent>
          </Tabs>
        </div> {/* Fecha container mx-auto */}

        {/* PRD Módulo 5: Auditoria da Parte Diária */}
        <DailyLogAuditModal
          open={showAuditModal}
          onOpenChange={(open) => {
            setShowAuditModal(open);
            if (!open) {
              setAuditLog(null);
              handleDailyLogsRefresh();
            }
          }}
          dailyLog={auditLog}
        />

        {/* Modal de Visualização de Ocorrência */}
        <OcorrenciaViewModal
          ocorrencia={selectedOcorrencia}
          open={showOcorrenciaViewModal}
          onOpenChange={setShowOcorrenciaViewModal}
        />

        {/* Modal de Ocorrência (Criar/Editar) */}
        <OcorrenciaFormModal
          ocorrencia={selectedOcorrencia}
          open={showOcorrenciaModal}
          onOpenChange={setShowOcorrenciaModal}
          onSave={handleSaveOcorrencia}
        />

        {/* Modal de Confirmação de Exclusão de Ocorrência */}
        <ConfirmDeleteModal
          open={showDeleteOcorrenciaModal}
          onOpenChange={setShowDeleteOcorrenciaModal}
          onConfirm={confirmDeleteOcorrencia}
          title="Excluir Ocorrência"
          description="Tem certeza que deseja excluir esta ocorrência?"
          itemName={ocorrenciaToDelete ? `${ocorrenciaToDelete.title} - ${ocorrenciaToDelete.employeeName || 'N/A'}` : ''}
        />

        {/* Modal de Escala */}
        <EscalaFormModal
          open={showEscalaModal}
          onOpenChange={setShowEscalaModal}
          onSave={handleSaveEscala}
          initialData={selectedEscala}
          mode={selectedEscala ? 'edit' : 'create'}
        />

        {/* Modal de Confirmação de Exclusão de Escala */}
        <ConfirmDeleteModal
          open={showDeleteEscalaModal}
          onOpenChange={setShowDeleteEscalaModal}
          onConfirm={confirmDeleteEscala}
          title="Excluir Escala"
          description="Tem certeza que deseja excluir esta escala? Esta ação não pode ser desfeita."
          itemName={escalaToDelete ? `${escalaToDelete.employee?.name || 'Funcionário'} - ${new Date(escalaToDelete.scheduleDate).toLocaleDateString('pt-BR')}` : ''}
        />

        {/* Modal de Relatório de Atividade */}
        <ActivityReportModal
          open={showActivityReportModal}
          onOpenChange={setShowActivityReportModal}
          report={selectedActivityReport}
          onSave={handleSaveActivityReport}
        />

        {/* Modal de Visualização de Relatório de Atividade */}
        <ActivityReportViewModal
          open={showActivityReportViewModal}
          onOpenChange={setShowActivityReportViewModal}
          report={selectedActivityReport}
          onEdit={() => {
            setShowActivityReportViewModal(false);
            setShowActivityReportModal(true);
          }}
        />

        {/* Modal de Ordem de Serviço (Criar/Editar) */}
        <OrderOfServiceFormModal
          isOpen={showOrderOfServiceModal}
          onClose={() => {
            setShowOrderOfServiceModal(false);
            setSelectedOrderOfService(null);
          }}
          onSubmit={handleSubmitOrderOfService}
          order={selectedOrderOfService}
          mode={selectedOrderOfService ? 'edit' : 'create'}
        />

        {/* Modal de Visualização de Ordem de Serviço */}
        <OrdemServicoViewModal
          open={showOrderOfServiceViewModal}
          onClose={() => {
            setShowOrderOfServiceViewModal(false);
            setSelectedOrderOfService(null);
          }}
          orderOfService={selectedOrderOfService}
        />

        {/* Modal de Parte Diária (Criar/Editar) */}
        <DailyLogFormModal
          open={showDailyLogModal}
          onOpenChange={setShowDailyLogModal}
          log={selectedDailyLog}
          onSave={handleSaveDailyLog}
        />
      </div> {/* Fecha div principal background */}
    </StandardLayout>
  );
};

export default Operacional;
