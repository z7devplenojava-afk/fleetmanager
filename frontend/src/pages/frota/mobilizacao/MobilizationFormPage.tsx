'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Truck,
    ArrowLeft,
    Save,
    Loader2,
    Camera,
    ClipboardList,
    AlertTriangle,
    CheckCircle2,
    ListChecks
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { CameraCapture } from '@/components/frota/CameraCapture';
import DamageMap, { DamagePoint } from '@/components/mobilizacao/DamagePointsMap';
import transportMobilizationService from '@/services/transportMobilizationService';
import fleetService from '@/services/fleetService';
import driverService from '@/services/driverService';
import { useToast } from '@/hooks/use-toast';
import type { MobilizationType, CreateTransportMobilizationDTO } from '@/types/mobilization';

interface ChecklistItem {
    id: string;
    label: string;
    checked: boolean;
    category: string;
}

const GENERAL_CHECKLIST: ChecklistItem[] = [
    { id: 'cnh', label: 'CNH em dia', checked: false, category: 'Docs' },
    { id: 'crlv', label: 'CRLV em dia', checked: false, category: 'Docs' },
    { id: 'oleo', label: 'Nível de óleo', checked: false, category: 'Mecânica' },
    { id: 'agua', label: 'Líquido arrefecimento', checked: false, category: 'Mecânica' },
    { id: 'pneus', label: 'Pneus (calib/desgaste)', checked: false, category: 'Segurança' },
    { id: 'luzes', label: 'Luzes (farol/seta)', checked: false, category: 'Segurança' },
    { id: 'cinto', label: 'Cinto de segurança', checked: false, category: 'Segurança' },
    { id: 'limpeza', label: 'Limpeza geral', checked: false, category: 'Outros' },
];

const BUS_RAC02_CHECKLIST: ChecklistItem[] = [
    ...GENERAL_CHECKLIST,
    { id: 'pneu_diant', label: 'Pneus diant. s/ recape', checked: false, category: 'RAC 02' },
    { id: 'tacografo', label: 'Tacógrafo funcional', checked: false, category: 'RAC 02' },
    { id: 'emergencia', label: 'Saídas de emergência', checked: false, category: 'RAC 02' },
    { id: 'extintor', label: 'Extintor carregado', checked: false, category: 'RAC 02' },
    { id: 'elevador', label: 'Elevador acessibilidade', checked: false, category: 'RAC 02' },
];

const MobilizationFormPage: React.FC = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isEditing = !!id;

    const [type, setType] = useState<MobilizationType>(
        (searchParams.get('type') as MobilizationType) || 'GENERAL_INSPECTION'
    );

    const [formData, setFormData] = useState({
        vehicleId: '',
        driverId: '',
        kmReading: '',
        observations: '',
    });

    const [checklist, setChecklist] = useState<ChecklistItem[]>(
        type === 'BUS_RAC02' ? [...BUS_RAC02_CHECKLIST] : [...GENERAL_CHECKLIST]
    );

    const [damagePoints, setDamagePoints] = useState<DamagePoint[]>([]);
    const [odometerPhoto, setOdometerPhoto] = useState<File | null>(null);
    const [generalPhotos, setGeneralPhotos] = useState<File[]>([]);

    // Fetch initial data if editing
    const { data: existingMobilization, isLoading: isLoadingExisting } = useQuery({
        queryKey: ['transport-mobilization', id],
        queryFn: () => transportMobilizationService.findById(id!),
        enabled: isEditing,
    });

    useEffect(() => {
        if (existingMobilization) {
            setType(existingMobilization.type);
            setFormData({
                vehicleId: existingMobilization.vehicleId,
                driverId: existingMobilization.driverId,
                kmReading: existingMobilization.kmReading.toString(),
                observations: existingMobilization.observations || '',
            });

            try {
                const items = JSON.parse(existingMobilization.checklistData);
                setChecklist(items);
            } catch (e) {
                console.error("Error parsing checklist data", e);
            }

            try {
                const damages = JSON.parse(existingMobilization.damageData || '[]');
                setDamagePoints(damages);
            } catch (e) {
                console.error("Error parsing damage data", e);
            }
        }
    }, [existingMobilization]);

    const { data: vehicles = [] } = useQuery({
        queryKey: ['vehicles'],
        queryFn: fleetService.getVehicles,
    });

    const { data: drivers = [] } = useQuery({
        queryKey: ['drivers'],
        queryFn: driverService.getDrivers,
    });

    const mutation = useMutation({
        mutationFn: async (payload: { data: CreateTransportMobilizationDTO; odometer?: File; photos: File[] }) => {
            let result;
            if (isEditing) {
                result = await transportMobilizationService.update(id!, payload.data);
            } else {
                result = await transportMobilizationService.create(payload.data);
            }

            if (payload.odometer) {
                await transportMobilizationService.uploadOdometerPhoto(result.id, payload.odometer);
            }

            if (payload.photos.length > 0) {
                await transportMobilizationService.uploadGeneralPhotos(result.id, payload.photos);
            }

            return result;
        },
        onSuccess: () => {
            toast({ title: 'Sucesso', description: `Inspeção ${isEditing ? 'atualizada' : 'registrada'} com sucesso.` });
            queryClient.invalidateQueries({ queryKey: ['transport-mobilizations'] });
            navigate('/frota/mobilizacao');
        },
        onError: (err: any) => {
            toast({ title: 'Erro', description: err.message || 'Falha ao salvar inspeção.', variant: 'destructive' });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.vehicleId || !formData.kmReading) {
            toast({ title: 'Campos obrigatórios', description: 'Preencha veículo e KM.', variant: 'destructive' });
            return;
        }

        const payload: CreateTransportMobilizationDTO = {
            ...formData,
            type,
            kmReading: parseInt(formData.kmReading),
            checklistData: JSON.stringify(checklist),
            damageData: JSON.stringify(damagePoints),
            partsRequestData: '[]', // Placeholder for now
        };

        mutation.mutate({ data: payload, odometer: odometerPhoto || undefined, photos: generalPhotos });
    };

    const toggleChecklistItem = (id: string) => {
        setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
    };

    if (isEditing && isLoadingExisting) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-seguranca-yellow" />
            </div>
        );
    }

    return (
        <StandardLayout title={isEditing ? 'Editar Inspeção' : 'Nova Inspeção'}>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate('/frota/mobilizacao')} className="text-gray-400">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <h1 className="text-2xl font-bold text-seguranca-lightgray">
                        {type === 'BUS_RAC02' ? 'Checklist Ônibus (RAC 02)' : 'Inspeção Geral de Veículo'}
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                    {/* 1. Identification Section */}
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Truck className="h-5 w-5 text-seguranca-yellow" /> Identificação
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Veículo *</Label>
                                    <Select
                                        value={formData.vehicleId}
                                        onValueChange={(v) => setFormData(f => ({ ...f, vehicleId: v }))}
                                    >
                                        <SelectTrigger className="bg-seguranca-black border-gray-600">
                                            <SelectValue placeholder="Selecione o veículo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vehicles.map(v => (
                                                <SelectItem key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Motorista</Label>
                                    <Select
                                        value={formData.driverId}
                                        onValueChange={(v) => setFormData(f => ({ ...f, driverId: v }))}
                                    >
                                        <SelectTrigger className="bg-seguranca-black border-gray-600">
                                            <SelectValue placeholder="Selecione o motorista" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {drivers.map(d => (
                                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Odômetro Atual (KM) *</Label>
                                    <Input
                                        type="number"
                                        value={formData.kmReading}
                                        onChange={(e) => setFormData(f => ({ ...f, kmReading: e.target.value }))}
                                        className="bg-seguranca-black border-gray-600 font-mono"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Foto do Odômetro</Label>
                                    <div className="flex items-center gap-2">
                                        <CameraCapture
                                            onPhotosChange={(photos) => setOdometerPhoto(photos[0] || null)}
                                            maxPhotos={1}
                                            label="Capturar KM"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Checklist Section */}
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ListChecks className="h-5 w-5 text-seguranca-yellow" /> Itens de Verificação
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {Object.entries(
                                    checklist.reduce((acc, item) => {
                                        if (!acc[item.category]) acc[item.category] = [];
                                        acc[item.category].push(item);
                                        return acc;
                                    }, {} as Record<string, ChecklistItem[]>)
                                ).map(([category, items]) => (
                                    <div key={category} className="space-y-3">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-l-2 border-seguranca-yellow pl-2">
                                            {category}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                            {items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className={`flex items-center space-x-3 p-2 rounded-lg transition-all ${item.checked ? 'bg-seguranca-yellow/5 border border-seguranca-yellow/20' : 'bg-seguranca-black/30 border border-transparent'
                                                        }`}
                                                >
                                                    <Checkbox
                                                        id={item.id}
                                                        checked={item.checked}
                                                        onCheckedChange={() => toggleChecklistItem(item.id)}
                                                        className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:text-black"
                                                    />
                                                    <Label
                                                        htmlFor={item.id}
                                                        className={`flex-1 cursor-pointer text-sm font-medium ${item.checked ? 'text-seguranca-lightgray' : 'text-gray-400'}`}
                                                    >
                                                        {item.label}
                                                    </Label>
                                                    {item.checked && <CheckCircle2 className="h-3.5 w-3.5 text-seguranca-yellow" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Damage Map Section */}
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-seguranca-yellow" /> Mapa de Avarias
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DamageMap
                                points={damagePoints}
                                onChange={setDamagePoints}
                            />
                        </CardContent>
                    </Card>

                    {/* 4. Photos and Observations */}
                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Camera className="h-5 w-5 text-seguranca-yellow" /> Fotos e Observações
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Fotos Gerais do Veículo</Label>
                                <div className="flex flex-col gap-2">
                                    <CameraCapture
                                        onPhotosChange={(photos) => setGeneralPhotos(photos)}
                                        label="Anexar Fotos (Até 10)"
                                        maxPhotos={10}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Observações Adicionais</Label>
                                <Textarea
                                    value={formData.observations}
                                    onChange={(e) => setFormData(f => ({ ...f, observations: e.target.value }))}
                                    placeholder="Relate aqui qualquer observação relevante..."
                                    className="bg-seguranca-black border-gray-600 min-h-[100px]"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-seguranca-black/80 backdrop-blur-md border-t border-gray-800 flex justify-center gap-4 md:relative md:bg-transparent md:border-0 md:p-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/frota/mobilizacao')}
                            className="w-full md:w-auto border-gray-600"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="w-full md:w-auto bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90"
                        >
                            {mutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {isEditing ? 'Atualizar Inspeção' : 'Salvar Inspeção'}
                        </Button>
                    </div>
                </form>
            </div>
        </StandardLayout>
    );
};

export default MobilizationFormPage;
