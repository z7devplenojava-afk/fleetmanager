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
import { FileText, Download, Trash2, Eye, FileCode } from 'lucide-react';
import { FiscalDocument } from '@/services/fiscalService';
import { format } from 'date-fns';

interface FiscalDocumentsTableProps {
    data: FiscalDocument[];
    onView: (doc: FiscalDocument) => void;
    onDelete: (doc: FiscalDocument) => void;
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'IMPORTED': return <Badge className="bg-blue-900/20 text-blue-400 border-blue-700/30">Importado</Badge>;
        case 'VALIDATED': return <Badge className="bg-green-900/20 text-green-400 border-green-700/30">Validado</Badge>;
        case 'PENDING': return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-700/30">Pendente</Badge>;
        case 'CANCELLED': return <Badge className="bg-red-900/20 text-red-400 border-red-700/30">Cancelado</Badge>;
        default: return <Badge>{status}</Badge>;
    }
};

export const FiscalDocumentsTable: React.FC<FiscalDocumentsTableProps> = ({ data, onView, onDelete }) => {
    return (
        <div className="bg-seguranca-black border border-gray-600 rounded-lg overflow-hidden">
            <Table>
                <TableHeader className="bg-seguranca-graphite">
                    <TableRow className="border-gray-600">
                        <TableHead className="text-seguranca-lightgray font-semibold">Número / Série</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Tipo</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Emissão</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Emitente</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Valor Total</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Status</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? (
                        data.map((doc) => (
                            <TableRow key={doc.id} className="border-gray-600 hover:bg-seguranca-graphite/50 transition-colors">
                                <TableCell className="text-seguranca-lightgray font-medium">
                                    {doc.number} / {doc.series}
                                </TableCell>
                                <TableCell className="text-seguranca-lightgray">{doc.type}</TableCell>
                                <TableCell className="text-seguranca-lightgray">
                                    {doc.emissionDate ? format(new Date(doc.emissionDate), 'dd/MM/yyyy') : '-'}
                                </TableCell>
                                <TableCell className="text-seguranca-lightgray">
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{doc.issuerName}</span>
                                        <span className="text-xs text-gray-500">{doc.issuerTaxId}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-seguranca-yellow font-bold">
                                    {doc.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                                <TableCell>{getStatusBadge(doc.status)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="outline" size="sm" onClick={() => onView(doc)} className="h-8 w-8 p-0 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
                                            <Eye size={14} />
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-white">
                                            <FileCode size={14} />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => onDelete(doc)} className="h-8 w-8 p-0 border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                                Nenhum documento fiscal encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};
