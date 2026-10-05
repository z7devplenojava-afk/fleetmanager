import React, { useCallback, useEffect, useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
    AlertCircle,
    ArrowRight,
    Bus,
    CalendarCheck,
    CalendarDays,
    CheckCircle2,
    Clock,
    Flag,
    Loader2,
    Play,
    Plus,
    Trash2,
    Truck,
    UserCheck,
    XCircle,
} from 'lucide-react';
import escalaService, { Conflitos, Escala, EscalaStatus } from '@/services/escalaService';
import tripService, { OperationalTrip, OperationalTripStatus } from '@/services/tripService';
import { routeService, Route } from '@/services/routeService';
import driverService, { Driver } from '@/services/driverService';
import fleetService from '@/services/fleetService';
import type { Vehicle } from '@/types/fleet';

const todayISO = () => new Date().toISOString().substring(0, 10);

const escalaStatusMeta: Record<EscalaStatus, { label: string; className: string }> = {
    PLANEJADA: { label: 'Planejada', className: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
    CONFIRMADA: { label: 'Confirmada', className: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' },
    EXECUTANDO: { label: 'Em execução', className: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
    CONCLUIDA: { label: 'Concluída', className: 'bg-green-500/10 border-green-500/30 text-green-400' },
    CANCELADA: { label: 'Cancelada', className: 'bg-gray-500/10 border-gray-500/30 text-gray-400' },
};

const tripStatusMeta: Record<OperationalTripStatus, { label: string; className: string }> = {
    PLANNED: { label: 'Planejada', className: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
    STARTING: { label: 'Iniciando', className: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' },
    BOARDING: { label: 'Embarque', className: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
    ARRIVING: { label: 'Chegada', className: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
    IN_PROGRESS: { label: 'Em andamento', className: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
    PAUSED: { label: 'Pausada', className: 'bg-gray-500/10 border-gray-500/30 text-gray-400' },
    FINISHED: { label: 'Concluída', className: 'bg-green-500/10 border-green-500/30 text-green-400' },
    CANCELLED: { label: 'Cancelada', className: 'bg-red-500/10 border-red-500/30 text-red-400' },
};

const formatTime = (t?: string) => (t ? t.substring(0, 5) : '--:--');

const emptyForm = {
    routeId: '',
    departureTime: '',
    vehicleId: '',
    driverId: '',
};

const EscalasViagens: React.FC = () => {
    const { toast } = useToast();
    const [date, setDate] = useState(todayISO());
    const [tab, setTab] = useState('escalas');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    const [escalas, setEscalas] = useState<Escala[]>([]);
    const [trips, setTrips] = useState<OperationalTrip[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    const [filterRoute, setFilterRoute] = useState('all');
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

    // Modal de escala
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Escala | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [conflitos, setConflitos] = useState<Conflitos | null>(null);
    const [checking, setChecking] = useState(false);

    // Finalizar viagem
    const [finishOpen, setFinishOpen] = useState(false);
    const [finishTrip, setFinishTrip] = useState<OperationalTrip | null>(null);
    const [finishForm, setFinishForm] = useState({ finalKm: '', passengersRealized: '', occurrence: '' });
    const [finishing, setFinishing] = useState(false);
    const [actionId, setActionId] = useState<string | null>(null);

    const loadStatic = useCallback(async () => {
        try {
            const [routesData, driversData, vehiclesData] = await Promise.all([
                routeService.findAllRoutes(),
                driverService.getDrivers(),
                fleetService.getVehicles(),
            ]);
            setRoutes(Array.isArray(routesData) ? routesData : []);
            setDrivers(Array.isArray(driversData) ? driversData : []);
            setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
        } catch {
            toast({ title: 'Erro', description: 'Erro ao carregar cadastros base', variant: 'destructive' });
        }
    }, [toast]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [escalaData, tripData] = await Promise.all([
                escalaService.list(date),
                tripService.getTrips({ date }),
            ]);
            setEscalas(Array.isArray(escalaData) ? escalaData : []);
            setTrips(Array.isArray(tripData) ? tripData : []);
        } catch {
            toast({ title: 'Erro', description: 'Erro ao carregar escalas e viagens', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [date, toast]);

    useEffect(() => {
        loadStatic();
    }, [loadStatic]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Validacao em tempo real (debounce) enquanto o modal esta aberto
    useEffect(() => {
        if (!modalOpen || !formData.routeId || !formData.departureTime) {
            setConflitos(null);
            return;
        }
        let cancelled = false;
        setChecking(true);
        const timer = setTimeout(async () => {
            try {
                const result = await escalaService.validate({
                    scaleDate: date,
                    routeId: formData.routeId,
                    departureTime: `${formData.departureTime}:00`,
                    vehicleId: formData.vehicleId && formData.vehicleId !== 'none' ? formData.vehicleId : undefined,
                    driverId: formData.driverId && formData.driverId !== 'none' ? formData.driverId : undefined,
                });
                if (!cancelled) setConflitos(result);
            } catch {
                if (!cancelled) setConflitos(null);
            } finally {
                if (!cancelled) setChecking(false);
            }
        }, 400);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [modalOpen, formData, date]);

    const filteredTrips = trips.filter((t) => filterRoute === 'all' || t.routeId === filterRoute);
    const selectedTrip = trips.find((t) => t.id === selectedTripId) || null;
    const violacoes = conflitos?.violacoes ?? [];
    const alertas = conflitos?.alertas ?? [];

    const openCreate = () => {
        setEditing(null);
        setFormData({ ...emptyForm });
        setConflitos(null);
        setModalOpen(true);
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const result = await escalaService.generate(date);
            toast({
                title: 'Escalas geradas',
                description: `${result.generated} escalas criadas (${result.dayType}); ${result.skipped} já existentes ou ignoradas.`,
            });
            await loadData();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast({
                title: 'Erro',
                description: err.response?.data?.message || 'Erro ao gerar escalas',
                variant: 'destructive',
            });
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveEscala = async () => {
        if (!formData.routeId) {
            toast({ title: 'Erro de Validação', description: 'Selecione a linha.', variant: 'destructive' });
            return;
        }
        if (!formData.departureTime) {
            toast({ title: 'Erro de Validação', description: 'Informe o horário de partida.', variant: 'destructive' });
            return;
        }
        if (violacoes.length > 0) {
            toast({ title: 'Conflito de escala', description: violacoes.join(' | '), variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const payload = {
                scaleDate: date,
                routeId: formData.routeId,
                departureTime: `${formData.departureTime}:00`,
                vehicleId: formData.vehicleId && formData.vehicleId !== 'none' ? formData.vehicleId : undefined,
                driverId: formData.driverId && formData.driverId !== 'none' ? formData.driverId : undefined,
            };
            if (editing) {
                await escalaService.update(editing.id, payload);
            } else {
                await escalaService.create(payload);
            }
            toast({ title: 'Sucesso', description: `Escala ${editing ? 'atualizada' : 'criada'} com sucesso.` });
            setModalOpen(false);
            await loadData();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast({
                title: 'Erro',
                description: err.response?.data?.message || 'Erro ao salvar escala',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEscala = async (escala: Escala) => {
        if (!window.confirm(`Excluir a escala das ${formatTime(escala.departureTime)} da linha ${escala.routeName}?`)) {
            return;
        }
        try {
            await escalaService.remove(escala.id);
            toast({ title: 'Sucesso', description: 'Escala excluída.' });
            await loadData();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast({
                title: 'Erro',
                description: err.response?.data?.message || 'Erro ao excluir escala',
                variant: 'destructive',
            });
        }
    };

    const runTripAction = async (action: () => Promise<OperationalTrip>, successMessage?: string) => {
        try {
            const updated = await action();
            if (successMessage) {
                toast({ title: 'Sucesso', description: successMessage });
            }
            setSelectedTripId(updated.id);
            await loadData();
            return updated;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast({
                title: 'Erro',
                description: err.response?.data?.message || 'Erro na operação',
                variant: 'destructive',
            });
            return null;
        } finally {
            setActionId(null);
        }
    };

    const handleCreateTrip = async (escala: Escala) => {
        setActionId(escala.id);
        const created = await runTripAction(
            () => tripService.createFromScale(escala.id),
            'Viagem criada a partir da escala.'
        );
        if (created) {
            setTab('viagens');
            setSelectedTripId(created.id);
        }
    };

    const openFinish = (trip: OperationalTrip) => {
        setFinishTrip(trip);
        setFinishForm({
            finalKm: trip.initialKm != null ? String(trip.initialKm) : '',
            passengersRealized: trip.passengersExpected != null ? String(trip.passengersExpected) : '',
            occurrence: '',
        });
        setFinishOpen(true);
    };

    const handleFinish = async () => {
        if (!finishTrip) return;
        if (!finishForm.finalKm) {
            toast({ title: 'Erro de Validação', description: 'Informe o km final.', variant: 'destructive' });
            return;
        }
        setFinishing(true);
        try {
            const updated = await tripService.finish(finishTrip.id, {
                finalKm: Number(finishForm.finalKm),
                passengersRealized: finishForm.passengersRealized
                    ? Number(finishForm.passengersRealized)
                    : undefined,
                occurrence: finishForm.occurrence || undefined,
            });
            toast({
                title: 'Viagem finalizada',
                description: `DailyLog gerado${updated.parteDiariaNumber ? ` e Parte Diária ${updated.parteDiariaNumber} criada` : ''}.`,
            });
            setFinishOpen(false);
            await loadData();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast({
                title: 'Erro',
                description: err.response?.data?.message || 'Erro ao finalizar viagem',
                variant: 'destructive',
            });
        } finally {
            setFinishing(false);
        }
    };

    const handleCancelTrip = async (trip: OperationalTrip) => {
        if (!window.confirm('Cancelar esta viagem?')) return;
        setActionId(trip.id);
        await runTripAction(() => tripService.cancel(trip.id), 'Viagem cancelada.');
    };

    const routeOptions = routes.filter((r) => r.status !== 'INATIVA');
    const activeDrivers = drivers.filter((d) => d.status === 'ATIVO');

    return (
        <StandardLayout title="Escalas e Viagens">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Escalas e Viagens</h1>
                        <p className="text-muted-foreground">
                            Escalas de partida por linha e acompanhamento das viagens do dia
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-[160px]"
                            />
                        </div>
                        <Button variant="outline" onClick={loadData} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar'}
                        </Button>
                    </div>
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList>
                        <TabsTrigger value="escalas">
                            <CalendarCheck className="mr-2 h-4 w-4" /> Escalas
                        </TabsTrigger>
                        <TabsTrigger value="viagens">
                            <Bus className="mr-2 h-4 w-4" /> Viagens
                        </TabsTrigger>
                    </TabsList>

                    {/* ============================ Aba Escalas ============================ */}
                    <TabsContent value="escalas" className="space-y-4">
                        <div className="flex flex-wrap justify-between gap-2">
                            <Button onClick={handleGenerate} disabled={generating}>
                                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarCheck className="mr-2 h-4 w-4" />}
                                Gerar escala do dia
                            </Button>
                            <Button onClick={openCreate}>
                                <Plus className="mr-2 h-4 w-4" /> Nova escala
                            </Button>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Escalas de {new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                ) : escalas.length === 0 ? (
                                    <div className="py-10 text-center text-muted-foreground">
                                        <p>Nenhuma escala para esta data.</p>
                                        <p className="text-sm mt-1">
                                            Cadastre horários em Horários e clique em "Gerar escala do dia".
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-muted-foreground border-b">
                                                    <th className="py-2 pr-4">Horário</th>
                                                    <th className="py-2 pr-4">Linha</th>
                                                    <th className="py-2 pr-4">Veículo</th>
                                                    <th className="py-2 pr-4">Motorista</th>
                                                    <th className="py-2 pr-4">Status</th>
                                                    <th className="py-2 pr-4">Origem</th>
                                                    <th className="py-2 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {escalas.map((escala) => {
                                                    const meta = escalaStatusMeta[escala.status] || escalaStatusMeta.PLANEJADA;
                                                    const hasTrip = Boolean(escala.tripId);
                                                    return (
                                                        <tr key={escala.id} className="border-b last:border-0">
                                                            <td className="py-3 pr-4 font-medium">
                                                                {formatTime(escala.departureTime)}
                                                            </td>
                                                            <td className="py-3 pr-4">
                                                                <span className="flex items-center gap-2">
                                                                    <span
                                                                        className="inline-block h-3 w-3 rounded-full border border-gray-600"
                                                                        style={{ backgroundColor: escala.routeColor || '#6B7280' }}
                                                                        aria-label="Cor da linha"
                                                                    />
                                                                    {escala.routeName}
                                                                    {escala.routeCapacity ? (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            ({escala.routeCapacity} pax)
                                                                        </span>
                                                                    ) : null}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 pr-4">{escala.vehiclePlate || '—'}</td>
                                                            <td className="py-3 pr-4">{escala.driverName || '—'}</td>
                                                            <td className="py-3 pr-4">
                                                                <Badge variant="outline" className={meta.className}>
                                                                    {meta.label}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-3 pr-4">
                                                                <Badge variant="outline" className="text-muted-foreground">
                                                                    {escala.origin === 'GERADA' ? 'Gerada' : 'Manual'}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-3 text-right whitespace-nowrap">
                                                                {!hasTrip && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        disabled={actionId === escala.id || escala.status === 'CANCELADA'}
                                                                        onClick={() => handleCreateTrip(escala)}
                                                                        title="Criar viagem a partir desta escala"
                                                                    >
                                                                        {actionId === escala.id ? (
                                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                        ) : (
                                                                            <ArrowRight className="mr-1 h-3.5 w-3.5" />
                                                                        )}
                                                                        Criar viagem
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteEscala(escala)}
                                                                    disabled={hasTrip}
                                                                    title={hasTrip ? 'Escala com viagem vinculada' : 'Excluir'}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ============================ Aba Viagens ============================ */}
                    <TabsContent value="viagens" className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm text-muted-foreground">Linha:</span>
                            <Select value={filterRoute} onValueChange={setFilterRoute}>
                                <SelectTrigger className="w-[260px]">
                                    <SelectValue placeholder="Todas as linhas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as linhas</SelectItem>
                                    {routes.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>
                                            {r.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-3">
                            <div className="lg:col-span-2 space-y-3">
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                ) : filteredTrips.length === 0 ? (
                                    <Card className="p-8">
                                        <p className="text-center text-muted-foreground">
                                            Nenhuma viagem para esta data. Crie a viagem na aba Escalas.
                                        </p>
                                    </Card>
                                ) : (
                                    filteredTrips.map((trip) => {
                                        const meta = tripStatusMeta[trip.status] || tripStatusMeta.PLANNED;
                                        return (
                                            <Card
                                                key={trip.id}
                                                className={`p-4 cursor-pointer transition-colors hover:border-primary/50 ${
                                                    selectedTripId === trip.id ? 'border-primary' : ''
                                                }`}
                                                onClick={() => setSelectedTripId(trip.id)}
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-lg font-semibold">
                                                            {formatTime(trip.plannedDepartureTime)}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span
                                                                className="inline-block h-3 w-3 rounded-full border border-gray-600"
                                                                style={{ backgroundColor: trip.routeColor || '#6B7280' }}
                                                            />
                                                            {trip.routeName}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                                        {trip.vehiclePlate && (
                                                            <span className="flex items-center gap-1">
                                                                <Truck className="h-3.5 w-3.5" /> {trip.vehiclePlate}
                                                            </span>
                                                        )}
                                                        {trip.driverName && (
                                                            <span className="flex items-center gap-1">
                                                                <UserCheck className="h-3.5 w-3.5" /> {trip.driverName}
                                                            </span>
                                                        )}
                                                        <Badge variant="outline" className={meta.className}>
                                                            {meta.label}
                                                        </Badge>
                                                        {trip.delayed && (
                                                            <Badge variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400">
                                                                <Clock className="mr-1 h-3 w-3" /> Atrasada
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })
                                )}
                            </div>

                            {/* Painel de detalhes */}
                            <div>
                                {!selectedTrip ? (
                                    <Card className="p-6">
                                        <p className="text-sm text-muted-foreground text-center">
                                            Selecione uma viagem para ver os detalhes e executar as ações.
                                        </p>
                                    </Card>
                                ) : (
                                    <Card className="p-5 sticky top-4">
                                        <CardTitle className="text-base mb-4">Detalhes da Viagem</CardTitle>
                                        <dl className="space-y-2 text-sm">
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-muted-foreground">Linha</dt>
                                                <dd className="text-right font-medium">{selectedTrip.routeName || '—'}</dd>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-muted-foreground">Partida prevista</dt>
                                                <dd>{formatTime(selectedTrip.plannedDepartureTime)}</dd>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-muted-foreground">Chegada prevista</dt>
                                                <dd>{formatTime(selectedTrip.plannedArrivalTime)}</dd>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-muted-foreground">Veículo</dt>
                                                <dd>{selectedTrip.vehiclePlate || '—'}</dd>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-muted-foreground">Motorista</dt>
                                                <dd>{selectedTrip.driverName || '—'}</dd>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-muted-foreground">Passageiros previstos</dt>
                                                <dd>{selectedTrip.passengersExpected ?? '—'}</dd>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-muted-foreground">KM inicial</dt>
                                                <dd>{selectedTrip.initialKm ?? '—'}</dd>
                                            </div>
                                            {selectedTrip.finalKm != null && (
                                                <div className="flex justify-between gap-2">
                                                    <dt className="text-muted-foreground">KM final</dt>
                                                    <dd>{selectedTrip.finalKm}</dd>
                                                </div>
                                            )}
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-muted-foreground">Confirm. motorista</dt>
                                                <dd>
                                                    {selectedTrip.driverConfirmedAt ? (
                                                        <CheckCircle2 className="inline h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <XCircle className="inline h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-muted-foreground">Confirm. veículo</dt>
                                                <dd>
                                                    {selectedTrip.vehicleConfirmedAt ? (
                                                        <CheckCircle2 className="inline h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <XCircle className="inline h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </dd>
                                            </div>
                                            {selectedTrip.occurrence && (
                                                <div className="pt-1">
                                                    <dt className="text-muted-foreground">Ocorrência</dt>
                                                    <dd className="mt-1">{selectedTrip.occurrence}</dd>
                                                </div>
                                            )}
                                            {selectedTrip.parteDiariaNumber && (
                                                <div className="flex justify-between gap-2">
                                                    <dt className="text-muted-foreground">Parte Diária</dt>
                                                    <dd className="font-medium text-green-500">
                                                        {selectedTrip.parteDiariaNumber}
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>

                                        <div className="mt-5 space-y-2">
                                            {selectedTrip.status === 'PLANNED' && (
                                                <>
                                                    {!selectedTrip.driverConfirmedAt && (
                                                        <Button
                                                            className="w-full"
                                                            variant="outline"
                                                            disabled={actionId === selectedTrip.id}
                                                            onClick={() => {
                                                                setActionId(selectedTrip.id);
                                                                runTripAction(
                                                                    () => tripService.confirmDriver(selectedTrip.id),
                                                                    'Motorista confirmado.'
                                                                );
                                                            }}
                                                        >
                                                            <UserCheck className="mr-2 h-4 w-4" /> Confirmar motorista
                                                        </Button>
                                                    )}
                                                    {!selectedTrip.vehicleConfirmedAt && (
                                                        <Button
                                                            className="w-full"
                                                            variant="outline"
                                                            disabled={actionId === selectedTrip.id}
                                                            onClick={() => {
                                                                setActionId(selectedTrip.id);
                                                                runTripAction(
                                                                    () => tripService.confirmVehicle(selectedTrip.id),
                                                                    'Veículo confirmado.'
                                                                );
                                                            }}
                                                        >
                                                            <Truck className="mr-2 h-4 w-4" /> Confirmar veículo
                                                        </Button>
                                                    )}
                                                    <Button
                                                        className="w-full"
                                                        disabled={actionId === selectedTrip.id}
                                                        onClick={() => {
                                                            setActionId(selectedTrip.id);
                                                            runTripAction(
                                                                () => tripService.startTripById(selectedTrip.id),
                                                                'Viagem iniciada (embarque).'
                                                            );
                                                        }}
                                                    >
                                                        <Play className="mr-2 h-4 w-4" /> Iniciar viagem
                                                    </Button>
                                                </>
                                            )}

                                            {selectedTrip.status === 'BOARDING' && (
                                                <>
                                                    <Button
                                                        className="w-full"
                                                        variant="outline"
                                                        disabled={actionId === selectedTrip.id}
                                                        onClick={() => {
                                                            setActionId(selectedTrip.id);
                                                            runTripAction(
                                                                () => tripService.arrive(selectedTrip.id),
                                                                'Registro de chegada.'
                                                            );
                                                        }}
                                                    >
                                                        <Flag className="mr-2 h-4 w-4" /> Chegou ao destino
                                                    </Button>
                                                    <Button className="w-full" onClick={() => openFinish(selectedTrip)}>
                                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar viagem
                                                    </Button>
                                                </>
                                            )}

                                            {selectedTrip.status === 'ARRIVING' && (
                                                <Button className="w-full" onClick={() => openFinish(selectedTrip)}>
                                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar viagem
                                                </Button>
                                            )}

                                            {(selectedTrip.status === 'PLANNED' ||
                                                selectedTrip.status === 'BOARDING' ||
                                                selectedTrip.status === 'ARRIVING') && (
                                                <Button
                                                    className="w-full"
                                                    variant="destructive"
                                                    disabled={actionId === selectedTrip.id}
                                                    onClick={() => handleCancelTrip(selectedTrip)}
                                                >
                                                    <XCircle className="mr-2 h-4 w-4" /> Cancelar viagem
                                                </Button>
                                            )}

                                            {selectedTrip.status === 'FINISHED' && (
                                                <p className="text-xs text-muted-foreground text-center pt-2">
                                                    Viagem concluída
                                                    {selectedTrip.parteDiariaNumber
                                                        ? ` — Parte Diária ${selectedTrip.parteDiariaNumber}`
                                                        : ''}
                                                    .
                                                </p>
                                            )}
                                            {selectedTrip.status === 'CANCELLED' && (
                                                <p className="text-xs text-red-400 text-center pt-2">
                                                    Viagem cancelada.
                                                </p>
                                            )}
                                        </div>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* ============================ Modal Escala ============================ */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar escala' : 'Nova escala'}</DialogTitle>
                        <DialogDescription>
                            Data: {new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Linha *</Label>
                            <Select
                                value={formData.routeId}
                                onValueChange={(v) => setFormData({ ...formData, routeId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a linha" />
                                </SelectTrigger>
                                <SelectContent>
                                    {routeOptions.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>
                                            {r.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="escala-hora">Horário de partida *</Label>
                            <Input
                                id="escala-hora"
                                type="time"
                                value={formData.departureTime}
                                onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Veículo (opcional)</Label>
                            <Select
                                value={formData.vehicleId}
                                onValueChange={(v) => setFormData({ ...formData, vehicleId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sem veículo definido" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sem veículo definido</SelectItem>
                                    {vehicles
                                        .filter((v) => v.status === 'ACTIVE')
                                        .map((v) => (
                                            <SelectItem key={v.id} value={v.id}>
                                                {v.plate} {v.model ? `— ${v.model}` : ''}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Motorista (opcional)</Label>
                            <Select
                                value={formData.driverId}
                                onValueChange={(v) => setFormData({ ...formData, driverId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sem motorista definido" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sem motorista definido</SelectItem>
                                    {activeDrivers.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {checking && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" /> Verificando conflitos...
                            </p>
                        )}
                        {violacoes.length > 0 && (
                            <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400 space-y-1">
                                <p className="font-medium flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" /> Violações
                                </p>
                                {violacoes.map((v, i) => (
                                    <p key={i}>• {v}</p>
                                ))}
                            </div>
                        )}
                        {alertas.length > 0 && (
                            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-400 space-y-1">
                                <p className="font-medium flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" /> Alertas
                                </p>
                                {alertas.map((a, i) => (
                                    <p key={i}>• {a}</p>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveEscala}
                            disabled={saving || violacoes.length > 0 || checking}
                        >
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ============================ Modal Finalizar ============================ */}
            <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>Finalizar viagem</DialogTitle>
                        <DialogDescription>
                            Informe o km final, os passageiros realizados e eventuais ocorrências.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="final-km">KM final *</Label>
                            <Input
                                id="final-km"
                                type="number"
                                min={0}
                                value={finishForm.finalKm}
                                onChange={(e) => setFinishForm({ ...finishForm, finalKm: e.target.value })}
                            />
                            {finishTrip?.initialKm != null && (
                                <p className="text-xs text-muted-foreground">
                                    KM inicial: {finishTrip.initialKm}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pax-real">Passageiros realizados</Label>
                            <Input
                                id="pax-real"
                                type="number"
                                min={0}
                                value={finishForm.passengersRealized}
                                onChange={(e) => setFinishForm({ ...finishForm, passengersRealized: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ocorrencia">Ocorrência</Label>
                            <Input
                                id="ocorrencia"
                                value={finishForm.occurrence}
                                onChange={(e) => setFinishForm({ ...finishForm, occurrence: e.target.value })}
                                placeholder="Ex.: atraso no trajeto, trânsito..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFinishOpen(false)}>
                            Voltar
                        </Button>
                        <Button onClick={handleFinish} disabled={finishing}>
                            {finishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </StandardLayout>
    );
};

export default EscalasViagens;
