'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    DoorOpen,
    Plus,
    LogIn,
    LogOut,
    ClipboardList,
    AlertTriangle,
    Loader2,
    Trash2,
    Gauge,
    ImageIcon,
    QrCode
} from 'lucide-react';
import { CameraCapture } from '@/components/frota/CameraCapture';
import { QRCodeScanner } from '@/components/frota/QRCodeScanner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import vehicleGateChecklistService from '@/services/vehicleGateChecklistService';
import { getApiUrl } from '@/config/environment';
import fleetService from '@/services/fleetService';
import driverService from '@/services/driverService';
import type { ChecklistType, ChecklistItem } from '@/types/portaria';
import { useToast } from '@/hooks/use-toast';

import accessRecordService, { AccessRecord } from '@/services/accessRecordService';

const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
    { id: 'doc-1', title: 'CNH', category: 'documentacao', required: true, checked: false },
    { id: 'doc-2', title: 'CRLV', category: 'documentacao', required: true, checked: false },
    { id: 'doc-3', title: 'Documentação do veículo', category: 'documentacao', required: true, checked: false },
    { id: 'pneus-1', title: 'Calibragem', category: 'pneus', required: true, checked: false },
    { id: 'pneus-2', title: 'Desgaste', category: 'pneus', required: true, checked: false },
    { id: 'pneus-3', title: 'Estepe', category: 'pneus', required: false, checked: false },
    { id: 'fluidos-1', title: 'Óleo', category: 'fluidos', required: true, checked: false },
    { id: 'fluidos-2', title: 'Água', category: 'fluidos', required: true, checked: false },
    { id: 'fluidos-3', title: 'Combustível', category: 'fluidos', required: true, checked: false },
    { id: 'freios-1', title: 'Funcionamento dos freios', category: 'freios', required: true, checked: false },
    { id: 'ilum-1', title: 'Faróis', category: 'iluminacao', required: true, checked: false },
    { id: 'ilum-2', title: 'Lanternas e setas', category: 'iluminacao', required: true, checked: false },
    { id: 'limpeza-1', title: 'Interior', category: 'limpeza', required: false, checked: false },
    { id: 'limpeza-2', title: 'Exterior', category: 'limpeza', required: false, checked: false },
    { id: 'outros-1', title: 'Cinto de segurança', category: 'outros', required: true, checked: false },
    { id: 'outros-2', title: 'Espelhos', category: 'outros', required: true, checked: false },
];

const CATEGORY_LABELS: Record<string, string> = {
    documentacao: 'Documentação',
    pneus: 'Pneus',
    fluidos: 'Óleo/Fluidos',
    freios: 'Freios',
    iluminacao: 'Iluminação',
    limpeza: 'Limpeza',
    outros: 'Outros',
};

const GestaoPortaria: React.FC = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'exit' | 'arrival' | 'list' | 'visitors' | 'staff'>('exit');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formType, setFormType] = useState<ChecklistType | 'VISITOR' | 'EMPLOYEE'>('EXIT');
    const [formData, setFormData] = useState({
        vehicleId: '',
        driverId: '',
        kmReading: '',
        driverProblemReport: '',
        observations: '',
        name: '',
        documentNumber: '',
        purposeOfVisit: '',
        authorizedBy: '',
        vehiclePlate: '',
    });
    const [odometerPhotoFile, setOdometerPhotoFile] = useState<File | null>(null);
    const [odometerPhotoDescription, setOdometerPhotoDescription] = useState('');
    const [vehiclePhotos, setVehiclePhotos] = useState<File[]>([]);
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(() =>
        DEFAULT_CHECKLIST_ITEMS.map((i) => ({ ...i }))
    );
    const [filters, setFilters] = useState({
        vehicleId: 'all',
        type: 'all' as ChecklistType | 'all',
        dateFrom: '',
        dateTo: '',
    });
    const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

    const { data: vehicles = [] } = useQuery({
        queryKey: ['vehicles'],
        queryFn: fleetService.getVehicles,
    });

    const { data: drivers = [] } = useQuery({
        queryKey: ['drivers'],
        queryFn: driverService.getDrivers,
    });

    const { data: checklists = [], isLoading } = useQuery({
        queryKey: ['vehicle-gate-checklists', filters.vehicleId, filters.type, filters.dateFrom, filters.dateTo],
        queryFn: () =>
            vehicleGateChecklistService.findAll({
                vehicleId: filters.vehicleId && filters.vehicleId !== 'all' ? filters.vehicleId : undefined,
                type: filters.type && filters.type !== 'all' ? filters.type : undefined,
                dateFrom: filters.dateFrom || undefined,
                dateTo: filters.dateTo || undefined,
            }),
    });

    const { data: accessRecords = [], isLoading: isLoadingAccess } = useQuery({
        queryKey: ['access-records'],
        queryFn: () => accessRecordService.findAll(),
        enabled: activeTab === 'visitors' || activeTab === 'staff'
    });

    const createMutation = useMutation({
        mutationFn: async (payload: {
            data: Parameters<typeof vehicleGateChecklistService.create>[0];
            odometerFile?: File;
            odometerDesc?: string;
            vehiclePhotos?: File[];
        }) => {
            const created = await vehicleGateChecklistService.create(payload.data);
            if (payload.odometerFile) {
                await vehicleGateChecklistService.uploadOdometerPhoto(
                    created.id,
                    payload.odometerFile,
                    payload.odometerDesc
                );
            }
            if (payload.vehiclePhotos && payload.vehiclePhotos.length > 0) {
                await vehicleGateChecklistService.uploadVehiclePhotos(created.id, payload.vehiclePhotos);
            }
            return created;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle-gate-checklists'] });
            toast({ title: 'Sucesso', description: 'Checklist registrado com sucesso.' });
            handleCloseForm();
        },
        onError: (err: Error) => {
            toast({ title: 'Erro', description: err.message || 'Falha ao registrar checklist.', variant: 'destructive' });
        },
    });

    const accessMutation = useMutation({
        mutationFn: (data: Partial<AccessRecord>) => accessRecordService.registerEntry(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['access-records'] });
            toast({ title: 'Sucesso', description: 'Acesso registrado com sucesso.' });
            handleCloseForm();
        },
        onError: (err: Error) => {
            toast({ title: 'Erro', description: err.message || 'Falha ao registrar acesso.', variant: 'destructive' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => vehicleGateChecklistService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicle-gate-checklists'] });
            toast({ title: 'Sucesso', description: 'Registro excluído.' });
        },
        onError: (err: Error) => {
            toast({ title: 'Erro', description: err.message || 'Falha ao excluir.', variant: 'destructive' });
        },
    });

    const exitAccessMutation = useMutation({
        mutationFn: (id: string) => accessRecordService.registerExit(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['access-records'] });
            toast({ title: 'Sucesso', description: 'Saída registrada com sucesso.' });
        },
        onError: (err: Error) => {
            toast({ title: 'Erro', description: err.message || 'Falha ao registrar saída.', variant: 'destructive' });
        }
    });

    const handleOpenForm = (type: ChecklistType | 'VISITOR' | 'EMPLOYEE') => {
        setFormType(type);
        setFormData({
            vehicleId: '',
            driverId: '',
            kmReading: '',
            driverProblemReport: '',
            observations: '',
            name: '',
            documentNumber: '',
            purposeOfVisit: '',
            authorizedBy: '',
            vehiclePlate: '',
        });
        setOdometerPhotoFile(null);
        setOdometerPhotoDescription('');
        setVehiclePhotos([]);
        setChecklistItems(DEFAULT_CHECKLIST_ITEMS.map((i) => ({ ...i, checked: false })));
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setIsQRScannerOpen(false);
    };

    const handleItemCheck = (id: string, checked: boolean) => {
        setChecklistItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked } : i)));
    };

    const checklistDataJson = useMemo(() => {
        return JSON.stringify(
            checklistItems.map((i) => ({ id: i.id, title: i.title, category: i.category, checked: i.checked }))
        );
    }, [checklistItems]);

    const handleSubmit = () => {
        if (formType === 'VISITOR' || formType === 'EMPLOYEE') {
            if (!formData.name) {
                toast({ title: 'Campos obrigatórios', description: 'O nome é obrigatório.', variant: 'destructive' });
                return;
            }
            accessMutation.mutate({
                type: formType,
                name: formData.name,
                documentNumber: formData.documentNumber || undefined,
                purposeOfVisit: formData.purposeOfVisit || undefined,
                authorizedBy: formData.authorizedBy || undefined,
                vehiclePlate: formData.vehiclePlate || undefined,
                observations: formData.observations || undefined,
            });
            return;
        }

        const km = Number.parseInt(formData.kmReading, 10);
        if (!formData.vehicleId || Number.isNaN(km) || km < 0) {
            toast({ title: 'Campos obrigatórios', description: 'Preencha veículo e KM.', variant: 'destructive' });
            return;
        }
        createMutation.mutate({
            data: {
                vehicleId: formData.vehicleId,
                driverId: formData.driverId || undefined,
                type: formType as ChecklistType,
                kmReading: km,
                checklistData: checklistDataJson,
                driverProblemReport: formData.driverProblemReport || undefined,
                observations: formData.observations || undefined,
            },
            odometerFile: odometerPhotoFile || undefined,
            odometerDesc: odometerPhotoDescription || undefined,
            vehiclePhotos: vehiclePhotos.length > 0 ? vehiclePhotos : undefined,
        });
    };

    const filteredChecklists = checklists;
    const stats = {
        todayExit: checklists.filter(
            (c) => c.type === 'EXIT' && new Date(c.occurredAt).toDateString() === new Date().toDateString()
        ).length,
        todayArrival: checklists.filter(
            (c) => c.type === 'ARRIVAL' && new Date(c.occurredAt).toDateString() === new Date().toDateString()
        ).length,
        withProblems: checklists.filter((c) => c.driverProblemReport && c.driverProblemReport.trim().length > 0)
            .length,
    };

    const groupedChecklist = useMemo(() => {
        const groups: Record<string, ChecklistItem[]> = {};
        checklistItems.forEach((item) => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        });
        return groups;
    }, [checklistItems]);

    return (
        <StandardLayout title="Gestão de Portaria">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-seguranca-lightgray flex items-center gap-2">
                            <DoorOpen className="h-8 w-8 text-seguranca-yellow" />
                            Gestão de Portaria
                        </h1>
                        <p className="text-gray-400">
                            Checklist de saída e chegada de veículos, KM e relatos de problemas do motorista.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-seguranca-graphite border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Saídas Hoje</p>
                                    <p className="text-2xl font-bold text-seguranca-lightgray">{stats.todayExit}</p>
                                </div>
                                <LogOut className="h-8 w-8 text-blue-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-seguranca-graphite border-l-4 border-l-green-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Chegadas Hoje</p>
                                    <p className="text-2xl font-bold text-seguranca-lightgray">{stats.todayArrival}</p>
                                </div>
                                <LogIn className="h-8 w-8 text-green-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-seguranca-graphite border-l-4 border-l-amber-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Com Problemas Reportados</p>
                                    <p className="text-2xl font-bold text-seguranca-lightgray">{stats.withProblems}</p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-amber-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <Button
                        variant={activeTab === 'exit' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('exit')}
                        size="sm"
                        className={activeTab === 'exit' ? 'bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90' : ''}
                    >
                        <LogOut className="mr-2 h-4 w-4" /> Checklist Saída
                    </Button>
                    <Button
                        variant={activeTab === 'arrival' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('arrival')}
                        size="sm"
                        className={activeTab === 'arrival' ? 'bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90' : ''}
                    >
                        <LogIn className="mr-2 h-4 w-4" /> Checklist Chegada
                    </Button>
                    <Button
                        variant={activeTab === 'visitors' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('visitors')}
                        size="sm"
                        className={activeTab === 'visitors' ? 'bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90' : ''}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Acesso Visitante
                    </Button>
                    <Button
                        variant={activeTab === 'staff' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('staff')}
                        size="sm"
                        className={activeTab === 'staff' ? 'bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90' : ''}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Acesso Funcionário
                    </Button>
                    <Button
                        variant={activeTab === 'list' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('list')}
                        size="sm"
                    >
                        <ClipboardList className="mr-2 h-4 w-4" /> Lista de Registros
                    </Button>
                </div>

                {activeTab === 'exit' && (
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardContent className="pt-6">
                            <p className="text-gray-400 mb-4">
                                Registre o checklist de saída do veículo. Selecione o veículo, motorista e preencha o KM e a conferência.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleOpenForm('EXIT')}
                                    className="bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90"
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Registrar Saída
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'arrival' && (
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardContent className="pt-6">
                            <p className="text-gray-400 mb-4">
                                Registre o checklist de chegada. O KM informado será atualizado no veículo. Inclua os relatos de problemas do motorista.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleOpenForm('ARRIVAL')}
                                    className="bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90"
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Registrar Chegada
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'visitors' && (
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <h3 className="text-xl font-bold text-seguranca-lightgray">Controle de Visitantes</h3>
                                    <p className="text-gray-400">Registre a entrada de visitantes, prestadores de serviços e entregas.</p>
                                    <Button onClick={() => handleOpenForm('VISITOR')} className="bg-seguranca-yellow text-black">
                                        <Plus className="mr-2 h-4 w-4" /> Registrar Entrada Visitante
                                    </Button>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Visitantes no Pátio</h4>
                                    <div className="bg-seguranca-black/50 rounded-lg p-4 h-48 overflow-y-auto">
                                        {accessRecords.filter(r => r.type === 'VISITOR' && r.status === 'IN').length === 0 ? (
                                            <p className="text-gray-600 text-center py-8">Nenhum visitante no momento.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {accessRecords.filter(r => r.type === 'VISITOR' && r.status === 'IN').map(r => (
                                                    <div key={r.id} className="flex items-center justify-between p-2 bg-seguranca-graphite rounded border border-gray-700">
                                                        <div>
                                                            <p className="text-sm font-medium text-seguranca-lightgray">{r.name}</p>
                                                            <p className="text-xs text-gray-500">{r.purposeOfVisit}</p>
                                                        </div>
                                                        <Button size="sm" variant="ghost" className="text-red-500 h-8" onClick={() => exitAccessMutation.mutate(r.id)}>
                                                            <LogOut className="h-4 w-4 mr-1" /> Saída
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'staff' && (
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <h3 className="text-xl font-bold text-seguranca-lightgray">Controle de Funcionários</h3>
                                    <p className="text-gray-400">Acesso de funcionários fora de horário, administrativos ou sem crachá.</p>
                                    <Button onClick={() => handleOpenForm('EMPLOYEE')} className="bg-seguranca-yellow text-black">
                                        <Plus className="mr-2 h-4 w-4" /> Registrar Entrada Funcionário
                                    </Button>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pessoal no Pátio</h4>
                                    <div className="bg-seguranca-black/50 rounded-lg p-4 h-48 overflow-y-auto">
                                        {accessRecords.filter(r => r.type === 'EMPLOYEE' && r.status === 'IN').length === 0 ? (
                                            <p className="text-gray-600 text-center py-8">Nenhum registro no momento.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {accessRecords.filter(r => r.type === 'EMPLOYEE' && r.status === 'IN').map(r => (
                                                    <div key={r.id} className="flex items-center justify-between p-2 bg-seguranca-graphite rounded border border-gray-700">
                                                        <div>
                                                            <p className="text-sm font-medium text-seguranca-lightgray">{r.name}</p>
                                                            <p className="text-xs text-gray-500">{r.documentNumber}</p>
                                                        </div>
                                                        <Button size="sm" variant="ghost" className="text-red-500 h-8" onClick={() => exitAccessMutation.mutate(r.id)}>
                                                            <LogOut className="h-4 w-4 mr-1" /> Saída
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'list' && (
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader>
                            <CardTitle className="text-seguranca-lightgray">Registros de Portaria</CardTitle>
                            <div className="flex flex-wrap gap-2 mt-4">
                                <Select value={filters.vehicleId} onValueChange={(v) => setFilters((f) => ({ ...f, vehicleId: v }))}>
                                    <SelectTrigger className="w-[180px] bg-seguranca-black border-gray-600">
                                        <SelectValue placeholder="Veículo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {vehicles.map((v) => (
                                            <SelectItem key={v.id} value={v.id}>
                                                {v.plate} - {v.brand} {v.model}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={filters.type} onValueChange={(v) => setFilters((f) => ({ ...f, type: v as ChecklistType | 'all' }))}>
                                    <SelectTrigger className="w-[140px] bg-seguranca-black border-gray-600">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="EXIT">Saída</SelectItem>
                                        <SelectItem value="ARRIVAL">Chegada</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="date"
                                    placeholder="Data inicial"
                                    value={filters.dateFrom}
                                    onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                                    className="w-[140px] bg-seguranca-black border-gray-600"
                                />
                                <Input
                                    type="date"
                                    placeholder="Data final"
                                    value={filters.dateTo}
                                    onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                                    className="w-[140px] bg-seguranca-black border-gray-600"
                                />
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
                                            <th className="p-4">Odômetro (KM)</th>
                                            <th className="p-4">Foto Odômetro</th>
                                            <th className="p-4">Fotos Veículo</th>
                                            <th className="p-4">Problemas</th>
                                            <th className="p-4 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={10} className="p-8 text-center">
                                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-seguranca-yellow" />
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredChecklists.map((c) => (
                                                <tr key={c.id} className="hover:bg-seguranca-black/30 transition-colors">
                                                    <td className="p-4 text-gray-300">
                                                        {new Date(c.occurredAt).toLocaleString('pt-BR')}
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                c.type === 'EXIT'
                                                                    ? 'border-blue-500 text-blue-400'
                                                                    : 'border-green-500 text-green-400'
                                                            }
                                                        >
                                                            {c.type === 'EXIT' ? 'Saída' : 'Chegada'}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 font-medium text-seguranca-lightgray">
                                                        {c.vehiclePlate || '-'}
                                                    </td>
                                                    <td className="p-4 text-gray-400">{c.driverName || '-'}</td>
                                                    <td className="p-4 font-mono font-semibold">{c.kmReading} km</td>
                                                    <td className="p-4">
                                                        {c.odometerPhotoUrl ? (
                                                            <a
                                                                href={`${getApiUrl().replace(/\/api\/?$/, '')}${c.odometerPhotoUrl}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-seguranca-yellow hover:underline"
                                                            >
                                                                <ImageIcon className="h-4 w-4" />
                                                                Ver foto
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-500">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        {c.vehiclePhotos ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {c.vehiclePhotos.split(',').filter(Boolean).map((url) => (
                                                                    <a
                                                                        key={url.trim()}
                                                                        href={`${getApiUrl().replace(/\/api\/?$/, '')}${url.trim()}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 text-seguranca-yellow hover:underline text-xs"
                                                                    >
                                                                        <ImageIcon className="h-3 w-3" />
                                                                        Ver
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 max-w-[200px]">
                                                        {c.driverProblemReport ? (
                                                            <span
                                                                className="text-amber-400 truncate block"
                                                                title={c.driverProblemReport}
                                                            >
                                                                {c.driverProblemReport.length > 50
                                                                    ? `${c.driverProblemReport.slice(0, 50)}...`
                                                                    : c.driverProblemReport}
                                                            </span>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                            onClick={() => {
                                                                if (globalThis.confirm('Excluir este registro?')) {
                                                                    deleteMutation.mutate(c.id);
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        {!isLoading && filteredChecklists.length === 0 && (
                                            <tr>
                                                <td colSpan={10} className="p-12 text-center text-gray-400">
                                                    Nenhum registro encontrado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleCloseForm()}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
                    <DialogHeader>
                        <DialogTitle className="text-seguranca-lightgray">
                            {formType === 'EXIT' ? 'Checklist Saída' : 'Checklist Chegada'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulário para registrar checklist de {formType === 'EXIT' ? 'saída' : 'chegada'} do veículo
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {(formType === 'VISITOR' || formType === 'EMPLOYEE') ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nome Completo *</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                                            placeholder="Nome do visitante/funcionário"
                                            className="bg-seguranca-black border-gray-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Documento / CPF</Label>
                                        <Input
                                            value={formData.documentNumber}
                                            onChange={(e) => setFormData(f => ({ ...f, documentNumber: e.target.value }))}
                                            placeholder="Descreva o documento"
                                            className="bg-seguranca-black border-gray-600"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{formType === 'VISITOR' ? 'Empresa / Motivo' : 'Setor / Unidade'}</Label>
                                        <Input
                                            value={formData.purposeOfVisit}
                                            onChange={(e) => setFormData(f => ({ ...f, purposeOfVisit: e.target.value }))}
                                            placeholder="Ex: Entregas, Manutenção, RH"
                                            className="bg-seguranca-black border-gray-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Placa do Veículo (se houver)</Label>
                                        <Input
                                            value={formData.vehiclePlate}
                                            onChange={(e) => setFormData(f => ({ ...f, vehiclePlate: e.target.value }))}
                                            placeholder="Ex: ABC-1234"
                                            className="bg-seguranca-black border-gray-600"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Autorizado Por</Label>
                                    <Input
                                        value={formData.authorizedBy}
                                        onChange={(e) => setFormData(f => ({ ...f, authorizedBy: e.target.value }))}
                                        placeholder="Nome do responsável"
                                        className="bg-seguranca-black border-gray-600"
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-medium text-seguranca-lightgray">Identificação</span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsQRScannerOpen(true)}
                                        className="border-gray-600"
                                    >
                                        <QrCode className="h-4 w-4 mr-2" />
                                        Ler QR Code
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Veículo *</Label>
                                        <Select
                                            value={formData.vehicleId}
                                            onValueChange={(v) => setFormData((f) => ({ ...f, vehicleId: v }))}
                                            required
                                        >
                                            <SelectTrigger className="bg-seguranca-black border-gray-600">
                                                <SelectValue placeholder="Selecione o veículo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {vehicles.map((v) => (
                                                    <SelectItem key={v.id} value={v.id}>
                                                        {v.plate} - {v.brand} {v.model} (KM: {v.currentMileage})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Motorista</Label>
                                        <Select
                                            value={formData.driverId || 'none'}
                                            onValueChange={(v) => setFormData((f) => ({ ...f, driverId: v === 'none' ? '' : v }))}
                                        >
                                            <SelectTrigger className="bg-seguranca-black border-gray-600">
                                                <SelectValue placeholder="Selecione o motorista" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhum</SelectItem>
                                                {drivers.map((d) => (
                                                    <SelectItem key={d.id} value={d.id}>
                                                        {d.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <QRCodeScanner
                                    open={isQRScannerOpen}
                                    onOpenChange={setIsQRScannerOpen}
                                    onScan={(result) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            ...(result.vehicleId && { vehicleId: result.vehicleId }),
                                            ...(result.driverId && { driverId: result.driverId }),
                                        }));
                                        if (result.vehicleId || result.driverId) {
                                            let desc = 'Motorista preenchido.';
                                            if (result.vehicleId && result.driverId) desc = 'Veículo e motorista preenchidos.';
                                            else if (result.vehicleId) desc = 'Veículo preenchido.';
                                            toast({ title: 'QR Code lido', description: desc });
                                        }
                                    }}
                                />
                                <div className="space-y-3 p-4 rounded-lg border border-gray-700 bg-seguranca-black/50">
                                    <div className="flex items-center gap-2 text-seguranca-yellow font-medium">
                                        <Gauge className="h-5 w-5" />
                                        Odômetro
                                    </div>
                                    <div>
                                        <Label>Leitura do odômetro (KM) *</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={formData.kmReading}
                                            onChange={(e) => setFormData((f) => ({ ...f, kmReading: e.target.value }))}
                                            placeholder="Ex: 45000"
                                            className="bg-seguranca-black border-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <CameraCapture
                                            label="Foto do odômetro (opcional)"
                                            onPhotosChange={(photos) => setOdometerPhotoFile(photos[0] ?? null)}
                                            maxPhotos={1}
                                            disabled={createMutation.isPending}
                                        />
                                        <Input
                                            type="text"
                                            value={odometerPhotoDescription}
                                            onChange={(e) => setOdometerPhotoDescription(e.target.value)}
                                            placeholder="Descrição da foto (opcional)"
                                            className="bg-seguranca-black border-gray-600 mt-2 text-sm"
                                        />
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-700">
                                        <CameraCapture
                                            label="Fotos do veículo (câmera)"
                                            onPhotosChange={setVehiclePhotos}
                                            maxPhotos={10}
                                            disabled={createMutation.isPending}
                                        />
                                    </div>
                                </div>
                                {formType === 'ARRIVAL' && (
                                    <div>
                                        <Label>Relatos de problemas do motorista</Label>
                                        <Textarea
                                            value={formData.driverProblemReport}
                                            onChange={(e) => setFormData((f) => ({ ...f, driverProblemReport: e.target.value }))}
                                            placeholder="Descreva problemas relatados pelo motorista..."
                                            rows={3}
                                            className="bg-seguranca-black border-gray-600"
                                        />
                                    </div>
                                )}
                            </>
                        )}
                        <div>
                            <Label>Observações</Label>
                            <Textarea
                                value={formData.observations}
                                onChange={(e) => setFormData((f) => ({ ...f, observations: e.target.value }))}
                                placeholder="Observações gerais..."
                                rows={2}
                                className="bg-seguranca-black border-gray-600"
                            />
                        </div>
                        {formType !== 'VISITOR' && formType !== 'EMPLOYEE' && (
                            <div>
                                <Label className="mb-2 block">Checklist de conferência</Label>
                                <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2">
                                    {Object.entries(groupedChecklist).map(([cat, items]) => (
                                        <div key={cat} className="border border-gray-700 rounded p-3">
                                            <p className="text-sm font-medium text-seguranca-yellow mb-2">
                                                {CATEGORY_LABELS[cat] || cat}
                                            </p>
                                            <div className="space-y-2">
                                                {items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Checkbox
                                                            id={item.id}
                                                            checked={item.checked}
                                                            onCheckedChange={(checked) =>
                                                                handleItemCheck(item.id, !!checked)
                                                            }
                                                        />
                                                        <label
                                                            htmlFor={item.id}
                                                            className="text-sm text-gray-300 cursor-pointer"
                                                        >
                                                            {item.title}
                                                            {item.required && (
                                                                <span className="text-red-500 ml-1">*</span>
                                                            )}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseForm} className="border-gray-600">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={createMutation.isPending}
                            className="bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90"
                        >
                            {createMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Registrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </StandardLayout>
    );
};

export default GestaoPortaria;
