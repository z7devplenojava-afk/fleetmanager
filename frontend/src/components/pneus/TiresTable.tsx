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
import { Edit, Trash2, Eye, RefreshCw, Search, Package, Bus, Wrench, AlertTriangle } from 'lucide-react';
import { Tire } from '@/services/tireService';

interface TiresTableProps {
    data: Tire[];
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
                <span>Estoque {tire.locationNotes ? `(${tire.locationNotes})` : 'Almoxarifado'}</span>
            </div>
        );
    }
    if (tire.status === 'IN_USE' && tire.vehiclePlate) {
        const axleInfo = tire.axleNumber ? ` - Eixo ${tire.axleNumber}` : '';
        return (
            <div className="flex items-center gap-1.5 text-blue-300 font-medium text-xs">
                <Bus size={14} className="text-blue-400 shrink-0" />
                <span className="font-mono bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/50">
                    {tire.vehiclePlate}{axleInfo}
                </span>
            </div>
        );
    }
    if (tire.status === 'RECAP') {
        return (
            <div className="flex items-center gap-1.5 text-yellow-400 font-medium text-xs">
                <Wrench size={14} className="text-yellow-500 shrink-0" />
                <span>Oficina de Recapagem</span>
            </div>
        );
    }
    return <span className="text-gray-500 italic text-xs">Sem localização</span>;
};

export const TiresTable: React.FC<TiresTableProps> = ({ data, onView, onEdit, onDelete, onMovement }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const filteredData = data.filter((tire) => {
        const matchesSearch =
            tire.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tire.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tire.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tire.vehiclePlate && tire.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'ALL' || tire.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="p-4 bg-seguranca-graphite/40 border-b border-gray-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar pneu por código, série, placa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-seguranca-black border-gray-600 text-xs"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-gray-400 whitespace-nowrap">Localização/Status:</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] bg-seguranca-black border-gray-600 text-xs">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600 text-xs">
                            <SelectItem value="ALL">Todos os Pneus</SelectItem>
                            <SelectItem value="AVAILABLE">📦 Em Estoque</SelectItem>
                            <SelectItem value="IN_USE">🚌 Instalados em Veículos</SelectItem>
                            <SelectItem value="RECAP">🔄 Em Recapagem</SelectItem>
                            <SelectItem value="SCRAPPED">🗑️ Sucateados</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-seguranca-black border border-gray-600 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-seguranca-graphite">
                        <TableRow className="border-gray-600">
                            <TableHead className="text-seguranca-lightgray font-semibold">Código / Série (DOT)</TableHead>
                            <TableHead className="text-seguranca-lightgray font-semibold">Marca / Modelo</TableHead>
                            <TableHead className="text-seguranca-lightgray font-semibold">Medida</TableHead>
                            <TableHead className="text-seguranca-lightgray font-semibold">Status</TableHead>
                            <TableHead className="text-seguranca-lightgray font-semibold">Localização Exata</TableHead>
                            <TableHead className="text-seguranca-lightgray font-semibold">Sulco (mm)</TableHead>
                            <TableHead className="text-seguranca-lightgray font-semibold">Km Atual</TableHead>
                            <TableHead className="text-seguranca-lightgray font-semibold text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length > 0 ? (
                            filteredData.map((tire) => (
                                <TableRow key={tire.id} className="border-gray-600 hover:bg-seguranca-graphite/50 transition-colors">
                                    <TableCell className="font-mono font-bold text-seguranca-yellow text-sm">
                                        {tire.serialNumber}
                                    </TableCell>
                                    <TableCell className="text-seguranca-lightgray text-xs">
                                        <div className="font-semibold text-gray-200">{tire.brand}</div>
                                        <div className="text-gray-400">{tire.model}</div>
                                    </TableCell>
                                    <TableCell className="text-seguranca-lightgray text-xs font-mono">{tire.size}</TableCell>
                                    <TableCell>{getStatusBadge(tire.status)}</TableCell>
                                    <TableCell>{getLocationDisplay(tire)}</TableCell>
                                    <TableCell className="text-seguranca-lightgray text-xs font-mono">
                                        {tire.currentTreadDepth != null ? (
                                            <span className={tire.currentTreadDepth < 3 ? 'text-red-400 font-bold' : 'text-gray-300'}>
                                                {tire.currentTreadDepth} mm
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-seguranca-lightgray font-mono text-xs">
                                        {tire.currentMileage?.toLocaleString()} km
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onMovement(tire)}
                                                className="h-8 w-8 p-0 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                                                title="Mover / Instalar / Desmontar"
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
                                                title="Editar"
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
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                                    Nenhum pneu encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
