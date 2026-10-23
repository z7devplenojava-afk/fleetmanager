import React, { useState, useEffect, useRef } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Coffee,
  Calendar,
  MapPin,
  User,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  History,
  QrCode,
  Camera,
  Loader2,
  FileText,
  Download,
  Pencil,
  PlusCircle,
  Send,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Html5QrcodeScanner } from 'html5-qrcode';
import timeRecordService, { TimeRecord } from '@/services/timeRecordService';
import { timeSheetService } from '@/services/timeSheetService';
import api from '@/lib/axios';
import { employeeService } from '@/services/employeeService';
import { isDriverUser } from '@/utils/roleRouting';

const PontoEletronico: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [resolvedEmployeeId, setResolvedEmployeeId] = useState<string | null>(user?.employeeId || null);
  const activeEmployeeId = user?.employeeId || resolvedEmployeeId;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [registrosHoje, setRegistrosHoje] = useState<TimeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [proximoRegistro, setProximoRegistro] = useState<'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA'>('ENTRADA');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [geolocation, setGeolocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Perfis e Permissões
  const isRHOrAdmin = 
    user?.role === 'SUPER_ADMIN' || 
    user?.role === 'ADMIN' || 
    user?.role === 'COMPANY_ADMIN' || 
    user?.role === 'RH' || 
    user?.role === 'DEPARTAMENTO_PESSOAL';

  const isMotorista = isDriverUser(user) || !isRHOrAdmin;

  // Modais de ações rápidas
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showJustificationDialog, setShowJustificationDialog] = useState(false);
  const [justificationText, setJustificationText] = useState('');
  const [historyRecords, setHistoryRecords] = useState<TimeRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // Modal de Folha de Ponto (PDF & Excel)
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfYear, setPdfYear] = useState<number>(new Date().getFullYear());
  const [pdfMonth, setPdfMonth] = useState<number>(new Date().getMonth() + 1);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);

  // Modal de Edição Direta de Registro (Apenas RH/DPE)
  const [showEditRecordDialog, setShowEditRecordDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TimeRecord | null>(null);
  const [editRecordedTime, setEditRecordedTime] = useState('');
  const [editRecordType, setEditRecordType] = useState<'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA'>('ENTRADA');
  const [editJustification, setEditJustification] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Modal de Adição Manual de Ponto (Apenas RH/DPE)
  const [showManualRecordDialog, setShowManualRecordDialog] = useState(false);
  const [manualRecordDate, setManualRecordDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [manualRecordTime, setManualRecordTime] = useState(format(new Date(), 'HH:mm'));
  const [manualRecordType, setManualRecordType] = useState<'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA'>('ENTRADA');
  const [manualJustification, setManualJustification] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  // Modal de Solicitação de Ajuste (Motorista e Colaboradores)
  const [showAdjustmentRequestDialog, setShowAdjustmentRequestDialog] = useState(false);
  const [adjustmentDate, setAdjustmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [adjustmentTime, setAdjustmentTime] = useState(format(new Date(), 'HH:mm'));
  const [adjustmentType, setAdjustmentType] = useState<'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA'>('ENTRADA');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [submittingAdjustment, setSubmittingAdjustment] = useState(false);

  // Buscar geolocalização ao montar
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocalização não disponível:', error);
        }
      );
    }
  }, []);

  // Resolver employeeId do usuário logado caso não esteja em user.employeeId
  useEffect(() => {
    if (user?.employeeId) {
      setResolvedEmployeeId(user.employeeId);
      return;
    }

    if (!user) return;

    let isMounted = true;
    const resolveEmployee = async () => {
      try {
        const profileRes = await api.get('/users/profile');
        if (profileRes.data?.employeeId && isMounted) {
          setResolvedEmployeeId(profileRes.data.employeeId);
          return;
        }
      } catch (e) {
        // Fallback para lista de colaboradores
      }

      try {
        const employees = await employeeService.getAllEmployees();
        const userCleanCpf = user.username ? user.username.replace(/\D/g, '') : '';
        const userCleanEmail = user.email ? user.email.toLowerCase().trim() : '';
        const userCleanName = user.name ? user.name.toLowerCase().trim() : '';

        const match = employees.find((emp) => {
          const empCleanCpf = emp.cpf ? emp.cpf.replace(/\D/g, '') : '';
          const empCleanEmail = emp.email ? emp.email.toLowerCase().trim() : '';
          const empCleanName = emp.name ? emp.name.toLowerCase().trim() : '';

          return (
            (userCleanCpf && empCleanCpf && empCleanCpf === userCleanCpf) ||
            (userCleanEmail && empCleanEmail && empCleanEmail === userCleanEmail) ||
            (userCleanName && empCleanName && empCleanName === userCleanName)
          );
        });

        if (match?.id && isMounted) {
          setResolvedEmployeeId(match.id);
        }
      } catch (err) {
        console.error('Erro ao resolver colaborador para registro de ponto:', err);
      }
    };

    resolveEmployee();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Buscar registros do dia ao montar ou quando o employeeId for resolvido
  useEffect(() => {
    if (activeEmployeeId) {
      loadTodayRecords(activeEmployeeId);
      loadNextRecordType(activeEmployeeId);
    }
  }, [activeEmployeeId]);

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadTodayRecords = async (empId?: string) => {
    const targetId = empId || activeEmployeeId;
    if (!targetId) return;
    
    try {
      setLoadingRecords(true);
      const response = await timeRecordService.getTodayRecords(targetId);
      const records = Array.isArray(response)
        ? response
        : (response?.data && Array.isArray(response.data) ? response.data : []);
      setRegistrosHoje(records);
    } catch (error: any) {
      console.error('Erro ao carregar registros:', error);
      setRegistrosHoje([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  const loadNextRecordType = async (empId?: string) => {
    const targetId = empId || activeEmployeeId;
    if (!targetId) return;
    
    try {
      const response = await timeRecordService.getNextRecordType(targetId);
      if (response.success && response.nextRecordType) {
        setProximoRegistro(response.nextRecordType);
      }
    } catch (error: any) {
      console.error('Erro ao buscar próximo tipo:', error);
    }
  };

  const registrarPonto = async (tipo?: 'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA') => {
    const targetId = activeEmployeeId;
    if (!targetId) {
      toast({
        title: "❌ Erro",
        description: "Funcionário não identificado. Aguarde a sincronização do perfil.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const tipoRegistro = tipo || proximoRegistro;
      
      // Obter IP do cliente
      const ipAddress = window.location.hostname;
      const userAgent = navigator.userAgent;

      const response = await timeRecordService.registerTimeRecord({
        employeeId: targetId,
        recordType: tipoRegistro,
        qrCode: qrCodeData || undefined,
        location: geolocation ? 'Localização capturada' : 'Sem localização',
        latitude: geolocation?.latitude,
        longitude: geolocation?.longitude,
        ipAddress,
        userAgent
      });

      if (response.success) {
        toast({
          title: "✅ Ponto Registrado",
          description: `${getTipoLabel(tipoRegistro)} registrado às ${format(new Date(), 'HH:mm:ss')}`,
        });

        // Recarregar registros
        await loadTodayRecords(targetId);
        await loadNextRecordType(targetId);
        
        // Limpar QR Code
        setQrCodeData('');
      } else {
        throw new Error(response.error || 'Erro ao registrar ponto');
      }

    } catch (error: any) {
      console.error('Erro ao registrar ponto:', error);
      toast({
        title: "❌ Erro",
        description: error.response?.data?.error || error.message || "Não foi possível registrar o ponto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openQRScanner = () => {
    setShowQRScanner(true);
    setTimeout(() => {
      initQRScanner();
    }, 100);
  };

  const initQRScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    scanner.render(
      (decodedText) => {
        console.log('QR Code lido:', decodedText);
        setQrCodeData(decodedText);
        scanner.clear();
        setShowQRScanner(false);
        
        toast({
          title: "✅ QR Code Lido",
          description: "Agora você pode registrar o ponto",
        });
      },
      (error) => {
        // Ignorar erros de scan contínuo
      }
    );

    scannerRef.current = scanner;
  };

  const closeQRScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setShowQRScanner(false);
  };

  const getTipoLabel = (tipo: 'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA') => {
    const labels = {
      ENTRADA: 'Entrada',
      SAIDA: 'Saída',
      SAIDA_ALMOCO: 'Saída para Almoço',
      RETORNO_ALMOCO: 'Retorno do Almoço'
    };
    return labels[tipo];
  };

  const getTipoIcon = (tipo: 'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA') => {
    const icons = {
      ENTRADA: LogIn,
      SAIDA: LogOut,
      SAIDA_ALMOCO: Coffee,
      RETORNO_ALMOCO: Coffee
    };
    return icons[tipo];
  };

  const getTipoColor = (tipo: 'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA') => {
    const colors = {
      ENTRADA: 'bg-green-500/10 text-green-400 border-green-500/20',
      SAIDA: 'bg-red-500/10 text-red-400 border-red-500/20',
      SAIDA_ALMOCO: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      RETORNO_ALMOCO: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    };
    return colors[tipo];
  };

  const calcularHorasTrabalhadas = () => {
    if (registrosHoje.length < 2) return '0h 0min';

    const entrada = registrosHoje.find(r => r.recordType === 'ENTRADA');
    const saida = registrosHoje.find(r => r.recordType === 'SAIDA');

    if (!entrada) return '0h 0min';

    const entradaTime = new Date(entrada.recordedAt);
    const fim = saida ? new Date(saida.recordedAt) : currentTime;
    const diff = fim.getTime() - entradaTime.getTime();
    
    // Subtrair tempo de almoço
    const almocoSaida = registrosHoje.find(r => r.recordType === 'SAIDA_ALMOCO');
    const almocoEntrada = registrosHoje.find(r => r.recordType === 'RETORNO_ALMOCO');
    let tempoAlmoco = 0;
    
    if (almocoSaida && almocoEntrada) {
      const almocoSaidaTime = new Date(almocoSaida.recordedAt);
      const almocoEntradaTime = new Date(almocoEntrada.recordedAt);
      tempoAlmoco = almocoEntradaTime.getTime() - almocoSaidaTime.getTime();
    }

    const totalTrabalhado = Math.max(0, diff - tempoAlmoco);
    const horas = Math.floor(totalTrabalhado / (1000 * 60 * 60));
    const minutos = Math.floor((totalTrabalhado % (1000 * 60 * 60)) / (1000 * 60));

    return `${horas}h ${minutos}min`;
  };

  const openHistoryDialog = async () => {
    const targetId = activeEmployeeId;
    if (!targetId) return;
    try {
      setHistoryLoading(true);
      setShowHistoryDialog(true);
      const response = await timeRecordService.getEmployeeRecords(targetId, 0, 50);
      const records = Array.isArray(response)
        ? response
        : (response?.data && Array.isArray(response.data) ? response.data : []);
      setHistoryRecords(records);
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        title: 'Erro ao carregar histórico',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Gerar PDF da Folha de Ponto Oficial do Colaborador
  const handleDownloadTimeSheetPdf = async () => {
    const targetId = activeEmployeeId;
    if (!targetId) {
      toast({
        title: 'Erro',
        description: 'Funcionário não identificado',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGeneratingPdf(true);
      const blob = await timeSheetService.downloadTimeSheetPdf(targetId, pdfYear, pdfMonth);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `espelho-ponto-${pdfYear}-${String(pdfMonth).padStart(2, '0')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: '✅ Folha de Ponto Gerada',
        description: `Download do espelho de ponto em PDF concluído (${String(pdfMonth).padStart(2, '0')}/${pdfYear}).`,
      });
      setShowPdfDialog(false);
    } catch (error: any) {
      console.error('Erro ao gerar folha de ponto em PDF:', error);
      toast({
        title: '❌ Erro ao gerar PDF',
        description: error.response?.data?.message || error.message || 'Não foi possível gerar a folha de ponto em PDF.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Gerar Folha de Ponto em Excel (.xlsx)
  const handleDownloadTimeSheetExcel = async () => {
    const targetId = activeEmployeeId;
    if (!targetId) {
      toast({
        title: 'Erro',
        description: 'Funcionário não identificado',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGeneratingExcel(true);
      const blob = await timeSheetService.downloadTimeSheet(targetId, pdfYear, pdfMonth);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `folha-ponto-${pdfYear}-${String(pdfMonth).padStart(2, '0')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: '✅ Folha de Ponto (Excel)',
        description: `Download da folha de ponto em Excel concluído.`,
      });
      setShowPdfDialog(false);
    } catch (error: any) {
      console.error('Erro ao gerar folha em Excel:', error);
      toast({
        title: '❌ Erro ao gerar Excel',
        description: error.response?.data?.message || error.message || 'Não foi possível gerar a planilha de ponto.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingExcel(false);
    }
  };

  // Solicitar Ajuste de Ponto pelo Motorista / Colaborador
  const handleSubmitAdjustmentRequest = async () => {
    const targetId = activeEmployeeId;
    if (!targetId) return;

    if (!adjustmentReason.trim()) {
      toast({
        title: 'Justificativa obrigatória',
        description: 'Informe o motivo detalhado para a solicitação de ajuste.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmittingAdjustment(true);
      const combinedDateTime = `${adjustmentDate}T${adjustmentTime}:00`;
      
      const response = await timeRecordService.requestAdjustment({
        employeeId: targetId,
        suggestedTime: combinedDateTime,
        recordType: adjustmentType,
        justification: adjustmentReason
      });

      if (response.success) {
        toast({
          title: '✅ Solicitação Enviada',
          description: 'Sua solicitação de ajuste foi encaminhada ao RH/DPE para análise.',
        });
        setShowAdjustmentRequestDialog(false);
        setAdjustmentReason('');
        await loadTodayRecords(targetId);
      } else {
        throw new Error(response.error || 'Falha ao enviar solicitação');
      }
    } catch (error: any) {
      console.error('Erro ao solicitar ajuste:', error);
      toast({
        title: '❌ Erro ao solicitar ajuste',
        description: error.response?.data?.error || error.message || 'Não foi possível enviar a solicitação.',
        variant: 'destructive'
      });
    } finally {
      setSubmittingAdjustment(false);
    }
  };

  // Abrir Modal de Edição (Apenas RH/DPE)
  const openEditModal = (registro: TimeRecord) => {
    setEditingRecord(registro);
    setEditRecordType(registro.recordType);
    setEditRecordedTime(format(new Date(registro.recordedAt), 'HH:mm'));
    setEditJustification(registro.justification || '');
    setShowEditRecordDialog(true);
  };

  // Salvar Edição do Ponto pelo RH/DPE
  const handleSaveEditByRH = async () => {
    if (!editingRecord) return;

    if (!editJustification.trim()) {
      toast({
        title: 'Justificativa obrigatória',
        description: 'O RH/DPE deve informar o motivo do ajuste manual no ponto.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmittingEdit(true);
      const datePart = format(new Date(editingRecord.recordedAt), 'yyyy-MM-dd');
      const updatedDateTime = `${datePart}T${editRecordedTime}:00`;

      const response = await timeRecordService.updateRecord(editingRecord.id, {
        recordedAt: updatedDateTime,
        recordType: editRecordType,
        justification: editJustification,
        managerId: user?.id
      });

      if (response.success) {
        toast({
          title: '✅ Ponto Atualizado',
          description: 'Registro de ponto do dia editado com sucesso pelo RH/DPE.',
        });
        setShowEditRecordDialog(false);
        setEditingRecord(null);
        await loadTodayRecords();
      } else {
        throw new Error(response.error || 'Falha ao atualizar ponto');
      }
    } catch (error: any) {
      console.error('Erro ao editar ponto:', error);
      toast({
        title: '❌ Erro ao editar ponto',
        description: error.response?.data?.error || error.message || 'Não foi possível atualizar o registro.',
        variant: 'destructive'
      });
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Criar Registro Manual pelo RH/DPE
  const handleCreateManualRecord = async () => {
    const targetId = activeEmployeeId;
    if (!targetId) return;

    if (!manualJustification.trim()) {
      toast({
        title: 'Justificativa obrigatória',
        description: 'Informe o motivo do registro manual realizado pelo RH/DPE.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmittingManual(true);
      const combinedDateTime = `${manualRecordDate}T${manualRecordTime}:00`;

      const response = await timeRecordService.createManualRecord({
        employeeId: targetId,
        recordedAt: combinedDateTime,
        recordType: manualRecordType,
        justification: manualJustification,
        managerId: user?.id
      });

      if (response.success) {
        toast({
          title: '✅ Ponto Manual Inserido',
          description: 'Registro de ponto manual lançado com sucesso pelo RH/DPE.',
        });
        setShowManualRecordDialog(false);
        setManualJustification('');
        await loadTodayRecords(targetId);
        await loadNextRecordType(targetId);
      } else {
        throw new Error(response.error || 'Falha ao registrar ponto manual');
      }
    } catch (error: any) {
      console.error('Erro ao criar ponto manual:', error);
      toast({
        title: '❌ Erro ao criar ponto',
        description: error.response?.data?.error || error.message || 'Não foi possível registrar o ponto manual.',
        variant: 'destructive'
      });
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleGenerateReport = async () => {
    const targetId = activeEmployeeId;
    if (!targetId) return;
    if (!reportStartDate || !reportEndDate) {
      toast({
        title: 'Período obrigatório',
        description: 'Informe data inicial e final para o relatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await timeRecordService.getRecordsByPeriod(
        targetId,
        reportStartDate,
        reportEndDate
      );

      if (response.success && Array.isArray(response.data)) {
        const rows = [
          ['Data', 'Hora', 'Tipo', 'Localização'],
          ...response.data.map((r: TimeRecord) => [
            new Date(r.recordedAt).toLocaleDateString('pt-BR'),
            new Date(r.recordedAt).toLocaleTimeString('pt-BR'),
            getTipoLabel(r.recordType),
            r.location || '',
          ]),
        ];
        const csvContent = rows.map((cols) => cols.join(';')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-ponto-${reportStartDate}-a-${reportEndDate}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        toast({
          title: 'Relatório gerado',
          description: 'Arquivo CSV baixado com sucesso.',
        });
      } else {
        throw new Error(response.error || 'Erro ao gerar relatório');
      }
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: 'Erro ao gerar relatório',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveJustification = async () => {
    const targetId = activeEmployeeId;
    if (!justificationText.trim()) {
      toast({
        title: 'Justificativa vazia',
        description: 'Digite uma justificativa antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    if (!targetId || registrosHoje.length === 0) {
      toast({
        title: 'Erro',
        description: 'Nenhum registro de hoje para justificar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const promises = registrosHoje
        .filter(r => r.status === 'PENDING' || r.status === 'APPROVED')
        .map(r => timeRecordService.submitJustification(r.id, targetId, justificationText));

      await Promise.all(promises);

      toast({
        title: 'Justificativa registrada',
        description: 'Sua justificativa foi enviada para aprovação do RH/DPE.',
      });

      setJustificationText('');
      setShowJustificationDialog(false);
      await loadTodayRecords();
    } catch (error: any) {
      console.error('Erro ao enviar justificativa:', error);
      toast({
        title: 'Erro ao enviar justificativa',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    }
  };

  const getProximoRegistroButton = () => {
    const config = {
      ENTRADA: {
        label: 'Registrar Entrada',
        icon: LogIn,
        color: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40 text-white'
      },
      SAIDA: {
        label: 'Registrar Saída',
        icon: LogOut,
        color: 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40 text-white'
      },
      SAIDA_ALMOCO: {
        label: 'Saída para Almoço',
        icon: Coffee,
        color: 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/40 text-white'
      },
      RETORNO_ALMOCO: {
        label: 'Retorno do Almoço',
        icon: Coffee,
        color: 'bg-blue-600 hover:bg-blue-500 shadow-blue-950/40 text-white'
      }
    };

    const { label, icon: Icon, color } = config[proximoRegistro];

    return (
      <div className="space-y-3 w-full">
        {qrCodeData && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <p className="text-xs sm:text-sm text-emerald-400 font-medium text-center">
              QR Code validado com sucesso • Pronto para registrar
            </p>
          </div>
        )}
        
        {/* Layout Mobile First: Em celular empilha sem espremer; em desktop fica lado a lado */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full">
          <Button
            onClick={openQRScanner}
            variant="outline"
            className="w-full sm:w-auto sm:min-w-[190px] h-13 sm:h-16 border-seguranca-yellow/30 hover:border-seguranca-yellow/60 hover:bg-seguranca-yellow/10 text-seguranca-lightgray font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center"
            disabled={loading}
          >
            <QrCode className="mr-2 h-5 w-5 text-seguranca-yellow shrink-0" />
            <span className="truncate">Escanear QR Code</span>
          </Button>
          
          <Button
            onClick={() => registrarPonto()}
            disabled={loading}
            className={`w-full sm:flex-1 h-14 sm:h-16 ${color} text-base sm:text-lg font-bold rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center`}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 sm:h-6 sm:w-6 animate-spin shrink-0" />
                <span>Registrando ponto...</span>
              </>
            ) : (
              <>
                <Icon className="mr-2 h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                <span className="truncate">{label}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <StandardLayout>
      <div className="container mx-auto px-3 sm:px-6 pt-3 sm:pt-6 space-y-4 sm:space-y-6 pb-32 sm:pb-12 max-w-7xl">
        {/* Header Responsivo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-seguranca-lightgray tracking-tight">
                Ponto Eletrônico
              </h1>
              {isRHOrAdmin && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs py-0.5">
                  <ShieldCheck className="h-3 w-3 mr-1" /> RH / DPE
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-seguranca-gray mt-0.5">
              {isMotorista 
                ? 'Registre sua jornada e consulte sua folha de ponto oficial'
                : 'Gestão, visualização e conferência de registros de ponto'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="outline" className="text-xs sm:text-sm px-3 py-1.5 border-seguranca-gray/30 bg-seguranca-darkgray/60 text-seguranca-lightgray font-medium">
              <Calendar className="mr-1.5 h-4 w-4 text-seguranca-yellow shrink-0" />
              {format(currentTime, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Badge>
          </div>
        </div>

        {/* Grade de Destaques: Relógio, Resumo e Informações */}
        <div className="grid gap-3 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Relógio Principal */}
          <Card className="md:col-span-2 lg:col-span-1 bg-gradient-to-br from-seguranca-yellow/15 via-seguranca-darkgray/90 to-seguranca-black border-seguranca-yellow/30 shadow-md">
            <CardHeader className="text-center pb-2 pt-4 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm uppercase tracking-wider text-seguranca-gray font-semibold flex items-center justify-center gap-1.5">
                <Clock className="h-4 w-4 text-seguranca-yellow animate-pulse" />
                Horário Oficial Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center pt-0 pb-5">
              <div className="text-4xl sm:text-5xl md:text-6xl font-black text-seguranca-yellow tracking-tight drop-shadow-sm my-1">
                {format(currentTime, 'HH:mm:ss')}
              </div>
              <div className="text-sm sm:text-base capitalize text-seguranca-lightgray/80 font-medium">
                {format(currentTime, "EEEE", { locale: ptBR })}
              </div>
            </CardContent>
          </Card>

          {/* Resumo do Dia */}
          <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20 shadow-md">
            <CardHeader className="pb-3 pt-4 sm:pt-6">
              <CardTitle className="text-sm sm:text-base text-seguranca-lightgray flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 text-seguranca-yellow" />
                Resumo do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex justify-between items-center text-sm">
                <span className="text-seguranca-gray">Registros Hoje:</span>
                <Badge variant="secondary" className="font-bold">
                  {registrosHoje.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-seguranca-gray">Horas Trabalhadas:</span>
                <Badge className="bg-seguranca-yellow/20 text-seguranca-yellow border-seguranca-yellow/30 font-bold">
                  {calcularHorasTrabalhadas()}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-seguranca-gray">Situação Atual:</span>
                <Badge 
                  variant={registrosHoje.length > 0 ? "default" : "outline"}
                  className={registrosHoje.length > 0 ? "bg-emerald-600 text-white font-medium" : "text-seguranca-gray"}
                >
                  {registrosHoje.length > 0 ? 'Em Expediente' : 'Fora do Expediente'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Posto / Usuário */}
          <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20 shadow-md">
            <CardHeader className="pb-3 pt-4 sm:pt-6">
              <CardTitle className="text-sm sm:text-base text-seguranca-lightgray flex items-center">
                <User className="mr-2 h-4 w-4 text-seguranca-yellow" />
                Colaborador & Local
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0 text-xs sm:text-sm">
              <div className="flex items-start">
                <User className="mr-2 h-4 w-4 text-seguranca-gray mt-0.5 shrink-0" />
                <div className="truncate">
                  <div className="text-seguranca-gray text-xs">Nome / Perfil</div>
                  <div className="text-seguranca-lightgray font-semibold truncate">
                    {user?.name || 'Colaborador'} ({user?.role || 'Usuário'})
                  </div>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="mr-2 h-4 w-4 text-seguranca-gray mt-0.5 shrink-0" />
                <div className="truncate">
                  <div className="text-seguranca-gray text-xs">Posto de Trabalho</div>
                  <div className="text-seguranca-lightgray truncate">
                    {geolocation ? 'GPS Capturado • Operação em campo' : 'Terminal Corporativo'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Principal de Bater Ponto */}
        <Card className="bg-gradient-to-b from-seguranca-darkgray/90 to-seguranca-black/80 border-seguranca-yellow/25 shadow-xl">
          <CardContent className="p-3.5 sm:p-6">
            {getProximoRegistroButton()}
          </CardContent>
        </Card>

        {/* Histórico de Registros do Dia (Com permissões de Edição para RH/DPE e Solicitação de Ajuste para Motorista) */}
        <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20 shadow-md">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
            <div>
              <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                <History className="h-5 w-5 text-seguranca-yellow" />
                Registros de Hoje
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-seguranca-gray mt-0.5">
                {registrosHoje.length === 0 
                  ? 'Nenhum ponto registrado hoje'
                  : `${registrosHoje.length} marcação(ões) realizada(s)`}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Se for RH/DPE: botão para inserir ponto manual */}
              {isRHOrAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-seguranca-yellow/40 hover:bg-seguranca-yellow/10 text-seguranca-yellow text-xs h-8"
                  onClick={() => {
                    setManualRecordDate(format(new Date(), 'yyyy-MM-dd'));
                    setManualRecordTime(format(new Date(), 'HH:mm'));
                    setManualJustification('');
                    setShowManualRecordDialog(true);
                  }}
                >
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                  + Ponto Manual (RH)
                </Button>
              )}

              {/* Se for Motorista: botão para solicitar ajuste ao RH/DPE */}
              {isMotorista && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500/40 hover:bg-amber-500/10 text-amber-400 text-xs h-8"
                  onClick={() => {
                    setAdjustmentDate(format(new Date(), 'yyyy-MM-dd'));
                    setAdjustmentTime(format(new Date(), 'HH:mm'));
                    setAdjustmentReason('');
                    setShowAdjustmentRequestDialog(true);
                  }}
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Solicitar Ajuste ao RH/DPE
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingRecords ? (
              <div className="text-center py-10">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-seguranca-yellow" />
                <p className="text-xs sm:text-sm text-seguranca-gray mt-3">Carregando registros do dia...</p>
              </div>
            ) : registrosHoje.length === 0 ? (
              <div className="text-center py-10 text-seguranca-gray space-y-2">
                <Clock className="h-12 w-12 mx-auto opacity-40 text-seguranca-yellow" />
                <p className="text-sm font-medium text-seguranca-lightgray">Nenhum ponto registrado hoje</p>
                <p className="text-xs">Clique no botão acima para registrar seu primeiro ponto do dia</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {registrosHoje.map((registro) => {
                  const Icon = getTipoIcon(registro.recordType);
                  return (
                    <div
                      key={registro.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border transition-all ${getTipoColor(registro.recordType)}`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-2 sm:p-2.5 rounded-xl bg-current/10 shrink-0">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm sm:text-base flex items-center gap-2 flex-wrap">
                            <span>{getTipoLabel(registro.recordType)}</span>
                            {registro.isManual && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-amber-500/10 text-amber-400 border-amber-500/30">
                                Ajuste RH
                              </Badge>
                            )}
                            {registro.status === 'PENDING' && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                Aguardando RH
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs opacity-80 truncate">
                            {registro.location || 'Sem localização'}
                            {registro.qrCodeUsed && ' • QR Code'}
                            {registro.justification && ` • Obs: ${registro.justification}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-current/10">
                        <div className="text-left sm:text-right">
                          <div className="text-xl sm:text-2xl font-black">
                            {format(new Date(registro.recordedAt), 'HH:mm:ss')}
                          </div>
                          <div className="text-[10px] opacity-70">
                            {format(new Date(registro.recordedAt), 'dd/MM/yyyy')}
                          </div>
                        </div>

                        {/* Botão de Edição (Apenas RH/DPE pode editar diretamente o ponto do dia) */}
                        {isRHOrAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 border-seguranca-gray/40 hover:bg-seguranca-yellow/20 hover:text-seguranca-yellow text-xs font-semibold shrink-0"
                            onClick={() => openEditModal(registro)}
                            title="Editar horário ou dados deste ponto (RH/DPE)"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Editar
                          </Button>
                        )}

                        {/* Motorista não pode editar: se notar divergência, botão para solicitar ajuste */}
                        {isMotorista && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 shrink-0"
                            onClick={() => {
                              setAdjustmentDate(format(new Date(registro.recordedAt), 'yyyy-MM-dd'));
                              setAdjustmentTime(format(new Date(registro.recordedAt), 'HH:mm'));
                              setAdjustmentType(registro.recordType);
                              setAdjustmentReason(`Ajuste para o registro de ${getTipoLabel(registro.recordType)} das ${format(new Date(registro.recordedAt), 'HH:mm')}: `);
                              setShowAdjustmentRequestDialog(true);
                            }}
                            title="Solicitar ajuste desta batida ao RH/DPE"
                          >
                            <AlertCircle className="h-3.5 w-3.5 mr-1" />
                            Ajustar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas (Mobile First: 2 colunas no celular, 4 no desktop) */}
        <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg text-seguranca-lightgray">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Botão Oficial: Gerar Folha de Ponto em PDF (Destaque Principal) */}
              <Button
                variant="outline"
                className="h-20 sm:h-22 flex flex-col items-center justify-center border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-500/70 hover:bg-emerald-900/30 rounded-xl transition-all"
                onClick={() => setShowPdfDialog(true)}
              >
                <FileText className="h-6 w-6 mb-1.5 text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-emerald-400">Folha de Ponto (PDF)</span>
              </Button>

              {/* Histórico de Registros */}
              <Button
                variant="outline"
                className="h-20 sm:h-22 flex flex-col items-center justify-center border-seguranca-gray/30 hover:border-seguranca-yellow/50 hover:bg-seguranca-yellow/10 rounded-xl transition-all"
                onClick={openHistoryDialog}
              >
                <History className="h-6 w-6 mb-1.5 text-seguranca-yellow shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-seguranca-lightgray">Histórico</span>
              </Button>

              {/* Solicitar Ajuste (Motorista) ou Registrar Ponto Manual (RH) */}
              {isMotorista ? (
                <Button
                  variant="outline"
                  className="h-20 sm:h-22 flex flex-col items-center justify-center border-amber-500/30 bg-amber-950/10 hover:border-amber-500/60 hover:bg-amber-900/20 rounded-xl transition-all"
                  onClick={() => {
                    setAdjustmentDate(format(new Date(), 'yyyy-MM-dd'));
                    setAdjustmentTime(format(new Date(), 'HH:mm'));
                    setAdjustmentReason('');
                    setShowAdjustmentRequestDialog(true);
                  }}
                >
                  <Send className="h-6 w-6 mb-1.5 text-amber-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-amber-300">Solicitar Ajuste</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="h-20 sm:h-22 flex flex-col items-center justify-center border-seguranca-yellow/30 bg-seguranca-yellow/5 hover:border-seguranca-yellow/60 hover:bg-seguranca-yellow/10 rounded-xl transition-all"
                  onClick={() => {
                    setManualRecordDate(format(new Date(), 'yyyy-MM-dd'));
                    setManualRecordTime(format(new Date(), 'HH:mm'));
                    setManualJustification('');
                    setShowManualRecordDialog(true);
                  }}
                >
                  <PlusCircle className="h-6 w-6 mb-1.5 text-seguranca-yellow shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-seguranca-yellow">Ponto Manual</span>
                </Button>
              )}

              {/* Justificativas Pendentes */}
              <Button
                variant="outline"
                className="h-20 sm:h-22 flex flex-col items-center justify-center border-seguranca-gray/30 hover:border-seguranca-yellow/50 hover:bg-seguranca-yellow/10 rounded-xl transition-all"
                onClick={() => setShowJustificationDialog(true)}
              >
                <AlertCircle className="h-6 w-6 mb-1.5 text-seguranca-gray shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-seguranca-lightgray">Justificativas</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Geolocalização */}
        {geolocation && (
          <Card className="bg-seguranca-darkgray/40 border-seguranca-gray/20">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
                <span className="text-seguranca-gray flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-emerald-400 shrink-0" />
                  Geolocalização Ativa (Posto de Operação)
                </span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                  Lat: {geolocation.latitude.toFixed(6)} | Lng: {geolocation.longitude.toFixed(6)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: GERAR FOLHA DE PONTO (PDF E EXCEL)                               */}
      {/* ========================================================================= */}
      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="sm:max-w-md bg-seguranca-darkgray border-seguranca-gray/30 text-seguranca-lightgray">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              Folha de Ponto / Espelho Mensal
            </DialogTitle>
            <DialogDescription className="text-seguranca-gray text-xs sm:text-sm">
              Gere seu documento oficial de espelho de ponto em formato PDF (Portaria MTP nº 671/2021) com assinatura.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-seguranca-gray block mb-1">Mês de Referência</label>
                <select
                  value={pdfMonth}
                  onChange={(e) => setPdfMonth(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg bg-seguranca-black border border-seguranca-gray/40 text-seguranca-lightgray text-sm focus:border-seguranca-yellow/50 focus:outline-none"
                >
                  <option value={1}>01 - Janeiro</option>
                  <option value={2}>02 - Fevereiro</option>
                  <option value={3}>03 - Março</option>
                  <option value={4}>04 - Abril</option>
                  <option value={5}>05 - Maio</option>
                  <option value={6}>06 - Junho</option>
                  <option value={7}>07 - Julho</option>
                  <option value={8}>08 - Agosto</option>
                  <option value={9}>09 - Setembro</option>
                  <option value={10}>10 - Outubro</option>
                  <option value={11}>11 - Novembro</option>
                  <option value={12}>12 - Dezembro</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-seguranca-gray block mb-1">Ano</label>
                <select
                  value={pdfYear}
                  onChange={(e) => setPdfYear(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg bg-seguranca-black border border-seguranca-gray/40 text-seguranca-lightgray text-sm focus:border-seguranca-yellow/50 focus:outline-none"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 bg-seguranca-black/40 rounded-lg border border-seguranca-gray/20 text-xs text-seguranca-gray space-y-1">
              <p className="font-semibold text-seguranca-lightgray flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                Documento Oficial de Ponto
              </p>
              <p>O PDF incluirá o cabeçalho da empresa, dados contratuais do colaborador, detalhamento dia a dia e campos de assinatura legal.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={handleDownloadTimeSheetPdf}
                disabled={generatingPdf || generatingExcel}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11"
              >
                {generatingPdf ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Folha em PDF
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleDownloadTimeSheetExcel}
                disabled={generatingPdf || generatingExcel}
                className="border-seguranca-gray/40 text-seguranca-lightgray hover:bg-seguranca-gray/20 h-11"
                title="Exportar também em planilha Excel"
              >
                {generatingExcel ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-400" />
                    Excel
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: SOLICITAÇÃO DE AJUSTE DE PONTO (MOTORISTA / COLABORADOR)         */}
      {/* ========================================================================= */}
      <Dialog open={showAdjustmentRequestDialog} onOpenChange={setShowAdjustmentRequestDialog}>
        <DialogContent className="sm:max-w-md bg-seguranca-darkgray border-seguranca-gray/30 text-seguranca-lightgray">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
              <Send className="h-5 w-5 text-amber-400" />
              Solicitar Ajuste ao RH / DPE
            </DialogTitle>
            <DialogDescription className="text-seguranca-gray text-xs sm:text-sm">
              Motoristas e colaboradores não alteram o ponto diretamente. Envie sua solicitação para análise e aprovação pelo RH/DPE.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-seguranca-gray block mb-1">Data do Ponto</label>
                <Input
                  type="date"
                  value={adjustmentDate}
                  onChange={(e) => setAdjustmentDate(e.target.value)}
                  className="bg-seguranca-black border-seguranca-gray/40 text-seguranca-lightgray text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-seguranca-gray block mb-1">Horário Correto</label>
                <Input
                  type="time"
                  value={adjustmentTime}
                  onChange={(e) => setAdjustmentTime(e.target.value)}
                  className="bg-seguranca-black border-seguranca-gray/40 text-seguranca-lightgray text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-seguranca-gray block mb-1">Tipo de Registro</label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as any)}
                className="w-full h-10 px-3 rounded-lg bg-seguranca-black border border-seguranca-gray/40 text-seguranca-lightgray text-sm focus:border-seguranca-yellow/50 focus:outline-none"
              >
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA_ALMOCO">Saída para Almoço</option>
                <option value="RETORNO_ALMOCO">Retorno do Almoço</option>
                <option value="SAIDA">Saída</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-seguranca-gray block mb-1">Justificativa / Motivo do Ajuste *</label>
              <Textarea
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Explique o motivo do ajuste (ex: esquecimento de marcação de saída, problemas técnicos de rede, etc.)..."
                className="min-h-[100px] bg-seguranca-black border-seguranca-gray/40 text-seguranca-lightgray text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="border-seguranca-gray/40"
                onClick={() => setShowAdjustmentRequestDialog(false)}
                disabled={submittingAdjustment}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitAdjustmentRequest}
                disabled={submittingAdjustment}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
              >
                {submittingAdjustment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar ao RH/DPE
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: EDIÇÃO DIRETA DO PONTO DO DIA (EXCLUSIVO RH / DPE)               */}
      {/* ========================================================================= */}
      <Dialog open={showEditRecordDialog} onOpenChange={setShowEditRecordDialog}>
        <DialogContent className="sm:max-w-md bg-seguranca-darkgray border-seguranca-gray/30 text-seguranca-lightgray">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
              <Pencil className="h-5 w-5 text-seguranca-yellow" />
              Editar Ponto do Dia (Gestão RH / DPE)
            </DialogTitle>
            <DialogDescription className="text-seguranca-gray text-xs sm:text-sm">
              Alteração administrativa do registro de ponto com registro de auditoria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-seguranca-gray block mb-1">Tipo de Batida</label>
                <select
                  value={editRecordType}
                  onChange={(e) => setEditRecordType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-lg bg-seguranca-black border border-seguranca-gray/40 text-seguranca-lightgray text-sm focus:border-seguranca-yellow/50 focus:outline-none"
                >
                  <option value="ENTRADA">Entrada</option>
                  <option value="SAIDA_ALMOCO">Saída para Almoço</option>
                  <option value="RETORNO_ALMOCO">Retorno do Almoço</option>
                  <option value="SAIDA">Saída</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-seguranca-gray block mb-1">Novo Horário (HH:mm)</label>
                <Input
                  type="time"
                  value={editRecordedTime}
                  onChange={(e) => setEditRecordedTime(e.target.value)}
                  className="bg-seguranca-black border-seguranca-gray/40 text-seguranca-lightgray text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-seguranca-gray block mb-1">Motivo do Ajuste pelo RH/DPE *</label>
              <Textarea
                value={editJustification}
                onChange={(e) => setEditJustification(e.target.value)}
                placeholder="Informe o motivo administrativo do ajuste deste registro..."
                className="min-h-[90px] bg-seguranca-black border-seguranca-gray/40 text-seguranca-lightgray text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="border-seguranca-gray/40"
                onClick={() => setShowEditRecordDialog(false)}
                disabled={submittingEdit}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEditByRH}
                disabled={submittingEdit}
                className="bg-seguranca-yellow text-seguranca-black font-bold hover:bg-seguranca-yellow/90"
              >
                {submittingEdit ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alteração'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 4: INSERIR PONTO MANUAL (EXCLUSIVO RH / DPE)                        */}
      {/* ========================================================================= */}
      <Dialog open={showManualRecordDialog} onOpenChange={setShowManualRecordDialog}>
        <DialogContent className="sm:max-w-md bg-seguranca-darkgray border-seguranca-gray/30 text-seguranca-lightgray">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-seguranca-yellow" />
              Inserir Ponto Manual (RH / DPE)
            </DialogTitle>
            <DialogDescription className="text-seguranca-gray text-xs sm:text-sm">
              Lançar batida de ponto manual esquecida pelo colaborador.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-seguranca-gray block mb-1">Data</label>
                <Input
                  type="date"
                  value={manualRecordDate}
                  onChange={(e) => setManualRecordDate(e.target.value)}
                  className="bg-seguranca-black border-seguranca-gray/40 text-seguranca-lightgray text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-seguranca-gray block mb-1">Horário</label>
                <Input
                  type="time"
                  value={manualRecordTime}
                  onChange={(e) => setManualRecordTime(e.target.value)}
                  className="bg-seguranca-black border-seguranca-gray/40 text-seguranca-lightgray text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-seguranca-gray block mb-1">Tipo de Registro</label>
              <select
                value={manualRecordType}
                onChange={(e) => setManualRecordType(e.target.value as any)}
                className="w-full h-10 px-3 rounded-lg bg-seguranca-black border border-seguranca-gray/40 text-seguranca-lightgray text-sm focus:border-seguranca-yellow/50 focus:outline-none"
              >
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA_ALMOCO">Saída para Almoço</option>
                <option value="RETORNO_ALMOCO">Retorno do Almoço</option>
                <option value="SAIDA">Saída</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-seguranca-gray block mb-1">Justificativa Administrativa *</label>
              <Textarea
                value={manualJustification}
                onChange={(e) => setManualJustification(e.target.value)}
                placeholder="Ex: Colaborador esqueceu o crachá / autorização da gerência..."
                className="min-h-[90px] bg-seguranca-black border-seguranca-gray/40 text-seguranca-lightgray text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="border-seguranca-gray/40"
                onClick={() => setShowManualRecordDialog(false)}
                disabled={submittingManual}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateManualRecord}
                disabled={submittingManual}
                className="bg-seguranca-yellow text-seguranca-black font-bold hover:bg-seguranca-yellow/90"
              >
                {submittingManual ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gravando...
                  </>
                ) : (
                  'Gravar Ponto'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 5: HISTÓRICO GERAL                                                  */}
      {/* ========================================================================= */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-2xl bg-seguranca-darkgray border-seguranca-gray/30 text-seguranca-lightgray">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
              <History className="h-5 w-5 text-seguranca-yellow" />
              Histórico de Registros
            </DialogTitle>
            <DialogDescription className="text-seguranca-gray text-xs sm:text-sm">
              Últimos registros de ponto realizados pelo colaborador.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[420px] overflow-y-auto space-y-2.5 pr-1">
            {historyLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-seguranca-yellow" />
                <p className="text-xs sm:text-sm text-seguranca-gray mt-2">Carregando histórico...</p>
              </div>
            ) : historyRecords.length === 0 ? (
              <p className="text-seguranca-gray text-center py-6 text-sm">
                Nenhum registro encontrado no histórico.
              </p>
            ) : (
              historyRecords.map((registro) => {
                const Icon = getTipoIcon(registro.recordType);
                return (
                  <div
                    key={registro.id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${getTipoColor(registro.recordType)}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-current/10">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          {getTipoLabel(registro.recordType)}
                        </div>
                        <div className="text-xs opacity-75">
                          {new Date(registro.recordedAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(registro.recordedAt).toLocaleTimeString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs opacity-75 text-right max-w-[180px] truncate">
                      {registro.location || 'Sem localização'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 6: JUSTIFICATIVAS GERAIS                                            */}
      {/* ========================================================================= */}
      <Dialog open={showJustificationDialog} onOpenChange={setShowJustificationDialog}>
        <DialogContent className="sm:max-w-md bg-seguranca-darkgray border-seguranca-gray/30 text-seguranca-lightgray">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-seguranca-yellow" />
              Justificativa de Ponto
            </DialogTitle>
            <DialogDescription className="text-seguranca-gray text-xs sm:text-sm">
              Descreva o motivo para ausência ou ajuste no registro de ponto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={justificationText}
              onChange={(e) => setJustificationText(e.target.value)}
              placeholder="Ex: Esqueci de registrar a saída do expediente por conta de atendimento de emergência..."
              className="min-h-[120px] bg-seguranca-black border-seguranca-gray/40 text-seguranca-lightgray text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="border-seguranca-gray/40"
                onClick={() => setShowJustificationDialog(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveJustification} className="bg-seguranca-yellow text-seguranca-black font-bold">
                Salvar Justificativa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 7: SCANNER QR CODE                                                  */}
      {/* ========================================================================= */}
      <Dialog open={showQRScanner} onOpenChange={closeQRScanner}>
        <DialogContent className="sm:max-w-md bg-seguranca-darkgray border-seguranca-gray/30 text-seguranca-lightgray">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
              <Camera className="h-5 w-5 text-seguranca-yellow" />
              Escanear QR Code do Posto
            </DialogTitle>
            <DialogDescription className="text-seguranca-gray text-xs sm:text-sm">
              Aponte a câmera para o QR Code do veículo ou posto operacional
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div 
              id="qr-reader" 
              className="rounded-xl overflow-hidden border-2 border-seguranca-yellow/30 bg-black min-h-[250px]"
            />
            <Button
              variant="outline"
              className="w-full border-seguranca-gray/30 text-seguranca-lightgray"
              onClick={closeQRScanner}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </StandardLayout>
  );
};

export default PontoEletronico;
