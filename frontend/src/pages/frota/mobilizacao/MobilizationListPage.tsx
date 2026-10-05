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
    AlertTriangle,
    FolderCheck,
    FileText,
    CheckCircle2
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
import type { MobilizationType, TransportMobilization } from '@/types/mobilization';
import { MobilizationInspectionModal } from '@/components/frota/MobilizationInspectionModal';
import { MobilizationDossierModal } from '@/components/frota/MobilizationDossierModal';

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

    // Modais Inline para não sair da página
    const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
    const [inspectionType, setInspectionType] = useState<MobilizationType>('GENERAL_INSPECTION');

    const [dossierModalOpen, setDossierModalOpen] = useState(false);
    const [selectedMobilization, setSelectedMobilization] = useState<TransportMobilization | null>(null);

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

    const openInspection = (type: MobilizationType) => {
        setInspectionType(type);
        setInspectionModalOpen(true);
    };

    const openDossier = (mob?: TransportMobilization) => {
        setSelectedMobilization(mob || null);
        setDossierModalOpen(true);
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
                            Gerencie mobilizações, inspeções gerais, checklists RAC 02 e o dossiê completo de colaboradores e veículos.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            onClick={() => openInspection('GENERAL_INSPECTION')}
                            className="bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90 font-bold"
                        >
                            <Plus className="mr-1.5 h-4 w-4" /> Inspeção Geral
                        </Button>
                        <Button
                            onClick={() => openInspection('BUS_RAC02')}
                            className="bg-blue-600 text-white hover:bg-blue-700 font-bold"
                        >
                            <ClipboardCheck className="mr-1.5 h-4 w-4" /> Checklist Ônibus (RAC 02)
                        </Button>
                        <Button
                            onClick={() => openInspection('PRE_USO')}
                            className="bg-purple-600 text-white hover:bg-purple-700 font-bold"
                        >
                            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Checklist Pré-Uso
                        </Button>
                        <Button
                            onClick={() => openDossier(mobilizations[0])}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-500 hover:to-emerald-600 font-bold shadow-lg shadow-emerald-500/20"
                        >
                            <FolderCheck className="mr-1.5 h-4 w-4" /> Kit / Dossiê (PDF Cliente)
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
                                    <p className="text-sm font-medium text-gray-400">Checklists Ônibus (RAC 02)</p>
                                    <p className="text-2xl font-bold text-seguranca-lightgray">
                                        {mobilizations.filter(m => m.type === 'BUS_RAC02').length}
                                    </p>
                                </div>
                                <ClipboardCheck className="h-8 w-8 text-blue-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-seguranca-graphite border-l-4 border-l-emerald-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Dossiês Auditados & Prontos</p>
                                    <p className="text-2xl font-bold text-emerald-400">
                                        {mobilizations.length > 0 ? mobilizations.length : 1}
                                    </p>
                                </div>
                                <FolderCheck className="h-8 w-8 text-emerald-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and List */}
                <Card className="bg-seguranca-graphite border-gray-600">
                    <CardHeader>
                        <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                            <Filter className="h-5 w-5" /> Filtros de Inspeção & Mobilização
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
                                        <SelectItem value="PRE_USO">Checklist Pré-Uso</SelectItem>
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
                                        <th className="p-4 text-center">Ações / Dossiê</th>
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
                                                Nenhum registro de mobilização encontrado.
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
                                                        className={
                                                            m.type === 'BUS_RAC02' 
                                                                ? 'border-blue-500 text-blue-400' 
                                                                : m.type === 'PRE_USO'
                                                                ? 'border-purple-500 text-purple-400'
                                                                : 'border-seguranca-yellow text-seguranca-yellow'
                                                        }
                                                    >
                                                        {m.type === 'BUS_RAC02' ? 'Ônibus (RAC 02)' : m.type === 'PRE_USO' ? 'Pré-Uso' : 'Inspeção Geral'}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 font-bold font-mono text-seguranca-lightgray">
                                                    {m.vehiclePlate || '-'}
                                                </td>
                                                <td className="p-4 text-gray-300">
                                                    {m.driverName || '-'}
                                                </td>
                                                <td className="p-4 text-gray-300">
                                                    {m.clientName || '-'}
                                                </td>
                                                <td className="p-4 text-gray-300">
                                                    {m.workPostName || '-'}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openDossier(m)}
                                                            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold h-8 px-2.5 rounded-lg flex items-center gap-1"
                                                            title="Ver Dossiê Completo de Mobilização"
                                                        >
                                                            <FolderCheck className="h-3.5 w-3.5" /> Dossiê PDF
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(`/frota/mobilizacao/editar/${m.id}`)}
                                                            className="text-seguranca-yellow hover:bg-seguranca-yellow/10 h-8 w-8 p-0 rounded-lg"
                                                            title="Editar registro"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(m.id)}
                                                            className="text-red-500 hover:bg-red-500/10 h-8 w-8 p-0 rounded-lg"
                                                            title="Excluir registro"
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

            {/* Modal de Criar Inspeção / Checklist (Sem sair da página) */}
            <MobilizationInspectionModal
                open={inspectionModalOpen}
                onOpenChange={setInspectionModalOpen}
                type={inspectionType}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['transport-mobilizations'] })}
            />

            {/* Modal do Dossiê Completo de Mobilização (PDF para o Cliente) */}
            <MobilizationDossierModal
                open={dossierModalOpen}
                onOpenChange={setDossierModalOpen}
                mobilization={selectedMobilization}
            />
        </StandardLayout>
    );
};

export default MobilizationListPage;
