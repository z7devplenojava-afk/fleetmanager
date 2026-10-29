import React, { useEffect, useState } from 'react';
import {
    Calendar,
    MapPin,
    MessageSquare,
    Clock,
    ChevronRight,
    User,
    Shield,
    FileSpreadsheet,
    ClipboardCheck,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Gavel,
    Download,
    Eye,
    Wrench,
    FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { useToast } from '@/hooks/use-toast';
import driverService from '@/services/driverService';
import {
    scheduleService,
    Schedule,
    matchesScheduleModeFilter,
    resolveScheduleRecurrence,
    resolveScheduleStartTime,
    resolveScheduleEndTime,
} from '@/services/scheduleService';
import { ParteDiariaModal } from '@/components/financeiro/ParteDiariaModal';
import { DriverDailyScheduleBoard } from '@/components/driver/DriverDailyScheduleBoard';
import api from '@/lib/axios';
import { format, parseISO, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FineSummary {
    id: string;
    vehiclePlate: string;
    driverName?: string;
    date: string;
    description: string;
    amount: number;
    location: string;
    status: 'PENDING' | 'PAID' | 'CANCELLED';
    dueDate?: string;
    points?: number;
}

const DriverDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [fines, setFines] = useState<FineSummary[]>([]);
    const [finesLoading, setFinesLoading] = useState(true);
    const [driverMatched, setDriverMatched] = useState(false);
    const [matchedDriverId, setMatchedDriverId] = useState<string | undefined>(undefined);
    const [upcomingSchedules, setUpcomingSchedules] = useState<Schedule[]>([]);
    const [selectedScheduleMode, setSelectedScheduleMode] = useState<'WEEKLY_FIXED' | 'WEEKEND' | 'ALL'>(() => {
        const day = new Date().getDay();
        return day === 0 || day === 6 ? 'WEEKEND' : 'WEEKLY_FIXED';
    });
    const [schedulesLoading, setSchedulesLoading] = useState(true);
    const [schedulesError, setSchedulesError] = useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = useState<'view' | 'download' | null>(null);
    const [isParteDiariaModalOpen, setIsParteDiariaModalOpen] = useState(false);

    useEffect(() => {
        loadDriverFines();
        loadUpcomingSchedules();
    }, [user?.name]);

    const loadUpcomingSchedules = async () => {
        setSchedulesLoading(true);
        setSchedulesError(null);
        try {
            const schedules = await scheduleService.findMySchedules();
            setUpcomingSchedules(schedules);
        } catch (error: any) {
            console.error('Erro ao carregar escalas do motorista:', error);
            setUpcomingSchedules([]);
            setSchedulesError(
                error?.response?.data?.message ||
                'Não foi possível carregar suas escalas. Verifique o vínculo do perfil.'
            );
        } finally {
            setSchedulesLoading(false);
        }
    };

    const openMySchedulePdf = async (action: 'view' | 'download') => {
        setPdfLoading(action);
        try {
            const today = new Date();
            const startDate = format(startOfMonth(today), 'yyyy-MM-dd');
            const endDate = format(endOfMonth(today), 'yyyy-MM-dd');
            const blob = await scheduleService.generateMyPDFReport({
                startDate,
                endDate,
                inline: action === 'view',
            });
            const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
            if (action === 'view') {
                window.open(url, '_blank', 'noopener,noreferrer');
                setTimeout(() => URL.revokeObjectURL(url), 60_000);
            } else {
                const link = document.createElement('a');
                link.href = url;
                link.download = `minha-escala-${startDate}_${endDate}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
            toast({
                title: action === 'view' ? 'PDF aberto' : 'Download iniciado',
                description: action === 'view'
                    ? 'Sua escala do mês foi aberta em uma nova aba.'
                    : 'O PDF da sua escala está sendo baixado.',
            });
        } catch (error: any) {
            let message = error?.message || 'Não foi possível gerar o PDF da escala.';
            if (error?.response?.data instanceof Blob) {
                try {
                    const text = await error.response.data.text();
                    message = JSON.parse(text).message || message;
                } catch { /* ignore */ }
            } else if (error?.response?.data?.message) {
                message = error.response.data.message;
            }
            toast({ title: 'Erro no PDF', description: message, variant: 'destructive' });
        } finally {
            setPdfLoading(null);
        }
    };

    const loadDriverFines = async () => {
        setFinesLoading(true);
        try {
            if (!user?.name) {
                setFines([]);
                return;
            }
            const drivers = await driverService.getDrivers();
            const match = drivers.find(
                (d) => d.name.trim().toLowerCase() === user.name.trim().toLowerCase()
            );
            if (!match) {
                setDriverMatched(false);
                setFines([]);
                return;
            }
            setDriverMatched(true);
            setMatchedDriverId(match.id);
            const response = await api.get(`/api/fines/driver/${match.id}`);
            setFines(Array.isArray(response.data) ? response.data : []);
        } catch (error: any) {
            console.error('Erro ao carregar multas do motorista:', error);
            toast({
                title: 'Erro',
                description: error?.response?.data?.message || 'Não foi possível carregar suas multas',
                variant: 'destructive',
            });
            setFines([]);
        } finally {
            setFinesLoading(false);
        }
    };

    const formatCurrency = (value: number) =>
        value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const formatDate = (iso?: string) => {
        if (!iso) return '-';
        try {
            return new Date(iso).toLocaleDateString('pt-BR');
        } catch {
            return iso;
        }
    };

    const pendingFines = fines.filter(f => f.status === 'PENDING');
    const paidFines = fines.filter(f => f.status === 'PAID');
    const totalPending = pendingFines.reduce((acc, f) => acc + (f.amount || 0), 0);

    const quickActions = [
        {
            title: 'Ponto Eletrônico',
            description: 'Registre sua entrada, intervalos e saída diária',
            icon: Clock,
            color: 'bg-emerald-600',
            to: '/rh/ponto-eletronico'
        },
        {
            title: 'Checklist & Avarias (Vistoria)',
            description: 'Mapa de avarias na carroceria, pneus, níveis e KM',
            icon: ClipboardCheck,
            color: 'bg-red-500',
            to: '/driver/checklist'
        },
        {
            title: 'Ordem de Serviço (OS)',
            description: 'Abrir chamado de manutenção e fotos com câmera',
            icon: Wrench,
            color: 'bg-orange-600',
            to: '/driver/work-orders'
        },
        {
            title: 'Lançamento de Parte Diária',
            description: 'Lançar ficha de veículo, horários e KM para medição',
            icon: FileText,
            color: 'bg-amber-600',
            action: () => setIsParteDiariaModalOpen(true)
        },
        {
            title: 'Minhas Escalas',
            description: 'Veja, visualize e baixe sua escala em PDF',
            icon: Calendar,
            color: 'bg-blue-500',
            to: '/driver/trips'
        },
        {
            title: 'Controle de Horas',
            description: 'Espelho de ponto e banco de horas',
            icon: CheckCircle2,
            color: 'bg-green-600',
            to: '/rh/controle-horas'
        },
        {
            title: 'Meus Holerites',
            description: 'Baixe seus comprovantes e holerites',
            icon: FileSpreadsheet,
            color: 'bg-purple-500',
            to: '/meus-holerites'
        },
        {
            title: 'Mensagens',
            description: 'Comunicação interna e avisos',
            icon: MessageSquare,
            color: 'bg-sky-600',
            to: '/mensagens'
        }
    ];

    const firstScheduleWithVehicle = upcomingSchedules.find((s) => s.vehicle?.plate || s.vehiclePlate);

    return (
        <StandardLayout>
            <div className="p-3 sm:p-6 pb-28 sm:pb-10 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <h1 className="text-xl sm:text-3xl font-black tracking-tight truncate">
                                Bem-vindo, {user?.name}
                            </h1>
                            <div className="flex md:hidden items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-lg border border-primary/20 shrink-0">
                                <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="text-xs font-bold">Motorista</span>
                            </div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Portal do Motorista - Fleet Manager
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                        <Button
                            onClick={() => navigate('/driver/checklist')}
                            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold gap-2 h-auto min-h-[44px] py-2.5 px-4 rounded-xl whitespace-normal text-xs sm:text-sm text-center justify-center shadow-md"
                        >
                            <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                            <span>Abrir Checklist Completo (Avarias & Pneus)</span>
                        </Button>
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20 shrink-0">
                            <Shield className="h-5 w-5 text-primary shrink-0" />
                            <span className="font-medium text-sm">Perfil: Motorista</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                    {quickActions.map((action) => (
                        <Card
                            key={action.title}
                            className="cursor-pointer hover:shadow-md active:scale-[0.99] transition-all group border hover:border-amber-500/40"
                            onClick={() => (action as any).action ? (action as any).action() : (action as any).to && navigate((action as any).to)}
                        >
                            <CardContent className="p-3.5 sm:p-5 flex items-center gap-3.5">
                                <div className={`p-2.5 sm:p-3 rounded-xl ${action.color} text-white shrink-0 shadow-sm`}>
                                    <action.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm sm:text-base leading-snug truncate">{action.title}</h3>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-snug">{action.description}</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Quadro Diário do Motorista (Horário, Empresa, Percurso 01-15, Km, Passageiros) integrado à Escala */}
                <DriverDailyScheduleBoard
                    driverId={matchedDriverId || user?.employeeId || user?.id}
                    driverName={user?.name || 'Motorista'}
                    driverRole="Motorista"
                    vehicleId={firstScheduleWithVehicle?.vehicleId || firstScheduleWithVehicle?.vehicle?.id}
                    vehiclePlate={firstScheduleWithVehicle?.vehicle?.plate || firstScheduleWithVehicle?.vehiclePlate || ''}
                    vehicleModel={firstScheduleWithVehicle?.vehicle?.model || ''}
                />

                {/* Minhas Multas */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Gavel className="h-5 w-5 text-red-500" />
                                Minhas Multas
                            </CardTitle>
                            <CardDescription>
                                {driverMatched
                                    ? 'Multas registradas no seu nome'
                                    : 'Vincule seu perfil de motorista ao seu usuário para visualizar suas multas'}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {driverMatched && (
                                <Button variant="outline" size="sm" onClick={loadDriverFines}>
                                    <Clock className="h-4 w-4 mr-2" />
                                    Atualizar
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {finesLoading ? (
                            <div className="flex items-center justify-center py-10 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mr-3" />
                                <p>Carregando suas multas...</p>
                            </div>
                        ) : !driverMatched ? (
                            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                <User className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>Motorista não identificado</p>
                            </div>
                        ) : fines.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>Nenhuma multa registrada no seu nome. Continue dirigindo com atenção! 🚗</p>
                            </div>
                        ) : (
                            <>
                                {/* Resumo */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                                        <div className="flex items-center gap-2 text-red-700">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-sm font-medium">Pendentes</span>
                                        </div>
                                        <p className="text-2xl font-bold text-red-700 mt-1">{pendingFines.length}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                                        <div className="flex items-center gap-2 text-amber-700">
                                            <Gavel className="h-4 w-4" />
                                            <span className="text-sm font-medium">Valor Pendente</span>
                                        </div>
                                        <p className="text-2xl font-bold text-amber-700 mt-1">{formatCurrency(totalPending)}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                        <div className="flex items-center gap-2 text-green-700">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span className="text-sm font-medium">Pagas</span>
                                        </div>
                                        <p className="text-2xl font-bold text-green-700 mt-1">{paidFines.length}</p>
                                    </div>
                                </div>

                                {/* Lista */}
                                <div className="space-y-3">
                                    {fines.map((fine) => (
                                        <div
                                            key={fine.id}
                                            className="p-4 rounded-lg border bg-white flex flex-col sm:flex-row sm:items-center gap-3"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium">{fine.vehiclePlate}</span>
                                                    <Badge
                                                        variant={fine.status === 'PAID' ? 'default' : 'destructive'}
                                                        className={
                                                            fine.status === 'CANCELLED' ? 'bg-gray-500' : undefined
                                                        }
                                                    >
                                                        {fine.status === 'PAID' ? 'Paga' :
                                                            fine.status === 'CANCELLED' ? 'Cancelada' : 'Pendente'}
                                                    </Badge>
                                                    {fine.points ? (
                                                        <Badge variant="outline">{fine.points} pontos</Badge>
                                                    ) : null}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{fine.description}</p>
                                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {fine.location} · {formatDate(fine.date)}
                                                    {fine.dueDate && ` · Vence: ${formatDate(fine.dueDate)}`}
                                                </p>
                                            </div>
                                            <div className="text-left sm:text-right flex-shrink-0">
                                                <p className={`text-lg font-bold ${fine.status === 'PENDING' ? 'text-red-600' : 'text-gray-500'}`}>
                                                    {formatCurrency(fine.amount)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                        <CardHeader className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="min-w-0">
                                <CardTitle className="flex items-start sm:items-center gap-2 text-base sm:text-lg leading-snug">
                                    <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5 sm:mt-0" />
                                    <span>Minhas Escalas (Selecione Semanal ou FDS)</span>
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm mt-1">
                                    Escolha abaixo se vai executar a Escala Semanal (Fixa) ou a Escala de Final de Semana (FDS)
                                </CardDescription>
                            </div>
                            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openMySchedulePdf('view')}
                                    disabled={!!pdfLoading}
                                    className="w-full sm:w-auto h-9 text-xs justify-center"
                                >
                                    {pdfLoading === 'view'
                                        ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        : <Eye className="h-4 w-4 mr-1" />}
                                    Ver PDF
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => openMySchedulePdf('download')}
                                    disabled={!!pdfLoading}
                                    className="w-full sm:w-auto h-9 text-xs justify-center"
                                >
                                    {pdfLoading === 'download'
                                        ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        : <Download className="h-4 w-4 mr-1" />}
                                    Baixar PDF
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
                            {/* Seletor de Escala Semanal vs FDS */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedScheduleMode('WEEKLY_FIXED')}
                                    className={`p-2.5 rounded-lg border text-left transition-all ${
                                        selectedScheduleMode === 'WEEKLY_FIXED'
                                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                                            : 'bg-background/60 border-border text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <div className="text-xs font-bold">📅 Escala Semanal (Fixa)</div>
                                    <div className="text-[10px] opacity-80">Segunda a Sexta</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedScheduleMode('WEEKEND')}
                                    className={`p-2.5 rounded-lg border text-left transition-all ${
                                        selectedScheduleMode === 'WEEKEND'
                                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                                            : 'bg-background/60 border-border text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <div className="text-xs font-bold">🗓️ Escala Final de Semana (FDS)</div>
                                    <div className="text-[10px] opacity-80">Sábado e Domingo</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedScheduleMode('ALL')}
                                    className={`p-2.5 rounded-lg border text-left transition-all ${
                                        selectedScheduleMode === 'ALL'
                                            ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-bold'
                                            : 'bg-background/60 border-border text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <div className="text-xs font-bold">📋 Todas as Escalas</div>
                                    <div className="text-[10px] opacity-80">Ver Semanal + FDS</div>
                                </button>
                            </div>

                            {schedulesLoading ? (
                                <div className="flex items-center justify-center py-10 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin mr-3" />
                                    <p>Carregando escalas programadas...</p>
                                </div>
                            ) : schedulesError ? (
                                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg space-y-3">
                                    <AlertTriangle className="h-10 w-10 mx-auto opacity-30 text-amber-500" />
                                    <p className="text-sm px-4">{schedulesError}</p>
                                    <Button variant="outline" size="sm" onClick={() => navigate('/driver/trips')}>
                                        Ir para Minhas Escalas
                                    </Button>
                                </div>
                            ) : (() => {
                                const visibleList = upcomingSchedules.filter((s) =>
                                    matchesScheduleModeFilter(s, selectedScheduleMode)
                                );
                                if (visibleList.length === 0) {
                                    return (
                                        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg space-y-3">
                                            <Calendar className="h-10 w-10 mx-auto mb-1 opacity-20" />
                                            <p>
                                                Nenhuma escala encontrada no modo{' '}
                                                {selectedScheduleMode === 'WEEKEND'
                                                    ? 'Final de Semana (FDS)'
                                                    : selectedScheduleMode === 'WEEKLY_FIXED'
                                                    ? 'Escala Semanal (Fixa)'
                                                    : 'selecionado'}
                                                .
                                            </p>
                                            <Button variant="outline" size="sm" onClick={() => setSelectedScheduleMode('ALL')}>
                                                Mostrar Todas as Escalas
                                            </Button>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="space-y-3">
                                        {visibleList.map((schedule) => {
                                            const rec = resolveScheduleRecurrence(schedule);
                                            const plate = schedule.vehicle?.plate || schedule.vehiclePlate || 'Sem placa';
                                            return (
                                                <div
                                                    key={schedule.id}
                                                    className="p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-bold truncate">
                                                                {schedule.routeCode ||
                                                                    schedule.route?.name ||
                                                                    schedule.travelTrip?.name ||
                                                                    schedule.workPost?.name ||
                                                                    schedule.location?.name ||
                                                                    'Escala de trabalho'}
                                                            </p>
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    rec === 'WEEKEND'
                                                                        ? 'border-amber-500/40 text-amber-400 text-[10px]'
                                                                        : 'border-emerald-500/40 text-emerald-400 text-[10px]'
                                                                }
                                                            >
                                                                {rec === 'WEEKEND' ? '🗓️ Escala FDS' : '📅 Escala Semanal Fixa'}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-1">
                                                            <Clock className="h-3 w-3" />
                                                            <span>
                                                                {resolveScheduleStartTime(schedule)} às{' '}
                                                                {resolveScheduleEndTime(schedule)}
                                                            </span>
                                                            <span>• Veículo: {plate}</span>
                                                            {(schedule.clientName || schedule.client?.name || schedule.location?.name) && (
                                                                <span>
                                                                    • Cliente:{' '}
                                                                    {schedule.clientName ||
                                                                        schedule.client?.name ||
                                                                        schedule.location?.name}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => navigate('/rh/ponto-eletronico')}
                                                            className="w-full sm:w-auto h-9 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold justify-center"
                                                        >
                                                            Executar no Ponto
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => navigate('/driver/trips')}
                                                            className="w-full sm:w-auto h-9 text-xs justify-center"
                                                        >
                                                            Detalhes
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <Button
                                            variant="ghost"
                                            className="w-full"
                                            onClick={() => navigate('/driver/trips')}
                                        >
                                            Ver todas as escalas e PDF
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Comunicados
                            </CardTitle>
                            <CardDescription>Avisos importantes da empresa</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-xs font-semibold text-amber-800 uppercase mb-1">Importante: LGPD</p>
                                    <p className="text-sm text-amber-900">Não esqueça de assinar o termo de consentimento LGPD na área de documentos.</p>
                                </div>
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs font-semibold text-blue-800 uppercase mb-1">Normas da Empresa</p>
                                    <p className="text-sm text-blue-900">As novas normas de conduta estão disponíveis para download.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ParteDiariaModal
                isOpen={isParteDiariaModalOpen}
                onClose={() => setIsParteDiariaModalOpen(false)}
                onSuccess={() => {
                    setIsParteDiariaModalOpen(false);
                }}
                initialDriverName={user?.name}
                initialDriverId={user?.id}
            />
        </StandardLayout>
    );
};

export default DriverDashboard;
