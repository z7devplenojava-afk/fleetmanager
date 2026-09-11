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
    Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { useToast } from '@/hooks/use-toast';
import driverService from '@/services/driverService';
import { scheduleService, Schedule } from '@/services/scheduleService';
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
    const [upcomingSchedules, setUpcomingSchedules] = useState<Schedule[]>([]);
    const [schedulesLoading, setSchedulesLoading] = useState(true);
    const [schedulesError, setSchedulesError] = useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = useState<'view' | 'download' | null>(null);

    useEffect(() => {
        loadDriverFines();
        loadUpcomingSchedules();
    }, [user?.name]);

    const loadUpcomingSchedules = async () => {
        setSchedulesLoading(true);
        setSchedulesError(null);
        try {
            const today = new Date();
            const schedules = await scheduleService.findMySchedules({
                startDate: format(today, 'yyyy-MM-dd'),
                endDate: format(addDays(today, 14), 'yyyy-MM-dd'),
            });
            setUpcomingSchedules(schedules.slice(0, 5));
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
            // Resolve o motorista pelo nome do usuário autenticado (mesmo padrão do DriverChecklist)
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
            title: 'Check-in / Check-out',
            description: 'Checklist de vistoria do veículo',
            icon: ClipboardCheck,
            color: 'bg-red-500',
            to: '/driver/checklist'
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
            description: 'Registre seu ponto e veja horas',
            icon: Clock,
            color: 'bg-green-500',
            to: '/rh/controle-horas'
        },
        {
            title: 'Meus Holerites',
            description: 'Baixe seus comprovantes',
            icon: FileSpreadsheet,
            color: 'bg-purple-500',
            to: '/meus-holerites'
        },
        {
            title: 'Mensagens',
            description: 'Comunicação interna',
            icon: MessageSquare,
            color: 'bg-orange-500',
            to: '/mensagens'
        }
    ];

    return (
        <StandardLayout>
            <div className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Bem-vindo, {user?.name}</h1>
                        <p className="text-muted-foreground">
                            Portal do Motorista - Fleet Manager
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="font-medium">Perfil: Motorista</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <Card
                            key={action.title}
                            className="cursor-pointer hover:shadow-md transition-shadow group"
                            onClick={() => navigate(action.to)}
                        >
                            <CardContent className="p-6 flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${action.color} text-white`}>
                                    <action.icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold">{action.title}</h3>
                                    <p className="text-xs text-muted-foreground">{action.description}</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

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
                        <CardHeader className="flex flex-row items-start justify-between gap-3">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    Próximas Escalas
                                </CardTitle>
                                <CardDescription>Suas próximas escalas de trabalho programadas</CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openMySchedulePdf('view')}
                                    disabled={!!pdfLoading}
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
                                >
                                    {pdfLoading === 'download'
                                        ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        : <Download className="h-4 w-4 mr-1" />}
                                    Baixar PDF
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
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
                            ) : upcomingSchedules.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg space-y-3">
                                    <Calendar className="h-10 w-10 mx-auto mb-1 opacity-20" />
                                    <p>Nenhuma escala programada para os próximos dias.</p>
                                    <Button variant="outline" size="sm" onClick={() => navigate('/driver/trips')}>
                                        Ver todas / PDF
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingSchedules.map((schedule) => (
                                        <div
                                            key={schedule.id}
                                            className="p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center gap-2"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">
                                                    {schedule.travelTrip?.name ||
                                                        schedule.route?.name ||
                                                        schedule.workPost?.name ||
                                                        schedule.location?.name ||
                                                        'Escala de trabalho'}
                                                </p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    {(() => {
                                                        try {
                                                            return format(parseISO(schedule.scheduleDate), "dd/MM/yyyy (EEEE)", { locale: ptBR });
                                                        } catch {
                                                            return schedule.scheduleDate;
                                                        }
                                                    })()}
                                                    {schedule.location?.name ? ` · ${schedule.location.name}` : ''}
                                                </p>
                                            </div>
                                            <Badge variant="outline">
                                                {schedule.shift === 'DAY' ? 'Diurno' :
                                                    schedule.shift === 'NIGHT' ? 'Noturno' :
                                                        schedule.shift === 'MIXED' ? 'Misto' : schedule.shift}
                                            </Badge>
                                        </div>
                                    ))}
                                    <Button
                                        variant="ghost"
                                        className="w-full"
                                        onClick={() => navigate('/driver/trips')}
                                    >
                                        Ver todas as escalas e PDF
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            )}
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
        </StandardLayout>
    );
};

export default DriverDashboard;
