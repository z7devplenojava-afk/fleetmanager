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
    CalendarClock,
    Check,
    CheckCheck,
    RotateCcw,
    Sparkles,
    UserCheck,
    Building2,
    Route,
    MapPin,
    TrendingUp,
    Eye,
    FileText,
    ExternalLink,
    WifiOff,
    CloudUpload
} from 'lucide-react';
import { offlineSyncService } from '@/services/offlineSyncService';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { isDriverUser } from '@/utils/roleRouting';
import { CameraCapture } from '@/components/frota/CameraCapture';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import vehicleGateChecklistService from '@/services/vehicleGateChecklistService';
import fleetService from '@/services/fleetService';
import driverService from '@/services/driverService';
import checklistConfigService from '@/services/checklistConfigService';
import api from '@/lib/axios';
import type { ChecklistType, ChecklistItem, VehicleGateChecklist } from '@/types/portaria';
import { DEFAULT_CHECKLIST_ITEMS, CATEGORY_LABELS, configToChecklistItem } from '@/utils/checklistConfig';
import { ChecklistDetailsModal } from '@/components/frota/ChecklistDetailsModal';
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

    const navigate = useNavigate();
    const [selectedChecklistForView, setSelectedChecklistForView] = useState<VehicleGateChecklist | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const [activeTab, setActiveTab] = useState<ChecklistType>('EXIT');
    const [vehicleId, setVehicleId] = useState('');
    const [driverId, setDriverId] = useState('');
    const [kmReading, setKmReading] = useState('');
    const [kmInitial, setKmInitial] = useState('');
    const [kmFinal, setKmFinal] = useState('');
    const [hasDisplacement, setHasDisplacement] = useState(false);
    const [displacementInitialKm, setDisplacementInitialKm] = useState('');
    const [displacementFinalKm, setDisplacementFinalKm] = useState('');
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

    // Controle de modo offline e fila de sincronização
    const [isNetworkOnline, setIsNetworkOnline] = useState<boolean>(() => offlineSyncService.isOnline());
    const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(() => offlineSyncService.getPendingChecklists().length);
    const [isSyncingOffline, setIsSyncingOffline] = useState(false);

    useEffect(() => {
        const updateOnlineStatus = () => {
            setIsNetworkOnline(offlineSyncService.isOnline());
        };

        const handleQueueChange = () => {
            setPendingOfflineCount(offlineSyncService.getPendingChecklists().length);
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        window.addEventListener('fluxbus-offline-queue-changed', handleQueueChange);

        const cleanupAutoSync = offlineSyncService.initAutoSync((syncedCount) => {
            queryClient.invalidateQueries({ queryKey: ['vehicle-gate-checklists'] });
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['driver-checklist-history'] });
            toast({
                title: 'Sincronização Concluída',
                description: `${syncedCount} checklist(s) salvo(s) offline foram transmitidos com sucesso!`,
            });
        });

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
            window.removeEventListener('fluxbus-offline-queue-changed', handleQueueChange);
            cleanupAutoSync();
        };
    }, [queryClient, toast]);

    const handleManualSync = async () => {
        setIsSyncingOffline(true);
        try {
            const { synced, failed } = await offlineSyncService.syncAllPending(() => {
                queryClient.invalidateQueries({ queryKey: ['vehicle-gate-checklists'] });
                queryClient.invalidateQueries({ queryKey: ['driver-checklist-history'] });
            });
            if (synced > 0) {
                queryClient.invalidateQueries({ queryKey: ['vehicle-gate-checklists'] });
                queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                queryClient.invalidateQueries({ queryKey: ['driver-checklist-history'] });
                toast({
                    title: 'Sincronizado!',
                    description: `${synced} checklist(s) enviado(s) com sucesso.`,
                });
            }
            if (failed > 0) {
                toast({
                    title: 'Sincronização pendente',
                    description: `${failed} checklist(s) não puderam ser enviados. Verifique sua conexão.`,
                    variant: 'destructive',
                });
            }
        } finally {
            setIsSyncingOffline(false);
        }
    };

    const { data: vehicles = [] } = useQuery({
        queryKey: ['vehicles'],
        queryFn: fleetService.getVehicles,
    });

    const { data: drivers = [] } = useQuery({
        queryKey: ['drivers'],
        queryFn: driverService.getDrivers,
    });

    const isDriver = isDriverUser(user);

    // Identifica o registro de motorista vinculado ao usuário logado (por employeeId, userId ou nome)
    const matchedDriver = useMemo(() => {
        if (!user || drivers.length === 0) return null;
        return (
            drivers.find((d) => user.employeeId && (d.employeeId === user.employeeId || d.id === user.employeeId)) ||
            drivers.find((d) => user.id && d.userId === user.id) ||
            drivers.find((d) => user.name && d.name.trim().toLowerCase() === user.name.trim().toLowerCase()) ||
            null
        );
    }, [drivers, user]);

    const selectedVehicle = useMemo(
        () => vehicles.find((v) => v.id === vehicleId),
        [vehicles, vehicleId]
    );

    // Limpeza de texto de marca/modelo e prevenção de ruídos de assinatura digital do Detran
    const cleanVehicleDesc = (brand?: string | null, model?: string | null) => {
        const isJunk = (val?: string | null) => {
            if (!val) return true;
            const lower = val.toLowerCase().trim();
            return (
                lower.includes('assinado') ||
                lower.includes('assinatura') ||
                lower.includes('detran') ||
                lower.includes('certificado') ||
                lower.includes('digitalmente') ||
                lower.includes('documento') ||
                lower.length > 50
            );
        };

        const cleanBrand = isJunk(brand) ? '' : brand?.trim() || '';
        const cleanModel = isJunk(model) ? '' : model?.trim() || '';

        if (cleanBrand && cleanModel) {
            if (cleanModel.toLowerCase().includes(cleanBrand.toLowerCase())) {
                return cleanModel;
            }
            return `${cleanBrand} ${cleanModel}`;
        }
        return cleanBrand || cleanModel || '';
    };

    // Opções otimizadas e limpas para o seletor responsivo
    const vehicleOptions = useMemo<SearchableOption[]>(() => {
        return vehicles.map((v) => {
            const desc = cleanVehicleDesc(v.brand, v.model);
            return {
                value: v.id,
                label: v.plate,
                subtitle: desc || undefined,
                badge: v.currentMileage != null ? `${v.currentMileage.toLocaleString('pt-BR')} km` : undefined,
                badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                keywords: [
                    v.plate,
                    v.plate.replace(/[^a-zA-Z0-9]/g, ''),
                    v.brand || '',
                    v.model || '',
                    v.fleetNumber || ''
                ].filter(Boolean)
            };
        });
    }, [vehicles]);

    // Auto-seleciona o motorista se o usuário logado for motorista ou tiver registro correspondente
    useEffect(() => {
        if (matchedDriver && driverId !== matchedDriver.id) {
            setDriverId(matchedDriver.id);
        } else if (isDriver && !driverId && drivers.length > 0 && user?.employeeId) {
            setDriverId(user.employeeId);
        }
    }, [matchedDriver, isDriver, user?.employeeId, driverId, drivers.length]);

    const effectiveDriverId = driverId || matchedDriver?.id || (isDriver && drivers.length > 0 ? (matchedDriver?.id || user?.employeeId) : undefined);

    // Cálculos em tempo real de distâncias
    const tripDistance = useMemo(() => {
        const init = Number.parseInt(kmInitial, 10);
        const fin = Number.parseInt(kmFinal, 10);
        if (!Number.isNaN(init) && !Number.isNaN(fin) && fin >= init) {
            return fin - init;
        }
        return 0;
    }, [kmInitial, kmFinal]);

    const displacementDistance = useMemo(() => {
        if (!hasDisplacement) return 0;
        const init = Number.parseInt(displacementInitialKm || kmFinal, 10);
        const fin = Number.parseInt(displacementFinalKm, 10);
        if (!Number.isNaN(init) && !Number.isNaN(fin) && fin >= init) {
            return fin - init;
        }
        return 0;
    }, [hasDisplacement, displacementInitialKm, kmFinal, displacementFinalKm]);

    const totalDistance = useMemo(() => {
        return tripDistance + displacementDistance;
    }, [tripDistance, displacementDistance]);

    // Odômetro efetivo para alertas e envio
    const effectiveOdometerKm = useMemo(() => {
        if (activeTab === 'EXIT') {
            return Number.parseInt(kmInitial || kmReading, 10);
        }
        if (hasDisplacement && displacementFinalKm) {
            return Number.parseInt(displacementFinalKm, 10);
        }
        return Number.parseInt(kmFinal || kmReading, 10);
    }, [activeTab, kmInitial, kmReading, hasDisplacement, displacementFinalKm, kmFinal]);

    // Sincroniza KM Inicial quando o veículo ou a aba mudar
    useEffect(() => {
        if (selectedVehicle?.currentMileage != null) {
            const currentMileageStr = selectedVehicle.currentMileage.toString();
            if (activeTab === 'EXIT' && !kmInitial) {
                setKmInitial(currentMileageStr);
                setKmReading(currentMileageStr);
            } else if (activeTab === 'ARRIVAL' && !kmInitial) {
                setKmInitial(currentMileageStr);
            }
        }
    }, [selectedVehicle, activeTab]);

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

    // Cálculo das manutenções com base no KM informado
    const maintenanceStatus = useMemo(() => {
        const km = !Number.isNaN(effectiveOdometerKm) ? effectiveOdometerKm : Number.parseInt(kmReading, 10);
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
        onError: (err: any, variables) => {
            const isNetworkError = !err?.response || !navigator.onLine || err?.code === 'ERR_NETWORK';
            if (isNetworkError && variables?.data) {
                offlineSyncService.saveOfflineChecklist(variables.data, {
                    vehiclePlate: selectedVehicle?.plate,
                    driverName: matchedDriver?.name || user?.name,
                });
                setPendingOfflineCount(offlineSyncService.getPendingChecklists().length);
                toast({
                    title: 'Sem sinal - Checklist gravado offline',
                    description: 'A rede oscilou durante o envio. O registro foi armazenado com segurança no dispositivo e será enviado assim que a internet voltar.',
                });
                resetForm();
                return;
            }
            toast({
                title: 'Erro ao registrar checklist',
                description: err?.message || 'Tente novamente.',
                variant: 'destructive',
            });
        },
    });

    const resetForm = () => {
        setKmReading('');
        setKmInitial('');
        setKmFinal('');
        setHasDisplacement(false);
        setDisplacementInitialKm('');
        setDisplacementFinalKm('');
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

    const handleCategoryToggle = (category: string, targetChecked: boolean) => {
        setChecklistItems((prev) =>
            prev.map((i) => (i.category === category ? { ...i, checked: targetChecked } : i))
        );
    };

    const handleCheckAll = (targetChecked: boolean) => {
        setChecklistItems((prev) => prev.map((i) => ({ ...i, checked: targetChecked })));
    };

    const handleSubmit = () => {
        if (!vehicleId) {
            toast({ title: 'Selecione o veículo', description: 'Escolha o veículo para realizar o checklist.', variant: 'destructive' });
            return;
        }

        let finalOdometer = 0;
        let kmInitNum: number | undefined;
        let kmFinalNum: number | undefined;
        let displacementFinalNum: number | undefined;

        if (activeTab === 'EXIT') {
            kmInitNum = Number.parseInt(kmInitial || kmReading, 10);
            if (Number.isNaN(kmInitNum) || kmInitNum < 0) {
                toast({
                    title: 'Informe o KM Inicial',
                    description: 'A quilometragem inicial da viagem é obrigatória na saída.',
                    variant: 'destructive',
                });
                return;
            }
            finalOdometer = kmInitNum;
        } else {
            kmFinalNum = Number.parseInt(kmFinal || kmReading, 10);
            if (Number.isNaN(kmFinalNum) || kmFinalNum < 0) {
                toast({
                    title: 'Informe o KM Final',
                    description: 'A quilometragem final no destino do cliente é obrigatória na chegada.',
                    variant: 'destructive',
                });
                return;
            }

            kmInitNum = Number.parseInt(kmInitial, 10);
            if (!Number.isNaN(kmInitNum) && kmFinalNum < kmInitNum) {
                toast({
                    title: 'KM Final inválido',
                    description: 'O KM final não pode ser menor que o KM inicial da viagem.',
                    variant: 'destructive',
                });
                return;
            }

            if (hasDisplacement) {
                displacementFinalNum = Number.parseInt(displacementFinalKm, 10);
                if (Number.isNaN(displacementFinalNum) || displacementFinalNum < 0) {
                    toast({
                        title: 'Informe o KM Final da Garagem',
                        description: 'O KM final ao entregar o veículo na garagem é obrigatório.',
                        variant: 'destructive',
                    });
                    return;
                }
                if (displacementFinalNum < kmFinalNum) {
                    toast({
                        title: 'KM da Garagem inválido',
                        description: 'O KM final na garagem não pode ser menor que o KM final do cliente.',
                        variant: 'destructive',
                    });
                    return;
                }
                finalOdometer = displacementFinalNum;
            } else {
                finalOdometer = kmFinalNum;
            }
        }

        if (requiredChecked < requiredCount) {
            toast({
                title: 'Itens obrigatórios pendentes',
                description: `Marque todos os itens obrigatórios (${requiredChecked}/${requiredCount}).`,
                variant: 'destructive',
            });
            return;
        }

        const checklistPayloadData = {
            vehicleId,
            driverId: effectiveDriverId || undefined,
            type: activeTab,
            kmReading: finalOdometer,
            initialKm: kmInitNum != null && !Number.isNaN(kmInitNum) ? kmInitNum : undefined,
            finalKm: kmFinalNum != null && !Number.isNaN(kmFinalNum) ? kmFinalNum : undefined,
            distanceTravelled: tripDistance > 0 ? tripDistance : undefined,
            hasDisplacement,
            displacementType: hasDisplacement ? 'Deslocamento Garagem' : undefined,
            displacementInitialKm: hasDisplacement ? (Number.parseInt(displacementInitialKm || kmFinal, 10) || undefined) : undefined,
            displacementFinalKm: hasDisplacement ? displacementFinalNum : undefined,
            displacementDistance: hasDisplacement && displacementDistance > 0 ? displacementDistance : undefined,
            totalKmTravelled: totalDistance > 0 ? totalDistance : (tripDistance > 0 ? tripDistance : undefined),
            checklistData: checklistDataJson,
            driverProblemReport: driverProblemReport.trim() || undefined,
            observations: observations.trim() || undefined,
        };

        if (!offlineSyncService.isOnline()) {
            offlineSyncService.saveOfflineChecklist(checklistPayloadData, {
                vehiclePlate: selectedVehicle?.plate,
                driverName: matchedDriver?.name || user?.name,
            });
            setPendingOfflineCount(offlineSyncService.getPendingChecklists().length);
            toast({
                title: 'Checklist salvo no aparelho (Modo Offline)',
                description: 'Você está sem conexão de rede. Os dados foram gravados com sucesso e serão enviados automaticamente quando o sinal retornar.',
            });
            resetForm();
            return;
        }

        createMutation.mutate({
            data: checklistPayloadData,
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

    // Histórico de checklists: motorista logado vê os seus; gestores/admins veem os da frota ou do filtro selecionado
    const { data: history = [], isLoading: isLoadingHistory } = useQuery({
        queryKey: ['driver-checklist-history', effectiveDriverId, isDriver, driverId, vehicleId],
        queryFn: async () => {
            const filterDriver = isDriver ? effectiveDriverId : (driverId || undefined);
            const all = await vehicleGateChecklistService.findAll({
                driverId: filterDriver || undefined,
                vehicleId: vehicleId || undefined,
            });
            return all.slice(0, 15);
        },
        enabled: !isDriver || !!effectiveDriverId || drivers.length > 0,
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

                {/* Banner de Modo Offline e Sincronização */}
                {(!isNetworkOnline || pendingOfflineCount > 0) && (
                    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm transition-all ${
                        !isNetworkOnline
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                            : 'bg-primary/10 border-primary/20 text-foreground'
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${!isNetworkOnline ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-primary/20 text-primary'}`}>
                                {!isNetworkOnline ? (
                                    <WifiOff className="h-5 w-5 animate-pulse" />
                                ) : (
                                    <CloudUpload className="h-5 w-5" />
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-sm">
                                    {!isNetworkOnline ? 'Modo Offline Ativo' : 'Checklists Salvos no Aparelho'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {!isNetworkOnline
                                        ? 'Sem internet no momento. Pode preencher e salvar o checklist normalmente: ele será armazenado com segurança e transmitido assim que o sinal voltar.'
                                        : `${pendingOfflineCount} checklist(s) aguardando envio para o servidor.`}
                                </p>
                            </div>
                        </div>
                        {isNetworkOnline && pendingOfflineCount > 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleManualSync}
                                disabled={isSyncingOffline}
                                className="shrink-0 bg-background hover:bg-muted font-medium"
                            >
                                {isSyncingOffline ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <CloudUpload className="h-4 w-4 mr-2 text-primary" />
                                )}
                                Sincronizar ({pendingOfflineCount})
                            </Button>
                        )}
                    </div>
                )}

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

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pb-2 max-w-xl">
                    <Button
                        variant={activeTab === 'EXIT' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('EXIT')}
                        className={`h-14 sm:h-12 px-3 sm:px-6 text-sm sm:text-base font-bold rounded-xl transition-all shadow-sm ${
                            activeTab === 'EXIT'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md ring-2 ring-blue-500/30'
                                : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <LogOut className="mr-2 h-5 w-5 shrink-0" /> Check-out (Saída)
                    </Button>
                    <Button
                        variant={activeTab === 'ARRIVAL' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('ARRIVAL')}
                        className={`h-14 sm:h-12 px-3 sm:px-6 text-sm sm:text-base font-bold rounded-xl transition-all shadow-sm ${
                            activeTab === 'ARRIVAL'
                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-md ring-2 ring-green-500/30'
                                : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <LogIn className="mr-2 h-5 w-5 shrink-0" /> Check-in (Chegada)
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coluna principal: formulário */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Identificação */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <Car className="h-5 w-5 text-primary" /> Identificação
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">
                                    {activeTab === 'EXIT'
                                        ? 'Registre a saída do veículo antes de iniciar a viagem.'
                                        : 'Registre a chegada do veículo ao final da viagem.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm sm:text-base font-bold text-foreground">Veículo *</Label>
                                        <SearchableSelect
                                            value={vehicleId}
                                            onChange={(val) => setVehicleId(val)}
                                            options={vehicleOptions}
                                            size="lg"
                                            placeholder="Selecione o veículo..."
                                            searchPlaceholder="Buscar por placa, modelo ou frota..."
                                            emptyText="Nenhum veículo encontrado."
                                            className="w-full bg-muted/40 border-input text-foreground h-14 sm:h-12 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm sm:text-base font-bold text-foreground">Motorista {isDriver ? 'Responsável' : ''}</Label>
                                        {isDriver ? (
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2.5 h-14 sm:h-12 px-3.5 rounded-xl border border-input bg-muted/40 text-sm sm:text-base">
                                                    <UserCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                                                    <span className="font-bold text-foreground truncate">
                                                        {user?.name || 'Motorista Logado'}
                                                    </span>
                                                    <Badge variant="outline" className="ml-auto text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                                        Você (Motorista)
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Identificação automática pelo seu login de motorista.
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <Select value={driverId || 'none'} onValueChange={(v) => setDriverId(v === 'none' ? '' : v)}>
                                                    <SelectTrigger className="h-14 sm:h-12 text-sm sm:text-base font-semibold rounded-xl">
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
                                            </>
                                        )}
                                    </div>
                                </div>

                                {selectedVehicle && (
                                    <div className="flex flex-wrap gap-3 pt-2">
                                        <Badge variant="outline" className="text-xs py-1 px-2.5">
                                            KM atual: <strong className="ml-1 font-mono text-emerald-400">{selectedVehicle.currentMileage?.toLocaleString('pt-BR')} km</strong>
                                        </Badge>
                                        {selectedVehicle.lastMaintenanceDate && (
                                            <Badge variant="outline" className="text-xs py-1 px-2.5">
                                                Última manutenção: {new Date(selectedVehicle.lastMaintenanceDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs py-1 px-2.5">
                                            Status: {selectedVehicle.status === 'ACTIVE' ? 'Ativo' : selectedVehicle.status}
                                        </Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Odômetro */}
                        <Card className="border-seguranca-yellow/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <Gauge className="h-5 w-5 text-primary" />
                                    {activeTab === 'EXIT'
                                        ? 'Odômetro de Saída (Início da Viagem)'
                                        : 'Odômetro de Chegada & Deslocamento'}
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">
                                    {activeTab === 'EXIT'
                                        ? 'Informe o KM no início da viagem do cliente (ao pegar o primeiro funcionário na origem).'
                                        : 'Informe o KM na entrega no cliente e, se houver, o retorno/deslocamento para a garagem.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {activeTab === 'EXIT' ? (
                                    <div className="space-y-2">
                                        <Label className="text-sm sm:text-base font-bold flex items-center gap-2 text-foreground">
                                            <MapPin className="h-4 w-4 text-emerald-500" />
                                            KM Inicial da Viagem (Origem) *
                                        </Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={kmInitial}
                                            onChange={(e) => {
                                                setKmInitial(e.target.value);
                                                setKmReading(e.target.value);
                                            }}
                                            placeholder="Ex: 45000"
                                            className="font-mono text-xl sm:text-2xl font-bold h-14 sm:h-13 text-blue-400 tracking-wider rounded-xl border-blue-500/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        />
                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                            Quilometragem no momento do embarque inicial dos passageiros.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm sm:text-base font-bold text-muted-foreground flex items-center gap-1.5">
                                                    <MapPin className="h-4 w-4 text-emerald-500" />
                                                    KM Inicial da Viagem (Origem)
                                                </Label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={kmInitial}
                                                    onChange={(e) => setKmInitial(e.target.value)}
                                                    placeholder="Ex: 45000"
                                                    className="font-mono text-lg sm:text-xl font-bold h-14 sm:h-13 rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
                                                    <MapPin className="h-4 w-4 text-blue-500" />
                                                    KM Final da Viagem (Destino Cliente) *
                                                </Label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={kmFinal}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setKmFinal(val);
                                                        setDisplacementInitialKm(val);
                                                        if (!hasDisplacement) setKmReading(val);
                                                    }}
                                                    placeholder="Ex: 45042"
                                                    className="font-mono text-xl sm:text-2xl font-bold h-14 sm:h-13 text-emerald-400 tracking-wider rounded-xl border-emerald-500/40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                                />
                                            </div>
                                        </div>

                                        {tripDistance > 0 && (
                                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-sm sm:text-base">
                                                <span className="text-blue-400 font-bold flex items-center gap-2">
                                                    <Route className="h-5 w-5" /> Percurso da Viagem com Passageiros:
                                                </span>
                                                <Badge className="bg-blue-600 text-white font-bold font-mono text-sm sm:text-base px-3 py-1">
                                                    {tripDistance} km
                                                </Badge>
                                            </div>
                                        )}

                                        {/* Bloco de Deslocamento para a Garagem */}
                                        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 space-y-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm sm:text-base font-bold flex items-center gap-2 cursor-pointer">
                                                        <Building2 className="h-5 w-5 text-amber-500" />
                                                        Deslocamento para a Garagem
                                                    </Label>
                                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                                        Ative caso tenha retornado com o veículo para a garagem após entregar os passageiros.
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={hasDisplacement}
                                                    className="scale-110"
                                                    onCheckedChange={(checked) => {
                                                        setHasDisplacement(checked);
                                                        if (checked) {
                                                            setDisplacementInitialKm(kmFinal);
                                                        } else {
                                                            setKmReading(kmFinal);
                                                        }
                                                    }}
                                                />
                                            </div>

                                            {hasDisplacement && (
                                                <div className="pt-3 border-t border-zinc-800/80 space-y-4 animate-in fade-in-50">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs sm:text-sm font-semibold text-muted-foreground">
                                                                KM Inicial do Deslocamento
                                                            </Label>
                                                            <div className="h-14 sm:h-13 px-4 rounded-xl border border-input bg-muted/50 flex items-center font-mono text-lg sm:text-xl font-bold text-foreground">
                                                                {displacementInitialKm || kmFinal || '—'}
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                Puxado automaticamente do KM final do cliente.
                                                            </p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs sm:text-sm font-bold text-amber-400">
                                                                KM Final na Garagem *
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                value={displacementFinalKm}
                                                                onChange={(e) => {
                                                                    setDisplacementFinalKm(e.target.value);
                                                                    setKmReading(e.target.value);
                                                                }}
                                                                placeholder="Ex: 45055"
                                                                className="font-mono text-xl sm:text-2xl font-bold h-14 sm:h-13 text-amber-400 tracking-wider rounded-xl border-amber-500/50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                                            />
                                                            <p className="text-[11px] text-muted-foreground">
                                                                Leitura do odômetro ao estacionar na garagem.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {displacementDistance > 0 && (
                                                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                                                            <span className="text-amber-400 font-medium flex items-center gap-1.5">
                                                                <Building2 className="h-3.5 w-3.5" /> Trajeto Vazio até a Garagem:
                                                            </span>
                                                            <Badge className="bg-amber-600 text-white font-bold font-mono">
                                                                {displacementDistance} km
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Resumo de KM Percorrido */}
                                        {(tripDistance > 0 || displacementDistance > 0) && (
                                            <div className="p-3.5 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-950 border border-emerald-500/30 space-y-2">
                                                <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <TrendingUp className="h-4 w-4" />
                                                    Resumo da Rodagem do Percurso
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                                    <div className="p-2 rounded-lg bg-zinc-800/50">
                                                        <div className="text-[10px] text-zinc-400">Viagem Cliente</div>
                                                        <div className="text-sm sm:text-base font-black text-blue-400 font-mono">
                                                            {tripDistance} km
                                                        </div>
                                                    </div>
                                                    <div className="p-2 rounded-lg bg-zinc-800/50">
                                                        <div className="text-[10px] text-zinc-400">Desloc. Garagem</div>
                                                        <div className="text-sm sm:text-base font-black text-amber-400 font-mono">
                                                            {hasDisplacement ? displacementDistance : 0} km
                                                        </div>
                                                    </div>
                                                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                                                        <div className="text-[10px] text-emerald-300 font-bold">Total Geral</div>
                                                        <div className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                                                            {totalDistance} km
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

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
                        <Card className="border-border/80 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                            <ClipboardCheck className="h-5 w-5 text-primary" /> Checklist de conferência
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm mt-1">
                                            Toque em cada item para marcar o estado encontrado no veículo.
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleCheckAll(true)}
                                            className="text-xs h-9 px-3 gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500 font-medium"
                                        >
                                            <CheckCheck className="h-4 w-4" /> Marcar todos OK
                                        </Button>
                                        {checkedCount > 0 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCheckAll(false)}
                                                className="text-xs h-9 px-2.5 text-muted-foreground hover:text-foreground"
                                                title="Desmarcar todos"
                                            >
                                                <RotateCcw className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-0">
                                {/* Barra de progresso destacada */}
                                <div className="p-3 sm:p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                                    <div className="flex items-center justify-between text-xs sm:text-sm">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2
                                                className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                                                    requiredChecked === requiredCount && requiredCount > 0
                                                        ? 'text-emerald-500'
                                                        : 'text-primary'
                                                }`}
                                            />
                                            <span>
                                                Itens obrigatórios: <strong className="text-foreground">{requiredChecked}/{requiredCount}</strong>
                                            </span>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={`font-mono text-xs ${
                                                requiredChecked === requiredCount && requiredCount > 0
                                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                                    : ''
                                            }`}
                                        >
                                            {progressPercent}% concluído
                                        </Badge>
                                    </div>
                                    <Progress
                                        value={progressPercent}
                                        className={`h-2.5 ${requiredChecked === requiredCount && requiredCount > 0 ? '[&>div]:bg-emerald-500' : '[&>div]:bg-primary'}`}
                                    />
                                    {requiredChecked === requiredCount && requiredCount > 0 && (
                                        <p className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 pt-0.5">
                                            <Sparkles className="h-3.5 w-3.5" /> Todos os itens obrigatórios foram verificados!
                                        </p>
                                    )}
                                </div>

                                {/* Categorias e Itens com touch targets confortáveis */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-none md:max-h-[560px] md:overflow-y-auto pr-0 md:pr-1">
                                    {Object.entries(groupedChecklist).map(([cat, items]) => {
                                        const catChecked = items.filter((i) => i.checked).length;
                                        const catTotal = items.length;
                                        const isAllCatChecked = catChecked === catTotal && catTotal > 0;

                                        return (
                                            <div
                                                key={cat}
                                                className={`rounded-xl border transition-all p-3 sm:p-3.5 ${
                                                    isAllCatChecked
                                                        ? 'border-emerald-500/30 bg-emerald-500/[0.03]'
                                                        : 'border-border/80 bg-card/60'
                                                }`}
                                            >
                                                {/* Header da Categoria com ação rápida */}
                                                <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-border/50">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm text-foreground">
                                                            {CATEGORY_LABELS[cat] || cat}
                                                        </span>
                                                        <span
                                                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                                                isAllCatChecked
                                                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                                                                    : 'bg-muted text-muted-foreground'
                                                            }`}
                                                        >
                                                            {catChecked}/{catTotal}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCategoryToggle(cat, !isAllCatChecked)}
                                                        className={`text-xs font-semibold transition-colors px-2.5 py-1 rounded-md active:scale-95 ${
                                                            isAllCatChecked
                                                                ? 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                                                : 'text-primary hover:bg-primary/10'
                                                        }`}
                                                    >
                                                        {isAllCatChecked ? 'Desmarcar' : '✓ Tudo OK'}
                                                    </button>
                                                </div>

                                                {/* Lista de Itens em formato de botões de toque */}
                                                <div className="space-y-2">
                                                    {items.map((item) => {
                                                        const isChecked = !!item.checked;
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                role="checkbox"
                                                                aria-checked={isChecked}
                                                                tabIndex={0}
                                                                onClick={() => handleItemCheck(item.id, !isChecked)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === ' ' || e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        handleItemCheck(item.id, !isChecked);
                                                                    }
                                                                }}
                                                                className={`w-full min-h-[52px] p-2.5 sm:p-3 rounded-lg border transition-all cursor-pointer select-none flex items-center justify-between gap-3 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                                                    isChecked
                                                                        ? 'bg-emerald-500/10 border-emerald-500/40 text-foreground shadow-xs'
                                                                        : 'bg-background/80 border-border/70 hover:bg-muted/40 hover:border-border text-foreground/90'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                    {/* Checkbox tátil grande */}
                                                                    <div
                                                                        className={`h-7 w-7 sm:h-7 sm:w-7 rounded-md flex items-center justify-center shrink-0 border-2 transition-all ${
                                                                            isChecked
                                                                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                                                                : 'border-muted-foreground/50 bg-background/60 hover:border-primary'
                                                                        }`}
                                                                    >
                                                                        {isChecked && (
                                                                            <Check className="h-4.5 w-4.5 stroke-[3]" />
                                                                        )}
                                                                    </div>

                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                                            <span className={`text-sm sm:text-base font-medium leading-tight ${isChecked ? 'text-foreground' : 'text-foreground/90'}`}>
                                                                                {item.title}
                                                                            </span>
                                                                            {item.required && !isChecked && (
                                                                                <span className="text-red-500 font-bold" title="Obrigatório">*</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Badge de status no lado direito */}
                                                                <div className="shrink-0">
                                                                    {isChecked ? (
                                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                                                                            <Check className="h-3 w-3 stroke-[3]" /> OK
                                                                        </span>
                                                                    ) : item.required ? (
                                                                        <span className="text-[10px] sm:text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                                            Obrigatório
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[10px] text-muted-foreground/70">
                                                                            Opcional
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
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

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={resetForm}
                                disabled={createMutation.isPending}
                                className="h-14 sm:h-12 px-6 text-sm sm:text-base font-semibold w-full sm:w-auto rounded-xl hover:bg-muted"
                            >
                                Limpar
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={createMutation.isPending}
                                className={`h-14 sm:h-12 px-6 sm:px-8 text-base sm:text-lg font-bold w-full sm:w-auto rounded-xl shadow-lg transition-all ${
                                    activeTab === 'EXIT'
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/30 ring-2 ring-blue-500/20'
                                        : 'bg-green-600 hover:bg-green-700 text-white shadow-green-900/30 ring-2 ring-green-500/20'
                                }`}
                            >
                                {createMutation.isPending ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6 mr-2 shrink-0" />
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
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-base font-bold">
                                            <CalendarClock className="h-5 w-5 text-primary" /> Meus últimos registros
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {driverId ? 'Histórico do motorista selecionado' : 'Histórico recente da frota'}
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs px-2 gap-1.5 border-border hover:bg-muted text-foreground"
                                        onClick={() => navigate('/manutencao/portaria')}
                                        title="Abrir painel completo de portaria e relatórios"
                                    >
                                        <ExternalLink className="h-3 w-3 text-primary" />
                                        Relatórios Gerais
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoadingHistory ? (
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                ) : history.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        Nenhum registro ainda.
                                    </p>
                                ) : (
                                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                        {history.map((c) => (
                                            <div
                                                key={c.id}
                                                className="border rounded-lg p-3 space-y-2 bg-card/60 hover:border-primary/50 hover:bg-card transition-all cursor-pointer shadow-sm group"
                                                onClick={() => {
                                                    setSelectedChecklistForView(c);
                                                    setIsDetailsModalOpen(true);
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <Badge
                                                        variant="outline"
                                                        className={c.type === 'EXIT' ? 'border-blue-500 text-blue-500 font-semibold' : 'border-green-500 text-green-600 font-semibold'}
                                                    >
                                                        {c.type === 'EXIT' ? 'Saída' : 'Chegada'}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(c.occurredAt).toLocaleString('pt-BR')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-sm font-bold text-foreground block">{c.vehiclePlate || '-'}</span>
                                                        {c.driverName && (
                                                            <span className="text-xs text-muted-foreground truncate block max-w-[140px]">
                                                                {c.driverName}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-mono text-sm font-semibold block">{c.kmReading.toLocaleString('pt-BR')} km</span>
                                                        {c.distanceTravelled != null && (
                                                            <span className="text-[10px] text-blue-400 block font-mono">
                                                                Viagem: {c.distanceTravelled} km
                                                                {c.displacementDistance != null ? ` • Desl: ${c.displacementDistance} km` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {(c.odometerPhotoUrl || c.vehiclePhotos) && (
                                                    <div className="flex items-center gap-3 text-xs">
                                                        {c.odometerPhotoUrl && (
                                                            <span className="inline-flex items-center gap-1 text-primary">
                                                                <ImageIcon className="h-3 w-3" /> Odômetro
                                                            </span>
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
                                                    <p className="text-xs text-red-400 bg-red-500/10 p-1.5 rounded flex items-start gap-1">
                                                        <ShieldAlert className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                                        <span className="line-clamp-2">{c.driverProblemReport}</span>
                                                    </p>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full h-7 text-xs text-primary hover:bg-primary/10 gap-1.5 justify-center border border-border/50 group-hover:border-primary/40 mt-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedChecklistForView(c);
                                                        setIsDetailsModalOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Ver Checklist & Relatório PDF
                                                </Button>
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

            <ChecklistDetailsModal
                checklist={selectedChecklistForView}
                open={isDetailsModalOpen}
                onOpenChange={setIsDetailsModalOpen}
            />
        </StandardLayout>
    );
};

export default DriverChecklist;
