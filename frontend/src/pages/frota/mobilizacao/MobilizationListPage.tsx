'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Truck,
    Plus,
    ClipboardCheck,
    Search,
    Calendar,
    Filter,
    Trash2,
    Eye,
    Edit2,
    Loader2,
    AlertTriangle
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import transportMobilizationService from '@/services/transportMobilizationService';
import { useToast } from '@/hooks/use-toast';
import type { MobilizationType } from '@/types/mobilization';

const MobilizationListPage: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState({
        type: 'all' as MobilizationType | 'all',
        vehicleId: 'all',
        dateFrom: '',
        dateTo: '',
    });

    const { data: mobilizations = [], isLoading } = useQuery({
        queryKey: ['transport-mobilizations', filters],
        queryFn: () => transportMobilizationService.findAll({
            type: filters.type === 'all' ? undefined : filters.type as MobilizationType,
            dateFrom: filters.dateFrom || undefined,
            dateTo: filters.dateTo || undefined,
        }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => transportMobilizationService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transport-mobilizations'] });
            toast({ title: 'Sucesso', description: 'Registro excluído com sucesso.' });
        },
        onError: (err: any) => {
            toast({ title: 'Erro', description: err.message || 'Falha ao excluir registro.', variant: 'destructive' });
        }
    });

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta mobilização?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <StandardLayout title="Mobilização de Transportes">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-seguranca-lightgray flex items-center gap-2">
                            <Truck className="h-8 w-8 text-seguranca-yellow" />
                            Mobilização de Transportes
                        </h1>
                        <p className="text-gray-400">
                            Gerencie as mobilizações, inspeções gerais e checklists RAC 02.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => navigate('/frota/mobilizacao/novo?type=GENERAL_INSPECTION')}
                            className="bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Inspeção Geral
                        </Button>
                        <Button
                            onClick={() => navigate('/frota/mobilizacao/novo?type=BUS_RAC02')}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            <ClipboardCheck className="mr-2 h-4 w-4" /> Checklist Ônibus
                        </Button>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-seguranca-graphite border-l-4 border-l-seguranca-yellow">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Total de Inspeções</p>
                                    <p className="text-2xl font-bold text-seguranca-lightgray">{mobilizations.length}</p>
                                </div>
                                <Truck className="h-8 w-8 text-seguranca-yellow opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-seguranca-graphite border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Checklists Ônibus</p>
                                    <p className="text-2xl font-bold text-seguranca-lightgray">
                                        {mobilizations.filter(m => m.type === 'BUS_RAC02').length}
                                    </p>
                                </div>
                                <ClipboardCheck className="h-8 w-8 text-blue-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-seguranca-graphite border-l-4 border-l-amber-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Pendentes Sinc</p>
                                    <p className="text-2xl font-bold text-seguranca-lightgray">
                                        {mobilizations.filter(m => m.syncStatus === 'PENDING').length}
                                    </p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-amber-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and List */}
                <Card className="bg-seguranca-graphite border-gray-600">
                    <CardHeader>
                        <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                            <Filter className="h-5 w-5" /> Filtros
                        </CardTitle>
                        <div className="flex flex-wrap gap-4 mt-4">
                            <div className="w-full md:w-48">
                                <Select
                                    value={filters.type}
                                    onValueChange={(v) => setFilters(f => ({ ...f, type: v as any }))}
                                >
                                    <SelectTrigger className="bg-seguranca-black border-gray-600">
                                        <SelectValue placeholder="Tipo de Inspeção" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os tipos</SelectItem>
                                        <SelectItem value="GENERAL_INSPECTION">Inspeção Geral</SelectItem>
                                        <SelectItem value="BUS_RAC02">Checklist Ônibus (RAC 02)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full md:w-40">
                                <Input
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                                    className="bg-seguranca-black border-gray-600"
                                />
                            </div>
                            <div className="w-full md:w-40">
                                <Input
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                                    className="bg-seguranca-black border-gray-600"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-seguranca-black/50 text-gray-400 uppercase text-xs">
                                    <tr>
                                        <th className="p-4">Data/Hora</th>
                                        <th className="p-4">Tipo</th>
                                        <th className="p-4">Veículo</th>
                                        <th className="p-4">Motorista</th>
                                        <th className="p-4">Cliente</th>
                                        <th className="p-4">Obra</th>
                                        <th className="p-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-seguranca-yellow" />
                                            </td>
                                        </tr>
                                    ) : mobilizations.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-12 text-center text-gray-500">
                                                Nenhum registro encontrado.
                                            </td>
                                        </tr>
                                    ) : (
                                        mobilizations.map((m) => (
                                            <tr key={m.id} className="hover:bg-seguranca-black/30 transition-colors">
                                                <td className="p-4 text-gray-300">
                                                    {new Date(m.occurredAt).toLocaleString('pt-BR')}
                                                </td>
                                                <td className="p-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={m.type === 'BUS_RAC02' ? 'border-blue-500 text-blue-400' : 'border-seguranca-yellow text-seguranca-yellow'}
                                                    >
                                                        {m.type === 'BUS_RAC02' ? 'Ônibus (RAC 02)' : 'Inspeção Geral'}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 font-medium text-seguranca-lightgray">
                                                    {m.vehiclePlate || '-'}
                                                </td>
                                                <td className="p-4 text-gray-400">
                                                    {m.driverName || '-'}
                                                </td>
                                                <td className="p-4 text-gray-300">
                                                    {m.clientName || '-'}
                                                </td>
                                                <td className="p-4 text-gray-300">
                                                    {m.workPostName || '-'}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(`/frota/mobilizacao/editar/${m.id}`)}
                                                            className="text-seguranca-yellow hover:bg-seguranca-yellow/10"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(m.id)}
                                                            className="text-red-500 hover:bg-red-500/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </StandardLayout>
    );
};

export default MobilizationListPage;
