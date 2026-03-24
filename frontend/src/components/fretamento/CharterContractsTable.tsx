'use client';

import React from 'react';
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
import { Edit, Trash2, Eye, MapPin, Calendar, DollarSign } from 'lucide-react';
import { CharterContract } from '@/services/charterService';
import { format } from 'date-fns';

interface CharterContractsTableProps {
    data: CharterContract[];
    onView: (contract: CharterContract) => void;
    onEdit: (contract: CharterContract) => void;
    onDelete: (contract: CharterContract) => void;
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'ACTIVE': return <Badge className="bg-green-900/20 text-green-400 border-green-700/30">Ativo</Badge>;
        case 'FINISHED': return <Badge className="bg-blue-900/20 text-blue-400 border-blue-700/30">Finalizado</Badge>;
        case 'INACTIVE': return <Badge className="bg-gray-900/20 text-gray-400 border-gray-700/30">Inativo</Badge>;
        case 'SUSPENDED': return <Badge className="bg-red-900/20 text-red-400 border-red-700/30">Suspenso</Badge>;
        default: return <Badge>{status}</Badge>;
    }
};

export const CharterContractsTable: React.FC<CharterContractsTableProps> = ({ data, onView, onEdit, onDelete }) => {
    return (
        <div className="bg-seguranca-black border border-gray-600 rounded-lg overflow-hidden">
            <Table>
                <TableHeader className="bg-seguranca-graphite">
                    <TableRow className="border-gray-600">
                        <TableHead className="text-seguranca-lightgray font-semibold">Identificação do Contrato</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Cliente</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Vigência</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Valor Mensal</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Status</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? (
                        data.map((contract) => (
                            <TableRow key={contract.id} className="border-gray-600 hover:bg-seguranca-graphite/50 transition-colors">
                                <TableCell className="text-seguranca-lightgray font-bold">
                                    {contract.name}
                                </TableCell>
                                <TableCell className="text-seguranca-lightgray">
                                    {contract.clientName || 'Cliente não informado'}
                                </TableCell>
                                <TableCell className="text-seguranca-lightgray">
                                    <div className="flex flex-col text-xs">
                                        <span>Início: {format(new Date(contract.startDate), 'dd/MM/yyyy')}</span>
                                        {contract.endDate && <span>Fim: {format(new Date(contract.endDate), 'dd/MM/yyyy')}</span>}
                                    </div>
                                </TableCell>
                                <TableCell className="text-green-400 font-bold font-mono">
                                    {contract.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                                <TableCell>{getStatusBadge(contract.status)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="outline" size="sm" onClick={() => onView(contract)} className="h-8 w-8 p-0 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white" title="Visualizar Itinerários">
                                            <MapPin size={14} />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => onEdit(contract)} className="h-8 w-8 p-0 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white" title="Editar">
                                            <Edit size={14} />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => onDelete(contract)} className="h-8 w-8 p-0 border-red-500 text-red-500 hover:bg-red-500 hover:text-white" title="Excluir">
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                                Nenhum contrato de fretamento encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};
