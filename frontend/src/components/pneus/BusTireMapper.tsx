import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tire, TireLifecycleConfig } from '@/services/tireService';
import { Vehicle } from '@/types/fleet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import { AlertCircle, Plus, Package, Bus, Shield, ShieldAlert } from 'lucide-react';
import { ChassisDiagram, ChassisDiagramPosition } from '@/components/pneus/ChassisDiagram';
import {
    computeTireLiveMetrics,
    DEFAULT_TIRE_LIFECYCLE_CONFIG,
    getTireDisplayCode,
} from '@/utils/tireLifecycle';

interface BusTireMapperProps {
    tires: Tire[];
    vehicles: Vehicle[];
    lifecycleConfig?: TireLifecycleConfig;
    onTireClick: (tire: Tire) => void;
    onMountTireSlot: (slot: { vehicleId: string; axleNumber: number; positionIndex: number; positionCode: string }) => void;
    onMountSpecificTire?: (tire: Tire, vehicleId: string) => void;
    onDismountTire: (tire: Tire) => void;
    onRefresh: () => void;
}

type ChassisTopology =
    | 'AUTO'
    | '2_AXLES_DUAL'
    | '3_AXLES_TRUCK'
    | '3_AXLES_TAG'
    | '2_AXLES_SINGLE'
    | '4_AXLES_ARTICULATED';

interface ChassisPositionDef {
    axleNumber: number;
    positionIndex: number;
    positionCode: string;
    label: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const BusTireMapper: React.FC<BusTireMapperProps> = ({
    tires,
    vehicles,
    lifecycleConfig = DEFAULT_TIRE_LIFECYCLE_CONFIG,
    onTireClick,
    onMountTireSlot,
    onMountSpecificTire,
    onDismountTire,
    onRefresh,
}) => {
    const realVehicles = useMemo(
        () => vehicles.filter((v) => UUID_REGEX.test(String(v?.id || ''))),
        [vehicles]
    );
    const hasOnlyDemoVehicles = realVehicles.length === 0;

    const orderedVehicles = useMemo(() => {
        const source = realVehicles.length > 0 ? realVehicles : vehicles;
        return [...source].sort((a, b) => {
            const aBus = Boolean(a.fleetNumber || (a.vehicleType || '').includes('BUS') || (a.model || '').toLowerCase().includes('bus') || (a.model || '').toLowerCase().includes('marcopolo') || (a.model || '').toLowerCase().includes('comil'));
            const bBus = Boolean(b.fleetNumber || (b.vehicleType || '').includes('BUS') || (b.model || '').toLowerCase().includes('bus') || (b.model || '').toLowerCase().includes('marcopolo') || (b.model || '').toLowerCase().includes('comil'));
            if (aBus !== bBus) return aBus ? -1 : 1;
            return (a.fleetNumber || a.plate || '').localeCompare(b.fleetNumber || b.plate || '');
        });
    }, [realVehicles, vehicles]);

    const vehicleOptions: SearchableOption[] = useMemo(
        () =>
            orderedVehicles.map((v) => ({
                value: v.id,
                label: `${v.fleetNumber ? `[Frota ${v.fleetNumber}] ` : ''}${v.plate} - ${v.brand} ${v.model}`.trim(),
                subtitle: `${v.currentMileage?.toLocaleString('pt-BR') || 0} km`,
                badge: v.fleetNumber || v.plate,
                keywords: [
                    v.plate || '',
                    (v.plate || '').replace(/[-\s]/g, ''),
                    v.fleetNumber || '',
                    v.brand || '',
                    v.model || '',
                ],
            })),
        [orderedVehicles]
    );

    // Seleção de veículo ativo
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>(orderedVehicles[0]?.id || '');
    const [chassisType, setChassisType] = useState<ChassisTopology>('AUTO');

    useEffect(() => {
        const existsInOrdered = orderedVehicles.some((v) => v.id === selectedVehicleId);
        if ((!selectedVehicleId || !existsInOrdered) && orderedVehicles.length > 0) {
            setSelectedVehicleId(orderedVehicles[0].id);
        }
    }, [orderedVehicles, selectedVehicleId]);

    const selectedVehicle = orderedVehicles.find((v) => v.id === selectedVehicleId) || orderedVehicles[0];

    // Pneus instalados no veículo selecionado
    const vehicleTires = tires.filter(
        (t) => t.status === 'IN_USE' && (selectedVehicle ? t.vehicleId === selectedVehicle.id || t.vehiclePlate === selectedVehicle.plate : true)
    );

    // Pneus disponíveis no estoque
    const availableTires = tires.filter((t) => t.status === 'AVAILABLE');

    // Determina o tipo de layout do chassi com base no veículo ou seleção do usuário
    const getChassisTopology = (): Exclude<ChassisTopology, 'AUTO'> => {
        if (chassisType !== 'AUTO') return chassisType;
        if (!selectedVehicle) return '2_AXLES_DUAL';

        const modelLower = (selectedVehicle.model || '').toLowerCase();
        const vehicleType = String(selectedVehicle.vehicleType || '').toUpperCase();
        const busType = String(selectedVehicle.busType || '').toUpperCase();
        const axleCount = Number(selectedVehicle.axleCount) || 0;

        if (busType.includes('BIARTICULADO') || modelLower.includes('biarticul')) return '4_AXLES_ARTICULATED';
        if (axleCount >= 4) return '4_AXLES_ARTICULATED';
        if (axleCount >= 3) {
            // Trucks com PBT alto normalmente são 6x4; rodoviários/articulados são 6x2.
            if (vehicleType === 'TRUCK') return '3_AXLES_TRUCK';
            return '3_AXLES_TAG';
        }
        if (busType.includes('ARTICULADO') || modelLower.includes('articulad')) return '3_AXLES_TAG';
        if (vehicleType === 'TRUCK' || modelLower.includes('truck') || modelLower.includes('6x4') || modelLower.includes('trucad')) {
            return axleCount >= 3 ? '3_AXLES_TRUCK' : '2_AXLES_DUAL';
        }
        if (vehicleType === 'VAN' || vehicleType === 'CAR' || vehicleType === 'CAR_UTILITY' || vehicleType === 'PICKUP' || vehicleType === 'SUV'
            || modelLower.includes('van') || modelLower.includes('sprinter') || modelLower.includes('kombi')) {
            return '2_AXLES_SINGLE';
        }
        return '2_AXLES_DUAL'; // Padrão ônibus urbano/rodoviário 2 eixos com rodado duplo
    };

    const currentTopology = getChassisTopology();

    const currentAxleCount = (() => {
        if (currentTopology === '4_AXLES_ARTICULATED') return 4;
        if (currentTopology === '3_AXLES_TRUCK' || currentTopology === '3_AXLES_TAG') return 3;
        return 2;
    })();

    const currentChassiType = (() => {
        if (currentTopology === '4_AXLES_ARTICULATED') return '8x2';
        if (currentTopology === '3_AXLES_TRUCK') return '6x4';
        if (currentTopology === '3_AXLES_TAG') return '6x2';
        return '4x2';
    })();

    const isDualRear = currentTopology !== '2_AXLES_SINGLE';
    const isTagAxle = currentTopology === '3_AXLES_TAG' || currentTopology === '4_AXLES_ARTICULATED';

    const positionDefs: ChassisPositionDef[] = (() => {
        const defs: ChassisPositionDef[] = [
            { axleNumber: 1, positionIndex: 0, positionCode: 'DE', label: '1. ESQ (DE)' },
            { axleNumber: 1, positionIndex: 1, positionCode: 'DD', label: '1. DIR (DD)' },
        ];

        if (!isDualRear) {
            defs.push(
                { axleNumber: 2, positionIndex: 0, positionCode: 'TSE', label: '2. ESQ (TSE)' },
                { axleNumber: 2, positionIndex: 1, positionCode: 'TSD', label: '2. DIR (TSD)' }
            );
            return defs;
        }

        const dualAxle = (axle: number, prefix: string) => {
            defs.push(
                { axleNumber: axle, positionIndex: 0, positionCode: `${prefix}OE`, label: `${axle}. ESQ EXT (${prefix}OE)` },
                { axleNumber: axle, positionIndex: 1, positionCode: `${prefix}IE`, label: `${axle}. ESQ INT (${prefix}IE)` },
                { axleNumber: axle, positionIndex: 2, positionCode: `${prefix}ID`, label: `${axle}. DIR INT (${prefix}ID)` },
                { axleNumber: axle, positionIndex: 3, positionCode: `${prefix}OD`, label: `${axle}. DIR EXT (${prefix}OD)` }
            );
        };

        dualAxle(2, 'T');
        if (currentAxleCount >= 3) dualAxle(3, 'A');
        if (currentAxleCount >= 4) dualAxle(4, 'B');

        return defs;
    })();

    const diagramPositions: ChassisDiagramPosition[] = useMemo(
        () =>
            positionDefs.map((def) => {
                const tire = vehicleTires.find(
                    (t) => t.axleNumber === def.axleNumber && t.positionIndex === def.positionIndex
                );
                return {
                    axleNumber: def.axleNumber,
                    positionIndex: def.positionIndex,
                    positionCode: def.positionCode,
                    positionName: def.label,
                    tire: tire
                        ? {
                              serialNumber: getTireDisplayCode(tire),
                              brand: tire.brand,
                              currentTreadDepth: tire.currentTreadDepth,
                              recapCount: tire.recapCount,
                          }
                        : null,
                };
            }),
        [positionDefs, vehicleTires]
    );

    const renderTirePlace = (axle: number, index: number, label: string, positionCode: string) => {
        const tire = vehicleTires.find((t) => t.axleNumber === axle && t.positionIndex === index);
        const metrics = tire ? computeTireLiveMetrics(tire, lifecycleConfig) : null;
        const isFrontAxleWarning = Boolean(tire && axle === 1 && (tire.recapCount || 0) > 0);

        return (
            <motion.div
                whileHover={{ scale: 1.03 }}
                className={`relative w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-between p-2 cursor-pointer transition-all ${
                    tire
                        ? isFrontAxleWarning
                            ? 'bg-red-950/50 border-red-500 shadow-lg shadow-red-950/30 hover:border-red-400'
                            : 'bg-seguranca-black/70 border-seguranca-yellow/70 shadow-lg shadow-yellow-950/20 hover:border-seguranca-yellow'
                        : 'bg-seguranca-black/20 border-gray-700 hover:border-seguranca-yellow/50 hover:bg-seguranca-black/40'
                }`}
                onClick={() => {
                    if (tire) {
                        onTireClick(tire);
                    } else if (selectedVehicle) {
                        onMountTireSlot({
                            vehicleId: selectedVehicle.id,
                            axleNumber: axle,
                            positionIndex: index,
                            positionCode: positionCode,
                        });
                    }
                }}
            >
                {tire && metrics ? (
                    <>
                        <div className="flex justify-between items-center w-full">
                            <Badge
                                variant="outline"
                                className={`text-[9px] px-1 py-0 ${
                                    isFrontAxleWarning
                                        ? 'border-red-400 text-red-200 bg-red-900/60'
                                        : 'border-seguranca-yellow text-seguranca-yellow bg-yellow-950/40'
                                }`}
                            >
                                {tire.recapCount > 0 ? `${tire.recapCount}ª Recap` : 'Novo'}
                            </Badge>
                            <span className="text-[9px] font-mono text-gray-400">{positionCode}</span>
                        </div>

                        <div className="bg-seguranca-black w-full h-22 rounded-lg border border-gray-700 flex flex-col items-center justify-center p-1 my-1">
                            <span className="text-[8px] text-gray-500 font-mono tracking-wider">
                                {tire.fireNumber ? 'Nº DE FOGO' : 'CÓDIGO / SÉRIE'}
                            </span>
                            <span className="text-xs font-mono font-bold text-seguranca-yellow text-center truncate w-full px-1">
                                {getTireDisplayCode(tire)}
                            </span>

                            <div className="w-full flex items-center justify-around mt-1 pt-1 border-t border-gray-800 text-[10px]">
                                <div className="text-center">
                                    <span className="text-[8px] text-gray-500 block">SULCO</span>
                                    <span className={`font-bold ${metrics.twiCritical ? 'text-red-400' : metrics.treadAlert ? 'text-amber-400' : 'text-green-400'}`}>
                                        {tire.currentTreadDepth != null ? `${tire.currentTreadDepth}mm` : '-'}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <span className="text-[8px] text-gray-500 block">VIDA</span>
                                    <span className={`font-bold ${metrics.kmLimitExceeded ? 'text-red-400' : 'text-blue-300'}`}>
                                        {(metrics.currentLifeKm / 1000).toFixed(1)}k
                                    </span>
                                </div>
                                <div
                                    className="text-center"
                                    title={`${metrics.nextExchange.headline} • ${metrics.nextExchange.nextActionLabel}`}
                                >
                                    <span className="text-[8px] text-gray-500 block">PRÓX.</span>
                                    <span
                                        className={`font-bold ${
                                            metrics.nextExchange.status === 'OVERDUE'
                                                ? 'text-red-400'
                                                : metrics.nextExchange.status === 'DUE_SOON'
                                                ? 'text-amber-300'
                                                : 'text-emerald-400'
                                        }`}
                                    >
                                        {metrics.nextExchange.compactRemaining}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full flex items-center justify-between mt-auto">
                            <span className="text-[9px] font-mono text-gray-300 font-semibold">{label}</span>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 px-1 text-[9px] text-red-400 hover:text-red-300 hover:bg-red-950/40"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDismountTire(tire);
                                }}
                                title="Desmontar do veículo"
                            >
                                Desmontar
                            </Button>
                        </div>

                        {isFrontAxleWarning ? (
                            <div className="absolute -top-2 -right-2 bg-red-700 border border-red-300 p-0.5 rounded-full" title="Exceção: Recapado no Eixo Dianteiro">
                                <ShieldAlert size={14} className="text-white" />
                            </div>
                        ) : (metrics.treadAlert || metrics.dotInfo.expired) && (
                            <div className="absolute -top-2 -right-2 bg-red-900 border border-red-500 p-0.5 rounded-full" title="Alerta de Sulco/DOT">
                                <AlertCircle size={14} className="text-red-300" />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-1 text-center py-2">
                        <Plus size={22} className="text-seguranca-yellow/70 animate-pulse" />
                        <span className="text-[10px] font-semibold text-gray-400">{label}</span>
                        <span className="text-[9px] text-seguranca-yellow/80 bg-seguranca-black/60 px-1.5 py-0.5 rounded border border-seguranca-yellow/30 mt-1">
                            + Instalar
                        </span>
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className="space-y-6">
            {hasOnlyDemoVehicles && (
                <div className="bg-amber-950/50 border border-amber-500/60 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-200">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                        <span>
                            Nenhum veículo real sincronizado no momento (exibindo frota demonstrativa). Clique em <strong>Recarregar Frota</strong> para montar pneus em veículos cadastrados.
                        </span>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onRefresh}
                        className="border-amber-500/60 text-amber-200 hover:bg-amber-500/20 shrink-0 h-8 text-xs"
                    >
                        Recarregar Frota
                    </Button>
                </div>
            )}

            {/* Top Bar: Vehicle Selector & Chassis Topology Selector */}
            <div className="bg-seguranca-black/60 border border-gray-700/80 rounded-xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2 text-seguranca-lightgray font-semibold text-sm shrink-0">
                        <Bus size={18} className="text-seguranca-yellow" />
                        <span>Selecionar Veículo:</span>
                    </div>
                    <div className="w-full sm:w-96">
                        <SearchableSelect
                            value={selectedVehicleId}
                            onChange={(val) => {
                                if (val) setSelectedVehicleId(val);
                            }}
                            options={vehicleOptions}
                            maxVisibleOptions={60}
                            placeholder="Escolha o veículo da frota..."
                            searchPlaceholder="Buscar por placa, frota, marca ou modelo..."
                            emptyText="Nenhum veículo encontrado."
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                    <span className="text-xs text-gray-400">Layout do Chassi:</span>
                    <Select value={chassisType} onValueChange={(val: ChassisTopology) => setChassisType(val)}>
                        <SelectTrigger className="w-64 bg-seguranca-black border-gray-600 text-xs">
                            <SelectValue placeholder="Topologia do Chassi" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600 text-xs">
                            <SelectItem value="AUTO">Automático (pelo veículo)</SelectItem>
                            <SelectItem value="2_AXLES_SINGLE">Van simples — 4x2 (4 pneus)</SelectItem>
                            <SelectItem value="2_AXLES_DUAL">Van 4 pneus traseiros / Micro-ônibus — 4x2 (6 pneus)</SelectItem>
                            <SelectItem value="3_AXLES_TAG">Rodoviário — 6x2 (10 pneus, eixo auxiliar)</SelectItem>
                            <SelectItem value="3_AXLES_TRUCK">Trucado / Caminhão — 6x4 (10 pneus, tração dupla)</SelectItem>
                            <SelectItem value="4_AXLES_ARTICULATED">Biarticulado / 4 eixos — 8x2 (14 pneus)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Vehicle Header Card Summary */}
            {selectedVehicle && (
                <div className="bg-gradient-to-r from-seguranca-graphite to-seguranca-black border border-gray-700 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-seguranca-yellow/10 p-3 rounded-lg border border-seguranca-yellow/30">
                            <Bus size={28} className="text-seguranca-yellow" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-lg font-bold text-white bg-seguranca-black px-2.5 py-0.5 rounded border border-gray-700">
                                    {selectedVehicle.plate}
                                </span>
                                <span className="text-sm font-semibold text-seguranca-lightgray">
                                    {selectedVehicle.brand} {selectedVehicle.model}
                                </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                                <span>Odômetro: <strong className="text-gray-200 font-mono">{selectedVehicle.currentMileage?.toLocaleString() || 0} km</strong></span>
                                <span>•</span>
                                <span>Ano: <strong className="text-gray-200">{selectedVehicle.year}</strong></span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-seguranca-black/80 border border-gray-700 px-4 py-2 rounded-lg text-center">
                            <span className="text-[10px] text-gray-400 block uppercase">Pneus Montados</span>
                            <span className="text-lg font-bold font-mono text-seguranca-yellow">
                                {vehicleTires.length} Pneus
                            </span>
                        </div>
                        <div className="bg-seguranca-black/80 border border-gray-700 px-4 py-2 rounded-lg text-center">
                            <span className="text-[10px] text-gray-400 block uppercase">Disponíveis no Estoque</span>
                            <span className="text-lg font-bold font-mono text-green-400">
                                {availableTires.length} Pneus
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Chassis Diagram Box */}
            <div className="bg-seguranca-black/40 rounded-2xl border border-gray-800 p-4 sm:p-6 shadow-2xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                        <Shield size={14} className="text-seguranca-yellow" />
                        <span>CHASSIS VISUAL MAPPER • {currentTopology.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                        <Badge variant="outline" className="border-seguranca-yellow/50 text-seguranca-yellow font-mono">
                            {currentChassiType}
                        </Badge>
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {currentAxleCount} eixos
                        </Badge>
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {positionDefs.length} pneus
                        </Badge>
                    </div>
                </div>

                <div className="rounded-xl bg-seguranca-black/70 border border-gray-800 p-2 sm:p-4 overflow-hidden">
                    <ChassisDiagram
                        positions={diagramPositions}
                        axleCount={currentAxleCount}
                        dualRear={isDualRear}
                        tagAxle={isTagAxle}
                        chassiType={currentChassiType}
                        vehicleType={selectedVehicle?.vehicleType}
                        onSelectPosition={(position) => {
                            const tire = vehicleTires.find(
                                (t) => t.axleNumber === position.axleNumber && t.positionIndex === position.positionIndex
                            );
                            if (tire) {
                                onTireClick(tire);
                            } else if (selectedVehicle) {
                                onMountTireSlot({
                                    vehicleId: selectedVehicle.id,
                                    axleNumber: position.axleNumber,
                                    positionIndex: position.positionIndex,
                                    positionCode: position.positionCode,
                                });
                            }
                        }}
                    />
                </div>

                {/* Detalhes e ações por posição */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
                    {positionDefs.map((def) => (
                        <React.Fragment key={`${def.axleNumber}-${def.positionIndex}-${def.positionCode}`}>
                            {renderTirePlace(def.axleNumber, def.positionIndex, def.label, def.positionCode)}
                        </React.Fragment>
                    ))}
                    <div className="col-span-2 sm:col-span-3 md:col-span-4 xl:col-span-6 flex items-center justify-center gap-3 pt-3 border-t border-gray-800">
                        <span className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
                            <Package size={14} className="text-seguranca-yellow" />
                            ESTEPE / RESERVA:
                        </span>
                        {renderTirePlace(0, 0, 'ESTEPE', 'ESTEPE')}
                    </div>
                </div>
            </div>

            {/* Sub-panel: Available Tires in Stock */}
            <Card className="bg-seguranca-graphite border-gray-700 overflow-hidden">
                <CardHeader className="bg-seguranca-black/40 py-3 border-b border-gray-700 flex flex-row items-center justify-between">
                    <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2 font-semibold">
                        <Package className="text-green-400" size={18} />
                        Pneus Disponíveis no Estoque ({availableTires.length})
                    </CardTitle>
                    <span className="text-xs text-gray-400">Prontos para instalação imediata</span>
                </CardHeader>
                <CardContent className="p-4">
                    {availableTires.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {availableTires.map((tire) => (
                                <div
                                    key={tire.id}
                                    className="bg-seguranca-black p-3 rounded-lg border border-gray-700 hover:border-seguranca-yellow/60 transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-mono font-bold text-seguranca-yellow text-sm">
                                                {tire.serialNumber}
                                            </span>
                                            <Badge className="bg-green-900/30 text-green-400 border-green-700/50 text-[10px] py-0">
                                                Estoque
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-gray-300 font-medium">
                                            {tire.brand} - {tire.model}
                                        </div>
                                        <div className="text-[11px] text-gray-400 font-mono mt-1">
                                            Medida: {tire.size}
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-800">
                                            <span>Sulco: <strong className="text-gray-200">{tire.currentTreadDepth != null ? `${tire.currentTreadDepth}mm` : '-'}</strong></span>
                                            <span>Km: <strong className="text-gray-200">{tire.currentMileage?.toLocaleString()}</strong></span>
                                        </div>
                                    </div>

                                    {selectedVehicle && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full mt-3 h-7 text-xs border-seguranca-yellow/40 text-seguranca-yellow hover:bg-seguranca-yellow hover:text-black font-medium"
                                            onClick={() => {
                                                if (onMountSpecificTire) {
                                                    onMountSpecificTire(tire, selectedVehicle.id);
                                                } else {
                                                    onMountTireSlot({
                                                        vehicleId: selectedVehicle.id,
                                                        axleNumber: 1,
                                                        positionIndex: 0,
                                                        positionCode: 'DE',
                                                    });
                                                }
                                            }}
                                        >
                                            <Plus size={12} className="mr-1" /> Montar no Veículo
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500 text-xs">
                            Nenhum pneu disponível no estoque no momento.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
