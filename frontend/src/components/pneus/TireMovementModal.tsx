import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveDrawer } from '@/components/ResponsiveDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import tireService, { Tire, TireLifecycleConfig } from '@/services/tireService';
import fleetService from '@/services/fleetService';
import { FrontAxleSecurityApprovalBox } from './FrontAxleSecurityApprovalBox';
import { DEFAULT_TIRE_LIFECYCLE_CONFIG, getLifeStageLabel, getPositionLabel, getTireDisplayCode } from '@/utils/tireLifecycle';
import { AlertTriangle, Ban, CheckCircle2, History, Loader2, ShieldAlert, Wrench } from 'lucide-react';

export interface TireMovementInitialSlot {
    vehicleId: string;
    axleNumber: number;
    positionIndex: number;
    positionCode: string;
}

interface TireMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tire: Tire | null;
    availableTires?: Tire[];
    initialSlot?: TireMovementInitialSlot | null;
    initialAction?: 'MOUNT' | 'DISMOUNT' | 'RECAP_SEND' | 'RECAP_RETURN' | 'SCRAP' | 'HISTORY';
    lifecycleConfig?: TireLifecycleConfig;
    onRequestRegisterTire?: () => void;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMPTY_LIST: any[] = [];

const CHASSIS_SLOTS = [
    { axleNumber: 1, positionIndex: 0, positionCode: 'DE', label: 'Eixo 1 • Dianteiro Esquerdo (DE)' },
    { axleNumber: 1, positionIndex: 1, positionCode: 'DD', label: 'Eixo 1 • Dianteiro Direito (DD)' },
    { axleNumber: 2, positionIndex: 0, positionCode: 'TOE', label: 'Eixo 2 • Tração Externo Esquerdo (TOE)' },
    { axleNumber: 2, positionIndex: 1, positionCode: 'TIE', label: 'Eixo 2 • Tração Interno Esquerdo (TIE)' },
    { axleNumber: 2, positionIndex: 2, positionCode: 'TID', label: 'Eixo 2 • Tração Interno Direito (TID)' },
    { axleNumber: 2, positionIndex: 3, positionCode: 'TOD', label: 'Eixo 2 • Tração Externo Direito (TOD)' },
    { axleNumber: 0, positionIndex: 0, positionCode: 'ESTEPE', label: 'Estepe (Reserva)' },
];

export const TireMovementModal: React.FC<TireMovementModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    tire,
    availableTires = EMPTY_LIST,
    initialSlot = null,
    initialAction,
    lifecycleConfig = DEFAULT_TIRE_LIFECYCLE_CONFIG,
    onRequestRegisterTire,
}) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [selectedTireId, setSelectedTireId] = useState<string>('');
    const [actionType, setActionType] = useState<'MOUNT' | 'DISMOUNT' | 'RECAP_SEND' | 'RECAP_RETURN' | 'SCRAP' | 'HISTORY'>('MOUNT');
    const [vehicleId, setVehicleId] = useState<string>('');
    const [slotKey, setSlotKey] = useState<string>('1-0');
    const [currentVehicleKm, setCurrentVehicleKm] = useState<number>(0);
    const [treadDepthMm, setTreadDepthMm] = useState<number>(15.0);
    const [dismountReason, setDismountReason] = useState<'ESTOQUE' | 'ENVIAR_REFORMA' | 'DESCARTE_SUCATA'>('ESTOQUE');
    const [recapVendor, setRecapVendor] = useState<string>('');
    const [recapCost, setRecapCost] = useState<number>(0);
    const [notes, setNotes] = useState<string>('');

    // Alçada de aprovação Eixo Dianteiro
    const [approverUsernameOrEmail, setApproverUsernameOrEmail] = useState<string>('');
    const [approverPassword, setApproverPassword] = useState<string>('');
    const [riskTermAccepted, setRiskTermAccepted] = useState<boolean>(false);

    const { data: vehicles = EMPTY_LIST } = useQuery({
        queryKey: ['vehicles'],
        queryFn: () => fleetService.getVehicles(false),
        enabled: isOpen,
        staleTime: 60_000,
    });

    const realVehicles = useMemo(
        () => vehicles.filter((v: any) => UUID_REGEX.test(String(v?.id || ''))),
        [vehicles]
    );

    const vehicleOptions: SearchableOption[] = useMemo(() => {
        const source = realVehicles.length > 0 ? realVehicles : vehicles;
        return source.map((v: any) => ({
            value: v.id,
            label: `${v.fleetNumber ? `[${v.fleetNumber}] ` : ''}${v.plate} • ${v.model}`.trim(),
            subtitle: `${(v.currentMileage || 0).toLocaleString('pt-BR')} km`,
            badge: v.fleetNumber || v.plate,
            keywords: [v.plate || '', (v.plate || '').replace(/[-\s]/g, ''), v.fleetNumber || '', v.brand || '', v.model || ''],
        }));
    }, [realVehicles, vehicles]);

    const activeTire: Tire | null = useMemo(() => {
        if (selectedTireId && availableTires.length > 0) {
            return availableTires.find((t) => t.id === selectedTireId) || tire;
        }
        return tire;
    }, [selectedTireId, availableTires, tire]);

    const { data: history = EMPTY_LIST, isLoading: loadingHistory } = useQuery({
        queryKey: ['tire-history', activeTire?.id],
        queryFn: () => tireService.getHistory(activeTire!.id),
        enabled: isOpen && Boolean(activeTire?.id),
        staleTime: 30_000,
    });

    useEffect(() => {
        if (!isOpen) return;

        setApproverUsernameOrEmail(user?.username || user?.email || '');
        setApproverPassword('');
        setRiskTermAccepted(false);
        setNotes('');
        setRecapVendor('');
        setRecapCost(0);

        if (initialSlot) {
            const firstAvailable = tire?.status === 'AVAILABLE' ? tire : availableTires[0];
            setSelectedTireId(firstAvailable?.id || '');
            setActionType('MOUNT');
            setVehicleId(initialSlot.vehicleId);
            setSlotKey(`${initialSlot.axleNumber}-${initialSlot.positionIndex}`);
            const v = vehicles.find((item: any) => item.id === initialSlot.vehicleId);
            setCurrentVehicleKm(v?.currentMileage || 0);
            setTreadDepthMm(firstAvailable?.currentTreadDepth != null ? Number(firstAvailable.currentTreadDepth) : 15.0);
            return;
        }

        if (tire) {
            setSelectedTireId(tire.id);
            if (initialAction) {
                setActionType(initialAction);
            } else if (tire.status === 'IN_USE') {
                setActionType('DISMOUNT');
            } else if (tire.status === 'RECAP') {
                setActionType('RECAP_RETURN');
            } else {
                setActionType('MOUNT');
            }
            const fallbackVehicleId = realVehicles[0]?.id || '';
            const initialVid = tire.vehicleId || fallbackVehicleId;
            setVehicleId(initialVid);
            const matchedV = realVehicles.find((v: any) => v.id === initialVid) || vehicles.find((v: any) => v.id === initialVid);
            setCurrentVehicleKm(matchedV?.currentMileage || tire.installKm || 0);
            setTreadDepthMm(tire.currentTreadDepth != null ? Number(tire.currentTreadDepth) : 15.0);
            setDismountReason('ESTOQUE');
        }
    }, [isOpen, tire, initialSlot, initialAction, availableTires.length]);

    useEffect(() => {
        if (!isOpen || actionType !== 'MOUNT') return;
        if ((!vehicleId || !UUID_REGEX.test(vehicleId)) && realVehicles.length > 0 && !initialSlot) {
            const firstReal = realVehicles[0];
            setVehicleId(firstReal.id);
            if (firstReal.currentMileage != null) {
                setCurrentVehicleKm(firstReal.currentMileage);
            }
        }
    }, [isOpen, actionType, vehicleId, realVehicles, initialSlot]);

    const selectedVehicle = vehicles.find((v: any) => v.id === vehicleId);
    const chosenSlot = CHASSIS_SLOTS.find((s) => `${s.axleNumber}-${s.positionIndex}` === slotKey) || CHASSIS_SLOTS[0];

    const handleVehicleChange = (newVehicleId: string) => {
        setVehicleId(newVehicleId);
        const v = vehicles.find((item: any) => item.id === newVehicleId);
        if (v?.currentMileage != null) {
            setCurrentVehicleKm(v.currentMileage);
        }
    };

    const maxRecaps = lifecycleConfig.maxRecapCount ?? 2;
    const activeRecapCount = activeTire?.recapCount || 0;
    const isRecapBlocked =
        activeRecapCount >= maxRecaps &&
        (actionType === 'RECAP_SEND' ||
            actionType === 'RECAP_RETURN' ||
            (actionType === 'DISMOUNT' && dismountReason === 'ENVIAR_REFORMA'));

    const requiresFrontAxleApproval =
        actionType === 'MOUNT' &&
        chosenSlot.axleNumber === 1 &&
        activeRecapCount > 0;

    const mutation = useMutation({
        mutationFn: async () => {
            if (!activeTire?.id) throw new Error('Selecione um pneu válido.');

            if (actionType === 'MOUNT') {
                if (!vehicleId) throw new Error('Selecione o veículo de destino.');
                return tireService.mountTire({
                    tireId: activeTire.id,
                    vehicleId,
                    axleNumber: chosenSlot.axleNumber,
                    positionIndex: chosenSlot.positionIndex,
                    positionCode: chosenSlot.positionCode,
                    currentVehicleKm,
                    treadDepthMm,
                    notes: notes || undefined,
                    approverUsernameOrEmail: requiresFrontAxleApproval ? approverUsernameOrEmail : undefined,
                    approverPassword: requiresFrontAxleApproval ? approverPassword : undefined,
                    riskTermAccepted: requiresFrontAxleApproval ? riskTermAccepted : undefined,
                });
            }

            if (actionType === 'DISMOUNT') {
                return tireService.dismountTire({
                    tireId: activeTire.id,
                    currentVehicleKm,
                    treadDepthMm,
                    removalReason: dismountReason,
                    notes: notes || undefined,
                });
            }

            if (actionType === 'RECAP_SEND') {
                return tireService.sendToRecap(activeTire.id, {
                    recapVendor,
                    treadDepthMm,
                    mileage: activeTire.currentMileage,
                    notes,
                });
            }

            if (actionType === 'RECAP_RETURN') {
                return tireService.returnFromRecap(activeTire.id, {
                    recapVendor,
                    recapCost,
                    treadDepthMm,
                    notes,
                });
            }

            if (actionType === 'SCRAP') {
                return tireService.scrapTire(activeTire.id, {
                    scrapReason: notes || 'Fim de vida útil / após 2ª recapagem',
                    notes,
                });
            }
            return activeTire;
        },
        onSuccess: () => {
            toast({ title: 'Operação de pneu registrada com sucesso!' });
            queryClient.invalidateQueries({ queryKey: ['tires'] });
            queryClient.invalidateQueries({ queryKey: ['tire-movements'] });
            queryClient.invalidateQueries({ queryKey: ['tire-exceptions'] });
            queryClient.invalidateQueries({ queryKey: ['tire-history'] });
            window.dispatchEvent(new CustomEvent('stock-data-changed'));
            onSuccess();
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || err?.message || 'Erro ao executar movimentação do pneu.';
            toast({ title: 'Operação bloqueada / erro', description: msg, variant: 'destructive' });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (actionType === 'MOUNT') {
            if (!vehicleId || !UUID_REGEX.test(vehicleId)) {
                fleetService.invalidateVehiclesCache();
                queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                toast({
                    title: 'Veículo não sincronizado',
                    description: 'Selecione um veículo real cadastrado no sistema (o ID atual é demonstrativo/cache antigo). Recarregando lista de veículos...',
                    variant: 'destructive',
                });
                return;
            }
        }
        if (isRecapBlocked) {
            toast({
                title: '3ª Recapagem Bloqueada',
                description: `Este pneu já possui ${activeRecapCount} recapagens (máximo ${maxRecaps}). Recomenda-se o sucateamento.`,
                variant: 'destructive',
            });
            return;
        }
        if (requiresFrontAxleApproval) {
            if (!riskTermAccepted) {
                toast({
                    title: 'Termo de Ciência Obrigatório',
                    description: 'Marque o Termo de Ciência de Risco para montar pneu recapado no eixo dianteiro.',
                    variant: 'destructive',
                });
                return;
            }
            if (!approverPassword.trim()) {
                toast({
                    title: 'Senha do Gestor Obrigatória',
                    description: 'Informe a senha de liberação do Gestor de Manutenção ou Administrador.',
                    variant: 'destructive',
                });
                return;
            }
        }
        mutation.mutate();
    };

    const showTirePicker = Boolean(initialSlot && availableTires.length > 0);
    const hasEmptyStockForSlot = Boolean(initialSlot && !activeTire && availableTires.length === 0);

    return (
        <ResponsiveDrawer
            isOpen={isOpen}
            onClose={onClose}
            className="sm:max-w-2xl"
            title={
                initialSlot
                    ? `Instalar Pneu • ${getPositionLabel(initialSlot.axleNumber, initialSlot.positionIndex, initialSlot.positionCode)}`
                    : `Movimentação & Ciclo • ${activeTire ? getTireDisplayCode(activeTire) : 'Pneu'}`
            }
        >
            <div className="space-y-4 p-4 sm:p-5">
                {hasEmptyStockForSlot && (
                    <div className="rounded-xl border border-amber-500/50 bg-amber-950/35 p-4 space-y-3 text-xs text-amber-100">
                        <div className="flex items-start gap-2.5">
                            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-bold text-sm text-white">
                                    Nenhum pneu disponível no estoque
                                </p>
                                <p className="text-gray-300 leading-relaxed">
                                    Todos os pneus cadastrados já estão instalados, em recapagem ou sucateados. Cadastre um novo pneu no estoque (ou importe a NF-e) para instalá-lo na posição{' '}
                                    <strong className="font-mono text-seguranca-yellow">
                                        {initialSlot?.positionCode}
                                    </strong>.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-amber-500/20">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="h-10 border-gray-600 text-gray-200"
                            >
                                Fechar
                            </Button>
                            {onRequestRegisterTire && (
                                <Button
                                    type="button"
                                    onClick={onRequestRegisterTire}
                                    className="h-10 bg-seguranca-red hover:bg-seguranca-darkred text-white font-semibold"
                                >
                                    + Cadastrar Pneu no Estoque
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {showTirePicker && (
                    <div className="space-y-1.5 bg-seguranca-black/50 p-3 rounded-lg border border-gray-700">
                        <Label className="text-xs text-seguranca-yellow font-semibold">
                            Selecionar Pneu Disponível no Estoque ({availableTires.length}) *
                        </Label>
                        <Select
                            value={selectedTireId}
                            onValueChange={(val) => {
                                setSelectedTireId(val);
                                const found = availableTires.find((t) => t.id === val);
                                if (found?.currentTreadDepth != null) setTreadDepthMm(Number(found.currentTreadDepth));
                            }}
                        >
                            <SelectTrigger className="bg-seguranca-black border-gray-600 text-xs text-white">
                                <SelectValue placeholder="Escolha um pneu do almoxarifado..." />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-600 text-white max-h-60">
                                {availableTires.map((t) => (
                                    <SelectItem key={t.id} value={t.id} className="text-xs">
                                        {getTireDisplayCode(t)} • {t.brand} {t.model} ({t.size}) • {getLifeStageLabel(t)} • Sulco {t.currentTreadDepth ?? '-'}mm
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {activeTire && (
                    <div className="bg-seguranca-black/60 border border-gray-700 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-seguranca-yellow text-sm">
                                    {getTireDisplayCode(activeTire)}
                                </span>
                                <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-200">
                                    {getLifeStageLabel(activeTire)}
                                </Badge>
                            </div>
                            <p className="text-gray-400 mt-0.5">
                                {activeTire.brand} {activeTire.model} • {activeTire.size} • Série: <span className="font-mono">{activeTire.serialNumber}</span>
                            </p>
                        </div>
                        <div className="text-right font-mono">
                            <span className="text-gray-400 block text-[10px]">KM TOTAL / VIDA ATUAL</span>
                            <span className="text-white font-bold">
                                {(activeTire.currentMileage || 0).toLocaleString()} km
                            </span>
                            <span className="text-blue-300 text-[11px] block">
                                Vida: {(activeTire.currentLifeMileage || 0).toLocaleString()} km • Sulco: {activeTire.currentTreadDepth ?? '-'}mm
                            </span>
                        </div>
                    </div>
                )}

                {/* Seletor de Operação */}
                {!initialSlot && activeTire && (
                    <div className="space-y-1.5">
                        <Label className="text-xs">Ação / Movimentação</Label>
                        <Select value={actionType} onValueChange={(val: any) => setActionType(val)}>
                            <SelectTrigger className="bg-seguranca-black border-gray-600 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-600 text-white">
                                {activeTire.status === 'AVAILABLE' && (
                                    <SelectItem value="MOUNT">Instalar no Veículo (Chassi)</SelectItem>
                                )}
                                {activeTire.status === 'IN_USE' && (
                                    <SelectItem value="DISMOUNT">Desmontar do Veículo</SelectItem>
                                )}
                                {(activeTire.status === 'AVAILABLE' || activeTire.status === 'RECAP') && (
                                    <SelectItem value="RECAP_SEND">Enviar para Recapagem</SelectItem>
                                )}
                                {activeTire.status === 'RECAP' && (
                                    <SelectItem value="RECAP_RETURN">Registrar Retorno de Recapagem</SelectItem>
                                )}
                                {activeTire.status !== 'SCRAPPED' && (
                                    <SelectItem value="SCRAP">Sucatear / Descartar Carcaça</SelectItem>
                                )}
                                <SelectItem value="HISTORY">Ver Apenas Histórico</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {actionType !== 'HISTORY' && activeTire && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {actionType === 'MOUNT' && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Veículo *</Label>
                                        <SearchableSelect
                                            value={vehicleId}
                                            onChange={(val) => handleVehicleChange(val)}
                                            options={vehicleOptions}
                                            maxVisibleOptions={60}
                                            disabled={Boolean(initialSlot)}
                                            placeholder="Selecione o veículo..."
                                            searchPlaceholder="Buscar placa, frota ou modelo..."
                                            emptyText="Nenhum veículo encontrado."
                                        />
                                        {realVehicles.length === 0 && (
                                            <p className="text-[10px] text-amber-400">
                                                Lista de veículos reais não carregada. Cadastre veículos em Gerenciar Frota ou clique em Atualizar.
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Eixo / Posição no Chassi *</Label>
                                        <Select value={slotKey} onValueChange={setSlotKey} disabled={Boolean(initialSlot)}>
                                            <SelectTrigger className="bg-seguranca-black border-gray-600 text-xs text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-seguranca-graphite border-gray-600 text-white">
                                                {CHASSIS_SLOTS.map((s) => (
                                                    <SelectItem key={`${s.axleNumber}-${s.positionIndex}`} value={`${s.axleNumber}-${s.positionIndex}`} className="text-xs">
                                                        {s.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">KM Atual do Veículo *</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={currentVehicleKm}
                                            onChange={(e) => setCurrentVehicleKm(Number(e.target.value))}
                                            className="bg-seguranca-black border-gray-600 font-mono text-white"
                                        />
                                        {selectedVehicle && (
                                            <span className="text-[10px] text-gray-400">
                                                Odômetro cadastro: {(selectedVehicle.currentMileage || 0).toLocaleString()} km
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Sulco na Montagem (mm)</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={treadDepthMm}
                                            onChange={(e) => setTreadDepthMm(Number(e.target.value))}
                                            className="bg-seguranca-black border-gray-600 font-mono text-white"
                                        />
                                    </div>
                                </div>

                                {requiresFrontAxleApproval && (
                                    <FrontAxleSecurityApprovalBox
                                        recapCount={activeRecapCount}
                                        approverUsernameOrEmail={approverUsernameOrEmail}
                                        onChangeApproverUsernameOrEmail={setApproverUsernameOrEmail}
                                        approverPassword={approverPassword}
                                        onChangeApproverPassword={setApproverPassword}
                                        riskTermAccepted={riskTermAccepted}
                                        onChangeRiskTermAccepted={setRiskTermAccepted}
                                    />
                                )}
                            </>
                        )}

                        {actionType === 'DISMOUNT' && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Destino após Desmontagem *</Label>
                                        <Select value={dismountReason} onValueChange={(v: any) => setDismountReason(v)}>
                                            <SelectTrigger className="bg-seguranca-black border-gray-600 text-xs text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-seguranca-graphite border-gray-600 text-white">
                                                <SelectItem value="ESTOQUE">Retornar ao Estoque</SelectItem>
                                                <SelectItem value="ENVIAR_REFORMA">Enviar para Recapagem</SelectItem>
                                                <SelectItem value="DESCARTE_SUCATA">Descartar (Sucatear)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">KM Atual do Veículo *</Label>
                                        <Input
                                            type="number"
                                            min={activeTire.installKm || 0}
                                            value={currentVehicleKm}
                                            onChange={(e) => setCurrentVehicleKm(Number(e.target.value))}
                                            className="bg-seguranca-black border-gray-600 font-mono text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Sulco Medido (mm)</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={treadDepthMm}
                                            onChange={(e) => setTreadDepthMm(Number(e.target.value))}
                                            className="bg-seguranca-black border-gray-600 font-mono text-white"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {actionType === 'RECAP_SEND' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Recapadora / Fornecedor</Label>
                                    <Input
                                        value={recapVendor}
                                        onChange={(e) => setRecapVendor(e.target.value)}
                                        placeholder="Ex: Vipal / Bandag / Oficina Externa"
                                        className="bg-seguranca-black border-gray-600 text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Sulco na Saída (mm)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={treadDepthMm}
                                        onChange={(e) => setTreadDepthMm(Number(e.target.value))}
                                        className="bg-seguranca-black border-gray-600 font-mono text-white"
                                    />
                                </div>
                            </div>
                        )}

                        {actionType === 'RECAP_RETURN' && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Recapadora</Label>
                                    <Input
                                        value={recapVendor}
                                        onChange={(e) => setRecapVendor(e.target.value)}
                                        placeholder="Nome da recapadora"
                                        className="bg-seguranca-black border-gray-600 text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Custo da Recapagem (R$)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={recapCost}
                                        onChange={(e) => setRecapCost(Number(e.target.value))}
                                        className="bg-seguranca-black border-gray-600 font-mono text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Novo Sulco (mm)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={treadDepthMm}
                                        onChange={(e) => setTreadDepthMm(Number(e.target.value))}
                                        className="bg-seguranca-black border-gray-600 font-mono text-white"
                                    />
                                </div>
                            </div>
                        )}

                        {isRecapBlocked && (
                            <div className="rounded-xl border-2 border-red-500 bg-red-950/50 p-4 flex items-start gap-3 text-red-100">
                                <Ban className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                                <div className="text-xs space-y-1">
                                    <p className="font-bold text-red-200 uppercase">
                                        Bloqueio Impeditivo: 3ª Recapagem Não Permitida
                                    </p>
                                    <p>
                                        Este pneu já completou <strong>{activeRecapCount} recapagens</strong> (limite padrão: {maxRecaps}). Por segurança estrutural da carcaça, não é possível enviar para uma 3ª reforma. Selecione <strong>Sucatear / Descartar Carcaça</strong>.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label className="text-xs">
                                {actionType === 'SCRAP' ? 'Motivo do Sucateamento *' : 'Observações'}
                            </Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="bg-seguranca-black border-gray-600 text-xs text-white"
                                rows={2}
                                placeholder={
                                    actionType === 'SCRAP'
                                        ? 'Ex: Carcaça atingiu 2ª recapagem / dano estrutural no talão...'
                                        : 'Observações técnicas da movimentação...'
                                }
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-700/60">
                            <Button type="button" variant="outline" onClick={onClose} className="border-gray-600 text-gray-200">
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={mutation.isPending || isRecapBlocked}
                                className={`font-semibold text-white ${
                                    requiresFrontAxleApproval
                                        ? 'bg-amber-600 hover:bg-amber-700'
                                        : 'bg-seguranca-red hover:bg-seguranca-darkred'
                                }`}
                            >
                                {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {requiresFrontAxleApproval
                                    ? 'Autorizar Exceção e Montar'
                                    : actionType === 'SCRAP'
                                    ? 'Confirmar Sucateamento'
                                    : 'Confirmar Movimentação'}
                            </Button>
                        </div>
                    </form>
                )}

                {/* Histórico do Pneu */}
                {activeTire && (
                    <div className="border-t border-gray-700/80 pt-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                            <History className="h-4 w-4 text-seguranca-yellow" />
                            <span>Histórico da Carcaça ({history.length})</span>
                        </div>
                        {loadingHistory ? (
                            <p className="text-xs text-gray-400">Carregando histórico...</p>
                        ) : history.length === 0 ? (
                            <p className="text-xs text-gray-500">Nenhuma movimentação registrada ainda.</p>
                        ) : (
                            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                {history.map((h) => (
                                    <div key={h.id} className="text-[11px] bg-seguranca-black/50 border border-gray-800 rounded-lg p-2 flex justify-between gap-2">
                                        <div>
                                            <span className="font-semibold text-seguranca-yellow">{h.type}</span>
                                            {h.positionCode && <span className="ml-1.5 text-blue-300 font-mono">[{h.positionCode}]</span>}
                                            {h.notes && <p className="text-gray-300 mt-0.5">{h.notes}</p>}
                                            {h.authorizedByName && (
                                                <p className="text-amber-300 text-[10px]">Autorizado por: {h.authorizedByName}</p>
                                            )}
                                        </div>
                                        <div className="text-right font-mono text-gray-400 shrink-0">
                                            <div>{(h.mileage || 0).toLocaleString()} km</div>
                                            <div>{new Date(h.movementDate).toLocaleDateString('pt-BR')}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ResponsiveDrawer>
    );
};
