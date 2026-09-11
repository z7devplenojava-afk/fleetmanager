'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    LogIn,
    LogOut,
    Gauge,
    Wrench,
    AlertTriangle,
    Loader2,
    ImageIcon,
    CheckCircle2,
    ClipboardCheck,
    Car,
    ShieldAlert,
    CalendarClock
} from 'lucide-react';
import { CameraCapture } from '@/components/frota/CameraCapture';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import vehicleGateChecklistService from '@/services/vehicleGateChecklistService';
import fleetService from '@/services/fleetService';
import driverService from '@/services/driverService';
import checklistConfigService from '@/services/checklistConfigService';
import api from '@/lib/axios';
import type { ChecklistType, ChecklistItem } from '@/types/portaria';
import { DEFAULT_CHECKLIST_ITEMS, CATEGORY_LABELS, configToChecklistItem } from '@/utils/checklistConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/config/environment';

// Estrutura de item do plano de manutenção do veículo (backend /api/maintenance-plans/vehicle/{id})
interface MaintenancePlanItem {
    id: string;
    vehicleId: string;
    vehiclePlate?: string;
    taskName: string;
    intervalKm?: number;
    intervalDays?: number;
    lastExecutionKm?: number;
    lastExecutionDate?: string;
    nextDueKm?: number;
    nextDueDate?: string;
    isActive?: boolean;
}

const DriverChecklist: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<ChecklistType>('EXIT');
    const [vehicleId, setVehicleId] = useState('');
    const [driverId, setDriverId] = useState('');
    const [kmReading, setKmReading] = useState('');
    const [odometerPhotoFile, setOdometerPhotoFile] = useState<File | null>(null);
    const [odometerPhotoDescription, setOdometerPhotoDescription] = useState('');
    const [vehiclePhotos, setVehiclePhotos] = useState<File[]>([]);
    const [driverProblemReport, setDriverProblemReport] = useState('');
    const [observations, setObservations] = useState('');
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(() =>
        DEFAULT_CHECKLIST_ITEMS.map((i) => ({ ...i }))
    );
    // Disparado após submit/limpeza para recarregar os itens configurados do veículo
    const [reloadKey, setReloadKey] = useState(0);

    const { data: vehicles = [] } = useQuery({
        queryKey: ['vehicles'],
        queryFn: fleetService.getVehicles,
    });

    const { data: drivers = [] } = useQuery({
        queryKey: ['drivers'],
        queryFn: driverService.getDrivers,
    });

    // Auto-seleciona o motorista se o nome do usuário logado bater com um registro
    useEffect(() => {
        if (!driverId && user?.name && drivers.length > 0) {
            const match = drivers.find(
                (d) => d.name.trim().toLowerCase() === user.name.trim().toLowerCase()
            );
            if (match) setDriverId(match.id);
        }
    }, [drivers, user?.name, driverId]);

    // Carrega os itens configurados do checklist para o veículo selecionado
    // (fallback para os itens padrão quando não há configuração personalizada)
    useEffect(() => {
        let cancelled = false;
        if (!vehicleId) {
            setChecklistItems(DEFAULT_CHECKLIST_ITEMS.map((i) => ({ ...i, checked: false })));
            return;
        }
        checklistConfigService
            .getForVehicle(vehicleId)
            .then((configItems) => {
                if (cancelled) return;
                if (configItems && configItems.length > 0) {
                    setChecklistItems(configItems.map((c) => configToChecklistItem(c)));
                } else {
                    setChecklistItems(DEFAULT_CHECKLIST_ITEMS.map((i) => ({ ...i, checked: false })));
                }
            })
            .catch((err) => {
                console.error('Erro ao carregar itens configurados do checklist:', err);
                if (!cancelled) {
                    setChecklistItems(DEFAULT_CHECKLIST_ITEMS.map((i) => ({ ...i, checked: false })));
                }
            });
        return () => {
            cancelled = true;
        };
    }, [vehicleId, reloadKey]);

    // Plano de manutenção do veículo selecionado — usado para indicar a próxima manutenção
    const { data: maintenancePlans = [], isLoading: isLoadingPlans } = useQuery({
        queryKey: ['maintenance-plans', vehicleId],
        queryFn: async () => {
            const response = await api.get(`/maintenance-plans/vehicle/${vehicleId}`);
            return (response.data || []) as MaintenancePlanItem[];
        },
        enabled: !!vehicleId,
    });

    const selectedVehicle = useMemo(
        () => vehicles.find((v) => v.id === vehicleId),
        [vehicles, vehicleId]
    );

    // Cálculo das manutenções com base no KM informado
    const maintenanceStatus = useMemo(() => {
        const km = Number.parseInt(kmReading, 10);
        if (!vehicleId || Number.isNaN(km)) return [];

        const planItems = maintenancePlans
            .filter((p) => p.isActive !== false)
            .map((p) => {
                let status: 'OVERDUE' | 'DUE_SOON' | 'OK' | 'NO_DATA' = 'NO_DATA';
                let remainingKm: number | null = null;
                if (p.nextDueKm != null) {
                    remainingKm = p.nextDueKm - km;
                    if (remainingKm <= 0) status = 'OVERDUE';
                    else if (remainingKm <= 1000) status = 'DUE_SOON';
                    else status = 'OK';
                }
                return { ...p, status, remainingKm };
            })
            .filter((p) => p.status !== 'NO_DATA')
            .sort((a, b) => (a.remainingKm ?? Infinity) - (b.remainingKm ?? Infinity));

        return planItems;
    }, [maintenancePlans, vehicleId, kmReading]);

    const overdueCount = maintenanceStatus.filter((m) => m.status === 'OVERDUE').length;
    const dueSoonCount = maintenanceStatus.filter((m) => m.status === 'DUE_SOON').length;
    const nextMaintenance = maintenanceStatus[0];

    const checkedCount = checklistItems.filter((i) => i.checked).length;
    const requiredCount = checklistItems.filter((i) => i.required).length;
    const requiredChecked = checklistItems.filter((i) => i.required && i.checked).length;
    const progressPercent = requiredCount > 0 ? Math.round((requiredChecked / requiredCount) * 100) : 0;

    const checklistDataJson = useMemo(() => {
        return JSON.stringify(
            checklistItems.map((i) => ({ id: i.id, title: i.title, category: i.category, checked: i.checked }))
        );
    }, [checklistItems]);

    const createMutation = useMutation({
        mutationFn: async (payload: {
            data: Parameters<typeof vehicleGateChecklistService.create>[0];
            odometerFile?: File;
            odometerDesc?: string;
            vehiclePhotos?: File[];
        }) => {
            const created = await vehicleGateChecklistService.create(payload.data);
            if (payload.odometerFile) {
                await vehicleGateChecklistService.uploadOdometerPhoto(
                    created.id,
                    payload.odometerFile,
                    payload.odometerDesc
                );
            }
            if (payload.vehiclePhotos && payload.vehiclePhotos.length > 0) {
                await vehicleGateChecklistService.uploadVehiclePhotos(created.id, payload.vehiclePhotos);
            }
            return created;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle-gate-checklists'] });
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            toast({
                title: 'Checklist registrado com sucesso!',
                description:
                    activeTab === 'EXIT'
                        ? 'Check-out (saída) registrado. Boa viagem!'
                        : 'Check-in (chegada) registrado. O KM do veículo foi atualizado.',
            });
            resetForm();
        },
        onError: (err: Error) => {
            toast({
                title: 'Erro ao registrar checklist',
                description: err.message || 'Tente novamente.',
                variant: 'destructive',
            });
        },
    });

    const resetForm = () => {
        setKmReading('');
        setOdometerPhotoFile(null);
        setOdometerPhotoDescription('');
        setVehiclePhotos([]);
        setDriverProblemReport('');
        setObservations('');
        // Reset síncrono + reload: a configuração personalizada do veículo é recarregada
        // pelo efeito [vehicleId, reloadKey]
        setChecklistItems(DEFAULT_CHECKLIST_ITEMS.map((i) => ({ ...i, checked: false })));
        setReloadKey((k) => k + 1);
    };

    const handleItemCheck = (id: string, checked: boolean) => {
        setChecklistItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked } : i)));
    };

    const handleSubmit = () => {
        const km = Number.parseInt(kmReading, 10);
        if (!vehicleId) {
            toast({ title: 'Selecione o veículo', description: 'Escolha o veículo para realizar o checklist.', variant: 'destructive' });
            return;
        }
        if (Number.isNaN(km) || km < 0) {
            toast({ title: 'Informe o odômetro (KM)', description: 'A quilometragem é obrigatória para o checklist.', variant: 'destructive' });
            return;
        }
        if (requiredChecked < requiredCount) {
            toast({
                title: 'Itens obrigatórios pendentes',
                description: `Marque todos os itens obrigatórios (${requiredChecked}/${requiredCount}).`,
                variant: 'destructive',
            });
            return;
        }
        createMutation.mutate({
            data: {
                vehicleId,
                driverId: driverId || undefined,
                type: activeTab,
                kmReading: km,
                checklistData: checklistDataJson,
                driverProblemReport: driverProblemReport.trim() || undefined,
                observations: observations.trim() || undefined,
            },
            odometerFile: odometerPhotoFile || undefined,
            odometerDesc: odometerPhotoDescription || undefined,
            vehiclePhotos: vehiclePhotos.length > 0 ? vehiclePhotos : undefined,
        });
    };

    const groupedChecklist = useMemo(() => {
        const groups: Record<string, ChecklistItem[]> = {};
        checklistItems.forEach((item) => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        });
        return groups;
    }, [checklistItems]);

    // Histórico dos checklists do motorista logado
    const { data: history = [], isLoading: isLoadingHistory } = useQuery({
        queryKey: ['driver-checklist-history', driverId],
        queryFn: async () => {
            const all = await vehicleGateChecklistService.findAll({});
            return all
                .filter((c) => !driverId || c.driverId === driverId)
                .slice(0, 10);
        },
    });

    const mediaBase = getApiUrl().replace(/\/api\/?$/, '');

    return (
        <StandardLayout title="Check-in / Check-out do Veículo">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <ClipboardCheck className="h-8 w-8 text-primary" />
                            Check-in / Check-out do Veículo
                        </h1>
                        <p className="text-muted-foreground">
                            Verifique os itens do veículo, informe o odômetro e relate problemas encontrados.
                        </p>
                    </div>
                </div>

                {/* Indicador de manutenção baseado no KM */}
                {selectedVehicle && kmReading && !Number.isNaN(Number.parseInt(kmReading, 10)) && (
                    <Card className={`border-l-4 ${overdueCount > 0 ? 'border-l-red-500' : dueSoonCount > 0 ? 'border-l-amber-500' : 'border-l-green-500'}`}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <Wrench className="h-8 w-8 text-primary" />
                                    <div>
                                        <p className="font-semibold">
                                            {overdueCount > 0
                                                ? `${overdueCount} manutenção(ões) vencida(s) — providencie com urgência`
                                                : dueSoonCount > 0
                                                    ? 'Atenção: manutenção se aproxima'
                                                    : 'Manutenções em dia'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {nextMaintenance
                                                ? nextMaintenance.status === 'OVERDUE'
                                                    ? `"${nextMaintenance.taskName}" venceu há ${Math.abs(nextMaintenance.remainingKm ?? 0)} km`
                                                    : `Próxima manutenção: "${nextMaintenance.taskName}" em ${nextMaintenance.remainingKm} km`
                                                : 'Nenhum plano de manutenção cadastrado para este veículo.'}
                                        </p>
                                        {selectedVehicle.nextMaintenanceDate && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Próxima manutenção prevista (data):{' '}
                                                <span className="font-medium text-foreground">
                                                    {new Date(selectedVehicle.nextMaintenanceDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {nextMaintenance?.nextDueKm != null && (
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">KM limite</p>
                                        <p className="font-mono text-xl font-bold">
                                            {nextMaintenance.nextDueKm.toLocaleString('pt-BR')} km
                                        </p>
                                    </div>
                                )}
                            </div>

                            {maintenanceStatus.length > 0 && (
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {maintenanceStatus.slice(0, 4).map((m) => (
                                        <div key={m.id} className="flex items-center justify-between p-2 rounded border border-border bg-muted/30">
                                            <span className="text-sm truncate pr-2">{m.taskName}</span>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    m.status === 'OVERDUE'
                                                        ? 'border-red-500 text-red-500'
                                                        : m.status === 'DUE_SOON'
                                                            ? 'border-amber-500 text-amber-600'
                                                            : 'border-green-500 text-green-600'
                                                }
                                            >
                                                {m.status === 'OVERDUE'
                                                    ? `Vencida (${Math.abs(m.remainingKm ?? 0)} km acima)`
                                                    : `Faltam ${m.remainingKm} km`}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <Button
                        variant={activeTab === 'EXIT' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('EXIT')}
                        className={activeTab === 'EXIT' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    >
                        <LogOut className="mr-2 h-4 w-4" /> Check-out (Saída)
                    </Button>
                    <Button
                        variant={activeTab === 'ARRIVAL' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('ARRIVAL')}
                        className={activeTab === 'ARRIVAL' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                        <LogIn className="mr-2 h-4 w-4" /> Check-in (Chegada)
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coluna principal: formulário */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Identificação */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Car className="h-5 w-5 text-primary" /> Identificação
                                </CardTitle>
                                <CardDescription>
                                    {activeTab === 'EXIT'
                                        ? 'Registre a saída do veículo antes de iniciar a viagem.'
                                        : 'Registre a chegada do veículo ao final da viagem.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Veículo *</Label>
                                        <Select value={vehicleId} onValueChange={setVehicleId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o veículo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {vehicles.map((v) => (
                                                    <SelectItem key={v.id} value={v.id}>
                                                        {v.plate} - {v.brand} {v.model}
                                                        {v.currentMileage != null ? ` (KM: ${v.currentMileage})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Motorista</Label>
                                        <Select value={driverId || 'none'} onValueChange={(v) => setDriverId(v === 'none' ? '' : v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o motorista" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhum</SelectItem>
                                                {drivers.map((d) => (
                                                    <SelectItem key={d.id} value={d.id}>
                                                        {d.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {user?.name && (
                                            <p className="text-xs text-muted-foreground">
                                                Logado como: <span className="font-medium text-foreground">{user.name}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {selectedVehicle && (
                                    <div className="flex flex-wrap gap-3 pt-2">
                                        <Badge variant="outline">KM atual: {selectedVehicle.currentMileage?.toLocaleString('pt-BR')} km</Badge>
                                        {selectedVehicle.lastMaintenanceDate && (
                                            <Badge variant="outline">
                                                Última manutenção: {new Date(selectedVehicle.lastMaintenanceDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                            </Badge>
                                        )}
                                        <Badge variant="outline">
                                            Status: {selectedVehicle.status === 'ACTIVE' ? 'Ativo' : selectedVehicle.status}
                                        </Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Odômetro */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Gauge className="h-5 w-5 text-primary" /> Odômetro do veículo
                                </CardTitle>
                                <CardDescription>
                                    Informe a quilometragem atual. O sistema usa essa informação para indicar a próxima manutenção e o plano de manutenção do veículo.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Leitura do odômetro (KM) *</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={kmReading}
                                        onChange={(e) => setKmReading(e.target.value)}
                                        placeholder="Ex: 45000"
                                        className="font-mono text-lg"
                                    />
                                    {selectedVehicle?.currentMileage != null && kmReading && !Number.isNaN(Number.parseInt(kmReading, 10)) && (
                                        <p className="text-xs text-muted-foreground">
                                            {Number.parseInt(kmReading, 10) < selectedVehicle.currentMileage
                                                ? '⚠️ KM informado menor que o KM atual do veículo — confira a leitura.'
                                                : `Rodado desde o último registro: ${(Number.parseInt(kmReading, 10) - selectedVehicle.currentMileage).toLocaleString('pt-BR')} km`}
                                        </p>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-2">
                                        <CameraCapture
                                            label="Foto do odômetro (opcional)"
                                            onPhotosChange={(photos) => setOdometerPhotoFile(photos[0] ?? null)}
                                            maxPhotos={1}
                                            disabled={createMutation.isPending}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Descrição da foto (opcional)</Label>
                                        <Input
                                            value={odometerPhotoDescription}
                                            onChange={(e) => setOdometerPhotoDescription(e.target.value)}
                                            placeholder="Ex: leitura confirmada no painel"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Checklist de conferência */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ClipboardCheck className="h-5 w-5 text-primary" /> Checklist de conferência
                                </CardTitle>
                                <CardDescription>
                                    Verifique cada item do veículo e marque conforme o estado encontrado.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className={`h-5 w-5 ${requiredChecked === requiredCount ? 'text-green-600' : 'text-muted-foreground'}`} />
                                        <span className="text-sm">
                                            Itens obrigatórios: <strong>{requiredChecked}/{requiredCount}</strong>
                                        </span>
                                    </div>
                                    <div className="w-40">
                                        <Progress value={progressPercent} className={requiredChecked === requiredCount ? 'bg-green-200' : ''} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-2">
                                    {Object.entries(groupedChecklist).map(([cat, items]) => (
                                        <div key={cat} className="border rounded-lg p-3">
                                            <p className="text-sm font-medium text-primary mb-2">
                                                {CATEGORY_LABELS[cat] || cat}
                                            </p>
                                            <div className="space-y-2">
                                                {items.map((item) => (
                                                    <div key={item.id} className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={item.id}
                                                            checked={item.checked}
                                                            onCheckedChange={(checked) => handleItemCheck(item.id, !!checked)}
                                                        />
                                                        <label htmlFor={item.id} className="text-sm cursor-pointer flex-1">
                                                            {item.title}
                                                            {item.required && <span className="text-red-500 ml-1">*</span>}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-2 border-t">
                                    <CameraCapture
                                        label="Fotos dos itens/veículo (câmera)"
                                        onPhotosChange={setVehiclePhotos}
                                        maxPhotos={10}
                                        disabled={createMutation.isPending}
                                    />
                                    {vehiclePhotos.length > 0 && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {vehiclePhotos.length} foto(s) anexada(s) ao checklist.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Problemas relatados */}
                        <Card className="border-l-4 border-l-amber-500">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-600" /> Problemas encontrados
                                </CardTitle>
                                <CardDescription>
                                    Relate qualquer problema observado no veículo durante o {activeTab === 'EXIT' ? 'check-out' : 'check-in'}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Descrição dos problemas</Label>
                                    <Textarea
                                        value={driverProblemReport}
                                        onChange={(e) => setDriverProblemReport(e.target.value)}
                                        placeholder="Ex: luz de óleo acendeu no trajeto, freio dianteiro com ruído, pneu traseiro com desgaste..."
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Observações gerais</Label>
                                    <Textarea
                                        value={observations}
                                        onChange={(e) => setObservations(e.target.value)}
                                        placeholder="Outras observações relevantes..."
                                        rows={2}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={resetForm} disabled={createMutation.isPending}>
                                Limpar
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={createMutation.isPending}
                                className={activeTab === 'EXIT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}
                            >
                                {createMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <ClipboardCheck className="h-4 w-4 mr-2" />
                                )}
                                {createMutation.isPending
                                    ? 'Registrando...'
                                    : activeTab === 'EXIT'
                                        ? 'Registrar Check-out (Saída)'
                                        : 'Registrar Check-in (Chegada)'}
                            </Button>
                        </div>
                    </div>

                    {/* Coluna lateral: histórico */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarClock className="h-5 w-5 text-primary" /> Meus últimos registros
                                </CardTitle>
                                <CardDescription>
                                    {driverId ? 'Histórico do motorista selecionado' : 'Histórico de checklists'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingHistory ? (
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                ) : history.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        Nenhum registro ainda.
                                    </p>
                                ) : (
                                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                                        {history.map((c) => (
                                            <div key={c.id} className="border rounded-lg p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Badge
                                                        variant="outline"
                                                        className={c.type === 'EXIT' ? 'border-blue-500 text-blue-500' : 'border-green-500 text-green-600'}
                                                    >
                                                        {c.type === 'EXIT' ? 'Saída' : 'Chegada'}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(c.occurredAt).toLocaleString('pt-BR')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{c.vehiclePlate || '-'}</span>
                                                    <span className="font-mono text-sm font-semibold">{c.kmReading} km</span>
                                                </div>
                                                {(c.odometerPhotoUrl || c.vehiclePhotos) && (
                                                    <div className="flex items-center gap-3 text-xs">
                                                        {c.odometerPhotoUrl && (
                                                            <a
                                                                href={`${mediaBase}${c.odometerPhotoUrl}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-primary hover:underline"
                                                            >
                                                                <ImageIcon className="h-3 w-3" /> Odômetro
                                                            </a>
                                                        )}
                                                        {c.vehiclePhotos && (
                                                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                                                                <ImageIcon className="h-3 w-3" />
                                                                {c.vehiclePhotos.split(',').filter(Boolean).length} foto(s)
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {c.driverProblemReport && (
                                                    <p className="text-xs text-amber-600 flex items-start gap-1">
                                                        <ShieldAlert className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                        <span className="line-clamp-2">{c.driverProblemReport}</span>
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-muted/30">
                            <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground">
                                <p className="flex items-center gap-2 font-medium text-foreground">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" /> Dica
                                </p>
                                <p>
                                    O KM informado no <strong>check-in (chegada)</strong> atualiza automaticamente o
                                    odômetro do veículo e é usado para calcular o plano de manutenção.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </StandardLayout>
    );
};

export default DriverChecklist;
