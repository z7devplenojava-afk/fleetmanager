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
import { Edit, Trash2, Eye, RefreshCw, Archive } from 'lucide-react';
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
            return <Badge className="bg-green-900/20 text-green-400 border-green-700/30">Disponível</Badge>;
        case 'IN_USE':
            return <Badge className="bg-blue-900/20 text-blue-400 border-blue-700/30">Em Uso</Badge>;
        case 'RECAP':
            return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-700/30">Recapagem</Badge>;
        case 'SCRAPPED':
            return <Badge className="bg-red-900/20 text-red-400 border-red-700/30">Descartado</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
};

export const TiresTable: React.FC<TiresTableProps> = ({ data, onView, onEdit, onDelete, onMovement }) => {
    return (
        <div className="bg-seguranca-black border border-gray-600 rounded-lg overflow-hidden">
            <Table>
                <TableHeader className="bg-seguranca-graphite">
                    <TableRow className="border-gray-600">
                        <TableHead className="text-seguranca-lightgray font-semibold">Série (DOT)</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Marca / Modelo</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Medida</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Status</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Km Atual</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Recapagens</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Veículo</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? (
                        data.map((tire) => (
                            <TableRow key={tire.id} className="border-gray-600 hover:bg-seguranca-graphite/50 transition-colors">
                                <TableCell className="font-mono font-bold text-seguranca-yellow">{tire.serialNumber}</TableCell>
                                <TableCell className="text-seguranca-lightgray">
                                    {tire.brand} / {tire.model}
                                </TableCell>
                                <TableCell className="text-seguranca-lightgray">{tire.size}</TableCell>
                                <TableCell>{getStatusBadge(tire.status)}</TableCell>
                                <TableCell className="text-seguranca-lightgray font-mono">
                                    {tire.currentMileage.toLocaleString()} km
                                </TableCell>
                                <TableCell className="text-seguranca-lightgray text-center">{tire.recapCount}</TableCell>
                                <TableCell className="text-seguranca-lightgray">
                                    {tire.vehiclePlate || <span className="text-gray-500 italic">Nenhum</span>}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="outline" size="sm" onClick={() => onMovement(tire)} className="h-8 w-8 p-0 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white" title="Registrar Movimentação">
                                            <RefreshCw size={14} />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => onView(tire)} className="h-8 w-8 p-0 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white" title="Ver Histórico">
                                            <Eye size={14} />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => onEdit(tire)} className="h-8 w-8 p-0 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white" title="Editar">
                                            <Edit size={14} />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => onDelete(tire)} className="h-8 w-8 p-0 border-red-500 text-red-500 hover:bg-red-500 hover:text-white" title="Excluir">
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                                Nenhum pneu cadastrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};
