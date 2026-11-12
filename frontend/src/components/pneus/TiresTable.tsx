'use client';

import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Eye, RefreshCw, Search, Package, Bus, Wrench, AlertTriangle, ShieldAlert, Clock } from 'lucide-react';
import { Tire, TireLifecycleConfig } from '@/services/tireService';
import {
    computeTireLiveMetrics,
    DEFAULT_TIRE_LIFECYCLE_CONFIG,
    getLifeStageLabel,
    getPositionLabel,
    getTireDisplayCode,
} from '@/utils/tireLifecycle';

interface TiresTableProps {
    data: Tire[];
    lifecycleConfig?: TireLifecycleConfig;
    onView: (tire: Tire) => void;
    onEdit: (tire: Tire) => void;
    onDelete: (tire: Tire) => void;
    onMovement: (tire: Tire) => void;
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'AVAILABLE':
            return <Badge className="bg-green-900/30 text-green-400 border-green-700/50 flex items-center gap-1 w-fit"><Package size={12} /> Em Estoque</Badge>;
        case 'IN_USE':
            return <Badge className="bg-blue-900/30 text-blue-400 border-blue-700/50 flex items-center gap-1 w-fit"><Bus size={12} /> Instalado</Badge>;
        case 'RECAP':
            return <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-700/50 flex items-center gap-1 w-fit"><Wrench size={12} /> Recapagem</Badge>;
        case 'SCRAPPED':
            return <Badge className="bg-red-900/30 text-red-400 border-red-700/50 flex items-center gap-1 w-fit"><AlertTriangle size={12} /> Sucateado</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
};

const getLocationDisplay = (tire: Tire) => {
    if (tire.status === 'AVAILABLE') {
        return (
            <div className="flex items-center gap-1.5 text-green-400 font-medium text-xs">
                <Package size={14} className="text-green-500 shrink-0" />
                <span>{tire.locationNotes || 'Estoque Almoxarifado'}</span>
            </div>
        );
    }
    if (tire.status === 'IN_USE' && (tire.vehiclePlate || tire.vehicleFleetNumber)) {
        const prefix = tire.vehicleFleetNumber ? `${tire.vehicleFleetNumber} • ` : '';
        const pos = getPositionLabel(tire.axleNumber, tire.positionIndex);
        return (
            <div className="flex items-center gap-1.5 text-blue-300 font-medium text-xs">
                <Bus size={14} className="text-blue-400 shrink-0" />
                <span className="font-mono bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/50">
                    {prefix}{tire.vehiclePlate} ({pos})
                </span>
            </div>
        );
    }
    if (tire.status === 'RECAP') {
        return (
            <div className="flex items-center gap-1.5 text-yellow-400 font-medium text-xs">
                <Wrench size={14} className="text-yellow-500 shrink-0" />
                <span>{tire.recapVendor || 'Oficina de Recapagem'}</span>
            </div>
        );
    }
    return <span className="text-gray-500 italic text-xs">{tire.scrapReason || 'Descartado'}</span>;
};

export const TiresTable: React.FC<TiresTableProps> = ({
    data,
    lifecycleConfig = DEFAULT_TIRE_LIFECYCLE_CONFIG,
    onView,
    onEdit,
    onDelete,
    onMovement,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [lifeFilter, setLifeFilter] = useState('ALL');

    const filteredData = data.filter((tire) => {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
            (tire.serialNumber || '').toLowerCase().includes(q) ||
            (tire.fireNumber || '').toLowerCase().includes(q) ||
            (tire.dot || '').toLowerCase().includes(q) ||
            (tire.brand || '').toLowerCase().includes(q) ||
            (tire.model || '').toLowerCase().includes(q) ||
            (tire.size || '').toLowerCase().includes(q) ||
            (tire.vehiclePlate || '').toLowerCase().includes(q) ||
            (tire.vehicleFleetNumber || '').toLowerCase().includes(q);

        const matchesStatus = statusFilter === 'ALL' || tire.status === statusFilter;
        const recaps = tire.recapCount || 0;
        const matchesLife =
            lifeFilter === 'ALL' ||
            (lifeFilter === 'NEW' && recaps === 0) ||
            (lifeFilter === 'RECAP_1' && recaps === 1) ||
            (lifeFilter === 'RECAP_2' && recaps >= 2);

        return matchesSearch && matchesStatus && matchesLife;
    });

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="p-3.5 bg-seguranca-black/40 border border-gray-700/70 rounded-xl flex flex-col lg:flex-row items-center justify-between gap-3">
                <div className="relative w-full lg:w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por Fogo, Série, DOT, marca, frota..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-seguranca-black border-gray-600 text-xs text-white"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                    <Select value={lifeFilter} onValueChange={setLifeFilter}>
                        <SelectTrigger className="w-[175px] bg-seguranca-black border-gray-600 text-xs text-white">
                            <SelectValue placeholder="Ciclo de Vida" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600 text-xs text-white">
                            <SelectItem value="ALL">Todos os Ciclos</SelectItem>
                            <SelectItem value="NEW">Novo (1ª Vida)</SelectItem>
                            <SelectItem value="RECAP_1">1ª Recapagem (2ª Vida)</SelectItem>
                            <SelectItem value="RECAP_2">2ª Recapagem (3ª Vida)</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[190px] bg-seguranca-black border-gray-600 text-xs text-white">
                            <SelectValue placeholder="Todos os Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600 text-xs text-white">
                            <SelectItem value="ALL">Todos os Pneus ({data.length})</SelectItem>
                            <SelectItem value="AVAILABLE">Em Estoque</SelectItem>
                            <SelectItem value="IN_USE">Instalados em Veículos</SelectItem>
                            <SelectItem value="RECAP">Em Recapagem</SelectItem>
                            <SelectItem value="SCRAPPED">Sucateados</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-seguranca-black border border-gray-700 rounded-xl overflow-x-auto">
                <Table>
                    <TableHeader className="bg-seguranca-graphite">
                        <TableRow className="border-gray-700">
                            <TableHead className="text-seguranca-lightgray font-semibold text-xs">Nº Fogo / Série / DOT</TableHead>
                            <TableHead className="text-seguranca-lightgray font-semibold text-xs">Marca / Modelo / Medida</TableHead>
                            <TableHead className="text-seguranca-lightgray font-semibold text-xs">Ciclo de Vida</TableHead>
                            <TableHead className="text-seguranca-lightgray font-semibold text-xs">Status & Localização</TableHead>
                            <TableHead className="text-seguranca-lightgray font-semibold text-xs">Sulco (mm)</TableHead>
                            <TableHead className="text-seguranca-lightgray font-semibold text-xs">KM Vida / Total</TableHead>
                            <TableHead className="text-seguranca-yellow font-semibold text-xs">Próxima Troca</TableHead>
                            <TableHead className="text-seguranca-lightgray font-semibold text-xs text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length > 0 ? (
                            filteredData.map((tire) => {
                                const m = computeTireLiveMetrics(tire, lifecycleConfig);
                                return (
                                    <TableRow key={tire.id} className="border-gray-800 hover:bg-seguranca-graphite/50 transition-colors">
                                        <TableCell className="text-xs">
                                            <div className="font-mono font-bold text-seguranca-yellow text-sm flex items-center gap-1.5">
                                                {getTireDisplayCode(tire)}
                                                {!tire.fireNumber && (
                                                    <span className="text-[9px] px-1 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-700/50 font-sans">
                                                        Sem Fogo
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-gray-400 font-mono">Série: {tire.serialNumber}</div>
                                            <div className="mt-0.5 flex items-center gap-1">
                                                <span className="text-[10px] text-gray-500 font-mono">DOT: {tire.dot || '-'}</span>
                                                {m.dotInfo.expired && (
                                                    <Badge className="bg-red-950/70 text-red-300 border-red-600/60 text-[9px] py-0 px-1">
                                                        <Clock size={10} className="mr-0.5" /> &gt;5a
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-seguranca-lightgray text-xs">
                                            <div className="font-semibold text-gray-200">{tire.brand}</div>
                                            <div className="text-gray-400">{tire.model}</div>
                                            <div className="text-[11px] font-mono text-gray-300">{tire.size}</div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] ${
                                                    (tire.recapCount || 0) >= 2
                                                        ? 'border-red-500/50 text-red-300 bg-red-950/30'
                                                        : (tire.recapCount || 0) === 1
                                                        ? 'border-amber-500/50 text-amber-300 bg-amber-950/30'
                                                        : 'border-emerald-500/50 text-emerald-300 bg-emerald-950/30'
                                                }`}
                                            >
                                                {getLifeStageLabel(tire)}
                                            </Badge>
                                            <div className="text-[10px] text-gray-400 mt-1">
                                                Linha: {tire.lineType || 'URBANA'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="space-y-1">
                                            {getStatusBadge(tire.status)}
                                            {getLocationDisplay(tire)}
                                            {m.isFrontAxleRecapException && (
                                                <Badge className="bg-red-950/80 text-red-200 border-red-500 text-[9px] py-0 flex items-center gap-1 w-fit">
                                                    <ShieldAlert size={10} /> Exceção Dianteiro
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">
                                            {tire.currentTreadDepth != null ? (
                                                <div>
                                                    <span
                                                        className={
                                                            m.twiCritical
                                                                ? 'text-red-400 font-bold'
                                                                : m.treadAlert
                                                                ? 'text-amber-400 font-bold'
                                                                : 'text-emerald-300'
                                                        }
                                                    >
                                                        {Number(tire.currentTreadDepth).toFixed(1)} mm
                                                    </span>
                                                    {m.twiCritical && <span className="block text-[9px] text-red-400">TWI CRÍTICO</span>}
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            <div className={m.kmLimitExceeded ? 'text-red-400 font-bold' : m.kmThresholdReached ? 'text-amber-300 font-semibold' : 'text-blue-300'}>
                                                Vida: {m.currentLifeKm.toLocaleString()} km
                                            </div>
                                            <div className="text-gray-400 text-[11px]">
                                                Total: {m.totalCarcassKm.toLocaleString()} km
                                            </div>
                                            <div className="text-[10px] text-gray-500">
                                                Meta: {(m.range.minKm / 1000).toFixed(0)}k-{(m.range.maxKm / 1000).toFixed(0)}k
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs min-w-[190px]">
                                            <Badge
                                                className={`text-[10px] font-bold border ${
                                                    m.nextExchange.status === 'OVERDUE'
                                                        ? 'bg-red-950/80 text-red-300 border-red-500/70'
                                                        : m.nextExchange.status === 'DUE_SOON'
                                                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/70'
                                                        : m.nextExchange.status === 'SCRAPPED'
                                                        ? 'bg-gray-800 text-gray-400 border-gray-600'
                                                        : 'bg-emerald-950/70 text-emerald-300 border-emerald-600/60'
                                                }`}
                                            >
                                                {m.nextExchange.headline}
                                            </Badge>
                                            {m.nextExchange.nextVehicleKmMin != null && m.nextExchange.status !== 'SCRAPPED' && (
                                                <div className="text-[11px] font-mono text-gray-200 mt-1">
                                                    Veículo: {m.nextExchange.nextVehicleKmMin.toLocaleString('pt-BR')}–{m.nextExchange.nextVehicleKmMax?.toLocaleString('pt-BR')} km
                                                </div>
                                            )}
                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                Próx.: <span className="text-gray-200 font-medium">{m.nextExchange.nextActionLabel}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onMovement(tire)}
                                                    className="h-8 w-8 p-0 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                                                    title="Instalar / Desmontar / Recapagem / Sucatear"
                                                >
                                                    <RefreshCw size={14} />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onView(tire)}
                                                    className="h-8 w-8 p-0 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
                                                    title="Ver Histórico"
                                                >
                                                    <Eye size={14} />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onEdit(tire)}
                                                    className="h-8 w-8 p-0 border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-white"
                                                    title="Editar Cadastro / Fogo / DOT"
                                                >
                                                    <Edit size={14} />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onDelete(tire)}
                                                    className="h-8 w-8 p-0 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                                    Nenhum pneu encontrado com os filtros selecionados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
