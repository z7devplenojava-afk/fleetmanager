import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tire, TireMountPayload, TireDismountPayload } from '@/services/tireService';
import { Vehicle } from '@/types/fleet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ArrowRightLeft, Move, Plus, Package, Bus, Wrench, Shield, CheckCircle2, RotateCw } from 'lucide-react';

interface BusTireMapperProps {
    tires: Tire[];
    vehicles: Vehicle[];
    onTireClick: (tire: Tire) => void;
    onMountTireSlot: (slot: { vehicleId: string; axleNumber: number; positionIndex: number; positionCode: string }) => void;
    onDismountTire: (tire: Tire) => void;
    onRefresh: () => void;
}

export const BusTireMapper: React.FC<BusTireMapperProps> = ({
    tires,
    vehicles,
    onTireClick,
    onMountTireSlot,
    onDismountTire,
    onRefresh,
}) => {
    // Seleção de veículo ativo
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
    const [chassisType, setChassisType] = useState<'AUTO' | '2_AXLES_DUAL' | '3_AXLES_TRUCK' | '2_AXLES_SINGLE' | '4_AXLES_ARTICULATED'>('AUTO');

    const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

    // Pneus instalados no veículo selecionado
    const vehicleTires = tires.filter(
        (t) => t.status === 'IN_USE' && (selectedVehicle ? t.vehicleId === selectedVehicle.id || t.vehiclePlate === selectedVehicle.plate : true)
    );

    // Pneus disponíveis no estoque
    const availableTires = tires.filter((t) => t.status === 'AVAILABLE');

    // Determina o tipo de layout do chassi com base no modelo do veículo ou seleção do usuário
    const getChassisTopology = () => {
        if (chassisType !== 'AUTO') return chassisType;
        if (!selectedVehicle) return '2_AXLES_DUAL';
        const modelLower = (selectedVehicle.model || '').toLowerCase();
        if (modelLower.includes('articulad') || modelLower.includes('b270f')) return '4_AXLES_ARTICULATED';
        if (modelLower.includes('truck') || modelLower.includes('6x2') || modelLower.includes('rsd') || modelLower.includes('3 eix')) return '3_AXLES_TRUCK';
        if (modelLower.includes('van') || modelLower.includes('sprinter') || modelLower.includes('kombi')) return '2_AXLES_SINGLE';
        return '2_AXLES_DUAL'; // Padrão Ônibus Urbano/Rodoviário 2 Eixos
    };

    const currentTopology = getChassisTopology();

    const renderTirePlace = (axle: number, index: number, label: string, positionCode: string) => {
        const tire = vehicleTires.find((t) => t.axleNumber === axle && t.positionIndex === index);

        return (
            <motion.div
                whileHover={{ scale: 1.03 }}
                className={`relative w-28 h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-between p-2 cursor-pointer transition-all ${
                    tire
                        ? 'bg-seguranca-black/70 border-seguranca-yellow/70 shadow-lg shadow-yellow-950/20 hover:border-seguranca-yellow'
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
                {tire ? (
                    <>
                        <div className="flex justify-between items-center w-full">
                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-seguranca-yellow text-seguranca-yellow bg-yellow-950/40">
                                {tire.recapCount > 0 ? `${tire.recapCount}ª Recap` : 'Novo'}
                            </Badge>
                            <span className="text-[9px] font-mono text-gray-400">{positionCode}</span>
                        </div>

                        <div className="bg-seguranca-black w-full h-20 rounded-lg border border-gray-700 flex flex-col items-center justify-center p-1 my-1">
                            <span className="text-[9px] text-gray-500 font-mono tracking-wider">CÓDIGO / SÉRIE</span>
                            <span className="text-xs font-mono font-bold text-seguranca-yellow text-center truncate w-full px-1">
                                {tire.serialNumber}
                            </span>

                            <div className="w-full flex items-center justify-around mt-1 pt-1 border-t border-gray-800 text-[10px]">
                                <div className="text-center">
                                    <span className="text-[8px] text-gray-500 block">SULCO</span>
                                    <span className={`font-bold ${tire.currentTreadDepth && tire.currentTreadDepth < 3 ? 'text-red-400' : 'text-green-400'}`}>
                                        {tire.currentTreadDepth != null ? `${tire.currentTreadDepth}mm` : '-'}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <span className="text-[8px] text-gray-500 block">KM</span>
                                    <span className="font-bold text-blue-300">
                                        {(tire.currentMileage / 1000).toFixed(1)}k
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

                        {tire.currentTreadDepth != null && tire.currentTreadDepth < 3 && (
                            <div className="absolute -top-2 -right-2 bg-red-900 border border-red-500 p-0.5 rounded-full" title="Sulco crítico (< 3mm)">
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
            {/* Top Bar: Vehicle Selector & Chassis Topology Selector */}
            <div className="bg-seguranca-black/60 border border-gray-700/80 rounded-xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2 text-seguranca-lightgray font-semibold text-sm">
                        <Bus size={18} className="text-seguranca-yellow" />
                        <span>Selecionar Veículo:</span>
                    </div>
                    <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                        <SelectTrigger className="w-full sm:w-72 bg-seguranca-black border-gray-600 text-xs">
                            <SelectValue placeholder="Escolha o veículo da frota..." />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600 text-xs">
                            {vehicles.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                    {v.plate} - {v.brand} {v.model} ({v.currentMileage?.toLocaleString() || 0} km)
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                    <span className="text-xs text-gray-400">Layout do Chassi:</span>
                    <Select value={chassisType} onValueChange={(val: any) => setChassisType(val)}>
                        <SelectTrigger className="w-56 bg-seguranca-black border-gray-600 text-xs">
                            <SelectValue placeholder="Topologia do Chassi" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600 text-xs">
                            <SelectItem value="AUTO">Automático (Pelo Veículo)</SelectItem>
                            <SelectItem value="2_AXLES_DUAL">Ônibus Urbano/Padron (2 Eixos - 6 Pneus)</SelectItem>
                            <SelectItem value="3_AXLES_TRUCK">Ônibus Trucado/RSD (3 Eixos - 10 Pneus)</SelectItem>
                            <SelectItem value="2_AXLES_SINGLE">Van / Micro-ônibus (2 Eixos - 4 Pneus)</SelectItem>
                            <SelectItem value="4_AXLES_ARTICULATED">Ônibus Articulado (4 Eixos - 14 Pneus)</SelectItem>
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
            <div className="flex flex-col items-center gap-10 p-8 bg-seguranca-black/40 rounded-2xl border border-gray-800 relative overflow-hidden shadow-2xl">
                <div className="absolute top-3 left-4 flex items-center gap-2 text-xs font-mono text-gray-500">
                    <Shield size={14} className="text-seguranca-yellow" />
                    <span>CHASSIS VISUAL MAPPER • {currentTopology.replace(/_/g, ' ')}</span>
                </div>

                {/* Eixo 1 - Dianteiro */}
                <div className="flex justify-between w-full max-w-lg relative mt-4">
                    <div className="absolute top-1/2 left-0 right-0 h-4 bg-gray-800/80 -translate-y-1/2 rounded-full -z-10 border-y border-gray-700" />
                    {renderTirePlace(1, 0, '1. ESQ (DE)', 'DE')}
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-56 h-10 bg-gray-800/60 rounded-t-2xl border-x border-t border-gray-600 flex items-center justify-center">
                            <span className="text-[11px] font-bold text-gray-300 font-mono tracking-wider">DIANTEIRA / FRENTE</span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 mt-1">EIXO 01 • DIREÇÃO</span>
                    </div>
                    {renderTirePlace(1, 1, '1. DIR (DD)', 'DD')}
                </div>

                {/* Eixo 2 - Tração (Rodagem Dupla ou Simples) */}
                {currentTopology === '2_AXLES_SINGLE' ? (
                    <div className="flex justify-between w-full max-w-lg relative">
                        <div className="absolute top-1/2 left-0 right-0 h-5 bg-seguranca-yellow/10 -translate-y-1/2 rounded-full -z-10 border-y border-seguranca-yellow/20" />
                        {renderTirePlace(2, 0, '2. ESQ (TE)', 'TE')}
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-40 h-10 bg-gray-800/60 border border-gray-700 flex items-center justify-center">
                                <ArrowRightLeft size={16} className="text-seguranca-yellow" />
                            </div>
                            <span className="text-[9px] font-mono text-gray-400 mt-1">EIXO 02 • TRAÇÃO</span>
                        </div>
                        {renderTirePlace(2, 1, '2. DIR (TD)', 'TD')}
                    </div>
                ) : (
                    <div className="flex justify-between w-full max-w-2xl relative">
                        <div className="absolute top-1/2 left-0 right-0 h-6 bg-seguranca-yellow/10 -translate-y-1/2 rounded-full -z-10 border-y border-seguranca-yellow/20" />

                        {/* Dupla Esquerda */}
                        <div className="flex gap-2">
                            {renderTirePlace(2, 0, '2. ESQ EXT', 'TOE')}
                            {renderTirePlace(2, 1, '2. ESQ INT', 'TIE')}
                        </div>

                        <div className="flex flex-col items-center justify-center">
                            <div className="w-36 h-12 bg-gray-800/60 border border-gray-700 flex items-center justify-center gap-2">
                                <ArrowRightLeft size={18} className="text-seguranca-yellow" />
                                <span className="text-[10px] font-mono text-seguranca-yellow font-bold">TRAÇÃO</span>
                            </div>
                            <span className="text-[9px] font-mono text-gray-400 mt-1">EIXO 02 • RODAGEM DUPLA</span>
                        </div>

                        {/* Dupla Direita */}
                        <div className="flex gap-2">
                            {renderTirePlace(2, 2, '2. DIR INT', 'TID')}
                            {renderTirePlace(2, 3, '2. DIR EXT', 'TOD')}
                        </div>
                    </div>
                )}

                {/* Eixo 3 - Auxiliar / Trucado (Se aplicável) */}
                {currentTopology === '3_AXLES_TRUCK' && (
                    <div className="flex justify-between w-full max-w-2xl relative">
                        <div className="absolute top-1/2 left-0 right-0 h-5 bg-gray-800/50 -translate-y-1/2 rounded-full -z-10 border-y border-gray-700" />
                        <div className="flex gap-2">
                            {renderTirePlace(3, 0, '3. ESQ EXT', 'AOE')}
                            {renderTirePlace(3, 1, '3. ESQ INT', 'AIE')}
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-32 h-8 bg-gray-800/40 border border-gray-700 flex items-center justify-center">
                                <span className="text-[10px] font-mono text-gray-400">TRUCK / AUX</span>
                            </div>
                            <span className="text-[9px] font-mono text-gray-500 mt-1">EIXO 03 • AUXILIAR</span>
                        </div>
                        <div className="flex gap-2">
                            {renderTirePlace(3, 2, '3. DIR INT', 'AID')}
                            {renderTirePlace(3, 3, '3. DIR EXT', 'AOD')}
                        </div>
                    </div>
                )}

                {/* Estepe / Pneu Reserva */}
                <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-center gap-4 w-full">
                    <span className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
                        <Package size={14} className="text-seguranca-yellow" />
                        RESERVA DE CHASSI:
                    </span>
                    {renderTirePlace(0, 0, 'ESTEPE', 'ESTEPE')}
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
                                            onClick={() =>
                                                onMountTireSlot({
                                                    vehicleId: selectedVehicle.id,
                                                    axleNumber: 1,
                                                    positionIndex: 0,
                                                    positionCode: 'DE',
                                                })
                                            }
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
